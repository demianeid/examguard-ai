import React, { useState } from "react";
import { 
  User, 
  Mail, 
  Phone, 
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
  Settings
} from "lucide-react";
import Header from '../components/Header'


const SettingsPage: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [language, setLanguage] = useState("English");

  // Form states
  const [fullName, setFullName] = useState("Sarah Mohamed Ali");
  const [email, setEmail] = useState("sarah.edu@gmail.com");
  const [phone, setPhone] = useState("+201234567890");
  const [studentId] = useState("INST20219001");

  const handleSaveProfile = () => {
    alert("Profile updated successfully!");
  };

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-background pt-20 overflow-hidden">
         <Header  showAccount={true} isRegistered={true} />

      <div className="max-w-3xl mx-auto px-6 py-16">
        {/* Header with Back Button */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6 border border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                title="Back"
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
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3F72B7] focus:border-transparent transition-all"
                placeholder="Sarah Mohamed Ali"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3F72B7] focus:border-transparent transition-all"
                placeholder="sarah.edu@gmail.com"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3F72B7] focus:border-transparent transition-all"
                placeholder="+201234567890"
              />
            </div>

            {/* Student ID */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                 ID
              </label>
              <input
                type="text"
                value={studentId}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-50 cursor-not-allowed text-slate-500"
                placeholder="INST20219001"
                disabled
              />
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveProfile}
              className="w-full bg-[#3F72B7] hover:bg-[#3565A3] text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              Save Profile
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
            {/* Change Password */}
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

            {/* Two-Factor Authentication */}
            <div className="w-full flex items-center justify-between p-4 rounded-lg border border-slate-200">
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5 text-slate-600" />
                <div className="text-left">
                  <p className="font-semibold text-slate-900">Two-Factor Authentication</p>
                  <p className="text-sm text-slate-500">Add an extra layer of security</p>
                </div>
              </div>
              <button className="bg-[#3F72B7] hover:bg-[#3565A3] text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-all">
                Enable
              </button>
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
            {/* Dark Mode Toggle */}
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
                  type="checkbox"
                  checked={darkMode}
                  onChange={() => setDarkMode(!darkMode)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3F72B7]"></div>
              </label>
            </div>

            {/* Language */}
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

            {/* Email Notifications */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-slate-600" />
                <div>
                  <p className="font-semibold text-slate-900">Email Notification</p>
                  <p className="text-sm text-slate-500">Receive updates via email</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
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
            {/* Download My Data */}
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

            {/* Delete Account */}
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
            {/* Help Center */}
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

            {/* Contact Support */}
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

            {/* Terms & Conditions */}
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

            {/* Privacy Policy */}
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