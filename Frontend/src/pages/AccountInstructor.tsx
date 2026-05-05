import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from '../components/Header';
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail, Phone, Edit, Users, Video, AlertCircle,
  Eye, Calendar, Clock, ChevronDown,
  ChevronUp, User, RefreshCw, School,
  FileText, Zap, Activity,
  ChevronRight
} from "lucide-react";

// ─── API ───────────────────────────────────────────────────────────────────
const BASE = 'http://127.0.0.1:8000';
const getToken = () => localStorage.getItem('access_token');
const authFetch = (url: string) =>
  fetch(url, { headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' } });

// ─── Types ─────────────────────────────────────────────────────────────────
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

interface ClassItem {
  id: number;
  name: string;
  code: string;
  subject: string;
  number_of_students: number;
  description?: string;
}

interface ExamItem {
  id: number;
  title: string;
  start_datetime: string;
  duration: number;
  questions_count: number;
  status?: 'upcoming' | 'active' | 'completed';
}

interface ClassWithExams {
  cls: ClassItem;
  exams: ExamItem[];
  colorIndex: number;
}

interface Student {
  id: number;
  full_name: string;
  student_id?: string;
  student_custom_id?: string;
  profile_image: string | null;
}

interface LiveStudent {
  db_id: number;
  name: string;
  examTitle: string;
  className: string;
  classId: number;
  examId: number;
  colorIndex: number;
  status: 'active' | 'warning';
  progress: number | null;
  timeRemaining: string;
  isLive: boolean;
}

interface Incident {
  id: number;
  student_name?: string;
  student?: string;
  description?: string;
  incident_type?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  created_at?: string;
  timestamp?: string;
}

interface AlertItem {
  uniqueId?: string;
  type: 'warning' | 'info';
  message: string;
  details: string;
  time: string;
  examId: number;
  classId: number;
  className: string;
}

// ─── Ocean palette (matches ClassesInstructor) ─────────────────────────────
const OCEAN = [
  { bg: 'from-[#1A80F6] to-[#4A90E2]', light: 'from-blue-50 to-cyan-50',   border: 'border-blue-200',   text: 'text-[#1A80F6]'   },
  { bg: 'from-[#0E6AD0] to-[#3A80D2]', light: 'from-sky-50 to-indigo-50',  border: 'border-indigo-200', text: 'text-[#0E6AD0]'   },
  { bg: 'from-[#2C8F8F] to-[#4CAF92]', light: 'from-teal-50 to-emerald-50',border: 'border-teal-200',   text: 'text-[#2C8F8F]'   },
  { bg: 'from-[#00A8B5] to-[#00C2C7]', light: 'from-cyan-50 to-blue-50',   border: 'border-cyan-200',   text: 'text-[#00A8B5]'   },
  { bg: 'from-[#1A5F8F] to-[#2E7DA2]', light: 'from-sky-50 to-blue-50',    border: 'border-sky-200',    text: 'text-[#1A5F8F]'   },
  { bg: 'from-[#006994] to-[#2196F3]', light: 'from-blue-50 to-indigo-50', border: 'border-blue-200',   text: 'text-[#006994]'   },
];

const computeStatus = (exam: ExamItem): 'upcoming' | 'active' | 'completed' => {
  const now = new Date();
  const start = new Date(exam.start_datetime);
  const end = new Date(start.getTime() + exam.duration * 60_000);
  if (now < start) return 'upcoming';
  if (now <= end) return 'active';
  return 'completed';
};

// ─── Resolve image URL for local server ────────────────────────────────────
const getImageUrl = (url: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return `${BASE}${url}`;
};

// ─── StatusPill ────────────────────────────────────────────────────────────
const StatusPill = ({ status }: { status: 'upcoming' | 'active' | 'completed' }) => {
  if (status === 'active')
    return (
      <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold">
        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" />LIVE
      </span>
    );
  if (status === 'upcoming')
    return <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">Upcoming</span>;
  return <span className="px-2.5 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-semibold">Completed</span>;
};

// ─── ExamRow ───────────────────────────────────────────────────────────────
const ExamRow = ({
  exam, colorIdx, onNavigate,
}: { exam: ExamItem; colorIdx: number; onNavigate: (examId: number, status: string) => void }) => {
  const status = exam.status ?? computeStatus(exam);
  const pal = OCEAN[colorIdx % OCEAN.length];
  const isActive = status === 'active';
  const isUpcoming = status === 'upcoming';

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-center gap-4 p-3 rounded-xl border transition-all duration-200 hover:shadow-md ${
        isActive ? 'bg-green-50 border-green-200' : `bg-gradient-to-r ${pal.light} ${pal.border}`
      }`}
    >
      {/* time column */}
      <div className="flex-shrink-0 text-center w-14">
        <p className="text-[11px] text-gray-400 leading-none">
          {new Date(exam.start_datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </p>
        <p className="text-xs font-bold text-gray-700 mt-0.5">
          {new Date(exam.start_datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* divider */}
      <div className={`w-px h-8 flex-shrink-0 ${isActive ? 'bg-green-300' : 'bg-gray-200'}`} />

      {/* info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{exam.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="flex items-center gap-1 text-[11px] text-gray-500">
            <Clock size={10} />{exam.duration} min
          </span>
          <span className="flex items-center gap-1 text-[11px] text-gray-500">
            <FileText size={10} />{exam.questions_count} Qs
          </span>
        </div>
      </div>

      {/* status + action */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <StatusPill status={status} />
        <button
          onClick={() => onNavigate(exam.id, status)}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
            isActive
              ? 'bg-green-600 hover:bg-green-700 text-white shadow-md'
              : isUpcoming
              ? `bg-gradient-to-r ${pal.bg} text-white shadow-sm hover:shadow-md`
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
          }`}
        >
          {isActive ? (
            <><Eye size={12} /> Monitor</>
          ) : isUpcoming ? (
            <><ChevronRight size={12} /> Details</>
          ) : (
            <><Eye size={12} /> Results</>
          )}
        </button>
      </div>
    </motion.div>
  );
};

