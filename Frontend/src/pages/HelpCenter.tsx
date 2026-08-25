import React, { useState } from 'react';
import Header from '../components/Header';
import { useNavigate } from 'react-router-dom';
import { 
  HelpCircle, Search, ChevronRight, BookOpen, 
  Video, MessageCircle, FileText, ArrowLeft,
  Mail, Phone, Globe, Clock, Award, Shield,
  User, Settings, Lock, Download
} from 'lucide-react';
import { motion } from 'framer-motion';

const HelpCenter: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'All Topics', icon: BookOpen },
    { id: 'account', name: 'Account', icon: User },
    { id: 'exams', name: 'Exams', icon: Award },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  const faqs = [
    {
      category: 'account',
      question: 'How do I create an account?',
      answer: 'Click on the "Sign Up" button and fill in your details. You can register as a student or instructor.',
      icon: User
    },
    {
      category: 'account',
      question: 'How do I reset my password?',
      answer: 'Go to Settings > Security > Change Password, or use the "Forgot Password" link on the login page.',
      icon: Lock
    },
    {
      category: 'exams',
      question: 'How do I join an exam?',
      answer: 'Students can join exams using the exam code provided by their instructor. Go to Dashboard and click "Join Exam".',
      icon: Award
    },
    {
      category: 'exams',
      question: 'What happens if I lose connection during an exam?',
      answer: 'Your progress is automatically saved. You can reconnect and continue from where you left off.',
      icon: Globe
    },
    {
      category: 'security',
      question: 'Is my data secure?',
      answer: 'Yes, we use encryption and follow industry best practices to protect your data.',
      icon: Shield
    },
    {
      category: 'settings',
      question: 'How do I change my notification settings?',
      answer: 'Go to Settings > Preferences to manage your notification preferences.',
      icon: Settings
    },
    {
      category: 'exams',
      question: 'Can I review my exam answers?',
      answer: 'Yes, after the exam is graded, you can review your answers in the Results section.',
      icon: FileText
    }
  ];

  const tutorials = [
    {
      title: 'Getting Started Guide',
      description: 'Learn the basics of ExamGuard',
      duration: '5 min',
      type: 'article',
      icon: BookOpen
    },
    {
      title: 'How to Create an Exam',
      description: 'Step-by-step guide for instructors',
      duration: '10 min',
      type: 'video',
      icon: Video
    },
    {
      title: 'Taking Your First Exam',
      description: 'What to expect as a student',
      duration: '7 min',
      type: 'video',
      icon: Video
    },
    {
      title: 'Understanding Your Results',
      description: 'How to interpret exam feedback',
      duration: '4 min',
      type: 'article',
      icon: FileText
    }
  ];

  const contactMethods = [
    {
      icon: Mail,
      title: 'Email Support',
      description: 'Get help via email',
      availability: '24-48h response',
      action: 'Send Email',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: Phone,
      title: 'Phone Support',
      description: 'Speak with an expert',
      availability: 'Mon-Fri, 9am-5pm',
      action: 'Call Now',
      color: 'bg-purple-100 text-purple-600'
    }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#E8F1FA] pt-20">
      <Header showAccount={true} isRegistered={true} />

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Back Button & Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/settings')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Settings</span>
          </button>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <HelpCircle className="w-8 h-8 text-[#3F72B7]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Help Center</h1>
              <p className="text-slate-600 mt-1">Find answers to all your questions</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-8 border border-slate-200">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search for help..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#3F72B7] focus:border-transparent text-lg"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Browse by Category</h2>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategory === category.id;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    isSelected 
                      ? 'bg-[#3F72B7] text-white' 
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{category.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* FAQs Section */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFaqs.map((faq, index) => {
              const Icon = faq.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-white rounded-xl p-6 border border-slate-200 hover:shadow-md transition-shadow cursor-pointer group"
                  onClick={() => {
                    // يمكن إضافة توسيع للإجابة هنا
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                      <Icon className="w-5 h-5 text-[#3F72B7]" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 mb-2">{faq.question}</h3>
                      <p className="text-slate-600 text-sm">{faq.answer}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Tutorials Section */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Video Tutorials & Guides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tutorials.map((tutorial, index) => {
              const Icon = tutorial.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className={`p-3 rounded-xl mb-4 ${
                    tutorial.type === 'video' ? 'bg-red-100' : 'bg-blue-100'
                  } w-fit`}>
                    <Icon className={`w-6 h-6 ${
                      tutorial.type === 'video' ? 'text-red-600' : 'text-[#3F72B7]'
                    }`} />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1">{tutorial.title}</h3>
                  <p className="text-sm text-slate-600 mb-2">{tutorial.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{tutorial.duration}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      tutorial.type === 'video' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {tutorial.type === 'video' ? 'Video' : 'Article'}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Contact Support */}
        <div className="bg-gradient-to-r from-[#3F72B7] to-[#2A4F8C] rounded-2xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-6">Still Need Help?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {contactMethods.map((method, index) => {
              const Icon = method.icon;
              return (
                <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-5 hover:bg-white/20 transition-colors">
                  <div className={`p-3 rounded-xl ${method.color} w-fit mb-3`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold mb-1">{method.title}</h3>
                  <p className="text-sm text-white/80 mb-2">{method.description}</p>
                  <p className="text-xs text-white/60 mb-3">{method.availability}</p>
                  <button className="text-sm bg-white text-[#3F72B7] px-4 py-2 rounded-lg font-semibold hover:bg-opacity-90 transition-colors">
                    {method.action}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpCenter;