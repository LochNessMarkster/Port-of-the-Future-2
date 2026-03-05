
import Constants from "expo-constants";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const BEARER_TOKEN_KEY = "portofthefuture_bearer_token";

export const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || "";

// ─── Airtable Configuration ───────────────────────────────────────────────────

// Primary Base ID (used for most tables)
const PRIMARY_BASE_ID = "appkKjciinTlnsbkd";
// Primary API Key
const PRIMARY_API_KEY = "patCsZvxAEJmBpJGu.8c98dc7c1d088a1b0ef2ef73a02e8d4b7cd4a8ce9a5f36d79ab0265c676c6f8c";

// Announcements use a different base
const ANNOUNCEMENTS_BASE_ID = "appcNhRl5vEqug2D1";
const ANNOUNCEMENTS_API_KEY = "patZyEbyPVImqOPC9.3f079360e07787946058e636a2e8c6692588f57faa491dc915770953d4c57689";

// Table configuration with base IDs, table IDs, API keys, and optional cache URLs
interface TableConfig {
  baseId: string;
  tableId: string;
  apiKey: string;
  cacheUrl?: string;
}

const AIRTABLE_CONFIG: Record<string, TableConfig> = {
  agenda: {
    baseId: PRIMARY_BASE_ID,
    tableId: "tblhUTXC3XHVGssO4",
    apiKey: PRIMARY_API_KEY,
  },
  sessions: {
    baseId: PRIMARY_BASE_ID,
    tableId: "tblhUTXC3XHVGssO4",
    apiKey: PRIMARY_API_KEY,
  },
  exhibitors: {
    baseId: PRIMARY_BASE_ID,
    tableId: "tblzex4bjwEZh1021",
    apiKey: PRIMARY_API_KEY,
    cacheUrl: "https://airtablecache.portofthefutureconference.com/v0/appkKjciinTlnsbkd/tblzex4bjwEZh1021",
  },
  ports: {
    baseId: PRIMARY_BASE_ID,
    tableId: "tblrXosiVXKhJHYLu",
    apiKey: PRIMARY_API_KEY,
  },
  speakers: {
    baseId: PRIMARY_BASE_ID,
    tableId: "tblNp1JZk4ARZZZlT",
    apiKey: PRIMARY_API_KEY,
    cacheUrl: "https://airtablecache.portofthefutureconference.com/v0/appkKjciinTlnsbkd/tblNp1JZk4ARZZZlT",
  },
  sponsors: {
    baseId: PRIMARY_BASE_ID,
    tableId: "tblgWrwRvpdcVG8sB",
    apiKey: PRIMARY_API_KEY,
  },
  partners: {
    baseId: PRIMARY_BASE_ID,
    tableId: "tblxn3Yie523MallN",
    apiKey: PRIMARY_API_KEY,
  },
  attendees: {
    baseId: PRIMARY_BASE_ID,
    tableId: "tblqe1kPM95Cp4Srn",
    apiKey: PRIMARY_API_KEY,
  },
  announcements: {
    baseId: ANNOUNCEMENTS_BASE_ID,
    tableId: "tblGJQ3v4RMIXCP4W",
    apiKey: ANNOUNCEMENTS_API_KEY,
  },
  activities: {
    baseId: PRIMARY_BASE_ID,
    tableId: "tblLpuL7Xff2rpdbB",
    apiKey: PRIMARY_API_KEY,
  },
  presentations: {
    baseId: PRIMARY_BASE_ID,
    tableId: "tblm5YCpC7ZwRSYWy",
    apiKey: PRIMARY_API_KEY,
  },
};

// Map API endpoints to table names
const ENDPOINT_TO_TABLE: Record<string, string> = {
  "/api/speakers": "speakers",
  "/api/exhibitors": "exhibitors",
  "/api/sessions": "sessions",
  "/api/agenda": "agenda",
  "/api/attendees": "attendees",
  "/api/sponsors": "sponsors",
  "/api/partners": "partners",
  "/api/activities": "activities",
  "/api/announcements": "announcements",
  "/api/ports": "ports",
  "/api/presentations": "presentations",
};