// ─── ClassExamCard ─────────────────────────────────────────────────────────
const ClassExamCard = ({
  data, onNavigate,
}: { data: ClassWithExams; onNavigate: (path: string) => void }) => {
  const [collapsed, setCollapsed] = useState(true);
  const { cls, exams, colorIndex } = data;
  const pal = OCEAN[colorIndex % OCEAN.length];

  const active    = exams.filter(e => (e.status ?? computeStatus(e)) === 'active');
  const upcoming  = exams.filter(e => (e.status ?? computeStatus(e)) === 'upcoming');
  const completed = exams.filter(e => (e.status ?? computeStatus(e)) === 'completed');

  const handleExamNavigate = (examId: number, status: string) => {
    if (status === 'active')         onNavigate(`/proctor/${examId}`);
    else if (status === 'upcoming')  onNavigate(`/classes-instructor/${cls.id}/exams`);
    else                             onNavigate(`/exam-results/${examId}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden"
    >
      {/* header */}
      <div className={`bg-gradient-to-r ${pal.bg} p-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
            <School size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm leading-tight">{cls.name}</h3>
            <p className="text-white/70 text-xs font-mono">{cls.code}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {active.length > 0 && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-green-400/30 border border-green-300/50 text-white text-[11px] font-bold rounded-full">
              <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse inline-block" />
              {active.length} LIVE
            </span>
          )}
          <span className="text-white/70 text-xs">{exams.length} exam{exams.length !== 1 ? 's' : ''}</span>
          <button
            onClick={() => setCollapsed(c => !c)}
            className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 transition-colors text-white"
          >
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {/* summary row (always visible) */}
      <div className="grid grid-cols-3 border-b border-slate-100">
        {[
          { label: 'Live',      count: active.length,    color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Upcoming',  count: upcoming.length,  color: pal.text,         bg: `bg-gradient-to-r ${pal.light}` },
          { label: 'Completed', count: completed.length, color: 'text-gray-500',  bg: 'bg-gray-50' },
        ].map(({ label, count, color, bg }) => (
          <div key={label} className={`${bg} py-3 text-center`}>
            <p className={`text-xl font-bold ${color}`}>{count}</p>
            <p className="text-[10px] text-gray-500 font-medium">{label}</p>
          </div>
        ))}
      </div>

      {/* exam list */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="exam-list"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-2">
              {exams.length === 0 ? (
                <div className="text-center py-6">
                  <FileText size={28} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">No exams for this class yet</p>
                </div>
              ) : (
                [...active, ...upcoming, ...completed].map((exam, idx) => (
                  <ExamRow
                    key={`${exam.id}-${idx}`}
                    exam={exam}
                    colorIdx={colorIndex}
                    onNavigate={handleExamNavigate}
                  />
                ))
              )}
            </div>
            <div className="px-4 pb-4">
              <button
                onClick={() => onNavigate(`/classes-instructor/${cls.id}/dashboard`)}
                className={`w-full py-2 rounded-xl text-xs font-semibold border ${pal.border} ${pal.text} bg-gradient-to-r ${pal.light} hover:shadow-md transition-all duration-200 flex items-center justify-center gap-1.5`}
              >
                Open Class Dashboard <ChevronRight size={13} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────
const AccountInstructor: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // profile
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showRefreshNotice, setShowRefreshNotice] = useState(false);

  // classes + exams
  const [classesWithExams, setClassesWithExams] = useState<ClassWithExams[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  // live monitoring + alerts (real data)
  const [liveStudents, setLiveStudents]           = useState<LiveStudent[]>([]);
  const [alertItems, setAlertItems]               = useState<AlertItem[]>([]);
  const [monitoringLoading, setMonitoringLoading] = useState(false);
  const [showAllMonitoring, setShowAllMonitoring] = useState(false);
  
  const liveStudentsRef = React.useRef<LiveStudent[]>([]);
  useEffect(() => { liveStudentsRef.current = liveStudents; }, [liveStudents]);

  // ── WebSocket Live Alerts ──
  useEffect(() => {
    const activeClassExams = classesWithExams.flatMap(c => 
      c.exams.filter(e => (e.status ?? computeStatus(e)) === 'active')
        .map(e => ({ cls: c.cls, exam: e }))
    );

    if (activeClassExams.length === 0) return;

    const sockets: WebSocket[] = [];

    activeClassExams.forEach(({ cls, exam }) => {
      const ws = new WebSocket(`ws://127.0.0.1:8001/ws/instructor/${exam.id}`);
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if ((data.type === 'alert' || data.type === 'audio_alert') && data.student_id) {
            const isViolation = data.new_violation ?? false;
            
            let msg = data.cheating_reason ?? 'Suspicious activity detected';
            if (data.type === 'audio_alert') {
                msg = data.event_type === 'speech_detected' ? 'Speech detected' : 'Loud noise detected';
            } else {
                if (data.head_suspicious && data.head_direction) {
                    msg = data.head_direction.includes('LOOKING') ? 'Looking away' : data.head_direction;
                } else if (data.yolo_suspicious && data.yolo_labels?.length > 0) {
                    msg = `Object detected: ${data.yolo_labels.join(', ')}`;
                }
            }

            const matchedStudent = liveStudentsRef.current.find(s => s.db_id === Number(data.student_id));
            const studentName = matchedStudent?.name ?? `Student #${data.student_id}`;

            const newAlert: AlertItem = {
              uniqueId: Math.random().toString(36).substring(2, 9),
              type: isViolation ? 'warning' : 'info',
              message: msg,
              details: `${studentName} | ${cls.name} – ${exam.title}`,
              time: new Date().toLocaleTimeString(),
              examId: exam.id,
              classId: cls.id,
              className: cls.name,
            };

            setAlertItems(prev => [newAlert, ...prev].slice(0, 50));
            
            if (isViolation) {
              setLiveStudents(prev => prev.map(s => 
                s.db_id === Number(data.student_id) ? { ...s, status: 'warning' } : s
              ));
            }
          }
        } catch (e) {}
      };

      sockets.push(ws);
    });

    return () => {
      sockets.forEach(ws => {
        ws.onclose = null;
        ws.close();
      });
    };
  }, [classesWithExams]);

  // ── fetch profile ──
  useEffect(() => {
    const wasUpdated = location.state?.updated === true;
    if (wasUpdated) {
      setShowRefreshNotice(true);
      const t = setTimeout(() => setShowRefreshNotice(false), 3000);
      navigate(location.pathname, { replace: true, state: {} });
      return () => clearTimeout(t);
    }
  }, [location.state]);

  useEffect(() => {
    fetchProfile();
  }, [refreshKey]);

  const fetchProfile = async () => {
    setProfileLoading(true);
    const token = getToken();
    if (!token) {
      setProfileError('No access token found. Please login again.');
      setProfileLoading(false);
      setTimeout(() => navigate('/Login'), 2000);
      return;
    }
    try {
      const res = await authFetch(`${BASE}/api/auth/profile/`);
      if (res.status === 401) { setProfileError('Session expired.'); setTimeout(() => navigate('/Login'), 2000); return; }
      const data = await res.json();
      if (res.ok) setProfile(data); else setProfileError(data.error || 'Failed to load profile');
    } catch { setProfileError('Network error.'); }
    finally { setProfileLoading(false); }
  };

  // ── fetch all classes → then exams per class ──
  useEffect(() => {
    fetchAllClassesWithExams();
  }, []);

  const fetchAllClassesWithExams = async () => {
    setDashboardLoading(true);
    try {
      const clsRes = await authFetch(`${BASE}/api/instructors/classes/`);
      if (!clsRes.ok) throw new Error();
      const classes: ClassItem[] = await clsRes.json();

      const results = await Promise.allSettled(
        classes.map(async (cls, idx) => {
          try {
            const exRes = await authFetch(`${BASE}/api/exam/class/${cls.id}/`);
            const rawExams: ExamItem[] = exRes.ok ? await exRes.json() : [];
            const exams = rawExams.map(e => ({ ...e, status: e.status ?? computeStatus(e) }));
            return { cls, exams, colorIndex: cls.id % OCEAN.length } as ClassWithExams;
          } catch {
            return { cls, exams: [], colorIndex: idx % OCEAN.length } as ClassWithExams;
          }
        })
      );

      const merged: ClassWithExams[] = results
        .filter((r): r is PromiseFulfilledResult<ClassWithExams> => r.status === 'fulfilled')
        .map(r => r.value);

      // sort: classes with live exams first
      merged.sort((a, b) => {
        const aLive = a.exams.filter(e => e.status === 'active').length;
        const bLive = b.exams.filter(e => e.status === 'active').length;
        return bLive - aLive;
      });

      setClassesWithExams(merged);
      await fetchLiveActivity(merged);
    } catch { setClassesWithExams([]); }
    finally { setDashboardLoading(false); }
  };

  // ── fetch live monitoring students + alerts from active exams ──
  const fetchLiveActivity = async (classes: ClassWithExams[]) => {
    setMonitoringLoading(true);
    const activeClassExams = classes
      .flatMap(c => c.exams
        .filter(e => e.status === 'active')
        .map(e => ({ cls: c.cls, exam: e, colorIndex: c.colorIndex }))
      );

    if (activeClassExams.length === 0) {
      setLiveStudents([]);
      setAlertItems([]);
      setMonitoringLoading(false);
      return;
    }

    const studentsMap: Record<number, Student[]> = {};
    await Promise.allSettled(
      [...new Set(activeClassExams.map(x => x.cls.id))].map(async classId => {
        try {
          const res = await authFetch(`${BASE}/api/instructors/classes/${classId}/students/`);
          if (res.ok) studentsMap[classId] = await res.json();
        } catch {}
      })
    );

    const built: LiveStudent[] = activeClassExams.flatMap(({ cls, exam, colorIndex }) => {
      const students = studentsMap[cls.id] ?? [];
      const start = new Date(exam.start_datetime);
      const endMs = start.getTime() + exam.duration * 60_000;
      const remaining = Math.max(0, Math.round((endMs - Date.now()) / 60_000));
      return students.map(s => ({
        db_id:         s.id,
        name:          s.full_name,
        examTitle:     exam.title,
        className:     cls.name,
        classId:       cls.id,
        examId:        exam.id,
        colorIndex,
        status:        'active' as const,
        progress:      null,
        timeRemaining: `${remaining} min`,
        isLive:        true,
      }));
    });
    setLiveStudents(built);

    // fetch incidents per active exam
    const allAlerts: AlertItem[] = [];
    await Promise.allSettled(
      activeClassExams.map(async ({ cls, exam }) => {
        try {
          const res = await authFetch(`${BASE}/api/exam/${exam.id}/incidents/`);
          if (!res.ok) return;
          const incidents: Incident[] = await res.json();
          incidents.forEach(inc => {
            const severity = inc.severity ?? 'medium';
            allAlerts.push({
              uniqueId:  inc.id?.toString() || Math.random().toString(36).substring(2, 9),
              type:      ['high', 'critical'].includes(severity) ? 'warning' : 'info',
              message:   inc.description ?? inc.incident_type ?? 'Suspicious activity detected',
              details:   `${inc.student_name ?? inc.student ?? 'Unknown'} | ${cls.name} – ${exam.title}`,
              time:      inc.created_at ?? inc.timestamp
                ? formatRelativeTime(new Date((inc.created_at ?? inc.timestamp)!))
                : 'Just now',
              examId:    exam.id,
              classId:   cls.id,
              className: cls.name,
            });
          });
        } catch {}
      })
    );
    setAlertItems(allAlerts);
    setMonitoringLoading(false);
  };

  const formatRelativeTime = (date: Date): string => {
    const diff = Math.round((Date.now() - date.getTime()) / 60_000);
    if (diff < 1)  return 'Just now';
    if (diff < 60) return `${diff} min ago`;
    return `${Math.round(diff / 60)}h ago`;
  };

  const handleEditProfile = () => navigate("/settings", { state: { from: 'instructor-account' } });
  const handleRefresh = () => { setRefreshKey(k => k + 1); fetchAllClassesWithExams(); };

  // ── aggregate stats ──
  const totalClasses   = classesWithExams.length;
  const allExams       = classesWithExams.flatMap(c => c.exams);
  const liveExams      = allExams.filter(e => e.status === 'active');
  const upcomingExams  = allExams.filter(e => e.status === 'upcoming');
  const totalStudents  = classesWithExams.reduce((s, c) => s + (c.cls.number_of_students ?? 0), 0);

  const visibleStudents = showAllMonitoring ? liveStudents : liveStudents.slice(0, 3);

  // ── loading / error screens ──
  if (profileLoading) return (
    <div className="w-full min-h-screen bg-[#E8F1FA] flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading profile…</p>
      </div>
    </div>
  );

  if (profileError) return (
    <div className="w-full min-h-screen bg-[#E8F1FA] flex items-center justify-center">
      <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
        <p className="text-red-500 mb-4">{profileError}</p>
        <button onClick={() => navigate('/Login')} className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600">Go to Login</button>
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-[#E8F1FA]">
      <Header showAccount={true} isRegistered={true} isAccountPage={true} userType="instructor" />

      <div className="w-full py-24 px-4">
        <div className="max-w-[1100px] mx-auto space-y-6">

          {/* refresh notice */}
          <AnimatePresence>
            {showRefreshNotice && (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-green-600" />
                <p className="text-green-700">Profile updated successfully!</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Profile Card ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden border border-slate-200 relative">
            <div className="h-24 bg-gradient-to-r from-[#3F72B7] to-[#3DA5FA]" />

            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleEditProfile}
              className="absolute top-6 right-6 flex items-center gap-2 bg-white/90 hover:bg-white text-[#3F72B7] hover:text-[#3565A3] transition-all px-3 py-2 rounded-lg shadow-md z-10">
              <Edit className="w-4 h-4" /><span className="text-sm font-semibold">Edit Profile</span>
            </motion.button>

            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={handleRefresh}
              className="absolute top-6 left-6 flex items-center gap-2 bg-white/90 hover:bg-white text-gray-600 hover:text-gray-700 transition-all px-3 py-2 rounded-lg shadow-md z-10">
              <RefreshCw className="w-4 h-4" />
            </motion.button>

            <div className="relative px-8 pb-8">
              <div className="flex justify-center -mt-16 mb-4">
                <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.3 }}
                  className="w-32 h-32 rounded-full shadow-xl border-4 border-white overflow-hidden bg-gradient-to-br from-[#3F72B7] to-[#3DA5FA] flex items-center justify-center relative">
                  {getImageUrl(profile?.profile_image ?? null)
                    ? <img
                        src={getImageUrl(profile!.profile_image)!}
                        alt={profile!.full_name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    : <User className="w-16 h-16 text-white" />
                  }
                  <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-white" />
                </motion.div>
              </div>

              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-1">{profile?.full_name || "—"}</h1>
                <p className="text-gray-500 text-lg bg-slate-100 inline-block px-4 py-1 rounded-full">{profile?.id || "—"}</p>
              </div>

              <div className="flex flex-wrap justify-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-gray-600"><Mail className="w-5 h-5 text-[#3F72B7]" /><span>{profile?.email || "—"}</span></div>
                <div className="flex items-center gap-2 text-gray-600"><Phone className="w-5 h-5 text-[#3F72B7]" /><span>{profile?.phone || "—"}</span></div>
              </div>
              <div className="text-center mt-4">
                <p className="text-xs text-gray-400">Last updated: {new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          </motion.div>

          {/* ── Aggregate Stats ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.15 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { value: liveExams.length.toString(),     label: 'Live Exams',     icon: Zap,      color: 'from-green-500 to-emerald-600' },
              { value: totalStudents.toString(),        label: 'Total Students', icon: Users,    color: 'from-[#3F72B7] to-[#3DA5FA]' },
              { value: totalClasses.toString(),         label: 'Classes',        icon: School,   color: 'from-[#3DA5FA] to-[#2B8CDB]' },
              { value: upcomingExams.length.toString(), label: 'Upcoming Exams', icon: Calendar, color: 'from-[#3F72B7] to-[#2E5A9B]' },
            ].map(({ value, label, icon: Icon, color }, idx) => (
              <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + idx * 0.08 }}
                className={`bg-gradient-to-br ${color} rounded-xl p-5 text-white shadow-lg`}>
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-7 h-7 opacity-80" />
                  {label === 'Live Exams' && liveExams.length > 0 && (
                    <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  )}
                </div>
                <h3 className="text-3xl font-bold mb-0.5">{value}</h3>
                <p className="text-sm opacity-85">{label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* ── Exams Across All Classes ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}
            className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">

            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3F72B7] to-[#3DA5FA] flex items-center justify-center shadow-md">
                  <Activity size={18} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Exams Across All Classes</h2>
                  <p className="text-xs text-gray-400">
                    {liveExams.length > 0
                      ? `${liveExams.length} exam${liveExams.length > 1 ? 's' : ''} live right now`
                      : 'No live exams right now'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {liveExams.length > 0 && (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" />
                    {liveExams.length} LIVE
                  </span>
                )}
                <button
                  title="Refresh" onClick={fetchAllClassesWithExams}
                  className="p-2 text-gray-400 hover:text-[#3F72B7] hover:bg-blue-50 rounded-lg transition-colors">
                  <RefreshCw size={15} />
                </button>
              </div>
            </div>

            <div className="p-6">
              {dashboardLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-12 h-12 border-4 border-[#3F72B7] border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="text-gray-500 text-sm">Loading classes and exams…</p>
                </div>
              ) : classesWithExams.length === 0 ? (
                <div className="text-center py-12">
                  <School size={48} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No classes found</p>
                  <p className="text-gray-400 text-sm mt-1">Create a class to start managing exams</p>
                  <button onClick={() => navigate('/create-class')}
                    className="mt-4 px-5 py-2 bg-gradient-to-r from-[#3F72B7] to-[#3DA5FA] text-white rounded-lg text-sm font-semibold shadow-md hover:shadow-lg transition-all">
                    Create First Class
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-5">
                  {classesWithExams.map((cwe, idx) => (
                    <ClassExamCard
                      key={`${cwe.cls.id}-${idx}`}
                      data={cwe}
                      onNavigate={path => navigate(path)}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* ── Live Activity: Monitoring + Alerts ── */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }}
            className="grid lg:grid-cols-2 gap-5">

            {/* Live Student Monitoring */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3DA5FA] to-[#2B8CDB] flex items-center justify-center">
                    <Eye size={15} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Live Monitoring</h3>
                    <p className="text-xs text-gray-400">
                      {monitoringLoading ? 'Loading…' : `${liveStudents.length} students in active exams`}
                    </p>
                  </div>
                </div>
                {liveStudents.length > 0
                  ? <span className="flex items-center gap-1.5 text-xs font-bold text-green-700 bg-green-100 border border-green-200 px-2.5 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse inline-block" />LIVE
                    </span>
                  : <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">No active exams</span>
                }
              </div>

              <div className="p-4 space-y-2">
                {monitoringLoading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-8 h-8 border-3 border-[#3DA5FA] border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-xs text-gray-400">Fetching live students…</p>
                  </div>
                ) : liveStudents.length === 0 ? (
                  <div className="text-center py-8">
                    <Eye size={32} className="text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400 font-medium">No live exams right now</p>
                    <p className="text-xs text-gray-300 mt-1">Students will appear here when an exam is active</p>
                  </div>
                ) : (
                  visibleStudents.map((student, idx) => {
                    const pal = OCEAN[student.colorIndex % OCEAN.length];
                    return (
                      <motion.div key={`${student.examId}-${student.name}-${idx}`}
                        initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: idx * 0.06 }}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-sm ${
                          student.status === 'warning'
                            ? 'bg-yellow-50 border-yellow-200'
                            : 'bg-blue-50/50 border-blue-100'
                        }`}>

                        <div className="relative flex-shrink-0">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm bg-gradient-to-br ${
                            student.status === 'warning' ? 'from-yellow-400 to-orange-500' : pal.bg
                          }`}>
                            {student.name.charAt(0)}
                          </div>
                          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                            student.status === 'warning' ? 'bg-yellow-400' : 'bg-green-400 animate-pulse'
                          }`} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-gray-800 truncate">{student.name}</p>
                            {student.isLive && <Video size={11} className="text-green-500 flex-shrink-0" />}
                          </div>
                          <p className="text-[11px] text-gray-500 truncate">
                            {student.examTitle}
                            <span className="mx-1 text-gray-300">·</span>
                            <span className={pal.text}>{student.className}</span>
                          </p>
                          {student.progress !== null && (
                            <div className="flex items-center gap-2 mt-1.5">
                              <div className="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                <div className={`h-1.5 rounded-full ${student.status === 'warning' ? 'bg-yellow-400' : 'bg-green-400'}`}
                                  style={{ width: `${student.progress}%` }} />
                              </div>
                              <span className="text-[10px] text-gray-500 font-medium flex-shrink-0">{student.progress}%</span>
                            </div>
                          )}
                        </div>

                        <div className="flex-shrink-0 text-right space-y-1">
                          <p className="text-[10px] text-gray-400 flex items-center gap-0.5 justify-end">
                            <Clock size={9} />{student.timeRemaining}
                          </p>
                          {student.status === 'warning' && (
                            <span className="text-[10px] font-bold text-yellow-600 bg-yellow-100 px-1.5 py-0.5 rounded-full inline-block">⚠ Warn</span>
                          )}
                          <button
                            onClick={() => navigate(`/proctor/${student.examId}`)}
                            className={`flex items-center gap-0.5 text-[10px] font-semibold px-2 py-1 rounded-lg bg-gradient-to-r ${pal.bg} text-white shadow-sm hover:shadow-md transition-all`}>
                            <Eye size={10} /> Monitor
                          </button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>

              {liveStudents.length > 3 && (
                <div className="px-4 pb-4">
                  <button onClick={() => setShowAllMonitoring(s => !s)}
                    className="w-full py-2 rounded-xl text-xs font-semibold text-[#3DA5FA] border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5">
                    {showAllMonitoring
                      ? <><ChevronUp size={13} /> Show less</>
                      : <><ChevronDown size={13} /> Show {liveStudents.length - 3} more</>}
                  </button>
                </div>
              )}
            </div>

            {/* Alert Feed */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#3F72B7] to-[#2E5A9B] flex items-center justify-center">
                    <AlertCircle size={15} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">Alert Feed</h3>
                    <p className="text-xs text-gray-400">
                      {monitoringLoading ? 'Loading…' : `${alertItems.length} incident${alertItems.length !== 1 ? 's' : ''} from active exams`}
                    </p>
                  </div>
                </div>
                {alertItems.filter(a => a.type === 'warning').length > 0
                  ? <span className="text-xs font-bold text-orange-700 bg-orange-100 border border-orange-200 px-2.5 py-1 rounded-full">
                      {alertItems.filter(a => a.type === 'warning').length} warnings
                    </span>
                  : <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">No warnings</span>
                }
              </div>

              <div className="p-4 space-y-2">
                {monitoringLoading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="w-8 h-8 border-3 border-[#3F72B7] border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-xs text-gray-400">Fetching incidents…</p>
                  </div>
                ) : alertItems.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle size={32} className="text-gray-200 mx-auto mb-2" />
                    <p className="text-sm text-gray-400 font-medium">No incidents detected</p>
                    <p className="text-xs text-gray-300 mt-1">Alerts from active exams will appear here</p>
                  </div>
                ) : (
                  alertItems.map((alert, idx) => (
                    <motion.div key={alert.uniqueId || `alert-${alert.examId}-${idx}`}
                      initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.08 }}
                      className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all hover:shadow-sm cursor-pointer ${
                        alert.type === 'warning'
                          ? 'bg-orange-50 border-orange-200 hover:bg-orange-100'
                          : 'bg-blue-50 border-blue-100 hover:bg-blue-100'
                      }`}
                      onClick={() => navigate(`/proctor/${alert.examId}?tab=activity`)}>

                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                        alert.type === 'warning' ? 'bg-orange-100' : 'bg-blue-100'
                      }`}>
                        {alert.type === 'warning'
                          ? <AlertCircle size={15} className="text-orange-500" />
                          : <Eye size={15} className="text-blue-500" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-gray-800 leading-tight">{alert.message}</p>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap flex-shrink-0">{alert.time}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{alert.details}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5 flex items-center gap-1">
                          <School size={9} />{alert.className}
                          <span className="text-[#3F72B7] font-semibold ml-1 flex items-center gap-0.5">
                            <ChevronRight size={9} />View
                          </span>
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              <div className="px-4 pb-4">
                <button
                  onClick={() => navigate('/classes-instructor')}
                  className="w-full py-2 rounded-xl text-xs font-semibold text-[#3F72B7] border border-blue-200 bg-blue-50 hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5">
                  <ChevronRight size={13} /> Manage all classes
                </button>
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

export default AccountInstructor;