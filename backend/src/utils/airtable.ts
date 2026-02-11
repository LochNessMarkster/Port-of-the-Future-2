import axios from 'axios';

const BASE_ID = 'appkKjciinTlnsbkd';
const API_KEY = 'patCsZvxAEJmBpJGu.8c98dc7c1d088a1b0ef2ef73a02e8d4b7cd4a8ce9a5f36d79ab0265c676c6f8c';

/**
 * Initialize axios client with proper API key handling
 */
function createAirtableClient() {
  if (!API_KEY) {
    throw new Error('AIRTABLE_API_KEY is required.');
  }

  return axios.create({
    baseURL: `https://api.airtable.com/v0/${BASE_ID}`,
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
  });
}

let airtableClient: ReturnType<typeof createAirtableClient> | null = null;

/**
 * Get the Airtable client
 */
function getAirtableClient() {
  if (!airtableClient) {
    airtableClient = createAirtableClient();
  }
  return airtableClient;
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
  SESSIONS: 'tblhUTXC3XHVG',
  SPEAKERS: 'tblNp1JZk4ARZZZlT',
  PORTS: 'tblrXosiVXKhJHYLu',
  EXHIBITORS: 'tblzex4bjwEZh1021',
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
      const logMsg = `Airtable API returned 403 FORBIDDEN for table ${tableName} (${tableId}). The API key may not have permission to access this table.`;

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
          },
          logMsg
        );
      }

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
      const logMsg = `Airtable API returned 403 FORBIDDEN for table ${tableName} (${tableId}). The API key may not have permission to access this table.`;

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
          },
          logMsg
        );
      }

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
