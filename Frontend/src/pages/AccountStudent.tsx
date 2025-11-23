// pages/AccountStudent.tsx
import React from "react";
import Header from '../components/Header';
import { motion } from "framer-motion";
import { Mail, Phone, Edit, TrendingUp, BookOpen } from "lucide-react";

const AccountStudent: React.FC = () => {
  const enrolledClasses = [
    {
      name: "Data Structures & Algorithms",
      instructor: "Dr. Ahmed Hassan",
      progress: 75,
      color: "bg-blue-500"
    },
    {
      name: "Database Systems",
      instructor: "Dr. Sara Mohamed",
      progress: 60,
      color: "bg-blue-400"
    },
    {
      name: "Web Development",
      instructor: "Dr. Omar Ali",
      progress: 91,
      color: "bg-blue-600"
    }
  ];

  return (
    <div className="w-full min-h-screen bg-[#E8F1FA]">
      // في صفحة AccountStudent.tsx
<Header 
  showAccount={true} 
  isRegistered={true} 
  isAccountPage={true} 
/>
      
      <div className="w-full py-24 px-4">
        <div className="max-w-[800px] mx-auto space-y-6">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden relative"
          >
            {/* Blue Header */}
            <div className="h-24 bg-gradient-to-r from-blue-500 to-blue-600"></div>
            
            {/* Edit Button - Fixed positioning */}
            <button className="absolute top-6 right-6 flex items-center gap-2 bg-white/90 hover:bg-white text-blue-600 hover:text-blue-700 transition-all px-3 py-2 rounded-lg shadow-md z-10">
              <Edit className="w-4 h-4" />
              <span className="text-sm font-semibold">Edit Profile</span>
            </button>

            {/* Profile Content */}
            <div className="relative px-8 pb-8">
              {/* Avatar */}
              <div className="flex justify-center -mt-16 mb-4">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-xl border-4 border-white">
                  <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              {/* Name & ID */}
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-1">Demian Eid Lamey</h1>
                <p className="text-gray-500 text-lg">20210001</p>
              </div>

              {/* Contact Info */}
              <div className="flex flex-wrap justify-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-5 h-5 text-blue-500" />
                  <span>demian.eid@example.com</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-5 h-5 text-blue-500" />
                  <span>+20 123 456 7890</span>
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
            {/* Dashboard Header */}
            <div className="flex items-center gap-2 mb-6">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              <h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
            </div>

            {/* Stats Cards */}
            <div className="space-y-4 mb-6">
              {/* Average Score */}
              <div className="bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl p-6 text-white">
                <p className="text-sm font-semibold mb-2 opacity-90">Average Score</p>
                <div className="flex items-end gap-3">
                  <h3 className="text-3xl font-bold">78%</h3>
                  <div className="flex items-center gap-1 text-sm font-semibold mb-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>+5%</span>
                  </div>
                </div>
              </div>

              {/* Completed Exams */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                <p className="text-sm font-semibold mb-2 opacity-90">Completed Exams</p>
                <div className="flex items-end gap-3">
                  <h3 className="text-3xl font-bold">12/15</h3>
                  <div className="flex items-center gap-1 text-sm font-semibold mb-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>80%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Enrolled Classes */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-gray-700" />
                <h3 className="text-lg font-bold text-gray-900">Enrolled Classes</h3>
              </div>

              <div className="space-y-3">
                {enrolledClasses.map((course, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                    className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    {/* Dot Indicator */}
                    <div className={`w-2 h-2 ${course.color} rounded-full flex-shrink-0`}></div>

                    {/* Course Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 mb-0.5">{course.name}</h4>
                      <p className="text-sm text-gray-500">{course.instructor}</p>
                    </div>

                    {/* Progress */}
                    <div className="text-right flex-shrink-0">
                      <span className="text-lg font-bold text-blue-600">{course.progress}%</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[#1d1d1d]/20 mt-8 pt-4 flex flex-col md:flex-row items-center justify-between text-center md:text-left bg-[#E3F0FE] px-6 pb-4">
        <p className="text-[#1d1d1d]/70 text-sm mb-2 md:mb-0">
          © 2024 ExamGuard. All rights reserved.
        </p>

        <div className="flex flex-wrap gap-3 justify-center md:justify-end">
          {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item, idx) => (
            <a
              key={idx}
              href="#"
              className="text-[#1d1d1d]/70 text-sm hover:underline"
            >
              {item}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AccountStudent;