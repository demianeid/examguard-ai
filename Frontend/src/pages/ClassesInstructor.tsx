import Header from '../components/Header';
import { motion } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
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
  TrendingUp,
  Eye,
  Plus,
  BarChart3
} from "lucide-react";

// Types
interface ClassType {
  id: number;
  name: string;
  students: number;
  activeExams: number;
  pendingReviews: number;
  avgScore: number;
  color: string;
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

const ClassesInstructor = () => {
  const { classId, tab } = useParams<{ classId?: string; tab?: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const notificationRef = useRef<HTMLDivElement>(null);

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

  const instructorClasses: ClassType[] = [
    {
      id: 1,
      name: "Software Engineering",
      students: 38,
      activeExams: 2,
      pendingReviews: 8,
      avgScore: 78,
      color: "bg-d2"
    },
    {
      id: 2,
      name: "Computer Networks",
      students: 45,
      activeExams: 4,
      pendingReviews: 6,
      avgScore: 82,
      color: "bg-d3"
    },
    {
      id: 3,
      name: "Data Structures & Algorithms",
      students: 52,
      activeExams: 1,
      pendingReviews: 3,
      avgScore: 75,
      color: "bg-secondary"
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

  // Update URL when class or tab changes
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
    const handleCreateExam = () => {
    navigate("/CreateExam");
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
          className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors"
          onClick={() => setShowNotifications(!showNotifications)}
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
            className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 overflow-hidden"
          >
            <div className="bg-blue-600 text-white px-4 py-3 flex justify-between items-center">
              <h3 className="font-semibold">Notifications</h3>
              <span className="bg-white text-blue-600 text-xs px-2 py-1 rounded-full">
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
                        <button title='close' className="text-gray-400 hover:text-gray-600">
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
              <button className="text-blue-600 text-sm font-medium hover:text-blue-700">
                View all notifications
              </button>
            </div>
          </motion.div>
        )}
      </div>
    );
  };

  // Tab Components
  const OverviewTab = ({ class: cls }: { class: ClassType }) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="text-blue-600" size={24} />
            <h3 className="font-semibold text-gray-800">Schedule</h3>
          </div>
          <p className="text-gray-600">Sunday, Tuesday - 10:00 AM</p>
          <p className="text-gray-600">Thursday - 2:00 PM</p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="text-green-600" size={24} />
            <h3 className="font-semibold text-gray-800">Next Class</h3>
          </div>
          <p className="text-gray-600">Thursday, Oct 10</p>
          <p className="text-gray-600">2:00 PM - 4:00 PM</p>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-3">Course Description</h3>
        <p className="text-gray-600 leading-relaxed">
          This course covers fundamental data structures and algorithms including arrays,
          linked lists, trees, graphs, sorting, and searching algorithms. Students will learn 
          to analyze algorithm complexity and implement efficient solutions.
        </p>
      </div>
    </div>
  );

