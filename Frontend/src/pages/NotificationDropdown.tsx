import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Calendar, CheckCircle, AlertCircle, Megaphone,
  X, Check, ChevronDown, Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { notificationApi } from '../services/api';
import type { NotificationItemBackend } from '../services/api';

interface NotificationDropdownProps {
  userType?: 'student' | 'instructor';
  isScrolled?: boolean;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ isScrolled = false }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [showAll, setShowAll] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItemBackend[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    fetchNotifications();
    setupWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await notificationApi.getAll();
      if (Array.isArray(data)) {
        setNotifications(data);
      } else if (data && typeof data === 'object' && 'results' in data) {
        // Handle DRF paginated response
        setNotifications((data as any).results || []);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setNotifications([]);
    }
  };

  const setupWebSocket = () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const wsUrl = `ws://localhost:8000/ws/notifications/?token=${token}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const newNotif = JSON.parse(event.data) as NotificationItemBackend;
        setNotifications(prev => {
          const safePrev = Array.isArray(prev) ? prev : [];
          return [newNotif, ...safePrev];
        });
      } catch (err) {
        console.error("Failed to parse websocket message", err);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error", error);
    };

    wsRef.current = ws;
  };

  const markAsRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error("Error marking as read", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Error marking all as read", err);
    }
  };

  const deleteNotification = async (id: number, e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    try {
      await notificationApi.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error("Error deleting notification", err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await notificationApi.clearAll();
      setNotifications([]);
    } catch (err) {
      console.error("Error clearing notifications", err);
    }
  };

  const handleNotificationClick = async (notification: NotificationItemBackend) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    setIsOpen(false);
    
    const { type, metadata } = notification;
    if (!metadata) return;

    const role = localStorage.getItem('role'); // 'student' or 'professor'
    const isInstructor = role === 'professor';

    if (type === 'system') {
      // Flagged incidents — instructor only
      if (metadata.examId) navigate(`/review-incidents/${metadata.examId}`);
      else navigate(`/review-incidents`);
    } else if (type === 'exam') {
      // Exam reminders — navigate to the exams tab
      if (isInstructor) {
        if (metadata.classId) navigate(`/classes-instructor/${metadata.classId}/exams`);
        else navigate(`/classes-instructor`);
      } else {
        // Student: go to /classes/:classId/exams tab
        if (metadata.classId) navigate(`/classes/${metadata.classId}/exams`);
        else if (metadata.examId) navigate(`/exam/${metadata.examId}`);
        else navigate(`/classes`);
      }
    } else if (type === 'grade') {
      if (isInstructor) {
        // Professor: go to exam results page
        if (metadata.examId) navigate(`/exam-results/${metadata.examId}`);
        else navigate(`/classes-instructor`);
      } else {
        // Student: go to their classes page (grades tab)
        if (metadata.classId) navigate(`/classes/${metadata.classId}/grades`);
        else navigate(`/classes`);
      }
    } else if (type === 'announcement') {
      if (isInstructor) {
        if (metadata.classId) navigate(`/classes-instructor/${metadata.classId}/overview`);
        else navigate(`/classes-instructor`);
      } else {
        if (metadata.classId) navigate(`/classes/${metadata.classId}/overview`);
        else navigate(`/classes`);
      }
    }
  };

  const getFilteredNotifications = () => {
    const filtered = filterType === 'all' ? notifications : notifications.filter(n => n.type === filterType);
    return showAll ? filtered : filtered.slice(0, 5);
  };

  const getPriorityColor = (priority: string = 'medium') => {
    switch(priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getNotificationIcon = (type: string) => {
    const iconClasses = "p-1.5 rounded-lg";
    switch(type) {
      case "exam": 
        return <div className={`${iconClasses} bg-blue-100`}><Calendar className="text-blue-600" size={18} /></div>;
      case "grade": 
        return <div className={`${iconClasses} bg-green-100`}><CheckCircle className="text-green-600" size={18} /></div>;
      case "system": 
        return <div className={`${iconClasses} bg-red-100`}><AlertCircle className="text-red-600" size={18} /></div>;
      default: 
        return <div className={`${iconClasses} bg-purple-100`}><Megaphone className="text-purple-600" size={18} /></div>;
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hour(s) ago`;
    return `${Math.floor(diffInSeconds / 86400)} day(s) ago`;
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2.5 rounded-lg transition-all duration-200 ${
          isScrolled
            ? "text-white hover:bg-white/20"
            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        }`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <>
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span>
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-[32rem] max-w-[90vw] bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100"
            style={{ zIndex: 99999 }}
          >
            <div className="bg-gradient-to-r from-[#1A80F6] to-[#4A90E2] text-white px-5 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Bell size={20} />
                  <div>
                    <h3 className="font-semibold text-lg">Notifications</h3>
                    <p className="text-xs text-blue-100 mt-0.5">
                      {unreadCount} unread · {notifications.length} total
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); markAllAsRead(); }}
                      className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Check size={14} />Mark all read
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(false); }}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
                {['all', 'exam', 'grade', 'system', 'announcement'].map((type) => (
                  <button
                    key={type}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFilterType(type); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-all ${
                      filterType === type ? 'bg-white text-[#1A80F6] shadow-md' : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[32rem] overflow-y-auto divide-y divide-gray-100">
              {getFilteredNotifications().length > 0 ? (
                getFilteredNotifications().map((notification) => (
                  <div
                    key={notification.id}
                    className={`relative px-5 py-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
                      !notification.is_read ? 'bg-blue-50/50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {notification.priority && ['critical', 'high'].includes(notification.priority) && (
                      <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 ${getPriorityColor(notification.priority)} rounded-r-full`}></div>
                    )}
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">{getNotificationIcon(notification.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-gray-900 text-sm">{notification.title}</h4>
                              {!notification.is_read && (
                                <span className="bg-[#1A80F6] text-white text-[10px] px-2 py-0.5 rounded-full">New</span>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm mt-1 line-clamp-2">{notification.content}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className="text-xs text-gray-400 whitespace-nowrap">{formatTime(notification.created_at)}</span>
                            <button
                              onClick={(e) => deleteNotification(notification.id, e)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-5 py-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell size={24} className="text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No notifications</p>
                </div>
              )}
            </div>

            {notifications.length > 0 && (
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAll(!showAll); }}
                  className="text-[#1A80F6] text-sm font-medium hover:text-[#0E6AD0] transition-colors flex items-center gap-1"
                >
                  {showAll ? 'Show less' : 'View all notifications'}
                  <ChevronDown size={14} className={`transition-transform ${showAll ? 'rotate-180' : ''}`} />
                </button>
                <button
                  onClick={(e) => { 
                    e.preventDefault(); 
                    e.stopPropagation(); 
                    if (window.confirm('Clear all notifications?')) clearAllNotifications(); 
                  }}
                  className="text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                >
                  <Trash2 size={12} />Clear all
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationDropdown;