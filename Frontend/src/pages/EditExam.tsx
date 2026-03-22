import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  X, Clock, Trash2, Shield, Eye, Users, Mic, Lock,
  Video, AlertCircle, Wifi, CheckCircle, Edit, Save,
  UserPlus, UserMinus, Search,
} from "lucide-react";

// ============================================================
// TYPES
// ============================================================
interface ExamFormData {
  examTitle: string;
  selectedClass: string;
  description: string;
  duration: string;
  totalMarks: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  instructions: string;
  studentSelectionType: "all" | "specific";
}

interface Choice {
  id?: number;
  choice_text: string;
  is_correct: boolean;
}

interface Question {
  id: string;
  type: string;
  text: string;
  options: string[];
  marks: string;
  correctAnswer?: number;
  choices?: Choice[];
}

interface SecurityFeature {
  id: string;
  name: string;
  description: string;
  recommended: boolean;
  enabled: boolean;
  icon: ReactNode;
}

interface Step {
  number: number;
  label: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  class?: string;
  rollNumber?: string;
}

// ============================================================
// CONSTANTS
// ============================================================
const BASE_URL = "https://examguard-ai-production.up.railway.app/api/exam";

const typeToBackend: Record<string, string> = {
  "multiple-choice": "multiple_choice",
  "true-false":      "true_false",
  "short-answer":    "essay",
  "essay":           "essay",
};

const typeToFrontend: Record<string, string> = {
  "multiple_choice": "multiple-choice",
  "true_false":      "true-false",
  "essay":           "essay",
};

const defaultSecuritySettings: SecurityFeature[] = [
  { id: "1",  name: "AI Proctoring",          description: "Automated behavior analysis and anomaly detection",   recommended: true,  enabled: true,  icon: <Shield      className="w-5 h-5 text-blue-500" /> },
  { id: "2",  name: "Live Proctoring",         description: "Real-time human monitoring during the exam",           recommended: false, enabled: false, icon: <Eye         className="w-5 h-5 text-gray-400" /> },
  { id: "3",  name: "Eye Tracking",            description: "Monitor eye movements and focus patterns",             recommended: true,  enabled: true,  icon: <Eye         className="w-5 h-5 text-blue-500" /> },
  { id: "4",  name: "Multiple Face Detection", description: "Alert if multiple people are detected",                recommended: true,  enabled: true,  icon: <Users       className="w-5 h-5 text-blue-500" /> },
  { id: "5",  name: "Speaker Recognition",     description: "Detect unauthorized voices or conversations",          recommended: false, enabled: false, icon: <Mic         className="w-5 h-5 text-gray-400" /> },
  { id: "6",  name: "Lockdown Browser",        description: "Restrict access to other applications",               recommended: true,  enabled: true,  icon: <Lock        className="w-5 h-5 text-blue-500" /> },
  { id: "7",  name: "Record & Review",         description: "Record entire session for later review",              recommended: false, enabled: false, icon: <Video       className="w-5 h-5 text-gray-400" /> },
  { id: "8",  name: "Object Detection",        description: "Detect phones, notes, or unauthorized materials",     recommended: true,  enabled: true,  icon: <AlertCircle className="w-5 h-5 text-blue-500" /> },
  { id: "9",  name: "Real-Time Alerts",        description: "Instant notifications for suspicious activity",       recommended: true,  enabled: true,  icon: <AlertCircle className="w-5 h-5 text-blue-500" /> },
  { id: "10", name: "Offline Exam Mode",       description: "Allow exams without internet connection",             recommended: false, enabled: false, icon: <Wifi        className="w-5 h-5 text-gray-400" /> },
];

// ============================================================
// HELPERS
// ============================================================
function parseDatetime(dt: string): { date: string; time: string } {
  if (!dt) return { date: "", time: "" };
  const d = new Date(dt);
  if (isNaN(d.getTime())) return { date: "", time: "" };
  const yyyy = d.getFullYear();
  const MM   = String(d.getMonth() + 1).padStart(2, "0");
  const dd   = String(d.getDate()).padStart(2, "0");
  const hh   = String(d.getHours()).padStart(2, "0");
  const mm   = String(d.getMinutes()).padStart(2, "0");
  return { date: `${yyyy}-${MM}-${dd}`, time: `${hh}:${mm}` };
}

