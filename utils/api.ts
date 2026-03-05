
import Constants from "expo-constants";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const BEARER_TOKEN_KEY = "portofthefuture_bearer_token";

export const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || "";

export const AIRTABLE_CACHE_BASE_URL = "https://airtablecache.portofthefutureconference.com/v0/appkKjciinTlnsbkd";

// NEW: Direct Airtable API configuration
export const AIRTABLE_API_BASE_URL = "https://api.airtable.com/v0/appkKjciinTlnsbkd";
export const AIRTABLE_API_TOKEN = "patCsZvxAEJmBpJGu.8c98dc7c1d088a1b0ef2ef73a02e8d4b7cd4a8ce9a5f36d79ab0265c676c6f8c";

// Correct table IDs provided by user
export const AIRTABLE_TABLES: Record<string, string> = {
  speakers:      "tblNp1JZk4ARZZZlT",
  exhibitors:    "tblzex4bjwEZh1021",
  agenda:        "tblhUTXC3XHVGssO4",
  sessions:      "tblhUTXC3XHVGssO4",
  attendees:     "tblqe1kPM95Cp4Srn",
  sponsors:      "tblgWrwRvpdcVG8sB",
  activities:    "tblLpuL7Xff2rpdbB",
  announcements: "tbl1eqc3UiYaO1pSq",
  ports:         "tblrXosiVXKhJHYLu",
  presentations: "tblm5YCpC7ZwRSYWy",
};

// Map backend API endpoints -> Airtable table keys
const ENDPOINT_TO_TABLE: Record<string, string> = {
  "/api/speakers":       "speakers",
  "/api/exhibitors":     "exhibitors",
  "/api/sessions":       "sessions",
  "/api/agenda":         "agenda",
  "/api/attendees":      "attendees",
  "/api/sponsors":       "sponsors",
  "/api/activities":     "activities",
  "/api/announcements":  "announcements",
  "/api/ports":          "ports",
  "/api/presentations":  "presentations",
};

export const isBackendConfigured = (): boolean => {
  return !!BACKEND_URL && BACKEND_URL.length > 0;
};

export const getBearerToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === "web") {
      return localStorage.getItem(BEARER_TOKEN_KEY);
    } else {
      return await SecureStore.getItemAsync(BEARER_TOKEN_KEY);
    }
  } catch (error) {
    console.error("[API] Error retrieving bearer token:", error);
    return null;
  }
};

/**
 * Fetch all records from Airtable API directly, handling pagination automatically.
 * Airtable returns a maximum of 100 records per request. This function
 * continues fetching until all records are retrieved.
 */
