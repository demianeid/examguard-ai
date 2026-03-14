import Header from '../components/Header';
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  Clock,
  Users,
  FileText,
  Bell,
  Calendar,
  Award,
  X,
  AlertCircle,
  CheckCircle,
  Info,
  Megaphone,
  School,
  TrendingUp,
  Copy,
  Check,
  Sparkles,
  ChevronDown,
  Trash2,
  LogOut
} from "lucide-react";

// --- Types ---
interface ClassType {
  id: number;
  name: string;
  instructor: string;
  upcomingExams: number;
  progress: number;
  lastActivity: string;
  color: string;
  code?: string;
  subject?: string;
  description?: string;
}

interface Exam {
  id: number;
  name: string;
  date: string;
  duration: string;
  status: "upcoming" | "completed";
  score: number | null;
}

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

// --- Ocean Blue Color Helper Functions (Same as Instructor) ---
const oceanGradients = [
  'from-[#1A80F6] to-[#4A90E2]',
  'from-[#0E6AD0] to-[#3A80D2]',
  'from-[#2C8F8F] to-[#4CAF92]',
  'from-[#00A8B5] to-[#00C2C7]',
  'from-[#1A5F8F] to-[#2E7DA2]',
  'from-[#006994] to-[#2196F3]'
];

const oceanLightGradients = [
  'from-blue-50 to-cyan-50',
  'from-sky-50 to-indigo-50',
  'from-teal-50 to-emerald-50',
  'from-cyan-50 to-blue-50',
  'from-sky-50 to-blue-50',
  'from-blue-50 to-indigo-50'
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

const getOceanColorIndex = (colorClass: string): number => {
  const gradient = colorClass.replace('bg-gradient-to-r ', '');
  const index = oceanGradients.findIndex(g => g === gradient);
  return index !== -1 ? index : 0;
};

const getLightColorFromGradient = (gradient: string): string => {
  const index = getOceanColorIndex(gradient);
  return `bg-gradient-to-r ${oceanLightGradients[index]}`;
};

const getBorderColorFromGradient = (gradient: string): string => {
  const index = getOceanColorIndex(gradient);
  return oceanBorderColors[index];
};

const getTextColorFromGradient = (gradient: string): string => {
  const index = getOceanColorIndex(gradient);
  return oceanTextColors[index];
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

const ClassesStudent = () => {
  const { classId, tab } = useParams<{ classId?: string; tab?: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showAll, setShowAll] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<number | null>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const [studentClasses, setStudentClasses] = useState<ClassType[]>([]);
  const [joinMessage, setJoinMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [leaveConfirm, setLeaveConfirm] = useState<ClassType | null>(null);
  const [leaveLoading, setLeaveLoading] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 1,
      type: "exam",
      title: "Upcoming Exam Tomorrow",
      content: "Data Structures & Algorithms - Midterm Exam tomorrow at 10:00 AM. Duration: 120 minutes.",
      time: "2 hours ago",
      isRead: false,
      priority: "high",
      metadata: {
        classId: 1,
        className: "Data Structures & Algorithms",
        examId: 101,
        examTime: "10:00 AM",
        examDate: "2025-10-15",
        duration: "120 min"
      }
    },
    {
      id: 2,
      type: "grade",
      title: "New Grade Posted",
      content: "Your Quiz 2 score: 85/100 (85%). Class average: 78%.",
      time: "5 hours ago",
      isRead: false,
      priority: "medium",
      metadata: {
        classId: 1,
        className: "Data Structures & Algorithms",
        examId: 102,
        score: 85,
        maxScore: 100,
        percentage: 85,
        classAverage: 78
      }
    },
    {
      id: 3,
      type: "system",
      title: "Camera Check Required",
      content: "Please verify your camera and microphone before the next exam. System check takes 2 minutes.",
      time: "1 day ago",
      isRead: true,
      priority: "medium",
      metadata: {
        type: "device_check",
        estimatedTime: "2 min"
      }
    },
    {
      id: 4,
      type: "announcement",
      title: "Office Hours Changed",
      content: "Dr. Ahmed Hassan's office hours moved to Thursday 2:00 PM - 4:00 PM this week.",
      time: "2 days ago",
      isRead: true,
      priority: "low",
      metadata: {
        classId: 1,
        className: "Data Structures & Algorithms",
        instructor: "Dr. Ahmed Hassan",
        originalTime: "Tuesday 2-4 PM",
        newTime: "Thursday 2-4 PM"
      }
    },
    {
      id: 5,
      type: "exam",
      title: "Quiz 3 Reminder",
      content: "Database Systems - Quiz 3 closes tomorrow at 11:59 PM. Don't forget to submit!",
      time: "1 day ago",
      isRead: false,
      priority: "high",
      metadata: {
        classId: 2,
        className: "Database Systems",
        examId: 203,
        deadline: "11:59 PM",
        submissionsStatus: "not_submitted"
      }
    },
    {
      id: 6,
      type: "grade",
      title: "Assignment Feedback Available",
      content: "Your Database Design assignment feedback is now available. Grade: 92/100.",
      time: "3 days ago",
      isRead: false,
      priority: "medium",
      metadata: {
        classId: 2,
        className: "Database Systems",
        assignmentId: 301,
        score: 92,
        maxScore: 100,
        feedback: "Excellent work on normalization!"
      }
    },
    {
      id: 7,
      type: "system",
      title: "Exam Security Alert",
      content: "Multiple tab switching detected during Quiz 2. Please ensure you stay in the exam window.",
      time: "1 week ago",
      isRead: true,
      priority: "critical",
      metadata: {
        classId: 1,
        className: "Data Structures & Algorithms",
        examId: 102,
        incidentId: 456,
        severity: "warning"
      }
    },
    {
      id: 8,
      type: "announcement",
      title: "Study Materials Added",
      content: "New practice problems and solutions added for the upcoming midterm exam.",
      time: "4 days ago",
      isRead: false,
      priority: "medium",
      metadata: {
        classId: 1,
        className: "Data Structures & Algorithms",
        resources: 5,
        type: "practice_problems"
      }
    }
  ]);

  const selectedClass = classId ? studentClasses.find(cls => cls.id === parseInt(classId)) : null;
  const activeTab = tab || "overview";

  const fetchMyClasses = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/student/classes/', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
      });
      if (!res.ok) throw new Error('Failed to fetch classes');
      const data = await res.json();
      const mapped: ClassType[] = data.map((cls: any, index: number) => ({
        id: cls.id,
        name: cls.name,
        instructor: cls.instructor || '',
        upcomingExams: cls.upcoming_exams ?? 0,
        progress: cls.progress ?? 0,
        lastActivity: cls.last_activity || '',
        color: `bg-gradient-to-r ${oceanGradients[index % oceanGradients.length]}`,
        code: cls.code || '',
        subject: cls.subject || '',
        description: cls.description || '',
      }));
      setStudentClasses(mapped);
    } catch {
      setStudentClasses([]);
    }
  };

  useEffect(() => {
    fetchMyClasses();
  }, []);

  useEffect(() => {
    const preventButtonSubmit = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest('button');
      if (button && !button.hasAttribute('type')) {
        button.setAttribute('type', 'button');
      }
    };
    document.addEventListener('click', preventButtonSubmit, true);
    return () => {
      document.removeEventListener('click', preventButtonSubmit, true);
    };
  }, []);

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

  useEffect(() => {
    const interval = setInterval(() => {
      const newNotification = getMockNotification();
      if (newNotification) {
        setNotifications(prev => [newNotification, ...prev]);
        if (Notification.permission === 'granted') {
          new Notification('New Notification', {
            body: newNotification.title,
            icon: '/notification-icon.png',
            badge: '/notification-badge.png'
          });
        }
        const audio = new Audio('/notification.mp3');
        audio.volume = 0.3;
        audio.play().catch(() => {});
      }
    }, 45000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (classId && !selectedClass) {
      navigate("/classes");
    }
  }, [classId, selectedClass, navigate]);

  const getMockNotification = (): NotificationItem | null => {
    const mockNotifications = [
      {
        id: Date.now(),
        type: "exam" as const,
        title: "Exam Starting Soon",
        content: "Web Development Quiz starts in 15 minutes. Get ready!",
        time: "Just now",
        isRead: false,
        priority: "high" as const,
        metadata: { classId: 3, className: "Web Development", examId: 304, startsIn: "15 min" }
      },
      {
        id: Date.now() + 1,
        type: "grade" as const,
        title: "Grade Released",
        content: "Your Operating Systems Quiz 1 grade is now available.",
        time: "Just now",
        isRead: false,
        priority: "medium" as const,
        metadata: { classId: 4, className: "Operating Systems", examId: 405, score: 88, maxScore: 100 }
      },
      {
        id: Date.now() + 2,
        type: "system" as const,
        title: "System Maintenance",
        content: "Scheduled maintenance tonight at 2 AM. Platform may be unavailable for 30 minutes.",
        time: "Just now",
        isRead: false,
        priority: "low" as const,
        metadata: { maintenanceStart: "2:00 AM", duration: "30 min" }
      }
    ];
    return Math.random() > 0.8
      ? mockNotifications[Math.floor(Math.random() * mockNotifications.length)] as NotificationItem
      : null;
  };

  const markAsRead = (notificationId: number) => {
    setNotifications(prev =>
      prev.map(notif => notif.id === notificationId ? { ...notif, isRead: true } : notif)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, isRead: true })));
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
    let filtered = notifications;
    if (filterType !== 'all') {
      if (filterType === 'classes') {
        filtered = notifications.filter(n => n.metadata?.classId !== undefined);
      } else {
        filtered = notifications.filter(n => n.type === filterType);
      }
    }
    return showAll ? filtered : filtered.slice(0, 5);
  };

  const getUnreadClassesCount = () =>
    notifications.filter(n => !n.isRead && n.metadata?.classId !== undefined).length;

  const getTotalClassesCount = () =>
    notifications.filter(n => n.metadata?.classId !== undefined).length;

  const getPriorityColor = (priority: string = 'medium') => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const getPriorityBadge = (priority: string = 'medium') => {
    switch (priority) {
      case 'critical':
        return <span className="bg-red-100 text-red-700 text-[10px] px-2 py-0.5 rounded-full flex items-center gap-0.5"><AlertCircle size={10} />Urgent</span>;
      case 'high':
        return <span className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full">Important</span>;
      case 'medium':
        return <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full">Update</span>;
      case 'low':
        return <span className="bg-gray-100 text-gray-700 text-[10px] px-2 py-0.5 rounded-full">Info</span>;
      default: return null;
    }
  };

  const getNotificationIcon = (type: string, priority: string = 'medium') => {
    const iconClasses = "p-1.5 rounded-lg";
    switch (type) {
      case "exam":
        return <div className={`${iconClasses} bg-blue-100`}><Calendar className="text-blue-600" size={18} /></div>;
      case "grade":
        return <div className={`${iconClasses} bg-green-100`}><Award className="text-green-600" size={18} /></div>;
      case "system":
        return <div className={`${iconClasses} bg-red-100`}><AlertCircle className="text-red-600" size={18} /></div>;
      case "announcement":
        return <div className={`${iconClasses} bg-purple-100`}><Megaphone className="text-purple-600" size={18} /></div>;
      default:
        return <div className={`${iconClasses} bg-gray-100`}><Info className="text-gray-600" size={18} /></div>;
    }
  };

  const handleNotificationClick = (notification: NotificationItem) => {
    markAsRead(notification.id);
    setSelectedNotification(notification.id);
    setShowNotifications(false);

    if (notification?.metadata?.classId) {
      const classExists = studentClasses.some(cls => cls.id === notification.metadata?.classId);
      if (classExists) {
        switch (notification.type) {
          case 'exam':
            navigate(`/classes/${notification.metadata.classId}/exams`);
            break;
          case 'grade':
            navigate(`/classes/${notification.metadata.classId}/grades`);
            break;
          default:
            navigate(`/classes/${notification.metadata.classId}/overview`);
            break;
        }
      } else {
        navigate('/classes');
      }
    } else {
      switch (notification.type) {
        case 'system':
          if (notification.metadata?.type === 'device_check') {
            navigate('/system-check');
          } else if (notification.metadata?.incidentId) {
            navigate(`/exam-security/${notification.metadata.incidentId}`);
          } else {
            navigate('/');
          }
          break;
        case 'exam':
          if (notification.metadata?.examId) {
            navigate(`/exam/${notification.metadata.examId}`);
          } else {
            navigate('/');
          }
          break;
        case 'grade':
          if (notification.metadata?.examId) {
            navigate(`/exam-results/${notification.metadata.examId}`);
          } else {
            navigate('/');
          }
          break;
        default:
          navigate('/');
          break;
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleClassClick = (cls: ClassType) => {
    navigate(`/classes/${cls.id}/overview`);
  };

  const handleTabChange = (newTab: string) => {
    if (selectedClass) {
      navigate(`/classes/${selectedClass.id}/${newTab}`);
    }
  };

  const handleBackToList = () => {
    navigate("/classes");
  };

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // ── Join Class ──────────────────────────────────────────────────────────────
  const handleJoinClass = async () => {
    const code = searchQuery.trim();
    if (!code) return;
    try {
      const res = await fetch('http://localhost:8000/api/student/classes/join/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.message || 'Failed to join class');
      setJoinMessage({
        type: 'success',
        text: `Successfully joined "${data.class_name || data.name || 'the class'}"!`,
      });
      setSearchQuery('');
      fetchMyClasses();
    } catch (err: any) {
      setJoinMessage({
        type: 'error',
        text: err.message || 'Failed to join class. Please try again.',
      });
    }
    setTimeout(() => setJoinMessage(null), 4000);
  };

  // ── Leave Class ──────────────────────────────────────────────────────────────
  const handleLeaveClass = async (cls: ClassType) => {
    setLeaveLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/api/student/classes/${cls.id}/leave/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || data.message || 'Failed to leave class');
      }
      setStudentClasses(prev => prev.filter(c => c.id !== cls.id));
      setJoinMessage({ type: 'success', text: `You have left "${cls.name}".` });
      setTimeout(() => setJoinMessage(null), 4000);
      navigate('/classes');
    } catch (err: any) {
      setJoinMessage({ type: 'error', text: err.message || 'Failed to leave class. Please try again.' });
      setTimeout(() => setJoinMessage(null), 4000);
    } finally {
      setLeaveLoading(false);
      setLeaveConfirm(null);
    }
  };

  // Tab Components
  const OverviewTab = ({ class: cls }: { class: ClassType }) => {
    const [nextExam, setNextExam] = useState<Exam | null>(null);
    const [examLoading, setExamLoading] = useState(true);

    useEffect(() => {
      const fetchNextExam = async () => {
        setExamLoading(true);
        try {
          const res = await fetch(`http://localhost:8000/api/student/classes/${cls.id}/exams/`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
          });
          if (!res.ok) throw new Error('Failed');
          const data = await res.json();
          const upcoming = data
            .filter((e: any) => e.status === 'upcoming')
            .sort((a: any, b: any) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime());
          if (upcoming.length > 0) {
            const e = upcoming[0];
            setNextExam({
              id: e.id,
              name: e.title,
              date: e.start_datetime?.split('T')[0] || '',
              duration: `${e.duration} min`,
              status: 'upcoming',
              score: null,
            });
          }
        } catch {
          setNextExam(null);
        } finally {
          setExamLoading(false);
        }
      };
      fetchNextExam();
    }, [cls.id]);

    return (
      <div className="space-y-6">
        <div className={`${getLightColorFromGradient(cls.color)} p-5 rounded-xl border ${getBorderColorFromGradient(cls.color)}`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full ${cls.color} flex items-center justify-center text-white shadow-lg`}>
                <School size={24} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">Class Code</h3>
                <div className="flex items-center gap-2">
                  <p className={`text-2xl font-mono font-bold ${getTextColorFromGradient(cls.color)}`}>
                    {cls.code}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={(e) => handleCopyCode(cls.code || '', e)}
              className={`flex items-center gap-2 bg-white hover:bg-opacity-90 px-4 py-2 rounded-lg border transition-all duration-200 shadow-sm hover:shadow ${getTextColorFromGradient(cls.color)} border-current hover:bg-opacity-10`}
            >
              {copiedCode === cls.code ? (
                <><Check size={16} className="text-green-600" /><span className="font-medium text-sm">Copied!</span></>
              ) : (
                <><Copy size={16} /><span className="font-medium text-sm">Copy Code</span></>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`${getLightColorFromGradient(cls.color)} p-5 rounded-xl border ${getBorderColorFromGradient(cls.color)} hover:shadow-md transition-shadow`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-full ${getLightColorFromGradient(cls.color)} flex items-center justify-center`}>
                <Calendar className={getTextColorFromGradient(cls.color)} size={20} />
              </div>
              <h3 className="font-semibold text-gray-800">Next Exam</h3>
            </div>
            {examLoading ? (
              <div className="w-32 h-4 bg-gray-200 animate-pulse rounded mt-1" />
            ) : nextExam ? (
              <>
                <p className="text-gray-800 font-medium text-lg">{nextExam.name}</p>
                <p className="text-gray-600 text-sm mt-1">{nextExam.date}</p>
                <p className="text-gray-600 text-sm">{nextExam.duration}</p>
              </>
            ) : (
              <p className="text-gray-500 text-sm">No upcoming exams</p>
            )}
            <button
              type="button"
              className={`mt-4 text-sm font-medium flex items-center gap-1 group ${getTextColorFromGradient(cls.color)}`}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleTabChange("exams"); }}
            >
              View all exams
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>

          <div className={`${getLightColorFromGradient(cls.color)} p-5 rounded-xl border ${getBorderColorFromGradient(cls.color)} hover:shadow-md transition-shadow`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-full ${getLightColorFromGradient(cls.color)} flex items-center justify-center`}>
                <Award className={getTextColorFromGradient(cls.color)} size={20} />
              </div>
              <h3 className="font-semibold text-gray-800">Overall Grades</h3>
            </div>
            <p className="text-gray-500 text-sm">No grades available yet</p>
            <button
              type="button"
              className={`mt-4 text-sm font-medium flex items-center gap-1 group ${getTextColorFromGradient(cls.color)}`}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleTabChange("grades"); }}
            >
              View detailed grades
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-8 h-8 rounded-full ${getLightColorFromGradient(cls.color)} flex items-center justify-center`}>
              <BookOpen size={16} className={getTextColorFromGradient(cls.color)} />
            </div>
            <h3 className="font-semibold text-gray-800 text-lg">Course Description</h3>
          </div>
          <p className="text-gray-600 leading-relaxed">
            {cls.description || "This course covers fundamental concepts and principles."}
          </p>
          {cls.subject && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <span className="text-sm font-medium text-gray-500">Subject:</span>
              <span className="ml-2 text-gray-800">{cls.subject}</span>
            </div>
          )}
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-8 h-8 rounded-full ${getLightColorFromGradient(cls.color)} flex items-center justify-center`}>
              <TrendingUp size={16} className={getTextColorFromGradient(cls.color)} />
            </div>
            <h3 className="font-semibold text-gray-800 text-lg">Your Progress</h3>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Overall Progress</span>
            <span className={`font-semibold ${getTextColorFromGradient(cls.color)}`}>{cls.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`bg-gradient-to-r ${cls.color.replace('bg-gradient-to-r ', '')} h-2.5 rounded-full transition-all duration-500`}
              style={{ width: `${cls.progress}%` }}
            />
          </div>
          <p className="text-gray-500 text-sm mt-3">Last activity: {cls.lastActivity}</p>
        </div>

        {/* ── Leave Class ── */}
        <div className="bg-white p-5 rounded-xl border border-red-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">Leave Class</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                You will lose access to all materials and exams. You can rejoin with the class code.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLeaveConfirm(cls)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 transition-all duration-200 text-sm font-medium whitespace-nowrap ml-4"
            >
              <LogOut size={15} />
              Leave Class
            </button>
          </div>
        </div>

        {/* ── Leave Confirmation Modal ── */}
        <AnimatePresence>
          {leaveConfirm?.id === cls.id && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
              onClick={() => setLeaveConfirm(null)}
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                transition={{ duration: 0.18 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm"
              >
                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                  <LogOut size={26} className="text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 text-center mb-1">Leave Class?</h3>
                <p className="text-sm text-gray-500 text-center mb-1">You are about to leave</p>
                <p className="text-sm font-semibold text-gray-800 text-center mb-3">"{cls.name}"</p>
                <p className="text-xs text-gray-400 text-center mb-6">
                  You will lose access to all class materials and exams. You can rejoin using the class code.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setLeaveConfirm(null)}
                    className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={leaveLoading}
                    onClick={() => handleLeaveClass(cls)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {leaveLoading
                      ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <LogOut size={15} />}
                    {leaveLoading ? 'Leaving...' : 'Leave Class'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const ExamsTab = () => {
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      if (!selectedClass) return;
      const fetchExams = async () => {
        setLoading(true);
        try {
          const res = await fetch(`http://localhost:8000/api/student/classes/${selectedClass.id}/exams/`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
          });
          if (!res.ok) throw new Error('Failed');
          const data = await res.json();
          setExams(data.map((e: any) => ({
            id: e.id,
            name: e.title,
            date: e.start_datetime?.split('T')[0] || '',
            duration: `${e.duration} min`,
            status: e.status,
            score: e.score ?? null,
          })));
        } catch {
          setExams([]);
        } finally {
          setLoading(false);
        }
      };
      fetchExams();
    }, [selectedClass?.id]);

    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-[#1A80F6] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading exams...</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-800 text-lg">Your Exams</h3>
        </div>
        {exams.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
            <FileText size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Exams Yet</h3>
            <p className="text-gray-500 text-sm">Exams will appear here once your instructor creates them</p>
          </div>
        ) : (
          exams.map((exam) => (
            <div key={exam.id} className="bg-white border p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-gray-800 text-lg">{exam.name}</h4>
                  <div className="text-gray-600 text-sm flex gap-4 mt-2">
                    <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                      <Calendar size={14} className="text-gray-500" />{exam.date}
                    </span>
                    <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                      <Clock size={14} className="text-gray-500" />{exam.duration}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {exam.status === "upcoming" ? (
                    <>
                      <span className="px-3 py-1 bg-blue-100 text-[#1A80F6] rounded-full text-sm font-medium">Upcoming</span>
                      <Link
                        to="/StartExam"
                        className={`${selectedClass?.color || 'bg-gradient-to-r from-[#1A80F6] to-[#4A90E2]'} text-white px-4 py-2 rounded-lg ${getHoverGradientFromColor(selectedClass?.color || '')} transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg`}
                      >
                        <Sparkles size={16} />Start Exam
                      </Link>
                    </>
                  ) : (
                    <>
                      <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm font-medium">Completed</span>
                      {exam.score && (
                        <div className="text-right">
                          <span className="text-sm text-gray-500">Score</span>
                          <p className={`text-2xl font-bold ${getTextColorFromGradient(selectedClass?.color || '')}`}>{exam.score}%</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  const GradesTab = () => (
    <div className="space-y-6">
      <div className={`${getLightColorFromGradient(selectedClass?.color || '')} p-6 rounded-xl border ${getBorderColorFromGradient(selectedClass?.color || '')} shadow-sm`}>
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-16 h-16 rounded-full ${selectedClass?.color || 'bg-gradient-to-r from-[#1A80F6] to-[#4A90E2]'} flex items-center justify-center text-white shadow-lg`}>
            <Award size={32} />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-800">Overall Grade</h3>
            <p className="text-gray-500 mt-1">No grades available yet</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    if (!selectedClass) return null;
    switch (activeTab) {
      case "overview": return <OverviewTab class={selectedClass} />;
      case "exams": return <ExamsTab />;
      case "grades": return <GradesTab />;
      default: return <OverviewTab class={selectedClass} />;
    }
  };

  const ClassDetails = () => {
    if (!selectedClass) return null;
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{selectedClass.name}</h2>
            <p className="text-gray-600 mt-1 flex items-center gap-2">
              <Users size={16} />{selectedClass.instructor}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-3 py-1 ${getLightColorFromGradient(selectedClass.color)} ${getTextColorFromGradient(selectedClass.color)} rounded-full text-sm font-medium`}>
                {selectedClass.subject}
              </span>
            </div>
          </div>
          <button
            onClick={handleBackToList}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
          >
            ← Back to Classes
          </button>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: "overview", label: "Overview", icon: BookOpen },
            { id: "exams", label: "Exams", icon: FileText },
            { id: "grades", label: "Grades", icon: Award },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleTabChange(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold whitespace-nowrap transition-all duration-200 ${
                activeTab === id
                  ? selectedClass.color + ' text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon size={18} />{label}
            </button>
          ))}
        </div>

        {renderTabContent()}
      </div>
    );
  };

  const ClassesList = () => (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {studentClasses.map((cls) => (
          <div
            key={cls.id}
            onClick={() => handleClassClick(cls)}
            className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:scale-[1.02]"
          >
            <div className={`h-2 ${cls.color}`}></div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{cls.name}</h3>
                  <p className="text-gray-600 text-sm flex items-center gap-2">
                    <Users size={16} /> {cls.instructor}
                  </p>
                  {cls.code && (
                    <div className="flex items-center gap-2 mt-2 text-gray-600 text-sm bg-gray-50 px-3 py-1.5 rounded-lg">
                      <School size={14} />
                      <span className="font-mono font-medium">{cls.code}</span>
                      <button
                        onClick={(e) => handleCopyCode(cls.code || '', e)}
                        className="text-gray-500 hover:text-gray-700 ml-1"
                        title="Copy class code"
                      >
                        {copiedCode === cls.code
                          ? <Check size={14} className="text-green-600" />
                          : <Copy size={14} />}
                      </button>
                    </div>
                  )}
                </div>
                <div className={`w-12 h-12 rounded-full ${cls.color} flex items-center justify-center text-white shadow-md`}>
                  <BookOpen size={24} />
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-gray-600"><FileText size={16} /> Upcoming Exams</span>
                  <span className={`font-semibold ${getTextColorFromGradient(cls.color)}`}>{cls.upcomingExams}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-gray-600"><Clock size={16} /> Last Activity</span>
                  <span className="text-gray-500">{cls.lastActivity}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-gray-600"><TrendingUp size={16} /> Progress</span>
                  <span className={`font-semibold ${getTextColorFromGradient(cls.color)}`}>{cls.progress}%</span>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                  className={`bg-gradient-to-r ${cls.color.replace('bg-gradient-to-r ', '')} h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${cls.progress}%` }}
                />
              </div>

              <button className={`w-full ${cls.color} text-white py-2.5 rounded-lg font-semibold ${getHoverGradientFromColor(cls.color)} transition-all duration-200 shadow-md hover:shadow-lg`}>
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );

  const NotificationDropdown = () => (
    <div className="relative" ref={notificationRef}>
      <button
        title="Notifications"
        type="button"
        className="relative p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 group"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowNotifications(!showNotifications); }}
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
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-[32rem] max-w-[90vw] bg-white rounded-xl shadow-2xl z-50 overflow-hidden border border-gray-100"
          >
            <div className="bg-gradient-to-r from-[#1A80F6] to-[#4A90E2] text-white px-5 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Bell size={20} className="animate-[bounce_2s_infinite]" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full"></span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Notifications</h3>
                    <p className="text-xs text-blue-100 mt-0.5">{unreadCount} unread · {notifications.length} total</p>
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
                  title='close'
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowNotifications(false); }}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="flex gap-2 mt-4 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/30">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'classes', label: 'Classes', count: getTotalClassesCount(), unread: getUnreadClassesCount() },
                  { id: 'exam', label: 'Exams' },
                  { id: 'grade', label: 'Grades' },
                  { id: 'system', label: 'System' },
                  { id: 'announcement', label: 'Announcements' }
                ].map((tabItem) => (
                  <button
                    key={tabItem.id}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFilterType(tabItem.id); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-all relative ${
                      filterType === tabItem.id ? 'bg-white text-[#1A80F6] shadow-md' : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {tabItem.id === 'classes' && <School size={12} />}
                      {tabItem.label}
                      {tabItem.id !== 'all' && (
                        <span className="px-1.5 py-0.5 bg-white/30 rounded-full text-[10px]">
                          {tabItem.id === 'classes'
                            ? getTotalClassesCount()
                            : notifications.filter(n => n.type === tabItem.id).length}
                        </span>
                      )}
                      {tabItem.id === 'classes' && getUnreadClassesCount() > 0 && (
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full"></span>
                      )}
                    </span>
                  </button>
                ))}
              </div>

              {filterType === 'classes' && (
                <div className="mt-2 text-xs bg-white/20 rounded-lg px-3 py-1.5 flex items-center gap-2">
                  <School size={12} />
                  <span>Showing class-related notifications only</span>
                  <span className="ml-auto font-semibold">{getTotalClassesCount()} total</span>
                </div>
              )}
            </div>

            <div className="max-h-[32rem] overflow-y-auto divide-y divide-gray-100">
              {getFilteredNotifications().length > 0 ? (
                getFilteredNotifications().map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleNotificationClick(notification)}
                    className={`relative px-5 py-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${!notification.isRead ? 'bg-blue-50/50' : ''} ${selectedNotification === notification.id ? 'bg-blue-100/50' : ''} ${filterType === 'classes' ? 'border-l-4 border-l-[#1A80F6]' : ''}`}
                  >
                    {notification.priority && ['critical', 'high'].includes(notification.priority) && (
                      <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 ${getPriorityColor(notification.priority)} rounded-r-full`}></div>
                    )}
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        {filterType === 'classes'
                          ? <div className="p-1.5 rounded-lg bg-gradient-to-r from-[#1A80F6] to-[#4A90E2] text-white"><School size={18} /></div>
                          : getNotificationIcon(notification.type, notification.priority)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-gray-900 text-sm">{notification.title}</h4>
                              {!notification.isRead && (
                                <span className="bg-[#1A80F6] text-white text-[10px] px-2 py-0.5 rounded-full">New</span>
                              )}
                              {getPriorityBadge(notification.priority)}
                            </div>
                            <p className="text-gray-600 text-sm mt-1 line-clamp-2">{notification.content}</p>
                            {notification.metadata && (
                              <div className="flex items-center gap-2 mt-2 text-xs flex-wrap">
                                {notification.metadata.className && (
                                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <School size={12} />{notification.metadata.className}
                                  </span>
                                )}
                                {notification.type === 'exam' && notification.metadata.examTime && (
                                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Clock size={12} />{notification.metadata.examTime}
                                  </span>
                                )}
                                {notification.type === 'grade' && notification.metadata.score !== undefined && (
                                  <>
                                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                                      Score: {notification.metadata.score}/{notification.metadata.maxScore}
                                    </span>
                                    {notification.metadata.classAverage !== undefined && (
                                      <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                                        Class Avg: {notification.metadata.classAverage}%
                                      </span>
                                    )}
                                  </>
                                )}
                                {notification.metadata.deadline && (
                                  <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <AlertCircle size={12} />Due {notification.metadata.deadline}
                                  </span>
                                )}
                                {notification.metadata.submissionsStatus === 'not_submitted' && (
                                  <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Not Submitted</span>
                                )}
                                {notification.metadata.duration && (
                                  <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Clock size={12} />{notification.metadata.duration}
                                  </span>
                                )}
                                {notification.metadata.startsIn && (
                                  <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Sparkles size={12} />Starts in {notification.metadata.startsIn}
                                  </span>
                                )}
                                {notification.metadata.instructor && (
                                  <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Users size={12} />{notification.metadata.instructor}
                                  </span>
                                )}
                              </div>
                            )}
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
                        <div className="flex items-center gap-3 mt-2">
                          {!notification.isRead && (
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); markAsRead(notification.id); }}
                              className="text-xs text-[#1A80F6] hover:text-[#0E6AD0] flex items-center gap-1"
                            >
                              <Check size={12} />Mark as read
                            </button>
                          )}
                          {notification.type === 'exam' && notification.metadata?.examId && notification.metadata?.startsIn && (
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/start-exam/${notification.metadata?.examId}`); }}
                              className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-2 py-1 rounded-lg flex items-center gap-1"
                            >
                              <Sparkles size={12} />Start Exam
                            </button>
                          )}
                          {notification.type === 'grade' && notification.metadata?.examId && (
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/exam-results/${notification.metadata?.examId}`); }}
                              className="text-xs bg-purple-100 text-purple-700 hover:bg-purple-200 px-2 py-1 rounded-lg flex items-center gap-1"
                            >
                              <Award size={12} />View Feedback
                            </button>
                          )}
                          {notification.type === 'system' && notification.metadata?.type === 'device_check' && (
                            <button
                              onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate('/system-check'); }}
                              className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-1 rounded-lg flex items-center gap-1"
                            >
                              <CheckCircle size={12} />Check Now
                            </button>
                          )}
                          {notification.metadata?.classId && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setShowNotifications(false);
                                const classExists = studentClasses.some(cls => cls.id === notification.metadata?.classId);
                                navigate(classExists ? `/classes/${notification.metadata?.classId}/overview` : '/classes');
                              }}
                              className="text-xs bg-gradient-to-r from-[#1A80F6] to-[#4A90E2] text-white hover:from-[#0E6AD0] hover:to-[#3A80D2] px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm"
                            >
                              <School size={12} />View Class
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="px-5 py-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    {filterType === 'classes' ? <School size={24} className="text-gray-400" /> : <Bell size={24} className="text-gray-400" />}
                  </div>
                  <p className="text-gray-500 font-medium">
                    {filterType === 'classes' ? 'No class notifications' : 'No notifications'}
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    {filterType === 'classes'
                      ? 'Updates about your classes will appear here'
                      : filterType !== 'all'
                        ? `No ${filterType} notifications found`
                        : "You're all caught up!"}
                  </p>
                  {filterType !== 'all' && (
                    <button onClick={() => setFilterType('all')} className="mt-4 text-[#1A80F6] text-sm hover:text-[#0E6AD0]">
                      View all notifications
                    </button>
                  )}
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
                {getFilteredNotifications().length > 0 && (
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (filterType === 'classes') {
                        if (window.confirm('Clear all class notifications?')) {
                          setNotifications(prev => prev.filter(n => n.metadata?.classId === undefined));
                        }
                      } else if (filterType !== 'all') {
                        if (window.confirm(`Clear all ${filterType} notifications?`)) {
                          setNotifications(prev => prev.filter(n => n.type !== filterType));
                        }
                      } else {
                        clearAllNotifications();
                      }
                    }}
                    className="text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Trash2 size={12} />Clear {filterType === 'all' ? 'all' : filterType}
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="w-full pt-20 min-h-screen bg-gradient-to-br from-[#E3F0FE] to-[#F0F7FF]">
      <div className="min-h-screen p-6">
        <Header fixed={true} showAccount={true} isRegistered={true} />

        <div className="max-w-7xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 sm:p-6 mb-6 border border-white/50">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#1A80F6] to-[#4A90E2] flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    S
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#1A80F6] to-[#4A90E2] bg-clip-text text-transparent">
                      My Classes
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600">Student Dashboard</p>
                  </div>
                </div>
                <NotificationDropdown />
              </div>

              {/* ── Join Class Input + Inline Message ── */}
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Class ID to join"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleJoinClass(); }}
                    className="flex-1 border border-gray-300 px-3 sm:px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A80F6] focus:border-transparent text-sm sm:text-base"
                  />
                  <button
                    onClick={handleJoinClass}
                    className="bg-gradient-to-r from-[#1A80F6] to-[#4A90E2] text-white px-4 sm:px-6 py-2.5 rounded-lg hover:from-[#0E6AD0] hover:to-[#3A80D2] transition-all duration-200 text-sm sm:text-base whitespace-nowrap shadow-md hover:shadow-lg"
                  >
                    Join Class
                  </button>
                </div>

                <AnimatePresence>
                  {joinMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium ${
                        joinMessage.type === 'success'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}
                    >
                      {joinMessage.type === 'success'
                        ? <CheckCircle size={16} className="shrink-0" />
                        : <AlertCircle size={16} className="shrink-0" />}
                      {joinMessage.text}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {selectedClass ? <ClassDetails /> : <ClassesList />}
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .scrollbar-thin::-webkit-scrollbar { height: 2px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: rgba(255,255,255,0.1); }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default ClassesStudent;