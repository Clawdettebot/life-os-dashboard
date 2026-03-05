import React, { useState, useEffect } from 'react';
import { Radio, Link2, Link2Off, RefreshCw, Calendar, Clock, AlertCircle, Check } from 'lucide-react';
import { WidgetCard } from './ui/WidgetCard';
import { GlassyPill } from './ui/GlassyPill';
import LobsterScrollArea from './ui/LobsterScrollArea';

export default function TwitchWidget({ API }) {
  const [status, setStatus] = useState({ connected: false, user: null });
  const [loading, setLoading] = useState(true);
  const [twitchSchedule, setTwitchSchedule] = useState([]);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    // Listen for message from OAuth popup
    const handleMessage = (event) => {
      if (event.data?.type === 'twitch-connected') {
        checkStatus();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/twitch/status');
      const data = await res.json();
      setStatus(data);
      if (data.connected) {
        fetchSchedule();
      }
    } catch (e) {
      console.error('Twitch status error:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedule = async () => {
    try {
      const res = await fetch('/api/twitch/schedule');
      const data = await res.json();
      if (data.schedule) {
        setTwitchSchedule(data.schedule);
      }
    } catch (e) {
      console.error('Twitch schedule error:', e);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch('/api/twitch/auth-url');
      const data = await res.json();
      if (data.authUrl) {
        // Open in new window for OAuth
        window.open(data.authUrl, '_blank', 'width=600,height=700');
      }
    } catch (e) {
      console.error('Twitch connect error:', e);
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await fetch('/api/twitch/disconnect', { method: 'POST' });
      setStatus({ connected: false, user: null });
      setTwitchSchedule([]);
    } catch (e) {
      console.error('Twitch disconnect error:', e);
    }
  };

  if (loading) {
    return (
      <WidgetCard className="p-6 border-purple-500/20">
        <div className="flex items-center gap-3 text-gray-400">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading Twitch...</span>
        </div>
      </WidgetCard>
    );
  }

  return (
    <WidgetCard className="p-6 border-purple-500/20 shadow-[0_0_30px_rgba(168,85,247,0.1)]">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
            <Radio className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Twitch</h3>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Stream Integration</p>
          </div>
        </div>
        <div className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${status.connected
            ? 'bg-green-500/10 text-green-400 border-green-500/30'
            : 'bg-gray-500/10 text-gray-400 border-gray-500/30'
          }`}>
          {status.connected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      {/* Connection Status */}
      {status.connected && status.user ? (
        <div className="mb-6">
          <div className="flex items-center gap-3 p-3 bg-purple-500/5 border border-purple-500/20 rounded-2xl">
            {status.user.profile_image_url ? (
              <img
                src={status.user.profile_image_url}
                alt={status.user.display_name}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Radio className="w-5 h-5 text-purple-400" />
              </div>
            )}
            <div className="flex-1">
              <p className="text-sm font-bold text-white">{status.user.display_name}</p>
              <p className="text-xs text-gray-400">@{status.user.login}</p>
            </div>
            <button
              onClick={handleDisconnect}
              className="p-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
              title="Disconnect"
            >
              <Link2Off className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full py-3 px-4 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 font-bold text-sm hover:bg-purple-500/20 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {connecting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Link2 className="w-4 h-4" />
                Connect Twitch
              </>
            )}
          </button>
        </div>
      )}

      {/* Schedule from Twitch */}
      {status.connected && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold tracking-[0.2em] text-gray-400 uppercase flex items-center gap-2">
              <Calendar className="w-3 h-3" /> Twitch Schedule
            </span>
            <button
              onClick={fetchSchedule}
              className="p-1.5 rounded-lg text-gray-500 hover:text-purple-400 hover:bg-purple-500/10 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>

          {twitchSchedule.length > 0 ? (
            <LobsterScrollArea className="max-h-48" contentClassName="space-y-2" size="small">
              {twitchSchedule.map((segment, i) => (
                <div key={segment.id || i} className="p-3 bg-white/[0.02] border border-white/[0.05] rounded-xl">
                  <p className="text-sm font-bold text-white">{segment.title}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    {new Date(segment.start_time).toLocaleString()}
                    {segment.duration && <span>({segment.duration})</span>}
                  </div>
                </div>
              ))}
            </LobsterScrollArea>
          ) : (
            <div className="py-4 text-center border border-dashed border-white/10 rounded-xl">
              <Calendar className="w-6 h-6 text-gray-600 mx-auto mb-2" />
              <p className="text-xs text-gray-500">No upcoming streams scheduled</p>
            </div>
          )}
        </div>
      )}

      {/* Help text when not connected */}
      {!status.connected && (
        <div className="p-3 bg-blue-500/05 border border-blue-500/20 rounded-xl">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-gray-400">
              Connect your Twitch account to sync your stream schedule directly to Life OS.
            </p>
          </div>
        </div>
      )}
    </WidgetCard>
  );
}
