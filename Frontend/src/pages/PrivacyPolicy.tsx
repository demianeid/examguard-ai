import React, { useState } from 'react';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Shield, Eye, Lock, Database, 
  Mail, Globe, Clock, Download, Trash2,
  CheckCircle, AlertCircle
} from 'lucide-react';

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string>('introduction');

  const sections = [
    {
      id: 'introduction',
      title: 'Introduction',
      icon: Shield,
      content: 'At ExamGuard, we take your privacy seriously. This policy describes how we collect, use, and protect your personal information when you use our platform.',
      color: 'blue'
    },
    {
      id: 'data-collection',
      title: 'Information We Collect',
      icon: Database,
      content: 'We collect information you provide directly, such as name, email, and profile details. We also automatically collect usage data to improve our services.',
      details: [
        'Account information (name, email, phone)',
        'Exam results and performance data',
        'Device and browser information',
        'Usage patterns and preferences'
      ],
      color: 'purple'
    },
    {
      id: 'data-usage',
      title: 'How We Use Your Information',
      icon: Eye,
      content: 'Your information helps us provide and improve our services, communicate with you, and ensure platform security.',
      details: [
        'To deliver and personalize our services',
        'To communicate updates and important notices',
        'To analyze and improve platform performance',
        'To prevent fraud and ensure security'
      ],
      color: 'green'
    },
    {
      id: 'data-protection',
      title: 'Data Protection',
      icon: Lock,
      content: 'We implement industry-standard security measures to protect your data from unauthorized access, disclosure, or destruction.',
      details: [
        '256-bit encryption for sensitive data',
        'Regular security audits',
        'Strict access controls',
        'Secure data centers'
      ],
      color: 'red'
    },
    {
      id: 'data-sharing',
      title: 'Information Sharing',
      icon: Globe,
      content: 'We do not sell your personal information. We may share data with your consent or as required by law.',
      details: [
        'With instructors for educational purposes',
        'With service providers who assist our operations',
        'When required by law or legal process',
        'With your explicit consent'
      ],
      color: 'yellow'
    },
    {
      id: 'data-retention',
      title: 'Data Retention',
      icon: Clock,
      content: 'We retain your information as long as your account is active or as needed to provide services. You can request data deletion at any time.',
      details: [
        'Active accounts: retained while active',
        'Deleted accounts: data removed within 30 days',
        'Exam records: retained for academic integrity',
        'Backup retention: up to 90 days'
      ],
      color: 'indigo'
    },
    {
      id: 'your-rights',
      title: 'Your Rights',
      icon: CheckCircle,
      content: 'You have the right to access, correct, or delete your personal information. You can also export your data or object to certain processing.',
      details: [
        'Access your personal data',
        'Correct inaccurate information',
        'Delete your account and data',
        'Export your data',
        'Opt out of communications'
      ],
      color: 'teal'
    }
  ];

  const lastUpdated = 'March 15, 2024';

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#E8F1FA] pt-20">
      <Header showAccount={true} isRegistered={true} />

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Settings</span>
        </button>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-64 shrink-0">
            <div className="bg-white rounded-2xl shadow-sm p-4 border border-slate-200 sticky top-24">
              <h3 className="font-semibold text-slate-900 mb-3 px-3">Quick Links</h3>
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left ${
                        isActive 
                          ? 'bg-[#3F72B7] text-white' 
                          : 'hover:bg-slate-100 text-slate-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{section.title}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Data Controls */}
              <div className="mt-6 pt-6 border-t border-slate-200">
                <h4 className="font-semibold text-slate-900 mb-3 px-3">Your Data</h4>
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-all">
                    <Download className="w-4 h-4" />
                    <span className="text-sm">Export My Data</span>
                  </button>
                  <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 transition-all">
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm">Request Deletion</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Header */}
            <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 border border-slate-200">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Shield className="w-8 h-8 text-[#3F72B7]" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Privacy Policy</h1>
                  <p className="text-slate-600 mt-1">Last updated: {lastUpdated}</p>
                </div>
              </div>
              <p className="text-slate-600">
                Your privacy is important to us. This policy explains how we collect, use, and protect your personal information.
              </p>
            </div>

            {/* Sections */}
            <div className="space-y-6">
              {sections.map((section) => {
                const Icon = section.icon;
                const colorClasses = {
                  blue: 'bg-blue-100 text-blue-600',
                  purple: 'bg-purple-100 text-purple-600',
                  green: 'bg-green-100 text-green-600',
                  red: 'bg-red-100 text-red-600',
                  yellow: 'bg-yellow-100 text-yellow-600',
                  indigo: 'bg-indigo-100 text-indigo-600',
                  teal: 'bg-teal-100 text-teal-600'
                };

                return (
                  <div 
                    key={section.id} 
                    id={section.id}
                    className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200 scroll-mt-24"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${colorClasses[section.color as keyof typeof colorClasses]}`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-xl font-bold text-slate-900 mb-3">{section.title}</h2>
                        <p className="text-slate-600 mb-4">{section.content}</p>
                        
                        {section.details && (
                          <ul className="space-y-2">
                            {section.details.map((detail, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-slate-600">
                                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                                <span>{detail}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Contact Section */}
            <div className="mt-8 bg-gradient-to-r from-[#3F72B7] to-[#2A4F8C] rounded-2xl p-8 text-white">
              <h2 className="text-2xl font-bold mb-4">Questions About Your Privacy?</h2>
              <p className="mb-6 opacity-90">
                If you have any questions or concerns about our privacy practices, please contact our Data Protection Officer.
              </p>
              <div className="flex flex-wrap gap-4">
                <a 
                  href="mailto:privacy@examguard.com"
                  className="flex items-center gap-2 bg-white text-[#3F72B7] px-6 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  privacy@examguard.com
                </a>
                <button className="flex items-center gap-2 border border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors">
                  <Shield className="w-4 h-4" />
                  Report a Concern
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;