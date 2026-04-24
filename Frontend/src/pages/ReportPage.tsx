import React, { useState, useEffect } from "react";
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
  ShieldAlert,
} from "lucide-react";
import {
  offlineExamApi,
  monitoringApi,
  type OfflineExam,
  type MonitoringSession,
  type ViolationLog,
} from "../services/api";

export default function ReportPage() {
  const [searchParams] = useSearchParams();
  const examId = Number(searchParams.get("examId"));
  const navigate = useNavigate();

  const [exam, setExam] = useState<OfflineExam | null>(null);
  const [session, setSession] = useState<MonitoringSession | null>(null);
  const [violations, setViolations] = useState<ViolationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        const examData = await offlineExamApi.getById(examId);
        setExam(examData);

        try {
          const sessionData = await monitoringApi.getSession(examId);
          setSession(sessionData);

          if (sessionData && sessionData.id) {
            const violationsData = await monitoringApi.getViolations(
              sessionData.id
            );
            setViolations(violationsData);
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

  // Summary Metrics
  const totalStudents = violations.length;
  const totalAlerts = violations.reduce((sum, v) => sum + v.total_alerts, 0);
  const highSeverityAlerts = violations.reduce(
    (sum, v) => sum + v.high_severity,
    0
  );

  const getStudentStatus = (score: number) => {
    if (score >= 60) {
      return {
        label: "Cheated",
        color: "bg-red-100 text-red-700 border-red-200",
        icon: <AlertTriangle size={16} className="text-red-500" />,
      };
    } else if (score >= 30) {
      return {
        label: "Suspicious",
        color: "bg-orange-100 text-orange-700 border-orange-200",
        icon: <AlertCircle size={16} className="text-orange-500" />,
      };
    } else {
      return {
        label: "Clear",
        color: "bg-green-100 text-green-700 border-green-200",
        icon: <CheckCircle2 size={16} className="text-green-500" />,
      };
    }
  };

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
                  {totalAlerts}
                </div>
                <div className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Total Violations
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
                  {Math.max(
                    0,
                    totalStudents -
                      violations.filter((v) => v.violation_score >= 30).length
                  )}
                </div>
                <div className="text-xs font-semibold tracking-wider text-gray-500 uppercase">
                  Clear Students
                </div>
              </div>
            </div>

            {/* Students List */}
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Student Integrity Breakdown
            </h2>

            {violations.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center">
                <CheckCircle2 size={40} className="text-green-400 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  All Clear
                </h3>
                <p className="text-gray-500">
                  No students or violations were recorded during this session.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {violations.map((student) => {
                  const status = getStudentStatus(student.violation_score);
                  return (
                    <div
                      key={student.id}
                      className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col"
                    >
                      {/* Top Bar Status Indicator */}
                      <div
                        className={`absolute top-0 left-0 w-full h-1 ${
                          student.violation_score >= 60
                            ? "bg-red-500"
                            : student.violation_score >= 30
                            ? "bg-orange-500"
                            : "bg-green-500"
                        }`}
                      />

                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <h3 className="font-bold text-lg text-gray-900 mb-1">
                            {student.student_name || "Unknown Student"}
                          </h3>
                          <p className="text-sm text-gray-500 flex items-center gap-1.5">
                            <span className="font-medium text-gray-700">
                              Zone ID:
                            </span>{" "}
                            {student.zone}
                          </p>
                        </div>
                        <div
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold uppercase tracking-wider ${status.color}`}
                        >
                          {status.icon}
                          {status.label}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 mb-6 flex-1">
                        <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100">
                          <div className="text-xs text-red-600 font-semibold mb-1 uppercase">
                            High
                          </div>
                          <div className="text-xl font-bold text-red-700">
                            {student.high_severity}
                          </div>
                        </div>
                        <div className="bg-orange-50 rounded-xl p-3 text-center border border-orange-100">
                          <div className="text-xs text-orange-600 font-semibold mb-1 uppercase">
                            Medium
                          </div>
                          <div className="text-xl font-bold text-orange-700">
                            {student.medium_severity}
                          </div>
                        </div>
                        <div className="bg-yellow-50 rounded-xl p-3 text-center border border-yellow-100">
                          <div className="text-xs text-yellow-600 font-semibold mb-1 uppercase">
                            Low
                          </div>
                          <div className="text-xl font-bold text-yellow-700">
                            {student.low_severity}
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between border border-gray-100">
                        <span className="text-sm font-semibold text-gray-600">
                          Violation Score
                        </span>
                        <span
                          className={`font-extrabold text-lg ${
                            student.violation_score >= 60
                              ? "text-red-600"
                              : student.violation_score >= 30
                              ? "text-orange-600"
                              : "text-green-600"
                          }`}
                        >
                          {student.violation_score.toFixed(1)} / 100
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
