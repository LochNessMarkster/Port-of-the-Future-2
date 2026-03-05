
import Constants from "expo-constants";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const BEARER_TOKEN_KEY = "portofthefuture_bearer_token";

export const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || "";

export const AIRTABLE_CACHE_BASE_URL =
  "https://airtablecache.portofthefutureconference.com/v0/appkKjciinTlnsbkd";

export const AIRTABLE_TABLES: Record<string, string> = {
  speakers:      "tblNp1JZk4ARZZZlT",
  exhibitors:    "tblzex4bjwEZh1021",
  agenda:        "tblhUTXC3XHVGssO4",
  sessions:      "tblhUTXC3XHVGssO4",
  attendees:     "tblIwt4FWHtNm01Z4",
  sponsors:      "tblgWrwRvpdcVG8sB",
  activities:    "tblLpuL7Xff2rpdbB",
  announcements: "tbl1eqc3UiYaO1pSq",
  ports:         "tblrXosiVXKhJHYLu",
  presentations: "tblm5YCpC7ZwRSYWy",
};

const ENDPOINT_TO_TABLE: Record<string, string> = {
  "/api/speakers":      "speakers",
  "/api/exhibitors":    "exhibitors",
  "/api/sessions":      "sessions",
  "/api/agenda":        "agenda",
  "/api/attendees":     "attendees",
  "/api/sponsors":      "sponsors",
  "/api/activities":    "activities",
  "/api/announcements": "announcements",
  "/api/ports":         "ports",
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
  const lastName  = (f["Last Name"]  || "").trim();
  return {
    id,
    firstName,
    lastName,
    name:       [firstName, lastName].filter(Boolean).join(" ") || f["Name"] || "",
    title:      f["Speaker Title"] || f["Title"] || null,
    photo:      attachmentUrl(f["Photo"]),
    topic:      f["Speaking Topic"] || null,
    synopsis:   f["Synopsis of Speaking topic"] || f["Synopsis"] || null,
    bio:        f["Bio"] || null,
    published:  true,
    publicPersonalData: !!f["Public Personal Data"],
    email:      f["Email"] || null,
    phone:      f["Phone"] || null,
  };
}

function mapExhibitor(id: string, f: Record<string, any>) {
  return {
    id,
    name:               f["Name"] || "",
    logo:               attachmentUrl(f["Logo Url"]) || attachmentUrl(f["Logo"]),
    description:        f["Description"] || f["Bio"] || null,
    contactName:        f["Contact Name"] || null,
    contactTitle:       f["Contact Title"] || null,
    contactEmail:       f["Contact Email"] || f["Email"] || null,
    contactPhoneDirect: f["Phone Direct"] || f["Phone"] || null,
    contactPhoneMobile: f["Phone Mobile"] || null,
    contactFax:         f["Fax"] || null,
    companyUrl:         f["Company URL"] || f["Website"] || null,
    linkedIn:           f["LinkedIn"] || null,
    facebook:           f["Facebook"] || null,
    x:                  f["X"] || f["Twitter"] || null,
    boothNumber:        f["Booth Number"] || f["Booth"] || null,
    demonstrations:     f["Demonstrations"] || null,
  };
}

function mapSession(id: string, f: Record<string, any>) {
  const speakerIds = Array.isArray(f["Speaker(s)"]) ? f["Speaker(s)"] : [];
  return {
    id,
    title:        f["Title"] || f["Session Title"] || "",
    date:         f["Date"] || null,
    startTime:    f["Start Time"] || null,
    endTime:      f["End Time"] || null,
    room:         f["Room"] || null,
    track:        f["Type/Track"] || f["Track"] || null,
    description:  f["Session Description"] || f["Description"] || null,
    speakers:     speakerIds,
    speakerNames: [],
  };
}

function mapAttendee(id: string, f: Record<string, any>) {
  const firstName = f["First Name"] || "";
  const lastName  = f["Last Name"]  || "";
  return {
    id,
    firstName,
    lastName,
    name:              [firstName, lastName].filter(Boolean).join(" "),
    email:             f["Email"] || f["email"] || "",
    company:           f["Company"] || null,
    title:             f["Title"] || null,
    phone:             f["Phone"] || null,
    registrationLevel: f["Registration Type"] || null,
    optInNetworking:   f["Opt In Networking"] === "YES" || f["Opt In Networking"] === true ? "YES" : "NO",
    image:             attachmentUrl(f["Photo"]) || attachmentUrl(f["Image"]) || null,
  };
}

