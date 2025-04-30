import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

export const supabase = createClient(
  'https://zgbvadhrmufncknjsqfe.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnYnZhZGhybXVmbmNrbmpzcWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwMTQ0MzcsImV4cCI6MjA2MTU5MDQzN30.U4dus0YDHPtw2VJVK_0a9ZApdgvfwdpEcujCIt0y6BE'
);
