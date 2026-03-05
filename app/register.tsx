
import React, { useEffect } from "react";
import { Redirect } from "expo-router";

/**
 * Register screen - redirects to auth screen.
 * 
 * The registration flow has been simplified: users only need to enter their
 * email address (which must be in the Airtable attendees list). The shared
 * password "POTF2026" is used automatically by the backend.
 * 
 * All sign-in and account creation is handled in app/auth.tsx.
 */
export default function RegisterScreen() {
  console.log('RegisterScreen - Redirecting to auth screen (simplified flow)');
  return <Redirect href="/auth" />;
}
