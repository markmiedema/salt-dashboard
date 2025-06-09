import React, { useState } from 'react';
import { useTeamsWebhook } from '../../hooks/useTeamsWebhook';

export interface TeamsChannelSettingsProps {
  clientId: string;
}

export const TeamsChannelSettings: React.FC<TeamsChannelSettingsProps> = ({ clientId }) => {
  const { channel, loading, error, saveChannel } = useTeamsWebhook(clientId);

  const [channelName, setChannelName] = useState(channel?.channel_name ?? '');
  const [webhookUrl, setWebhookUrl] = useState(channel?.webhook_url ?? '');

  const handleSave = async () => {
    await saveChannel(channelName, webhookUrl);
    alert('Teams channel saved');
  };

  if (loading) return <p>Loading Teams settings...</p>;
  if (error) return <p className="text-red-500">{error}</p>;

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Channel Name</label>
        <input
          type="text"
          value={channelName}
          onChange={(e) => setChannelName(e.target.value)}
          className="border rounded w-full px-2 py-1 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Webhook URL</label>
        <input
          type="text"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          className="border rounded w-full px-2 py-1 text-sm"
        />
      </div>
      <button onClick={handleSave} className="px-4 py-1 rounded bg-blue-600 text-white text-sm">
        Save
      </button>
    </div>
  );
};

export default TeamsChannelSettings;
