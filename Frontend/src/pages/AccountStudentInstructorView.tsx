import React from "react";
import { motion } from "framer-motion";
import { Mail, Phone, TrendingUp, BookOpen, ArrowLeft, User, BarChart3 } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";

const AccountStudentInstructorView: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1); // العودة للصفحة السابقة
  };

  // بيانات الطالب (في الواقع بتكون جاية من API بناءً على studentId)
  const studentData = {
    name: "Demian Eid Lamey",
    email: "demian.eid@example.com",
    phone: "+20 123 456 7890",
    avgScore: 78,
    completedExams: "12/15",
    enrolledClasses: [
      {
        name: "Data Structures & Algorithms",
        instructor: "Dr. Ahmed Hassan",
        progress: 75,
        color: "bg-blue-500",
        grade: "A-"
      },
      {
        name: "Database Systems",
        instructor: "Dr. Sara Mohamed",
        progress: 60,
        color: "bg-blue-400",
        grade: "B+"
      },
      {
        name: "Web Development",
        instructor: "Dr. Omar Ali",
        progress: 91,
        color: "bg-blue-600",
        grade: "A"
      }
    ],
    recentActivity: [
      { exam: "Midterm Exam", date: "2024-10-15", score: 85, status: "Completed" },
      { exam: "Quiz 3", date: "2024-10-10", score: 92, status: "Completed" },
      { exam: "Assignment 2", date: "2024-10-05", score: 78, status: "Submitted" }
    ]
  };

  return (
    <div className="w-full min-h-screen bg-[#E8F1FA] relative">
      {/* زر Back في الزاوية */}
      <button
        onClick={handleBack}
        className="absolute top-6 right-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors font-medium text-sm z-10"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="w-full py-8 px-4">
        <div className="max-w-[1000px] mx-auto space-y-6">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden"
          >
            {/* Header متدرج أزرق */}
            <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-2xl"></div>

            {/* المحتوى على خلفية بيضاء */}
            <div className="bg-white px-6 pb-8 -mt-16 relative">
              {/* Avatar في المنتصف */}
              <div className="flex flex-col items-center">
                <div className="w-40 h-40 bg-blue-100 rounded-full flex items-center justify-center mb-4 shadow-lg">
                  <div className="w-32 h-32 bg-blue-500 rounded-full flex items-center justify-center">
                    <User className="w-16 h-16 text-white" />
                  </div>
                </div>
                
                {/* الاسم والـ ID */}
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{studentData.name}</h1>
                <p className="text-gray-600 text-lg mb-6">{studentId}</p>
                
                {/* Contact Info */}
                <div className="flex flex-wrap justify-center gap-8 text-gray-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-5 h-5 text-blue-500" />
                    <span>{studentData.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-5 h-5 text-green-500" />
                    <span>{studentData.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Performance Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
            </div>

            {/* Stats Cards */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-white/80 text-sm mb-1">Average Score</div>
                  <div className="text-4xl font-bold text-white">{studentData.avgScore}%</div>
                </div>
                <div className="text-center border-x border-white/20">
                  <div className="text-white/80 text-sm mb-1">Completed Exams</div>
                  <div className="text-4xl font-bold text-white">{studentData.completedExams}</div>
                </div>
                <div className="text-center">
                  <div className="text-white/80 text-sm mb-1">Attendance Rate</div>
                  <div className="text-4xl font-bold text-white">92%</div>
                </div>
              </div>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Enrolled Classes */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-900">Enrolled Classes</h3>
                </div>

                <div className="space-y-3">
                  {studentData.enrolledClasses.map((course, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 ${course.color} rounded-full`}></div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm">{course.name}</h4>
                          <p className="text-xs text-gray-500">{course.instructor}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-blue-600">{course.grade}</div>
                        <div className="text-xs text-gray-500">{course.progress}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                </div>

                <div className="space-y-3">
                  {studentData.recentActivity.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">{activity.exam}</h4>
                        <p className="text-xs text-gray-500">{activity.date}</p>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-semibold ${
                          activity.score >= 90 ? 'text-green-600' : 
                          activity.score >= 80 ? 'text-blue-600' : 'text-orange-600'
                        }`}>
                          {activity.score}%
                        </div>
                        <div className="text-xs text-gray-500">{activity.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default AccountStudentInstructorView;