import React, { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  FileText,
  User,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Calendar,
  Clock,
  Loader2,
  ArrowLeft,
  Download,
  ShieldAlert,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import {
  offlineExamApi,
  monitoringApi,
  studentZoneApi,
  type OfflineExam,
  type MonitoringSession,
  type ViolationLog,
  type Alert,
  type StudentZone,
} from "../services/api";

export default function ReportPage() {
  const [searchParams] = useSearchParams();
  const examId = Number(searchParams.get("examId"));
  const navigate = useNavigate();

  const [exam, setExam] = useState<OfflineExam | null>(null);
  const [session, setSession] = useState<MonitoringSession | null>(null);
  const [violations, setViolations] = useState<ViolationLog[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [zones, setZones] = useState<StudentZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  // Filters & Sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("score_desc");

  useEffect(() => {
    if (!examId) {
      setError("No exam ID provided.");
      setLoading(false);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [examData, zonesData] = await Promise.all([
          offlineExamApi.getById(examId),
          studentZoneApi.getByExam(examId).catch(() => [] as StudentZone[]),
        ]);
        setExam(examData);
        setZones(zonesData);

        try {
          const sessionData = await monitoringApi.getSession(examId);
          setSession(sessionData);

          if (sessionData && sessionData.id) {
            const [violationsData, alertsData] = await Promise.all([
              monitoringApi.getViolations(sessionData.id),
              monitoringApi.getAlerts(sessionData.id),
            ]);
            setViolations(violationsData);
            setAlerts(alertsData);
          }
        } catch (sessionErr) {
          // It's possible there is no session created yet if they never started it
          console.error("Session not found or failed to load:", sessionErr);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load exam details.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [examId]);

  // Re-analyze functionality replaced by Excel Export

  /**
   * Build a lookup: student_code → StudentZone to pull dynamic_student_name /
   * dynamic_seat_number per card. MUST be before any early returns (Rules of Hooks).
   */
  const zoneByCode = useMemo(() => {
    const map = new Map<string, typeof zones[0]>();
    zones.forEach(z => {
      if (z.student_code) map.set(z.student_code, z);
    });
    return map;
  }, [zones]);

  const getStudentStatus = (score: number, hasViolation: boolean = false) => {
    if (score >= 20) {
      return {
        label: "Cheated",
        color: "bg-red-100 text-red-700 border-red-200",
        icon: <AlertTriangle size={14} className="text-red-500" />,
      };
    } else if (score >= 8 || hasViolation) {
      return {
        label: "Suspicious",
        color: "bg-orange-100 text-orange-700 border-orange-200",
        icon: <AlertCircle size={14} className="text-orange-500" />,
      };
    } else {
      return {
        label: "Clear",
        color: "bg-green-100 text-green-700 border-green-200",
        icon: <CheckCircle2 size={14} className="text-green-500" />,
      };
    }
  };

  /** Match alerts to a violation record by zone id first, then by student_code/name fallback */
  const getAlertsForStudent = (student_code: string, student_name: string, seat_number: string, zone_id?: number) => {
    if (zone_id) {
      const byZone = alerts.filter(a => a.zone === zone_id);
      if (byZone.length > 0) return byZone;
    }
    return alerts.filter(
      a =>
        (student_code && a.student_name === student_name) ||
        (seat_number && a.seat_number === seat_number)
    );
  };

  // Build unified student data combining zones and violations to show ALL students
  const allStudentsData = useMemo(() => {
    if (zones.length > 0) {
      return zones.map((zone) => {
        const violation = violations.find(
          (v) => v.zone === zone.id || (v.student_code && v.student_code === zone.student_code)
        );
        const score = violation ? Number(violation.violation_score) : 0;
        const studentAlerts = getAlertsForStudent(zone.student_code, zone.student_name, zone.seat_number, zone.id);

        return {
          id: `zone-${zone.id}`,
          zoneId: zone.id,
          student_code: zone.student_code || "",
          displayName: zone.dynamic_student_name || zone.student_name || "Unknown Student",
          displaySeat: zone.dynamic_seat_number || zone.seat_number || "",
          score: score,
          status: getStudentStatus(score, !!violation || studentAlerts.length > 0),
          alerts: studentAlerts,
          high_severity: violation?.high_severity || 0,
          medium_severity: violation?.medium_severity || 0,
          low_severity: violation?.low_severity || 0,
        };
      });
    } else {
      return violations.map((v) => {
        const score = Number(v.violation_score);
        const studentAlerts = getAlertsForStudent(v.student_code, v.student_name, v.seat_number, v.zone);

        return {
          id: `violation-${v.id}`,
          zoneId: v.zone,
          student_code: v.student_code || "",
          displayName: v.student_name || "Unknown Student",
          displaySeat: v.seat_number || "",
          score: score,
          status: getStudentStatus(score, true),
          alerts: studentAlerts,
          high_severity: v.high_severity || 0,
          medium_severity: v.medium_severity || 0,
          low_severity: v.low_severity || 0,
        };
      });
    }
  }, [zones, violations, alerts]);

  // Apply filters and sorting
  const filteredStudents = useMemo(() => {
    let result = [...allStudentsData];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (s) =>
          s.displayName.toLowerCase().includes(q) ||
          s.student_code.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "All") {
      result = result.filter((s) => s.status.label === statusFilter);
    }

    result.sort((a, b) => {
      if (sortBy === "score_desc") return b.score - a.score;
      if (sortBy === "score_asc") return a.score - b.score;
      if (sortBy === "name_asc") return a.displayName.localeCompare(b.displayName);
      return 0;
    });

    return result;
  }, [allStudentsData, searchQuery, statusFilter, sortBy]);

  const handleExportExcel = () => {
    const headers = [
      "Student Name", 
      "Student ID", 
      "Seat Number", 
      "Status", 
      "Violation Score", 
      "Critical Alerts", 
      "Medium Alerts", 
      "Low Alerts"
    ];
    
    const rows = filteredStudents.map(s => [
      `"${s.displayName}"`,
      `"${s.student_code}"`,
      `"${s.displaySeat}"`,
      `"${s.status.label}"`,
      s.score.toFixed(1),
      s.high_severity,
      s.medium_severity,
      s.low_severity
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `ExamGuard_Report_${exam?.title || "Exam"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Summary Metrics
  const totalStudents = zones.length > 0 ? zones.length : violations.length;
  const totalViolatingStudents = allStudentsData.filter(s => s.status.label !== "Clear").length;
  const totalClear = allStudentsData.filter(s => s.status.label === "Clear").length;
  const highSeverityAlerts = violations.reduce((sum, v) => sum + v.high_severity, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center text-blue-600">
          <Loader2 size={40} className="animate-spin mb-4" />
          <p className="font-medium text-gray-600">Loading comprehensive report...</p>
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <ShieldAlert size={64} className="text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
        <p className="text-gray-600 mb-6">{error || "Exam not found"}</p>
        <button
          onClick={() => navigate("/exams")}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Exams
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] font-sans pb-20">
      {/* Top Navigation */}
      <div className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate("/exams")}
            className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors font-medium text-sm"
          >
            <ArrowLeft size={16} />
            Back to Exams
          </button>
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-bold">
            <FileText size={14} />
            FINAL REPORT
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 pt-10">
        {/* Header Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600" />
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            {exam.title}
          </h1>
          <p className="text-gray-500 text-sm mb-6 max-w-2xl">
            Complete offline monitoring report generated automatically. This
            report analyzes student behavior and summarizes any detected AI or
            policy violations during the exam session.
          </p>

          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-blue-500" />
              <span className="font-medium text-gray-900">{exam.hall_name}</span>
            </div>
            <div className="w-px h-4 bg-gray-300 hidden sm:block" />
            <div className="flex items-center gap-2">
              <User size={16} className="text-blue-500" />
              <span className="font-medium text-gray-900">
                {exam.professor_name}
              </span>
            </div>
            <div className="w-px h-4 bg-gray-300 hidden sm:block" />
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-blue-500" />
              <span className="font-medium text-gray-900">{exam.date}</span>
            </div>
            <div className="w-px h-4 bg-gray-300 hidden sm:block" />
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-blue-500" />
              <span className="font-medium text-gray-900">
                {exam.start_time} — {exam.end_time}
              </span>
            </div>
          </div>
        </div>

        {!session ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center">
            <ShieldAlert size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No Monitoring Session Found
            </h3>
            <p className="text-gray-500 max-w-md mx-auto">
              It looks like a monitoring session was never started for this exam,
              or no data was recorded. Therefore, a report cannot be generated.
            </p>
          </div>
        ) : (
          <>
            {/* Quick Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <User size={24} />
                </div>
                <div className="text-3xl font-extrabold text-gray-900 mb-1">
                  {totalStudents}
                </div>
                <div className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Total Students
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
                <div className="w-12 h-12 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mb-3">
                  <AlertCircle size={24} />
                </div>
                <div className="text-3xl font-extrabold text-gray-900 mb-1">
                  {totalViolatingStudents}
                </div>
                <div className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Flagged Students
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
                <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-3">
                  <AlertTriangle size={24} />
                </div>
                <div className="text-3xl font-extrabold text-gray-900 mb-1">
                  {highSeverityAlerts}
                </div>
                <div className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Critical Violations
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col justify-center items-center text-center">
                <div className="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-3">
                  <CheckCircle2 size={24} />
                </div>
                <div className="text-3xl font-extrabold text-gray-900 mb-1">
                  {totalClear}
                </div>
                <div className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Clear Students
                </div>
              </div>
            </div>

            {/* Dashboard Layout with Sidebar */}
            <div className="flex flex-col lg:flex-row gap-8">
              
              {/* Sidebar Filters */}
              <div className="lg:w-1/4 flex-shrink-0">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm sticky top-28">
                  <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100">
                    <SlidersHorizontal size={20} className="text-gray-700" />
                    <h3 className="text-lg font-bold text-gray-900">Filters & Sort</h3>
                  </div>
                  
                  {/* Search */}
                  <div className="mb-6">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Search Student</label>
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        placeholder="Name or ID..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div className="mb-6">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Integrity Status</label>
                    <div className="space-y-1">
                      {['All', 'Cheated', 'Suspicious', 'Clear'].map(status => (
                        <label key={status} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors group">
                          <div className="flex items-center gap-3">
                            <input 
                              type="radio" 
                              name="status" 
                              value={status}
                              checked={statusFilter === status}
                              onChange={() => setStatusFilter(status)}
                              className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 transition-shadow"
                            />
                            <span className={`text-sm font-semibold ${statusFilter === status ? 'text-gray-900' : 'text-gray-600 group-hover:text-gray-900'}`}>{status}</span>
                          </div>
                          {status !== 'All' && (
                            <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                              {allStudentsData.filter(s => s.status.label === status).length}
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Sort */}
                  <div>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Sort By</label>
                    <select 
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value)}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow appearance-none cursor-pointer"
                    >
                      <option value="score_desc">Highest Score First</option>
                      <option value="score_asc">Lowest Score First</option>
                      <option value="name_asc">Name (A-Z)</option>
                    </select>
                  </div>
                  
                  {/* Export Report Button */}
                  <div className="mt-8 pt-6 border-t border-gray-100">
                    <button
                      onClick={handleExportExcel}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl font-bold shadow-md shadow-green-600/20 hover:bg-green-700 transition-all"
                    >
                      <Download size={18} />
                      Export to Excel
                    </button>
                    <p className="text-center text-[10px] text-gray-400 mt-3 font-medium">
                      Download current view as Excel/CSV spreadsheet
                    </p>
                  </div>
                </div>
              </div>

              {/* Main Content Area (Cards) */}
              <div className="lg:w-3/4">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Student Details
                  </h2>
                  <div className="text-sm font-semibold text-gray-500 bg-white px-4 py-1.5 rounded-full border border-gray-200 shadow-sm">
                    Showing {filteredStudents.length} of {allStudentsData.length} students
                  </div>
                </div>

                {filteredStudents.length === 0 ? (
                  <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center shadow-sm">
                    <Search size={48} className="text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-700 mb-2">No students found</h3>
                    <p className="text-gray-500 max-w-sm mx-auto">
                      No students match your current filters. Try adjusting your search or status filter.
                    </p>
                    <button 
                      onClick={() => { setSearchQuery(""); setStatusFilter("All"); }}
                      className="mt-6 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                      {filteredStudents.map((student) => {
                        const { displayName, student_code: displayCode, displaySeat, status, score, alerts: studentAlerts, high_severity, medium_severity, low_severity } = student;
                        const alertTypes = Array.from(new Set(studentAlerts.map(a => a.alert_type)));
                        
                        return (
                          <div
                            key={student.id}
                            className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col group"
                          >
                            {/* Top Bar Status Indicator */}
                            <div
                              className={`absolute top-0 left-0 w-full h-1.5 ${
                                score >= 20
                                  ? "bg-red-500"
                                  : score >= 8
                                  ? "bg-orange-500"
                                  : "bg-green-500"
                              }`}
                            />

                            <div className="flex justify-between items-start mb-4">
                              <div className="flex items-start gap-3">
                                {/* Avatar */}
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 border border-gray-200 flex items-center justify-center text-gray-600 font-bold text-sm flex-shrink-0 shadow-sm">
                                  {displaySeat || "?"}
                                </div>
                                <div className="min-w-0">
                                  <h3 className="font-bold text-base text-gray-900 leading-tight truncate" title={displayName}>
                                    {displayName}
                                  </h3>
                                  <div className="flex flex-col gap-1 mt-1">
                                    <span className="text-[11px] text-gray-500 flex items-center gap-1.5 truncate">
                                      <User size={10} className="text-blue-400 flex-shrink-0" />
                                      <span className="font-mono">{displayCode || "—"}</span>
                                    </span>
                                    <span className="text-[11px] text-gray-500 flex items-center gap-1.5 truncate">
                                      <MapPin size={10} className="text-blue-400 flex-shrink-0" />
                                      <span className="font-mono">Seat {displaySeat || "—"}</span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Status Badge */}
                            <div className="mb-4">
                              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider ${status.color}`}>
                                {status.icon}
                                {status.label}
                              </div>
                            </div>

                            {/* Severities Grid (Compact) */}
                            <div className="grid grid-cols-3 gap-2 mb-4">
                              <div className={`rounded-lg p-2 text-center border ${high_severity > 0 ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
                                <div className={`text-[9px] font-bold uppercase ${high_severity > 0 ? 'text-red-600' : 'text-gray-400'}`}>High</div>
                                <div className={`text-sm font-black mt-0.5 ${high_severity > 0 ? 'text-red-700' : 'text-gray-600'}`}>{high_severity}</div>
                              </div>
                              <div className={`rounded-lg p-2 text-center border ${medium_severity > 0 ? 'bg-orange-50 border-orange-100' : 'bg-gray-50 border-gray-100'}`}>
                                <div className={`text-[9px] font-bold uppercase ${medium_severity > 0 ? 'text-orange-600' : 'text-gray-400'}`}>Med</div>
                                <div className={`text-sm font-black mt-0.5 ${medium_severity > 0 ? 'text-orange-700' : 'text-gray-600'}`}>{medium_severity}</div>
                              </div>
                              <div className={`rounded-lg p-2 text-center border ${low_severity > 0 ? 'bg-yellow-50 border-yellow-100' : 'bg-gray-50 border-gray-100'}`}>
                                <div className={`text-[9px] font-bold uppercase ${low_severity > 0 ? 'text-yellow-600' : 'text-gray-400'}`}>Low</div>
                                <div className={`text-sm font-black mt-0.5 ${low_severity > 0 ? 'text-yellow-700' : 'text-gray-600'}`}>{low_severity}</div>
                              </div>
                            </div>

                            {/* Alert Types Breakdown */}
                            <div className="mb-4 flex-1">
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                                <span className="flex items-center gap-1"><ShieldAlert size={10} /> AI Alerts</span>
                                {studentAlerts.length > 0 && (
                                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[9px]">{studentAlerts.length} total</span>
                                )}
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {alertTypes.length > 0 ? (
                                  alertTypes.map(type => {
                                    const count = studentAlerts.filter(a => a.alert_type === type).length;
                                    const isCritical = studentAlerts.some(a => a.alert_type === type && a.severity === 'high');
                                    return (
                                      <div
                                        key={type}
                                        className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                                          isCritical
                                            ? 'bg-red-50 text-red-700 border-red-200'
                                            : 'bg-gray-50 text-gray-600 border-gray-200'
                                        }`}
                                      >
                                        {type.replace(/_/g, ' ').toUpperCase()}: {count}
                                      </div>
                                    );
                                  })
                                ) : (
                                  <span className="text-[10px] text-gray-400 italic bg-gray-50 px-2 py-1 rounded w-full border border-gray-100 border-dashed">No alerts recorded</span>
                                )}
                              </div>
                            </div>

                            {/* Footer / Score */}
                            <div className="bg-gray-50/50 rounded-xl p-3 flex items-center justify-between border border-gray-100 mt-auto">
                              <span className="text-xs font-bold text-gray-500">
                                Violation Score
                              </span>
                              <span
                                className={`font-black text-base ${
                                  score >= 20
                                    ? "text-red-600"
                                    : score >= 8
                                    ? "text-orange-600"
                                    : "text-green-600"
                                }`}
                              >
                                {score.toFixed(1)} <span className="text-[10px] text-gray-400 font-bold">/ 100</span>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
