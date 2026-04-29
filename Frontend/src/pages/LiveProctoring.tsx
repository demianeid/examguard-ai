import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Video, Clock, Users, AlertCircle, RefreshCw } from 'lucide-react';
import Header from '../components/Header';

const DJANGO = 'http://127.0.0.1:8000';
const getToken = () => localStorage.getItem('access_token');

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
}

interface LiveStatusData {
  exam_id: number;
  total_students: number;
  flagged: number;
  warning: number;
  online: number;
  students: LiveStudent[];
}

const LiveProctoring: React.FC = () => {
  const navigate = useNavigate();
  const { examId = null } = useParams<{ examId?: string }>();

  const [liveData, setLiveData]     = useState<LiveStatusData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  // Phase 4: Live frame dictionary mapping db_id to base64 jpeg
  const [liveFrames, setLiveFrames] = useState<Record<number, string>>({});

  // Countdown seconds derived from exam end time stored in live data
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  // ── Fetch live status ────────────────────────────────────────────────────
  const fetchLive = useCallback(async () => {
    if (!examId) { setLoading(false); return; }
    try {
      const res = await fetch(`${DJANGO}/api/violations/exam/${examId}/live-status/`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data: LiveStatusData = await res.json();
      setLiveData(data);
      setLastRefresh(new Date());
    } catch (err) {
      console.warn('[LiveProctoring] fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [examId]);

  // Fetch exam details to get duration / end time
  useEffect(() => {
    if (!examId) return;
    fetch(`${DJANGO}/api/exam/${examId}/`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(r => r.json())
      .then(data => {
        const end = new Date(data.start_datetime).getTime() + data.duration * 60_000;
        setSecondsLeft(Math.max(0, Math.round((end - Date.now()) / 1000)));
      })
      .catch(() => setSecondsLeft(59 * 60 + 45)); // fallback
  }, [examId]);

  // Countdown tick
  useEffect(() => {
    const t = setInterval(() => setSecondsLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  // Initial load + 10 s polling
  useEffect(() => {
    fetchLive();
    const interval = setInterval(fetchLive, 10_000);
    return () => clearInterval(interval);
  }, [fetchLive]);

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

  // ── Helpers ──────────────────────────────────────────────────────────────
  const fmt = (n: number) => String(n).padStart(2, '0');
  const h   = Math.floor(secondsLeft / 3600);
  const m   = Math.floor((secondsLeft % 3600) / 60);
  const s   = secondsLeft % 60;

  const students     = liveData?.students ?? [];
  const alertStudents = students.filter(st => st.status === 'flagged' || st.status === 'warning');

  const ringColor = (st: LiveStudent) => {
    if (st.status === 'flagged') return 'ring-4 ring-red-500';
    if (st.status === 'warning') return 'ring-2 ring-orange-400';
    return '';
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="w-full min-h-screen bg-[#E8F1FA]">
      <Header fixed={true} showAccount={true} isRegistered={true} userType="instructor" />

      <div className="pt-24 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-lg p-6 relative"
          >
            {/* Header row — Back button LEFT-aligned to match arrow direction */}
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors font-medium text-sm flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />Back
              </button>
              <div className="flex items-center gap-3">
                <Video className="w-8 h-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">Live Proctoring</h1>
              </div>
            </div>

            {/* Info bar */}
            <div className="flex items-center gap-6 mb-6 flex-wrap">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-red-600" />
                <span className="text-xl font-mono font-bold text-gray-900">
                  {fmt(h)}:{fmt(m)}:{fmt(s)}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-blue-100 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                <span className="text-blue-700 font-semibold text-sm">Live</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-5 h-5" />
                <span className="font-semibold">{students.length} students active</span>
              </div>
              <button
                onClick={fetchLive}
                className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700 ml-auto"
              >
                <RefreshCw size={13} />
                Refresh · {lastRefresh.toLocaleTimeString()}
              </button>
            </div>

            {/* Alert banner */}
            {alertStudents.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="font-semibold text-yellow-900">
                      {alertStudents.length} Student{alertStudents.length > 1 ? 's' : ''} Flagged
                    </p>
                    <p className="text-sm text-yellow-700">
                      {alertStudents.map(st => st.name).join(', ')} · Flagged for suspicious behaviour
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* No examId warning */}
            {!examId && (
              <div className="text-center py-16 text-gray-400">
                <Video size={48} className="mx-auto mb-3 opacity-30" />
                <p>No exam selected. Navigate from an exam's proctoring page.</p>
              </div>
            )}

            {/* Loading skeleton */}
            {loading && examId && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="aspect-video bg-gray-200 rounded-xl animate-pulse" />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!loading && examId && students.length === 0 && (
              <div className="text-center py-16 text-gray-400">
                <Users size={48} className="mx-auto mb-3 opacity-30" />
                <p>No students have started the exam yet.</p>
              </div>
            )}

            {/* Student grid */}
            {!loading && students.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {students.map((student, index) => (
                  <motion.div
                    key={student.db_id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.04 }}
                    className={`relative bg-gray-900 rounded-xl overflow-hidden ${ringColor(student)}`}
                  >
                    {/* Status badge */}
                    {student.status !== 'online' && (
                      <div className={`absolute top-3 right-3 z-10 px-3 py-1 rounded-full flex items-center gap-1 text-sm font-semibold text-white ${student.status === 'flagged' ? 'bg-red-600' : 'bg-orange-500'}`}>
                        <AlertCircle className="w-4 h-4" />
                        {student.status === 'flagged' ? 'FLAGGED' : 'WARNING'}
                      </div>
                    )}

                    {/* Violation score badge */}
                    {student.violation_score > 0 && (
                      <div className="absolute top-3 left-3 z-10 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                        {student.violation_score.toFixed(1)} pts
                      </div>
                    )}

                    {/* Video placeholder or Live Frame */}
                    <div className="aspect-video bg-gray-800 flex items-center justify-center relative group">
                      {liveFrames[student.db_id] ? (
                        <img 
                          src={`data:image/jpeg;base64,${liveFrames[student.db_id]}`} 
                          alt="Live Feed" 
                          className="w-full h-full object-cover" 
                        />
                      ) : student.profile_image ? (
                        <img src={student.profile_image} alt={student.name} className="w-20 h-20 rounded-full object-cover border-4 border-gray-600 opacity-60" />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gray-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-gray-500 opacity-70">
                          {student.name.charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* Pulsing ring for flagged */}
                      {student.status === 'flagged' && (
                        <div className="absolute inset-0 border-4 border-red-500 rounded-xl animate-pulse pointer-events-none" />
                      )}

                      {/* Student info overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-white font-semibold text-lg">{student.name}</h3>
                            <div className="flex items-center gap-3 mt-1">
                              <span className={`text-sm font-medium ${student.status === 'flagged' ? 'text-red-400' : student.status === 'warning' ? 'text-orange-400' : 'text-green-400'}`}>
                                {student.is_active ? '● Live' : '○ Offline'}
                              </span>
                              {student.ai_event_count > 0 && (
                                <span className="text-yellow-400 text-xs">
                                  {student.ai_event_count} AI alert{student.ai_event_count > 1 ? 's' : ''}
                                </span>
                              )}
                            </div>
                          </div>
                          {/* Progress */}
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-white/20 rounded-full h-1.5">
                              <div className="h-1.5 rounded-full bg-white" style={{ width: `${student.progress}%` }} />
                            </div>
                            <span className="text-white text-xs font-bold">{student.progress}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LiveProctoring;