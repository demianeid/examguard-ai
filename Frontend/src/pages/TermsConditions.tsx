import React from 'react';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const TermsConditions: React.FC = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: '1. Acceptance of Terms',
      content: 'By accessing and using ExamGuard, you agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you may not use our services.',
      icon: CheckCircle
    },
    {
      title: '2. User Accounts',
      content: 'You are responsible for maintaining the confidentiality of your account credentials. You must notify us immediately of any unauthorized use of your account. We reserve the right to terminate accounts that violate our terms.',
      icon: FileText
    },
    {
      title: '3. Exam Conduct',
      content: 'Users must adhere to academic integrity standards. Any form of cheating, unauthorized collaboration, or use of prohibited materials during exams is strictly forbidden and may result in account termination.',
      icon: AlertCircle
    },
    {
      title: '4. Intellectual Property',
      content: 'All content on ExamGuard, including exam materials, software, and trademarks, is our property or our licensors. You may not reproduce, distribute, or create derivative works without explicit permission.',
      icon: FileText
    },
    {
      title: '5. Privacy Policy',
      content: 'Your use of ExamGuard is also governed by our Privacy Policy. Please review it to understand our practices regarding your personal information.',
      icon: FileText
    },
    {
      title: '6. Payment Terms',
      content: 'Fees for paid services are non-refundable except as required by law. We reserve the right to change our pricing with reasonable notice. Subscription fees will be charged automatically at the beginning of each billing period.',
      icon: FileText
    },
    {
      title: '7. Termination',
      content: 'We may terminate or suspend your account immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.',
      icon: AlertCircle
    },
    {
      title: '8. Limitation of Liability',
      content: 'ExamGuard shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use or inability to use the service.',
      icon: AlertCircle
    },
    {
      title: '9. Changes to Terms',
      content: 'We reserve the right to modify these terms at any time. We will notify users of significant changes via email or through the platform. Continued use after changes constitutes acceptance.',
      icon: FileText
    },
    {
      title: '10. Contact Information',
      content: 'For questions about these Terms, please contact us at legal@examguard.com or through our support channels.',
      icon: FileText
    }
  ];

  const lastUpdated = 'March 15, 2024';

  return (
    <div className="min-h-screen bg-[#E8F1FA] pt-20">
      <Header showAccount={true} isRegistered={true} />

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate('/settings')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Settings</span>
        </button>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm p-8 mb-8 border border-slate-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <FileText className="w-8 h-8 text-[#3F72B7]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Terms & Conditions</h1>
              <p className="text-slate-600 mt-1">Last updated: {lastUpdated}</p>
            </div>
          </div>
          <div className="prose max-w-none">
            <p className="text-slate-600">
              Please read these terms and conditions carefully before using ExamGuard. By accessing or using our platform, you agree to be bound by these terms.
            </p>
          </div>
        </div>

        {/* Terms Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <div key={index} className="bg-white rounded-2xl shadow-sm p-6 border border-slate-200 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${
                    section.icon === CheckCircle ? 'bg-green-100' : 
                    section.icon === AlertCircle ? 'bg-red-100' : 'bg-blue-100'
                  }`}>
                    <Icon className={`w-5 h-5 ${
                      section.icon === CheckCircle ? 'text-green-600' :
                      section.icon === AlertCircle ? 'text-red-600' : 'text-[#3F72B7]'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-slate-900 mb-3">{section.title}</h2>
                    <p className="text-slate-600 leading-relaxed">{section.content}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Acceptance Footer */}
        <div className="mt-8 bg-blue-50 rounded-2xl p-6 border border-blue-200">
          <p className="text-sm text-blue-800">
            By continuing to use ExamGuard, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions.
          </p>
          <div className="flex items-center gap-4 mt-4">
            <button 
              onClick={() => navigate('/settings')}
              className="bg-[#3F72B7] hover:bg-[#3565A3] text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              I Agree
            </button>
            <button 
              onClick={() => navigate('/')}
              className="text-slate-600 hover:text-slate-900 px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Decline
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;