// ─── Field helpers ────────────────────────────────────────────────────────────

function attachmentUrl(field: any): string | null {
  if (!field) return null;
  if (Array.isArray(field) && field.length > 0) return field[0].url || null;
  if (typeof field === "string") return field;
  return null;
}

// ─── Per-table field mappers ──────────────────────────────────────────────────

function mapSpeaker(id: string, f: Record<string, any>) {
  const firstName = (f["First Name"] || "").trim();
  const lastName = (f["Last Name"] || "").trim();
  return {
    id,
    firstName,
    lastName,
    name: [firstName, lastName].filter(Boolean).join(" ") || f["Name"] || "",
    title: f["Speaker Title"] || f["Title"] || null,
    photo: attachmentUrl(f["Photo"]),
    topic: f["Speaking Topic"] || null,
    synopsis: f["Synopsis of Speaking topic"] || f["Synopsis"] || null,
    bio: f["Bio"] || null,
    published: true,
    publicPersonalData: !!f["Public Personal Data"],
    email: f["Email"] || null,
    phone: f["Phone"] || null,
  };
}

function mapExhibitor(id: string, f: Record<string, any>) {
  return {
    id,
    name: f["Name"] || f["Company Name"] || "",
    logo: attachmentUrl(f["Logo Url"]) || attachmentUrl(f["Logo"]),
    description: f["Description"] || f["Bio"] || null,
    contactName: f["Contact Name"] || null,
    contactTitle: f["Contact Title"] || null,
    contactEmail: f["Contact Email"] || f["Email"] || null,
    contactPhoneDirect: f["Phone Direct"] || f["Phone"] || null,
    contactPhoneMobile: f["Phone Mobile"] || null,
    contactFax: f["Fax"] || null,
    companyUrl: f["Company URL"] || f["Website"] || null,
    linkedIn: f["LinkedIn"] || null,
    facebook: f["Facebook"] || null,
    x: f["X"] || f["Twitter"] || null,
    boothNumber: f["Booth Number"] || f["Booth"] || null,
    demonstrations: f["Demonstrations"] || null,
  };
}

function mapSession(id: string, f: Record<string, any>) {
  const speakerIds = Array.isArray(f["Speaker(s)"]) ? f["Speaker(s)"] : [];
  return {
    id,
    title: f["Session Title"] || f["Title"] || "",
    date: f["Date"] || null,
    startTime: f["Start Time"] || null,
    endTime: f["End Time"] || null,
    room: f["Room"] || null,
    track: f["Type/Track"] || f["Track"] || null,
    description: f["Session Description"] || f["Description"] || null,
    speakers: speakerIds,
    speakerNames: [],
  };
}

function mapAttendee(id: string, f: Record<string, any>) {
  const firstName = f["First Name"] || "";
  const lastName = f["Last Name"] || "";
  return {
    id,
    firstName,
    lastName,
    name: [firstName, lastName].filter(Boolean).join(" "),
    email: f["Email"] || f["email"] || "",
    company: f["Company"] || null,
    title: f["Title"] || null,
    phone: f["Phone"] || null,
    registrationLevel: f["Registration Type"] || null,
    optInNetworking: f["Opt In Networking"] === "YES" || f["Opt In Networking"] === true ? "YES" : "NO",
    image: attachmentUrl(f["Photo"]) || attachmentUrl(f["Image"]) || null,
  };
}

function mapSponsor(id: string, f: Record<string, any>) {
  return {
    id,
    name: f["Sponsor Name"] || f["Name"] || "",
    bio: f["Sponsor Bio"] || f["Bio"] || null,
    logo: attachmentUrl(f["LogoGraphic"]) || attachmentUrl(f["Logo"]),
    companyUrl: f["Company URL"] || f["Website"] || null,
    tier: f["Tier"] || f["Sponsorship Tier"] || f["Sponsorship Level"] || "Sponsor",
    featured: !!f["Featured"],
    intro: f["Intro"] || null,
    website: f["Company URL"] || f["Website"] || null,
  };
}

