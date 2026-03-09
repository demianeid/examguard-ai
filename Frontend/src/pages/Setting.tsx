import React, { useState, useEffect } from "react";
import { 
  User, 
  Lock, 
  Shield, 
  Moon, 
  Globe, 
  Bell, 
  Database, 
  Trash2, 
  HelpCircle, 
  MessageCircle, 
  FileText, 
  Eye,
  ChevronRight,
  ArrowLeft,
  Settings,
  Save
} from "lucide-react";
import Header from '../components/Header';
import { useNavigate, useLocation } from 'react-router-dom';

interface ProfileData {
  student_id?: string;
  professor_id?: string;
  instructor_id?: string;
  first_name: string;
  last_name: string;
  phone?: string;
  phone_number?: string;
  real_email?: string;
  profile_image?: string | null;
}

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [language, setLanguage] = useState("English");
  const [isSaving, setIsSaving] = useState(false);
  
  // Store the full profile data
  const [profile, setProfile] = useState<ProfileData | null>(null);
  
  // Form states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStudent, setIsStudent] = useState(false);
  
  // Track if we're coming from a specific page
  const [returnPath, setReturnPath] = useState<string>('');

  // ============================================
  // Fetch Profile from API and check return path
  // ============================================
  useEffect(() => {
    // Check if we have navigation state
    if (location.state && location.state.from) {
      console.log('Coming from:', location.state.from);
      
      if (location.state.from === 'student-account') {
        setReturnPath('/account-student');
        setIsStudent(true);
      } else if (location.state.from === 'instructor-account') {
        setReturnPath('/account-instructor');
        setIsStudent(false);
      }
    }
    
    fetchProfile();
  }, [location.state]);

  const fetchProfile = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('No access token found');
      setLoading(false);
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
      console.log('Profile data from API:', data);
      
      if (response.ok) {
        setProfile(data);
        // Set form fields
        setFirstName(data.first_name || "");
        setLastName(data.last_name || "");
        setPhone(data.phone || data.phone_number || "");
        
        // Determine if user is student or instructor (if not already set from navigation state)
        if (!returnPath) {
          if (data.student_id) {
            console.log('User is a student');
            setUserId(data.student_id);
            setIsStudent(true);
            setReturnPath('/account-student');
          } else if (data.professor_id || data.instructor_id) {
            console.log('User is an instructor');
            setUserId(data.professor_id || data.instructor_id || "");
            setIsStudent(false);
            setReturnPath('/account-instructor');
          }
        } else {
          // Set user ID based on role
          if (isStudent) {
            setUserId(data.student_id || "");
          } else {
            setUserId(data.professor_id || data.instructor_id || "");
          }
        }
      } else {
        setError(data.error || 'Failed to load profile');
      }
    } catch (err) {
      console.error('Settings fetch error:', err);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // Save Profile to API
  // ============================================
  const handleSaveProfile = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('No access token found');
      return;
    }

    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append('first_name', firstName);
      formData.append('last_name', lastName);
      formData.append('phone_number', phone);

      const response = await fetch('http://127.0.0.1:8000/api/auth/profile/update/', {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}` 
        },
        body: formData
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('Profile updated successfully');
        
        // Navigate back to the appropriate account page with state
        if (returnPath) {
          navigate(returnPath, { 
            state: { 
              fromSettings: true,
              updated: true,
              timestamp: Date.now() 
            } 
          });
        } else {
          // Fallback if returnPath is not set
          if (isStudent) {
            navigate('/account-student', { 
              state: { fromSettings: true, updated: true } 
            });
          } else {
            navigate('/account-instructor', { 
              state: { fromSettings: true, updated: true } 
            });
          }
        }
      } else {
        console.error("Failed to update profile:", data.error);
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      console.error("Network error:", err);
      setError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    // Navigate back to the appropriate account page
    if (returnPath) {
      navigate(returnPath, { 
        state: { fromSettings: true } 
      });
    } else {
      // Fallback if returnPath is not set
      if (isStudent) {
        navigate('/account-student', { 
          state: { fromSettings: true } 
        });
      } else {
        navigate('/account-instructor', { 
          state: { fromSettings: true } 
        });
      }
    }
  };

  // ============================================
  // Loading State
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-[#E8F1FA] pt-20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // Error State
  // ============================================
  if (error) {
    return (
      <div className="min-h-screen bg-[#E8F1FA] pt-20 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={() => navigate('/Login')} 
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#E8F1FA] pt-20 overflow-hidden">
      <Header showAccount={true} isRegistered={true} />

      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header with Back Button */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={handleBack} 
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors" 
                title="Back to Profile"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-100 rounded-xl">
                  <Settings className="w-6 h-6 text-[#3F72B7]" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
              </div>
            </div>
            {/* Show user type badge */}
            <div className="bg-blue-50 px-3 py-1 rounded-full">
              <span className="text-sm font-medium text-[#3F72B7]">
                {isStudent ? 'Student Account' : 'Instructor Account'}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Information Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg">
              <User className="w-5 h-5 text-[#3F72B7]" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Profile Information</h2>
          </div>

          <div className="space-y-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">First Name</label>
              <input
                placeholder="Enter your first name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3F72B7] focus:border-transparent transition-all"
                disabled={isSaving}
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name</label>
              <input
                placeholder="Enter your last name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3F72B7] focus:border-transparent transition-all"
                disabled={isSaving}
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
              <input
                placeholder="Enter your phone number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3F72B7] focus:border-transparent transition-all"
                disabled={isSaving}
              />
            </div>

            {/* ID - readonly */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {isStudent ? 'Student ID' : 'Professor ID'}
              </label>
              <input
                placeholder="ID"
                type="text"
                value={userId}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 cursor-not-allowed text-slate-500"
                disabled
              />
            </div>

            {/* Email - readonly */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
              <input
                placeholder="Email"
                type="email"
                value={profile?.real_email || ''}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 cursor-not-allowed text-slate-500"
                disabled
              />
              <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveProfile}
              disabled={isSaving}
              className="w-full bg-[#3F72B7] hover:bg-[#3565A3] text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
            >
              {isSaving ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Shield className="w-5 h-5 text-[#3F72B7]" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Security</h2>
          </div>
          <div className="space-y-4">
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-lg transition-all border border-slate-200">
              <div className="flex items-center gap-3">
                <Lock className="w-5 h-5 text-slate-600" />
                <div className="text-left">
                  <p className="font-semibold text-slate-900">Change Password</p>
                  <p className="text-sm text-slate-500">Update your account password</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
            <div className="w-full flex items-center justify-between p-4 rounded-lg border border-slate-200">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-slate-600" />
                <div className="text-left">
                  <p className="font-semibold text-slate-900">Two-Factor Authentication</p>
                  <p className="text-sm text-slate-500">Add an extra layer of security</p>
                </div>
              </div>
              <button className="bg-[#3F72B7] hover:bg-[#3565A3] text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-all">Enable</button>
            </div>
          </div>
        </div>

        {/* Preferences Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Settings className="w-5 h-5 text-[#3F72B7]" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Preferences</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-slate-600" />
                <div>
                  <p className="font-semibold text-slate-900">Dark Mode</p>
                  <p className="text-sm text-slate-500">Switch to a dark theme</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  title="Toggle dark mode" 
                  type="checkbox" 
                  checked={darkMode} 
                  onChange={() => setDarkMode(!darkMode)} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3F72B7]"></div>
              </label>
            </div>
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-lg transition-all border border-slate-200">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-slate-600" />
                <div className="text-left">
                  <p className="font-semibold text-slate-900">Language</p>
                  <p className="text-sm text-slate-500">Choose your default language</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-600">{language}</span>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </div>
            </button>
            <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-slate-600" />
                <div>
                  <p className="font-semibold text-slate-900">Email Notifications</p>
                  <p className="text-sm text-slate-500">Receive updates via email</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  title="Toggle email notifications" 
                  type="checkbox" 
                  checked={emailNotifications} 
                  onChange={() => setEmailNotifications(!emailNotifications)} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3F72B7]"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Data & Privacy Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Database className="w-5 h-5 text-[#3F72B7]" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Data & Privacy</h2>
          </div>
          <div className="space-y-4">
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-lg transition-all border border-slate-200">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-slate-600" />
                <div className="text-left">
                  <p className="font-semibold text-slate-900">Download My Data</p>
                  <p className="text-sm text-slate-500">Get a copy of your information</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-red-50 rounded-lg transition-all border border-red-200">
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-red-600" />
                <div className="text-left">
                  <p className="font-semibold text-red-600">Delete Account</p>
                  <p className="text-sm text-red-400">Permanently remove your account</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-red-400" />
            </button>
          </div>
        </div>

        {/* Help & Support Section */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg">
              <HelpCircle className="w-5 h-5 text-[#3F72B7]" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Help & Support</h2>
          </div>
          <div className="space-y-4">
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-lg transition-all border border-slate-200">
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-slate-600" />
                <div className="text-left">
                  <p className="font-semibold text-slate-900">Help Center</p>
                  <p className="text-sm text-slate-500">Find answers to common questions</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-lg transition-all border border-slate-200">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-slate-600" />
                <div className="text-left">
                  <p className="font-semibold text-slate-900">Contact Support</p>
                  <p className="text-sm text-slate-500">Get help from our support team</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-lg transition-all border border-slate-200">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-slate-600" />
                <div className="text-left">
                  <p className="font-semibold text-slate-900">Terms & Conditions</p>
                  <p className="text-sm text-slate-500">Read our terms of services</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-lg transition-all border border-slate-200">
              <div className="flex items-center gap-3">
                <Eye className="w-5 h-5 text-slate-600" />
                <div className="text-left">
                  <p className="font-semibold text-slate-900">Privacy Policy</p>
                  <p className="text-sm text-slate-500">Learn how we protect your data</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;