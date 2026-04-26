import Header from '../components/Header';
import { motion } from 'framer-motion';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Eye, AlertCircle, Info, Clock, Users, FileText,
  Calendar, BarChart3, ChevronLeft, CheckCircle, RefreshCw, ShieldAlert,
  Search, SlidersHorizontal, AlertTriangle, CheckCircle2, TrendingUp, X,
} from 'lucide-react';

const DJANGO = 'http://127.0.0.1:8000';
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

// ── Types ──────────────────────────────────────────────────────────────────
interface Exam {
  id: number;
  title: string;
  start_datetime: string;
  duration: number;
  status: 'upcoming' | 'active' | 'completed';
  questions_count: number;
}

interface LiveStudent {
  student_id: string;
  db_id: number;
  name: string;
  email: string;
  profile_image: string | null;
  is_active: boolean;
  violation_score: number;
  ai_event_count: number;
  status: 'online' | 'warning' | 'flagged';
  progress: number;
  started_at: string;
  risk_score: number;
  risk_band: 'low' | 'medium' | 'high' | 'critical';
  risk_color: 'green' | 'yellow' | 'orange' | 'red';
}

interface RiskStudent {
  student_id: string;
  db_id: number;
  name: string;
  risk_score: number;
  risk_band: 'low' | 'medium' | 'high' | 'critical';
  risk_color: string;
  alert: boolean;
  is_active: boolean;
}

interface Incident {
  id: string | number;
  type: 'behavior' | 'ai';
  student_id: string;
  student_name: string;
  event: string;
  event_type: string;
  score_points: number;
  time: string;
  occurred_at: string;
  yolo_labels?: string[];
}

interface IncidentsData {
  high: Incident[];
  medium: Incident[];
  low: Incident[];
  total: number;
}

interface LiveStatusData {
  total_students: number;
  flagged: number;
  warning: number;
  online: number;
  students: LiveStudent[];
}

