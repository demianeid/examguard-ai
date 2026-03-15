import Header from '../components/Header';
import { motion } from 'framer-motion';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import React, { useState, useEffect } from 'react';
import {
  Eye, AlertCircle, Info, Clock, Users, FileText,
  Calendar, BarChart3, ChevronLeft, CheckCircle
} from 'lucide-react';

const getToken = () => localStorage.getItem('access_token');
const apiRequest = async (url: string, options: RequestInit = {}) => {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${getToken()}`,
      ...options.headers,
    },
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
};

interface Exam {
  id: number;
  title: string;
  start_datetime: string;
  duration: number;
  status: 'upcoming' | 'active' | 'completed';
  questions_count: number;
}

const ProctoringPage = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = (searchParams.get('tab') as 'monitor' | 'activity') || 'monitor';

  const [activeTab, setActiveTab] = useState<'monitor' | 'activity'>(defaultTab);
  const [exam, setExam] = useState<Exam | null>(null);
  const [examLoading, setExamLoading] = useState(true);

  // Mock suspicious activity data — replace with real API
  const suspiciousActivity = {
    high: [
      { id: 1, student: 'Ahmed Hassan', event: 'Multiple tab switches detected', time: '10:23 AM', count: 4 },
      { id: 2, student: 'Sara Mohamed', event: 'Face not visible in camera', time: '10:31 AM', count: 2 },
    ],
    medium: [
      { id: 3, student: 'Omar Khaled', event: 'Looking away from screen', time: '10:18 AM', count: 6 },
      { id: 4, student: 'Nour Ali', event: 'Unusual mouse movement pattern', time: '10:40 AM', count: 3 },
      { id: 5, student: 'Youssef Tarek', event: 'Copy-paste attempt blocked', time: '10:45 AM', count: 1 },
    ],
    low: [
      { id: 6, student: 'Mona Samir', event: 'Window minimized briefly', time: '10:15 AM', count: 1 },
      { id: 7, student: 'Karim Adel', event: 'Keyboard shortcut attempt', time: '10:52 AM', count: 2 },
    ],
  };

  const liveStudents = [
    { id: 1, name: 'Ahmed Hassan', status: 'flagged', progress: 65 },
    { id: 2, name: 'Sara Mohamed', status: 'flagged', progress: 40 },
    { id: 3, name: 'Omar Khaled', status: 'warning', progress: 80 },
    { id: 4, name: 'Nour Ali', status: 'warning', progress: 55 },
    { id: 5, name: 'Youssef Tarek', status: 'warning', progress: 90 },
    { id: 6, name: 'Mona Samir', status: 'online', progress: 70 },
    { id: 7, name: 'Karim Adel', status: 'online', progress: 45 },
    { id: 8, name: 'Layla Hassan', status: 'online', progress: 85 },
    { id: 9, name: 'Tarek Ali', status: 'online', progress: 60 },
    { id: 10, name: 'Rania Saeed', status: 'online', progress: 75 },
    { id: 11, name: 'Hassan Omar', status: 'online', progress: 50 },
  ];

  const totalIncidents =
    suspiciousActivity.high.length +
    suspiciousActivity.medium.length +
    suspiciousActivity.low.length;

  useEffect(() => {
    if (examId) fetchExam(parseInt(examId));
  }, [examId]);

  const fetchExam = async (id: number) => {
    setExamLoading(true);
    try {
      const data = await apiRequest(`http://127.0.0.1:8000/api/exam/${id}/`);
      const now = new Date();
      const start = new Date(data.start_datetime);
      const end = new Date(start.getTime() + data.duration * 60 * 1000);
      let status: 'upcoming' | 'active' | 'completed';
      if (now < start) status = 'upcoming';
      else if (now >= start && now <= end) status = 'active';
      else status = 'completed';
      setExam({ ...data, status: data.status ?? status });
    } catch {
      // Fallback to test exam if API fails
      setExam({
        id,
        title: 'Midterm Exam — Software Engineering',
        start_datetime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        duration: 90,
        status: 'active',
        questions_count: 40,
      });
    } finally {
      setExamLoading(false);
    }
  };

  const flagged = liveStudents.filter(s => s.status === 'flagged').length;
  const warning = liveStudents.filter(s => s.status === 'warning').length;
  const online = liveStudents.filter(s => s.status === 'online').length;

  const getCameraRingColor = (status: string) => {
    switch (status) {
      case 'flagged': return 'ring-2 ring-red-500 border-red-400';
      case 'warning': return 'ring-2 ring-orange-400 border-orange-300';
      default: return 'ring-1 ring-green-400 border-green-300';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'flagged':
        return (
          <span className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">
            <AlertCircle size={9} />FLAGGED
          </span>
        );
      case 'warning':
        return (
          <span className="absolute top-2 left-2 flex items-center gap-1 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">
            ⚠ WARN
          </span>
        );
      default:
        return (
          <span className="absolute top-2 left-2 flex items-center gap-1 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">
            <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />LIVE
          </span>
        );
    }
  };

  const getCameraIcon = (status: string) => {
    if (status === 'flagged')
      return (
        <svg viewBox="0 0 24 24" className="w-8 h-8 text-red-400 mb-1" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
          <line x1="1" y1="1" x2="23" y2="23" strokeWidth="2" />
        </svg>
      );
    return (
      <svg viewBox="0 0 24 24" className="w-8 h-8 text-gray-400 mb-1" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
      </svg>
    );
  };

  // --- Live Monitor Tab ---
  const LiveMonitorTab = () => (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-5 text-center shadow-sm">
          <p className="text-4xl font-bold text-green-700">{online}</p>
          <p className="text-sm text-green-600 font-medium mt-1 flex items-center justify-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block animate-pulse" />Online
          </p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-5 text-center shadow-sm">
          <p className="text-4xl font-bold text-orange-600">{warning}</p>
          <p className="text-sm text-orange-500 font-medium mt-1">⚠ Warning</p>
        </div>
        <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-xl p-5 text-center shadow-sm">
          <p className="text-4xl font-bold text-red-600">{flagged}</p>
          <p className="text-sm text-red-500 font-medium mt-1 flex items-center justify-center gap-1">
            <AlertCircle size={13} />Flagged
          </p>
        </div>
      </div>

      {/* Progress bar */}
      {exam && (
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Clock size={15} className="text-[#1A80F6]" />Exam progress
            </span>
            <span className="text-sm font-bold text-[#1A80F6]">~47 min remaining</span>
          </div>
          <div className="w-full bg-blue-100 rounded-full h-3 overflow-hidden">
            <div className="bg-gradient-to-r from-[#1A80F6] to-[#4A90E2] h-3 rounded-full transition-all" style={{ width: '48%' }} />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Started {new Date(exam.start_datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            <span>{exam.duration} min total</span>
          </div>
        </div>
      )}

      {/* Camera grid */}
      <div>
        <h3 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Eye size={16} className="text-[#1A80F6]" />
          Camera feeds — {liveStudents.length} students
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {liveStudents.map(student => (
            <div
              key={student.id}
              className={`relative rounded-xl overflow-hidden border bg-gray-900 ${getCameraRingColor(student.status)}`}
              style={{ aspectRatio: '4/3' }}
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                {getCameraIcon(student.status)}
                <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-lg border-2 border-gray-500">
                  {student.name.charAt(0)}
                </div>
              </div>
              {getStatusBadge(student.status)}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2.5 py-2.5">
                <p className="text-white text-xs font-semibold truncate">{student.name}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="flex-1 bg-white/20 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-white" style={{ width: `${student.progress}%` }} />
                  </div>
                  <span className="text-white text-[10px] font-bold">{student.progress}%</span>
                </div>
              </div>
              {student.status === 'flagged' && (
                <div className="absolute inset-0 border-2 border-red-500 rounded-xl animate-pulse pointer-events-none" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // --- Suspicious Activity Tab ---
  const ActivityTab = () => (
    <div className="space-y-4">
      {/* High */}
      <div className="bg-white rounded-xl border border-red-200 overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-red-600 to-red-700">
          <AlertCircle size={18} className="text-white" />
          <span className="font-semibold text-white">High Severity</span>
          <span className="ml-auto bg-white text-red-600 text-xs font-bold px-2.5 py-1 rounded-full">
            {suspiciousActivity.high.length}
          </span>
        </div>
        {suspiciousActivity.high.length === 0 ? (
          <p className="px-5 py-4 text-sm text-gray-500 italic">No high severity incidents</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {suspiciousActivity.high.map(item => (
              <div key={item.id} className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-red-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
                    {item.student.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{item.student}</p>
                    <p className="text-red-600 text-xs mt-0.5 flex items-center gap-1">
                      <AlertCircle size={11} />{item.event}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className="text-xs text-gray-400">{item.time}</span>
                  <span className="inline-block bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">×{item.count} times</span>
                  <button
                    type="button"
                    onClick={() => navigate(`/footage/${item.id}`)}
                    className="flex items-center gap-1 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <Eye size={12} /> View Footage
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Medium */}
      <div className="bg-white rounded-xl border border-orange-200 overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-orange-500 to-orange-600">
          <AlertCircle size={18} className="text-white" />
          <span className="font-semibold text-white">Medium Severity</span>
          <span className="ml-auto bg-white text-orange-600 text-xs font-bold px-2.5 py-1 rounded-full">
            {suspiciousActivity.medium.length}
          </span>
        </div>
        {suspiciousActivity.medium.length === 0 ? (
          <p className="px-5 py-4 text-sm text-gray-500 italic">No medium severity incidents</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {suspiciousActivity.medium.map(item => (
              <div key={item.id} className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-orange-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
                    {item.student.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{item.student}</p>
                    <p className="text-orange-600 text-xs mt-0.5 flex items-center gap-1">
                      <AlertCircle size={11} />{item.event}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className="text-xs text-gray-400">{item.time}</span>
                  <span className="inline-block bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full">×{item.count} times</span>
                  <button
                    type="button"
                    onClick={() => navigate(`/footage/${item.id}`)}
                    className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <Eye size={12} /> View Footage
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Low */}
      <div className="bg-white rounded-xl border border-yellow-200 overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600">
          <Info size={18} className="text-white" />
          <span className="font-semibold text-white">Low Severity</span>
          <span className="ml-auto bg-white text-yellow-600 text-xs font-bold px-2.5 py-1 rounded-full">
            {suspiciousActivity.low.length}
          </span>
        </div>
        {suspiciousActivity.low.length === 0 ? (
          <p className="px-5 py-4 text-sm text-gray-500 italic">No low severity incidents</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {suspiciousActivity.low.map(item => (
              <div key={item.id} className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-yellow-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0">
                    {item.student.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{item.student}</p>
                    <p className="text-yellow-700 text-xs mt-0.5 flex items-center gap-1">
                      <Info size={11} />{item.event}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span className="text-xs text-gray-400">{item.time}</span>
                  <span className="inline-block bg-yellow-100 text-yellow-700 text-xs font-bold px-2 py-0.5 rounded-full">×{item.count} times</span>
                  <button
                    type="button"
                    onClick={() => navigate(`/footage/${item.id}`)}
                    className="flex items-center gap-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <Eye size={12} /> View Footage
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full pt-20 min-h-screen bg-gradient-to-br from-[#E3F0FE] to-[#F0F7FF]">
      <Header fixed={true} showAccount={true} isRegistered={true} userType="instructor" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* Back + header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 sm:p-6 mb-6 border border-white/50">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-sm"
              >
                <ChevronLeft size={18} />Back
              </button>
              <div>
                {examLoading ? (
                  <div className="w-48 h-5 bg-gray-200 animate-pulse rounded mb-1" />
                ) : (
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{exam?.title}</h1>
                )}
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />LIVE
                  </span>
                  {exam && (
                    <>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar size={12} />
                        {new Date(exam.start_datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock size={12} />{exam.duration} min
                      </span>
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <FileText size={12} />{exam.questions_count} questions
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Summary badges */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 px-3 py-2 rounded-lg">
                <Users size={15} className="text-green-600" />
                <span className="text-sm font-bold text-green-700">{online}</span>
                <span className="text-xs text-green-600">online</span>
              </div>
              <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 px-3 py-2 rounded-lg">
                <AlertCircle size={15} className="text-orange-500" />
                <span className="text-sm font-bold text-orange-600">{warning}</span>
                <span className="text-xs text-orange-500">warnings</span>
              </div>
              <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
                <AlertCircle size={15} className="text-red-600" />
                <span className="text-sm font-bold text-red-700">{flagged}</span>
                <span className="text-xs text-red-500">flagged</span>
              </div>
              <div className="flex items-center gap-1.5 bg-purple-50 border border-purple-200 px-3 py-2 rounded-lg">
                <BarChart3 size={15} className="text-purple-600" />
                <span className="text-sm font-bold text-purple-700">{totalIncidents}</span>
                <span className="text-xs text-purple-500">incidents</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <div className="flex border-b border-gray-200">
            {[
              { id: 'monitor', label: 'Live Monitor', icon: Eye },
              { id: 'activity', label: 'Suspicious Activity', icon: AlertCircle },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id as 'monitor' | 'activity')}
                className={`flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-all duration-200 border-b-2 ${
                  activeTab === id
                    ? 'border-[#1A80F6] text-[#1A80F6] bg-blue-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon size={17} />
                {label}
                {id === 'activity' && totalIncidents > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                    {totalIncidents}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-5 sm:p-6">
            {activeTab === 'monitor' && <LiveMonitorTab />}
            {activeTab === 'activity' && <ActivityTab />}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProctoringPage;