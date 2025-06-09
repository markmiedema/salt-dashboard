import * as microsoftTeams from '@microsoft/teams-js';

export class TeamsService {
  private static isInitialized = false;
  private static isTeamsContext = false;

  static async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return this.isTeamsContext;
    }

    try {
      await microsoftTeams.app.initialize();
      this.isTeamsContext = true;
      this.isInitialized = true;
      console.log('Microsoft Teams SDK initialized successfully');
      return true;
    } catch (error) {
      console.log('Not running in Teams context - using web mode');
      this.isTeamsContext = false;
      this.isInitialized = true;
      return false;
    }
  }

  static async getContext(): Promise<microsoftTeams.app.Context | null> {
    if (!this.isTeamsContext) {
      return null;
    }

    try {
      const context = await microsoftTeams.app.getContext();
      return context;
    } catch (error) {
      console.error('Failed to get Teams context:', error);
      return null;
    }
  }

  static async authenticate(): Promise<string | null> {
    if (!this.isTeamsContext) {
      console.log('Using mock authentication for web mode');
      return 'mock-auth-token';
    }

    try {
      const token = await microsoftTeams.authentication.getAuthToken({
        resources: [import.meta.env.VITE_AZURE_CLIENT_ID || 'mock-client-id']
      });
      return token;
    } catch (error) {
      console.error('Teams authentication failed:', error);
      return null;
    }
  }

  static isInTeams(): boolean {
    return this.isTeamsContext;
  }

  static async notifySuccess(message: string): Promise<void> {
    if (this.isTeamsContext) {
      try {
        await microsoftTeams.app.notifySuccess();
      } catch (error) {
        console.error('Failed to notify Teams of success:', error);
      }
    }
    console.log('Success:', message);
  }

  static async notifyFailure(message: string): Promise<void> {
    if (this.isTeamsContext) {
      try {
        await microsoftTeams.app.notifyFailure({
          reason: microsoftTeams.app.FailedReason.Other,
          message: message
        });
      } catch (error) {
        console.error('Failed to notify Teams of failure:', error);
      }
    }
    console.error('Failure:', message);
  }
}