function combineDatetime(date: string, time: string): string {
  return new Date(`${date}T${time}:00`).toISOString();
}

function mapQuestionFromBackend(q: any): Question {
  const frontendType = typeToFrontend[q.question_type] ?? "essay";
  const choices: Choice[] = q.choices ?? [];
  let options: string[] = [];
  let correctAnswer: number | undefined;

  if (frontendType === "multiple-choice" || frontendType === "true-false") {
    options = choices.map((c: Choice) => c.choice_text);
    correctAnswer = choices.findIndex((c: Choice) => c.is_correct);
    if (correctAnswer === -1) correctAnswer = undefined;
  }

  return { id: String(q.id), type: frontendType, text: q.question_text, options, marks: String(q.marks), correctAnswer, choices };
}

function mapQuestionToBackend(q: Question) {
  const backendType = typeToBackend[q.type] ?? "essay";
  let choices: { choice_text: string; is_correct: boolean }[] = [];

  if (q.type === "multiple-choice") {
    choices = q.options.filter((o) => o.trim()).map((o, idx) => ({ choice_text: o, is_correct: idx === q.correctAnswer }));
  } else if (q.type === "true-false") {
    choices = [
      { choice_text: "True",  is_correct: q.correctAnswer === 0 },
      { choice_text: "False", is_correct: q.correctAnswer === 1 },
    ];
  }

  return { question_text: q.text, question_type: backendType, marks: parseInt(q.marks) || 1, choices };
}

