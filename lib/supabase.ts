
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dnwgtaibudkxinhwceox.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRud2d0YWlidWRreGluaHdjZW94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAyMzE1NTcsImV4cCI6MjA4NTgwNzU1N30.nM_Un-7c4yokkXysJpcUTiNqiLAbXua_YdDKFYTE6PE';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Airtable cache endpoint for attendee validation
export const AIRTABLE_ATTENDEE_CACHE_ENDPOINT = 'https://airtablecache.portofthefutureconference.com/v0/appkKjciinTlnsbkd/tblIwt4FWHtNm01Z4';

/**
 * Check if email exists in Airtable cache using filter formula
 */
export async function checkEmailInAirtableCache(email: string): Promise<boolean> {
  try {
    console.log('Checking email in Airtable cache:', email);
    
    // Build the filter formula with proper URL encoding
    // Format: filterByFormula=Email="user@example.com"
    const filterFormula = `Email="${email}"`;
    const encodedFilter = encodeURIComponent(filterFormula);
    const url = `${AIRTABLE_ATTENDEE_CACHE_ENDPOINT}?filterByFormula=${encodedFilter}`;
    
    console.log('Airtable cache request URL:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Airtable cache check failed:', response.status, response.statusText);
      throw new Error(`Airtable cache check failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // If records array is empty, email is not registered
    // If it contains at least one record, email is valid
    const isRegistered = data.records && data.records.length > 0;
    console.log('Email check result:', isRegistered ? 'Found' : 'Not found', `(${data.records?.length || 0} records)`);
    
    return isRegistered;
  } catch (error) {
    console.error('Error checking email in Airtable cache:', error);
    throw new Error('Failed to verify email. Please try again.');
  }
}

/**
 * Fetch user profile from Airtable cache after authentication
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
    
    // Build the filter formula with proper URL encoding
    const filterFormula = `Email="${email}"`;
    const encodedFilter = encodeURIComponent(filterFormula);
    const url = `${AIRTABLE_ATTENDEE_CACHE_ENDPOINT}?filterByFormula=${encodedFilter}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Airtable cache fetch failed:', response.status, response.statusText);
      throw new Error(`Airtable cache fetch failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.records && data.records.length > 0) {
      const fields = data.records[0].fields;
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
    throw new Error('Failed to load profile data.');
  }
}