export const fetchFromAirtableDirect = async <T = any>(
  tableName: string
): Promise<T[]> => {
  const tableId = AIRTABLE_TABLES[tableName];
  if (!tableId) {
    throw new Error(`Unknown Airtable table: ${tableName}`);
  }

  console.log(`[API] 🔄 Starting direct Airtable fetch for ${tableName} (${tableId})`);
  let allRecords: T[] = [];
  let offset: string | undefined = undefined;
  let pageNumber = 0;

  do {
    pageNumber++;
    const url = new URL(`${AIRTABLE_API_BASE_URL}/${tableId}`);
    if (offset) {
      url.searchParams.append('offset', offset);
    }

    console.log(`[API] 📄 Fetching page ${pageNumber} for ${tableName}...`);
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_TOKEN}`,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`[API] ❌ Airtable API error for ${tableName} (page ${pageNumber}): ${response.status} - ${text}`);
      throw new Error(`Airtable API error for ${tableName}: ${response.status} - ${text}`);
    }

    const data = await response.json();

    if (data.records && Array.isArray(data.records)) {
      const transformed = data.records.map((record: any) => ({
        id: record.id,
        ...record.fields,
      }));
      allRecords = allRecords.concat(transformed);
      console.log(`[API] ✅ Page ${pageNumber}: Fetched ${transformed.length} records (total so far: ${allRecords.length})`);
    } else {
      console.log(`[API] ⚠️ Page ${pageNumber}: No records array found in response`);
    }

    offset = data.offset;
    
    if (offset) {
      console.log(`[API] 🔄 More records available, continuing to page ${pageNumber + 1}...`);
    } else {
      console.log(`[API] ✅ Pagination complete for ${tableName}`);
    }
  } while (offset);

  console.log(`[API] 🎉 Successfully fetched ALL ${allRecords.length} records from ${tableName} in ${pageNumber} page(s)`);
  return allRecords;
};

/**
 * Fetch all records from an Airtable table via cache, handling pagination automatically.
 * Airtable returns a maximum of 100 records per request. This function
 * continues fetching until all records are retrieved.
 */
export const fetchFromAirtableCache = async <T = any>(
  tableName: string
): Promise<T[]> => {
  const tableId = AIRTABLE_TABLES[tableName];
  if (!tableId) {
    throw new Error(`Unknown Airtable table: ${tableName}`);
  }

  console.log(`[API] 🔄 Starting pagination fetch for ${tableName} (${tableId})`);
  let allRecords: T[] = [];
  let offset: string | null = null;
  let pageNumber = 0;

  do {
    pageNumber++;
    const url = offset
      ? `${AIRTABLE_CACHE_BASE_URL}/${tableId}?offset=${offset}`
      : `${AIRTABLE_CACHE_BASE_URL}/${tableId}`;

    console.log(`[API] 📄 Fetching page ${pageNumber} for ${tableName}...`);
    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text();
      console.error(`[API] ❌ Airtable error for ${tableName} (page ${pageNumber}): ${response.status} - ${text}`);
      throw new Error(`Airtable error for ${tableName}: ${response.status} - ${text}`);
    }

    const data = await response.json();

    if (data.records && Array.isArray(data.records)) {
      const transformed = data.records.map((record: any) => ({
        id: record.id,
        ...record.fields,
      }));
      allRecords = allRecords.concat(transformed);
      console.log(`[API] ✅ Page ${pageNumber}: Fetched ${transformed.length} records (total so far: ${allRecords.length})`);
    } else {
      console.log(`[API] ⚠️ Page ${pageNumber}: No records array found in response`);
    }

    offset = data.offset || null;
    
    if (offset) {
      console.log(`[API] 🔄 More records available, continuing to page ${pageNumber + 1}...`);
    } else {
      console.log(`[API] ✅ Pagination complete for ${tableName}`);
    }
  } while (offset);

  console.log(`[API] 🎉 Successfully fetched ALL ${allRecords.length} records from ${tableName} in ${pageNumber} page(s)`);
  return allRecords;
};

/**
 * apiGet - intercepts known /api/ endpoints and fetches from Airtable directly.
 * Falls back to the backend for anything not in the map (e.g. /api/profile).
 */
export const apiGet = async <T = any>(endpoint: string): Promise<T> => {
  const tableKey = ENDPOINT_TO_TABLE[endpoint];
  if (tableKey) {
    console.log(`[API] Intercepting ${endpoint} -> fetching from Airtable table: ${tableKey}`);
    const records = await fetchFromAirtableCache<any>(tableKey);
    return records as unknown as T;
  }
  // Not a known Airtable endpoint — fall through to backend
  console.log(`[API] No Airtable mapping for ${endpoint}, calling backend`);
  return apiCall<T>(endpoint, { method: "GET" });
};

/**
 * Generic backend API call — only used for endpoints not served by Airtable.
 */
export const apiCall = async <T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  if (!isBackendConfigured()) {
    throw new Error("Backend URL not configured. Please rebuild the app.");
  }

  const url = `${BACKEND_URL}${endpoint}`;
  console.log(`[API] Calling backend: ${options?.method || 'GET'} ${url}`);

  const fetchOptions: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  };

  const token = await getBearerToken();
  if (token) {
    fetchOptions.headers = {
      ...fetchOptions.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    const text = await response.text();
    console.error(`[API] Backend error: ${response.status} - ${text}`);
    if (response.status === 429) {
      throw new Error(`429 Rate limit exceeded. Please try again later.`);
    }
    if (response.status === 503) {
      throw new Error(`503 Service temporarily unavailable.`);
    }
    throw new Error(`API error: ${response.status} - ${text}`);
  }

  return response.json();
};

export const apiPost = async <T = any>(endpoint: string, data: any): Promise<T> => {
  return apiCall<T>(endpoint, { method: "POST", body: JSON.stringify(data) });
};

export const apiPut = async <T = any>(endpoint: string, data: any): Promise<T> => {
  return apiCall<T>(endpoint, { method: "PUT", body: JSON.stringify(data) });
};

export const apiPatch = async <T = any>(endpoint: string, data: any): Promise<T> => {
  return apiCall<T>(endpoint, { method: "PATCH", body: JSON.stringify(data) });
};

export const apiDelete = async <T = any>(endpoint: string, data: any = {}): Promise<T> => {
  return apiCall<T>(endpoint, { method: "DELETE", body: JSON.stringify(data) });
};

export const authenticatedApiCall = async <T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  const token = await getBearerToken();
  if (!token) {
    throw new Error("Authentication token not found. Please sign in.");
  }
  return apiCall<T>(endpoint, {
    ...options,
    headers: { ...options?.headers, Authorization: `Bearer ${token}` },
  });
};

export const authenticatedGet = async <T = any>(endpoint: string): Promise<T> => {
  return authenticatedApiCall<T>(endpoint, { method: "GET" });
};

export const authenticatedPost = async <T = any>(endpoint: string, data: any): Promise<T> => {
  return authenticatedApiCall<T>(endpoint, { method: "POST", body: JSON.stringify(data) });
};

export const authenticatedPut = async <T = any>(endpoint: string, data: any): Promise<T> => {
  return authenticatedApiCall<T>(endpoint, { method: "PUT", body: JSON.stringify(data) });
};

export const authenticatedPatch = async <T = any>(endpoint: string, data: any): Promise<T> => {
  return authenticatedApiCall<T>(endpoint, { method: "PATCH", body: JSON.stringify(data) });
};

export const authenticatedDelete = async <T = any>(endpoint: string, data: any = {}): Promise<T> => {
  return authenticatedApiCall<T>(endpoint, { method: "DELETE", body: JSON.stringify(data) });
};
