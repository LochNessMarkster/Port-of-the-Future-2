import axios from 'axios';

const BASE_ID = 'appkKjciinTlnsbkd';

// Primary API key for most tables
const PRIMARY_API_KEY = process.env.AIRTABLE_API_KEY || 'patCsZvxAEJmBpJGu.8c98dc7c1d088a1b0ef2ef73a02e8d4b7cd4a8ce9a5f36d79ab0265c676c6f8c';

// Secondary API key for Attendees table (write-permission token)
const SECONDARY_API_KEY = 'patWZPuCxzbpHpLU0.3d9e89a41457f6718bec97347b90fbbf08f6653c9aa7f7167a41708b7761d894';

// Base ID for Attendees table (if different)
const ATTENDEES_BASE_ID = 'appkKjciinTlnsbkd';

/**
 * Get a masked version of the API key for logging (first 10 chars only)
 */
function getMaskedApiKey(key: string): string {
  if (!key) return 'NOT_SET';
  const visible = key.substring(0, 10);
  return `${visible}...`;
}

/**
 * Initialize axios client with proper API key handling
 */
function createAirtableClient(baseId: string = BASE_ID, apiKey: string = PRIMARY_API_KEY) {
  if (!apiKey) {
    const errorMsg = 'AIRTABLE_API_KEY is required. Please set the AIRTABLE_API_KEY environment variable or ensure the default API key is configured.';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Log that we're using an API key (masked for security)
  console.log(`[Airtable] Initializing client with API key: ${getMaskedApiKey(apiKey)}`);

  return axios.create({
    baseURL: `https://api.airtable.com/v0/${baseId}`,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });
}

let airtableClient: ReturnType<typeof createAirtableClient> | null = null;
let attendeesClient: ReturnType<typeof createAirtableClient> | null = null;

/**
 * Get the Airtable client for main base
 */
function getAirtableClient() {
  if (!airtableClient) {
    airtableClient = createAirtableClient(BASE_ID, PRIMARY_API_KEY);
  }
  return airtableClient;
}

/**
 * Get the Airtable client for Attendees table
 */
function getAttendeesClient() {
  if (!attendeesClient) {
    attendeesClient = createAirtableClient(ATTENDEES_BASE_ID, SECONDARY_API_KEY);
  }
  return attendeesClient;
}

export interface AirtableRecord<T> {
  id: string;
  fields: T;
  createdTime: string;
}

export interface AirtableListResponse<T> {
  records: AirtableRecord<T>[];
  offset?: string;
}

// Table IDs
export const TABLES = {
  SESSIONS: 'tblhUTXC3XHVGssO4',
  SPEAKERS: 'tblNp1JZk4ARZZZlT',
  PORTS: 'tblrXosiVXKhJHYLu',
  EXHIBITORS: 'tblzex4bjwEZh1021',
  SPONSORS: 'tblgWrwRvpdcVG8sB',
  PARTNERS: 'tblxn3Yie523MallN',
  ATTENDEES: 'tblqe1kPM95Cp4Srn',
  ANNOUNCEMENTS: 'tblGJQ3v4RMIXCP4W',
  ACTIVITIES: 'tblLpuL7Xff2rpdbB',
};

/**
 * Map table IDs to human-readable names for logging
 */
function getTableName(tableId: string): string {
  const tableMap: Record<string, string> = {
    [TABLES.SESSIONS]: 'Sessions',
    [TABLES.SPEAKERS]: 'Speakers',
    [TABLES.PORTS]: 'Ports',
    [TABLES.EXHIBITORS]: 'Exhibitors',
    [TABLES.SPONSORS]: 'Sponsors',
    [TABLES.PARTNERS]: 'Partners',
    [TABLES.ATTENDEES]: 'Attendees',
    [TABLES.ANNOUNCEMENTS]: 'Announcements',
    [TABLES.ACTIVITIES]: 'Activities',
  };
  return tableMap[tableId] || 'Unknown';
}

/**
 * Fetch all records from an Airtable table
 */
export async function fetchAirtableRecords<T>(
  tableId: string,
  options?: { pageSize?: number; offset?: string; fields?: string[]; logger?: any }
): Promise<AirtableListResponse<T>> {
  const params: any = {};
  if (options?.pageSize) params.pageSize = options.pageSize;
  if (options?.offset) params.offset = options.offset;
  if (options?.fields) params.fields = options.fields;

  const client = getAirtableClient();
  const tableName = getTableName(tableId);

  if (options?.logger) {
    options.logger.debug(
      {
        baseId: BASE_ID,
        tableId,
        tableName,
        endpoint: `https://api.airtable.com/v0/${BASE_ID}/${tableId}`,
      },
      'Fetching records from Airtable'
    );
  }

  try {
    const response = await client.get<AirtableListResponse<T>>(
      `/${tableId}`,
      { params }
    );

    if (options?.logger) {
      options.logger.info(
        { tableId, tableName, recordCount: response.data.records.length },
        'Successfully fetched records from Airtable'
      );
    }

    return response.data;
  } catch (error: any) {
    const status = error.response?.status;
    const errorMessage = error.response?.data?.error?.message || error.message;
    const errorType = error.response?.data?.error?.type || 'UNKNOWN';

    // Handle 403 Forbidden errors gracefully
    if (status === 403) {
      const logMsg = `Airtable API returned 403 FORBIDDEN for table ${tableName} (${tableId}). The API key may not have permission to access this table or the table/base may not exist.`;

      if (options?.logger) {
        options.logger.warn(
          {
            baseId: BASE_ID,
            tableId,
            tableName,
            status,
            errorType,
            errorMessage,
            endpoint: `https://api.airtable.com/v0/${BASE_ID}/${tableId}`,
            apiKeyConfigured: !!PRIMARY_API_KEY,
            apiKeyMasked: getMaskedApiKey(PRIMARY_API_KEY),
            nodeEnv: process.env.NODE_ENV,
          },
          logMsg
        );
      }

      // Log to console as well for debugging
      console.warn(`[Airtable 403] ${logMsg}`);
      console.warn(`[Airtable 403] Error details: ${errorMessage}`);

      // Return empty array instead of throwing error
      return { records: [] };
    }

    // For other errors, log and re-throw
    if (options?.logger) {
      options.logger.error(
        {
          baseId: BASE_ID,
          tableId,
          tableName,
          status,
          errorType,
          errorMessage,
          endpoint: `https://api.airtable.com/v0/${BASE_ID}/${tableId}`,
        },
        'Airtable API error while fetching records'
      );
    }

    throw error;
  }
}

/**
 * Fetch a single record from Airtable
 */
export async function fetchAirtableRecord<T>(
  tableId: string,
  recordId: string,
  logger?: any
): Promise<AirtableRecord<T> | null> {
  const client = getAirtableClient();
  const tableName = getTableName(tableId);

  if (logger) {
    logger.debug(
      {
        baseId: BASE_ID,
        tableId,
        tableName,
        recordId,
        endpoint: `https://api.airtable.com/v0/${BASE_ID}/${tableId}/${recordId}`,
      },
      'Fetching single record from Airtable'
    );
  }

  try {
    const response = await client.get<AirtableRecord<T>>(
      `/${tableId}/${recordId}`
    );

    if (logger) {
      logger.info(
        { tableId, tableName, recordId },
        'Successfully fetched record from Airtable'
      );
    }

    return response.data;
  } catch (error: any) {
    const status = error.response?.status;
    const errorMessage = error.response?.data?.error?.message || error.message;
    const errorType = error.response?.data?.error?.type || 'UNKNOWN';

    // Handle 403 Forbidden errors gracefully
    if (status === 403) {
      const logMsg = `Airtable API returned 403 FORBIDDEN for table ${tableName} (${tableId}). The API key may not have permission to access this table or the table/base may not exist.`;

      if (logger) {
        logger.warn(
          {
            baseId: BASE_ID,
            tableId,
            tableName,
            recordId,
            status,
            errorType,
            errorMessage,
            endpoint: `https://api.airtable.com/v0/${BASE_ID}/${tableId}/${recordId}`,
            apiKeyConfigured: !!PRIMARY_API_KEY,
            apiKeyMasked: getMaskedApiKey(PRIMARY_API_KEY),
            nodeEnv: process.env.NODE_ENV,
          },
          logMsg
        );
      }

      // Log to console as well for debugging
      console.warn(`[Airtable 403] ${logMsg}`);
      console.warn(`[Airtable 403] Error details: ${errorMessage}`);

      // Return null instead of throwing error
      return null;
    }

    // For other errors, log and re-throw
    if (logger) {
      logger.error(
        {
          baseId: BASE_ID,
          tableId,
          tableName,
          recordId,
          status,
          errorType,
          errorMessage,
          endpoint: `https://api.airtable.com/v0/${BASE_ID}/${tableId}/${recordId}`,
        },
        'Airtable API error while fetching record'
      );
    }

    throw error;
  }
}

/**
 * Create a record in Airtable
 */
export async function createAirtableRecord<T>(
  tableId: string,
  fields: T,
  logger?: any
): Promise<AirtableRecord<T>> {
  const client = getAirtableClient();

  try {
    const response = await client.post<{ records: AirtableRecord<T>[] }>(
      `/${tableId}`,
      { records: [{ fields }] }
    );
    return response.data.records[0];
  } catch (error: any) {
    const status = error.response?.status;
    const errorMessage = error.response?.data?.error?.message || error.message;

    if (logger) {
      logger.error(
        { tableId, status, error: errorMessage },
        'Airtable API error while creating record'
      );
    }

    throw error;
  }
}

/**
 * Update a record in Airtable
 */
export async function updateAirtableRecord<T>(
  tableId: string,
  recordId: string,
  fields: Partial<T>,
  logger?: any
): Promise<AirtableRecord<T>> {
  const client = getAirtableClient();

  try {
    const response = await client.patch<{ records: AirtableRecord<T>[] }>(
      `/${tableId}/${recordId}`,
      { records: [{ id: recordId, fields }] }
    );
    return response.data.records[0];
  } catch (error: any) {
    const status = error.response?.status;
    const errorMessage = error.response?.data?.error?.message || error.message;

    if (logger) {
      logger.error(
        { tableId, recordId, status, error: errorMessage },
        'Airtable API error while updating record'
      );
    }

    throw error;
  }
}

/**
 * Delete a record from Airtable
 */
export async function deleteAirtableRecord(
  tableId: string,
  recordId: string,
  logger?: any
): Promise<void> {
  const client = getAirtableClient();

  try {
    await client.delete(`/${tableId}/${recordId}`);
  } catch (error: any) {
    const status = error.response?.status;
    const errorMessage = error.response?.data?.error?.message || error.message;

    if (logger) {
      logger.error(
        { tableId, recordId, status, error: errorMessage },
        'Airtable API error while deleting record'
      );
    }

    throw error;
  }
}

/**
 * Fetch attendees from Airtable (uses separate base and API key)
 */
export async function fetchAirtableAttendees(
  tableId: string,
  options?: { pageSize?: number; offset?: string; fields?: string[]; logger?: any }
): Promise<AirtableListResponse<AttendeeFields>> {
  const params: any = {};
  if (options?.pageSize) params.pageSize = options.pageSize;
  if (options?.offset) params.offset = options.offset;
  if (options?.fields) params.fields = options.fields;

  const client = getAttendeesClient();

  if (options?.logger) {
    options.logger.debug(
      {
        baseId: ATTENDEES_BASE_ID,
        tableId,
        endpoint: `https://api.airtable.com/v0/${ATTENDEES_BASE_ID}/${tableId}`,
      },
      'Fetching attendees from Airtable'
    );
  }

  try {
    const response = await client.get<AirtableListResponse<AttendeeFields>>(
      `/${tableId}`,
      { params }
    );

    if (options?.logger) {
      options.logger.info(
        { tableId, recordCount: response.data.records.length },
        'Successfully fetched attendees from Airtable'
      );
    }

    return response.data;
  } catch (error: any) {
    const status = error.response?.status;
    const errorMessage = error.response?.data?.error?.message || error.message;
    const errorType = error.response?.data?.error?.type || 'UNKNOWN';

    // Handle 403 Forbidden errors gracefully
    if (status === 403) {
      const logMsg = `Airtable API returned 403 FORBIDDEN for attendees table (${tableId}). The API key may not have permission to access this table or the table/base may not exist.`;

      if (options?.logger) {
        options.logger.warn(
          {
            baseId: ATTENDEES_BASE_ID,
            tableId,
            status,
            errorType,
            errorMessage,
            endpoint: `https://api.airtable.com/v0/${ATTENDEES_BASE_ID}/${tableId}`,
            apiKeyConfigured: !!SECONDARY_API_KEY,
            apiKeyMasked: getMaskedApiKey(SECONDARY_API_KEY),
            nodeEnv: process.env.NODE_ENV,
          },
          logMsg
        );
      }

      // Log to console as well for debugging
      console.warn(`[Airtable 403] ${logMsg}`);
      console.warn(`[Airtable 403] Error details: ${errorMessage}`);

      // Return empty array instead of throwing error
      return { records: [] };
    }

    // For other errors, log and re-throw
    if (options?.logger) {
      options.logger.error(
        {
          baseId: ATTENDEES_BASE_ID,
          tableId,
          status,
          errorType,
          errorMessage,
          endpoint: `https://api.airtable.com/v0/${ATTENDEES_BASE_ID}/${tableId}`,
        },
        'Airtable API error while fetching attendees'
      );
    }

    throw error;
  }
}

// Type definitions for Airtable records
export interface SessionFields {
  Title: string;
  'Speaker(s)': string;
  Room: string;
  'Type/Track': string;
  Date: string;
  'Start Time': string;
  'Session Description': string;
}

export interface SpeakerFields {
  'Speaker Name'?: string;
  'First Name'?: string;
  'Last Name'?: string;
  'Speaker Title': string;
  Photo: Array<{ url: string; id: string; size: number; type: string }>;
  'Speaking Topic': string;
  'Synopsis of Speaking topic': string;
  Bio: string;
  Published?: boolean;
}

export interface PortFields {
  'Port Name': string;
  'Logo graphic': Array<{ url: string; id: string; size: number; type: string }>;
  'Port Bio': string;
  'Port Link': string;
}

export interface ExhibitorFields {
  Name: string;
  Logo?: Array<{ url: string; id: string; size: number; type: string }>;
  Description?: string;
  Bio?: string;
  Phone?: string;
  'Company URL'?: string;
  Website?: string;
  LinkedIn?: string;
  'Booth Number'?: string;
  BoothNumber?: string;
  // New expanded fields
  'Primary contact name'?: string;
  'Primary contact title'?: string;
  'Primary contact email'?: string;
  'Primary contact telephone direct'?: string;
  'Primary contact telephone mobile'?: string;
  'Primary contact fax number'?: string;
  'Facebook URL'?: string;
  'X (Twitter) URL'?: string;
  Demonstrations?: string;
}

export interface SponsorFields {
  'Sponsor Name': string;
  LogoGraphic: Array<{ url: string; id: string; size: number; type: string }>;
  'Sponsor Level': string;
  'Sponsor Bio': string;
  CompanyLink: string;
}

export interface PartnerFields {
  'Partner Name': string;
  LogoGraphic: Array<{ url: string; id: string; size: number; type: string }>;
  PartnerBio: string;
  'Partner Page Link': string;
}

export interface AnnouncementFields {
  Title: string;
  Content: string;
  CreatedAt: string;
}

export interface AttendeeFields {
  'First Name'?: string;
  'Last Name'?: string;
  Email?: string;
  Company?: string;
  'Job Title'?: string;
  Phone?: string;
  'Registration Level'?: string;
  'Opt In Networking'?: string;
}

export interface ActivityFields {
  Name?: string;
  Description?: string;
  Date?: string;
  Time?: string;
  Location?: string;
  url?: string;
  image?: Array<{ url: string; id: string; size: number; type: string }>;
}
