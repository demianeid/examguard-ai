import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Calendar,
  CheckCircle,
  AlertCircle,
  Megaphone,
  X,
  Check,
  ChevronDown,
  Trash2
} from 'lucide-react';

interface NotificationItem {
  id: number;
  type: "exam" | "grade" | "system" | "announcement";
  title: string;
  content: string;
  time: string;
  isRead: boolean;
  priority?: "low" | "medium" | "high" | "critical";
  metadata?: {
    classId?: number;
    className?: string;
    examId?: number;
    assignmentId?: number;
    studentId?: string;
    incidentId?: number;
    score?: number;
    maxScore?: number;
    percentage?: number;
    classAverage?: number;
    examTime?: string;
    examDate?: string;
    duration?: string;
    deadline?: string;
    submissionsStatus?: string;
    feedback?: string;
    instructor?: string;
    originalTime?: string;
    newTime?: string;
    type?: string;
    estimatedTime?: string;
    resources?: number;
    severity?: string;
    maintenanceStart?: string;
    startsIn?: string;
  };
}

const NotificationDropdown: React.FC = () => {
  const [filterType, setFilterType] = useState<string>("all");
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showAll, setShowAll] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { 
      id: 1, 
      type: "exam", 
      title: "Midterm Exam Scheduled", 
      content: "Software Engineering - Midterm exam scheduled for Oct 15 at 10:00 AM.", 
      time: "1 hour ago", 
      isRead: false, 
      priority: "high", 
      metadata: { classId: 1, className: "Software Engineering", examId: 101 } 
    },
    { 
      id: 2, 
      type: "system", 
      title: "Flagged Incident Detected", 
      content: "Student suspicious behavior detected during Quiz 3 in Computer Networks.", 
      time: "3 hours ago", 
      isRead: false, 
      priority: "critical", 
      metadata: { classId: 2, className: "Computer Networks", studentId: "2025045", incidentId: 345 } 
    },
    { 
      id: 3, 
      type: "grade", 
      title: "Bulk Grading Complete", 
      content: "All 45 submissions for Data Structures Quiz 2 have been automatically graded.", 
      time: "1 day ago", 
      isRead: true, 
      priority: "medium", 
      metadata: { classId: 3, className: "Data Structures", examId: 202 } 
    },
  ]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) && 
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const deleteNotification = (id: number, e: React.MouseEvent) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    setNotifications(prev => prev.filter(n => n.id !== id));
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

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        title="Notifications"
        type="button"
        className="relative p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 group"
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <Bell size={20} className="group-hover:scale-110 transition-transform" />
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
        {showNotifications && (
          <motion.div
            ref={dropdownRef}
            key="notification-dropdown"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-[32rem] max-w-[90vw] bg-white rounded-xl shadow-2xl z-[9999] overflow-hidden border border-gray-100"
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
                    title='Close'
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowNotifications(false); }}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
                {['all', 'exam', 'grade', 'system', 'announcement'].map((type) => (
                  <button
                    key={`filter-${type}`}
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
                getFilteredNotifications().map((notification, index) => (
                  <motion.div
                    key={`notification-${notification.id}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`relative px-5 py-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${
                      !notification.isRead ? 'bg-blue-50/50' : ''
                    }`}
                    onClick={() => { markAsRead(notification.id); setSelectedNotification(notification.id); }}
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
                              {!notification.isRead && (
                                <span className="bg-[#1A80F6] text-white text-[10px] px-2 py-0.5 rounded-full">New</span>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm mt-1 line-clamp-2">{notification.content}</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className="text-xs text-gray-400 whitespace-nowrap">{notification.time}</span>
                            <button
                              title="Delete notification"
                              type="button"
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              onClick={(e) => deleteNotification(notification.id, e)}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
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
                  type="button"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAll(!showAll); }}
                  className="text-[#1A80F6] text-sm font-medium hover:text-[#0E6AD0] transition-colors flex items-center gap-1"
                >
                  {showAll ? 'Show less' : 'View all notifications'}
                  <ChevronDown size={14} className={`transition-transform ${showAll ? 'rotate-180' : ''}`} />
                </button>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (window.confirm('Clear all notifications?')) setNotifications([]); }}
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