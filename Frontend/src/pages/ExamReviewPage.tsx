import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, AlertCircle, AlertTriangle, Info, User, Calendar, Clock,
  FileText, ShieldAlert, Loader2, Search, SlidersHorizontal, Download,
  CheckCircle2, TrendingUp, Mic
} from "lucide-react";

const BASE_URL = "http://127.0.0.1:8000/api";
const getToken = () => localStorage.getItem("access_token");

const apiRequest = async (url: string) => {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
};

interface IncidentItem {
  id: string | number;
  type: string;
  student_id: string;
  student_name: string;
  event: string;
  event_type: string;
  score_points: number;
  time: string;
  occurred_at: string;
  snapshot?: string;
}

interface IncidentBuckets {
  total: number;
  high: IncidentItem[];
  medium: IncidentItem[];
  low: IncidentItem[];
}

interface LiveStudent {
  student_id: string;
  db_id: number;
  name: string;
  violation_score: number;
  ai_event_count: number;
  status: "online" | "warning" | "flagged";
}

interface ExamInfo {
  id: number;
  title: string;
  start_datetime: string;
  duration: number;
  questions_count: number;
}

type GroupedIncident = IncidentItem & { count: number; snapshots?: string[] };

function groupByStudentAndEvent(items: IncidentItem[]): GroupedIncident[] {
  const map = new Map<string, GroupedIncident>();
  for (const item of items) {
    const key = `${item.student_id}||${item.event}`;
    if (map.has(key)) {
      const existing = map.get(key)!;
      existing.count += 1;
      existing.time = item.time;
      existing.score_points += item.score_points;
      if (item.snapshot) {
        if (!existing.snapshots) existing.snapshots = [];
        existing.snapshots.push(item.snapshot);
      }
    } else {
      map.set(key, { ...item, count: 1, snapshots: item.snapshot ? [item.snapshot] : [] });
    }
  }
  return Array.from(map.values());
}

interface StudentSummary {
  student_id: string;
  student_name: string;
  high: GroupedIncident[];
  medium: GroupedIncident[];
  low: GroupedIncident[];
  totalScore: number;
  status: "flagged" | "warning" | "online" | "submitted";
}

