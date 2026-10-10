import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { notificationService } from '../../services/notificationService';
import { CandidateNotification, NotificationType } from '../../types/database';
import { Button } from '../ui/Button';
import {
  Bell,
  CheckCheck,
  UserCheck,
  UserPlus,
  Send,
  CalendarCheck,
  Sparkles,
  Briefcase,
  GraduationCap,
  MessageSquare,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface NotificationsViewProps {
  onNavigate?: (route: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const currentUserId = user?.id || 'demo-candidate';

  const [notifications, setNotifications] = useState<CandidateNotification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'network' | 'applications'>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, [user]);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await notificationService.getNotifications(currentUserId);
      setNotifications(data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    await notificationService.markAsRead(id, currentUserId);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead(currentUserId);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const getIconForType = (type: NotificationType) => {
    switch (type) {
      case 'connection_accepted':
      case 'connection_request':
        return <UserCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
      case 'application_update':
        return <Send className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'interview_scheduled':
        return <CalendarCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      case 'student_verification':
        return <GraduationCap className="w-4 h-4 text-amber-600 dark:text-amber-400" />;
      case 'job_alert':
        return <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-slate-500" />;
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    if (filter === 'network') return n.type.includes('connection') || n.type === 'message';
    if (filter === 'applications') return n.type === 'application_update' || n.type === 'interview_scheduled';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs transition-colors">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Notifications Center
            </h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time activity alerts for connection requests, direct messages, application pipeline shifts, and interviews.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            leftIcon={<CheckCheck className="w-3.5 h-3.5" />}
          >
            Mark all read
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200/80 dark:border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            filter === 'all'
              ? 'bg-slate-900 dark:bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          All Activity ({notifications.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            filter === 'unread'
              ? 'bg-slate-900 dark:bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Unread ({unreadCount})
        </button>
        <button
          onClick={() => setFilter('network')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            filter === 'network'
              ? 'bg-slate-900 dark:bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Network & Messages
        </button>
        <button
          onClick={() => setFilter('applications')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
            filter === 'applications'
              ? 'bg-slate-900 dark:bg-indigo-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Applications & Interviews
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-xs text-slate-400 font-mono animate-pulse">
            Loading notifications...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-10 text-center space-y-2">
            <Bell className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">No notifications</h3>
            <p className="text-xs text-slate-500">You're completely caught up with your network.</p>
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                if (!n.read) handleMarkAsRead(n.id);
                if (n.link && onNavigate) onNavigate(n.link.replace('#candidate-', ''));
              }}
              className={`p-4 rounded-2xl border transition-colors cursor-pointer flex items-start justify-between gap-4 ${
                n.read
                  ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 hover:border-slate-300'
                  : 'bg-indigo-50/50 dark:bg-indigo-950/30 border-indigo-200/80 dark:border-indigo-800/80 shadow-xs'
              }`}
            >
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/80 shadow-xs shrink-0 mt-0.5">
                  {getIconForType(n.type)}
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {n.title}
                    </h4>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {n.message}
                  </p>
                  <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 pt-0.5">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(n.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {n.link && (
                <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium shrink-0 flex items-center gap-1 hover:underline">
                  <span>View</span>
                  <ExternalLink className="w-3 h-3" />
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
