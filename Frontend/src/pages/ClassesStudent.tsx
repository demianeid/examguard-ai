import React, { useState } from "react";
import {
  BookOpen,
  Clock,
  Users,
  FileText,
  Bell,
  Calendar,
  Award,
} from "lucide-react";

const ClassesStudent = () => {
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const studentClasses = [
    {
      id: 1,
      name: "Data Structures & Algorithms",
      instructor: "Dr. Ahmed Hassan",
      upcomingExams: 2,
      progress: 75,
      lastActivity: "2 days ago",
      color: "from-primary to-blue-600",
    },
    {
      id: 2,
      name: "Database Systems",
      instructor: "Dr. Sara Mohamed",
      upcomingExams: 1,
      progress: 60,
      lastActivity: "1 day ago",
      color: "from-secondary to-Tertiary",
    },
    {
      id: 3,
      name: "Web Development",
      instructor: "Dr. Omar Ali",
      upcomingExams: 0,
      progress: 90,
      lastActivity: "5 hours ago",
      color: "from-Quaternary to-cyan-600",
    },
  ];

  const exams = [
    { id: 1, name: "Midterm Exam", date: "2025-10-15", duration: "120 min", status: "upcoming", score: null },
    { id: 2, name: "Quiz 3", date: "2025-10-20", duration: "30 min", status: "upcoming", score: null },
    { id: 3, name: "Quiz 2", date: "2025-09-28", duration: "30 min", status: "completed", score: 85 },
    { id: 4, name: "Quiz 1", date: "2025-09-15", duration: "30 min", status: "completed", score: 92 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
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

              <button title="Notifications" className="relative p-2 text-gray-600">
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
              <button className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-blue-700 text-sm sm:text-base whitespace-nowrap">
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {selectedClass ? (
          // Class Details View
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{selectedClass.name}</h2>
                <p className="text-gray-600">{selectedClass.instructor}</p>
              </div>

              <button onClick={() => setSelectedClass(null)} className="text-gray-600 hover:text-gray-800">
                ← Back
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              <button
                onClick={() => setActiveTab("overview")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${
                  activeTab === "overview" ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <BookOpen size={18} />
                Overview
              </button>
              <button
                onClick={() => setActiveTab("exams")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${
                  activeTab === "exams" ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <FileText size={18} />
                Exams
              </button>
              <button
                onClick={() => setActiveTab("grades")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold ${
                  activeTab === "grades" ? "bg-blue-600 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                <Award size={18} />
                Grades
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === "overview" && (
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
              </div>
            )}

            {activeTab === "exams" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-800 text-lg">Your Exams</h3>

                {exams.map((exam) => (
                  <div key={exam.id} className="bg-white border p-4 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="font-semibold">{exam.name}</h4>
                        <div className="text-gray-600 text-sm flex gap-4 mt-1">
                          <span className="flex items-center gap-1"><Calendar size={14} />{exam.date}</span>
                          <span className="flex items-center gap-1"><Clock size={14} />{exam.duration}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {exam.status === "upcoming" ? (
                          <>
                            <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-sm">Upcoming</span>
                            <button className="bg-green-600 text-white px-4 py-2 rounded-lg">
                              Start Exam
                            </button>
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
            )}

            {activeTab === "grades" && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
                  <h3 className="text-2xl font-bold mb-1">Overall Grade</h3>
                  <p className="text-4xl font-bold">88.5%</p>
                  <p className="opacity-90 mt-2">Excellent Performance!</p>
                </div>

                {exams
                  .filter((e) => e.status === "completed")
                  .map((exam) => (
                    <div key={exam.id} className="bg-gray-50 p-4 rounded-lg flex justify-between">
                      <div>
                        <h4 className="font-semibold">{exam.name}</h4>
                        <p className="text-gray-600 text-sm">{exam.date}</p>
                      </div>
                      <span className="text-2xl font-bold text-blue-600">{exam.score}%</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ) : (
          // Classes Grid
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studentClasses.map((cls) => (
              <div
                key={cls.id}
                onClick={() => setSelectedClass(cls)}
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

                  <button className={`w-full bg-gradient-to-r ${cls.color} text-white py-2 rounded-lg font-semibold mt-4`}>
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassesStudent ;