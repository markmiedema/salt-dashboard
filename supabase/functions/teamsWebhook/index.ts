// Supabase Edge Function: teamsWebhook
// Validates Microsoft Teams webhook validation token and returns 200.
// Deploy with: supabase functions deploy teamsWebhook
import { serve } from 'https://deno.land/std@0.181.0/http/server.ts';

// Token set in Supabase project environment variables
const VALIDATION_TOKEN = Deno.env.get('TEAMS_VALIDATION_TOKEN');

serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const token = req.headers.get('authorization')?.replace('Bearer ', '') ?? '';
  if (!VALIDATION_TOKEN || token !== VALIDATION_TOKEN) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Acknowledge reception to Teams
  return new Response('OK', { status: 200 });
});