// ============================================================
// COMPONENT
// ============================================================
export default function EditExam() {
  const { examId: examIdParam } = useParams<{ examId: string }>();
  const examId = Number(examIdParam);
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token") || "";

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ExamFormData>({
    examTitle: "", selectedClass: "", description: "", duration: "",
    totalMarks: "", startDate: "", startTime: "", endDate: "", endTime: "",
    instructions: "", studentSelectionType: "all",
  });
  const [questions, setQuestions]               = useState<Question[]>([]);
  const [securitySettings, setSecuritySettings] = useState<SecurityFeature[]>(defaultSecuritySettings);
  const [errors, setErrors]                     = useState<Partial<Record<keyof ExamFormData | "students", string>>>({});
  const [isLoading, setIsLoading]               = useState(false);
  const [isFetching, setIsFetching]             = useState(true);
  const [fetchError, setFetchError]             = useState("");
  const [hasChanges, setHasChanges]             = useState(false);
  const [originalData, setOriginalData]         = useState({ formData: {} as ExamFormData, questions: [] as Question[] });

  // Student selection state
  const [selectedStudents, setSelectedStudents]   = useState<Student[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [classFilter, setClassFilter]             = useState("all");
  const [studentsLoading, setStudentsLoading]     = useState(false);

  const steps: Step[] = [
    { number: 1, label: "Basic Info" },
    { number: 2, label: "Questions" },
    { number: 3, label: "Students" },
    { number: 4, label: "Security Settings" },
    { number: 5, label: "Review" },
  ];

  const questionTypes = [
    { value: "multiple-choice", label: "Multiple Choice" },
    { value: "true-false",      label: "True/False" },
    { value: "short-answer",    label: "Short Answer" },
    { value: "essay",           label: "Essay" },
  ];

  const uniqueClasses = Array.from(new Set(availableStudents.map((s) => s.class))).filter((c): c is string => c !== undefined);

  // ── Fetch exam data + students together ──
  useEffect(() => {
    const fetchExam = async () => {
      setIsFetching(true);
      setFetchError("");
      try {
        const res = await fetch(`${BASE_URL}/${examId}/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`Failed to fetch exam (${res.status})`);
        const data = await res.json();
        console.log("API Response:", data);
        console.log("class_id:", data.class_id);
        console.log("assigned_students:", data.assigned_students);

        const start = parseDatetime(data.start_datetime);
        const end   = parseDatetime(data.end_datetime);
        const qs: Question[] = (data.questions ?? []).map(mapQuestionFromBackend);

        const assignedStudents: Student[] = (data.assigned_students ?? []).map((s: any) => ({
          id: s.custom_id || String(s.id),
          name: s.full_name || "",
          email: s.email || "",
          class: "",
          rollNumber: s.custom_id || "",
        }));

        const selectionType = assignedStudents.length > 0 ? "specific" : "all";

        const fd: ExamFormData = {
          examTitle:            data.title        ?? "",
          selectedClass:        String(data.class_id?.id ?? data.class_id ?? ""),
          description:          data.description  ?? "",
          duration:             String(data.duration),
          totalMarks:           String(data.total_marks),
          startDate:            start.date,
          startTime:            start.time,
          endDate:              end.date,
          endTime:              end.time,
          instructions:         data.instructions ?? "",
          studentSelectionType: selectionType,
        };

        setFormData(fd);
        setQuestions(qs);
        setSelectedStudents(assignedStudents);
        setOriginalData({ formData: fd, questions: qs });

        // ── جيب الطلاب هنا مباشرة بعد ما assignedStudents اتحدد ──
        const classId = String(data.class_id?.id ?? data.class_id ?? "");
        if (classId) {
          setStudentsLoading(true);
          try {
            const studRes = await fetch(
              `https://examguard-ai-production.up.railway.app/api/instructors/classes/${classId}/students/`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const studData = await studRes.json();
            const allStudents: Student[] = studData.map((s: any) => ({
              id: s.custom_id || s.student_custom_id || s.student_id || String(s.id),
              name: s.full_name,
              email: "",
              class: "",
              rollNumber: s.student_custom_id || s.student_id,
            }));
            // assignedStudents متاحة هنا مباشرة بدون race condition
            setAvailableStudents(
              allStudents.filter(
                (s) => !assignedStudents.some((sel) => sel.id === s.id)
              )
            );
          } catch {
            setAvailableStudents([]);
          } finally {
            setStudentsLoading(false);
          }
        }

      } catch (err: any) {
        setFetchError(err.message ?? "Unknown error");
      } finally {
        setIsFetching(false);
      }
    };
    fetchExam();
  }, [examId, token]);

  // ── Track changes ──
  useEffect(() => {
    const changed =
      JSON.stringify(formData)  !== JSON.stringify(originalData.formData) ||
      JSON.stringify(questions) !== JSON.stringify(originalData.questions);
    setHasChanges(changed);
  }, [formData, questions]);

  // ── Input handlers ──
  const handleInputChange = (field: keyof ExamFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleAddQuestion = () => {
    setQuestions([...questions, {
      id: Date.now().toString(), type: "multiple-choice",
      text: "", options: ["", "", "", ""], marks: "1", correctAnswer: undefined,
    }]);
  };

  const handleDeleteQuestion = (id: string) => {
    if (questions.length <= 1) { alert("Exam must have at least one question"); return; }
    setQuestions(questions.filter((q) => q.id !== id));
  };

  const handleQuestionChange = (id: string, field: "type" | "text" | "marks", value: string) => {
    setQuestions(questions.map((q) => {
      if (q.id !== id) return q;
      if (field !== "type") return { ...q, [field]: value };
      const base = { ...q, type: value, correctAnswer: undefined };
      if (value === "multiple-choice") return { ...base, options: ["", "", "", ""] };
      if (value === "true-false")      return { ...base, options: ["True", "False"] };
      return { ...base, options: [] };
    }));
  };

  const handleOptionChange = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(questions.map((q) =>
      q.id === questionId ? { ...q, options: q.options.map((opt, idx) => idx === optionIndex ? value : opt) } : q
    ));
  };

  const handleCorrectAnswerChange = (questionId: string, optionIndex: number) => {
    setQuestions(questions.map((q) => q.id === questionId ? { ...q, correctAnswer: optionIndex } : q));
  };

  const handleToggleSecurityFeature = (id: string) => {
    setSecuritySettings((prev) => prev.map((f) => f.id === id ? { ...f, enabled: !f.enabled } : f));
  };

  // ── Student handlers ──
  const getFilteredAvailableStudents = () =>
    availableStudents.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
        student.id.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(studentSearchTerm.toLowerCase());
      const matchesClass = classFilter === "all" || student.class === classFilter;
      return matchesSearch && matchesClass && !selectedStudents.some((s) => s.id === student.id);
    });

  const handleAddStudent = (student: Student) => {
    setSelectedStudents([...selectedStudents, student]);
    setAvailableStudents(availableStudents.filter((s) => s.id !== student.id));
  };

  const handleRemoveStudent = (student: Student) => {
    setSelectedStudents(selectedStudents.filter((s) => s.id !== student.id));
    setAvailableStudents([...availableStudents, student].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const handleAddAllStudents = () => {
    setSelectedStudents([...selectedStudents, ...availableStudents]);
    setAvailableStudents([]);
  };

  const handleRemoveAllStudents = () => {
    setAvailableStudents([...availableStudents, ...selectedStudents].sort((a, b) => a.name.localeCompare(b.name)));
    setSelectedStudents([]);
  };

  const handleAddByClass = (className: string) => {
    const studentsInClass = availableStudents.filter((s) => s.class === className);
    setSelectedStudents([...selectedStudents, ...studentsInClass]);
    setAvailableStudents(availableStudents.filter((s) => s.class !== className));
  };

  // ── Helpers ──
  const getActiveFeatures = () => securitySettings.filter((f) => f.enabled).map((f) => f.name);
  const getTotalMarks     = () => questions.reduce((sum, q) => sum + (parseInt(q.marks) || 0), 0);

  // ── Validation ──
  const validateStep1 = (): boolean => {
    const newErrors: Partial<Record<keyof ExamFormData, string>> = {};
    if (!formData.examTitle.trim())                         newErrors.examTitle  = "Exam title is required";
    if (!formData.duration || +formData.duration <= 0)      newErrors.duration   = "Duration must be > 0";
    if (!formData.totalMarks || +formData.totalMarks <= 0)  newErrors.totalMarks = "Total marks must be > 0";
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.startTime) newErrors.startTime = "Start time is required";
    if (!formData.endDate)   newErrors.endDate   = "End date is required";
    if (!formData.endTime)   newErrors.endTime   = "End time is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    if (!questions.length) { alert("Please add at least one question"); return false; }
    for (const q of questions) {
      if (!q.text.trim()) { alert("Please fill in all question texts"); return false; }
      if (q.type === "multiple-choice") {
        if (q.options.filter((o) => o.trim()).length < 2) { alert("MCQ needs at least 2 options"); return false; }
        if (q.correctAnswer === undefined) { alert(`Select correct answer for: "${q.text.substring(0, 50)}"`); return false; }
      }
      if (q.type === "true-false" && q.correctAnswer === undefined) {
        alert(`Select correct answer for: "${q.text.substring(0, 50)}"`); return false;
      }
    }
    return true;
  };

  const validateStep3 = (): boolean => {
    if (formData.studentSelectionType === "specific" && selectedStudents.length === 0) {
      setErrors((prev) => ({ ...prev, students: "Please select at least one student" }));
      return false;
    }
    return true;
  };

  // ── Save (PUT) ──
  const handleSaveChanges = async () => {
    setIsLoading(true);
    try {
      const payload = {
        title:          formData.examTitle,
        description:    formData.description,
        duration:       parseInt(formData.duration),
        total_marks:    parseInt(formData.totalMarks),
        start_datetime: combineDatetime(formData.startDate, formData.startTime),
        end_datetime:   combineDatetime(formData.endDate,   formData.endTime),
        instructions:   formData.instructions,
        questions:      questions.map(mapQuestionToBackend),
       assigned_student_ids:
     formData.studentSelectionType === "all" ? null : selectedStudents.map((s) => s.id),
      };

      const res = await fetch(`${BASE_URL}/${examId}/`, {
        method:  "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body:    JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(JSON.stringify(errData) || `Server error ${res.status}`);
      }

      setHasChanges(false);
      setOriginalData({ formData, questions });
      navigate(-1);
    } catch (err: any) {
      alert(`Failed to save: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;
    if (currentStep === 5) { handleSaveChanges(); return; }
    setCurrentStep(currentStep + 1);
  };

  const handlePrevious    = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };
  const handleResetChanges = () => {
    if (window.confirm("Reset all changes?")) {
      setFormData(originalData.formData);
      setQuestions(originalData.questions);
      setErrors({});
      setHasChanges(false);
    }
  };
  const handleClose = () => {
    if (hasChanges && !window.confirm("You have unsaved changes. Close anyway?")) return;
    navigate(-1);
  };

  // ── Loading / Error ──
  if (isFetching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading exam data...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <AlertCircle className="w-12 h-12 mx-auto mb-3" />
          <p className="font-semibold">Failed to load exam</p>
          <p className="text-sm mt-1">{fetchError}</p>
          <button onClick={handleClose} className="mt-4 px-4 py-2 bg-gray-200 rounded-md text-gray-700 hover:bg-gray-300">Go Back</button>
        </div>
      </div>
    );
  }

  // ── UI ──
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full p-8">

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Edit className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Edit Exam</h1>
            </div>
            <p className="text-sm text-gray-600 mt-1">Edit and update your exam configuration</p>
            {hasChanges && (
              <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded-full">
                <AlertCircle className="w-3 h-3" /> You have unsaved changes
              </div>
            )}
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-2xl font-light" aria-label="Close">×</button>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center mb-8 gap-2 overflow-x-auto pb-2">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center gap-2 flex-shrink-0">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                  step.number <= currentStep ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"
                }`}>
                  {step.number < currentStep ? "✓" : step.number}
                </div>
                <span className="text-xs text-gray-600 mt-2 text-center max-w-20 whitespace-nowrap">{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 sm:w-14 h-1 transition-colors ${step.number < currentStep ? "bg-blue-500" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* ── STEP 1: Basic Info ── */}
        {currentStep === 1 && (
          <div className="space-y-5">
            <div>
              <label htmlFor="examTitle" className="block text-sm font-medium text-gray-700 mb-2">
                Exam Title <span className="text-red-500">*</span>
              </label>
              <input
                id="examTitle" type="text"
                placeholder="e.g., Midterm Exam - Data Structure"
                value={formData.examTitle}
                onChange={(e) => handleInputChange("examTitle", e.target.value)}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${errors.examTitle ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`}
              />
              {errors.examTitle && <p className="mt-1 text-sm text-red-600">{errors.examTitle}</p>}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                id="description" rows={4}
                placeholder="Brief description of the exam content..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (Minutes) <span className="text-red-500">*</span>
                </label>
                <input
                  id="duration" type="number" min="1"
                  value={formData.duration}
                  onChange={(e) => handleInputChange("duration", e.target.value)}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${errors.duration ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`}
                />
                {errors.duration && <p className="mt-1 text-sm text-red-600">{errors.duration}</p>}
              </div>
              <div>
                <label htmlFor="totalMarks" className="block text-sm font-medium text-gray-700 mb-2">
                  Total Marks <span className="text-red-500">*</span>
                </label>
                <input
                  id="totalMarks" type="number" min="1"
                  value={formData.totalMarks}
                  onChange={(e) => handleInputChange("totalMarks", e.target.value)}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${errors.totalMarks ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`}
                />
                {errors.totalMarks && <p className="mt-1 text-sm text-red-600">{errors.totalMarks}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input id="startDate" type="date" value={formData.startDate}
                  onChange={(e) => handleInputChange("startDate", e.target.value)}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${errors.startDate ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`}
                />
                {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>}
              </div>
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <input id="startTime" type="time" value={formData.startTime}
                  onChange={(e) => handleInputChange("startTime", e.target.value)}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${errors.startTime ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`}
                />
                {errors.startTime && <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input id="endDate" type="date" value={formData.endDate}
                  onChange={(e) => handleInputChange("endDate", e.target.value)}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${errors.endDate ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`}
                />
                {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
              </div>
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                  End Time <span className="text-red-500">*</span>
                </label>
                <input id="endTime" type="time" value={formData.endTime}
                  onChange={(e) => handleInputChange("endTime", e.target.value)}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${errors.endTime ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`}
                />
                {errors.endTime && <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-2">Instructions for Students</label>
              <textarea
                id="instructions" rows={3}
                placeholder="Enter exam instructions, rules, and guidelines..."
                value={formData.instructions}
                onChange={(e) => handleInputChange("instructions", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>
        )}

        {/* ── STEP 2: Questions ── */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Exam Questions</h2>
              <button onClick={handleAddQuestion} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium flex items-center gap-2">
                <span>+</span> Add Question
              </button>
            </div>

            {questions.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex justify-between">
                <span className="font-medium text-gray-900">Total Questions: {questions.length}</span>
                <span className="font-medium text-gray-900">Total Marks: {getTotalMarks()}</span>
              </div>
            )}

            {questions.length === 0 ? (
              <div className="text-center py-12 border border-gray-200 rounded-md bg-gray-50">
                <p className="text-gray-600 mb-4">No questions added yet</p>
                <button onClick={handleAddQuestion} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium">
                  + Add Your First Question
                </button>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {questions.map((question, index) => (
                  <div key={question.id} className="border border-gray-300 rounded-md p-4">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 flex gap-3 items-center">
                        <select
                          title="Select question type"
                          value={question.type}
                          onChange={(e) => handleQuestionChange(question.id, "type", e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          {questionTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <div className="flex items-center gap-1">
                          <label className="text-sm text-gray-500">Marks:</label>
                          <input
                            title="Enter question marks"
                            type="number" min="1" value={question.marks}
                            onChange={(e) => handleQuestionChange(question.id, "marks", e.target.value)}
                            className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <button
                        title="Delete question"
                        onClick={() => handleDeleteQuestion(question.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <textarea
                      value={question.text}
                      onChange={(e) => handleQuestionChange(question.id, "text", e.target.value)}
                      placeholder="Enter your question here..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-4"
                      rows={3}
                    />

                    {question.type === "multiple-choice" && (
                      <div className="space-y-2 ml-8">
                        {question.options.map((option, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-3">
                            <input
                              title="Select correct answer"
                              type="radio" name={`question-${question.id}`}
                              checked={question.correctAnswer === optIdx}
                              onChange={() => handleCorrectAnswerChange(question.id, optIdx)}
                              className="w-4 h-4 cursor-pointer"
                            />
                            <input
                              type="text" value={option}
                              onChange={(e) => handleOptionChange(question.id, optIdx, e.target.value)}
                              placeholder={`Option ${optIdx + 1}`}
                              className="flex-1 px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {question.type === "true-false" && (
                      <div className="space-y-2 ml-8">
                        {["True", "False"].map((label, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <input
                              type="radio" id={`${label}-${question.id}`} name={`tf-${question.id}`}
                              checked={question.correctAnswer === idx}
                              onChange={() => handleCorrectAnswerChange(question.id, idx)}
                              className="w-4 h-4 cursor-pointer"
                            />
                            <label htmlFor={`${label}-${question.id}`} className="text-sm text-gray-600">{label}</label>
                          </div>
                        ))}
                      </div>
                    )}

                    {(question.type === "short-answer" || question.type === "essay") && (
                      <div className="ml-8 p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600">
                        Student will provide their own answer
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── STEP 3: Students ── */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6">
              <h2 className="text-xl font-bold mb-2">Select Students</h2>
              <p className="text-sm text-blue-100">Choose who can take this exam</p>
            </div>

            {studentsLoading && (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mr-2" />
                <span className="text-sm text-gray-600">Loading students...</span>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio" name="studentSelection"
                    checked={formData.studentSelectionType === "all"}
                    onChange={() => {
                      setFormData({ ...formData, studentSelectionType: "all" });
                      setErrors((prev) => ({ ...prev, students: undefined }));
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">All Students ({availableStudents.length + selectedStudents.length})</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio" name="studentSelection"
                    checked={formData.studentSelectionType === "specific"}
                    onChange={() => {
                      setFormData({ ...formData, studentSelectionType: "specific" });
                      setErrors((prev) => ({ ...prev, students: undefined }));
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Specific Students</span>
                </label>
              </div>

              {formData.studentSelectionType === "specific" && (
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-900">Selected Students: {selectedStudents.length}</h3>
                    <div className="flex gap-2">
                      <button onClick={handleAddAllStudents} disabled={availableStudents.length === 0}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                        Add All
                      </button>
                      <button onClick={handleRemoveAllStudents} disabled={selectedStudents.length === 0}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50">
                        Remove All
                      </button>
                    </div>
                  </div>

                  {errors.students && <p className="text-sm text-red-600 mb-4">{errors.students}</p>}

                  <div className="grid grid-cols-2 gap-4">
                    {/* Available Students */}
                    <div className="border rounded-lg p-3">
                      <h4 className="font-medium text-gray-700 mb-3">Available Students</h4>
                      <div className="space-y-2 mb-3">
                        <div className="relative">
                          <Search className="absolute left-2 top-2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search by name, ID, or email..."
                            value={studentSearchTerm}
                            onChange={(e) => setStudentSearchTerm(e.target.value)}
                            className="w-full pl-8 pr-4 py-2 border rounded-md text-sm"
                          />
                        </div>
                        <select
                          title="Filter by class"
                          value={classFilter}
                          onChange={(e) => setClassFilter(e.target.value)}
                          className="w-full px-3 py-2 border rounded-md text-sm"
                        >
                          <option value="all">All Classes</option>
                          {uniqueClasses.map((cls) => <option key={cls} value={cls}>{cls}</option>)}
                        </select>
                        <div className="flex flex-wrap gap-2">
                          {uniqueClasses.map((cls) => {
                            const count = availableStudents.filter((s) => s.class === cls).length;
                            return count > 0 && (
                              <button key={cls} onClick={() => handleAddByClass(cls)}
                                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200">
                                Add {cls} ({count})
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {getFilteredAvailableStudents().length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">No students available</p>
                        ) : (
                          getFilteredAvailableStudents().map((student) => (
                            <div key={student.id} className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100">
                              <div>
                                <p className="text-sm font-medium">{student.name}</p>
                                <p className="text-xs text-gray-500">{student.id} · {student.class} · {student.rollNumber}</p>
                              </div>
                              <button onClick={() => handleAddStudent(student)} className="text-blue-600 hover:text-blue-800" title="Add student">
                                <UserPlus size={18} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Selected Students */}
                    <div className="border rounded-lg p-3">
                      <h4 className="font-medium text-gray-700 mb-3">Selected Students</h4>
                      <div className="space-y-2 max-h-80 overflow-y-auto">
                        {selectedStudents.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">No students selected</p>
                        ) : (
                          selectedStudents.map((student) => (
                            <div key={student.id} className="flex items-center justify-between p-2 bg-blue-50 rounded hover:bg-blue-100">
                              <div>
                                <p className="text-sm font-medium">{student.name}</p>
                                <p className="text-xs text-gray-500">{student.id} · {student.class} · {student.rollNumber}</p>
                              </div>
                              <button onClick={() => handleRemoveStudent(student)} className="text-red-600 hover:text-red-800" title="Remove student">
                                <UserMinus size={18} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {formData.studentSelectionType === "all" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-gray-700">
                    This exam will be available to all {availableStudents.length + selectedStudents.length} students.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 4: Security ── */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 flex items-start gap-4">
              <Shield className="w-8 h-8 flex-shrink-0 mt-1" />
              <div>
                <h2 className="text-xl font-bold">Anti-Cheating Configuration</h2>
                <p className="text-sm text-blue-100 mt-1">Update proctoring features based on your exam requirements</p>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {securitySettings.map((feature) => (
                <div key={feature.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex-shrink-0 mt-1">{feature.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{feature.name}</h3>
                        {feature.recommended && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">Recommended</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleSecurityFeature(feature.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ml-4 ${feature.enabled ? "bg-blue-500" : "bg-gray-300"}`}
                    aria-label={`${feature.enabled ? "Disable" : "Enable"} ${feature.name}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${feature.enabled ? "translate-x-6" : "translate-x-1"}`} />
                  </button>
                </div>
              ))}
            </div>

            {getActiveFeatures().length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">Active Features</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getActiveFeatures().map((f, i) => (
                    <span key={i} className="px-3 py-1 bg-blue-200 text-blue-800 text-xs font-medium rounded-full">{f}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── STEP 5: Review ── */}
        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="bg-green-600 text-white rounded-lg p-6">
              <h2 className="text-xl font-bold">Review Your Changes</h2>
              <p className="text-sm text-green-100 mt-1">Please review all changes before saving</p>
            </div>

            <div className="border border-gray-300 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-4">Exam Details</h3>
              <div className="grid grid-cols-2 gap-6">
                {[
                  ["Title",        formData.examTitle || "Not specified"],
                  ["Duration",     `${formData.duration} minutes`],
                  ["Total Marks",  `${getTotalMarks()} (from questions)`],
                  ["Start",        formData.startDate && formData.startTime ? `${formData.startDate} ${formData.startTime}` : "—"],
                  ["End",          formData.endDate   && formData.endTime   ? `${formData.endDate} ${formData.endTime}`     : "—"],
                  ["Questions",    String(questions.length)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-sm text-gray-600 mb-1">{label}</p>
                    <p className="font-semibold text-gray-900">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-gray-300 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-4">Questions Preview</h3>
              <div className="space-y-2">
                {questions.slice(0, 3).map((q, idx) => (
                  <div key={q.id} className="text-sm text-gray-600 border-l-2 border-blue-500 pl-3">
                    Q{idx + 1}: {q.text.substring(0, 60)}{q.text.length > 60 ? "…" : ""}
                  </div>
                ))}
                {questions.length > 3 && <p className="text-sm text-blue-600">+ {questions.length - 3} more questions</p>}
              </div>
            </div>

            <div className="border border-gray-300 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-4">Assigned To</h3>
              <p className="text-sm text-gray-600">
                {formData.studentSelectionType === "all"
                  ? `All Students (${availableStudents.length + selectedStudents.length} students)`
                  : `${selectedStudents.length} Specific Student${selectedStudents.length !== 1 ? "s" : ""}`}
              </p>
              {formData.studentSelectionType === "specific" && selectedStudents.length > 0 && (
                <div className="mt-3 max-h-32 overflow-y-auto">
                  {selectedStudents.map((student) => (
                    <div key={student.id} className="text-sm text-gray-600 py-1 border-b last:border-0">
                      {student.name} ({student.id}) — {student.class}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border border-gray-300 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-4">Security Settings</h3>
              <div className="flex flex-wrap gap-2">
                {getActiveFeatures().length > 0
                  ? getActiveFeatures().map((f, i) => (
                      <span key={i} className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">{f}</span>
                    ))
                  : <p className="text-sm text-gray-600">No security features enabled</p>
                }
              </div>
            </div>
          </div>
        )}

        {/* ── Navigation ── */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
          <div className="flex gap-2">
            <button
              onClick={handlePrevious} disabled={currentStep === 1}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${currentStep === 1 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
            >
              Previous
            </button>
            {hasChanges && (
              <button onClick={handleResetChanges} className="px-4 py-2 rounded-md font-medium text-gray-700 hover:bg-gray-200 border border-gray-300">
                Reset Changes
              </button>
            )}
          </div>
          <button
            onClick={handleNextStep} disabled={isLoading}
            className={`px-6 py-2 rounded-md font-medium text-white transition-colors disabled:opacity-50 flex items-center gap-2 ${currentStep === 5 ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            {isLoading ? (
              <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Saving...</>
            ) : currentStep === 5 ? (
              <><Save className="w-4 h-4" /> Save Changes</>
            ) : "Next Step"}
          </button>
        </div>

      </div>
    </div>
  );
}