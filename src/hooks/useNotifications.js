import { useState, useEffect, useCallback, useRef } from 'react';
import notificationService from '../services/notificationService';

/**
 * useNotifications
 * Polls /notifications/unread-count/ every 30 seconds.
 * When notification panel opens, fetches full list.
 */
export function useNotifications() {
  const [unreadCount, setUnreadCount]     = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [panelOpen, setPanelOpen]         = useState(false);
  const [loading, setLoading]             = useState(false);
  const intervalRef                       = useRef(null);

  // Poll unread count every 30 seconds
  const pollCount = useCallback(async () => {
    try {
      const data = await notificationService.getUnreadCount();
      setUnreadCount(data.unread_count || 0);
    } catch {
      // silently ignore — network hiccup shouldn't break the UI
    }
  }, []);

  useEffect(() => {
    pollCount(); // immediate first call
    intervalRef.current = setInterval(pollCount, 30000);
    return () => clearInterval(intervalRef.current);
  }, [pollCount]);

  // Fetch full list when panel opens
  const openPanel = useCallback(async () => {
    setPanelOpen(true);
    setLoading(true);
    try {
      const data = await notificationService.getAll();
      setNotifications(data.data || []);
      setUnreadCount(data.unread_count || 0);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const closePanel = useCallback(() => setPanelOpen(false), []);

  // Mark all as read
  const markAllRead = useCallback(async () => {
    try {
      await notificationService.markRead([]);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  }, []);

  // Mark single notification as read
  const markOneRead = useCallback(async (id) => {
    try {
      await notificationService.markRead([id]);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  }, []);

  return {
    unreadCount,
    notifications,
    panelOpen,
    loading,
    openPanel,
    closePanel,
    markAllRead,
    markOneRead,
  };
}