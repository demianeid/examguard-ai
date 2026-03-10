import Header from '../components/Header';
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import React, { useState, useEffect, useRef } from "react";
import {
  BookOpen, Clock, Users, FileText, Bell, Calendar, X, AlertCircle,
  CheckCircle, Info, Megaphone, TrendingUp, Eye, Plus, BarChart3,
  School, Edit, Copy, Check, FileEdit, GraduationCap, Sparkles,
  Trash2, Filter, MoreVertical, Download, Settings, ChevronDown, Search
} from "lucide-react";

const BASE_URL = 'http://127.0.0.1:8000/api/instructors';
const PROFILE_URL = 'http://127.0.0.1:8000/api/auth/profile/';
const getToken = () => localStorage.getItem('access_token');

const apiRequest = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
      ...options.headers,
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};

// --- Types ---
interface InstructorProfile {
  full_name: string;
  first_name: string;
  last_name: string;
  professor_id: string;
  real_email: string;
  phone: string;
  profile_image: string | null;
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
  title: string;
  start_datetime: string;
  duration: number;
  status: "upcoming" | "active" | "completed";
  questions_count: number;
}

interface Student {
  id: number;
  full_name: string;
  student_custom_id: string;
  profile_image: string | null;
  enrolled_at: string;
}

interface ClassType {
  id: number;
  name: string;
  students: number;
  activeExams: number;
  pendingReviews: number;
  avgScore: number;
  color: string;
  code: string;
  subject: string;
  description: string;
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
  'bg-gradient-to-r from-[#1A80F6] to-[#4A90E2]',
  'bg-gradient-to-r from-[#0E6AD0] to-[#3A80D2]',
  'bg-gradient-to-r from-[#2C8F8F] to-[#4CAF92]',
  'bg-gradient-to-r from-[#00A8B5] to-[#00C2C7]',
  'bg-gradient-to-r from-[#1A5F8F] to-[#2E7DA2]',
  'bg-gradient-to-r from-[#006994] to-[#2196F3]'
];
const oceanLightGradients = ['bg-gradient-to-r from-blue-50 to-cyan-50','bg-gradient-to-r from-sky-50 to-indigo-50','bg-gradient-to-r from-teal-50 to-emerald-50','bg-gradient-to-r from-cyan-50 to-blue-50','bg-gradient-to-r from-sky-50 to-blue-50','bg-gradient-to-r from-blue-50 to-indigo-50'];
const oceanBorderColors = ['border-blue-200','border-indigo-200','border-teal-200','border-cyan-200','border-sky-200','border-blue-200'];
const oceanTextColors = ['text-[#1A80F6]','text-[#0E6AD0]','text-[#2C8F8F]','text-[#00A8B5]','text-[#1A5F8F]','text-[#006994]'];
const oceanTextGradients = ['from-[#1A80F6] to-[#4A90E2]','from-[#0E6AD0] to-[#3A80D2]','from-[#2C8F8F] to-[#4CAF92]','from-[#00A8B5] to-[#00C2C7]','from-[#1A5F8F] to-[#2E7DA2]','from-[#006994] to-[#2196F3]'];

const getOceanColorIndex = (colorClass: string): number => { const index = oceanGradients.findIndex(g => g === colorClass); return index !== -1 ? index : 0; };
const getGradientFromColor = (colorClass: string): string => { const index = getOceanColorIndex(colorClass); const hoverColors = ['hover:from-[#0E6AD0] hover:to-[#3A80D2]','hover:from-[#0A5AB0] hover:to-[#2A70C2]','hover:from-[#1C7F7F] hover:to-[#3C9F82]','hover:from-[#0098A5] hover:to-[#00B2B7]','hover:from-[#0A4F7F] hover:to-[#1E6D92]','hover:from-[#005984] hover:to-[#1186E3]']; return `${colorClass} ${hoverColors[index]}`; };
const getLightColorFromGradient = (gradient: string): string => { const index = getOceanColorIndex(gradient); return oceanLightGradients[index]; };
const getBorderColorFromGradient = (gradient: string): string => { const index = getOceanColorIndex(gradient); return oceanBorderColors[index]; };
const getTextGradientFromColor = (gradient: string): string => { const index = getOceanColorIndex(gradient); return oceanTextGradients[index]; };
const getTextColorFromGradient = (gradient: string): string => { const index = getOceanColorIndex(gradient); return oceanTextColors[index]; };
const getButtonStylesFromColor = (gradient: string): string => { const index = getOceanColorIndex(gradient); const buttonStyles = ['text-[#1A80F6] border-[#1A80F6] hover:bg-blue-50','text-[#0E6AD0] border-[#0E6AD0] hover:bg-indigo-50','text-[#2C8F8F] border-[#2C8F8F] hover:bg-teal-50','text-[#00A8B5] border-[#00A8B5] hover:bg-cyan-50','text-[#1A5F8F] border-[#1A5F8F] hover:bg-sky-50','text-[#006994] border-[#006994] hover:bg-blue-50']; return buttonStyles[index]; };
const getHoverGradientFromColor = (gradient: string): string => { const index = getOceanColorIndex(gradient); const hoverGradients = ['hover:from-[#0E6AD0] hover:to-[#3A80D2]','hover:from-[#0A5AB0] hover:to-[#2A70C2]','hover:from-[#1C7F7F] hover:to-[#3C9F82]','hover:from-[#0098A5] hover:to-[#00B2B7]','hover:from-[#0A4F7F] hover:to-[#1E6D92]','hover:from-[#005984] hover:to-[#1186E3]']; return hoverGradients[index]; };

