// Supabase Edge Function: teamsSync
// Runs on cron schedule to fetch recent Teams meetings and store transcripts as interactions.
// Set schedule via dashboard: e.g., every hour.
import { serve } from 'https://deno.land/std@0.181.0/http/server.ts';

const GRAPH_TOKEN = Deno.env.get('GRAPH_APP_TOKEN');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_KEY');

async function fetchMeetings() {
  // Placeholder: fetch last 50 meetings
  const res = await fetch('https://graph.microsoft.com/v1.0/me/onlineMeetings?$top=50', {
    headers: { Authorization: `Bearer ${GRAPH_TOKEN}` }
  });
  if (!res.ok) throw new Error('Graph API error');
  return await res.json();
}

serve(async () => {
  try {
    const meetings = await fetchMeetings();
    // Iterate and store transcripts placeholder
    console.log('Fetched meetings count', meetings.value?.length ?? 0);
  } catch (err) {
    console.error(err);
  }
  return new Response('OK');
});
