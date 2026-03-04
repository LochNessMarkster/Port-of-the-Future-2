
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dnwgtaibudkxinhwceox.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRud2d0YWlidWRreGluaHdjZW94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMzE1NTcsImV4cCI6MjA4NTgwNzU1N30.nM_Un-7c4yokkXysJpcUTiNqiLAbXua_YdDKFYTE6PE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Airtable cache endpoint for attendee validation
export const AIRTABLE_ATTENDEE_CACHE_ENDPOINT = 'https://airtablecache.portofthefutureconference.com/v0/appkKjciinTlnsbkd/tblIwt4FWHtNm01Z4';

/**
 * Fetches all pages of records from the Airtable cache endpoint
 * Handles pagination using the offset parameter to retrieve all records
 */
const fetchAllRecords = async () => {
  let allRecords: any[] = [];
  let offset: string | null = null;
  const url = `https://airtablecache.portofthefutureconference.com/v0/appkKjciinTlnsbkd/tblIwt4FWHtNm01Z4`;

  console.log('Starting to fetch all records from Airtable cache...');

  do {
    const fetchUrl = offset ? `${url}?offset=${offset}` : url;
    console.log(`Fetching page... (current total: ${allRecords.length} records)`);
    
    const response = await fetch(fetchUrl);
    const data = await response.json();
    
    allRecords = allRecords.concat(data.records);
    offset = data.offset || null;
    
    console.log(`Fetched ${data.records.length} records. Total so far: ${allRecords.length}`);
  } while (offset);

  console.log(`Finished fetching all records. Total: ${allRecords.length} records`);
  return allRecords;
};

/**
 * Verify email exists in Airtable cache
 * Fetches all records using pagination and performs local case-insensitive comparison
 */
const verifyEmail = async (email: string): Promise<boolean> => {
  try {
    const allRecords = await fetchAllRecords();
    
    const match = allRecords.find(
      (record: any) => record.fields.Email && 
      record.fields.Email.toLowerCase().trim() === email.toLowerCase().trim()
    );
    
    return !!match;
  } catch (error) {
    console.error('Email verification error:', error);
    return false;
  }
};

/**
 * ⚠️ TEMPORARILY DISABLED FOR TESTING ⚠️
 * Check if email exists in Airtable cache
 * 
 * THIS FUNCTION NOW ALWAYS RETURNS TRUE TO BYPASS EMAIL VERIFICATION
 * This allows direct testing of Supabase authentication without Airtable checks
 * 
 * TODO: Re-enable email verification once Supabase login is confirmed working
 */
export async function checkEmailInAirtableCache(email: string): Promise<boolean> {
  console.warn('⚠️ AIRTABLE EMAIL VERIFICATION IS TEMPORARILY DISABLED ⚠️');
  console.log('Bypassing email check for:', email);
  console.log('Returning TRUE to allow direct Supabase login testing');
  
  // TEMPORARILY DISABLED - Always return true to skip verification
  return true;
  
  // Original implementation (commented out for testing):
  // console.log('Checking email in Airtable cache:', email);
  // const isRegistered = await verifyEmail(email);
  // console.log('Email check result:', isRegistered ? 'Found' : 'Not found');
  // return isRegistered;
}

/**
 * Fetch user profile from Airtable cache after authentication
 * Uses pagination to fetch all records before searching
 */
export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  title?: string;
  phone?: string;
  registrationType?: string;
}

export async function fetchUserProfileFromCache(email: string): Promise<UserProfile | null> {
  try {
    console.log('Fetching user profile from Airtable cache:', email);
    
    const allRecords = await fetchAllRecords();
    
    const userRecord = allRecords.find(
      (record: any) => record.fields.Email &&
      record.fields.Email.toLowerCase().trim() === email.toLowerCase().trim()
    );
    
    if (userRecord) {
      const fields = userRecord.fields;
      console.log('User profile fetched successfully');
      return {
        firstName: fields['First Name'] || '',
        lastName: fields['Last Name'] || '',
        email: fields['Email'] || email,
        company: fields['Company'],
        title: fields['Title'],
        phone: fields['Phone'],
        registrationType: fields['Registration Type'],
      };
    }
    
    console.log('No profile found in cache');
    return null;
  } catch (error) {
    console.error('Error fetching user profile from Airtable cache:', error);
    return null;
  }
}
