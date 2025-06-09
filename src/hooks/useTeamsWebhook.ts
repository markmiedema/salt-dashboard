import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

export interface ClientChannel {
  client_id: string;
  channel_name: string | null;
  webhook_url: string;
}

export const useTeamsWebhook = (clientId: string) => {
  const [channel, setChannel] = useState<ClientChannel | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChannel = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('client_teams_channels')
      .select('*')
      .eq('client_id', clientId)
      .single();
    if (error && error.code !== 'PGRST116') setError(error.message);
    setChannel(data || null);
    setLoading(false);
  };

  useEffect(() => {
    if (clientId) fetchChannel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const saveChannel = async (channelName: string, webhookUrl: string) => {
    setLoading(true);
    const { error } = await supabase.from('client_teams_channels').upsert({
      client_id: clientId,
      channel_name: channelName,
      webhook_url: webhookUrl
    });
    if (error) {
      setError(error.message);
    }
    await fetchChannel();
  };

  return { channel, loading, error, saveChannel };
};