function mapPartner(id: string, f: Record<string, any>) {
  return {
    id,
    name: f["Partner Name"] || f["Name"] || "",
    bio: f["Partner Bio"] || f["Bio"] || null,
    logo: attachmentUrl(f["LogoGraphic"]) || attachmentUrl(f["Logo"]),
    companyUrl: f["Company URL"] || f["Website"] || null,
    tier: "Partner",
    featured: !!f["Featured"],
    intro: f["Intro"] || null,
    website: f["Company URL"] || f["Website"] || null,
  };
}

function mapAnnouncement(id: string, f: Record<string, any>) {
  return {
    id,
    title: f["Title"] || "",
    content: f["Content"] || "",
    date: f["Date"] || null,
    time: f["Time"] || null,
    image: attachmentUrl(f["Image"]) || attachmentUrl(f["Photo"]) || null,
    alert: !!f["Alert"],
    createdAt: f["Created"] || new Date().toISOString(),
  };
}

function mapActivity(id: string, f: Record<string, any>) {
  return {
    id,
    Name: f["Title"] || f["Activity Name"] || f["Name"] || "",
    Description: f["Description"] || null,
    Date: f["Date"] || null,
    Time: f["Time"] || f["Start Time"] || null,
    Location: f["Location"] || f["Room"] || null,
    image: f["Image"] || f["Photo"] || null,
    "URL to get more information": f["URL"] || f["Link"] || null,
  };
}

function mapPort(id: string, f: Record<string, any>) {
  return {
    id,
    name: f["Port Name"] || f["Name"] || "",
    bio: f["Description"] || f["Bio"] || null,
    logo: attachmentUrl(f["Logo graphic"]) || attachmentUrl(f["Image"]) || attachmentUrl(f["Photo"]) || null,
    website: f["Port URL"] || f["Website"] || f["URL"] || null,
    location: f["Location"] || f["City"] || null,
    country: f["Country"] || null,
  };
}

function mapPresentation(id: string, f: Record<string, any>) {
  return {
    id,
    title: f["Title"] || f["Presentation Title"] || "",
    speaker: f["Speaker"] || f["Speaker Name"] || null,
    fileUrl: attachmentUrl(f["File"]) || attachmentUrl(f["PDF"]) || f["File URL"] || null,
    description: f["Description"] || null,
    date: f["Date"] || null,
  };
}

const TABLE_MAPPERS: Record<string, (id: string, fields: any) => any> = {
  speakers: mapSpeaker,
  exhibitors: mapExhibitor,
  sessions: mapSession,
  agenda: mapSession,
  attendees: mapAttendee,
  sponsors: mapSponsor,
  partners: mapPartner,
  activities: mapActivity,
  announcements: mapAnnouncement,
  ports: mapPort,
  presentations: mapPresentation,
};

// ─── Core Airtable fetcher with pagination ────────────────────────────────────

export const fetchFromAirtableCache = async <T = any>(
  tableName: string
): Promise<T[]> => {
  const config = AIRTABLE_CONFIG[tableName];
  if (!config) {
    console.error(`[Airtable] ❌ Unknown table: ${tableName}`);
    throw new Error(`Unknown Airtable table: ${tableName}`);
  }

  const mapper = TABLE_MAPPERS[tableName];
  let allRecords: T[] = [];
  let offset: string | null = null;
  let pageCount = 0;

  console.log(`[Airtable] 🔄 Fetching ${tableName} from base ${config.baseId}, table ${config.tableId}...`);

  do {
    pageCount++;
    
    // Use cache URL if available, otherwise use direct Airtable API
    const baseUrl = config.cacheUrl || `https://api.airtable.com/v0/${config.baseId}/${config.tableId}`;
    const url = offset ? `${baseUrl}?offset=${offset}` : baseUrl;

    console.log(`[Airtable] 📄 Page ${pageCount}: ${url}`);

    const headers: Record<string, string> = {};
    
    // Only add Authorization header if using direct Airtable API (not cache)
    if (!config.cacheUrl) {
      headers["Authorization"] = `Bearer ${config.apiKey}`;
    }

    const response = await fetch(url, { headers });
    
    if (!response.ok) {
      const text = await response.text();
      console.error(`[Airtable] ❌ Error fetching ${tableName}: ${response.status} - ${text}`);
      throw new Error(`Airtable error (${tableName}): ${response.status} - ${text}`);
    }

    const data = await response.json();
    console.log(`[Airtable] ✅ Page ${pageCount}: Received ${data.records?.length || 0} records`);

    if (data.records && Array.isArray(data.records)) {
      const mapped = data.records.map((record: any) =>
        mapper
          ? mapper(record.id, record.fields || {})
          : { id: record.id, ...record.fields }
      );
      allRecords = allRecords.concat(mapped);
    }

    offset = data.offset || null;
  } while (offset);

  console.log(`[Airtable] 🎉 Total ${tableName} records fetched: ${allRecords.length}`);
  return allRecords;
};

