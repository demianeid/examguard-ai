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
  Trash2
} from "lucide-react";

// --- Types ---
interface ClassType {
  id: number;
  name: string;
  students: number;
  activeExams: number;
  pendingReviews: number;
  avgScore: number;
  color: string;
  code: string;
  subject?: string;
  description?: string;
}

interface NotificationItem {
  id: number;
  type: "exam" | "grade" | "system" | "announcement";
  title: string;
  content: string;
  time: string;
  isRead: boolean;
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

// --- Helper Components ---

const EditClassModal: React.FC<EditClassModalProps> = ({ isOpen, onClose, onSubmit, onDelete, classData }) => {
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
        students: classData.students.toString(),
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
          >
            <X size={20} />
          </button>
        </div>

        {showDeleteConfirm ? (
          <div className="p-6">
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
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg"
                  title="Confirm delete class"
                >
                  Delete Class
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
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
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1A80F6] focus:border-transparent"
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
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1A80F6] focus:border-transparent"
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
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1A80F6] focus:border-transparent"
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
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1A80F6] focus:border-transparent resize-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className={`flex-1 ${classData?.color || 'bg-gradient-to-r from-[#1A80F6] to-[#4A90E2]'} text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg ${getHoverGradientFromColor(classData?.color || '')}`}
                title="Save changes to class"
              >
                Save Changes
              </button>
              
              <button
                type="button"
                onClick={handleDeleteClick}
                className="px-5 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg flex items-center gap-2"
                title="Delete this class"
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

// --- Main Component ---

