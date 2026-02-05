import axios from 'axios';

const BASE_ID = 'appcNhRl5vEqug2D1';

// Initialize axios client with proper API key handling
function createAirtableClient() {
  // Use environment variable if set, otherwise use default API key for the Port of Future 2026 API
  const apiKey = process.env.AIRTABLE_API_KEY || 'patZyEbyPVImqOPC9.3f079360e07787946058e636a2e8c6692588f57faa491dc915770953d4c57689';

  if (!apiKey) {
    throw new Error(
      'AIRTABLE_API_KEY is required. Please set the environment variable or ensure the default API key is configured.'
    );
  }

  return axios.create({
    baseURL: `https://api.airtable.com/v0/${BASE_ID}`,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });
}

let airtableClient: ReturnType<typeof createAirtableClient> | null = null;

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
  SESSIONS: 'tblHaxjP8sWviBQjD',
  SPEAKERS: 'tblvDeIT1VDf7Cart',
  PORTS: 'tblxgPx1eRl9iSX2S',
  EXHIBITORS: 'tblTWLUNSEfW0Cvxx',
  SPONSORS: 'tblyI3hc2dZZu0eQA',
  ATTENDEES: 'tblQhLaWbOSI0t7iX',
  ANNOUNCEMENTS: 'tblGJQ3v4RMIXCP4W',
};

/**
 * Fetch all records from an Airtable table
 */
export async function fetchAirtableRecords<T>(
  tableId: string,
  options?: { pageSize?: number; offset?: string; fields?: string[] }
): Promise<AirtableListResponse<T>> {
  const params: any = {};
  if (options?.pageSize) params.pageSize = options.pageSize;
  if (options?.offset) params.offset = options.offset;
  if (options?.fields) params.fields = options.fields;

  const client = getAirtableClient();
  const response = await client.get<AirtableListResponse<T>>(
    `/${tableId}`,
    { params }
  );
  return response.data;
}

/**
 * Fetch a single record from Airtable
 */
export async function fetchAirtableRecord<T>(
  tableId: string,
  recordId: string
): Promise<AirtableRecord<T>> {
  const client = getAirtableClient();
  const response = await client.get<AirtableRecord<T>>(
    `/${tableId}/${recordId}`
  );
  return response.data;
}

/**
 * Create a record in Airtable
 */
export async function createAirtableRecord<T>(
  tableId: string,
  fields: T
): Promise<AirtableRecord<T>> {
  const client = getAirtableClient();
  const response = await client.post<{ records: AirtableRecord<T>[] }>(
    `/${tableId}`,
    { records: [{ fields }] }
  );
  return response.data.records[0];
}

/**
 * Update a record in Airtable
 */
export async function updateAirtableRecord<T>(
  tableId: string,
  recordId: string,
  fields: Partial<T>
): Promise<AirtableRecord<T>> {
  const client = getAirtableClient();
  const response = await client.patch<{ records: AirtableRecord<T>[] }>(
    `/${tableId}/${recordId}`,
    { records: [{ id: recordId, fields }] }
  );
  return response.data.records[0];
}

/**
 * Delete a record from Airtable
 */
export async function deleteAirtableRecord(
  tableId: string,
  recordId: string
): Promise<void> {
  const client = getAirtableClient();
  await client.delete(`/${tableId}/${recordId}`);
}

// Type definitions for Airtable records
export interface SessionFields {
  Title: string;
  Speaker: string[];
  Room: string;
  Type: string;
  Date: string;
  Time: string;
  Description: string;
}

export interface SpeakerFields {
  Name: string;
  Title: string;
  Photo: Array<{ url: string; id: string; size: number; type: string }>;
  Topic: string;
  Synopsis: string;
  Bio: string;
}

export interface PortFields {
  Name: string;
  Logo: Array<{ url: string; id: string; size: number; type: string }>;
  Bio: string;
  Website: string;
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
  Name: string;
  Logo: Array<{ url: string; id: string; size: number; type: string }>;
  Tier: string;
  Intro: string;
  Bio: string;
  Website: string;
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
