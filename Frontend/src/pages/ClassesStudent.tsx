import Header from '../components/Header'
import { motion } from "framer-motion";
import { Link, useParams, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Clock,
  Users,
  FileText,
  Bell,
  Calendar,
  Award,
} from "lucide-react";

// Types
interface ClassType {
  id: number;
  name: string;
  instructor: string;
  upcomingExams: number;
  progress: number;
  lastActivity: string;
  color: string;
}

interface Exam {
  id: number;
  name: string;
  date: string;
  duration: string;
  status: "upcoming" | "completed";
  score: number | null;
}

const ClassesStudent = () => {
  const { classId, tab } = useParams<{ classId?: string; tab?: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState<string>("");

  const studentClasses: ClassType[] = [
    {
      id: 1,
      name: "Data Structures & Algorithms",
      instructor: "Dr. Ahmed Hassan",
      upcomingExams: 2,
      progress: 75,
      lastActivity: "2 days ago",
      color: "from-blue-500 to-Tertiary",
    },
    {
      id: 2,
      name: "Database Systems",
      instructor: "Dr. Sara Mohamed",
      upcomingExams: 1,
      progress: 60,
      lastActivity: "1 day ago",
      color: "from-secondary to-green-600",
    },
    {
      id: 3,
      name: "Web Development",
      instructor: "Dr. Omar Ali",
      upcomingExams: 0,
      progress: 90,
      lastActivity: "5 hours ago",
      color: "from-secondary to-purple-600",
    },
  ];

  const exams: Exam[] = [
    { id: 1, name: "Midterm Exam", date: "2025-10-15", duration: "120 min", status: "upcoming", score: null },
    { id: 2, name: "Quiz 3", date: "2025-10-20", duration: "30 min", status: "upcoming", score: null },
    { id: 3, name: "Quiz 2", date: "2025-09-28", duration: "30 min", status: "completed", score: 85 },
    { id: 4, name: "Quiz 1", date: "2025-09-15", duration: "30 min", status: "completed", score: 92 },
  ];

  const selectedClass = classId ? studentClasses.find(cls => cls.id === parseInt(classId)) : null;
  const activeTab = tab || "overview";

  // Update URL when class or tab changes
  useEffect(() => {
    if (classId && !selectedClass) {
      // Invalid class ID, redirect to classes list
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

  // Tab Components
  const OverviewTab = ({ class: cls }: { class: ClassType }) => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="text-blue-600" size={24} />
            <h3 className="font-semibold text-gray-800">Schedule</h3>
          </div>
          <p className="text-gray-600">Sunday, Tuesday - 10:00 AM</p>
          <p className="text-gray-600">Thursday - 2:00 PM</p>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
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
          linked lists, trees, graphs, sorting, and searching algorithms.
        </p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-3">Progress</h3>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-600">Overall Progress</span>
          <span className="font-semibold">{cls.progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`bg-gradient-to-r ${cls.color} h-2 rounded-full`}
            style={{ width: `${cls.progress}%` }}
          />
        </div>
      </div>
    </div>
  );

  const ExamsTab = ({ exams }: { exams: Exam[] }) => (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-800 text-lg">Your Exams</h3>
      {exams.map((exam) => (
        <div key={exam.id} className="bg-white border p-4 rounded-lg shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-semibold">{exam.name}</h4>
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
                  <Link 
                    to="/StartExam" 
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Start Exam
                  </Link>
                </>
              ) : (
                <>
                  <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm">
                    Completed
                  </span>
                  {exam.score && (
                    <span className="text-2xl font-bold text-gray-800">{exam.score}%</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const GradesTab = ({ exams }: { exams: Exam[] }) => (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
        <h3 className="text-2xl font-bold mb-1">Overall Grade</h3>
        <p className="text-4xl font-bold">88.5%</p>
        <p className="opacity-90 mt-2">Excellent Performance!</p>
      </div>

      {exams
        .filter((e) => e.status === "completed")
        .map((exam) => (
          <div key={exam.id} className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
            <div>
              <h4 className="font-semibold">{exam.name}</h4>
              <p className="text-gray-600 text-sm">{exam.date}</p>
            </div>
            <span className="text-2xl font-bold text-blue-600">{exam.score}%</span>
          </div>
        ))}
    </div>
  );

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
        <div className="flex justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{selectedClass.name}</h2>
            <p className="text-gray-600">{selectedClass.instructor}</p>
          </div>
          <button 
            onClick={handleBackToList} 
            className="text-gray-600 hover:text-gray-800 flex items-center gap-2"
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
      {studentClasses.map((cls) => (
        <motion.div
          key={cls.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => handleClassClick(cls)}
          className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:scale-105"
        >
          <div className={`h-2 bg-gradient-to-r ${cls.color}`}></div>

          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">{cls.name}</h3>
                <p className="text-gray-600 text-sm flex items-center gap-2">
                  <Users size={16} /> {cls.instructor}
                </p>
              </div>

              <BookOpen className="text-gray-400" size={32} />
            </div>

            <div className="space-y-3 mb-3">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-600">
                  <FileText size={16} /> Upcoming Exams
                </span>
                <span className="font-semibold text-blue-600">{cls.upcomingExams}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-600">
                  <Clock size={16} /> Last Activity
                </span>
                <span className="text-gray-500">{cls.lastActivity}</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Progress</span>
                <span className="font-semibold">{cls.progress}%</span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`bg-gradient-to-r ${cls.color} h-2 rounded-full`}
                  style={{ width: `${cls.progress}%` }}
                />
              </div>
            </div>

            <button 
              className={`w-full bg-gradient-to-r ${cls.color} text-white py-2 rounded-lg font-semibold mt-4 hover:opacity-90 transition-opacity`}
            >
              View Details
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );

  return (
    <div className="w-full pt-20 min-h-screen bg-[#E3F0FE]">
      <div className="min-h-screen bg-background p-6">
        <Header fixed={true} showAccount={true} isRegistered={true} />

        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 mb-6">
            <div className="flex flex-col gap-4">
              {/* Top Row - Logo and Title */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-lg sm:text-xl font-bold">
                    S
                  </div>

                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold">My Classes</h1>
                    <p className="text-sm sm:text-base text-gray-600">Student View</p>
                  </div>
                </div>

                <button title="Notifications" className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors">
                  <Bell size={20} className="sm:w-6 sm:h-6" />
                  <span className="absolute top-0 right-0 bg-red-500 w-2 h-2 rounded-full"></span>
                </button>
              </div>

              {/* Bottom Row - Search Bar */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter Class ID"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 border border-gray-300 px-3 sm:px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                />
                <button className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base whitespace-nowrap">
                  Search
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