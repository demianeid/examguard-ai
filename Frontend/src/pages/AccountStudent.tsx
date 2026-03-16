import React, { useEffect, useState } from "react";
import Header from '../components/Header';
import { motion } from "framer-motion";
import { Mail, Phone, Edit, TrendingUp, BookOpen, User, RefreshCw } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

interface ProfileData {
  user_role: string;
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  username: string;
  profile_image: string | null;
  is_active: boolean;
  date_joined: string;
  last_login: string;
}

const AccountStudent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showRefreshNotice, setShowRefreshNotice] = useState(false);

  const enrolledClasses = [
    { name: "Data Structures & Algorithms", instructor: "Dr. Ahmed Hassan", progress: 75, color: "bg-blue-500" },
    { name: "Database Systems", instructor: "Dr. Sara Mohamed", progress: 60, color: "bg-blue-400" },
    { name: "Web Development", instructor: "Dr. Omar Ali", progress: 91, color: "bg-blue-600" }
  ];

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
// http://127.0.0.1:8000
    try {
      const response = await fetch('https://examguard-ai-production.up.railway.app/api/auth/profile/', {
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

  const handleEditProfile = () => navigate("/settings", { state: { from: 'student-account' } });
  const handleRefresh = () => { setLoading(true); setRefreshKey(prev => prev + 1); };

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
      <Header showAccount={true} isRegistered={true} isAccountPage={true} />

      <div className="w-full py-24 px-4">
        <div className="max-w-[800px] mx-auto space-y-6">

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
            className="bg-white rounded-2xl shadow-lg overflow-hidden relative"
          >
            <div className="h-24 bg-gradient-to-r from-blue-500 to-blue-600"></div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleEditProfile}
              className="absolute top-6 right-6 flex items-center gap-2 bg-white/90 hover:bg-white text-blue-600 hover:text-blue-700 transition-all px-3 py-2 rounded-lg shadow-md z-10"
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
                  className="w-32 h-32 rounded-full shadow-xl border-4 border-white overflow-hidden bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center"
                >
                  {profile?.profile_image ? (
                    // http://127.0.0.1:8000
                    <img
                      src={`https://examguard-ai-production.up.railway.app${profile.profile_image}`}
                      alt={profile.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-16 h-16 text-white" />
                  )}
                </motion.div>
              </div>

              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-1">{profile?.full_name}</h1>
                <p className="text-gray-500 text-lg bg-slate-100 inline-block px-4 py-1 rounded-full">
                  {profile?.id || "—"}
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-5 h-5 text-blue-500" />
                  <span>{profile?.email || "—"}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone className="w-5 h-5 text-blue-500" />
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
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
              </svg>
              <h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
            </div>

            <div className="space-y-4 mb-6">
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
                    <div className={`w-2 h-2 ${course.color} rounded-full flex-shrink-0`}></div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 mb-0.5">{course.name}</h4>
                      <p className="text-sm text-gray-500">{course.instructor}</p>
                    </div>
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

export default AccountStudent;