function mapSponsor(id: string, f: Record<string, any>) {
  return {
    id,
    name:       f["Sponsor Name"] || f["Name"] || "",
    bio:        f["Sponsor Bio"]  || f["Bio"]  || null,
    logo:       attachmentUrl(f["LogoGraphic"]) || attachmentUrl(f["Logo"]),
    companyUrl: f["Company URL"] || f["Website"] || null,
    tier:       f["Tier"] || f["Sponsorship Tier"] || f["Sponsorship Level"] || "Sponsor",
    featured:   !!f["Featured"],
  };
}

function mapAnnouncement(id: string, f: Record<string, any>) {
  return {
    id,
    title:     f["Title"]   || "",
    content:   f["Content"] || "",
    date:      f["Date"]    || null,
    time:      f["Time"]    || null,
    image:     attachmentUrl(f["Image"]) || attachmentUrl(f["Photo"]) || null,
    alert:     !!f["Alert"],
    createdAt: f["Created"] || new Date().toISOString(),
  };
}

function mapActivity(id: string, f: Record<string, any>) {
  return {
    id,
    title:       f["Title"] || f["Activity Name"] || f["Name"] || "",
    description: f["Description"] || null,
    date:        f["Date"] || null,
    time:        f["Time"] || f["Start Time"] || null,
    location:    f["Location"] || f["Room"] || null,
    image:       attachmentUrl(f["Image"]) || attachmentUrl(f["Photo"]) || null,
    type:        f["Type"] || null,
    url:         f["URL"] || f["Link"] || null,
  };
}

function mapPort(id: string, f: Record<string, any>) {
  return {
    id,
    name:        f["Port Name"] || f["Name"] || "",
    description: f["Description"] || f["Bio"] || null,
    location:    f["Location"] || f["City"] || null,
    image:       attachmentUrl(f["Logo graphic"]) || attachmentUrl(f["Image"]) || attachmentUrl(f["Photo"]) || null,
    website:     f["Port URL"] || f["Website"] || f["URL"] || null,
    country:     f["Country"] || null,
  };
}

function mapPresentation(id: string, f: Record<string, any>) {
  return {
    id,
    title:       f["Title"] || f["Presentation Title"] || "",
    speaker:     f["Speaker"] || f["Speaker Name"] || null,
    fileUrl:     attachmentUrl(f["File"]) || attachmentUrl(f["PDF"]) || f["File URL"] || null,
    description: f["Description"] || null,
    date:        f["Date"] || null,
  };
}

const TABLE_MAPPERS: Record<string, (id: string, fields: any) => any> = {
  speakers:      mapSpeaker,
  exhibitors:    mapExhibitor,
  sessions:      mapSession,
  agenda:        mapSession,
  attendees:     mapAttendee,
  sponsors:      mapSponsor,
  activities:    mapActivity,
  announcements: mapAnnouncement,
  ports:         mapPort,
  presentations: mapPresentation,
};

// ─── Core Airtable fetcher with pagination ────────────────────────────────────

export const fetchFromAirtableCache = async <T = any>(
  tableName: string
): Promise<T[]> => {
  const tableId = AIRTABLE_TABLES[tableName];
  if (!tableId) {
    console.error(`[Airtable] Unknown table: ${tableName}`);
    throw new Error(`Unknown Airtable table: ${tableName}`);
  }

  const mapper = TABLE_MAPPERS[tableName];
  let allRecords: T[] = [];
  let offset: string | null = null;
  let pageCount = 0;

  console.log(`[Airtable] 🔄 Fetching ${tableName} from table ${tableId}...`);

  do {
    pageCount++;
    const url = offset
      ? `${AIRTABLE_CACHE_BASE_URL}/${tableId}?offset=${offset}`
      : `${AIRTABLE_CACHE_BASE_URL}/${tableId}`;

    console.log(`[Airtable] 📄 Page ${pageCount}: ${url}`);

    const response = await fetch(url);
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