// ── Component ──────────────────────────────────────────────────────────────
const ProctoringPage = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = (searchParams.get('tab') as 'monitor' | 'activity') || 'monitor';

  const [activeTab, setActiveTab] = useState<'monitor' | 'activity' | 'risk'>(defaultTab as any || 'monitor');
  const [exam, setExam] = useState<Exam | null>(null);
  const [examLoading, setExamLoading] = useState(true);

  const [liveStatus, setLiveStatus] = useState<LiveStatusData | null>(null);
  const [incidents, setIncidents] = useState<IncidentsData | null>(null);
  const [riskData, setRiskData] = useState<{ students: RiskStudent[]; critical_count: number; high_count: number } | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  // Phase 4: Live frame dictionary mapping db_id to base64 jpeg
  const [liveFrames, setLiveFrames] = useState<Record<number, string>>({});

  // ── Fetch exam info ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!examId) return;
    const fetchExam = async () => {
      setExamLoading(true);
      try {
        const data = await apiRequest(`${DJANGO}/api/exam/${examId}/`);
        const now = new Date();
        const start = new Date(data.start_datetime);
        const end = new Date(start.getTime() + data.duration * 60 * 1000);
        const computedStatus =
          now < start ? 'upcoming' : now <= end ? 'active' : 'completed';
        setExam({ ...data, status: data.status ?? computedStatus });
      } catch {
        if (examId) {
          setExam({
            id: parseInt(examId),
            title: 'Exam',
            start_datetime: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            duration: 90,
            status: 'active',
            questions_count: 40,
          });
        }
      } finally {
        setExamLoading(false);
      }
    };
    fetchExam();
  }, [examId]);

  // ── Fetch live student data + incidents ─────────────────────────────────
  const fetchLiveData = useCallback(async () => {
    if (!examId) return;
    try {
      const [statusData, incidentData, riskScores] = await Promise.all([
        apiRequest(`${DJANGO}/api/violations/exam/${examId}/live-status/`),
        apiRequest(`${DJANGO}/api/violations/exam/${examId}/incidents/`),
        apiRequest(`${DJANGO}/api/violations/exam/${examId}/risk-scores/`),
      ]);
      setLiveStatus(statusData);
      setIncidents(incidentData);
      setRiskData(riskScores);
      setLastRefresh(new Date());
    } catch (err) {
      console.warn('Live data fetch failed:', err);
    } finally {
      setDataLoading(false);
    }
  }, [examId]);

  // Initial load + 10-second polling
  useEffect(() => {
    fetchLiveData();
    const interval = setInterval(fetchLiveData, 10_000);
    return () => clearInterval(interval);
  }, [fetchLiveData]);

  // Phase 4: Connect to FastAPI Instructor WS
  useEffect(() => {
    if (!examId) return;

    let ws: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout>;

    const connect = () => {
      ws = new WebSocket(`ws://127.0.0.1:8001/ws/instructor/${examId}`);
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'frame' && data.student_id) {
            setLiveFrames(prev => ({ ...prev, [Number(data.student_id)]: data.frame }));
          }
        } catch (e) {}
      };

      ws.onclose = () => {
        // Auto-reconnect if WS drops
        reconnectTimeout = setTimeout(connect, 2000);
      };
    };

    connect();

    return () => {
      clearTimeout(reconnectTimeout);
      if (ws) {
        ws.onclose = null; // Prevent reconnect on unmount
        ws.close();
      }
    };
  }, [examId]);

  // ── Derived ──────────────────────────────────────────────────────────────
  const flagged  = liveStatus?.flagged  ?? 0;
  const warning  = liveStatus?.warning  ?? 0;
  const online   = liveStatus?.online   ?? 0;
  const students = liveStatus?.students ?? [];
  const totalIncidents = incidents?.total ?? 0;

  // ── Helper: camera ring colour ───────────────────────────────────────────
  const getCameraRingColor = (s: string) => {
    if (s === 'flagged') return 'ring-2 ring-red-500 border-red-400';
    if (s === 'warning') return 'ring-2 ring-orange-400 border-orange-300';
    return 'ring-1 ring-green-400 border-green-300';
  };

  const getStatusBadge = (s: string) => {
    if (s === 'flagged')
      return (
        <span className="absolute top-2 left-2 flex items-center gap-1 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">
          <AlertCircle size={9} />FLAGGED
        </span>
      );
    if (s === 'warning')
      return (
        <span className="absolute top-2 left-2 flex items-center gap-1 bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">
          ⚠ WARN
        </span>
      );
    return (
      <span className="absolute top-2 left-2 flex items-center gap-1 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow">
        <span className="w-1.5 h-1.5 rounded-full bg-white inline-block" />LIVE
      </span>
    );
  };

  // ── Exam progress bar ────────────────────────────────────────────────────
  const examProgressPct = (() => {
    if (!exam) return 0;
    const start = new Date(exam.start_datetime).getTime();
    const end   = start + exam.duration * 60 * 1000;
    const now   = Date.now();
    return Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
  })();

  const minsRemaining = (() => {
    if (!exam) return 0;
    const end = new Date(exam.start_datetime).getTime() + exam.duration * 60 * 1000;
    return Math.max(0, Math.round((end - Date.now()) / 60_000));
  })();

  // ── Live Monitor tab ─────────────────────────────────────────────────────
  const LiveMonitorTab = () => (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Online',  count: online,  color: 'green',  Icon: CheckCircle },
          { label: 'Warning', count: warning, color: 'orange', Icon: AlertCircle },
          { label: 'Flagged', count: flagged, color: 'red',    Icon: AlertCircle },
        ].map(({ label, count, color, Icon }) => (
          <div key={label} className={`bg-gradient-to-br from-${color}-50 to-${color}-50/60 border border-${color}-200 rounded-xl p-5 text-center shadow-sm`}>
            <p className={`text-4xl font-bold text-${color}-700`}>{count}</p>
            <p className={`text-sm text-${color}-600 font-medium mt-1 flex items-center justify-center gap-1`}>
              <Icon size={13} />{label}
            </p>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      {exam && (
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Clock size={15} className="text-[#1A80F6]" />Exam progress
            </span>
            <span className="text-sm font-bold text-[#1A80F6]">~{minsRemaining} min remaining</span>
          </div>
          <div className="w-full bg-blue-100 rounded-full h-3 overflow-hidden">
            <div className="bg-gradient-to-r from-[#1A80F6] to-[#4A90E2] h-3 rounded-full transition-all duration-500" style={{ width: `${examProgressPct}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>Started {new Date(exam.start_datetime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            <span>{exam.duration} min total</span>
          </div>
        </div>
      )}

      {/* Refresh row */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
        <button onClick={fetchLiveData} className="flex items-center gap-1 text-blue-500 hover:text-blue-700 transition-colors">
          <RefreshCw size={12} />Refresh now
        </button>
      </div>

      {/* Camera grid */}
      <div>
        <h3 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Eye size={16} className="text-[#1A80F6]" />
          Camera feeds — {students.length} student{students.length !== 1 ? 's' : ''}
        </h3>

        {dataLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-[4/3] rounded-xl bg-gray-200 animate-pulse" />
            ))}
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Users size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">No students have started the exam yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {students.map(student => (
              <div
                key={student.db_id}
                className={`relative rounded-xl overflow-hidden border bg-gray-900 cursor-pointer hover:scale-105 transition-transform duration-200 ${getCameraRingColor(student.status)}`}
                style={{ aspectRatio: '4/3' }}
                onClick={() => navigate(`/footage/${student.db_id}`)}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 group">
                  {liveFrames[student.db_id] ? (
                    <img 
                      src={`data:image/jpeg;base64,${liveFrames[student.db_id]}`} 
                      alt="Live Feed" 
                      className="w-full h-full object-cover" 
                    />
                  ) : student.profile_image ? (
                    <img src={student.profile_image} alt={student.name} className="w-14 h-14 rounded-full object-cover border-2 border-gray-500" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center text-white font-bold text-lg border-2 border-gray-500">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {student.violation_score > 0 && !liveFrames[student.db_id] && (
                    <span className={`mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${student.status === 'flagged' ? 'bg-red-600 text-white' : 'bg-orange-500 text-white'}`}>
                      {student.violation_score.toFixed(1)} pts
                    </span>
                  )}
                </div>
                {getStatusBadge(student.status)}
                {student.status === 'flagged' && (
                  <div className="absolute inset-0 border-2 border-red-500 rounded-xl animate-pulse pointer-events-none" />
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2.5 py-2.5">
                  <p className="text-white text-xs font-semibold truncate">{student.name}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="flex-1 bg-white/20 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-white" style={{ width: `${student.progress}%` }} />
                    </div>
                    <span className="text-white text-[10px] font-bold">{student.progress}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // ── Group incidents by student+event_type ──────────────────────────────────
  type GroupedIncident = Incident & { count: number };

  const groupIncidents = (items: Incident[]): GroupedIncident[] => {
    const map = new Map<string, GroupedIncident>();
    for (const item of items) {
      const key = `${item.student_id}||${item.event_type}`;
      if (map.has(key)) {
        map.get(key)!.count += 1;
        map.get(key)!.time = item.time; // keep most recent
      } else {
        map.set(key, { ...item, count: 1 });
      }
    }
    return Array.from(map.values());
  };

  // ── Incident row (grouped) ──────────────────────────────────────────────────
  const IncidentRow = ({ item, color }: { item: GroupedIncident; color: string }) => (
    <div className={`px-5 py-4 flex items-center justify-between gap-4 hover:bg-${color}-50 transition-colors`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full bg-gradient-to-r from-${color}-500 to-${color}-600 flex items-center justify-center text-white font-bold text-sm shadow-md flex-shrink-0`}>
          {item.student_name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="font-semibold text-gray-800 text-sm">{item.student_name}</p>
          <p className={`text-${color}-600 text-xs mt-0.5 flex items-center gap-1`}>
            <AlertCircle size={11} />{item.event}
            {item.yolo_labels && item.yolo_labels.length > 0 && (
              <span className="ml-1 text-gray-500">({item.yolo_labels.join(', ')})</span>
            )}
          </p>
        </div>
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <span className="text-xs text-gray-400">{item.time}</span>
        {item.count > 1 && (
          <span className={`inline-block bg-${color}-100 text-${color}-700 text-xs font-bold px-2 py-0.5 rounded-full`}>
            ×{item.count} times
          </span>
        )}
        <span className={`inline-block bg-${color}-50 border border-${color}-200 text-${color}-600 text-xs px-2 py-0.5 rounded-full`}>
          +{item.score_points}pt
        </span>
      </div>
    </div>
  );

  // ── Activity Tab — sidebar + cards layout ────────────────────────────────────
  const ActivityTab = () => {
    const [actSearch, setActSearch] = React.useState('');
    const [actStatus, setActStatus] = React.useState<'All' | 'flagged' | 'warning' | 'online'>('All');
    const [actSeverity, setActSeverity] = React.useState<'All' | 'high' | 'medium' | 'low'>('All');

    if (dataLoading) {
      return (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      );
    }

    // ── Grouped buckets ──────────────────────────────────────────────────────
    const groupedHigh   = groupIncidents(incidents?.high   ?? []);
    const groupedMedium = groupIncidents(incidents?.medium ?? []);
    const groupedLow    = groupIncidents(incidents?.low    ?? []);
    const allGrouped    = [...groupedHigh, ...groupedMedium, ...groupedLow];

    // ── Per-student summary for cards ───────────────────────────────────────
    interface StudentSummary {
      student_id: string;
      student_name: string;
      high: GroupedIncident[];
      medium: GroupedIncident[];
      low: GroupedIncident[];
      status: 'flagged' | 'warning' | 'online';
      score: number;
    }
    const studentMap = new Map<string, StudentSummary>();
    const addToMap = (items: GroupedIncident[], bucket: 'high' | 'medium' | 'low') => {
      for (const item of items) {
        if (!studentMap.has(item.student_id)) {
          const live = students.find(s => s.student_id === item.student_id);
          studentMap.set(item.student_id, {
            student_id: item.student_id,
            student_name: item.student_name,
            high: [], medium: [], low: [],
            status: live?.status ?? 'online',
            score: live?.violation_score ?? 0,
          });
        }
        studentMap.get(item.student_id)![bucket].push(item);
      }
    };
    addToMap(groupedHigh, 'high');
    addToMap(groupedMedium, 'medium');
    addToMap(groupedLow, 'low');
    let studentList = Array.from(studentMap.values()).sort((a, b) => b.score - a.score);

    // ── Apply filters ─────────────────────────────────────────────────────
    if (actSearch.trim()) {
      const q = actSearch.toLowerCase();
      studentList = studentList.filter(s => s.student_name.toLowerCase().includes(q) || s.student_id.toLowerCase().includes(q));
    }
    if (actStatus !== 'All') studentList = studentList.filter(s => s.status === actStatus);
    if (actSeverity !== 'All') studentList = studentList.filter(s => s[actSeverity].length > 0);

    const statusCfg = {
      flagged: { label: 'Flagged', color: 'bg-red-100 text-red-700 border-red-200',       bar: 'bg-red-500',    icon: <AlertTriangle size={13} className="text-red-500" /> },
      warning: { label: 'Warning', color: 'bg-orange-100 text-orange-700 border-orange-200', bar: 'bg-orange-500', icon: <AlertCircle    size={13} className="text-orange-500" /> },
      online:  { label: 'Clear',   color: 'bg-green-100 text-green-700 border-green-200',   bar: 'bg-green-500',  icon: <CheckCircle2   size={13} className="text-green-500" /> },
    };

    const buckets: Array<{ key: 'high' | 'medium' | 'low'; label: string; color: string; Icon: any; grouped: GroupedIncident[] }> = [
      { key: 'high',   label: 'High Severity',   color: 'red',    Icon: AlertCircle, grouped: groupedHigh   },
      { key: 'medium', label: 'Medium Severity',  color: 'orange', Icon: AlertCircle, grouped: groupedMedium },
      { key: 'low',    label: 'Low Severity',     color: 'yellow', Icon: Info,        grouped: groupedLow    },
    ];

    return (
      <div className="space-y-4">
        {/* Refresh row */}
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
          <button onClick={fetchLiveData} className="flex items-center gap-1 text-blue-500 hover:text-blue-700">
            <RefreshCw size={12} />Refresh
          </button>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Flagged',  value: studentMap.size > 0 ? [...studentMap.values()].filter(s => s.status === 'flagged').length  : 0, color: 'red',    icon: <AlertTriangle size={18} /> },
            { label: 'Warnings', value: studentMap.size > 0 ? [...studentMap.values()].filter(s => s.status === 'warning').length  : 0, color: 'orange', icon: <AlertCircle   size={18} /> },
            { label: 'Clear',    value: studentMap.size > 0 ? [...studentMap.values()].filter(s => s.status === 'online').length   : 0, color: 'green',  icon: <CheckCircle2  size={18} /> },
            { label: 'High Events', value: groupedHigh.reduce((s,i) => s + i.count, 0), color: 'purple', icon: <TrendingUp size={18} /> },
          ].map(({ label, value, color, icon }) => (
            <div key={label} className={`bg-${color}-50 border border-${color}-100 rounded-xl p-3 text-center`}>
              <div className={`w-8 h-8 rounded-full bg-${color}-100 text-${color}-600 flex items-center justify-center mx-auto mb-2`}>{icon}</div>
              <p className={`text-2xl font-extrabold text-${color}-700`}>{value}</p>
              <p className={`text-[10px] font-bold uppercase tracking-wider text-${color}-500 mt-0.5`}>{label}</p>
            </div>
          ))}
        </div>

        {/* Main two-column layout */}
        <div className="flex flex-col xl:flex-row gap-6">

          {/* LEFT: Grouped alert buckets */}
          <div className="xl:w-1/2 space-y-4">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <AlertCircle size={15} className="text-red-500" /> Live Alerts
            </h3>
            {buckets.map(({ key, label, color, Icon, grouped }) => (
              <div key={key} className={`bg-white rounded-xl border border-${color}-200 overflow-hidden shadow-sm`}>
                <div className={`flex items-center gap-3 px-5 py-3 bg-gradient-to-r from-${color}-600 to-${color}-700`}>
                  <Icon size={17} className="text-white" />
                  <span className="font-semibold text-white text-sm">{label}</span>
                  <span className={`ml-auto bg-white text-${color}-600 text-xs font-bold px-2.5 py-1 rounded-full`}>{grouped.length}</span>
                </div>
                {grouped.length === 0 ? (
                  <p className="px-5 py-4 text-sm text-gray-500 italic">No {key} severity incidents</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {grouped.map(item => (
                      <IncidentRow key={`${item.student_id}-${item.event_type}`} item={item} color={color} />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* RIGHT: Sidebar + Student cards */}
          <div className="xl:w-1/2 flex flex-col gap-4">

            {/* Filter sidebar */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                <SlidersHorizontal size={17} className="text-gray-600" />
                <h3 className="font-bold text-gray-900 text-sm">Filters</h3>
                {(actSearch || actStatus !== 'All' || actSeverity !== 'All') && (
                  <button onClick={() => { setActSearch(''); setActStatus('All'); setActSeverity('All'); }}
                    className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors">
                    <X size={12} /> Clear
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Search */}
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Search</label>
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Name or ID..." value={actSearch} onChange={e => setActSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-orange-400/40 placeholder:text-gray-400" />
                  </div>
                </div>
                {/* Status */}
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Status</label>
                  <select value={actStatus} onChange={e => setActStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400/40 appearance-none">
                    <option value="All">All</option>
                    <option value="flagged">Flagged</option>
                    <option value="warning">Warning</option>
                    <option value="online">Clear</option>
                  </select>
                </div>
                {/* Severity */}
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">Has Severity</label>
                  <select value={actSeverity} onChange={e => setActSeverity(e.target.value as any)}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-400/40 appearance-none">
                    <option value="All">All</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Student incident cards */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <Users size={15} className="text-blue-500" /> Student Incidents
                </h3>
                <span className="text-xs text-gray-400 bg-white border border-gray-200 px-3 py-1 rounded-full">
                  {studentList.length} student{studentList.length !== 1 ? 's' : ''}
                </span>
              </div>

              {studentList.length === 0 ? (
                <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
                  <Search size={36} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-sm text-gray-400">No students match your filters</p>
                  <button onClick={() => { setActSearch(''); setActStatus('All'); setActSeverity('All'); }}
                    className="mt-3 text-xs text-blue-500 hover:text-blue-700 font-semibold">Clear filters</button>
                </div>
              ) : (
                <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                  {studentList.map(student => {
                    const cfg = statusCfg[student.status];
                    const allEvt = [...student.high, ...student.medium, ...student.low];
                    return (
                      <div key={student.student_id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden">
                        <div className={`absolute top-0 left-0 w-full h-1 ${cfg.bar}`} />

                        <div className="flex items-start justify-between gap-3 mb-3 pt-1">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 flex items-center justify-center text-gray-700 font-black text-sm shadow-sm flex-shrink-0">
                              {student.student_name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-gray-900 leading-tight">{student.student_name}</p>
                              <p className="text-[11px] text-gray-400 font-mono">{student.student_id}</p>
                            </div>
                          </div>
                          <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase tracking-wider ${cfg.color} flex-shrink-0`}>
                            {cfg.icon} {cfg.label}
                          </div>
                        </div>

                        {/* Severity mini-grid */}
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {[
                            { label: 'High',   count: student.high.length,   activeBg: 'bg-red-50 border-red-100',       t: 'text-red-700',    l: 'text-red-600' },
                            { label: 'Medium', count: student.medium.length, activeBg: 'bg-orange-50 border-orange-100', t: 'text-orange-700', l: 'text-orange-600' },
                            { label: 'Low',    count: student.low.length,    activeBg: 'bg-yellow-50 border-yellow-100', t: 'text-yellow-700', l: 'text-yellow-600' },
                          ].map(({ label, count, activeBg, t, l }) => (
                            <div key={label} className={`rounded-lg p-1.5 text-center border ${count > 0 ? activeBg : 'bg-gray-50 border-gray-100'}`}>
                              <div className={`text-[9px] font-bold uppercase ${count > 0 ? l : 'text-gray-400'}`}>{label}</div>
                              <div className={`text-sm font-black ${count > 0 ? t : 'text-gray-500'}`}>{count}</div>
                            </div>
                          ))}
                        </div>

                        {/* Top 2 events */}
                        <div className="space-y-1">
                          {allEvt.slice(0, 2).map(ev => {
                            const isH = student.high.some(h => h.event_type === ev.event_type);
                            const isM = !isH && student.medium.some(m => m.event_type === ev.event_type);
                            const ec = isH ? 'text-red-600 bg-red-50' : isM ? 'text-orange-600 bg-orange-50' : 'text-yellow-700 bg-yellow-50';
                            return (
                              <div key={`${ev.student_id}-${ev.event_type}`} className="flex items-center justify-between gap-2">
                                <span className={`text-[11px] font-medium truncate flex-1 px-2 py-0.5 rounded-md ${ec}`}>{ev.event}</span>
                                {ev.count > 1 && (
                                  <span className="text-[10px] font-black text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full flex-shrink-0">×{ev.count}</span>
                                )}
                              </div>
                            );
                          })}
                          {allEvt.length > 2 && (
                            <p className="text-[10px] text-gray-400 pl-1">+{allEvt.length - 2} more event type{allEvt.length - 2 !== 1 ? 's' : ''}</p>
                          )}
                        </div>

                        {/* Score footer */}
                        <div className="bg-gray-50 rounded-lg p-2 flex items-center justify-between border border-gray-100 mt-3">
                          <span className="text-[11px] font-bold text-gray-500">Violation Score</span>
                          <span className={`font-black text-sm ${student.status === 'flagged' ? 'text-red-600' : student.status === 'warning' ? 'text-orange-600' : 'text-green-600'}`}>
                            {student.score.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ── Risk Scores Tab ────────────────────────────────────────────────────────
  const RiskTab = () => {
    if (dataLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      );
    }

    const students = riskData?.students ?? [];
    const critical = riskData?.critical_count ?? 0;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
          <button onClick={fetchLiveData} className="flex items-center gap-1 text-blue-500 hover:text-blue-700">
            <RefreshCw size={12} />Refresh
          </button>
        </div>

        {critical > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <ShieldAlert className="text-red-600 mt-0.5 flex-shrink-0" size={20} />
            <div>
              <h4 className="text-red-900 font-bold text-sm">Critical Risk Alert</h4>
              <p className="text-red-700 text-xs mt-1">
                {critical} student(s) have reached critical risk thresholds. Immediate review recommended.
              </p>
            </div>
          </div>
        )}

        {students.length === 0 ? (
          <p className="text-center py-12 text-gray-500 text-sm">No student data available yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((student) => (
              <div key={student.db_id} className={`bg-white border rounded-xl p-4 shadow-sm relative overflow-hidden ${student.alert ? 'border-red-400 ring-1 ring-red-400' : 'border-gray-200'}`}>
                {student.alert && <div className="absolute top-0 right-0 w-2 h-full bg-red-500 animate-pulse" />}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 truncate pr-4">{student.name}</h3>
                    <p className={`text-xs mt-1 font-semibold ${student.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                      {student.is_active ? '● Live' : '○ Offline'}
                    </p>
                  </div>
                  <div className={`w-14 h-14 rounded-full border-4 flex items-center justify-center flex-shrink-0 bg-${student.risk_color}-50 border-${student.risk_color}-500`}>
                    <span className={`text-lg font-black text-${student.risk_color}-700`}>{Math.round(student.risk_score)}</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-md bg-${student.risk_color}-100 text-${student.risk_color}-800`}>
                    {student.risk_band} RISK
                  </span>
                  <button
                    onClick={() => navigate(`/footage/${student.db_id}`)}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    Review <ChevronLeft className="rotate-180" size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────
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
              {[
                { count: online,  label: 'online',   color: 'green',  Icon: Users      },
                { count: warning, label: 'warnings',  color: 'orange', Icon: AlertCircle },
                { count: flagged, label: 'flagged',   color: 'red',    Icon: AlertCircle },
                { count: totalIncidents, label: 'incidents', color: 'purple', Icon: BarChart3 },
                ...(riskData?.critical_count ? [{ count: riskData.critical_count, label: 'critical', color: 'red', Icon: ShieldAlert }] : []),
              ].map(({ count, label, color, Icon }) => (
                <div key={label} className={`flex items-center gap-1.5 bg-${color}-50 border border-${color}-200 px-3 py-2 rounded-lg`}>
                  <Icon size={15} className={`text-${color}-600`} />
                  <span className={`text-sm font-bold text-${color}-700`}>{count}</span>
                  <span className={`text-xs text-${color}-500`}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
          <div className="flex border-b border-gray-200">
            {[
              { id: 'monitor',  label: 'Live Monitor',        icon: Eye         },
              { id: 'activity', label: 'Suspicious Activity', icon: AlertCircle },
              { id: 'risk',     label: 'Risk Scores',         icon: ShieldAlert },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id as 'monitor' | 'activity' | 'risk')}
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
                {id === 'risk' && riskData && riskData.critical_count > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-sm">
                    {riskData.critical_count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="p-5 sm:p-6">
            {activeTab === 'monitor'   && <LiveMonitorTab />}
            {activeTab === 'activity'  && <ActivityTab />}
            {activeTab === 'risk'      && <RiskTab />}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProctoringPage;