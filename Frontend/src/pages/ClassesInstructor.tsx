import Header from '../components/Header';
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  Clock,
  Users,
  FileText,
  Bell,
  Calendar,
  X,
  AlertCircle,
  CheckCircle,
  Info,
  Megaphone,
  TrendingUp,
  Eye,
  Plus,
  BarChart3,
  School,
  Edit,
  Copy,
  Check,
  FileEdit,
  GraduationCap,
  Sparkles,
  Trash2,
  Filter,
  MoreVertical,
  Download,
  Settings,
  ChevronDown,
  Search
} from "lucide-react";
import { classesApi, type ClassType } from "../services/api";

// --- Types ---
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
    studentId?: string;
    incidentId?: number;
    pendingSubmissions?: number;
    pendingReviews?: number;
    version?: string;
    docs?: string;
  };
}

interface Exam {
  id: number;
  name: string;
  date: string;
  duration: string;
  status: "upcoming" | "completed";
}

interface Student {
  id: number;
  name: string;
  studentId: string;
  avgScore: number;
}

interface EditClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EditClassData) => void;
  onDelete?: () => void;
  classData: ClassType | null;
  isLoading?: boolean;
}

interface EditClassData {
  name: string;
  subject: string;
  students: string;
  description: string;
}

// --- Ocean Blue Color Helper Functions ---
const oceanGradients = [
  'bg-gradient-to-r from-[#1A80F6] to-[#4A90E2]', // Bright Blue
  'bg-gradient-to-r from-[#0E6AD0] to-[#3A80D2]', // Deep Blue
  'bg-gradient-to-r from-[#2C8F8F] to-[#4CAF92]', // Teal
  'bg-gradient-to-r from-[#00A8B5] to-[#00C2C7]', // Cyan
  'bg-gradient-to-r from-[#1A5F8F] to-[#2E7DA2]', // Navy Blue
  'bg-gradient-to-r from-[#006994] to-[#2196F3]'   // Ocean Blue
];

const oceanLightGradients = [
  'bg-gradient-to-r from-blue-50 to-cyan-50',
  'bg-gradient-to-r from-sky-50 to-indigo-50',
  'bg-gradient-to-r from-teal-50 to-emerald-50',
  'bg-gradient-to-r from-cyan-50 to-blue-50',
  'bg-gradient-to-r from-sky-50 to-blue-50',
  'bg-gradient-to-r from-blue-50 to-indigo-50'
];

const oceanBorderColors = [
  'border-blue-200',
  'border-indigo-200',
  'border-teal-200',
  'border-cyan-200',
  'border-sky-200',
  'border-blue-200'
];

const oceanTextColors = [
  'text-[#1A80F6]',
  'text-[#0E6AD0]',
  'text-[#2C8F8F]',
  'text-[#00A8B5]',
  'text-[#1A5F8F]',
  'text-[#006994]'
];

const oceanTextGradients = [
  'from-[#1A80F6] to-[#4A90E2]',
  'from-[#0E6AD0] to-[#3A80D2]',
  'from-[#2C8F8F] to-[#4CAF92]',
  'from-[#00A8B5] to-[#00C2C7]',
  'from-[#1A5F8F] to-[#2E7DA2]',
  'from-[#006994] to-[#2196F3]'
];

const getOceanColorIndex = (colorClass: string): number => {
  const index = oceanGradients.findIndex(g => g === colorClass);
  return index !== -1 ? index : 0;
};

const getGradientFromColor = (colorClass: string): string => {
  const index = getOceanColorIndex(colorClass);
  const hoverColors = [
    'hover:from-[#0E6AD0] hover:to-[#3A80D2]',
    'hover:from-[#0A5AB0] hover:to-[#2A70C2]',
    'hover:from-[#1C7F7F] hover:to-[#3C9F82]',
    'hover:from-[#0098A5] hover:to-[#00B2B7]',
    'hover:from-[#0A4F7F] hover:to-[#1E6D92]',
    'hover:from-[#005984] hover:to-[#1186E3]'
  ];
  return `${colorClass} ${hoverColors[index]}`;
};

const getLightColorFromGradient = (gradient: string): string => {
  const index = getOceanColorIndex(gradient);
  return oceanLightGradients[index];
};

const getBorderColorFromGradient = (gradient: string): string => {
  const index = getOceanColorIndex(gradient);
  return oceanBorderColors[index];
};

const getTextGradientFromColor = (gradient: string): string => {
  const index = getOceanColorIndex(gradient);
  return oceanTextGradients[index];
};

const getTextColorFromGradient = (gradient: string): string => {
  const index = getOceanColorIndex(gradient);
  return oceanTextColors[index];
};

const getButtonStylesFromColor = (gradient: string): string => {
  const index = getOceanColorIndex(gradient);
  const buttonStyles = [
    'text-[#1A80F6] border-[#1A80F6] hover:bg-blue-50',
    'text-[#0E6AD0] border-[#0E6AD0] hover:bg-indigo-50',
    'text-[#2C8F8F] border-[#2C8F8F] hover:bg-teal-50',
    'text-[#00A8B5] border-[#00A8B5] hover:bg-cyan-50',
    'text-[#1A5F8F] border-[#1A5F8F] hover:bg-sky-50',
    'text-[#006994] border-[#006994] hover:bg-blue-50'
  ];
  return buttonStyles[index];
};