// --- EditClassModal ---
const EditClassModal: React.FC<EditClassModalProps> = ({ isOpen, onClose, onSubmit, onDelete, classData, isLoading = false }) => {
  const [formData, setFormData] = useState<EditClassData>({ name: "", subject: "", students: "", description: "" });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  useEffect(() => {
    if (classData) {
      setFormData({ name: classData.name, subject: classData.subject || "", students: classData.students?.toString() || "0", description: classData.description || "" });
    }
  }, [classData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className={`px-6 py-4 flex items-center justify-between ${classData?.color || 'bg-gradient-to-r from-[#1A80F6] to-[#4A90E2]'}`}>
          <div className="flex items-center gap-3 text-white"><Edit size={24} /><h2 className="text-xl font-bold">Edit Class</h2></div>
          <button title="Close modal" onClick={onClose} className="text-white/80 hover:text-white transition-colors" disabled={isLoading}><X size={20} /></button>
        </div>
        {showDeleteConfirm ? (
          <div className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4"><Trash2 size={32} className="text-red-600" /></div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Delete Class?</h3>
              <p className="text-gray-600 mb-6">Are you sure you want to delete "{classData?.name}"?</p>
              <div className="flex gap-3 w-full">
                <button type="button" onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50" disabled={isLoading}>Cancel</button>
                <button type="button" onClick={() => { if (onDelete) onDelete(); setShowDeleteConfirm(false); onClose(); }} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-800 disabled:opacity-50" disabled={isLoading}>{isLoading ? 'Deleting...' : 'Delete Class'}</button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="p-6 space-y-5">
            <div className="space-y-1">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Class Name *</label>
              <input type="text" id="name" name="name" required value={formData.name} onChange={handleChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1A80F6] focus:border-transparent disabled:bg-gray-100" disabled={isLoading} />
            </div>
            <div className="space-y-1">
              <label htmlFor="students" className="block text-sm font-medium text-gray-700">Number of Students *</label>
              <input type="number" id="students" name="students" required min="1" value={formData.students} onChange={handleChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1A80F6] focus:border-transparent disabled:bg-gray-100" disabled={isLoading} />
            </div>
            <div className="space-y-1">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Class Description</label>
              <textarea id="description" name="description" rows={4} value={formData.description} onChange={handleChange} className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1A80F6] focus:border-transparent resize-none disabled:bg-gray-100" disabled={isLoading} />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className={`flex-1 ${classData?.color || 'bg-gradient-to-r from-[#1A80F6] to-[#4A90E2]'} text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg disabled:opacity-50`} disabled={isLoading}>{isLoading ? 'Saving...' : 'Save Changes'}</button>
              <button type="button" onClick={() => setShowDeleteConfirm(true)} className="px-5 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 flex items-center gap-2 disabled:opacity-50" disabled={isLoading}><Trash2 size={18} /><span className="hidden sm:inline">Delete</span></button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

// --- NotificationDropdown ---
const NotificationDropdown = () => {
  const [filterType, setFilterType] = useState<string>("all");
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showAll, setShowAll] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<number | null>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: 1, type: "exam", title: "Midterm Exam Scheduled", content: "Software Engineering - Midterm exam scheduled for Oct 15 at 10:00 AM.", time: "1 hour ago", isRead: false, priority: "high", metadata: { classId: 1, className: "Software Engineering", examId: 101 } },
    { id: 2, type: "system", title: "Flagged Incident Detected", content: "Student suspicious behavior detected during Quiz 3 in Computer Networks.", time: "3 hours ago", isRead: false, priority: "critical", metadata: { classId: 2, className: "Computer Networks", studentId: "2025045", incidentId: 345 } },
    { id: 3, type: "grade", title: "Bulk Grading Complete", content: "All 45 submissions for Data Structures Quiz 2 have been automatically graded.", time: "1 day ago", isRead: true, priority: "medium", metadata: { classId: 3, className: "Data Structures", examId: 202, pendingReviews: 3 } },
  ]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = (id: number) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  const markAllAsRead = () => setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  const deleteNotification = (id: number, e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setNotifications(prev => prev.filter(n => n.id !== id)); };
  const getFilteredNotifications = () => { const filtered = filterType === 'all' ? notifications : notifications.filter(n => n.type === filterType); return showAll ? filtered : filtered.slice(0, 5); };
  const getPriorityColor = (priority: string = 'medium') => { switch(priority) { case 'critical': return 'bg-red-500'; case 'high': return 'bg-orange-500'; case 'medium': return 'bg-blue-500'; default: return 'bg-gray-500'; } };
  const getNotificationIcon = (type: string) => { const iconClasses = "p-1.5 rounded-lg"; switch(type) { case "exam": return <div className={`${iconClasses} bg-blue-100`}><Calendar className="text-blue-600" size={18} /></div>; case "grade": return <div className={`${iconClasses} bg-green-100`}><CheckCircle className="text-green-600" size={18} /></div>; case "system": return <div className={`${iconClasses} bg-red-100`}><AlertCircle className="text-red-600" size={18} /></div>; default: return <div className={`${iconClasses} bg-purple-100`}><Megaphone className="text-purple-600" size={18} /></div>; } };
  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="relative" ref={notificationRef}>
      <button title="Notifications" type="button" className="relative p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all duration-200 group" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowNotifications(!showNotifications); }}>
        <Bell size={20} className="group-hover:scale-110 transition-transform" />
        {unreadCount > 0 && (<><span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping"></span><span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full"></span><span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span></>)}
      </button>
      <AnimatePresence>
        {showNotifications && (
          <motion.div key="notification-dropdown" initial={{ opacity: 0, y: -10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10, scale: 0.95 }} transition={{ duration: 0.2 }} className="absolute right-0 mt-2 w-[32rem] max-w-[90vw] bg-white rounded-xl shadow-2xl z-50 overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-[#1A80F6] to-[#4A90E2] text-white px-5 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3"><Bell size={20} /><div><h3 className="font-semibold text-lg">Notifications</h3><p className="text-xs text-blue-100 mt-0.5">{unreadCount} unread · {notifications.length} total</p></div></div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); markAllAsRead(); }} className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"><Check size={14} />Mark all read</button>}
                  <button title='Close' onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowNotifications(false); }} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"><X size={16} /></button>
                </div>
              </div>
              <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
                {['all', 'exam', 'grade', 'system', 'announcement'].map((type, index) => (
                  <button key={`filter-${type}-${index}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFilterType(type); }} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize whitespace-nowrap transition-all ${filterType === type ? 'bg-white text-[#1A80F6] shadow-md' : 'bg-white/20 text-white hover:bg-white/30'}`}>{type}</button>
                ))}
              </div>
            </div>
            <div className="max-h-[32rem] overflow-y-auto divide-y divide-gray-100">
              {getFilteredNotifications().length > 0 ? getFilteredNotifications().map((notification, index) => (
                <motion.div key={`notification-${notification.id}-${index}`} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className={`relative px-5 py-4 hover:bg-gray-50 cursor-pointer transition-all duration-200 ${!notification.isRead ? 'bg-blue-50/50' : ''}`} onClick={() => { markAsRead(notification.id); setSelectedNotification(notification.id); }}>
                  {notification.priority && ['critical', 'high'].includes(notification.priority) && <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 ${getPriorityColor(notification.priority)} rounded-r-full`}></div>}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-gray-900 text-sm">{notification.title}</h4>
                            {!notification.isRead && <span className="bg-[#1A80F6] text-white text-[10px] px-2 py-0.5 rounded-full">New</span>}
                          </div>
                          <p className="text-gray-600 text-sm mt-1 line-clamp-2">{notification.content}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <span className="text-xs text-gray-400 whitespace-nowrap">{notification.time}</span>
                          <button title="Delete notification" type="button" className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" onClick={(e) => deleteNotification(notification.id, e)}><X size={14} /></button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )) : (
                <div className="px-5 py-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><Bell size={24} className="text-gray-400" /></div>
                  <p className="text-gray-500 font-medium">No notifications</p>
                </div>
              )}
            </div>
            {notifications.length > 0 && (
              <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowAll(!showAll); }} className="text-[#1A80F6] text-sm font-medium hover:text-[#0E6AD0] transition-colors flex items-center gap-1">{showAll ? 'Show less' : 'View all notifications'}<ChevronDown size={14} className={`transition-transform ${showAll ? 'rotate-180' : ''}`} /></button>
                <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (window.confirm('Clear all notifications?')) setNotifications([]); }} className="text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors flex items-center gap-1"><Trash2 size={12} />Clear all</button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
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
  const [deleteConfirmation, setDeleteConfirmation] = useState<{show: boolean, classId: number | null, className: string}>({ show: false, classId: null, className: '' });
  const [instructorClasses, setInstructorClasses] = useState<ClassType[]>([]);

  // ✅ Instructor profile state
  const [instructorProfile, setInstructorProfile] = useState<InstructorProfile | null>(null);

  // ✅ Students state
  const [classStudents, setClassStudents] = useState<Student[]>([]);
  const [studentsLoading, setStudentsLoading] = useState<boolean>(false);

  // ✅ Exams state
  const [exams, setExams] = useState<Exam[]>([]);
  const [examsLoading, setExamsLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchClasses();
    fetchProfile();
  }, []);

  // ✅ Fetch instructor profile from API
  const fetchProfile = async () => {
    try {
      const data = await apiRequest(PROFILE_URL);
      setInstructorProfile(data);
    } catch (error) {
      console.error('Failed to load instructor profile');
    }
  };

  const fetchClasses = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await apiRequest(`${BASE_URL}/classes/`);
      const transformedClasses = data.map((cls: any) => ({
        id: cls.id, name: cls.name, students: cls.number_of_students,
        activeExams: 0, pendingReviews: 0, avgScore: 0,
        color: oceanGradients[cls.id % oceanGradients.length],
        code: cls.code, subject: cls.subject, description: cls.description || ''
      }));
      setInstructorClasses(transformedClasses);
    } catch (error) {
      setErrorMessage('Failed to load classes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Fetch students when tab is students
  useEffect(() => {
    if (tab === 'students' && classId) {
      fetchStudents(parseInt(classId));
    }
  }, [tab, classId]);

  const fetchStudents = async (id: number) => {
    setStudentsLoading(true);
    try {
      const data = await apiRequest(`${BASE_URL}/classes/${id}/students/`);
      setClassStudents(data);
    } catch (error) {
      setClassStudents([]);
    } finally {
      setStudentsLoading(false);
    }
  };

  // ✅ Fetch exams when tab is exams
  useEffect(() => {
  if ((tab === 'exams' || tab === 'overview') && classId) {
    fetchExams(parseInt(classId));
  }
}, [tab, classId]);
  const fetchExams = async (id: number) => {
    setExamsLoading(true);
    try {
      const data = await apiRequest(`http://127.0.0.1:8000/api/exam/class/${id}/`);
      setExams(data);
    } catch {
      setExams([]);
    } finally {
      setExamsLoading(false);
    }
  };

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      window.history.replaceState({}, document.title);
      const timer = setTimeout(() => setSuccessMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => setErrorMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const selectedClass = classId ? instructorClasses.find(cls => cls.id === parseInt(classId)) : null;
  const activeTab = tab || "overview";

  useEffect(() => { if (classId && !selectedClass && !isLoading) navigate("/classes-instructor"); }, [classId, selectedClass, navigate, isLoading]);

  const handleClassClick = (cls: ClassType) => navigate(`/classes-instructor/${cls.id}/overview`);
  const handleTabChange = (newTab: string) => { if (selectedClass) navigate(`/classes-instructor/${selectedClass.id}/${newTab}`); };
  const handleBackToList = () => navigate("/classes-instructor");
  const handleEditClassClick = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); setIsEditClassModalOpen(true); };

  const handleEditClassSubmit = async (data: EditClassData) => {
    if (selectedClass) {
      setIsSubmitting(true);
      try {
        await apiRequest(`${BASE_URL}/classes/${selectedClass.id}/`, {
          method: 'PATCH',
          body: JSON.stringify({ name: data.name, number_of_students: parseInt(data.students), description: data.description }),
        });
        await fetchClasses();
        setIsEditClassModalOpen(false);
        setSuccessMessage('Class updated successfully!');
      } catch (error) {
        setErrorMessage('Failed to update class. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleDeleteClass = (classId: number, className: string) => setDeleteConfirmation({ show: true, classId, className });

  const handleConfirmDelete = async () => {
    if (deleteConfirmation.classId) {
      setIsSubmitting(true);
      try {
        await fetch(`${BASE_URL}/classes/${deleteConfirmation.classId}/`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${getToken()}` } });
        if (selectedClass?.id === deleteConfirmation.classId) navigate("/classes-instructor");
        setInstructorClasses(prev => prev.filter(cls => cls.id !== deleteConfirmation.classId));
        setSuccessMessage(`Class "${deleteConfirmation.className}" deleted successfully!`);
      } catch (error) {
        setErrorMessage('Failed to delete class. Please try again.');
      } finally {
        setIsSubmitting(false);
        setDeleteConfirmation({ show: false, classId: null, className: '' });
      }
    }
  };

  const handleDeleteCancel = () => setDeleteConfirmation({ show: false, classId: null, className: '' });
  const handleCreateClassClick = (e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); navigate('/create-class'); };
  const handleCreateExam = (e: React.MouseEvent, classId?: number) => { e.preventDefault(); e.stopPropagation(); navigate(classId ? `/CreateExam?classId=${classId}` : '/CreateExam'); };
  const handleEditExam = (examId: number) => navigate(`/edit-exam/${examId}`);
  const handleViewResults = (examId: number) => navigate(`/exam-results/${examId}`);
 const handleViewProfile = (studentId: string) => {
  const student = classStudents.find(s => s.student_custom_id === studentId);
  navigate(`/instructor/student-profile/${studentId}`, { 
    state: { studentData: student } 
  });
};
  const handleCopyCode = (code: string) => { navigator.clipboard.writeText(code); setCopiedCode(code); setTimeout(() => setCopiedCode(null), 2000); };

  // ✅ Helper: get first letter of instructor name for avatar fallback
  const getAvatarLetter = () => {
    if (instructorProfile?.first_name) return instructorProfile.first_name.charAt(0).toUpperCase();
    return 'I';
  };

  // --- Tab Components ---
  
  const OverviewTab = ({ cls }: { cls: ClassType }) => (
    
    <div className="space-y-6">
      <div className={`${getLightColorFromGradient(cls.color)} p-5 rounded-xl border ${getBorderColorFromGradient(cls.color)}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full ${cls.color} flex items-center justify-center text-white shadow-lg`}><School size={24} /></div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Class Code</h3>
              <p className={`text-3xl font-mono font-bold bg-gradient-to-r ${getTextGradientFromColor(cls.color)} bg-clip-text text-transparent`}>{cls.code}</p>
            </div>
          </div>
          <button onClick={() => handleCopyCode(cls.code)} className={`flex items-center gap-2 bg-white px-5 py-2.5 rounded-lg border transition-all duration-200 shadow-sm hover:shadow ${getButtonStylesFromColor(cls.color)}`}>
            {copiedCode === cls.code ? (<><Check size={18} className="text-green-600" /><span className="font-medium">Copied!</span></>) : (<><Copy size={18} /><span className="font-medium">Copy Code</span></>)}
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-3 ml-16">Share this code with students to join your class</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-5 rounded-xl border border-blue-200 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center"><Calendar className="text-[#1A80F6]" size={20} /></div><h3 className="font-semibold text-gray-800">Next Exam</h3></div>
   {examsLoading ? (
  <div className="w-32 h-4 bg-gray-200 animate-pulse rounded" />
) : (() => {
  const nextExam = exams
    .filter(e => e.status === "upcoming")
    .sort((a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime())[0];
  return nextExam ? (
    <>
      <p className="text-gray-800 font-medium text-lg">{nextExam.title}</p>
      <p className="text-gray-600 text-sm mt-1">
        {new Date(nextExam.start_datetime).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        {' · '}
        {new Date(nextExam.start_datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
      </p>
    </>
  ) : (
    <p className="text-gray-500 text-sm">No upcoming exams</p>
  );
})()}
          <button type="button" className={`mt-4 text-sm font-medium flex items-center gap-1 group ${getTextColorFromGradient(cls.color)}`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleTabChange("exams"); }}>View all exams <span className="group-hover:translate-x-1 transition-transform">→</span></button>
        </div>

        <div className={`${getLightColorFromGradient(cls.color)} p-5 rounded-xl border ${getBorderColorFromGradient(cls.color)} hover:shadow-md transition-shadow`}>
          <div className="flex items-center gap-3 mb-3"><div className={`w-10 h-10 rounded-full ${getLightColorFromGradient(cls.color)} flex items-center justify-center`}><Users className={getTextColorFromGradient(cls.color)} size={20} /></div><h3 className="font-semibold text-gray-800">Enrolled Students</h3></div>
          <p className="text-3xl font-bold text-gray-800 mb-1">{cls.students}</p>
          <button type="button" className={`mt-4 ${getTextColorFromGradient(cls.color)} text-sm font-medium flex items-center gap-1 group`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleTabChange("students"); }}>View all students <span className="group-hover:translate-x-1 transition-transform">→</span></button>
        </div>
      </div>

      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full ${getLightColorFromGradient(cls.color)} flex items-center justify-center`}><BookOpen size={16} className={getTextColorFromGradient(cls.color)} /></div><h3 className="font-semibold text-gray-800 text-lg">Course Description</h3></div>
          <div className="flex items-center gap-2">
            <button onClick={handleEditClassClick} className={`flex items-center gap-2 ${cls.color} text-white px-4 py-2 rounded-lg ${getHoverGradientFromColor(cls.color)} transition-all duration-200 shadow-md hover:shadow-lg`}><Edit size={16} /><span className="font-medium">Edit Class</span></button>
            <button onClick={() => handleDeleteClass(cls.id, cls.name)} className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg"><Trash2 size={16} /><span className="font-medium">Delete</span></button>
          </div>
        </div>
        <p className="text-gray-600 leading-relaxed">{cls.description || "No description provided."}</p>
      </div>
    </div>
  );

  // ✅ StudentsTab
  const StudentsTab = () => {
    if (studentsLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-[#1A80F6] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading students...</p>
        </div>
      );
    }

    if (classStudents.length === 0) {
      return (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
          <Users size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Students Yet</h3>
          <p className="text-gray-500 text-sm">Share the class code with students to enroll them</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500">{classStudents.length} student{classStudents.length !== 1 ? 's' : ''} enrolled</p>
        {classStudents.map((student, index) => (
          <div key={`student-${student.id}-${index}`} className="bg-white border p-4 rounded-lg shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4">
              {student.profile_image ? (
                <img
                  src={student.profile_image}
                  alt={student.full_name}
                  className="w-12 h-12 rounded-full object-cover shadow-md border-2 border-white ring-2 ring-blue-100"
                />
              ) : (
                <div className={`w-12 h-12 rounded-full ${selectedClass?.color || 'bg-gradient-to-r from-[#1A80F6] to-[#4A90E2]'} flex items-center justify-center text-white font-bold shadow-md`}>
                  {student.full_name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h4 className="font-semibold text-gray-800">{student.full_name}</h4>
                <p className="text-gray-500 text-sm">ID: {student.student_custom_id}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleViewProfile(student.student_custom_id); }}
              className={`${selectedClass?.color || 'bg-gradient-to-r from-[#1A80F6] to-[#4A90E2]'} text-white px-4 py-2 rounded-lg ${getHoverGradientFromColor(selectedClass?.color || '')} transition-all duration-200 shadow-md hover:shadow-lg`}
            >
              View Profile
            </button>
          </div>
        ))}
      </div>
    );
  };

  const ExamsTab = () => {
    if (examsLoading) {
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
          <h3 className="font-semibold text-gray-800 text-lg">Manage Exams</h3>
          <button type="button" onClick={(e) => handleCreateExam(e, selectedClass?.id)} className={`${selectedClass?.color || 'bg-gradient-to-r from-[#1A80F6] to-[#4A90E2]'} text-white px-5 py-2.5 rounded-lg ${getHoverGradientFromColor(selectedClass?.color || '')} transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg`}><Plus size={18} /><span className="font-medium">Create New Exam</span></button>
        </div>
        {exams.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
            <FileText size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Exams Yet</h3>
            <p className="text-gray-500 text-sm">Create your first exam to get started</p>
          </div>
        ) : (
          exams.map((exam, index) => (
            <div key={`exam-${exam.id}-${index}`} className="bg-white border p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-gray-800 text-lg">{exam.title}</h4>
                  <div className="text-gray-600 text-sm flex gap-4 mt-2">
                    <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded"><Calendar size={14} className="text-gray-500" />{exam.start_datetime.split('T')[0]}</span>
                    <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded"><Clock size={14} className="text-gray-500" />{exam.duration} min</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {exam.status === "upcoming" ? (
                    <><span className="px-3 py-1 bg-blue-100 text-[#1A80F6] rounded-full text-sm font-medium">Upcoming</span><button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleEditExam(exam.id); }} className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"><FileEdit size={16} />Edit</button></>
                  ) : (
                    <><span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm font-medium">Completed</span><button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleViewResults(exam.id); }} className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"><BarChart3 size={16} />View Results</button></>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  const ProctoringTab = () => (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-red-50 to-orange-50 p-5 rounded-xl border border-red-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center"><AlertCircle className="text-red-600" size={24} /></div>
          <div className="flex-1"><h3 className="font-semibold text-gray-800 text-lg mb-1">Flagged Incidents</h3><p className="text-gray-600 mb-3">8 incidents require review</p><button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate('/review-incidents'); }} className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-5 py-2.5 rounded-lg hover:from-red-700 hover:to-orange-700 transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"><Eye size={18} />Review Incidents</button></div>
        </div>
      </div>
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border border-green-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center"><Eye className="text-green-600" size={24} /></div>
          <div className="flex-1"><h3 className="font-semibold text-gray-800 text-lg mb-1">Live Monitoring</h3><p className="text-gray-600 mb-3">1 active exam with 12 students</p><button onClick={() => navigate('/live-proctoring')} className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 py-2.5 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg"><Eye size={18} />Monitor Now</button></div>
        </div>
      </div>
    </div>
  );

  const AnalyticsTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-200 hover:shadow-lg transition-shadow"><div className="flex items-center gap-3 mb-4"><div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center"><TrendingUp className="text-[#1A80F6]" size={24} /></div><h3 className="text-sm font-medium text-gray-600">Average Score</h3></div><p className="text-4xl font-bold text-[#1A80F6]">78%</p><p className="text-sm text-gray-500 mt-2">↑ 5% from last exam</p></div>
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200 hover:shadow-lg transition-shadow"><div className="flex items-center gap-3 mb-4"><div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center"><CheckCircle className="text-green-600" size={24} /></div><h3 className="text-sm font-medium text-gray-600">Pass Rate</h3></div><p className="text-4xl font-bold text-green-600">92%</p><p className="text-sm text-gray-500 mt-2">35 out of 38 students</p></div>
      <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-xl border border-red-200 hover:shadow-lg transition-shadow"><div className="flex items-center gap-3 mb-4"><div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center"><AlertCircle className="text-red-600" size={24} /></div><h3 className="text-sm font-medium text-gray-600">Cheating Reports</h3></div><p className="text-4xl font-bold text-red-600">3</p><p className="text-sm text-gray-500 mt-2">2 pending review</p></div>
    </div>
  );

  const renderTabContent = () => {
    if (!selectedClass) return null;
    switch (activeTab) {
      case "overview": return <OverviewTab key={`overview-${selectedClass.id}`} cls={selectedClass} />;
      case "students": return <StudentsTab key={`students-${selectedClass.id}`} />;
      case "exams": return <ExamsTab key={`exams-${selectedClass.id}`} />;
      case "proctoring": return <ProctoringTab key={`proctoring-${selectedClass.id}`} />;
      case "analytics": return <AnalyticsTab key={`analytics-${selectedClass.id}`} />;
      default: return <OverviewTab key={`overview-${selectedClass.id}`} cls={selectedClass} />;
    }
  };

  const ClassDetails = () => {
    if (!selectedClass) return null;
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{selectedClass.name}</h2>
            {instructorProfile ? (
              <span>{instructorProfile.full_name}</span>
            ) : (
              <div className="w-40 h-4 bg-gray-200 animate-pulse rounded mt-1" />
            )}
          </div>
          <div className="flex items-center gap-3">
            <button type="button" onClick={(e) => handleCreateExam(e, selectedClass.id)} className={`${selectedClass.color} text-white px-5 py-2.5 rounded-lg ${getHoverGradientFromColor(selectedClass.color)} transition-all duration-200 flex items-center gap-2 shadow-lg`}><Sparkles size={18} /><span className="font-semibold">Create Exam</span></button>
            <button type="button" onClick={handleBackToList} className="bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center gap-2">← Back</button>
          </div>
        </div>
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[{ id: "overview", label: "Overview", icon: BookOpen }, { id: "students", label: "Students", icon: Users }, { id: "exams", label: "Exams", icon: FileText }, { id: "proctoring", label: "Proctoring", icon: Eye }, { id: "analytics", label: "Analytics", icon: TrendingUp }].map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleTabChange(id); }} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold whitespace-nowrap transition-all duration-200 ${activeTab === id ? selectedClass.color + ' text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Icon size={18} />{label}</button>
          ))}
        </div>
        {renderTabContent()}
      </div>
    );
  };

  const ClassesList = () => {
    if (isLoading) return (<div className="flex flex-col items-center justify-center py-12"><div className="w-16 h-16 border-4 border-[#1A80F6] border-t-transparent rounded-full animate-spin mb-4"></div><p className="text-gray-600">Loading classes...</p></div>);
    if (instructorClasses.length === 0) return (<div className="bg-white rounded-xl shadow-lg p-12 text-center"><School size={64} className="text-gray-300 mx-auto mb-4" /><h3 className="text-xl font-bold text-gray-800 mb-2">No Classes Yet</h3><p className="text-gray-600 mb-6">Get started by creating your first class</p><button onClick={handleCreateClassClick} className="bg-gradient-to-r from-[#1A80F6] to-[#4A90E2] text-white px-6 py-3 rounded-lg hover:from-[#0E6AD0] hover:to-[#3A80D2] transition-all duration-200 flex items-center gap-2 mx-auto"><Plus size={20} />Create Your First Class</button></div>);

    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {instructorClasses.map((cls) => (
          <motion.div key={`class-${cls.id}-${cls.code}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:scale-[1.02]">
            <div className={`h-2 ${cls.color}`}></div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{cls.name}</h3>
                  <div className="flex items-center gap-2 text-gray-600 text-sm bg-gray-50 px-3 py-1.5 rounded-lg"><School size={14} /><span className="font-mono font-medium">{cls.code}</span><button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleCopyCode(cls.code); }} className="text-gray-500 hover:text-gray-700 ml-1">{copiedCode === cls.code ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}</button></div>
                </div>
                <button title='Delete Class' onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteClass(cls.id, cls.name); }} className="text-gray-400 hover:text-red-600 transition-colors p-1"><Trash2 size={18} /></button>
              </div>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center"><span className="flex items-center gap-2 text-gray-600"><Users size={16} />Students</span><span className="font-semibold text-gray-900">{cls.students}</span></div>
                <div className="flex justify-between items-center"><span className="flex items-center gap-2 text-gray-600"><FileText size={16} />Active Exams</span><span className="font-semibold text-green-600">{cls.activeExams}</span></div>
                <div className="flex justify-between items-center"><span className="flex items-center gap-2 text-gray-600"><AlertCircle size={16} />Pending Reviews</span><span className="font-semibold text-red-600">{cls.pendingReviews}</span></div>
                <div className="flex justify-between items-center"><span className="flex items-center gap-2 text-gray-600"><BarChart3 size={16} />Avg Score</span><span className={`font-semibold ${getTextColorFromGradient(cls.color)}`}>{cls.avgScore}%</span></div>
              </div>
              <div className="flex gap-2 mt-4">
                <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleClassClick(cls); }} className={`flex-1 py-2.5 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg text-white ${getGradientFromColor(cls.color)}`}>Manage Class</button>
                <button type="button" onClick={(e) => handleCreateExam(e, cls.id)} className={`${cls.color} text-white px-4 py-2.5 rounded-lg font-semibold ${getHoverGradientFromColor(cls.color)} transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg`}><Plus size={18} /><span className="ml-1 hidden sm:inline">Exam</span></button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  };

  const DeleteConfirmationModal = () => {
    if (!deleteConfirmation.show) return null;
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleDeleteCancel} />
        <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
          <div className="px-6 py-5 bg-gradient-to-r from-red-600 to-red-700 text-white"><h2 className="text-xl font-bold flex items-center gap-2"><Trash2 size={24} />Delete Class</h2></div>
          <div className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-4"><AlertCircle size={40} className="text-red-600" /></div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Are you absolutely sure?</h3>
              <p className="text-gray-600 mb-2">This will permanently delete <span className="font-bold text-red-600">"{deleteConfirmation.className}"</span>.</p>
              <p className="text-gray-500 text-sm mb-6">This action cannot be undone.</p>
              <div className="flex gap-3 w-full">
                <button type="button" onClick={handleDeleteCancel} className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors" disabled={isSubmitting}>Cancel</button>
                <button type="button" onClick={handleConfirmDelete} className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" disabled={isSubmitting}>{isSubmitting ? 'Deleting...' : 'Yes, Delete Class'}</button>
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
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 sm:p-6 mb-6 border border-white/50">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3 sm:gap-4">
           
{instructorProfile === null ? (
  <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse" />
) : (
  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#1A80F6] to-[#4A90E2] flex items-center justify-center text-white text-xl font-bold shadow-lg">
    {instructorProfile.first_name?.charAt(0).toUpperCase() || 'I'}
  </div>
)}
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#1A80F6] to-[#4A90E2] bg-clip-text text-transparent">My Classes</h1>
                  {instructorProfile ? (
                    <p className="text-sm sm:text-base text-gray-600">Welcome back, {instructorProfile.full_name}</p>
                  ) : (
                    <div className="w-36 h-4 bg-gray-200 animate-pulse rounded mt-1" />
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <NotificationDropdown />
                {!selectedClass && (<button type="button" onClick={handleCreateClassClick} className="bg-gradient-to-r from-[#1A80F6] to-[#4A90E2] text-white px-4 sm:px-5 py-2.5 rounded-lg hover:from-[#0E6AD0] hover:to-[#3A80D2] transition-all duration-200 flex items-center gap-2 text-sm sm:text-base shadow-lg shadow-blue-500/30"><Plus size={18} /><span className="hidden sm:inline font-semibold">Create Class</span></button>)}
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {successMessage && (<motion.div key="success-message" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mb-6 bg-green-50 border border-green-200 text-green-700 px-5 py-4 rounded-lg flex items-center justify-between shadow-md"><div className="flex items-center gap-3"><CheckCircle size={20} className="text-green-600" /><span className="font-medium">{successMessage}</span></div><button title='Close' onClick={() => setSuccessMessage(null)} className="text-green-600 hover:text-green-800"><X size={18} /></button></motion.div>)}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {errorMessage && (<motion.div key="error-message" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mb-6 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-lg flex items-center justify-between shadow-md"><div className="flex items-center gap-3"><AlertCircle size={20} className="text-red-600" /><span className="font-medium">{errorMessage}</span></div><button title='alert' onClick={() => setErrorMessage(null)} className="text-red-600 hover:text-red-800"><X size={18} /></button></motion.div>)}
          </AnimatePresence>

          {selectedClass ? <ClassDetails /> : <ClassesList />}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {isEditClassModalOpen && selectedClass && (<EditClassModal key={`edit-modal-${selectedClass.id}`} isOpen={isEditClassModalOpen} onClose={() => setIsEditClassModalOpen(false)} onSubmit={handleEditClassSubmit} onDelete={() => handleDeleteClass(selectedClass.id, selectedClass.name)} classData={selectedClass} isLoading={isSubmitting} />)}
        <DeleteConfirmationModal key="delete-modal" />
      </AnimatePresence>
    </div>
  );
};

const style = document.createElement('style');
style.textContent = `.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }`;
document.head.appendChild(style);

export default ClassesInstructor;