import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Search, AlertCircle, RefreshCw, Eye } from "lucide-react";
import Header from '../components/Header';

const DJANGO = 'http://127.0.0.1:8000';
const getToken = () => localStorage.getItem('access_token');

// ── Types matching the real /incidents/ API response ──────────────────────────
interface Incident {
  id: string | number;
  type: 'behavior' | 'ai';
  student_id: string;           // custom_id (string)
  student_db_id?: number;       // db integer id, populated if available
  student_name: string;
  event: string;
  event_type: string;
  score_points: number;
  time: string;
  occurred_at: string;
  severity: 'high' | 'medium' | 'low';
  yolo_labels?: string[];
}

// ── Student db_id lookup from live-status ────────────────────────────────────
interface StudentDbMap {
  [custom_id: string]: number;
}

const ReviewIncidents: React.FC = () => {
  const navigate = useNavigate();
  const { examId } = useParams<{ examId: string }>();

  const [searchQuery, setSearchQuery]         = useState<string>("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [incidents, setIncidents]             = useState<Incident[]>([]);
  const [studentDbMap, setStudentDbMap]       = useState<StudentDbMap>({});
  const [loading, setLoading]                 = useState(true);
  const [examTitle, setExamTitle]             = useState<string>('');
  const [error, setError]                     = useState<string | null>(null);

  // ── Fetch real incidents from backend ────────────────────────────────────
  const fetchIncidents = useCallback(async () => {
    if (!examId) return;
    setLoading(true);
    setError(null);
    try {
      const headers = { Authorization: `Bearer ${getToken()}` };

      const [incidentRes, examRes, liveRes] = await Promise.all([
        fetch(`${DJANGO}/api/violations/exam/${examId}/incidents/`,   { headers }),
        fetch(`${DJANGO}/api/exam/${examId}/`,                        { headers }),
        fetch(`${DJANGO}/api/violations/exam/${examId}/live-status/`, { headers }),
      ]);

      if (!incidentRes.ok) throw new Error(`HTTP ${incidentRes.status}`);
      const data = await incidentRes.json();

      // Build custom_id → db_id map from live-status
      if (liveRes.ok) {
        const liveData = await liveRes.json();
        const map: StudentDbMap = {};
        for (const s of liveData.students ?? []) {
          map[s.student_id] = s.db_id;
        }
        setStudentDbMap(map);
      }

      if (examRes.ok) {
        const examData = await examRes.json();
        setExamTitle(examData.title ?? '');
      }

      // Flatten all severity buckets, tag each with its severity
      const all: Incident[] = [
        ...(data.high   ?? []).map((i: any) => ({ ...i, severity: 'high'   as const })),
        ...(data.medium ?? []).map((i: any) => ({ ...i, severity: 'medium' as const })),
        ...(data.low    ?? []).map((i: any) => ({ ...i, severity: 'low'    as const })),
      ];
      all.sort((a, b) => b.occurred_at.localeCompare(a.occurred_at));
      setIncidents(all);
    } catch {
      setError('Failed to load incidents. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [examId]);

  useEffect(() => { fetchIncidents(); }, [fetchIncidents]);

  // ── Navigate to footage page using db_id (integer) ──────────────────────
  const handleReviewFootage = (customId: string) => {
    const dbId = studentDbMap[customId];
    if (dbId) {
      navigate(`/footage/${dbId}`);
    } else {
      // Fallback: navigate using custom_id if db_id is not yet available
      navigate(`/footage/${customId}`);
    }
  };

  // ── Filters ───────────────────────────────────────────────────────────────
  const filtered = (selectedSeverity === "all" ? incidents : incidents.filter(i => i.severity === selectedSeverity))
    .filter(i =>
      i.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.event.toLowerCase().includes(searchQuery.toLowerCase())
    );

  const getSeverityColors = (severity: string) => {
    switch (severity) {
      case "high":   return { bg: "bg-red-50",    border: "border-l-red-500",    badge: "bg-red-600",    button: "bg-red-600 hover:bg-red-700"    };
      case "medium": return { bg: "bg-orange-50", border: "border-l-orange-500", badge: "bg-orange-600", button: "bg-orange-600 hover:bg-orange-700" };
      case "low":    return { bg: "bg-yellow-50", border: "border-l-yellow-600", badge: "bg-yellow-700", button: "bg-yellow-700 hover:bg-yellow-800" };
      default:       return { bg: "bg-gray-50",   border: "border-l-gray-500",   badge: "bg-gray-600",   button: "bg-gray-600 hover:bg-gray-700"   };
    }
  };

  const severityCounts = {
    high:   incidents.filter(i => i.severity === 'high').length,
    medium: incidents.filter(i => i.severity === 'medium').length,
    low:    incidents.filter(i => i.severity === 'low').length,
  };

  return (
    <div className="w-full min-h-screen bg-[#E8F1FA]">
      <Header fixed={true} showAccount={true} isRegistered={true} userType="instructor" />

      <div className="pt-24 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            {/* ── Header row ──────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              {/* Back button — LEFT aligned, matching arrow direction */}
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors font-medium text-sm flex-shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </button>

              <div className="flex items-center gap-3 flex-1 min-w-0">
                <AlertCircle className="w-7 h-7 text-red-600 flex-shrink-0" />
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold text-gray-900 truncate">Review Incidents</h1>
                  {examTitle && (
                    <p className="text-sm text-gray-500 mt-0.5 truncate">{examTitle}</p>
                  )}
                </div>
              </div>

              <button
                onClick={fetchIncidents}
                className="flex items-center gap-1.5 text-sm text-blue-500 hover:text-blue-700 font-medium transition-colors flex-shrink-0"
              >
                <RefreshCw size={14} /> Refresh
              </button>
            </div>

            {/* ── Search ──────────────────────────────────────────────────── */}
            <div className="relative mb-5">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by student name, ID, or description…"
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            {/* ── Severity filter buttons ──────────────────────────────────── */}
            <div className="flex gap-3 mb-6 flex-wrap items-center">
              {[
                { key: 'all',    label: 'All',    count: incidents.length, activeClass: 'bg-gray-700 text-white',   inactiveClass: 'bg-gray-200 text-gray-700 hover:bg-gray-300'         },
                { key: 'high',   label: 'High',   count: severityCounts.high,   activeClass: 'bg-red-600 text-white',    inactiveClass: 'bg-red-100 text-red-700 hover:bg-red-200'           },
                { key: 'medium', label: 'Medium', count: severityCounts.medium, activeClass: 'bg-orange-600 text-white', inactiveClass: 'bg-orange-100 text-orange-700 hover:bg-orange-200' },
                { key: 'low',    label: 'Low',    count: severityCounts.low,    activeClass: 'bg-yellow-700 text-white', inactiveClass: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
              ].map(({ key, label, count, activeClass, inactiveClass }) => (
                <button
                  key={key}
                  onClick={() => setSelectedSeverity(key)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${selectedSeverity === key ? activeClass : inactiveClass}`}
                >
                  {label}
                  <span className="ml-1.5 opacity-70 font-normal">({count})</span>
                </button>
              ))}
              <span className="ml-auto text-sm text-gray-400">
                Showing {filtered.length} incident{filtered.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* ── Incidents list ───────────────────────────────────────────── */}
            <div className="space-y-3">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                ))
              ) : error ? (
                <div className="text-center py-12">
                  <AlertCircle className="mx-auto text-red-400 mb-3" size={48} />
                  <p className="text-red-500 font-medium mb-3">{error}</p>
                  <button
                    onClick={fetchIncidents}
                    className="text-blue-500 hover:text-blue-700 font-semibold text-sm"
                  >
                    Try again
                  </button>
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="mx-auto text-gray-300 mb-3" size={48} />
                  <p className="text-gray-500">
                    {incidents.length === 0
                      ? 'No incidents recorded for this exam yet.'
                      : 'No incidents match your current filters.'}
                  </p>
                  {incidents.length > 0 && (
                    <button
                      onClick={() => { setSearchQuery(''); setSelectedSeverity('all'); }}
                      className="mt-3 text-blue-500 hover:text-blue-700 font-semibold text-sm"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              ) : (
                filtered.map((incident, index) => {
                  const colors = getSeverityColors(incident.severity);
                  return (
                    <motion.div
                      key={incident.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.35, delay: Math.min(index * 0.05, 0.4) }}
                      className={`${colors.bg} ${colors.border} border-l-4 rounded-lg p-4 flex items-center justify-between gap-4`}
                    >
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        {/* Severity badge */}
                        <span className={`${colors.badge} text-white text-xs font-bold px-3 py-1 rounded-full uppercase flex-shrink-0 mt-0.5`}>
                          {incident.severity}
                        </span>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-semibold text-gray-900 text-sm">{incident.student_name}</h3>
                            <span className="text-gray-400 text-[11px] font-mono">{incident.student_id}</span>
                            <span className="text-gray-300">•</span>
                            <span className="text-gray-500 text-xs capitalize">
                              {incident.event_type.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm">{incident.event}</p>

                          {/* YOLO labels */}
                          {incident.yolo_labels && incident.yolo_labels.length > 0 && (
                            <div className="flex gap-1 mt-1.5 flex-wrap">
                              {incident.yolo_labels.map(label => (
                                <span
                                  key={label}
                                  className="bg-gray-200 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase"
                                >
                                  {label}
                                </span>
                              ))}
                            </div>
                          )}

                          <p className="text-gray-400 text-xs mt-1">{incident.time}</p>
                        </div>
                      </div>

                      {/* Review Footage button — navigates to real footage page */}
                      <button
                        onClick={() => handleReviewFootage(incident.student_id)}
                        className={`${colors.button} text-white px-4 py-2 rounded-lg font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 text-sm flex-shrink-0`}
                      >
                        <Eye size={14} /> Review Footage
                      </button>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ReviewIncidents;