const getHoverGradientFromColor = (gradient: string): string => {
  const index = getOceanColorIndex(gradient);
  const hoverGradients = [
    'hover:from-[#0E6AD0] hover:to-[#3A80D2]',
    'hover:from-[#0A5AB0] hover:to-[#2A70C2]',
    'hover:from-[#1C7F7F] hover:to-[#3C9F82]',
    'hover:from-[#0098A5] hover:to-[#00B2B7]',
    'hover:from-[#0A4F7F] hover:to-[#1E6D92]',
    'hover:from-[#005984] hover:to-[#1186E3]'
  ];
  return hoverGradients[index];
};

// --- Helper Components ---

const EditClassModal: React.FC<EditClassModalProps> = ({ isOpen, onClose, onSubmit, onDelete, classData, isLoading = false }) => {
  const [formData, setFormData] = useState<EditClassData>({
    name: "",
    subject: "",
    students: "",
    description: ""
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  useEffect(() => {
    if (classData) {
      setFormData({
        name: classData.name,
        subject: classData.subject || "",
        students: classData.students?.toString() || "0",
        description: classData.description || ""
      });
    }
  }, [classData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    if (onDelete) {
      onDelete();
    }
    setShowDeleteConfirm(false);
    onClose();
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`px-6 py-4 flex items-center justify-between ${classData?.color || 'bg-gradient-to-r from-[#1A80F6] to-[#4A90E2]'}`}>
          <div className="flex items-center gap-3 text-white">
            <Edit size={24} />
            <h2 className="text-xl font-bold">Edit Class</h2>
          </div>
          <button 
            title="Close modal"
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
            disabled={isLoading}
          >
            <X size={20} />
          </button>
        </div>

        {showDeleteConfirm ? (
          <div key="delete-confirm" className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Trash2 size={32} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Class?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{classData?.name}"? This action cannot be undone and will remove all associated exams, assignments, and student data.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  title="Cancel deletion"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Confirm delete class"
                  disabled={isLoading}
                >
                  {isLoading ? 'Deleting...' : 'Delete Class'}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form key="edit-form" onSubmit={handleSubmit} className="p-6 space-y-5">
            <div className="space-y-1">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Class Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1A80F6] focus:border-transparent disabled:bg-gray-100"
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1A80F6] focus:border-transparent disabled:bg-gray-100"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="students" className="block text-sm font-medium text-gray-700">
                  Number of Students *
                </label>
                <input
                  type="number"
                  id="students"
                  name="students"
                  required
                  min="1"
                  value={formData.students}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1A80F6] focus:border-transparent disabled:bg-gray-100"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Class Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1A80F6] focus:border-transparent resize-none disabled:bg-gray-100"
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className={`flex-1 ${classData?.color || 'bg-gradient-to-r from-[#1A80F6] to-[#4A90E2]'} text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg ${getHoverGradientFromColor(classData?.color || '')} disabled:opacity-50 disabled:cursor-not-allowed`}
                title="Save changes to class"
                disabled={isLoading}
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
              
              <button
                type="button"
                onClick={handleDeleteClick}
                className="px-5 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Delete this class"
                disabled={isLoading}
              >
                <Trash2 size={18} />
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

// --- Enhanced Notification Dropdown Component ---
const NotificationDropdown = () => {
  const [filterType, setFilterType] = useState<string>("all");
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showAll, setShowAll] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<number | null>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 1,
      type: "exam",
      title: "Midterm Exam Scheduled",
      content: "Software Engineering - Midterm exam scheduled for Oct 15 at 10:00 AM. 38 students enrolled.",
      time: "1 hour ago",
      isRead: false,
      priority: "high",
      metadata: { classId: 1, className: "Software Engineering", examId: 101 }
    },
    {
      id: 2,
      type: "system",
      title: "Flagged Incident Detected",
      content: "Student suspicious behavior detected during Quiz 3 in Computer Networks. Multiple tab switches recorded.",
      time: "3 hours ago",
      isRead: false,
      priority: "critical",
      metadata: { classId: 2, className: "Computer Networks", studentId: "2025045", incidentId: 345 }
    },
    {
      id: 3,
      type: "grade",
      title: "Bulk Grading Complete",
      content: "All 45 submissions for Data Structures Quiz 2 have been automatically graded. 3 flagged for review.",
      time: "1 day ago",
      isRead: true,
      priority: "medium",
      metadata: { classId: 3, className: "Data Structures", examId: 202, pendingReviews: 3 }
    },
    {
      id: 4,
      type: "announcement",
      title: "New Proctoring Features",
      content: "AI-powered behavior analysis and real-time flagging system now available. Update your exam settings.",
      time: "2 days ago",
      isRead: true,
      priority: "low",
      metadata: { version: "2.1.0", docs: "/docs/proctoring" }
    },
    {
      id: 5,
      type: "exam",
      title: "Quiz Submission Reminder",
      content: "Quiz 4 in Software Engineering closes tomorrow at 11:59 PM. 12 students haven't submitted.",
      time: "5 hours ago",
      isRead: false,
      priority: "high",
      metadata: { classId: 1, className: "Software Engineering", pendingSubmissions: 12 }
    },
    {
      id: 6,
      type: "grade",
      title: "Grade Dispute Request",
      content: "Student submitted a grade review request for Midterm Exam - Question 3.",
      time: "6 hours ago",
      isRead: false,
      priority: "medium",
      metadata: { classId: 1, studentId: "2025012", examId: 101 }
    }
  ]);

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Simulate real-time notifications
  useEffect(() => {
    const interval = setInterval(() => {
      const newNotification = getMockNotification();
      if (newNotification) {
        setNotifications(prev => [newNotification, ...prev]);
        
        // Show browser notification if permitted
        if (Notification.permission === 'granted') {
          new Notification('New Notification', {
            body: newNotification.title,
            icon: '/notification-icon.png'
          });
        }
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const getMockNotification = (): NotificationItem | null => {
    const mockNotifications = [
      {
        id: Date.now(),
        type: "exam" as const,
        title: "Exam Started",
        content: "Software Engineering Midterm exam has started. 38 students are currently taking the test.",
        time: "Just now",
        isRead: false,
        priority: "high" as const,
        metadata: { classId: 1, className: "Software Engineering", examId: 101 }
      },
      {
        id: Date.now() + 1,
        type: "system" as const,
        title: "Auto-Proctoring Alert",
        content: "Suspicious activity detected in Computer Networks exam.",
        time: "Just now",
        isRead: false,
        priority: "critical" as const,
        metadata: { classId: 2, className: "Computer Networks", incidentId: 346 }
      }
    ];
    
    return Math.random() > 0.7 ? mockNotifications[Math.floor(Math.random() * mockNotifications.length)] as NotificationItem : null;
  };

  const markAsRead = (notificationId: number) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, isRead: true }))
    );
  };

  const deleteNotification = (notificationId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const clearAllNotifications = () => {
    if (window.confirm('Clear all notifications?')) {
      setNotifications([]);
    }
  };

  const getFilteredNotifications = () => {
    const filtered = filterType === 'all' 
      ? notifications 
      : notifications.filter(n => n.type === filterType);
    return showAll ? filtered : filtered.slice(0, 5);
  };

  const getPriorityColor = (priority: string = 'medium') => {
    switch(priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const getNotificationIcon = (type: string, priority: string = 'medium') => {
    const iconClasses = "p-1.5 rounded-lg";
    switch(type) {
      case "exam":
        return <div className={`${iconClasses} bg-blue-100`}><Calendar className="text-blue-600" size={18} /></div>;
      case "grade":
        return <div className={`${iconClasses} bg-green-100`}><CheckCircle className="text-green-600" size={18} /></div>;
      case "system":
        return <div className={`${iconClasses} bg-red-100`}><AlertCircle className="text-red-600" size={18} /></div>;
      case "announcement":
        return <div className={`${iconClasses} bg-purple-100`}><Megaphone className="text-purple-600" size={18} /></div>;
      default:
        return <div className={`${iconClasses} bg-gray-100`}><Info className="text-gray-600" size={18} /></div>;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative" ref={notificationRef}>
      <button 
        title="Notifications" 
        type="button"
        className="relative p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 group"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowNotifications(!showNotifications);
        }}
      >
        <Bell size={20} className="sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
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
            key="notification-dropdown"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-[32rem] max-w-[90vw] bg-white rounded-xl shadow-2xl z-50 overflow-hidden border border-gray-100"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#1A80F6] to-[#4A90E2] text-white px-5 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Bell size={20} className="animate-[bounce_2s_infinite]" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full"></span>
                  </div>
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
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        markAllAsRead();
                      }}
                      className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                      title="Mark all as read"
                    >
                      <Check size={14} />
                      Mark all read
                    </button>
                  )}
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowNotifications(false);
                    }}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                    title="Close"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              {/* Filter tabs */}
              <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/30">
                {['all', 'exam', 'grade', 'system', 'announcement'].map((type, index) => (
                  <button
                    key={`filter-${type}-${index}`} 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setFilterType(type);
                    }}
                    className={`
                      px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-all
                      ${filterType === type 
                        ? 'bg-white text-[#1A80F6] shadow-md' 
                        : 'bg-white/20 text-white hover:bg-white/30'
                      }
                    `}
                  >
                    {type}
                    {type !== 'all' && (
                      <span className="ml-1.5 px-1.5 py-0.5 bg-white/30 rounded-full text-[10px]">
                        {notifications.filter(n => n.type === type).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Notifications List */}
            <div className="max-h-[32rem] overflow-y-auto divide-y divide-gray-100">
              {getFilteredNotifications().length > 0 ? (
                getFilteredNotifications().map((notification, index) => (
                  <motion.div
                    key={`notification-${notification.id}-${index}`} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`
                      relative px-5 py-4 hover:bg-gray-50 cursor-pointer transition-all duration-200
                      ${!notification.isRead ? 'bg-blue-50/50' : ''}
                      ${selectedNotification === notification.id ? 'bg-blue-100/50' : ''}
                    `}
                    onClick={() => {
                      markAsRead(notification.id);
                      setSelectedNotification(notification.id);
                    }}
                  >
                    {/* Priority indicator */}
                    {notification.priority && ['critical', 'high'].includes(notification.priority) && (
                      <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 ${getPriorityColor(notification.priority)} rounded-r-full`}></div>
                    )}

                    <div className="flex gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type, notification.priority)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-gray-900 text-sm">
                                {notification.title}
                              </h4>
                              {!notification.isRead && (
                                <span className="bg-[#1A80F6] text-white text-[10px] px-2 py-0.5 rounded-full">
                                  New
                                </span>
                              )}
                              {notification.priority === 'critical' && (
                                <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                  <AlertCircle size={10} />
                                  Critical
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                              {notification.content}
                            </p>
                            
                            {/* Metadata */}
                            {notification.metadata && (
                              <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 flex-wrap">
                                {notification.metadata.className && (
                                  <span className="bg-gray-100 px-2 py-0.5 rounded-full">
                                    {notification.metadata.className}
                                  </span>
                                )}
                                {notification.metadata.pendingSubmissions && (
                                  <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">
                                    {notification.metadata.pendingSubmissions} pending
                                  </span>
                                )}
                                {notification.metadata.pendingReviews && (
                                  <span className="bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full">
                                    {notification.metadata.pendingReviews} to review
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className="text-xs text-gray-400 whitespace-nowrap">
                              {notification.time}
                            </span>
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

                        {/* Quick actions */}
                        {!notification.isRead && (
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="text-xs text-[#1A80F6] hover:text-[#0E6AD0] flex items-center gap-1"
                            >
                              <Check size={12} />
                              Mark as read
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div key="no-notifications" className="px-5 py-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bell size={24} className="text-gray-400" />
                  </div>
                  <p className="text-gray-500 font-medium">No notifications</p>
                  <p className="text-gray-400 text-sm mt-1">
                    {filterType !== 'all' 
                      ? `No ${filterType} notifications found` 
                      : 'You\'re all caught up!'}
                  </p>
                  {filterType !== 'all' && (
                    <button
                      onClick={() => setFilterType('all')}
                      className="mt-4 text-[#1A80F6] text-sm hover:text-[#0E6AD0]"
                    >
                      View all notifications
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div key="notification-footer" className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowAll(!showAll);
                  }}
                  className="text-[#1A80F6] text-sm font-medium hover:text-[#0E6AD0] transition-colors flex items-center gap-1"
                  title={showAll ? "Show less" : "View all notifications"}
                >
                  {showAll ? 'Show less' : 'View all notifications'}
                  <ChevronDown size={14} className={`transition-transform ${showAll ? 'rotate-180' : ''}`} />
                </button>
                
                {notifications.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      clearAllNotifications();
                    }}
                    className="text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                    title="Clear all notifications"
                  >
                    <Trash2 size={12} />
                    Clear all
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Generate a random class code
const generateClassCode = (): string => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  let code = '';
  
  for (let i = 0; i < 3; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  code += '-';
  for (let i = 0; i < 4; i++) {
    code += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  
  return code;
};

// --- Main Component ---

const ClassesInstructor = () => {
  const { classId, tab } = useParams<{ classId?: string; tab?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [isEditClassModalOpen, setIsEditClassModalOpen] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{show: boolean, classId: number | null, className: string}>({
    show: false,
    classId: null,
    className: ''
  });
  
  // State for classes from API
  const [instructorClasses, setInstructorClasses] = useState<ClassType[]>([]);

  // Fetch classes from API on component mount
  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await classesApi.getAll();
      console.log('API Response:', data);
      
      const transformedClasses = data.map((cls: any) => ({
        id: cls.id,
        name: cls.name,
        students: Math.floor(Math.random() * 30) + 20,
        activeExams: Math.floor(Math.random() * 5),
        pendingReviews: Math.floor(Math.random() * 10),
        avgScore: Math.floor(Math.random() * 30) + 70,
        color: oceanGradients[cls.id % oceanGradients.length],
        code: cls.code || `CLASS-${String(cls.id).padStart(4, '0')}`,
        subject: cls.subject || "Computer Science",
        description: cls.description || "No description available"
      }));
      
      console.log('Classes keys:', transformedClasses.map(c => ({ id: c.id, name: c.name })));
      
      setInstructorClasses(transformedClasses);
    } catch (error) {
      console.error('Error fetching classes:', error);
      setErrorMessage('Failed to load classes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Check for success message from navigation state
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      window.history.replaceState({}, document.title);
      
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Auto-hide error message after 5 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  // Sample exams data
  const exams: Exam[] = [
    { id: 1, name: "Midterm Exam", date: "2025-10-15", duration: "120 min", status: "upcoming" },
    { id: 2, name: "Quiz 3", date: "2025-11-18", duration: "60 min", status: "upcoming" },
    { id: 3, name: "Quiz 3", date: "2025-11-18", duration: "60 min", status: "completed" }
  ];

  // Sample students data
  const students: Student[] = [
    { id: 1, name: "Student 1", studentId: "2025001", avgScore: 86 },
    { id: 2, name: "Student 2", studentId: "2025002", avgScore: 91 },
    { id: 3, name: "Student 3", studentId: "2025003", avgScore: 76 },
    { id: 4, name: "Student 4", studentId: "2025004", avgScore: 82 },
    { id: 5, name: "Student 5", studentId: "2025005", avgScore: 73 }
  ];

  const selectedClass = classId ? instructorClasses.find(cls => cls.id === parseInt(classId)) : null;
  const activeTab = tab || "overview";

  useEffect(() => {
    if (classId && !selectedClass && !isLoading) {
      navigate("/classes-instructor");
    }
  }, [classId, selectedClass, navigate, isLoading]);

  const handleClassClick = (cls: ClassType) => {
    navigate(`/classes-instructor/${cls.id}/overview`);
  };

  const handleTabChange = (newTab: string) => {
    if (selectedClass) {
      navigate(`/classes-instructor/${selectedClass.id}/${newTab}`);
    }
  };

  const handleBackToList = () => {
    navigate("/classes-instructor");
  };

  const handleEditClassClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditClassModalOpen(true);
  };

const handleEditClassSubmit = async (data: EditClassData) => {
  if (selectedClass) {
    setIsSubmitting(true);
    try {
      // 1. تحديث الكلاس في الـ API
      await classesApi.update(selectedClass.id, {
        name: data.name,
        subject: data.subject,
        students: parseInt(data.students),
        description: data.description
      });
      

      const updatedClasses = await classesApi.getAll();
      console.log('Updated API Response:', updatedClasses);
      

      const transformedClasses = updatedClasses.map((cls: any) => ({
        id: cls.id,
        name: cls.name,
        students: Math.floor(Math.random() * 30) + 20,
        activeExams: Math.floor(Math.random() * 5),
        pendingReviews: Math.floor(Math.random() * 10),
        avgScore: Math.floor(Math.random() * 30) + 70,
        color: oceanGradients[cls.id % oceanGradients.length],
        code: cls.code || `CLASS-${String(cls.id).padStart(4, '0')}`,
        subject: cls.subject || data.subject,
        description: cls.description || data.description
      }));
      
      console.log('Transformed classes after update:', transformedClasses);
      

      setInstructorClasses(transformedClasses);
      
    
      setIsEditClassModalOpen(false);
      setSuccessMessage('Class updated successfully!');
      
    } catch (error) {
      console.error('Error updating class:', error);
      setErrorMessage('Failed to update class. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }
};

  const handleDeleteClass = (classId: number, className: string) => {
    setDeleteConfirmation({
      show: true,
      classId,
      className
    });
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmation.classId) {
      setIsSubmitting(true);
      try {
        await classesApi.delete(deleteConfirmation.classId);
        
        if (selectedClass && selectedClass.id === deleteConfirmation.classId) {
          navigate("/classes-instructor");
        }
        
        setInstructorClasses(prev => prev.filter(cls => cls.id !== deleteConfirmation.classId));
        setSuccessMessage(`Class "${deleteConfirmation.className}" deleted successfully!`);
      } catch (error) {
        console.error('Error deleting class:', error);
        setErrorMessage('Failed to delete class. Please try again.');
      } finally {
        setIsSubmitting(false);
        setDeleteConfirmation({ show: false, classId: null, className: '' });
      }
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmation({ show: false, classId: null, className: '' });
  };

  const handleCreateClassClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate('/create-class');
  };
  
  const handleCreateExam = (e: React.MouseEvent, classId?: number) => {
    e.preventDefault();
    e.stopPropagation();
    if (classId) {
      navigate(`/CreateExam?classId=${classId}`);
    } else {
      navigate('/CreateExam');
    }
  };
  
  const handleEditExam = (examId: number) => {
    navigate(`/edit-exam/${examId}`);
  };
  
  const handleViewResults = (examId: number) => {
    navigate(`/exam-results/${examId}`);
  };
  
  const handleViewProfile = (studentId: string) => {
    navigate(`/instructor/student-profile/${studentId}`);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Tab Components
  const OverviewTab = ({ cls }: { cls: ClassType }) => (
    <div className="space-y-6">
      {/* Class Code Section */}
      <div className={`${getLightColorFromGradient(cls.color)} p-5 rounded-xl border ${getBorderColorFromGradient(cls.color)}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full ${cls.color} flex items-center justify-center text-white shadow-lg`}>
              <School size={24} />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Class Code</h3>
              <div className="flex items-center gap-2">
                <p className={`text-3xl font-mono font-bold bg-gradient-to-r ${getTextGradientFromColor(cls.color)} bg-clip-text text-transparent`}>
                  {cls.code}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => handleCopyCode(cls.code)}
            className={`flex items-center gap-2 bg-white hover:bg-opacity-90 px-5 py-2.5 rounded-lg border transition-all duration-200 shadow-sm hover:shadow ${getButtonStylesFromColor(cls.color)}`}
            title={copiedCode === cls.code ? "Copied!" : "Copy class code"}
          >
            {copiedCode === cls.code ? (
              <>
                <Check size={18} className="text-green-600" />
                <span className="font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={18} />
                <span className="font-medium">Copy Code</span>
              </>
            )}
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-3 ml-16">
          Share this code with students to join your class
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Next Exam Section */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-xl border border-blue-200 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Calendar className="text-[#1A80F6]" size={20} />
            </div>
            <h3 className="font-semibold text-gray-800">Next Exam</h3>
          </div>
          <p className="text-gray-800 font-medium text-lg">Midterm Exam</p>
          <p className="text-gray-600 text-sm mt-1">October 15, 2025 · 10:00 AM</p>
          <button 
            type="button"
            className={`mt-4 text-sm font-medium flex items-center gap-1 group ${getTextColorFromGradient(cls.color)}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleTabChange("exams");
            }}
            title="View all exams"
          >
            View all exams 
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>

        {/* Number of Students Section */}
        <div className={`${getLightColorFromGradient(cls.color)} p-5 rounded-xl border ${getBorderColorFromGradient(cls.color)} hover:shadow-md transition-shadow`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-full ${getLightColorFromGradient(cls.color)} flex items-center justify-center`}>
              <Users className={getTextColorFromGradient(cls.color)} size={20} />
            </div>
            <h3 className="font-semibold text-gray-800">Enrolled Students</h3>
          </div>
          <p className="text-3xl font-bold text-gray-800 mb-1">{cls.students}</p>
          <p className="text-gray-600 text-sm">Active: {Math.floor(cls.students * 0.85)} students · 92% attendance</p>
          <button 
            type="button"
            className={`mt-4 ${getTextColorFromGradient(cls.color)} hover:${getTextColorFromGradient(cls.color)} text-sm font-medium flex items-center gap-1 group`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleTabChange("students");
            }}
            title="View all students"
          >
            View all students
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full ${getLightColorFromGradient(cls.color)} flex items-center justify-center`}>
              <BookOpen size={16} className={getTextColorFromGradient(cls.color)} />
            </div>
            <h3 className="font-semibold text-gray-800 text-lg">Course Description</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleEditClassClick}
              className={`flex items-center gap-2 ${cls.color} text-white px-4 py-2 rounded-lg ${getHoverGradientFromColor(cls.color)} transition-all duration-200 shadow-md hover:shadow-lg`}
              title="Edit class details"
            >
              <Edit size={16} />
              <span className="font-medium">Edit Class</span>
            </button>
            <button
              onClick={() => handleDeleteClass(cls.id, cls.name)}
              className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg"
              title="Delete this class"
            >
              <Trash2 size={16} />
              <span className="font-medium">Delete</span>
            </button>
          </div>
        </div>
        <p className="text-gray-600 leading-relaxed">
          {cls.description || "No description provided."}
        </p>
        {cls.subject && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <span className="text-sm font-medium text-gray-500">Subject:</span>
            <span className="ml-2 text-gray-800">{cls.subject}</span>
          </div>
        )}
      </div>
    </div>
  );

  const StudentsTab = ({ students }: { students: Student[] }) => (
    <div className="space-y-4">
      {students.map((student, index) => (
        <div key={`student-${student.id}-${index}`} className="bg-white border p-4 rounded-lg shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full ${selectedClass?.color || 'bg-gradient-to-r from-[#1A80F6] to-[#4A90E2]'} flex items-center justify-center text-white font-bold shadow-md`}>
              S{student.id}
            </div>
            <div>
              <h4 className="font-semibold text-gray-800">{student.name}</h4>
              <p className="text-gray-500 text-sm">ID: {student.studentId}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Avg Score</p>
              <p className="text-xl font-bold text-gray-800">{student.avgScore}%</p>
            </div>
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleViewProfile(student.studentId);
              }}
              className={`${selectedClass?.color || 'bg-gradient-to-r from-[#1A80F6] to-[#4A90E2]'} text-white px-4 py-2 rounded-lg ${getHoverGradientFromColor(selectedClass?.color || '')} transition-all duration-200 shadow-md hover:shadow-lg`}
              title={`View ${student.name}'s profile`}
            >
              View Profile
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const ExamsTab = ({ exams }: { exams: Exam[] }) => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-800 text-lg">Manage Exams</h3>
        <button 
          type="button"
          onClick={(e) => handleCreateExam(e, selectedClass?.id)}
          className={`${selectedClass?.color || 'bg-gradient-to-r from-[#1A80F6] to-[#4A90E2]'} text-white px-5 py-2.5 rounded-lg ${getHoverGradientFromColor(selectedClass?.color || '')} transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg`}
          title="Create a new exam"
        >
          <Plus size={18} />
          <span className="font-medium">Create New Exam</span>
        </button>
      </div>
      {exams.map((exam, index) => (
        <div key={`exam-${exam.id}-${index}`} className="bg-white border p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-semibold text-gray-800 text-lg">{exam.name}</h4>
              <div className="text-gray-600 text-sm flex gap-4 mt-2">
                <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                  <Calendar size={14} className="text-gray-500" />
                  {exam.date}
                </span>
                <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                  <Clock size={14} className="text-gray-500" />
                  {exam.duration}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {exam.status === "upcoming" ? (
                <>
                  <span className="px-3 py-1 bg-blue-100 text-[#1A80F6] rounded-full text-sm font-medium">
                    Upcoming
                  </span>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleEditExam(exam.id);
                    }}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                    title={`Edit ${exam.name}`}
                  >
                    <FileEdit size={16} />
                    Edit
                  </button>
                </>
              ) : (
                <>
                  <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm font-medium">
                    Completed
                  </span>
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleViewResults(exam.id);
                    }}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
                    title={`View results for ${exam.name}`}
                  >
                    <BarChart3 size={16} />
                    View Results
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const ProctoringTab = () => (
    <div className="space-y-4">
      <div key="proctoring-flagged" className="bg-gradient-to-br from-red-50 to-orange-50 p-5 rounded-xl border border-red-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="text-red-600" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 text-lg mb-1">Flagged Incidents</h3>
            <p className="text-gray-600 mb-3">8 incidents require review</p>
          
            <button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                navigate('/review-incidents');
              }}
              className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-5 py-2.5 rounded-lg hover:from-red-700 hover:to-orange-700 transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
              title="Review flagged incidents"
            >
              <Eye size={18} />
              Review Incidents
            </button>
          </div>
        </div>
      </div>

      <div key="proctoring-live" className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border border-green-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <Eye className="text-green-600" size={24} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 text-lg mb-1">Live Monitoring</h3>
            <p className="text-gray-600 mb-3">1 active exam with 12 students</p>
            <button 
              onClick={() => navigate('/live-proctoring')}
              className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 py-2.5 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"
              title="Start live proctoring"
            >
              <Eye size={18} />
              Monitor Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const AnalyticsTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div key="analytics-avg-score" className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-200 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <TrendingUp className="text-[#1A80F6]" size={24} />
          </div>
          <h3 className="text-sm font-medium text-gray-600">Average Score</h3>
        </div>
        <p className="text-4xl font-bold text-[#1A80F6]">78%</p>
        <p className="text-sm text-gray-500 mt-2">↑ 5% from last exam</p>
      </div>

      <div key="analytics-pass-rate" className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="text-green-600" size={24} />
          </div>
          <h3 className="text-sm font-medium text-gray-600">Pass Rate</h3>
        </div>
        <p className="text-4xl font-bold text-green-600">92%</p>
        <p className="text-sm text-gray-500 mt-2">35 out of 38 students</p>
      </div>

      <div key="analytics-cheating-reports" className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-xl border border-red-200 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="text-red-600" size={24} />
          </div>
          <h3 className="text-sm font-medium text-gray-600">Cheating Reports</h3>
        </div>
        <p className="text-4xl font-bold text-red-600">3</p>
        <p className="text-sm text-gray-500 mt-2">2 pending review</p>
      </div>
    </div>
  );

  const renderTabContent = () => {
    if (!selectedClass) return null;

    switch (activeTab) {
      case "overview":
        return <OverviewTab key={`overview-${selectedClass.id}`} cls={selectedClass} />;
      case "students":
        return <StudentsTab key={`students-${selectedClass.id}`} students={students} />;
      case "exams":
        return <ExamsTab key={`exams-${selectedClass.id}`} exams={exams} />;
      case "proctoring":
        return <ProctoringTab key={`proctoring-${selectedClass.id}`} />;
      case "analytics":
        return <AnalyticsTab key={`analytics-${selectedClass.id}`} />;
      default:
        return <OverviewTab key={`overview-${selectedClass.id}`} cls={selectedClass} />;
    }
  };

  const ClassDetails = () => {
    if (!selectedClass) return null;

    return (
      <div key={`class-details-${selectedClass.id}`} className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{selectedClass.name}</h2>
            <p className="text-gray-600 mt-1">Dr. Ahmed Hassan</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-3 py-1 ${getLightColorFromGradient(selectedClass.color)} ${getTextColorFromGradient(selectedClass.color)} rounded-full text-sm font-medium`}>
                {selectedClass.subject}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={(e) => handleCreateExam(e, selectedClass.id)}
              className={`${selectedClass.color} text-white px-5 py-2.5 rounded-lg ${getHoverGradientFromColor(selectedClass.color)} transition-all duration-200 flex items-center gap-2 shadow-lg`}
              title="Create a new exam for this class"
            >
              <Sparkles size={18} />
              <span className="font-semibold">Create Exam</span>
            </button>
            <button 
              type="button"
              onClick={handleBackToList}
              className="bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
              title="Back to classes list"
            >
              ← Back
            </button>
          </div>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: "overview", label: "Overview", icon: BookOpen },
            { id: "students", label: "Students", icon: Users },
            { id: "exams", label: "Exams", icon: FileText },
            { id: "proctoring", label: "Proctoring", icon: Eye },
            { id: "analytics", label: "Analytics", icon: TrendingUp },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleTabChange(id);
              }}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold whitespace-nowrap transition-all duration-200 ${
                activeTab === id 
                  ? selectedClass.color + ' text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={`View ${label.toLowerCase()}`}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        {renderTabContent()}
      </div>
    );
  };

  const ClassesList = () => {
    if (isLoading) {
      return (
        <div key="loading-state" className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 border-4 border-[#1A80F6] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading classes...</p>
        </div>
      );
    }

    if (errorMessage) {
      return (
        <div key="error-state" className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">Failed to Load Classes</h3>
          <p className="text-gray-600 mb-4">{errorMessage}</p>
          <button
            onClick={fetchClasses}
            className="bg-gradient-to-r from-[#1A80F6] to-[#4A90E2] text-white px-6 py-3 rounded-lg hover:from-[#0E6AD0] hover:to-[#3A80D2] transition-all duration-200"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (instructorClasses.length === 0) {
      return (
        <div key="empty-state" className="bg-white rounded-xl shadow-lg p-12 text-center">
          <School size={64} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">No Classes Yet</h3>
          <p className="text-gray-600 mb-6">Get started by creating your first class</p>
          <button
            onClick={handleCreateClassClick}
            className="bg-gradient-to-r from-[#1A80F6] to-[#4A90E2] text-white px-6 py-3 rounded-lg hover:from-[#0E6AD0] hover:to-[#3A80D2] transition-all duration-200 flex items-center gap-2 mx-auto"
          >
            <Plus size={20} />
            Create Your First Class
          </button>
        </div>
      );
    }

    return (
      <div key="classes-list" className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {instructorClasses.map((cls) => (
          <motion.div
            key={`class-${cls.id}-${cls.code}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:scale-[1.02]"
          >
            <div className={`h-2 ${cls.color}`}></div>

            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{cls.name}</h3>
                  <div className="flex items-center gap-2 text-gray-600 text-sm bg-gray-50 px-3 py-1.5 rounded-lg">
                    <School size={14} />
                    <span className="font-mono font-medium">{cls.code}</span>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleCopyCode(cls.code);
                      }}
                      className="text-gray-500 hover:text-gray-700 ml-1"
                      title={copiedCode === cls.code ? "Copied!" : "Copy class code"}
                    >
                      {copiedCode === cls.code ? (
                        <Check size={14} className="text-green-600" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDeleteClass(cls.id, cls.name);
                  }}
                  className="text-gray-400 hover:text-red-600 transition-colors p-1"
                  title={`Delete ${cls.name}`}
                  aria-label={`Delete class ${cls.name}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-gray-600">
                    <Users size={16} /> Students
                  </span>
                  <span className="font-semibold text-gray-900">{cls.students}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-gray-600">
                    <FileText size={16} /> Active Exams
                  </span>
                  <span className="font-semibold text-green-600">{cls.activeExams}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-gray-600">
                    <AlertCircle size={16} /> Pending Reviews
                  </span>
                  <span className="font-semibold text-red-600">{cls.pendingReviews}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-gray-600">
                    <BarChart3 size={16} /> Avg Score
                  </span>
                  <span className={`font-semibold ${getTextColorFromGradient(cls.color)}`}>{cls.avgScore}%</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button 
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleClassClick(cls);
                  }}
                  className={`flex-1 py-2.5 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg text-white ${getGradientFromColor(cls.color)}`}
                  title={`Manage ${cls.name}`}
                >
                  Manage Class
                </button>
                <button 
                  type="button"
                  onClick={(e) => handleCreateExam(e, cls.id)}
                  className={`${cls.color} text-white px-4 py-2.5 rounded-lg font-semibold ${getHoverGradientFromColor(cls.color)} transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg`}
                  title={`Create exam for ${cls.name}`}
                >
                  <Plus size={18} />
                  <span className="ml-1 hidden sm:inline">Exam</span>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  // Delete Confirmation Modal
  const DeleteConfirmationModal = () => {
    if (!deleteConfirmation.show) return null;

    return (
      <div key="delete-confirmation-modal" className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          onClick={handleDeleteCancel}
        />

        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 py-5 bg-gradient-to-r from-red-600 to-red-700 text-white">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Trash2 size={24} />
              Delete Class
            </h2>
          </div>

          <div className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <AlertCircle size={40} className="text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Are you absolutely sure?</h3>
              <p className="text-gray-600 mb-2">
                This will permanently delete <span className="font-bold text-red-600">"{deleteConfirmation.className}"</span>.
              </p>
              <p className="text-gray-500 text-sm mb-6">
                This action cannot be undone. All exams, assignments, student submissions, and class data will be lost.
              </p>
              
              <div className="flex gap-3 w-full">
                <button
                  type="button"
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                  title="Cancel deletion"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Confirm delete class"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Deleting...' : 'Yes, Delete Class'}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  return (
    <div className="w-full pt-20 min-h-screen bg-gradient-to-br from-[#E3F0FE] to-[#F0F7FF]">
      <div className="min-h-screen p-6">
        <Header fixed={true} showAccount={true} isRegistered={true} userType="instructor" />

        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div key="page-header" className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 sm:p-6 mb-6 border border-white/50">
            <div className="flex flex-col gap-4">
              {/* Top Row */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#1A80F6] to-[#4A90E2] flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    I
                  </div>

                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#1A80F6] to-[#4A90E2] bg-clip-text text-transparent">
                      My Classes
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600">Welcome back, Dr. Ahmed Hassan</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <NotificationDropdown />
                  {!selectedClass && (
                    <button 
                      type="button"
                      onClick={handleCreateClassClick}
                      className="bg-gradient-to-r from-[#1A80F6] to-[#4A90E2] text-white px-4 sm:px-5 py-2.5 rounded-lg hover:from-[#0E6AD0] hover:to-[#3A80D2] transition-all duration-200 flex items-center gap-2 text-sm sm:text-base shadow-lg shadow-blue-500/30"
                      title="Create a new class"
                    >
                      <Plus size={18} />
                      <span className="hidden sm:inline font-semibold">Create Class</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Success Message */}
          <AnimatePresence mode="wait">
            {successMessage && (
              <motion.div
                key="success-message"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6 bg-green-50 border border-green-200 text-green-700 px-5 py-4 rounded-lg flex items-center justify-between shadow-md"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle size={20} className="text-green-600" />
                  <span className="font-medium">{successMessage}</span>
                </div>
                <button 
                  onClick={() => setSuccessMessage(null)} 
                  className="text-green-600 hover:text-green-800"
                  title="Dismiss message"
                >
                  <X size={18} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          <AnimatePresence mode="wait">
            {errorMessage && (
              <motion.div
                key="error-message"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-6 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-lg flex items-center justify-between shadow-md"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle size={20} className="text-red-600" />
                  <span className="font-medium">{errorMessage}</span>
                </div>
                <button 
                  onClick={() => setErrorMessage(null)} 
                  className="text-red-600 hover:text-red-800"
                  title="Dismiss message"
                >
                  <X size={18} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content */}
          {selectedClass ? <ClassDetails /> : <ClassesList />}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence mode="wait">
        {isEditClassModalOpen && selectedClass && (
          <EditClassModal 
            key={`edit-modal-${selectedClass.id}`}
            isOpen={isEditClassModalOpen} 
            onClose={() => setIsEditClassModalOpen(false)} 
            onSubmit={handleEditClassSubmit} 
            onDelete={() => handleDeleteClass(selectedClass.id, selectedClass.name)}
            classData={selectedClass}
            isLoading={isSubmitting}
          />
        )}
        
        <DeleteConfirmationModal key="delete-modal" />
      </AnimatePresence>
    </div>
  );
};

// Add global styles for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes bounce-slow {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-2px); }
  }
  .animate-bounce-slow {
    animation: bounce-slow 2s infinite;
  }
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .scrollbar-thin::-webkit-scrollbar {
    height: 2px;
  }
  .scrollbar-thin::-webkit-scrollbar-track {
    background: rgba(255,255,255,0.1);
  }
  .scrollbar-thin::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.3);
    border-radius: 10px;
  }
`;
document.head.appendChild(style);

export default ClassesInstructor;