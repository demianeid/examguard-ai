// pages/AccountInstructor.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from '../components/Header';
import { motion } from "framer-motion";
import { 
  Mail, 
  Phone, 
  Edit, 
  Users, 
  TrendingUp, 
  Video, 
  AlertCircle, 
  CheckCircle, 
  Eye, 
  BarChart3, 
  Calendar, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  User
} from "lucide-react";

// ============================================
// TYPES
// ============================================
interface ProfileData {
  user_role: string;
  professor_id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  real_email: string;
  phone: string;
  profile_image: string | null;
  is_active: boolean;
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const }
  }
};

const pulseVariants = {
  pulse: { scale: [1, 1.05, 1], opacity: [1, 0.8, 1] }
};

const liveIndicatorVariants = {
  animate: { scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }
};

const hoverTransition = { duration: 0.3, ease: "easeOut" as const };
const pulseTransition = { duration: 2, repeat: Infinity, ease: "easeInOut" as const };
const liveIndicatorTransition = { duration: 1.5, repeat: Infinity, ease: "easeInOut" as const };
const backgroundTransition = {
  duration: 10,
  repeat: Infinity,
  repeatType: "reverse" as const,
  ease: "linear" as const
};

const AccountInstructor: React.FC = () => {
  const [showAllMonitoring, setShowAllMonitoring] = useState(false);
  const navigate = useNavigate();

  // ============================================
  // Profile State
  // ============================================
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch('http://127.0.0.1:8000/api/auth/profile/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        navigate('/login');
        return;
      }

      const data = await response.json();
      if (response.ok) {
        setProfile(data);
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => {
    navigate("/settings");
  };

  // Static data (will be replaced with API later)
  const upcomingExams = [
    { exam: "Software Engineering", subject: "Midterm", dateTime: "June 15, 10:00 AM", enrolled: 25 },
    { exam: "Computer Network", subject: "Quiz1", dateTime: "July 02, 08:00 AM", enrolled: 28 }
  ];

  const allLiveMonitoring = [
    { name: "Sarah Johnson", status: "Active", isLive: true, progress: 75, exam: "Software Engineering", timeRemaining: "45 min" },
    { name: "Mark Wilson", status: "Active", isLive: false, progress: 45, exam: "Database Systems", timeRemaining: "30 min" },
    { name: "Ahmed Saeed", status: "Warning", isLive: true, progress: 60, exam: "Computer Network", timeRemaining: "60 min" },
    { name: "Lina Mohamed", status: "Active", isLive: true, progress: 85, exam: "Software Engineering", timeRemaining: "15 min" },
    { name: "Omar Hassan", status: "Active", isLive: false, progress: 35, exam: "Database Systems", timeRemaining: "50 min" },
    { name: "Nour Ali", status: "Warning", isLive: true, progress: 70, exam: "Computer Network", timeRemaining: "25 min" }
  ];

  const liveMonitoring = showAllMonitoring ? allLiveMonitoring : allLiveMonitoring.slice(0, 3);

  const alerts = [
    { type: "warning", message: "Suspicious movement detected", details: "Ahmed Saeed | Database Systems Exam", time: "2 min ago" },
    { type: "warning", message: "Background voice detected", details: "Sarah Mohamed | Software Exam", time: "5 min ago" },
    { type: "info", message: "Connection lost", details: "Sara Wilson | Network Exam", time: "10 min ago" }
  ];

  const stats = [
    { value: "3", label: "Live Exams", icon: Eye, color: "bg-[#3DA5FA]", delay: 0.1 },
    { value: "124", label: "Students Testing", icon: Users, color: "bg-[#3F72B7]", delay: 0.2 },
    { value: "86%", label: "Completion Rate", icon: BarChart3, color: "bg-[#3DA5FA]", delay: 0.3 },
    { value: "12%", label: "Avg Suspicion", icon: AlertCircle, color: "bg-[#3F72B7]", delay: 0.4 }
  ];

  // ============================================
  // Loading State
  // ============================================
  if (loading) {
    return (
      <div className="w-full min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-background">
      <Header showAccount={true} isRegistered={true} isAccountPage={true} userType="instructor" />
      
      <div className="w-full py-24 px-4">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-[1100px] mx-auto space-y-6"
        >
          {/* ============================================ */}
          {/* Profile Card - متربط بالـ API               */}
          {/* ============================================ */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200"
          >
            {/* Header */}
            <div className="h-24 bg-gradient-to-r from-[#3F72B7] to-[#3DA5FA] relative overflow-hidden">
              <motion.div
                animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
                transition={backgroundTransition}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent bg-[length:200%_200%]"
              />
            </div>
            
            {/* Profile Content */}
            <div className="relative px-8 pb-8">
              {/* Avatar */}
              <div className="flex justify-center -mt-16 mb-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={hoverTransition}
                  className="w-32 h-32 bg-gradient-to-br from-[#3F72B7] to-[#3DA5FA] rounded-full flex items-center justify-center shadow-2xl border-4 border-white relative overflow-hidden"
                >
                  {profile?.profile_image ? (
                    <img
                      src={`http://127.0.0.1:8000${profile.profile_image}`}
                      alt={profile.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-16 h-16 text-white" />
                  )}
                  <motion.div
                    variants={pulseVariants}
                    animate="pulse"
                    transition={pulseTransition}
                    className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-2 border-white flex items-center justify-center"
                  >
                    <CheckCircle className="w-4 h-4 text-white" />
                  </motion.div>
                </motion.div>
              </div>

              {/* Edit Button */}
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleEditProfile}
                className="absolute top-6 right-8 flex items-center gap-2 bg-white/90 hover:bg-white text-[#3F72B7] px-4 py-2 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Edit className="w-4 h-4" />
                <span className="text-sm">Edit Profile</span>
              </motion.button>

              {/* Name & ID - من الـ API */}
              <div className="text-center mb-6">
                <motion.h1
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-3xl font-bold text-gray-900 mb-2"
                >
                  {profile?.full_name || "Loading..."}
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-500 text-lg bg-slate-100 inline-block px-4 py-1 rounded-full"
                >
                  {profile?.professor_id || "—"}
                </motion.p>
              </div>

              {/* Contact Info - من الـ API */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-wrap justify-center gap-8 text-sm"
              >
                <div className="flex items-center gap-3 text-gray-600 bg-slate-100 px-4 py-2 rounded-lg">
                  <Mail className="w-5 h-5 text-[#3F72B7]" />
                  <span>{profile?.real_email || "—"}</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600 bg-slate-100 px-4 py-2 rounded-lg">
                  <Phone className="w-5 h-5 text-[#3F72B7]" />
                  <span>{profile?.phone || "—"}</span>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Performance Dashboard - static data */}
          <motion.div
            variants={itemVariants}
            className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  className="p-2 bg-blue-100 rounded-lg"
                >
                  <TrendingUp className="w-6 h-6 text-[#3F72B7]" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
                  <p className="text-gray-500">Real-time monitoring and analytics</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-[#3F72B7] hover:bg-[#3565A3] text-white px-4 py-2 rounded-lg font-semibold transition-colors"
              >
                Generate Report
              </motion.button>
            </div>

            {/* Stats Grid */}
            <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {stats.map((stat, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  custom={stat.delay}
                  whileHover={{ scale: 1.02, y: -4, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}
                  transition={hoverTransition}
                  className={`${stat.color} rounded-2xl p-6 text-white shadow-lg relative overflow-hidden`}
                >
                  <motion.div
                    animate={{ x: ["0%", "100%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  />
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <motion.h3
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200, delay: 0.5 + (idx * 0.1) }}
                        className="text-3xl font-bold mb-2"
                      >
                        {stat.value}
                      </motion.h3>
                      <p className="text-sm font-semibold opacity-90">{stat.label}</p>
                    </div>
                    <motion.div whileHover={{ scale: 1.1, rotate: 5 }} transition={hoverTransition} className="p-3 bg-white/20 rounded-xl">
                      <stat.icon className="w-6 h-6" />
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {/* Main Content Grid */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Upcoming Exams */}
              <motion.div
                whileHover={{ scale: 1.02, y: -4 }}
                transition={hoverTransition}
                className="lg:col-span-2 bg-gradient-to-br from-[#3F72B7] to-[#2E5A9B] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Upcoming Exams
                    </h3>
                    <span className="text-sm bg-white/20 px-3 py-1 rounded-full">{upcomingExams.length} scheduled</span>
                  </div>
                  <div className="space-y-4">
                    {upcomingExams.map((exam, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.2 }}
                        whileHover={{ scale: 1.02 }}
                        className="bg-white/10 rounded-xl p-4 backdrop-blur-sm hover:bg-white/15 transition-all duration-200 border border-white/10"
                      >
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
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* Exam Progress */}
              <motion.div
                whileHover={{ scale: 1.02, y: -4 }}
                transition={hoverTransition}
                className="bg-gradient-to-br from-[#3DA5FA] to-[#2B8CDB] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden"
              >
                <div className="relative z-10">
                  <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Exam Progress
                  </h3>
                  <div className="flex flex-col items-center mb-6">
                    <div className="relative w-40 h-40 mb-4">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.3)" strokeWidth="12" fill="none" />
                        <motion.circle
                          cx="80" cy="80" r="70" stroke="white" strokeWidth="12" fill="none"
                          strokeDasharray="440" strokeDashoffset="176" strokeLinecap="round"
                          initial={{ strokeDashoffset: 440 }}
                          animate={{ strokeDashoffset: 176 }}
                          transition={{ duration: 2, delay: 0.5 }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, delay: 1 }} className="text-3xl font-bold">60%</motion.div>
                          <div className="text-sm opacity-80">Completed</div>
                        </div>
                      </div>
                    </div>
                    <div className="w-full space-y-3">
                      {[
                        { label: "Completed", value: 60, color: "bg-white" },
                        { label: "In Progress", value: 25, color: "bg-yellow-300" },
                        { label: "Not Started", value: 15, color: "bg-white/60" }
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">{item.label}</span>
                            <span className="text-sm font-semibold">{item.value}%</span>
                          </div>
                          <div className="w-full bg-white/30 rounded-full h-2 overflow-hidden">
                            <motion.div className={`h-2 rounded-full ${item.color}`} initial={{ width: 0 }} animate={{ width: `${item.value}%` }} transition={{ duration: 1.5, delay: 0.8 + (idx * 0.2) }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Bottom Grid */}
            <div className="grid lg:grid-cols-2 gap-6 mt-6">
              {/* Live Monitoring */}
              <motion.div
                whileHover={{ scale: 1.02, y: -4 }}
                transition={hoverTransition}
                className="bg-gradient-to-br from-[#3DA5FA] to-[#2B8CDB] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden"
              >
                <div className="absolute top-4 right-4">
                  <motion.div variants={liveIndicatorVariants} animate="animate" transition={liveIndicatorTransition} className="flex items-center gap-2 bg-red-500/20 px-2 py-1 rounded-full">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-xs font-semibold">LIVE</span>
                  </motion.div>
                </div>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <Eye className="w-5 h-5" />
                      Live Monitoring
                    </h3>
                    <span className="text-sm bg-white/20 px-3 py-1 rounded-full">{allLiveMonitoring.length} students</span>
                  </div>
                  <div className="space-y-4">
                    {liveMonitoring.map((student, idx) => (
                      <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} whileHover={{ scale: 1.02 }} className="bg-white/10 rounded-xl p-4 backdrop-blur-sm hover:bg-white/15 transition-all duration-200 border border-white/10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${student.status === 'Active' ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                            <div>
                              <span className="font-semibold block">{student.name}</span>
                              <span className="text-xs opacity-80">{student.exam}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {student.isLive ? <Video className="w-5 h-5 text-green-400" /> : <div className="w-5 h-5 border-2 border-white/50 rounded"></div>}
                          </div>
                        </div>
                        <div className="w-full bg-white/20 rounded-full h-2 mb-2 overflow-hidden">
                          <motion.div className="bg-green-400 h-2 rounded-full" initial={{ width: 0 }} animate={{ width: `${student.progress}%` }} transition={{ duration: 1, delay: 0.5 + (idx * 0.1) }} />
                        </div>
                        <div className="flex justify-between text-xs text-blue-100">
                          <span>Progress: {student.progress}%</span>
                          <span>Time left: {student.timeRemaining}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  <div className="mt-6 flex flex-col gap-3">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      End All Exams
                    </motion.button>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setShowAllMonitoring(!showAllMonitoring)} className="bg-white/20 hover:bg-white/30 text-white py-2 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center gap-2">
                      {showAllMonitoring ? (<><ChevronUp className="w-4 h-4" />Show Less</>) : (<><ChevronDown className="w-4 h-4" />See More ({allLiveMonitoring.length - 3} more)</>)}
                    </motion.button>
                  </div>
                </div>
              </motion.div>

              {/* Alert Feed */}
              <motion.div
                whileHover={{ scale: 1.02, y: -4 }}
                transition={hoverTransition}
                className="bg-gradient-to-br from-[#3F72B7] to-[#2E5A9B] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden"
              >
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Alert Feed
                    </h3>
                    <span className="text-sm bg-white/20 px-3 py-1 rounded-full">Last 24h</span>
                  </div>
                  <div className="space-y-4">
                    {alerts.map((alert, idx) => (
                      <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }} whileHover={{ x: 5 }} className={`bg-white/10 rounded-xl p-4 backdrop-blur-sm border-l-4 ${alert.type === 'warning' ? 'border-yellow-400' : 'border-blue-300'} hover:bg-white/15 transition-all duration-200 border border-white/10`}>
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${alert.type === 'warning' ? 'bg-yellow-400/20' : 'bg-blue-300/20'}`}>
                            <AlertCircle className={`w-4 h-4 ${alert.type === 'warning' ? 'text-yellow-400' : 'text-blue-300'}`} />
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
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Footer */}
      <div className="border-t border-[#1d1d1d]/20 mt-8 pt-4 flex flex-col md:flex-row items-center justify-between text-center md:text-left bg-[#E3F0FE] px-6 pb-4">
        <p className="text-[#1d1d1d]/70 text-sm mb-2 md:mb-0">© 2024 ExamGuard. All rights reserved.</p>
        <div className="flex flex-wrap gap-3 justify-center md:justify-end">
          {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item, idx) => (
            <a key={idx} href="#" className="text-[#1d1d1d]/70 text-sm hover:underline">{item}</a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AccountInstructor;