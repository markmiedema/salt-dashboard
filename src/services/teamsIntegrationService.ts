import { supabase } from './supabase';
import { getClientProjectUrl } from '../utils/navigation';

export interface TeamsEventPayload {
  title: string;
  text: string;
  url?: string;
  clientId?: string;
  projectId?: string;
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

    // Generate appropriate URL based on context
    let actionUrl = payload.url;
    if (!actionUrl && payload.clientId && payload.projectId) {
      actionUrl = getClientProjectUrl(payload.clientId, payload.projectId);
    } else if (!actionUrl && payload.clientId) {
      actionUrl = `/clients/${payload.clientId}`;
    }

    const card = {
      '@type': 'MessageCard',
      '@context': 'http://schema.org/extensions',
      summary: payload.title,
      themeColor: '0076D7',
      title: payload.title,
      text: payload.text,
      potentialAction: actionUrl
        ? [
            {
              '@type': 'OpenUri',
              name: 'View Details',
              targets: [{ os: 'default', uri: actionUrl }]
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
        url: meetingJoinUrl,
        clientId,
        projectId
      });
    } catch (err) {
      console.error('Failed to link Teams meeting', err);
    }
  }

  /**
   * Send notification for project updates with proper navigation URLs
   */
  static async notifyProjectUpdate(
    clientId: string,
    projectId: string,
    projectName: string,
    updateType: 'created' | 'updated' | 'completed'
  ): Promise<void> {
    const titles = {
      created: 'New Project Created',
      updated: 'Project Updated',
      completed: 'Project Completed'
    };

    const texts = {
      created: `Project "${projectName}" has been created and is ready to begin.`,
      updated: `Project "${projectName}" has been updated with new information.`,
      completed: `Project "${projectName}" has been marked as completed.`
    };

    await this.sendAdaptiveCard({
      title: titles[updateType],
      text: texts[updateType],
      clientId,
      projectId
    });
  }

  /**
   * Send notification for milestone updates with proper navigation URLs
   */
  static async notifyMilestoneUpdate(
    clientId: string,
    projectId: string,
    milestoneName: string,
    status: string
  ): Promise<void> {
    await this.sendAdaptiveCard({
      title: 'Milestone Updated',
      text: `Milestone "${milestoneName}" status changed to ${status}.`,
      clientId,
      projectId
    });
  }

  /**
   * Send notification for document uploads with proper navigation URLs
   */
  static async notifyDocumentUpload(
    clientId: string,
    projectId: string | null,
    documentTitle: string
  ): Promise<void> {
    await this.sendAdaptiveCard({
      title: 'Document Uploaded',
      text: `New document "${documentTitle}" has been uploaded.`,
      clientId,
      projectId
    });
  }
}