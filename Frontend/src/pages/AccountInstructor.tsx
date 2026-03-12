import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from '../components/Header';
import { motion } from "framer-motion";
import { 
  Mail, Phone, Edit, Users, Video, AlertCircle, 
  Eye, BarChart3, Calendar, Clock, ChevronDown, 
  ChevronUp, User, BookOpen, RefreshCw
} from "lucide-react";

interface ProfileData {
  user_role: string;
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  profile_image: string | null;
  is_active: boolean;
  date_joined?: string;
  last_login?: string;
}

const AccountInstructor: React.FC = () => {
  const [showAllMonitoring, setShowAllMonitoring] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showRefreshNotice, setShowRefreshNotice] = useState(false);

  useEffect(() => {
    const fromSettings = location.state?.fromSettings;
    if (fromSettings) {
      setShowRefreshNotice(true);
      const timer = setTimeout(() => setShowRefreshNotice(false), 3000);
      setTimeout(() => clearTimeout(timer), 3000);
    }
    fetchProfile(); // ← always called
  }, [location.state, refreshKey]);

  const fetchProfile = async () => {
    setLoading(true);
    const token = localStorage.getItem('access_token');

    if (!token) {
      setError('No access token found. Please login again.');
      setLoading(false);
      setTimeout(() => navigate('/Login'), 2000);
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
        setError('Session expired. Please login again.');
        setTimeout(() => navigate('/Login'), 2000);
        return;
      }

      const data = await response.json();
      if (response.ok) {
        setProfile(data);
      } else {
        setError(data.error || 'Failed to load profile');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = () => navigate("/settings", { state: { from: 'instructor-account' } });
  const handleRefresh = () => { setLoading(true); setRefreshKey(prev => prev + 1); };

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
    { value: "3", label: "Live Exams", icon: Eye, color: "bg-[#3DA5FA]" },
    { value: "124", label: "Students Testing", icon: Users, color: "bg-[#3F72B7]" },
    { value: "86%", label: "Completion Rate", icon: BarChart3, color: "bg-[#3DA5FA]" },
    { value: "12%", label: "Avg Suspicion", icon: AlertCircle, color: "bg-[#3F72B7]" }
  ];

  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#E8F1FA] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-screen bg-[#E8F1FA] flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
          <p className="text-red-500 mb-4">{error}</p>
          <button onClick={() => navigate('/Login')} className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#E8F1FA]">
      <Header showAccount={true} isRegistered={true} isAccountPage={true} userType="instructor" />

      <div className="w-full py-24 px-4">
        <div className="max-w-[1100px] mx-auto space-y-6">

          {showRefreshNotice && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3"
            >
              <RefreshCw className="w-5 h-5 text-green-600" />
              <p className="text-green-700">Profile updated successfully!</p>
            </motion.div>
          )}

          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200 relative"
          >
            <div className="h-24 bg-gradient-to-r from-[#3F72B7] to-[#3DA5FA]"></div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleEditProfile}
              className="absolute top-6 right-6 flex items-center gap-2 bg-white/90 hover:bg-white text-[#3F72B7] hover:text-[#3565A3] transition-all px-3 py-2 rounded-lg shadow-md z-10"
            >
              <Edit className="w-4 h-4" />
              <span className="text-sm font-semibold">Edit Profile</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleRefresh}
              className="absolute top-6 left-6 flex items-center gap-2 bg-white/90 hover:bg-white text-gray-600 hover:text-gray-700 transition-all px-3 py-2 rounded-lg shadow-md z-10"
            >
              <RefreshCw className="w-4 h-4" />
            </motion.button>

            <div className="relative px-8 pb-8">
              <div className="flex justify-center -mt-16 mb-4">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                  className="w-32 h-32 rounded-full shadow-xl border-4 border-white overflow-hidden bg-gradient-to-br from-[#3F72B7] to-[#3DA5FA] flex items-center justify-center relative"
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
                  <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-white"></div>
                </motion.div>
              </div>

              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-1">
                  {profile?.full_name || "Loading..."}
                </h1>
                <p className="text-gray-500 text-lg bg-slate-100 inline-block px-4 py-1 rounded-full">
                  {profile?.id || "—"}
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-5 h-5 text-[#3F72B7]" />
                  <span>{profile?.email || "—"}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-5 h-5 text-[#3F72B7]" />
                  <span>{profile?.phone || "—"}</span>
                </div>
              </div>

              <div className="text-center mt-4">
                <p className="text-xs text-gray-400">Last updated: {new Date().toLocaleTimeString()}</p>
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
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-6 h-6 text-[#3F72B7]" />
              <h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {stats.map((stat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + idx * 0.1 }}
                  className={`${stat.color} rounded-xl p-6 text-white shadow-lg`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className="w-8 h-8 opacity-80" />
                  </div>
                  <h3 className="text-3xl font-bold mb-1">{stat.value}</h3>
                  <p className="text-sm opacity-90">{stat.label}</p>
                </motion.div>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="lg:col-span-2 bg-gradient-to-br from-[#3F72B7] to-[#2E5A9B] rounded-xl p-6 text-white"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="w-5 h-5" />
                  <h3 className="text-xl font-bold">Upcoming Exams</h3>
                </div>
                <div className="space-y-3">
                  {upcomingExams.map((exam, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, delay: 0.6 + idx * 0.1 }}
                      className="bg-white/10 rounded-lg p-4 hover:bg-white/20 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold">{exam.exam}</h4>
                          <p className="text-sm text-blue-100">{exam.subject}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm flex items-center gap-1">
                            <Clock className="w-3 h-3" />{exam.dateTime}
                          </p>
                          <p className="text-sm text-blue-100">{exam.enrolled} students</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="bg-gradient-to-br from-[#3DA5FA] to-[#2B8CDB] rounded-xl p-6 text-white"
              >
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />Quick Overview
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Total Exams Created</span><span className="font-bold">24</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div className="bg-white h-2 rounded-full" style={{ width: '80%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Active Classes</span><span className="font-bold">6</span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div className="bg-white h-2 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                  </div>
                  <div className="pt-2">
                    <p className="text-sm opacity-90">Average Student Performance</p>
                    <p className="text-2xl font-bold">78%</p>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6 mt-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="bg-gradient-to-br from-[#3DA5FA] to-[#2B8CDB] rounded-xl p-6 text-white"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Eye className="w-5 h-5" />
                    <h3 className="text-xl font-bold">Live Monitoring</h3>
                  </div>
                  <span className="text-sm bg-white/20 px-2 py-1 rounded-full">{allLiveMonitoring.length} students</span>
                </div>
                <div className="space-y-3">
                  {liveMonitoring.map((student, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.8 + idx * 0.1 }}
                      className="bg-white/10 rounded-lg p-3 hover:bg-white/20 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${student.status === 'Active' ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                          <span className="font-semibold">{student.name}</span>
                        </div>
                        {student.isLive && <Video className="w-4 h-4 text-green-400" />}
                      </div>
                      <p className="text-xs text-blue-100 mb-2">{student.exam}</p>
                      <div className="w-full bg-white/20 rounded-full h-1.5 mb-2">
                        <div className="bg-green-400 h-1.5 rounded-full" style={{ width: `${student.progress}%` }}></div>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>Progress: {student.progress}%</span>
                        <span>{student.timeRemaining}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
                {allLiveMonitoring.length > 3 && (
                  <button
                    onClick={() => setShowAllMonitoring(!showAllMonitoring)}
                    className="mt-4 w-full bg-white/20 hover:bg-white/30 text-white py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {showAllMonitoring ? (<>Show Less <ChevronUp className="w-4 h-4" /></>) : (<>See More ({allLiveMonitoring.length - 3}) <ChevronDown className="w-4 h-4" /></>)}
                  </button>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.8 }}
                className="bg-gradient-to-br from-[#3F72B7] to-[#2E5A9B] rounded-xl p-6 text-white"
              >
                <div className="flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5" />
                  <h3 className="text-xl font-bold">Alert Feed</h3>
                </div>
                <div className="space-y-3">
                  {alerts.map((alert, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.9 + idx * 0.1 }}
                      className={`bg-white/10 rounded-lg p-3 border-l-4 ${alert.type === 'warning' ? 'border-yellow-400' : 'border-blue-300'} hover:bg-white/20 transition-colors`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-semibold text-sm">{alert.message}</p>
                        <span className="text-xs opacity-70">{alert.time}</span>
                      </div>
                      <p className="text-xs opacity-80">{alert.details}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

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