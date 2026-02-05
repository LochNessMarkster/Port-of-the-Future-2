import axios from 'axios';

const BASE_ID = 'appcNhRl5vEqug2D1';

// API Keys
const PRIMARY_API_KEY = 'patCsZvxAEJmBpJGu.8c98dc7c1d088a1b0ef2ef73a02e8d4b7cd4a8ce9a5f36d79ab0265c676c6f8c';
const SECONDARY_API_KEY = 'patZyEbyPVImqOPC9.3f079360e07787946058e636a2e8c6692588f57faa491dc915770953d4c57689';

// Table IDs that use secondary API key
const SECONDARY_API_KEY_TABLES = new Set([
  'tblHaxjP8sWviBQjD', // Sessions
  'tblTWLUNSEfW0Cvxx', // Exhibitors
  'tblNp1JZk4ARZZZlT', // Speakers
  'tblrXosiVXKhJHYLu', // Ports
  'tblgWrwRvpdcVG8sB', // Sponsors
  'tblxn3Yie523MallN', // Partners
  'tblQhLaWbOSI0t7iX', // Attendees
  'tblGJQ3v4RMIXCP4W'  // Announcements
]);

/**
 * Determine which API key to use based on table ID
 */
function getApiKeyForTable(tableId: string): string {
  return SECONDARY_API_KEY_TABLES.has(tableId) ? SECONDARY_API_KEY : PRIMARY_API_KEY;
}

/**
 * Initialize axios client with proper API key handling
 */
function createAirtableClient(apiKey: string) {
  if (!apiKey) {
    throw new Error('AIRTABLE_API_KEY is required.');
  }

  return axios.create({
    baseURL: `https://api.airtable.com/v0/${BASE_ID}`,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Get the appropriate Airtable client for a given table
 */
function getAirtableClient(tableId: string) {
  const apiKey = getApiKeyForTable(tableId);
  return createAirtableClient(apiKey);
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
  SESSIONS: 'tblHaxjP8sWviBQjD',
  SPEAKERS: 'tblNp1JZk4ARZZZlT',
  PORTS: 'tblrXosiVXKhJHYLu',
  EXHIBITORS: 'tblTWLUNSEfW0Cvxx',
  SPONSORS: 'tblgWrwRvpdcVG8sB',
  PARTNERS: 'tblxn3Yie523MallN',
  ATTENDEES: 'tblQhLaWbOSI0t7iX',
  ANNOUNCEMENTS: 'tblGJQ3v4RMIXCP4W',
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

  const client = getAirtableClient(tableId);

  try {
    const response = await client.get<AirtableListResponse<T>>(
      `/${tableId}`,
      { params }
    );
    return response.data;
  } catch (error: any) {
    const status = error.response?.status;
    const errorMessage = error.response?.data?.error?.message || error.message;

    // Handle 403 Forbidden errors gracefully
    if (status === 403) {
      const tableName = getTableName(tableId);
      const logMsg = `Airtable API returned 403 for table ${tableName} (${tableId}). This API key may not have permission to access this table. Please check the Airtable API key permissions.`;

      if (options?.logger) {
        options.logger.warn({ tableId, tableName, error: errorMessage }, logMsg);
      }

      // Return empty array instead of throwing error
      return { records: [] };
    }

    // For other errors, log and re-throw
    if (options?.logger) {
      options.logger.error(
        { tableId, status, error: errorMessage },
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
  const client = getAirtableClient(tableId);

  try {
    const response = await client.get<AirtableRecord<T>>(
      `/${tableId}/${recordId}`
    );
    return response.data;
  } catch (error: any) {
    const status = error.response?.status;
    const errorMessage = error.response?.data?.error?.message || error.message;

    // Handle 403 Forbidden errors gracefully
    if (status === 403) {
      const tableName = getTableName(tableId);
      const logMsg = `Airtable API returned 403 for table ${tableName} (${tableId}). This API key may not have permission to access this table. Please check the Airtable API key permissions.`;

      if (logger) {
        logger.warn({ tableId, tableName, recordId, error: errorMessage }, logMsg);
      }

      // Return null instead of throwing error
      return null;
    }

    // For other errors, log and re-throw
    if (logger) {
      logger.error(
        { tableId, recordId, status, error: errorMessage },
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
  const client = getAirtableClient(tableId);

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
  const client = getAirtableClient(tableId);

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
  const client = getAirtableClient(tableId);

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

// Type definitions for Airtable records
export interface SessionFields {
  'Session Title': string;
  'Speaker Names': string;
  Location: string;
  'Type/Track': string;
  Date: string;
  'Start Time': string;
  'Session Description': string;
}

export interface SpeakerFields {
  'Speaker Name': string;
  'Speaker Title': string;
  Photo: Array<{ url: string; id: string; size: number; type: string }>;
  'Speaking Topic': string;
  'Synopsis of Speaking topic': string;
  Bio: string;
}

export interface PortFields {
  'Port Name': string;
  'Logo graphic': Array<{ url: string; id: string; size: number; type: string }>;
  'Port Bio': string;
  'Port Link': string;
}

export interface ExhibitorFields {
  Name: string;
  Logo: Array<{ url: string; id: string; size: number; type: string }>;
  BoothNumber: string;
  Bio: string;
  ContactName: string;
  ContactEmail: string;
  Website: string;
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
  Email: string;
  Name: string;
  Company: string;
  Title: string;
  Phone: string;
  Photo: Array<{ url: string; id: string; size: number; type: string }>;
  LinkedIn: string;
  Bio: string;
  OptInNetworking: boolean;
}