const ClassesInstructor = () => {
  const { classId, tab } = useParams<{ classId?: string; tab?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [isEditClassModalOpen, setIsEditClassModalOpen] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{show: boolean, classId: number | null, className: string}>({
    show: false,
    classId: null,
    className: ''
  });
  const notificationRef = useRef<HTMLDivElement>(null);
  
  // Load classes from localStorage or use default
  const [instructorClasses, setInstructorClasses] = useState<ClassType[]>(() => {
    const savedClasses = localStorage.getItem('instructorClasses');
    if (savedClasses) {
      return JSON.parse(savedClasses);
    }
    // Default classes if no saved data
    return [
      {
        id: 1,
        name: "Software Engineering",
        students: 38,
        activeExams: 2,
        pendingReviews: 8,
        avgScore: 78,
        color: oceanGradients[0],
        code: generateClassCode(),
        subject: "Computer Science",
        description: "This course covers software development methodologies, project management, and quality assurance."
      },
      {
        id: 2,
        name: "Computer Networks",
        students: 45,
        activeExams: 4,
        pendingReviews: 6,
        avgScore: 82,
        color: oceanGradients[1],
        code: generateClassCode(),
        subject: "Computer Science",
        description: "Study of network architectures, protocols, and security."
      },
      {
        id: 3,
        name: "Data Structures & Algorithms",
        students: 52,
        activeExams: 1,
        pendingReviews: 3,
        avgScore: 75,
        color: oceanGradients[2],
        code: generateClassCode(),
        subject: "Computer Science",
        description: "This course covers fundamental data structures and algorithms including arrays, linked lists, trees, graphs, sorting, and searching algorithms."
      }
    ];
  });

  // Check for success message from navigation state
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message from location state
      window.history.replaceState({}, document.title);
      
      // Auto-hide success message after 3 seconds
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  // Save classes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('instructorClasses', JSON.stringify(instructorClasses));
  }, [instructorClasses]);

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
  
  // Prevent default button submits
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

  // Sample notifications data
  const notifications: NotificationItem[] = [
    {
      id: 1,
      type: "exam",
      title: "Exam Scheduled",
      content: "Midterm Exam scheduled for Oct 15 at 10:00 AM",
      time: "1 hour ago",
      isRead: false
    },
    {
      id: 2,
      type: "system",
      title: "Flagged Incident",
      content: "Student suspicious behavior detected during Quiz 3",
      time: "3 hours ago",
      isRead: false
    },
    {
      id: 3,
      type: "grade",
      title: "Grading Complete",
      content: "All Quiz 2 submissions have been graded",
      time: "1 day ago",
      isRead: true
    },
    {
      id: 4,
      type: "announcement",
      title: "System Update",
      content: "New proctoring features available",
      time: "2 days ago",
      isRead: true
    }
  ];

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
    if (classId && !selectedClass) {
      navigate("/classes-instructor");
    }
  }, [classId, selectedClass, navigate]);

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

  const handleEditClassSubmit = (data: EditClassData) => {
    if (selectedClass) {
      const updatedClasses = instructorClasses.map(cls => 
        cls.id === selectedClass.id 
          ? { 
              ...cls, 
              name: data.name,
              subject: data.subject,
              students: parseInt(data.students),
              description: data.description
            }
          : cls
      );
      
      setInstructorClasses(updatedClasses);
      setIsEditClassModalOpen(false);
      setSuccessMessage('Class updated successfully!');
    }
  };

  const handleDeleteClass = (classId: number, className: string) => {
    setDeleteConfirmation({
      show: true,
      classId,
      className
    });
  };

  const handleConfirmDelete = () => {
    if (deleteConfirmation.classId) {
      // If we're currently viewing the class that's being deleted, navigate back to the list
      if (selectedClass && selectedClass.id === deleteConfirmation.classId) {
        navigate("/classes-instructor");
      }
      
      const updatedClasses = instructorClasses.filter(cls => cls.id !== deleteConfirmation.classId);
      setInstructorClasses(updatedClasses);
      setSuccessMessage(`Class "${deleteConfirmation.className}" deleted successfully!`);
    }
    setDeleteConfirmation({ show: false, classId: null, className: '' });
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
      navigate(`/create-exam?classId=${classId}`);
    } else {
      navigate('/create-exam');
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

  const getNotificationIcon = (type: string) => {
    switch(type) {
      case "exam":
        return <Calendar className="text-blue-600" size={18} />;
      case "grade":
        return <CheckCircle className="text-green-600" size={18} />;
      case "system":
        return <AlertCircle className="text-red-600" size={18} />;
      case "announcement":
        return <Megaphone className="text-purple-600" size={18} />;
      default:
        return <Info className="text-gray-600" size={18} />;
    }
  };

  // Notification Dropdown Component
  const NotificationDropdown = () => {
    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
      <div className="relative" ref={notificationRef}>
        <button 
          title="Notifications" 
          type="button"
          className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowNotifications(!showNotifications);
          }}
        >
          <Bell size={20} className="sm:w-6 sm:h-6" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 w-2 h-2 rounded-full"></span>
          )}
        </button>

        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl z-50 overflow-hidden"
          >
            <div className="bg-gradient-to-r from-[#1A80F6] to-[#4A90E2] text-white px-4 py-3 flex justify-between items-center">
              <h3 className="font-semibold">Notifications</h3>
              <span className="bg-white text-[#1A80F6] text-xs px-2 py-1 rounded-full">
                {unreadCount} unread
              </span>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-semibold text-gray-800 text-sm">
                          {notification.title}
                        </h4>
                        <button 
                          title="Close notification" 
                          type="button"
                          className="text-gray-400 hover:text-gray-600"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <p className="text-gray-600 text-sm mt-1">
                        {notification.content}
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        {notification.time}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="px-4 py-2 bg-gray-50 text-center">
              <button 
                type="button"
                className="text-[#1A80F6] text-sm font-medium hover:text-[#0E6AD0]"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                title="View all notifications"
              >
                View all notifications
              </button>
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  // Tab Components
  const OverviewTab = ({ cls }: { cls: ClassType }) => (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-green-600" />
            <span className="font-medium">{successMessage}</span>
          </div>
          <button 
            title="Dismiss message" 
            onClick={() => setSuccessMessage(null)} 
            className="text-green-600 hover:text-green-800"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}

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
      {students.map((student) => (
        <div key={student.id} className="bg-white border p-4 rounded-lg shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
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

      {exams.map((exam) => (
        <div key={exam.id} className="bg-white border p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
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
      <div className="bg-gradient-to-br from-red-50 to-orange-50 p-5 rounded-xl border border-red-200">
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

      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border border-green-200">
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
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-6 rounded-xl border border-blue-200 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
            <TrendingUp className="text-[#1A80F6]" size={24} />
          </div>
          <h3 className="text-sm font-medium text-gray-600">Average Score</h3>
        </div>
        <p className="text-4xl font-bold text-[#1A80F6]">78%</p>
        <p className="text-sm text-gray-500 mt-2">↑ 5% from last exam</p>
      </div>

      <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="text-green-600" size={24} />
          </div>
          <h3 className="text-sm font-medium text-gray-600">Pass Rate</h3>
        </div>
        <p className="text-4xl font-bold text-green-600">92%</p>
        <p className="text-sm text-gray-500 mt-2">35 out of 38 students</p>
      </div>

      <div className="bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-xl border border-red-200 hover:shadow-lg transition-shadow">
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
        return <OverviewTab cls={selectedClass} />;
      case "students":
        return <StudentsTab students={students} />;
      case "exams":
        return <ExamsTab exams={exams} />;
      case "proctoring":
        return <ProctoringTab />;
      case "analytics":
        return <AnalyticsTab />;
      default:
        return <OverviewTab cls={selectedClass} />;
    }
  };

  const ClassDetails = () => {
    if (!selectedClass) return null;

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
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

  const ClassesList = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {instructorClasses.map((cls) => (
        <motion.div
          key={cls.id}
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

  // Delete Confirmation Modal
  const DeleteConfirmationModal = () => {
    if (!deleteConfirmation.show) return null;

    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
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
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-medium hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md hover:shadow-lg"
                  title="Confirm delete class"
                >
                  Yes, Delete Class
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
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 sm:p-6 mb-6 border border-white/50">
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
          <AnimatePresence>
            {successMessage && (
              <motion.div
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

          {/* Main Content */}
          {selectedClass ? <ClassDetails /> : <ClassesList />}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isEditClassModalOpen && selectedClass && (
          <EditClassModal 
            isOpen={isEditClassModalOpen} 
            onClose={() => setIsEditClassModalOpen(false)} 
            onSubmit={handleEditClassSubmit} 
            onDelete={() => handleDeleteClass(selectedClass.id, selectedClass.name)}
            classData={selectedClass}
          />
        )}
        
        <DeleteConfirmationModal />
      </AnimatePresence>
    </div>
  );
};

export default ClassesInstructor;