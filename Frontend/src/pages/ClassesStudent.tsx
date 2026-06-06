import Header from '../components/Header';
import { Link, useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import React, { useState, useEffect, useRef } from "react";
import {
  BookOpen,
  Clock,
  Users,
  FileText,
  Bell,
  Calendar,
  Award,
  X,
  AlertCircle,
  CheckCircle,
  Info,
  Megaphone,
  School,
  TrendingUp,
  Copy,
  Check,
  Sparkles,
  ChevronDown,
  Trash2,
  LogOut
} from "lucide-react";

// --- Types ---
interface ClassType {
  id: number;
  name: string;
  instructor: string;
  upcomingExams: number;
  progress: number;
  lastActivity: string;
  color: string;
  code?: string;
  subject?: string;
  description?: string;
}
interface Exam {
  id: number;
  name: string;
  date: string;
  duration: string;
  status: "upcoming" | "active" | "completed" | "missed" | "submitted" | "terminated";
  score: number | null;
  start_datetime?: string;
  end_datetime?: string;
}



// --- Ocean Blue Color Helper Functions (Same as Instructor) ---
const oceanGradients = [
  'from-[#1A80F6] to-[#4A90E2]',
  'from-[#0E6AD0] to-[#3A80D2]',
  'from-[#2C8F8F] to-[#4CAF92]',
  'from-[#00A8B5] to-[#00C2C7]',
  'from-[#1A5F8F] to-[#2E7DA2]',
  'from-[#006994] to-[#2196F3]'
];

const oceanLightGradients = [
  'from-blue-50 to-cyan-50',
  'from-sky-50 to-indigo-50',
  'from-teal-50 to-emerald-50',
  'from-cyan-50 to-blue-50',
  'from-sky-50 to-blue-50',
  'from-blue-50 to-indigo-50'
];

const oceanBorderColors = [
  'border-blue-200',
  'border-indigo-200',
  'border-teal-200',
  'border-cyan-200',
  'border-sky-200',
  'border-blue-200'
];

const oceanTextColors = [
  'text-[#1A80F6]',
  'text-[#0E6AD0]',
  'text-[#2C8F8F]',
  'text-[#00A8B5]',
  'text-[#1A5F8F]',
  'text-[#006994]'
];

const getOceanColorIndex = (colorClass: string): number => {
  const gradient = colorClass.replace('bg-gradient-to-r ', '');
  const index = oceanGradients.findIndex(g => g === gradient);
  return index !== -1 ? index : 0;
};

const getLightColorFromGradient = (gradient: string): string => {
  const index = getOceanColorIndex(gradient);
  return `bg-gradient-to-r ${oceanLightGradients[index]}`;
};

const getBorderColorFromGradient = (gradient: string): string => {
  const index = getOceanColorIndex(gradient);
  return oceanBorderColors[index];
};

const getTextColorFromGradient = (gradient: string): string => {
  const index = getOceanColorIndex(gradient);
  return oceanTextColors[index];
};

const getHoverGradientFromColor = (gradient: string): string => {
  const index = getOceanColorIndex(gradient);
  const hoverGradients = [
    'hover:from-[#0E6AD0] hover:to-[#3A80D2]',
    'hover:from-[#0A5AB0] hover:to-[#2A70C2]',
    'hover:from-[#1C7F7F] hover:to-[#3C9F82]',
    'hover:from-[#0098A5] hover:to-[#00B2B7]',
    'hover:from-[#0A4F7F] hover:to-[#1E6D92]',
    'hover:from-[#005984] hover:to-[#1186E3]'
  ];
  return hoverGradients[index];
};

const generateClassCode = (): string => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  let code = '';
  for (let i = 0; i < 3; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  code += '-';
  for (let i = 0; i < 4; i++) {
    code += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  return code;
};

const ClassesStudent = () => {
  const { classId, tab } = useParams<{ classId?: string; tab?: string }>();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);


  const [studentClasses, setStudentClasses] = useState<ClassType[]>([]);
  const [joinMessage, setJoinMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [leaveConfirm, setLeaveConfirm] = useState<ClassType | null>(null);
  const [leaveLoading, setLeaveLoading] = useState(false);



  const selectedClass = classId ? studentClasses.find(cls => cls.id === parseInt(classId)) : null;
  const activeTab = tab || "overview";

  // http://localhost:8000/api/student/classes/
  const fetchMyClasses = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/student/classes/', {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
      });
      if (!res.ok) throw new Error('Failed to fetch classes');
      const data = await res.json();
      const mapped: ClassType[] = data.map((cls: any, index: number) => ({
        id: cls.id,
        name: cls.name,
        instructor: cls.instructor || '',
        upcomingExams: cls.upcoming_exams ?? 0,
        progress: cls.progress ?? 0,
        lastActivity: cls.last_activity || '',
        color: `bg-gradient-to-r ${oceanGradients[index % oceanGradients.length]}`,
        code: cls.code || '',
        subject: cls.subject || '',
        description: cls.description || '',
      }));
      setStudentClasses(mapped);
    } catch {
      setStudentClasses([]);
    }
  };

  useEffect(() => {
    fetchMyClasses();
  }, []);

  useEffect(() => {
    const preventButtonSubmit = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const button = target.closest('button');
      if (button && !button.hasAttribute('type')) {
        button.setAttribute('type', 'button');
      }
    };
    document.addEventListener('click', preventButtonSubmit, true);
    return () => {
      document.removeEventListener('click', preventButtonSubmit, true);
    };
  }, []);


  const handleClassClick = (cls: ClassType) => {
    navigate(`/classes/${cls.id}/overview`);
  };

  const handleTabChange = (newTab: string) => {
    if (selectedClass) {
      navigate(`/classes/${selectedClass.id}/${newTab}`);
    }
  };

  const handleBackToList = () => {
    navigate("/classes");
  };

  const handleCopyCode = (code: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // ── Join Class ──────────────────────────────────────────────────────────────
  const handleJoinClass = async () => {
    const code = searchQuery.trim();
    if (!code) return;
    try {
      const res = await fetch('http://127.0.0.1:8000/api/student/classes/join/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.message || 'Failed to join class');
      setJoinMessage({
        type: 'success',
        text: `Successfully joined "${data.class_name || data.name || 'the class'}"!`,
      });
      setSearchQuery('');
      fetchMyClasses();
    } catch (err: any) {
      setJoinMessage({
        type: 'error',
        text: err.message || 'Failed to join class. Please try again.',
      });
    }
    setTimeout(() => setJoinMessage(null), 4000);
  };

  // ── Leave Class ──────────────────────────────────────────────────────────────
  const handleLeaveClass = async (cls: ClassType) => {
    setLeaveLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/student/classes/${cls.id}/leave/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || data.message || 'Failed to leave class');
      }
      setStudentClasses(prev => prev.filter(c => c.id !== cls.id));
      setJoinMessage({ type: 'success', text: `You have left "${cls.name}".` });
      setTimeout(() => setJoinMessage(null), 4000);
      navigate('/classes');
    } catch (err: any) {
      setJoinMessage({ type: 'error', text: err.message || 'Failed to leave class. Please try again.' });
      setTimeout(() => setJoinMessage(null), 4000);
    } finally {
      setLeaveLoading(false);
      setLeaveConfirm(null);
    }
  };

  // Tab Components
  const OverviewTab = ({ class: cls }: { class: ClassType }) => {
    const [nextExam, setNextExam] = useState<Exam | null>(null);
    const [examLoading, setExamLoading] = useState(true);
    const [overallGrade, setOverallGrade] = useState<number | null>(null);

    useEffect(() => {
      fetch(`http://127.0.0.1:8000/api/student/classes/${cls.id}/grades/`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
      })
        .then(r => r.json())
        .then(data => {
          if (data.length > 0) {
            const avg = data.reduce((s: number, g: any) => s + parseFloat(g.percentage), 0) / data.length;
            setOverallGrade(Math.round(avg));
          }
        })
        .catch(() => { });
    }, [cls.id]);

    useEffect(() => {
      const fetchNextExam = async () => {
        setExamLoading(true);
        try {
          const res = await fetch(`http://127.0.0.1:8000/api/student/classes/${cls.id}/exams/`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
          });
          if (!res.ok) throw new Error('Failed');
          const data = await res.json();
          const upcoming = data
            .filter((e: any) => e.status === 'upcoming')
            .sort((a: any, b: any) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime());
          if (upcoming.length > 0) {
            const e = upcoming[0];
            setNextExam({
              id: e.id,
              name: e.title,
              date: e.start_datetime ? new Date(e.start_datetime).toLocaleDateString('en-CA') : '',
              duration: `${e.duration} min`,
              status: 'upcoming',
              score: null,
            });
          }
        } catch {
          setNextExam(null);
        } finally {
          setExamLoading(false);
        }
      };
      fetchNextExam();
    }, [cls.id]);

    return (
      <div className="space-y-6">
        <div className={`${getLightColorFromGradient(cls.color)} p-5 rounded-xl border ${getBorderColorFromGradient(cls.color)}`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full ${cls.color} flex items-center justify-center text-white shadow-lg`}>
                <School size={24} />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-600">Class Code</h3>
                <div className="flex items-center gap-2">
                  <p className={`text-2xl font-mono font-bold ${getTextColorFromGradient(cls.color)}`}>
                    {cls.code}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={(e) => handleCopyCode(cls.code || '', e)}
              className={`flex items-center gap-2 bg-white hover:bg-opacity-90 px-4 py-2 rounded-lg border transition-all duration-200 shadow-sm hover:shadow ${getTextColorFromGradient(cls.color)} border-current hover:bg-opacity-10`}
            >
              {copiedCode === cls.code ? (
                <><Check size={16} className="text-green-600" /><span className="font-medium text-sm">Copied!</span></>
              ) : (
                <><Copy size={16} /><span className="font-medium text-sm">Copy Code</span></>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`${getLightColorFromGradient(cls.color)} p-5 rounded-xl border ${getBorderColorFromGradient(cls.color)} hover:shadow-md transition-shadow`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-full ${getLightColorFromGradient(cls.color)} flex items-center justify-center`}>
                <Calendar className={getTextColorFromGradient(cls.color)} size={20} />
              </div>
              <h3 className="font-semibold text-gray-800">Next Exam</h3>
            </div>
            {examLoading ? (
              <div className="w-32 h-4 bg-gray-200 animate-pulse rounded mt-1" />
            ) : nextExam ? (
              <>
                <p className="text-gray-800 font-medium text-lg">{nextExam.name}</p>
                <p className="text-gray-600 text-sm mt-1">{nextExam.date}</p>
                <p className="text-gray-600 text-sm">{nextExam.duration}</p>
              </>
            ) : (
              <p className="text-gray-500 text-sm">No upcoming exams</p>
            )}
            <button
              type="button"
              className={`mt-4 text-sm font-medium flex items-center gap-1 group ${getTextColorFromGradient(cls.color)}`}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleTabChange("exams"); }}
            >
              View all exams
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>

          <div className={`${getLightColorFromGradient(cls.color)} p-5 rounded-xl border ${getBorderColorFromGradient(cls.color)} hover:shadow-md transition-shadow`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-full ${getLightColorFromGradient(cls.color)} flex items-center justify-center`}>
                <Award className={getTextColorFromGradient(cls.color)} size={20} />
              </div>
              <h3 className="font-semibold text-gray-800">Overall Grades</h3>
            </div>
            {overallGrade !== null
              ? <p className={`text-2xl font-bold ${getTextColorFromGradient(cls.color)}`}>{overallGrade}%</p>
              : <p className="text-gray-500 text-sm">No grades available yet</p>
            }
            <button
              type="button"
              className={`mt-4 text-sm font-medium flex items-center gap-1 group ${getTextColorFromGradient(cls.color)}`}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleTabChange("grades"); }}
            >
              View detailed grades
              <span className="group-hover:translate-x-1 transition-transform">→</span>
            </button>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-8 h-8 rounded-full ${getLightColorFromGradient(cls.color)} flex items-center justify-center`}>
              <BookOpen size={16} className={getTextColorFromGradient(cls.color)} />
            </div>
            <h3 className="font-semibold text-gray-800 text-lg">Course Description</h3>
          </div>
          <p className="text-gray-600 leading-relaxed">
            {cls.description || "This course covers fundamental concepts and principles."}
          </p>
          {cls.subject && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <span className="text-sm font-medium text-gray-500">Subject:</span>
              <span className="ml-2 text-gray-800">{cls.subject}</span>
            </div>
          )}
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-8 h-8 rounded-full ${getLightColorFromGradient(cls.color)} flex items-center justify-center`}>
              <TrendingUp size={16} className={getTextColorFromGradient(cls.color)} />
            </div>
            <h3 className="font-semibold text-gray-800 text-lg">Your Progress</h3>
          </div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Overall Progress</span>
            <span className={`font-semibold ${getTextColorFromGradient(cls.color)}`}>{cls.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className={`bg-gradient-to-r ${cls.color.replace('bg-gradient-to-r ', '')} h-2.5 rounded-full transition-all duration-500`}
              style={{ width: `${cls.progress}%` }}
            />
          </div>
          <p className="text-gray-500 text-sm mt-3">Last activity: {cls.lastActivity}</p>
        </div>

        {/* ── Leave Class ── */}
        <div className="bg-white p-5 rounded-xl border border-red-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-800">Leave Class</h3>
              <p className="text-sm text-gray-500 mt-0.5">
                You will lose access to all materials and exams. You can rejoin with the class code.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setLeaveConfirm(cls)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300 transition-all duration-200 text-sm font-medium whitespace-nowrap ml-4"
            >
              <LogOut size={15} />
              Leave Class
            </button>
          </div>
        </div>

        {/* ── Leave Confirmation Modal ── */}
        <AnimatePresence>
          {leaveConfirm?.id === cls.id && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
              onClick={() => setLeaveConfirm(null)}
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                transition={{ duration: 0.18 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm"
              >
                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                  <LogOut size={26} className="text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 text-center mb-1">Leave Class?</h3>
                <p className="text-sm text-gray-500 text-center mb-1">You are about to leave</p>
                <p className="text-sm font-semibold text-gray-800 text-center mb-3">"{cls.name}"</p>
                <p className="text-xs text-gray-400 text-center mb-6">
                  You will lose access to all class materials and exams. You can rejoin using the class code.
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setLeaveConfirm(null)}
                    className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={leaveLoading}
                    onClick={() => handleLeaveClass(cls)}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {leaveLoading
                      ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <LogOut size={15} />}
                    {leaveLoading ? 'Leaving...' : 'Leave Class'}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const ExamsTab = () => {
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      if (!selectedClass) return;
      const fetchExams = async () => {
        try {
          const res = await fetch(`http://127.0.0.1:8000/api/student/classes/${selectedClass.id}/exams/`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
          });
          if (!res.ok) throw new Error('Failed');
          const data = await res.json();
          setExams(data.map((e: any) => ({
            id: e.id,
            name: e.title,
            date: e.start_datetime ? new Date(e.start_datetime).toLocaleDateString('en-CA') : '',
            duration: `${e.duration} min`,
            status: e.status,
            score: e.score ?? null,
            start_datetime: e.start_datetime,
            end_datetime: e.end_datetime,
          })));
        } catch {
          setExams([]);
        } finally {
          setLoading(false);
        }
      };
      fetchExams();
      const interval = setInterval(fetchExams, 10000);
      return () => clearInterval(interval);
    }, [selectedClass?.id]);

    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-[#1A80F6] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading exams...</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-gray-800 text-lg">Your Exams</h3>
        </div>
        {exams.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
            <FileText size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Exams Yet</h3>
            <p className="text-gray-500 text-sm">Exams will appear here once your instructor creates them</p>
          </div>
        ) : (
          exams.map((exam) => (
            <div key={exam.id} className="bg-white border p-5 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-semibold text-gray-800 text-lg">{exam.name}</h4>
                  <div className="text-gray-600 text-sm flex gap-4 mt-2">
                    <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                      <Calendar size={14} className="text-gray-500" />{exam.date}
                    </span>
                    <span className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded">
                      <Clock size={14} className="text-gray-500" />{exam.duration}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {exam.status === "active" ? (
                    <>
                      <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm font-medium">Active</span>
                      <Link
                        to={`/exam/${exam.id}`}
                        className={`${selectedClass?.color || 'bg-gradient-to-r from-[#1A80F6] to-[#4A90E2]'} text-white px-4 py-2 rounded-lg ${getHoverGradientFromColor(selectedClass?.color || '')} transition-all duration-200 flex items-center gap-2 shadow-md hover:shadow-lg`}
                      >
                        <Sparkles size={16} />Start Exam
                      </Link>
                    </>
                  ) : exam.status === "upcoming" ? (
                    <>
                      <span className="px-3 py-1 bg-blue-100 text-[#1A80F6] rounded-full text-sm font-medium">Upcoming</span>
                      <span className="text-xs text-gray-500">
                        Starts: {exam.start_datetime ? (() => {
                          const d = new Date(exam.start_datetime);
                          const h = d.getHours();
                          const min = String(d.getMinutes()).padStart(2, '0');
                          const ampm = h >= 12 ? 'PM' : 'AM';
                          const h12 = h % 12 || 12;
                          return `${d.toLocaleDateString('en-CA')} at ${h12}:${min} ${ampm}`;
                        })() : ''}
                      </span>
                    </>
                  ) : exam.status === "missed" ? (
                    <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-medium">Missed</span>
                  ) : exam.status === "terminated" ? (
                    <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium border border-red-200">Terminated</span>
                  ) : exam.status === "submitted" ? (
                    <span className="px-3 py-1 bg-purple-100 text-purple-600 rounded-full text-sm font-medium">Submitted</span>
                  ) : (
                    <>
                      <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-sm font-medium">Completed</span>
                      {exam.score != null && (
                        <div className="text-right">
                          <span className="text-sm text-gray-500">Score</span>
                          <p className={`text-2xl font-bold ${getTextColorFromGradient(selectedClass?.color || '')}`}>{exam.score}%</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  interface GradeResult {
    exam_title: string;
    percentage: number;
    total_marks_obtained: number;
    total_marks: number;
    submitted_at: string;
  }

  const GradesTab = () => {
    const [grades, setGrades] = useState<GradeResult[]>([]);
    const [gradesLoading, setGradesLoading] = useState(true);

    useEffect(() => {
      if (!selectedClass) return;
      const fetchGrades = async () => {
        setGradesLoading(true);
        try {
          const res = await fetch(`http://127.0.0.1:8000/api/student/classes/${selectedClass.id}/grades/`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` },
          });
          if (!res.ok) throw new Error('Failed');
          const data = await res.json();
          setGrades(data);
        } catch {
          setGrades([]);
        } finally {
          setGradesLoading(false);
        }
      };
      fetchGrades();
    }, [selectedClass?.id]);

    const average = grades.length > 0
      ? Math.round(grades.reduce((sum, g) => sum + g.percentage, 0) / grades.length)
      : null;

    if (gradesLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-12 h-12 border-4 border-[#1A80F6] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">Loading grades...</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className={`${getLightColorFromGradient(selectedClass?.color || '')} p-6 rounded-xl border ${getBorderColorFromGradient(selectedClass?.color || '')} shadow-sm`}>
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-16 h-16 rounded-full ${selectedClass?.color || 'bg-gradient-to-r from-[#1A80F6] to-[#4A90E2]'} flex items-center justify-center text-white shadow-lg`}>
              <Award size={32} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-800">Overall Grade</h3>
              {average !== null ? (
                <p className={`text-3xl font-bold mt-1 ${getTextColorFromGradient(selectedClass?.color || '')}`}>
                  {average}%
                </p>
              ) : (
                <p className="text-gray-500 mt-1">No grades available yet</p>
              )}
            </div>
          </div>
        </div>

        {grades.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
            <Award size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Grades Yet</h3>
            <p className="text-gray-500 text-sm">Your exam results will appear here once graded</p>
          </div>
        ) : (
          <div className="space-y-3">
            {grades.map((g, idx) => (
              <div key={idx} className="bg-white border border-gray-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-gray-800 text-lg">{g.exam_title}</h4>
                    <p className="text-gray-500 text-sm mt-1">
                      Submitted: {new Date(g.submitted_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-2xl font-bold ${getTextColorFromGradient(selectedClass?.color || '')}`}>
                      {g.percentage}%
                    </p>
                    <p className="text-gray-500 text-sm">
                      {g.total_marks_obtained}/{g.total_marks}
                    </p>
                  </div>
                </div>
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`bg-gradient-to-r ${(selectedClass?.color || '').replace('bg-gradient-to-r ', '')} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${g.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderTabContent = () => {
    if (!selectedClass) return null;
    switch (activeTab) {
      case "overview": return <OverviewTab class={selectedClass} />;
      case "exams": return <ExamsTab />;
      case "grades": return <GradesTab />;
      default: return <OverviewTab class={selectedClass} />;
    }
  };

  const ClassDetails = () => {
    if (!selectedClass) return null;
    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">{selectedClass.name}</h2>
            <p className="text-gray-600 mt-1 flex items-center gap-2">
              <Users size={16} />{selectedClass.instructor}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-3 py-1 ${getLightColorFromGradient(selectedClass.color)} ${getTextColorFromGradient(selectedClass.color)} rounded-full text-sm font-medium`}>
                {selectedClass.subject}
              </span>
            </div>
          </div>
          <button
            onClick={handleBackToList}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-all duration-200 flex items-center gap-2"
          >
            ← Back to Classes
          </button>
        </div>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: "overview", label: "Overview", icon: BookOpen },
            { id: "exams", label: "Exams", icon: FileText },
            { id: "grades", label: "Grades", icon: Award },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleTabChange(id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold whitespace-nowrap transition-all duration-200 ${activeTab === id
                  ? selectedClass.color + ' text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              <Icon size={18} />{label}
            </button>
          ))}
        </div>

        {renderTabContent()}
      </div>
    );
  };

  const ClassesList = () => (
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 relative" style={{ zIndex: 1 }}>
        {studentClasses.map((cls) => (
          <div
            key={cls.id}
            onClick={() => handleClassClick(cls)}
            className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer hover:scale-[1.02] relative"
            style={{ zIndex: 1 }}
          >
            <div className="overflow-hidden rounded-t-xl">
              <div className={`h-2 ${cls.color}`}></div>
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">{cls.name}</h3>
                  <p className="text-gray-600 text-sm flex items-center gap-2">
                    <Users size={16} /> {cls.instructor}
                  </p>
                  {cls.code && (
                    <div className="flex items-center gap-2 mt-2 text-gray-600 text-sm bg-gray-50 px-3 py-1.5 rounded-lg">
                      <School size={14} />
                      <span className="font-mono font-medium">{cls.code}</span>
                      <button
                        onClick={(e) => handleCopyCode(cls.code || '', e)}
                        className="text-gray-500 hover:text-gray-700 ml-1"
                        title="Copy class code"
                      >
                        {copiedCode === cls.code
                          ? <Check size={14} className="text-green-600" />
                          : <Copy size={14} />}
                      </button>
                    </div>
                  )}
                </div>
                <div className={`w-12 h-12 rounded-full ${cls.color} flex items-center justify-center text-white shadow-md`}>
                  <BookOpen size={24} />
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-gray-600"><FileText size={16} /> Upcoming Exams</span>
                  <span className={`font-semibold ${getTextColorFromGradient(cls.color)}`}>{cls.upcomingExams}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-gray-600"><Clock size={16} /> Last Activity</span>
                  <span className="text-gray-500">{cls.lastActivity}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-2 text-gray-600"><TrendingUp size={16} /> Progress</span>
                  <span className={`font-semibold ${getTextColorFromGradient(cls.color)}`}>{cls.progress}%</span>
                </div>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                  className={`bg-gradient-to-r ${cls.color.replace('bg-gradient-to-r ', '')} h-2 rounded-full transition-all duration-500`}
                  style={{ width: `${cls.progress}%` }}
                />
              </div>

              <button className={`w-full ${cls.color} text-white py-2.5 rounded-lg font-semibold ${getHoverGradientFromColor(cls.color)} transition-all duration-200 shadow-md hover:shadow-lg`}>
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );


  return (
    <div className="w-full pt-20 min-h-screen bg-background">
      <div className="min-h-screen p-6">
        <Header fixed={true} showAccount={true} isRegistered={true} />

        <div className="max-w-7xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 sm:p-6 mb-6 border border-white/50">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#1A80F6] to-[#4A90E2] flex items-center justify-center text-white text-xl font-bold shadow-lg">
                    S
                  </div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#1A80F6] to-[#4A90E2] bg-clip-text text-transparent">
                      My Classes
                    </h1>
                    <p className="text-sm sm:text-base text-gray-600">Student Dashboard</p>
                  </div>
                </div>

              </div>

              {/* ── Join Class Input + Inline Message ── */}
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter Class ID to join"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleJoinClass(); }}
                    className="flex-1 border border-gray-300 px-3 sm:px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A80F6] focus:border-transparent text-sm sm:text-base"
                  />
                  <button
                    onClick={handleJoinClass}
                    className="bg-gradient-to-r from-[#1A80F6] to-[#4A90E2] text-white px-4 sm:px-6 py-2.5 rounded-lg hover:from-[#0E6AD0] hover:to-[#3A80D2] transition-all duration-200 text-sm sm:text-base whitespace-nowrap shadow-md hover:shadow-lg"
                  >
                    Join Class
                  </button>
                </div>

                <AnimatePresence>
                  {joinMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2 }}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium ${joinMessage.type === 'success'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                    >
                      {joinMessage.type === 'success'
                        ? <CheckCircle size={16} className="shrink-0" />
                        : <AlertCircle size={16} className="shrink-0" />}
                      {joinMessage.text}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {selectedClass ? <ClassDetails /> : <ClassesList />}
        </div>
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .scrollbar-thin::-webkit-scrollbar { height: 2px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: rgba(255,255,255,0.1); }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default ClassesStudent;