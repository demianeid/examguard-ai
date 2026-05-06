import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft, CheckCircle, Clock, User, FileText,
  Save, AlertTriangle, Award, ChevronRight, Loader2
} from "lucide-react";
import Header from "../components/Header";

interface EssayAnswer {
  question_id: number;
  question_text: string;
  max_marks: number;
  essay_answer: string;
  marks_awarded: number;
  is_graded: boolean;
}

interface StudentEntry {
  student_id: number;
  student_name: string;
  student_code: string;
  profile_image: string | null;
  grading_status: "auto" | "pending" | "graded";
  answers: EssayAnswer[];
}

interface GradeData {
  exam_id: number;
  exam_title: string;
  students: StudentEntry[];
}

const EssayGrading: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");

  const [data, setData] = useState<GradeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);

  // Local marks state: { [studentId]: { [questionId]: number } }
  const [marks, setMarks] = useState<Record<number, Record<number, string>>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/exam/${examId}/grade-essays/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to load essay data");
      const json: GradeData = await res.json();
      setData(json);
      // Initialise local marks from server data
      const initMarks: Record<number, Record<number, string>> = {};
      json.students.forEach((s) => {
        initMarks[s.student_id] = {};
        s.answers.forEach((a) => {
          initMarks[s.student_id][a.question_id] = String(a.marks_awarded);
        });
      });
      setMarks(initMarks);
      if (json.students.length > 0 && selectedStudentId === null) {
        setSelectedStudentId(json.students[0].student_id);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [examId]);

  const handleSaveMark = async (studentId: number, questionId: number) => {
    const key = `${studentId}_${questionId}`;
    const marksValue = parseFloat(marks[studentId]?.[questionId] ?? "0");
    setSaving((p) => ({ ...p, [key]: true }));
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/exam/${examId}/grade-essays/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          student_id: studentId,
          question_id: questionId,
          marks_awarded: marksValue,
        }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const result = await res.json();
      setSaved((p) => ({ ...p, [key]: true }));
      setTimeout(() => setSaved((p) => ({ ...p, [key]: false })), 2000);
      // Update local data grading_status
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          students: prev.students.map((s) =>
            s.student_id === studentId
              ? { ...s, grading_status: result.grading_status }
              : s
          ),
        };
      });
    } catch {
      alert("Failed to save grade. Please try again.");
    } finally {
      setSaving((p) => ({ ...p, [key]: false }));
    }
  };

  const selectedStudent = data?.students.find((s) => s.student_id === selectedStudentId);
  const pendingCount = data?.students.filter((s) => s.grading_status === "pending").length ?? 0;
  const gradedCount = data?.students.filter((s) => s.grading_status === "graded").length ?? 0;

  if (loading) return (
    <div className="min-h-screen bg-[#E8F1FA] flex items-center justify-center">
      <Header showAccount={true} isRegistered={true} />
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading essay submissions...</p>
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen bg-[#E8F1FA] flex items-center justify-center">
      <Header showAccount={true} isRegistered={true} />
      <div className="bg-white rounded-2xl shadow p-8 max-w-md text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <p className="text-gray-700 mb-4">{error || "Unknown error"}</p>
        <button onClick={() => navigate(-1)} className="bg-blue-600 text-white px-6 py-2 rounded-lg">Go Back</button>
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-[#E8F1FA]">
      <Header showAccount={true} isRegistered={true} />

      <div className="pt-24 pb-12 px-4">
        <div className="max-w-7xl mx-auto">

          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6"
          >
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6">
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition-colors text-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Results
              </button>
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <h1 className="text-2xl font-bold">{data.exam_title}</h1>
                  <p className="text-blue-200 mt-1 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Essay Grading Panel
                  </p>
                </div>
                <div className="flex gap-4">
                  <div className="bg-white/10 rounded-xl px-4 py-3 text-center">
                    <p className="text-2xl font-bold">{pendingCount}</p>
                    <p className="text-xs text-blue-200">Pending</p>
                  </div>
                  <div className="bg-white/10 rounded-xl px-4 py-3 text-center">
                    <p className="text-2xl font-bold text-green-300">{gradedCount}</p>
                    <p className="text-xs text-blue-200">Graded</p>
                  </div>
                  <div className="bg-white/10 rounded-xl px-4 py-3 text-center">
                    <p className="text-2xl font-bold">{data.students.length}</p>
                    <p className="text-xs text-blue-200">Total</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

            {/* Sidebar — Student List */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-4 sticky top-24">
                <h2 className="font-bold text-gray-800 mb-4 text-sm uppercase tracking-wide">Students</h2>
                <div className="space-y-2">
                  {data.students.map((s) => (
                    <button
                      key={s.student_id}
                      onClick={() => setSelectedStudentId(s.student_id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                        selectedStudentId === s.student_id
                          ? "bg-blue-50 border-2 border-blue-500"
                          : "border-2 border-transparent hover:bg-gray-50"
                      }`}
                    >
                      {s.profile_image ? (
                        <img src={s.profile_image} alt={s.student_name} className="w-9 h-9 rounded-full object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                          {s.student_name.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate">{s.student_name}</p>
                        <p className="text-xs text-gray-500">{s.student_code}</p>
                      </div>
                      {s.grading_status === "graded" ? (
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Main — Essay Grading Panel */}
            <div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                {selectedStudent ? (
                  <motion.div
                    key={selectedStudent.student_id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    {/* Student Info */}
                    <div className="bg-white rounded-2xl shadow-lg p-5 flex items-center gap-4">
                      {selectedStudent.profile_image ? (
                        <img src={selectedStudent.profile_image} alt={selectedStudent.student_name} className="w-14 h-14 rounded-full object-cover border-2 border-blue-100" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-xl">
                          {selectedStudent.student_name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">{selectedStudent.student_name}</h2>
                        <p className="text-gray-500 text-sm">{selectedStudent.student_code}</p>
                      </div>
                      <div className="ml-auto">
                        {selectedStudent.grading_status === "graded" ? (
                          <span className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full font-semibold text-sm">
                            <CheckCircle className="w-4 h-4" /> Fully Graded
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full font-semibold text-sm">
                            <Clock className="w-4 h-4" /> Pending
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Essay Questions */}
                    {selectedStudent.answers.map((answer, qi) => {
                      const key = `${selectedStudent.student_id}_${answer.question_id}`;
                      const isSaving = saving[key];
                      const isSaved = saved[key];
                      const currentMark = marks[selectedStudent.student_id]?.[answer.question_id] ?? "0";

                      return (
                        <motion.div
                          key={answer.question_id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: qi * 0.1 }}
                          className="bg-white rounded-2xl shadow-lg overflow-hidden"
                        >
                          <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                  {qi + 1}
                                </div>
                                <span className="font-semibold text-blue-900">Essay Question</span>
                              </div>
                              <span className="text-sm text-blue-700 font-medium">Max: {answer.max_marks} marks</span>
                            </div>
                          </div>

                          <div className="p-6 space-y-5">
                            {/* Question Text */}
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Question</p>
                              <p className="text-gray-900 font-medium text-lg leading-relaxed">{answer.question_text}</p>
                            </div>

                            {/* Student's Answer */}
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Student's Answer</p>
                              {answer.essay_answer ? (
                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-gray-800 leading-relaxed whitespace-pre-wrap min-h-[100px]">
                                  {answer.essay_answer}
                                </div>
                              ) : (
                                <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-6 text-center text-gray-400">
                                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                  <p className="text-sm">Student did not submit an answer for this question.</p>
                                </div>
                              )}
                            </div>

                            {/* Marks Input */}
                            <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                              <Award className="w-5 h-5 text-blue-600 flex-shrink-0" />
                              <label className="font-semibold text-gray-700 text-sm">Marks Awarded:</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  min="0"
                                  max={answer.max_marks}
                                  step="0.5"
                                  value={currentMark}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setMarks((prev) => ({
                                      ...prev,
                                      [selectedStudent.student_id]: {
                                        ...prev[selectedStudent.student_id],
                                        [answer.question_id]: val,
                                      },
                                    }));
                                  }}
                                  className="w-20 text-center border-2 border-gray-200 rounded-lg p-2 font-bold text-gray-900 focus:border-blue-500 focus:outline-none text-lg"
                                />
                                <span className="text-gray-500 font-medium">/ {answer.max_marks}</span>
                              </div>
                              <div className="ml-auto">
                                <button
                                  onClick={() => handleSaveMark(selectedStudent.student_id, answer.question_id)}
                                  disabled={isSaving}
                                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                                    isSaved
                                      ? "bg-green-500 text-white"
                                      : "bg-blue-600 hover:bg-blue-700 text-white"
                                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                                >
                                  {isSaving ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                                  ) : isSaved ? (
                                    <><CheckCircle className="w-4 h-4" /> Saved!</>
                                  ) : (
                                    <><Save className="w-4 h-4" /> Save Grade</>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}

                    {/* Navigate to next student */}
                    {(() => {
                      const idx = data.students.findIndex((s) => s.student_id === selectedStudentId);
                      const next = data.students[idx + 1];
                      return next ? (
                        <button
                          onClick={() => setSelectedStudentId(next.student_id)}
                          className="w-full bg-white rounded-2xl shadow-lg p-4 flex items-center justify-between text-gray-700 hover:bg-gray-50 transition-colors border-2 border-transparent hover:border-blue-200"
                        >
                          <span className="font-medium">Next Student: {next.student_name}</span>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </button>
                      ) : (
                        <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                          <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
                          <h3 className="font-bold text-gray-900 text-lg">All students reviewed!</h3>
                          <p className="text-gray-500 text-sm mt-1">Make sure you've saved grades for all essay questions.</p>
                          <button onClick={() => navigate(-1)} className="mt-4 bg-green-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-green-700 transition-colors">
                            Return to Results
                          </button>
                        </div>
                      );
                    })()}
                  </motion.div>
                ) : (
                  <div className="bg-white rounded-2xl shadow-lg p-12 text-center text-gray-400">
                    <User className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>Select a student from the sidebar to begin grading.</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EssayGrading;