  const StudentsTab = ({ students }: { students: Student[] }) => (
    <div className="space-y-4">
      {students.map((student) => (
        <div key={student.id} className="bg-white border p-4 rounded-lg shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
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
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
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
          onClick={handleCreateExam}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          Create New Exam
        </button>
      </div>

      {exams.map((exam) => (
        <div key={exam.id} className="bg-white border p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-semibold text-gray-800">{exam.name}</h4>
              <div className="text-gray-600 text-sm flex gap-4 mt-1">
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {exam.date}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {exam.duration}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {exam.status === "upcoming" ? (
                <>
                  <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm">
                    Upcoming
                  </span>
                  <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
                    Edit
                  </button>
                </>
              ) : (
                <>
                  <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">
                    Completed
                  </span>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
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
      <div className="bg-red-50 p-4 rounded-lg border border-red-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="text-red-600 mt-1" size={24} />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 mb-1">Flagged Incidents</h3>
            <p className="text-gray-600 text-sm mb-3">8 incidents require review</p>
            <button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">
              Review Incidents
            </button>
          </div>
        </div>
      </div>

      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
        <div className="flex items-start gap-3">
          <Eye className="text-green-600 mt-1" size={24} />
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800 mb-1">Live Monitoring</h3>
            <p className="text-gray-600 text-sm mb-3">1 active exam with 12 students</p>
            <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
              Monitor Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const AnalyticsTab = () => (
    <div className="space-y-4">
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <div className="mb-4">
          <h3 className="text-sm text-gray-600">Average Score</h3>
          <p className="text-4xl font-bold text-blue-600">78%</p>
        </div>
      </div>

      <div className="bg-green-50 p-6 rounded-lg border border-green-200">
        <div className="mb-4">
          <h3 className="text-sm text-gray-600">Pass Rate</h3>
          <p className="text-4xl font-bold text-green-600">92%</p>
        </div>
      </div>

      <div className="bg-red-50 p-6 rounded-lg border border-red-200">
        <div className="mb-4">
          <h3 className="text-sm text-gray-600">Cheating Reports</h3>
          <p className="text-4xl font-bold text-red-600">3</p>
        </div>
      </div>
    </div>
  );

  // Render tab content based on activeTab
  const renderTabContent = () => {
    if (!selectedClass) return null;

    switch (activeTab) {
      case "overview":
        return <OverviewTab class={selectedClass} />;
      case "students":
        return <StudentsTab students={students} />;
      case "exams":
        return <ExamsTab exams={exams} />;
      case "proctoring":
        return <ProctoringTab />;
      case "analytics":
        return <AnalyticsTab />;
      default:
        return <OverviewTab class={selectedClass} />;
    }
  };

  // Class Details Component
  const ClassDetails = () => {
    if (!selectedClass) return null;

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{selectedClass.name}</h2>
            <p className="text-gray-600">Dr. Ahmed Hassan</p>
          </div>
          <button 
            onClick={handleBackToList} 
            className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
          >
            ← Back
          </button>
        </div>

        {/* Tabs */}
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
              onClick={() => handleTabChange(id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold whitespace-nowrap ${
                activeTab === id 
                  ? "bg-blue-600 text-white shadow-md" 
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
      {instructorClasses.map((cls) => (
        <motion.div
          key={cls.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => handleClassClick(cls)}
          className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:scale-105"
        >
          <div className={`h-2 ${cls.color}`}></div>

          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{cls.name}</h3>
                <div className="flex items-center gap-1 text-gray-600 text-sm">
                  <BookOpen size={16} />
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-3">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-600">
                  <Users size={16} /> {cls.students} Students
                </span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-600">
                  <FileText size={16} /> Active Exams
                </span>
                <span className="font-semibold text-green-600">{cls.activeExams}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-600">
                  <AlertCircle size={16} /> Pending Reviews
                </span>
                <span className="font-semibold text-red-600">{cls.pendingReviews}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-600">
                  <BarChart3 size={16} /> Avg Score
                </span>
                <span className="font-semibold text-blue-600">{cls.avgScore}%</span>
              </div>
            </div>

            <button 
              className={`w-full ${cls.color} text-white py-2 rounded-lg font-semibold mt-4 hover:opacity-90 transition-opacity`}
            >
              Manage Class
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );

  return (
    <div className="w-full pt-20 min-h-screen bg-[#E3F0FE]">
      <div className="min-h-screen bg-background p-6">
        <Header fixed={true} showAccount={true} isRegistered={true} userType="instructor" />

        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
            <div className="flex flex-col gap-4">
              {/* Top Row */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-lg sm:text-xl font-bold">
                    I
                  </div>

                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold">My Classes</h1>
                    <p className="text-sm sm:text-base text-gray-600">Instructor name</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <NotificationDropdown />
                  {!selectedClass && (
                    <button className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm sm:text-base">
                      <Plus size={18} />
                      <span className="hidden sm:inline">Create Class</span>
                    </button>
                  )}
                </div>
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

export default ClassesInstructor;