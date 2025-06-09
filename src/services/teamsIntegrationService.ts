import { supabase } from './supabase';

export interface TeamsEventPayload {
  title: string;
  text: string;
  url?: string;
}

/**
 * Simple Teams integration using an incoming webhook URL stored in env.
 */
export class TeamsIntegrationService {
  private static webhookUrl = import.meta.env.VITE_TEAMS_WEBHOOK_URL as string | undefined;

  static async sendAdaptiveCard(payload: TeamsEventPayload): Promise<void> {
    if (!this.webhookUrl) {
      console.warn('Teams webhook URL not configured. Skipping notification.');
      return;
    }

    const card = {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      summary: payload.title,
      themeColor: '0076D7',
      title: payload.title,
      text: payload.text,
      potentialAction: payload.url
        ? [
            {
              '@type': 'OpenUri',
              name: 'View',
              targets: [{ os: 'default', uri: payload.url }]
            }
          ]
        : []
    };

    const res = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(card)
    });

    if (!res.ok) {
      console.error('Failed to send Teams notification', await res.text());
    }
  }

  /**
   * Link a Teams meeting recording or transcript by storing its URL in Supabase.
   */
  static async linkMeeting(interactionId: string, recordingUrl: string): Promise<void> {
    const { error } = await supabase
      .from('interactions')
      .update({ follow_up: `Recording: ${recordingUrl}` })
      .eq('id', interactionId);

    if (error) {
      console.error('Failed to link meeting recording', error);
    }
  }

  /**
   * Create an interaction entry for a Teams meeting and attach recording or transcript.
   * Simplified: accepts meeting link, client & project ids.
   */
  static async linkTeamsMeeting(
    clientId: string,
    projectId: string | null,
    meetingJoinUrl: string
  ): Promise<void> {
    // Call Microsoft Graph to get meeting details (stubbed)
    try {
      // TODO: replace with real Graph API call
      const meetingTitle = 'Teams Meeting';

      // Create interaction
      const { data, error } = await supabase.from('interactions').insert({
        client_id: clientId,
        project_id: projectId,
        type: 'meeting',
        occurred_at: new Date().toISOString(),
        participants: null,
        summary: meetingTitle,
        follow_up: meetingJoinUrl,
        created_by: null
      });

      if (error) throw error;

      await this.sendAdaptiveCard({
        title: 'Meeting linked',
        text: `${meetingTitle} associated with project`,
        url: meetingJoinUrl
      });
    } catch (err) {
      console.error('Failed to link Teams meeting', err);
    }
  }
}