function buildStudentSummaries(buckets: IncidentBuckets, liveStudents: LiveStudent[]): StudentSummary[] {
  const map = new Map<string, StudentSummary>();

  const addTo = (items: IncidentItem[], bucket: "high" | "medium" | "low") => {
    const grouped = groupByStudentAndEvent(items);
    for (const item of grouped) {
      if (!map.has(item.student_id)) {
        const live = liveStudents.find((s) => s.student_id === item.student_id);
        map.set(item.student_id, {
          student_id: item.student_id,
          student_name: item.student_name,
          high: [], medium: [], low: [],
          totalScore: live?.violation_score ?? 0,
          status: live?.status ?? "online",
        });
      }
      map.get(item.student_id)![bucket].push(item);
    }
  };

  addTo(buckets.high, "high");
  addTo(buckets.medium, "medium");
  addTo(buckets.low, "low");

  for (const live of liveStudents) {
    if (!map.has(live.student_id)) {
      map.set(live.student_id, {
        student_id: live.student_id, student_name: live.name,
        high: [], medium: [], low: [],
        totalScore: live.violation_score, status: live.status,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.totalScore - a.totalScore);
}

export default function ExamReviewPage() {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const id = Number(examId);

  const [exam, setExam] = useState<ExamInfo | null>(null);
  const [buckets, setBuckets] = useState<IncidentBuckets | null>(null);
  const [liveStudents, setLiveStudents] = useState<LiveStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "flagged" | "warning" | "online" | "submitted">("All");
  const [severityFilter, setSeverityFilter] = useState<"All" | "high" | "medium" | "low">("All");

  useEffect(() => {
    if (!id) { setError("No exam ID."); setLoading(false); return; }
    const load = async () => {
      setLoading(true);
      try {
        const [examData, incData, liveData] = await Promise.all([
          apiRequest(`${BASE_URL}/exam/${id}/`),
          apiRequest(`${BASE_URL}/violations/exam/${id}/incidents/`),
          apiRequest(`${BASE_URL}/violations/exam/${id}/live-status/`).catch(() => ({ students: [] })),
        ]);
        setExam(examData);
        setBuckets(incData);
        setLiveStudents(liveData.students ?? []);
      } catch {
        setError("Failed to load review data.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const summaries = useMemo(() => {
    if (!buckets) return [];
    return buildStudentSummaries(buckets, liveStudents);
  }, [buckets, liveStudents]);

  const filtered = useMemo(() => {
    let result = [...summaries];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((s) => s.student_name.toLowerCase().includes(q) || s.student_id.toLowerCase().includes(q));
    }
    if (statusFilter !== "All") result = result.filter((s) => s.status === statusFilter);
    if (severityFilter !== "All") result = result.filter((s) => s[severityFilter].length > 0);
    return result;
  }, [summaries, searchQuery, statusFilter, severityFilter]);

  const allHigh   = buckets ? groupByStudentAndEvent(buckets.high).reduce((s, i) => s + i.count, 0) : 0;
  const allMedium = buckets ? groupByStudentAndEvent(buckets.medium).reduce((s, i) => s + i.count, 0) : 0;
  const allLow    = buckets ? groupByStudentAndEvent(buckets.low).reduce((s, i) => s + i.count, 0) : 0;
  const flaggedCount = summaries.filter((s) => s.status === "flagged").length;
  const warningCount = summaries.filter((s) => s.status === "warning").length;
  const clearCount   = summaries.filter((s) => s.status === "online").length;

  const handleExport = () => {
    const headers = ["Student Name", "Student ID", "Status", "High", "Medium", "Low", "Score"];
    const rows = filtered.map((s) => [`"${s.student_name}"`, `"${s.student_id}"`, `"${s.status}"`, s.high.length, s.medium.length, s.low.length, s.totalScore.toFixed(1)]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `ExamGuard_Review_${exam?.title ?? id}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
      <div className="flex flex-col items-center text-orange-600">
        <Loader2 size={40} className="animate-spin mb-4" />
        <p className="font-medium text-gray-600">Loading exam review...</p>
      </div>
    </div>
  );

  if (error || !exam || !buckets) return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6">
      <ShieldAlert size={64} className="text-red-400 mb-4" />
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
      <p className="text-gray-600 mb-6">{error ?? "Exam not found"}</p>
      <button onClick={() => navigate(-1)} className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">Go Back</button>
    </div>
  );

  const examDate = new Date(exam.start_datetime);
  const statusConfig: Record<string, any> = {
    flagged:    { label: "Flagged",    color: "bg-red-100 text-red-700 border-red-200",      topBar: "bg-red-500",    icon: <AlertTriangle size={14} className="text-red-500" /> },
    warning:    { label: "Warning",    color: "bg-orange-100 text-orange-700 border-orange-200", topBar: "bg-orange-500", icon: <AlertCircle   size={14} className="text-orange-500" /> },
    online:     { label: "Clear",      color: "bg-green-100 text-green-700 border-green-200",  topBar: "bg-green-500",  icon: <CheckCircle2  size={14} className="text-green-500" /> },
    submitted:  { label: "Submitted",  color: "bg-blue-100 text-blue-700 border-blue-200",     topBar: "bg-blue-500",   icon: <CheckCircle2  size={14} className="text-blue-500" /> },
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-20">

      {/* Top nav */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-orange-600 transition-colors font-medium text-sm">
            <ArrowLeft size={16} /> Back
          </button>
          <div className="flex items-center gap-2 px-3 py-1 bg-orange-50 text-orange-700 rounded-full text-xs font-bold border border-orange-200">
            <ShieldAlert size={14} /> INCIDENT REVIEW
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 pt-10">

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500" />
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{exam.title}</h1>
          <p className="text-gray-500 text-sm mb-6 max-w-2xl">
            Detailed incident review per student. Repeated events show a count badge. Sorted by violation score (highest first).
          </p>
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2"><Calendar size={16} className="text-orange-500" /><span className="font-medium text-gray-900">{examDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span></div>
            <div className="w-px h-4 bg-gray-300 hidden sm:block" />
            <div className="flex items-center gap-2"><Clock size={16} className="text-orange-500" /><span className="font-medium text-gray-900">{examDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span></div>
            <div className="w-px h-4 bg-gray-300 hidden sm:block" />
            <div className="flex items-center gap-2"><FileText size={16} className="text-orange-500" /><span className="font-medium text-gray-900">{exam.questions_count} Questions · {exam.duration} min</span></div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
          {[
            { label: "Flagged",     value: flaggedCount, icon: <AlertTriangle size={22} />, bg: "bg-red-50",    text: "text-red-600",    iconBg: "bg-red-100" },
            { label: "Warnings",    value: warningCount, icon: <AlertCircle   size={22} />, bg: "bg-orange-50", text: "text-orange-600", iconBg: "bg-orange-100" },
            { label: "Clear",       value: clearCount,   icon: <CheckCircle2  size={22} />, bg: "bg-green-50",  text: "text-green-600",  iconBg: "bg-green-100" },
            { label: "High Events", value: allHigh,      icon: <TrendingUp    size={22} />, bg: "bg-purple-50", text: "text-purple-600", iconBg: "bg-purple-100" },
          ].map(({ label, value, icon, bg, text, iconBg }) => (
            <div key={label} className={`${bg} rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col items-center text-center`}>
              <div className={`w-12 h-12 rounded-full ${iconBg} ${text} flex items-center justify-center mb-3`}>{icon}</div>
              <div className={`text-3xl font-extrabold ${text} mb-1`}>{value}</div>
              <div className="text-xs font-semibold tracking-wider text-gray-500 uppercase">{label}</div>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar */}
          <div className="lg:w-1/4 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm sticky top-28">
              <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
                <SlidersHorizontal size={20} className="text-gray-700" />
                <h3 className="text-lg font-bold text-gray-900">Filters</h3>
              </div>

              <div className="mb-6">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Search Student</label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type="text" placeholder="Name or ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/40 placeholder:text-gray-400" />
                </div>
              </div>

              <div className="mb-6">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Status</label>
                <div className="space-y-1">
                  {(["All", "flagged", "warning", "online", "submitted"] as const).map((s) => (
                    <label key={s} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group">
                      <div className="flex items-center gap-3">
                        <input type="radio" name="status" checked={statusFilter === s} onChange={() => setStatusFilter(s)} className="w-4 h-4 text-orange-600" />
                        <span className={`text-sm font-semibold capitalize ${statusFilter === s ? "text-gray-900" : "text-gray-500"}`}>
                          {s === "online" ? "Clear" : s}
                        </span>
                      </div>
                      {s !== "All" && <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">{summaries.filter((st) => st.status === s).length}</span>}
                    </label>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Has Severity</label>
                <div className="space-y-1">
                  {(["All", "high", "medium", "low"] as const).map((s) => (
                    <label key={s} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer">
                      <input type="radio" name="severity" checked={severityFilter === s} onChange={() => setSeverityFilter(s)} className="w-4 h-4 text-orange-600" />
                      <span className={`text-sm font-semibold capitalize ${severityFilter === s ? "text-gray-900" : "text-gray-500"}`}>{s}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-6">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Incident Totals</p>
                {[
                  { label: "High",   count: allHigh,   color: "text-red-600",    dot: "bg-red-500" },
                  { label: "Medium", count: allMedium, color: "text-orange-600", dot: "bg-orange-500" },
                  { label: "Low",    count: allLow,    color: "text-yellow-600", dot: "bg-yellow-500" },
                ].map(({ label, count, color, dot }) => (
                  <div key={label} className="flex items-center justify-between mb-1.5 last:mb-0">
                    <div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${dot}`} /><span className="text-sm text-gray-600">{label}</span></div>
                    <span className={`text-sm font-black ${color}`}>{count}</span>
                  </div>
                ))}
              </div>

              <button onClick={handleExport} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-xl font-bold shadow-md shadow-orange-600/20 hover:bg-orange-700 transition-all">
                <Download size={18} /> Export CSV
              </button>
            </div>
          </div>

          {/* Cards */}
          <div className="lg:w-3/4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Student Incidents</h2>
              <div className="text-sm font-semibold text-gray-500 bg-white px-4 py-1.5 rounded-full border border-gray-200 shadow-sm">
                Showing {filtered.length} of {summaries.length} students
              </div>
            </div>

            {filtered.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center shadow-sm">
                <Search size={48} className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-700 mb-2">No students found</h3>
                <p className="text-gray-500 max-w-sm mx-auto">Adjust your filters or search query.</p>
                <button onClick={() => { setSearchQuery(""); setStatusFilter("All"); setSeverityFilter("All"); }}
                  className="mt-6 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-colors">
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((student) => {
                  const cfg = statusConfig[student.status];
                  const allEvents = [...student.high, ...student.medium, ...student.low];
                  return (
                    <div key={student.student_id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col">
                      <div className={`absolute top-0 left-0 w-full h-1.5 ${cfg.topBar}`} />

                      <div className="flex justify-between items-start mb-4 pt-1">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 flex items-center justify-center text-gray-700 font-black text-sm flex-shrink-0 shadow-sm">
                            {student.student_name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-base text-gray-900 leading-tight truncate">{student.student_name}</h3>
                            <span className="text-[11px] text-gray-500 font-mono">{student.student_id}</span>
                          </div>
                        </div>
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider ${cfg.color} flex-shrink-0`}>
                          {cfg.icon}{cfg.label}
                        </div>
                      </div>

                      {/* Severity counts */}
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {[
                          { label: "High",   count: student.high.reduce((s, i) => s + i.count, 0),   activeBg: "bg-red-50 border-red-100",       t: "text-red-700",    l: "text-red-600" },
                          { label: "Medium", count: student.medium.reduce((s, i) => s + i.count, 0), activeBg: "bg-orange-50 border-orange-100", t: "text-orange-700", l: "text-orange-600" },
                          { label: "Low",    count: student.low.reduce((s, i) => s + i.count, 0),    activeBg: "bg-yellow-50 border-yellow-100", t: "text-yellow-700", l: "text-yellow-600" },
                        ].map(({ label, count, activeBg, t, l }) => (
                          <div key={label} className={`rounded-lg p-2 text-center border ${count > 0 ? activeBg : "bg-gray-50 border-gray-100"}`}>
                            <div className={`text-[9px] font-bold uppercase ${count > 0 ? l : "text-gray-400"}`}>{label}</div>
                            <div className={`text-sm font-black mt-0.5 ${count > 0 ? t : "text-gray-500"}`}>{count}</div>
                          </div>
                        ))}
                      </div>

                      {/* Top events */}
                      <div className="mb-4 flex-1 space-y-1.5">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                          <ShieldAlert size={10} /> Top Incidents
                          {allEvents.length > 3 && <span className="ml-auto px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-md text-[9px]">+{allEvents.length - 3} more</span>}
                        </p>
                        {allEvents.length === 0 ? (
                          <span className="text-[10px] text-gray-400 italic bg-gray-50 px-2 py-1 rounded w-full border border-dashed border-gray-100 block">No incidents recorded</span>
                        ) : (
                          allEvents.slice(0, 3).map((ev) => {
                            const isHigh = student.high.some((h) => h.event_type === ev.event_type);
                            const isMed  = !isHigh && student.medium.some((m) => m.event_type === ev.event_type);
                            const evColor = isHigh ? "text-red-600 bg-red-50" : isMed ? "text-orange-600 bg-orange-50" : "text-yellow-700 bg-yellow-50";
                            const displayEvent = ev.event.includes('LOOKING') ? ev.event.replace(/LOOKING.*/, 'Looking away') : ev.event.replace('🔊 ', '');
                            return (
                              <div key={`${ev.student_id}-${ev.event_type}-${ev.event}`} className="flex flex-col gap-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className={`text-[11px] font-medium truncate flex-1 px-2 py-1 rounded-lg flex items-center gap-1 ${evColor}`}>
                                    {ev.event_type === 'ai_audio_violation' ? <Mic size={10} /> : null}
                                    {displayEvent}
                                  </span>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    {ev.count > 1 && <span className="text-[10px] font-black text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">×{ev.count}</span>}
                                    <span className="text-[10px] font-bold text-gray-400">+{ev.score_points.toFixed(1)}</span>
                                  </div>
                                </div>
                                {ev.snapshots && ev.snapshots.length > 0 && (
                                  <div className="mt-1 bg-gray-50 border border-gray-100 p-1.5 rounded-lg flex gap-2 overflow-x-auto custom-scrollbar">
                                    {ev.snapshots.map((snap: string, i: number) => (
                                      <img key={i} src={snap} alt={`Violation Snapshot ${i+1}`} className="max-h-24 rounded border border-gray-200 object-contain flex-shrink-0" />
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Score */}
                      <div className="bg-gray-50/50 rounded-xl p-3 flex items-center justify-between border border-gray-100 mt-auto">
                        <span className="text-xs font-bold text-gray-500">Violation Score</span>
                        <span className={`font-black text-base ${student.status === "flagged" ? "text-red-600" : student.status === "warning" ? "text-orange-600" : "text-green-600"}`}>
                          {student.totalScore.toFixed(1)}<span className="text-xs font-semibold text-gray-400">/20</span>
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
}
