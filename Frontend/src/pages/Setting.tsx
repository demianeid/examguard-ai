import React, { useState, useEffect } from "react";
import { 
  User, Lock, Shield, Moon, Globe, Bell, Database, Trash2, 
  HelpCircle, MessageCircle, FileText, Eye, ChevronRight, 
  ArrowLeft, Settings, Save, CheckCircle, X, AlertTriangle, ExternalLink 
} from "lucide-react";
import Header from '../components/Header';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from "framer-motion";

// Modal Component for better UX
const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
};

interface ProfileData {
  id?: string;
  first_name: string;
  last_name: string;
  phone?: string;
  phone_number?: string;
  email?: string;
  profile_image?: string | null;
  user_role?: string;
}

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [emailNotifications, setEmailNotifications] = useState(() => {
    const saved = localStorage.getItem('emailNotifications');
    return saved ? JSON.parse(saved) : true;
  });
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('language') || "English";
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Delete account confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isStudent, setIsStudent] = useState(false);
  const [returnPath, setReturnPath] = useState<string>('');

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('emailNotifications', JSON.stringify(emailNotifications));
  }, [emailNotifications]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    if (location.state?.from) {
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
      setFetchError('No access token found');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('https://examguard-ai-production.up.railway.app/api/auth/profile/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        setFetchError('Session expired. Please login again.');
        setTimeout(() => navigate('/Login'), 2000);
        return;
      }

      const data = await response.json();

      if (response.ok) {
        setProfile(data);
        setFirstName(data.first_name || "");
        setLastName(data.last_name || "");
        setPhone(data.phone || data.phone_number || "");
        setUserId(data.id || "");

        if (data.user_role === 'student') {
          setIsStudent(true);
          setReturnPath(prev => prev || '/account-student');
        } else {
          setIsStudent(false);
          setReturnPath(prev => prev || '/account-instructor');
        }
      } else {
        setFetchError(data.error || 'Failed to load profile');
      }
    } catch (err) {
      setFetchError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaveError(null);
    if (!firstName.trim()) { setSaveError('First name is required'); return; }
    if (!lastName.trim())  { setSaveError('Last name is required');  return; }

    const token = localStorage.getItem('access_token');
    if (!token) { setSaveError('No access token found'); return; }

    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.append('first_name', firstName);
      formData.append('last_name', lastName);
      formData.append('phone_number', phone);

      const response = await fetch('https://examguard-ai-production.up.railway.app/api/auth/profile/update/', {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await response.json();

      if (response.ok) {
        setShowSuccess(true);
        setTimeout(() => {
          const path = returnPath || (isStudent ? '/account-student' : '/account-instructor');
          navigate(path, { state: { fromSettings: true, updated: true } });
        }, 2500);
      } else {
        setSaveError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setSaveError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All fields are required");
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      setPasswordError("No access token found");
      return;
    }

    try {
      const response = await fetch('https://examguard-ai-production.up.railway.app/api/auth/change-password/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setPasswordSuccess("Password changed successfully!");
        setTimeout(() => {
          setShowPasswordModal(false);
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        }, 2000);
      } else {
        setPasswordError(data.error || "Failed to change password");
      }
    } catch (err) {
      setPasswordError("Network error. Please try again.");
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError("");

    if (deleteConfirmation !== "DELETE") {
      setDeleteError("Please type DELETE to confirm");
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      setDeleteError("No access token found");
      return;
    }

    try {
      const response = await fetch('https://examguard-ai-production.up.railway.app/api/auth/delete-account/', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        localStorage.clear();
        navigate('/Login', { state: { message: "Account deleted successfully" } });
      } else {
        const data = await response.json();
        setDeleteError(data.error || "Failed to delete account");
      }
    } catch (err) {
      setDeleteError("Network error. Please try again.");
    }
  };

  const handleDownloadData = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const response = await fetch('https://examguard-ai-production.up.railway.app/api/auth/download-data/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `my-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        alert("Failed to download data");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    }
  };

  const handleEnable2FA = () => {
    // Navigate to 2FA setup page or show modal
    navigate('/setup-2fa');
  };

  const handleContactSupport = () => {
    navigate('/contact');
  };

  const handleHelpCenter = () => {
  navigate('/help-center');
};

const handleTerms = () => {
  navigate('/terms-conditions');
};

const handlePrivacy = () => {
  navigate('/privacy-policy');
};

  const handleBack = () => {
    const path = returnPath || (isStudent ? '/account-student' : '/account-instructor');
    navigate(path, { state: { fromSettings: true } });
  };

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

  if (fetchError) {
    return (
      <div className="min-h-screen bg-[#E8F1FA] pt-20 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md">
          <p className="text-red-500 mb-4">{fetchError}</p>
          <button onClick={() => navigate('/Login')} className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const languages = ["English", "Arabic"];

  return (
    <div className={`min-h-screen bg-[#E8F1FA] pt-20 overflow-hidden ${darkMode ? 'dark' : ''}`}>
      {/* Modals */}
      <AnimatePresence>
        {/* Password Change Modal */}
        {showPasswordModal && (
          <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Change Password">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3F72B7]"
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3F72B7]"
                  placeholder="Enter new password"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3F72B7]"
                  placeholder="Confirm new password"
                />
              </div>
              
              {passwordError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{passwordError}</p>
                </div>
              )}
              
              {passwordSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-600 text-sm">{passwordSuccess}</p>
                </div>
              )}

              <button
                onClick={handleChangePassword}
                className="w-full bg-[#3F72B7] hover:bg-[#3565A3] text-white font-semibold py-3 rounded-lg transition-all"
              >
                Update Password
              </button>
            </div>
          </Modal>
        )}

        {/* Language Modal */}
        {showLanguageModal && (
          <Modal isOpen={showLanguageModal} onClose={() => setShowLanguageModal(false)} title="Select Language">
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => {
                    setLanguage(lang);
                    setShowLanguageModal(false);
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    language === lang 
                      ? 'bg-[#3F72B7] text-white' 
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>
          </Modal>
        )}

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete Account">
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <p className="font-semibold text-red-600">Warning: This action cannot be undone</p>
                </div>
                <p className="text-sm text-red-600">
                  All your data will be permanently deleted. This includes your profile, exams, and history.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Type DELETE to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="DELETE"
                />
              </div>

              {deleteError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{deleteError}</p>
                </div>
              )}

              <button
                onClick={handleDeleteAccount}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 rounded-lg transition-all"
              >
                Permanently Delete Account
              </button>
            </div>
          </Modal>
        )}

        {/* 2FA Modal */}
        {show2FAModal && (
          <Modal isOpen={show2FAModal} onClose={() => setShow2FAModal(false)} title="Two-Factor Authentication">
            <div className="space-y-4">
              <p className="text-slate-600">
                Two-factor authentication adds an extra layer of security to your account. 
                Once enabled, you'll need to enter a code from your authenticator app in addition to your password.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> You'll need an authenticator app like Google Authenticator or Authy to use 2FA.
                </p>
              </div>

              <button
                onClick={handleEnable2FA}
                className="w-full bg-[#3F72B7] hover:bg-[#3565A3] text-white font-semibold py-3 rounded-lg transition-all"
              >
                Continue to Setup
              </button>
            </div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Success Alert */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-white rounded-2xl shadow-2xl px-8 py-5 flex items-center gap-4 border border-green-100"
          >
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="text-green-500 w-7 h-7" />
            </div>
            <div>
              <p className="font-bold text-gray-800 text-lg">Profile Updated!</p>
              <p className="text-gray-500 text-sm">Redirecting to your profile...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Header showAccount={true} isRegistered={true} />

      <div className="max-w-3xl mx-auto px-6 py-16">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                title="Back"
                onClick={handleBack} 
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
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
            <div className="bg-blue-50 px-3 py-1 rounded-full">
              <span className="text-sm font-medium text-[#3F72B7]">
                {isStudent ? 'Student Account' : 'Instructor Account'}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Information */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg">
              <User className="w-5 h-5 text-[#3F72B7]" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Profile Information</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">First Name</label>
              <input
                type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your first name" disabled={isSaving}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3F72B7] focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name</label>
              <input
                type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter your last name" disabled={isSaving}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3F72B7] focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
              <input
                type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number" disabled={isSaving}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3F72B7] focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                {isStudent ? 'Student ID' : 'Professor ID'}
              </label>
              <input
                title="Student ID or Professor ID"
                type="text" value={userId} disabled
                className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 cursor-not-allowed text-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
              <input
                title="Email Address"
                type="email" value={profile?.email || ''} disabled
                className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 cursor-not-allowed text-slate-500"
              />
              <p className="text-xs text-slate-500 mt-1">Email cannot be changed</p>
            </div>

            {saveError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{saveError}</p>
              </div>
            )}

            <button
              onClick={handleSaveProfile} disabled={isSaving}
              className="w-full bg-[#3F72B7] hover:bg-[#3565A3] text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
            >
              {isSaving ? (
                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>Saving...</span></>
              ) : (
                <><Save className="w-5 h-5" /><span>Save Changes</span></>
              )}
            </button>
          </div>
        </div>

        {/* Security */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg"><Shield className="w-5 h-5 text-[#3F72B7]" /></div>
            <h2 className="text-xl font-bold text-slate-900">Security</h2>
          </div>
          <div className="space-y-4">
            <button 
              onClick={() => setShowPasswordModal(true)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-lg transition-all border border-slate-200"
            >
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
              <button 
                onClick={() => setShow2FAModal(true)}
                className="bg-[#3F72B7] hover:bg-[#3565A3] text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
              >
                Enable
              </button>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg"><Settings className="w-5 h-5 text-[#3F72B7]" /></div>
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
            <button 
              onClick={() => setShowLanguageModal(true)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-lg transition-all border border-slate-200"
            >
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

        {/* Data & Privacy */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg"><Database className="w-5 h-5 text-[#3F72B7]" /></div>
            <h2 className="text-xl font-bold text-slate-900">Data & Privacy</h2>
          </div>
          <div className="space-y-4">
            <button 
              onClick={handleDownloadData}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-lg transition-all border border-slate-200"
            >
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-slate-600" />
                <div className="text-left">
                  <p className="font-semibold text-slate-900">Download My Data</p>
                  <p className="text-sm text-slate-500">Get a copy of your information</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
            <button 
              onClick={() => setShowDeleteModal(true)}
              className="w-full flex items-center justify-between p-4 hover:bg-red-50 rounded-lg transition-all border border-red-200"
            >
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

        {/* Help & Support */}
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg"><HelpCircle className="w-5 h-5 text-[#3F72B7]" /></div>
            <h2 className="text-xl font-bold text-slate-900">Help & Support</h2>
          </div>
          <div className="space-y-4">
            <button 
              onClick={handleHelpCenter}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-lg transition-all border border-slate-200"
            >
              <div className="flex items-center gap-3">
                <HelpCircle className="w-5 h-5 text-slate-600" />
                <div className="text-left">
                  <p className="font-semibold text-slate-900">Help Center</p>
                  <p className="text-sm text-slate-500">Find answers to common questions</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
            
            <button 
              onClick={handleContactSupport}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-lg transition-all border border-slate-200"
            >
              <div className="flex items-center gap-3">
                <MessageCircle className="w-5 h-5 text-slate-600" />
                <div className="text-left">
                  <p className="font-semibold text-slate-900">Contact Support</p>
                  <p className="text-sm text-slate-500">Get help from our support team</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
            
            <button 
              onClick={handleTerms}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-lg transition-all border border-slate-200"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-slate-600" />
                <div className="text-left">
                  <p className="font-semibold text-slate-900">Terms & Conditions</p>
                  <p className="text-sm text-slate-500">Read our terms of services</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
            
            <button 
              onClick={handlePrivacy}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 rounded-lg transition-all border border-slate-200"
            >
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