// ─── apiGet: Airtable first, backend fallback ────────────────────────────────

export const apiGet = async <T = any>(endpoint: string): Promise<T> => {
  const tableKey = ENDPOINT_TO_TABLE[endpoint];
  if (tableKey) {
    console.log(`[API] 🔄 Routing ${endpoint} to Airtable table: ${tableKey}`);
    const records = await fetchFromAirtableCache<any>(tableKey);
    return records as unknown as T;
  }
  console.log(`[API] 🔄 Routing ${endpoint} to backend`);
  return apiCall<T>(endpoint, { method: "GET" });
};

// ─── Backend call (used only for non-Airtable endpoints) ─────────────────────

export const isBackendConfigured = (): boolean =>
  !!BACKEND_URL && BACKEND_URL.length > 0;

export const getBearerToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === "web") return localStorage.getItem(BEARER_TOKEN_KEY);
    return await SecureStore.getItemAsync(BEARER_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const apiCall = async <T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  if (!isBackendConfigured()) {
    throw new Error("Backend URL not configured.");
  }
  const url = `${BACKEND_URL}${endpoint}`;
  const token = await getBearerToken();
  const fetchOptions: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  };
  const response = await fetch(url, fetchOptions);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API error: ${response.status} - ${text}`);
  }
  return response.json();
};

export const apiPost = async <T = any>(endpoint: string, data: any): Promise<T> =>
  apiCall<T>(endpoint, { method: "POST", body: JSON.stringify(data) });

export const apiPut = async <T = any>(endpoint: string, data: any): Promise<T> =>
  apiCall<T>(endpoint, { method: "PUT", body: JSON.stringify(data) });

export const apiPatch = async <T = any>(endpoint: string, data: any): Promise<T> =>
  apiCall<T>(endpoint, { method: "PATCH", body: JSON.stringify(data) });

export const apiDelete = async <T = any>(endpoint: string, data: any = {}): Promise<T> =>
  apiCall<T>(endpoint, { method: "DELETE", body: JSON.stringify(data) });

export const authenticatedApiCall = async <T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  const token = await getBearerToken();
  if (!token) throw new Error("Authentication token not found. Please sign in.");
  return apiCall<T>(endpoint, {
    ...options,
    headers: { ...options?.headers, Authorization: `Bearer ${token}` },
  });
};

export const authenticatedGet = <T = any>(endpoint: string) =>
  authenticatedApiCall<T>(endpoint, { method: "GET" });

export const authenticatedPost = <T = any>(endpoint: string, data: any) =>
  authenticatedApiCall<T>(endpoint, { method: "POST", body: JSON.stringify(data) });

export const authenticatedPut = <T = any>(endpoint: string, data: any) =>
  authenticatedApiCall<T>(endpoint, { method: "PUT", body: JSON.stringify(data) });

export const authenticatedPatch = <T = any>(endpoint: string, data: any) =>
  authenticatedApiCall<T>(endpoint, { method: "PATCH", body: JSON.stringify(data) });

export const authenticatedDelete = <T = any>(endpoint: string, data: any = {}) =>
  authenticatedApiCall<T>(endpoint, { method: "DELETE", body: JSON.stringify(data) });
