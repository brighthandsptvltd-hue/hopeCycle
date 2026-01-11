import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

interface Notification {
  id: string;
  type: 'message' | 'donation' | 'request' | 'system';
  title: string;
  description: string;
  is_read: boolean;
  link?: string;
  created_at: string;
}

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();

    // Subscribe to new notifications
    const channel = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload: any) => {
        if (payload.eventType === 'INSERT') {
          setNotifications(prev => [payload.new as Notification, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new as Notification : n));
        } else if (payload.eventType === 'DELETE') {
          setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      console.log("🔔 [NOTIFICATIONS] Fetched for user:", user.id, "Yielded:", data?.length, "items");

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) throw error;
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));

      // Notify sidebar to refresh
      window.dispatchEvent(new CustomEvent('notificationsRead'));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));

      // Notify sidebar to refresh
      window.dispatchEvent(new CustomEvent('notificationsRead'));
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  };

  const timeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'message': return 'chat';
      case 'donation': return 'check_circle';
      case 'request': return 'warning';
      case 'system': return 'analytics';
      default: return 'notifications';
    }
  };

  const getColorClass = (type: string) => {
    switch (type) {
      case 'message': return 'bg-blue-100 text-blue-600';
      case 'donation': return 'bg-emerald-100 text-emerald-600';
      case 'request': return 'bg-amber-100 text-amber-600';
      case 'system': return 'bg-purple-100 text-purple-600';
      default: return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-brand-text dark:text-white">Alert Center</h2>
          <p className="text-brand-muted dark:text-gray-400">Keep track of your conversations and donation status.</p>
        </div>
        <button
          onClick={markAllAsRead}
          className="text-sm font-bold text-primary hover:underline transition-all active:scale-95"
        >
          Mark all as read
        </button>
      </div>

      <div className="bg-white dark:bg-brand-surface-dark rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm divide-y divide-gray-50 dark:divide-white/5 overflow-hidden">
        {loading ? (
          <div className="p-20 text-center text-brand-muted font-bold">Loading alerts...</div>
        ) : notifications.length === 0 ? (
          <div className="p-20 text-center space-y-4">
            <span className="material-symbols-outlined text-4xl text-slate-200">notifications_off</span>
            <p className="text-brand-muted font-bold">No notifications yet.</p>
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markAsRead(n.id)}
              className={`p-8 flex items-start gap-6 hover:bg-gray-50 dark:hover:bg-white/5 transition-all cursor-pointer relative ${!n.is_read ? 'bg-primary/5' : ''}`}
            >
              {!n.is_read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>}
              <div className={`size-12 rounded-2xl flex items-center justify-center shrink-0 ${getColorClass(n.type)}`}>
                <span className="material-symbols-outlined">{getIcon(n.type)}</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h4 className={`font-bold ${!n.is_read ? 'text-brand-text dark:text-white' : 'text-brand-muted'}`}>{n.title}</h4>
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{timeAgo(n.created_at)}</span>
                </div>
                <p className={`text-sm leading-relaxed ${!n.is_read ? 'text-brand-text/80 dark:text-white/80' : 'text-brand-muted'}`}>{n.description}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;