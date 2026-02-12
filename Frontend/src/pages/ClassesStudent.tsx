import Header from '../components/Header'
import { Link, useParams, useNavigate } from "react-router-dom";
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
  Sparkles
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
}

// --- Ocean Blue Color Helper Functions (Same as Instructor) ---
const oceanGradients = [
  'from-[#1A80F6] to-[#4A90E2]', // Bright Blue
  'from-[#0E6AD0] to-[#3A80D2]', // Deep Blue
  'from-[#2C8F8F] to-[#4CAF92]', // Teal
  'from-[#00A8B5] to-[#00C2C7]', // Cyan
  'from-[#1A5F8F] to-[#2E7DA2]', // Navy Blue
  'from-[#006994] to-[#2196F3]'   // Ocean Blue
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
  // Extract the gradient part from the full class
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

const ClassesStudent = () => {
  const { classId, tab } = useParams<{ classId?: string; tab?: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [completedExams, setCompletedExams] = useState<number[]>([]);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // Load completed exams from localStorage on component mount
  useEffect(() => {
    const completed = JSON.parse(localStorage.getItem('completedExams') || '[]');
    setCompletedExams(completed);
  }, []);

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
      title: "Upcoming Exam",
      content: "Midterm Exam in Data Structures - Tomorrow at 10:00 AM",
      time: "2 hours ago",
      isRead: false
    },
    {
      id: 2,
      type: "grade",
      title: "Grade Posted",
      content: "Your Quiz 2 grade is now available: 85/100",
      time: "5 hours ago",
      isRead: false
    },
    {
      id: 3,
      type: "system",
      title: "System Alert",
      content: "Camera check required before next exam",
      time: "1 day ago",
      isRead: true
    },
    {
      id: 4,
      type: "announcement",
      title: "Announcement",
      content: "Office hours moved to Thursday 2 - 4 PM",
      time: "2 days ago",
      isRead: true
    }
  ];

  const [studentClasses, setStudentClasses] = useState<ClassType[]>([
    {
      id: 1,
      name: "Data Structures & Algorithms",
      instructor: "Dr. Ahmed Hassan",
      upcomingExams: 2,
      progress: 75,
      lastActivity: "2 days ago",
      color: "bg-gradient-to-r from-[#1A80F6] to-[#4A90E2]",
      code: generateClassCode(),
      subject: "Computer Science",
      description: "This course covers fundamental data structures and algorithms including arrays, linked lists, trees, graphs, sorting, and searching algorithms."
    },
    {
      id: 2,
      name: "Database Systems",
      instructor: "Dr. Sara Mohamed",
      upcomingExams: 1,
      progress: 60,
      lastActivity: "1 day ago",
      color: "bg-gradient-to-r from-[#0E6AD0] to-[#3A80D2]",
      code: generateClassCode(),
      subject: "Computer Science",
      description: "Introduction to database design, SQL, and data modeling."
    },
    {
      id: 3,
      name: "Web Development",
      instructor: "Dr. Omar Ali",
      upcomingExams: 0,
      progress: 90,
      lastActivity: "5 hours ago",
      color: "bg-gradient-to-r from-[#2C8F8F] to-[#4CAF92]",
      code: generateClassCode(),
      subject: "Computer Science",
      description: "Learn modern web development with HTML, CSS, JavaScript, and React."
    },
    {
      id: 4,
      name: "Operating Systems",
      instructor: "Dr. Fatima Ahmed",
      upcomingExams: 2,
      progress: 45,
      lastActivity: "3 days ago",
      color: "bg-gradient-to-r from-[#00A8B5] to-[#00C2C7]",
      code: generateClassCode(),
      subject: "Computer Science",
      description: "Study of process management, memory management, and file systems."
    },
    {
      id: 5,
      name: "Computer Networks",
      instructor: "Dr. Khaled Mohamed",
      upcomingExams: 1,
      progress: 70,
      lastActivity: "12 hours ago",
      color: "bg-gradient-to-r from-[#1A5F8F] to-[#2E7DA2]",
      code: generateClassCode(),
      subject: "Computer Science",
      description: "Study of network architectures, protocols, and security."
    },
    {
      id: 6,
      name: "Artificial Intelligence",
      instructor: "Dr. Noha Ibrahim",
      upcomingExams: 3,
      progress: 30,
      lastActivity: "1 week ago",
      color: "bg-gradient-to-r from-[#006994] to-[#2196F3]",
      code: generateClassCode(),
      subject: "Computer Science",
      description: "Introduction to AI concepts, machine learning, and neural networks."
    }
  ]);

  // Update exams based on completion status
  const exams: Exam[] = [
    { 
      id: 1, 
      name: "Midterm Exam", 
      date: "2025-10-15", 
      duration: "120 min", 
      status: completedExams.includes(1) ? "completed" : "upcoming", 
      score: completedExams.includes(1) ? 88 : null
    },
    { id: 2, name: "Quiz 3", date: "2025-10-20", duration: "30 min", status: "upcoming", score: null },
    { id: 3, name: "Quiz 2", date: "2025-09-28", duration: "30 min", status: "completed", score: 85 },
    { id: 4, name: "Quiz 1", date: "2025-09-15", duration: "30 min", status: "completed", score: 92 },
  ];

  const selectedClass = classId ? studentClasses.find(cls => cls.id === parseInt(classId)) : null;
  const activeTab = tab || "overview";

  // Update URL when class or tab changes
  useEffect(() => {
    if (classId && !selectedClass) {
      navigate("/classes");
    }
  }, [classId, selectedClass, navigate]);

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

  // Get notification icon based on type
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
          onClick={() => setShowNotifications(!showNotifications)}
        >
          <Bell size={20} className="sm:w-6 sm:h-6" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 w-2 h-2 rounded-full"></span>
          )}
        </button>

        {showNotifications && (
          <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl z-50 overflow-hidden">
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
                          title='close' 
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
              >
                View all notifications
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Tab Components
  const OverviewTab = ({ class: cls }: { class: ClassType }) => (
    <div className="space-y-6">
      {/* Class Code Section - New addition for students */}
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
              <>
                <Check size={16} className="text-green-600" />
                <span className="font-medium text-sm">Copied!</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span className="font-medium text-sm">Copy Code</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Next Exam Section */}
        <div className={`${getLightColorFromGradient(cls.color)} p-5 rounded-xl border ${getBorderColorFromGradient(cls.color)} hover:shadow-md transition-shadow`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-full ${getLightColorFromGradient(cls.color)} flex items-center justify-center`}>
              <Calendar className={getTextColorFromGradient(cls.color)} size={20} />
            </div>
            <h3 className="font-semibold text-gray-800">Next Exam</h3>
          </div>
          <p className="text-gray-800 font-medium text-lg">Midterm Exam</p>
          <p className="text-gray-600 text-sm mt-1">October 15, 2025 · 10:00 AM</p>
          <p className="text-gray-600 text-sm">120 minutes</p>
          <button 
            type="button"
            className={`mt-4 text-sm font-medium flex items-center gap-1 group ${getTextColorFromGradient(cls.color)}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleTabChange("exams");
            }}
          >
            View all exams 
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>

        {/* Overall Grades Section */}
        <div className={`${getLightColorFromGradient(cls.color)} p-5 rounded-xl border ${getBorderColorFromGradient(cls.color)} hover:shadow-md transition-shadow`}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-full ${getLightColorFromGradient(cls.color)} flex items-center justify-center`}>
              <Award className={getTextColorFromGradient(cls.color)} size={20} />
            </div>
            <h3 className="font-semibold text-gray-800">Overall Grades</h3>
          </div>
          <p className={`text-3xl font-bold ${getTextColorFromGradient(cls.color)} mb-1`}>88.5%</p>
          <p className="text-gray-600 text-sm mb-2">Excellent Performance!</p>
          <div className="mt-2 text-sm">
            <p className="text-gray-600">
              <span className="font-medium">Quiz 1:</span> 92%
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Quiz 2:</span> 85%
            </p>
            <p className="text-gray-600">
              <span className="font-medium">Average:</span> 88.5%
            </p>
          </div>
          <button 
            type="button"
            className={`mt-4 text-sm font-medium flex items-center gap-1 group ${getTextColorFromGradient(cls.color)}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleTabChange("grades");
            }}
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
        <p className="text-gray-500 text-sm mt-3">
          Last activity: {cls.lastActivity}
        </p>
      </div>
    </div>
  );

  const ExamsTab = ({ exams }: { exams: Exam[] }) => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-800 text-lg">Your Exams</h3>
        {selectedClass && (
          <span className={`px-3 py-1 ${getLightColorFromGradient(selectedClass.color)} ${getTextColorFromGradient(selectedClass.color)} rounded-full text-sm font-medium`}>
            {selectedClass.upcomingExams} Upcoming
          </span>
        )}
      </div>
      {exams.map((exam) => (
        <div key={exam.id} className="bg-white border p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow">
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
                  <Link 
                    to="/StartExam" 
                    className={`${selectedClass?.color || 'bg-gradient-to-r from-[#1A80F6] to-[#4A90E2]'} text-white px-4 py-2 rounded-lg ${getHoverGradientFromColor(selectedClass?.color || '')} transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg`}
                  >
                    <Sparkles size={16} />
                    Start Exam
                  </Link>
                </>
              ) : (
                <>
                  <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm font-medium">
                    Completed
                  </span>
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
      ))}
    </div>
  );

  const GradesTab = ({ exams }: { exams: Exam[] }) => {
    const completedExamsList = exams.filter((e) => e.status === "completed");
    const averageScore = completedExamsList.reduce((acc, exam) => acc + (exam.score || 0), 0) / completedExamsList.length || 0;

    return (
      <div className="space-y-6">
        <div className={`${getLightColorFromGradient(selectedClass?.color || '')} p-6 rounded-xl border ${getBorderColorFromGradient(selectedClass?.color || '')} shadow-sm`}>
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-16 h-16 rounded-full ${selectedClass?.color || 'bg-gradient-to-r from-[#1A80F6] to-[#4A90E2]'} flex items-center justify-center text-white shadow-lg`}>
              <Award size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Overall Grade</h3>
              <p className={`text-4xl font-bold ${getTextColorFromGradient(selectedClass?.color || '')}`}>
                {averageScore.toFixed(1)}%
              </p>
            </div>
          </div>
          <p className="text-gray-600">
            Based on {completedExamsList.length} completed {completedExamsList.length === 1 ? 'exam' : 'exams'}
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800 text-lg">Completed Exams</h4>
          {completedExamsList.map((exam) => (
            <div key={exam.id} className="bg-white border p-4 rounded-lg flex justify-between items-center hover:shadow-md transition-shadow">
              <div>
                <h4 className="font-semibold text-gray-800">{exam.name}</h4>
                <p className="text-gray-500 text-sm">{exam.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-2xl font-bold ${getTextColorFromGradient(selectedClass?.color || '')}`}>
                  {exam.score}%
                </span>
                <CheckCircle className="text-green-500" size={20} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render tab content based on activeTab
  const renderTabContent = () => {
    if (!selectedClass) return null;

    switch (activeTab) {
      case "overview":
        return <OverviewTab class={selectedClass} />;
      case "exams":
        return <ExamsTab exams={exams} />;
      case "grades":
        return <GradesTab exams={exams} />;
      default:
        return <OverviewTab class={selectedClass} />;
    }
  };

  // Class Details Component
  const ClassDetails = () => {
    if (!selectedClass) return null;

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{selectedClass.name}</h2>
            <p className="text-gray-600 mt-1 flex items-center gap-2">
              <Users size={16} />
              {selectedClass.instructor}
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

        {/* Tabs */}
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
              <Icon size={18} />
              {label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    );
  };

  // Classes List Component
  const ClassesList = () => (
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
                      {copiedCode === cls.code ? (
                        <Check size={14} className="text-green-600" />
                      ) : (
                        <Copy size={14} />
                      )}
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
                <span className="flex items-center gap-2 text-gray-600">
                  <FileText size={16} /> Upcoming Exams
                </span>
                <span className={`font-semibold ${getTextColorFromGradient(cls.color)}`}>{cls.upcomingExams}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-gray-600">
                  <Clock size={16} /> Last Activity
                </span>
                <span className="text-gray-500">{cls.lastActivity}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="flex items-center gap-2 text-gray-600">
                  <TrendingUp size={16} /> Progress
                </span>
                <span className={`font-semibold ${getTextColorFromGradient(cls.color)}`}>{cls.progress}%</span>
              </div>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
              <div
                className={`bg-gradient-to-r ${cls.color.replace('bg-gradient-to-r ', '')} h-2 rounded-full transition-all duration-500`}
                style={{ width: `${cls.progress}%` }}
              />
            </div>

            <button 
              className={`w-full ${cls.color} text-white py-2.5 rounded-lg font-semibold ${getHoverGradientFromColor(cls.color)} transition-all duration-200 shadow-md hover:shadow-lg`}
            >
              View Details
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="w-full pt-20 min-h-screen bg-gradient-to-br from-[#E3F0FE] to-[#F0F7FF]">
      <div className="min-h-screen p-6">
        <Header fixed={true} showAccount={true} isRegistered={true} />

        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 sm:p-6 mb-6 border border-white/50">
            <div className="flex flex-col gap-4">
              {/* Top Row */}
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

              {/* Bottom Row - Search Bar */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Class ID to join"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 border border-gray-300 px-3 sm:px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A80F6] focus:border-transparent text-sm sm:text-base"
                />
                <button className="bg-gradient-to-r from-[#1A80F6] to-[#4A90E2] text-white px-4 sm:px-6 py-2.5 rounded-lg hover:from-[#0E6AD0] hover:to-[#3A80D2] transition-all duration-200 text-sm sm:text-base whitespace-nowrap shadow-md hover:shadow-lg">
                  Join Class
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          {selectedClass ? <ClassDetails /> : <ClassesList />}
        </div>
      </div>
    </div>
  );
};

export default ClassesStudent;