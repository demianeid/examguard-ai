// pages/AccountInstructor.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from '../components/Header';
import { motion } from "framer-motion";
import { Mail, Phone, Edit, Users, FileText, TrendingUp, Video, AlertCircle, CheckCircle, Eye, BarChart3, Calendar, Clock, ChevronDown, ChevronUp } from "lucide-react";

const AccountInstructor: React.FC = () => {
  const [showAllMonitoring, setShowAllMonitoring] = useState(false);
  const navigate = useNavigate();
  const handleEditProfile = () => {
  navigate("/settings");
};
  
  const upcomingExams = [
    {
      exam: "Software Engineering",
      subject: "Midterm",
      dateTime: "June 15, 10:00 AM",
      enrolled: 25
    },
    {
      exam: "Computer Network",
      subject: "Quiz1",
      dateTime: "July 02, 08:00 AM",
      enrolled: 28
    }
  ];

  const allLiveMonitoring = [
    {
      name: "Sarah Johnson",
      status: "Active",
      isLive: true,
      progress: 75,
      exam: "Software Engineering",
      timeRemaining: "45 min"
    },
    {
      name: "Mark Wilson",
      status: "Active", 
      isLive: false,
      progress: 45,
      exam: "Database Systems",
      timeRemaining: "30 min"
    },
    {
      name: "Ahmed Saeed",
      status: "Warning",
      isLive: true,
      progress: 60,
      exam: "Computer Network",
      timeRemaining: "60 min"
    },
    {
      name: "Lina Mohamed",
      status: "Active",
      isLive: true,
      progress: 85,
      exam: "Software Engineering",
      timeRemaining: "15 min"
    },
    {
      name: "Omar Hassan",
      status: "Active",
      isLive: false,
      progress: 35,
      exam: "Database Systems",
      timeRemaining: "50 min"
    },
    {
      name: "Nour Ali",
      status: "Warning",
      isLive: true,
      progress: 70,
      exam: "Computer Network",
      timeRemaining: "25 min"
    }
  ];

  const liveMonitoring = showAllMonitoring ? allLiveMonitoring : allLiveMonitoring.slice(0, 3);

  const alerts = [
    {
      type: "warning",
      message: "Suspicious movement detected",
      details: "Ahmed Saeed | Database Systems Exam",
      time: "2 min ago"
    },
    {
      type: "warning", 
      message: "Background voice detected",
      details: "Sarah Mohamed | Software Exam",
      time: "5 min ago"
    },
    {
      type: "info",
      message: "Connection lost",
      details: "Sara Wilson | Network Exam", 
      time: "10 min ago"
    }
  ];

  const stats = [
    {
      value: "3",
      label: "Live Exams",
      icon: Eye,
      color: "bg-[#3DA5FA]"
    },
    {
      value: "124", 
      label: "Students Testing",
      icon: Users,
      color: "bg-[#3F72B7]"
    },
    {
      value: "86%",
      label: "Completion Rate",
      icon: BarChart3,
      color: "bg-[#3DA5FA]"
    },
    {
      value: "12%",
      label: "Avg Suspicion",
      icon: AlertCircle,
      color: "bg-[#3F72B7]"
    }
  ];

  return (
    <div className="w-full min-h-screen bg-background">
      <Header showAccount={true} isRegistered={true}   isAccountPage={true}
  userType="instructor" />
      
      <div className="w-full py-24 px-4">
        <div className="max-w-[1100px] mx-auto space-y-6">
          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200"
          >
            {/* Header */}
            <div className="h-24 bg-gradient-to-r from-[#3F72B7] to-[#3DA5FA] relative">
              <div className="absolute inset-0 bg-black/10"></div>
            </div>
            
            {/* Profile Content */}
            <div className="relative px-8 pb-8">
              {/* Avatar */}
              <div className="flex justify-center -mt-16 mb-4">
                <div className="w-32 h-32 bg-gradient-to-br from-[#3F72B7] to-[#3DA5FA] rounded-full flex items-center justify-center shadow-2xl border-4 border-white relative">
                  <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                </div>
              </div>

              {/* Edit Button */}
             <button 
  onClick={handleEditProfile}
  className="absolute top-6 right-8 flex items-center gap-2 bg-white/90 hover:bg-white text-[#3F72B7] px-4 py-2 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
>
  <Edit className="w-4 h-4" />
  <span className="text-sm">Edit Profile</span>
</button>

              {/* Name & ID */}
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Dr. Sara Mohamed Ali</h1>
                <p className="text-gray-500 text-lg bg-slate-100 inline-block px-4 py-1 rounded-full">INST20219001</p>
              </div>

              {/* Contact Info */}
              <div className="flex flex-wrap justify-center gap-8 text-sm">
                <div className="flex items-center gap-3 text-gray-600 bg-slate-100 px-4 py-2 rounded-lg">
                  <Mail className="w-5 h-5 text-[#3F72B7]" />
                  <span>sara.mohamed@example.com</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 bg-slate-100 px-4 py-2 rounded-lg">
                  <Phone className="w-5 h-5 text-[#3F72B7]" />
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
            className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200"
          >
            {/* Dashboard Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-[#3F72B7]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
                  <p className="text-gray-500">Real-time monitoring and analytics</p>
                </div>
              </div>
              <button className="bg-[#3F72B7] hover:bg-[#3565A3] text-white px-4 py-2 rounded-lg font-semibold transition-colors">
                Generate Report
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className={`${stat.color} rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-3xl font-bold mb-2">{stat.value}</h3>
                      <p className="text-sm font-semibold opacity-90">{stat.label}</p>
                    </div>
                    <div className="p-3 bg-white/20 rounded-xl">
                      <stat.icon className="w-6 h-6" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Upcoming Exams */}
              <div className="lg:col-span-2 bg-gradient-to-br from-[#3F72B7] to-[#2E5A9B] rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Upcoming Exams
                  </h3>
                  <span className="text-sm bg-white/20 px-3 py-1 rounded-full">{upcomingExams.length} scheduled</span>
                </div>
                <div className="space-y-4">
                  {upcomingExams.map((exam, idx) => (
                    <div key={idx} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm hover:bg-white/15 transition-all duration-200 border border-white/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-lg">{exam.exam}</h4>
                          <p className="text-blue-100 text-sm">{exam.subject}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold flex items-center gap-1 justify-end">
                            <Clock className="w-4 h-4" />
                            {exam.dateTime}
                          </p>
                          <p className="text-blue-100 text-sm">{exam.enrolled} students enrolled</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exam Progress */}
              <div className="bg-gradient-to-br from-[#3DA5FA] to-[#2B8CDB] rounded-2xl p-6 text-white shadow-lg">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Exam Progress
                </h3>
                
                {/* Enhanced Donut Chart */}
                <div className="flex flex-col items-center mb-6">
                  <div className="relative w-40 h-40 mb-4">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth="12"
                        fill="none"
                      />
                      <circle
                        cx="80"
                        cy="80"
                        r="70"
                        stroke="white"
                        strokeWidth="12"
                        fill="none"
                        strokeDasharray="440"
                        strokeDashoffset="176"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-3xl font-bold">60%</div>
                        <div className="text-sm opacity-80">Completed</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress Bars */}
                  <div className="w-full space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Completed</span>
                      <span className="text-sm font-semibold">60%</span>
                    </div>
                    <div className="w-full bg-white/30 rounded-full h-2">
                      <div className="bg-white h-2 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">In Progress</span>
                      <span className="text-sm font-semibold">25%</span>
                    </div>
                    <div className="w-full bg-white/30 rounded-full h-2">
                      <div className="bg-yellow-300 h-2 rounded-full" style={{ width: '25%' }}></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Not Started</span>
                      <span className="text-sm font-semibold">15%</span>
                    </div>
                    <div className="w-full bg-white/30 rounded-full h-2">
                      <div className="bg-white/60 h-2 rounded-full" style={{ width: '15%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Grid */}
            <div className="grid lg:grid-cols-2 gap-6 mt-6">
              {/* Live Monitoring */}
              <div className="bg-gradient-to-br from-[#3DA5FA] to-[#2B8CDB] rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    Live Monitoring
                    <span className="text-sm bg-white/20 px-2 py-1 rounded-full">{allLiveMonitoring.length} students</span>
                  </h3>
                  <button className="text-sm bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg font-semibold transition-colors">
                    End All Exams
                  </button>
                </div>
                
                <div className="space-y-4">
                  {liveMonitoring.map((student, idx) => (
                    <div key={idx} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm hover:bg-white/15 transition-all duration-200 border border-white/10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            student.status === 'Active' ? 'bg-green-400' : 'bg-yellow-400'
                          }`}></div>
                          <div>
                            <span className="font-semibold block">{student.name}</span>
                            <span className="text-xs opacity-80">{student.exam}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {student.isLive ? (
                            <Video className="w-5 h-5 text-green-400" />
                          ) : (
                            <div className="w-5 h-5 border-2 border-white/50 rounded"></div>
                          )}
                        </div>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-2 mb-2">
                        <div 
                          className="bg-green-400 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${student.progress}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs text-blue-100">
                        <span>Progress: {student.progress}%</span>
                        <span>Time left: {student.timeRemaining}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* See More/Less Button */}
                <button 
                  onClick={() => setShowAllMonitoring(!showAllMonitoring)}
                  className="mt-4 w-full bg-white/20 hover:bg-white/30 text-white py-2 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {showAllMonitoring ? (
                    <>
                      <ChevronUp className="w-4 h-4" />
                      Show Less
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4" />
                      See More ({allLiveMonitoring.length - 3} more)
                    </>
                  )}
                </button>
              </div>

              {/* Alert Feed */}
              <div className="bg-gradient-to-br from-[#3F72B7] to-[#2E5A9B] rounded-2xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    <AlertCircle className="w-5 h-5" />
                    Alert Feed
                  </h3>
                  <span className="text-sm bg-white/20 px-3 py-1 rounded-full">Last 24h</span>
                </div>
                
                <div className="space-y-4">
                  {alerts.map((alert, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: idx * 0.1 }}
                      className={`bg-white/10 rounded-xl p-4 backdrop-blur-sm border-l-4 ${
                        alert.type === 'warning' ? 'border-yellow-400' : 'border-blue-300'
                      } hover:bg-white/15 transition-all duration-200 border border-white/10`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          alert.type === 'warning' ? 'bg-yellow-400/20' : 'bg-blue-300/20'
                        }`}>
                          <AlertCircle className={`w-4 h-4 ${
                            alert.type === 'warning' ? 'text-yellow-400' : 'text-blue-300'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-1">
                            <p className="font-semibold text-sm">{alert.message}</p>
                            <span className="text-xs opacity-70">{alert.time}</span>
                          </div>
                          <p className="text-xs opacity-80">{alert.details}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      {/* Bottom Bar */}
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

export default AccountInstructor;