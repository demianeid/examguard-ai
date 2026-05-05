import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  X,
  Clock,
  Trash2,
  Shield,
  Eye,
  Users,
  Mic,
  Lock,
  AlertCircle,
  CheckCircle,
  UserPlus,
  UserMinus,
  Search,
} from "lucide-react";

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const getToken = () => localStorage.getItem('access_token');

interface ExamFormData {
  examTitle: string;
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

interface Question {
  id: string;
  type: string;
  text: string;
  options: string[];
  marks: string;
  correctAnswer?: number;
}

interface QuestionOption {
  value: string;
  label: string;
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

interface QuestionErrors {
  [key: string]: {
    text?: string;
    options?: string;
    correctAnswer?: string;
  };
}

interface Student {
  id: string;
  name: string;
  email: string;
  class?: string;
  rollNumber?: string;
}

export default function CreateExam() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const STORAGE_KEY = searchParams.get('classId') ? `examDraft_${searchParams.get('classId')}` : 'examDraft_new';

  const [currentStep, setCurrentStep] = useState<number>(() => {
    const saved = sessionStorage.getItem(`${STORAGE_KEY}_step`);
    return saved ? parseInt(saved, 10) : 1;
  });

  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<ExamFormData>(() => {
    const saved = sessionStorage.getItem(`${STORAGE_KEY}_formData`);
    if (saved) return JSON.parse(saved);
    return {
      examTitle: "",
      description: "",
      duration: "60",
      totalMarks: "100",
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      instructions: "",
      studentSelectionType: "all",
    };
  });

  const [questions, setQuestions] = useState<Question[]>(() => {
    const saved = sessionStorage.getItem(`${STORAGE_KEY}_questions`);
    if (saved) return JSON.parse(saved);
    return [{
      id: "1",
      type: "multiple-choice",
      text: "",
      options: ["", "", "", ""],
      marks: "1",
      correctAnswer: undefined,
    }];
  });

  const [errors, setErrors] = useState<
    Partial<Record<keyof ExamFormData | "students", string>>
  >({});
  const [questionErrors, setQuestionErrors] = useState<QuestionErrors>({});

  // Student selection state
  const [selectedStudents, setSelectedStudents]   = useState<Student[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [studentSearchTerm, setStudentSearchTerm] = useState<string>("");
  const [studentsLoading, setStudentsLoading]     = useState<boolean>(false);

  useEffect(() => {
    const classId = searchParams.get('classId');
    if (!classId) return;
    const fetchStudents = async () => {
      setStudentsLoading(true);
      try {
        const res = await fetch(`${BASE_URL}/api/instructors/classes/${classId}/students/`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        const data = await res.json();
        const allStudents = data.map((s: any) => ({
          id: s.student_custom_id || s.student_id || String(s.id),
          name: s.full_name,
          email: '',
          class: '',
          rollNumber: s.student_custom_id || s.student_id,
        }));
        
        const savedIdsStr = sessionStorage.getItem(`${STORAGE_KEY}_selectedStudentIds`);
        const savedIds = savedIdsStr ? JSON.parse(savedIdsStr) : [];
        
        const available = allStudents.filter((s: Student) => !savedIds.includes(s.id));
        const selected = allStudents.filter((s: Student) => savedIds.includes(s.id));
        
        setAvailableStudents(available);
        setSelectedStudents(selected);
      } catch {
        setAvailableStudents([]);
      } finally {
        setStudentsLoading(false);
      }
    };
    fetchStudents();
  }, [searchParams, STORAGE_KEY]);

  const baseSecuritySettings: SecurityFeature[] = [
    { id: "behavior",    name: "Behavior Detection",       description: "Head pose tracking and anomaly behavior analysis",     recommended: true,  enabled: true,  icon: <Shield      className="w-5 h-5 text-blue-500" /> },
    { id: "audio",       name: "Audio Detection",          description: "Detect speech or suspicious sounds via microphone",    recommended: true,  enabled: true,  icon: <Mic         className="w-5 h-5 text-blue-500" /> },
    { id: "live",        name: "Live Proctoring",          description: "Real-time human monitoring during the exam",           recommended: true,  enabled: true,  icon: <Eye         className="w-5 h-5 text-blue-500" /> },
    { id: "multiface",   name: "Multiple Face Detection",  description: "Alert if multiple people are detected",                recommended: true,  enabled: true,  icon: <Users       className="w-5 h-5 text-blue-500" /> },
    { id: "lockdown",    name: "Lockdown Browser",         description: "Restrict copy, paste, shortcuts and other applications",recommended: true,  enabled: true,  icon: <Lock        className="w-5 h-5 text-blue-500" /> },
    { id: "object",      name: "Object Detection",         description: "Detect phones, notes, or unauthorized materials",     recommended: true,  enabled: true,  icon: <AlertCircle className="w-5 h-5 text-blue-500" /> },
    { id: "alerts",      name: "Real-Time Alerts",         description: "Instant notifications for suspicious activity",       recommended: true,  enabled: true,  icon: <AlertCircle className="w-5 h-5 text-blue-500" /> },
  ];

  const [securitySettings, setSecuritySettings] = useState<SecurityFeature[]>(() => {
    const saved = sessionStorage.getItem(`${STORAGE_KEY}_security`);
    if (saved) {
      try {
        const enabledIds = JSON.parse(saved);
        return baseSecuritySettings.map(s => ({ ...s, enabled: enabledIds.includes(s.id) }));
      } catch (e) {}
    }
    return baseSecuritySettings;
  });

  useEffect(() => {
    sessionStorage.setItem(`${STORAGE_KEY}_step`, currentStep.toString());
    sessionStorage.setItem(`${STORAGE_KEY}_formData`, JSON.stringify(formData));
    sessionStorage.setItem(`${STORAGE_KEY}_questions`, JSON.stringify(questions));
    sessionStorage.setItem(`${STORAGE_KEY}_security`, JSON.stringify(securitySettings.filter(s => s.enabled).map(s => s.id)));
    sessionStorage.setItem(`${STORAGE_KEY}_selectedStudentIds`, JSON.stringify(selectedStudents.map(s => s.id)));
  }, [currentStep, formData, questions, securitySettings, selectedStudents, STORAGE_KEY]);

  const clearDraft = () => {
    sessionStorage.removeItem(`${STORAGE_KEY}_step`);
    sessionStorage.removeItem(`${STORAGE_KEY}_formData`);
    sessionStorage.removeItem(`${STORAGE_KEY}_questions`);
    sessionStorage.removeItem(`${STORAGE_KEY}_security`);
    sessionStorage.removeItem(`${STORAGE_KEY}_selectedStudentIds`);
  };

  const steps: Step[] = [
    { number: 1, label: "Basic Info" },
    { number: 2, label: "Questions" },
    { number: 3, label: "Students" },
    { number: 4, label: "Security Settings" },
    { number: 5, label: "Review" },
  ];

  const questionTypes: QuestionOption[] = [
    { value: "multiple-choice", label: "Multiple Choice" },
    { value: "true-false",      label: "True/False" },
    { value: "essay",           label: "Essay" },
  ];

  const getFilteredAvailableStudents = () =>
    availableStudents.filter((student) => {
      const search = studentSearchTerm.toLowerCase();
      const matchesSearch =
        String(student.name || "").toLowerCase().includes(search) ||
        String(student.id || "").toLowerCase().includes(search) ||
        String(student.email || "").toLowerCase().includes(search) ||
        String(student.rollNumber || "").toLowerCase().includes(search);
      return matchesSearch && !selectedStudents.some((s) => s.id === student.id);
    });

  const getFilteredSelectedStudents = () =>
    selectedStudents.filter((student) => {
      const search = studentSearchTerm.toLowerCase();
      return (
        String(student.name || "").toLowerCase().includes(search) ||
        String(student.id || "").toLowerCase().includes(search) ||
        String(student.email || "").toLowerCase().includes(search) ||
        String(student.rollNumber || "").toLowerCase().includes(search)
      );
    });

  const handleInputChange = (field: keyof ExamFormData, value: string) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      const { duration, startDate, startTime } = updated;
      if (duration && startDate && startTime) {
        const start = new Date(`${startDate}T${startTime}`);
        const end = new Date(start.getTime() + parseInt(duration) * 60000);
        updated.endDate = getLocalDateString(end);
        updated.endTime = getLocalTimeString(end);
      }

      return updated;
    });
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleAddQuestion = () => {
    const newQuestion: Question = {
      id: Date.now().toString(),
      type: "multiple-choice",
      text: "",
      options: ["", "", "", ""],
      marks: "1",
      correctAnswer: undefined,
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
    setQuestionErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[id];
      return newErrors;
    });
  };

  const handleQuestionChange = (id: string, field: "type" | "text" | "marks", value: string) => {
    setQuestions(
      questions.map((q) => {
        if (q.id !== id) return q;
        if (field !== "type") return { ...q, [field]: value };
        const base = { ...q, type: value, correctAnswer: undefined };
        if (value === "multiple-choice") return { ...base, options: ["", "", "", ""] };
        if (value === "true-false")      return { ...base, options: ["True", "False"] };
        return { ...base, options: [] };
      })
    );
    if (field === "text" && questionErrors[id]?.text) {
      setQuestionErrors((prev) => ({ ...prev, [id]: { ...prev[id], text: undefined } }));
    }
  };

  const handleOptionChange = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? { ...q, options: q.options.map((opt, idx) => (idx === optionIndex ? value : opt)) }
          : q
      )
    );
    if (questionErrors[questionId]?.options) {
      setQuestionErrors((prev) => ({ ...prev, [questionId]: { ...prev[questionId], options: undefined } }));
    }
  };

  const handleCorrectAnswerChange = (questionId: string, optionIndex: number) => {
    setQuestions(
      questions.map((q) => (q.id === questionId ? { ...q, correctAnswer: optionIndex } : q))
    );
    if (questionErrors[questionId]?.correctAnswer) {
      setQuestionErrors((prev) => ({ ...prev, [questionId]: { ...prev[questionId], correctAnswer: undefined } }));
    }
  };

  const handleToggleSecurityFeature = (id: string) => {
    setSecuritySettings((prev) =>
      prev.map((feature) => (feature.id === id ? { ...feature, enabled: !feature.enabled } : feature))
    );
  };

  // Student handlers
  const handleAddStudent = (student: Student) => {
    setSelectedStudents([...selectedStudents, student]);
    setAvailableStudents(availableStudents.filter((s) => s.id !== student.id));
  };

  const handleRemoveStudent = (student: Student) => {
    setSelectedStudents(selectedStudents.filter((s) => s.id !== student.id));
    setAvailableStudents([...availableStudents, student].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const handleAddAllStudents = () => {
    const studentsToAdd = getFilteredAvailableStudents();
    const studentsToAddIds = new Set(studentsToAdd.map((s) => s.id));
    setSelectedStudents([...selectedStudents, ...studentsToAdd]);
    setAvailableStudents(availableStudents.filter((s) => !studentsToAddIds.has(s.id)));
  };

  const handleRemoveAllStudents = () => {
    const studentsToRemove = getFilteredSelectedStudents();
    const studentsToRemoveIds = new Set(studentsToRemove.map((s) => s.id));
    setAvailableStudents([...availableStudents, ...studentsToRemove].sort((a, b) => a.name.localeCompare(b.name)));
    setSelectedStudents(selectedStudents.filter((s) => !studentsToRemoveIds.has(s.id)));
  };

  const getActiveFeatures = () => securitySettings.filter((f) => f.enabled).map((f) => f.name);
  const getTotalMarks     = () => questions.reduce((sum, q) => sum + parseInt(q.marks || "0"), 0);

  // ── Local-time helpers (browser-timezone-safe) ──
  const getLocalDateString = (date = new Date()): string => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const getLocalTimeString = (date = new Date()): string => {
    const h = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${h}:${min}`;
  };

  const getMinTime = (): string => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return getLocalTimeString(now);
  };

  const getTodayString = (): string => getLocalDateString();

  // ── Validation ──
  const validateStep1 = (): boolean => {
    const newErrors: Partial<Record<keyof ExamFormData, string>> = {};

    if (!formData.examTitle.trim()) newErrors.examTitle = "Exam title is required";
    if (!formData.duration || parseInt(formData.duration) <= 0) newErrors.duration = "Duration must be greater than 0";
    if (!formData.totalMarks || parseInt(formData.totalMarks) <= 0) newErrors.totalMarks = "Total marks must be greater than 0";
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    if (!formData.startTime) newErrors.startTime = "Start time is required";
    if (!formData.endDate)   newErrors.endDate   = "End date is required";
    if (!formData.endTime)   newErrors.endTime   = "End time is required";

    const today = getTodayString();
    if (formData.startDate && formData.startDate < today) newErrors.startDate = "Start date cannot be in the past";
    if (formData.endDate   && formData.endDate   < today) newErrors.endDate   = "End date cannot be in the past";
    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate)
      newErrors.endDate = "End date must be after start date";
    if (formData.startDate === today && formData.startTime && formData.startTime < getMinTime())
      newErrors.startTime = "Start time must be at least 5 minutes from now";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newQuestionErrors: QuestionErrors = {};
    let isValid = true;

    if (questions.length === 0) {
      setQuestionErrors({ general: { text: "Please add at least one question" } });
      return false;
    }

    questions.forEach((question) => {
      const errs: { text?: string; options?: string; correctAnswer?: string } = {};
      if (!question.text.trim()) { errs.text = "Question text is required"; isValid = false; }
      if (question.type === "multiple-choice") {
        const filled = question.options.filter((opt) => opt.trim() !== "");
        if (filled.length < 2) {
          errs.options = "Multiple choice questions need at least 2 options";
          isValid = false;
        } else {
          const uniqueFilled = new Set(filled.map(o => o.trim()));
          if (uniqueFilled.size !== filled.length) {
            errs.options = "All options must be unique";
            isValid = false;
          }
        }
        if (question.correctAnswer === undefined) { errs.correctAnswer = "Please select the correct answer"; isValid = false; }
      }
      if (question.type === "true-false" && question.correctAnswer === undefined) {
        errs.correctAnswer = "Please select the correct answer (True/False)"; isValid = false;
      }
      if (Object.keys(errs).length > 0) newQuestionErrors[question.id] = errs;
    });

    // Check marks mismatch
    const questionsTotal = getTotalMarks();
    const totalMarks = parseInt(formData.totalMarks);
    if (questionsTotal !== totalMarks) {
      newQuestionErrors.marksError = {
        text: `Marks mismatch! Questions total is ${questionsTotal} but Exam Total Marks is set to ${totalMarks}. Please fix them to match.`,
      };
      isValid = false;
    }

    setQuestionErrors(newQuestionErrors);
    return isValid;
  };

  const validateStep3 = (): boolean => {
    if (formData.studentSelectionType === "specific" && selectedStudents.length === 0) {
      setErrors((prev) => ({ ...prev, students: "Please select at least one student" }));
      return false;
    }
    return true;
  };

  const handlePrevious = () => { if (currentStep > 1) setCurrentStep(currentStep - 1); };

  const handleNextStep = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2) {
      if (!validateStep2()) {
        setTimeout(() => {
          const firstError = document.querySelector('[data-error="true"]');
          if (firstError) firstError.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
        return;
      }
    }
    if (currentStep === 3 && !validateStep3()) return;
    if (currentStep === 5) { handlePublish(); return; }
    setCurrentStep(currentStep + 1);
  };

  const handlePublish = async () => {
    setIsSubmitting(true);
    setApiError(null);

    const typeMap: Record<string, string> = {
      "multiple-choice": "multiple_choice",
      "true-false":      "true_false",
      "essay":           "essay",
    };

    const buildChoices = (q: Question) => {
      if (q.type === "essay") return [];
      if (q.type === "true-false") {
        return [
          { choice_text: "True",  is_correct: q.correctAnswer === 0 },
          { choice_text: "False", is_correct: q.correctAnswer === 1 },
        ];
      }
      return q.options
        .filter((opt) => opt.trim() !== "")
        .map((opt, idx) => ({ choice_text: opt, is_correct: q.correctAnswer === idx }));
    };

    const getEnabled = (id: string) => securitySettings.find(s => s.id === id)?.enabled ?? true;

    const body = {
      title:          formData.examTitle,
      description:    formData.description,
      duration:       parseInt(formData.duration),
      total_marks:    parseInt(formData.totalMarks),
      start_datetime: new Date(`${formData.startDate}T${formData.startTime}:00`).toISOString(),
      end_datetime:   new Date(`${formData.endDate}T${formData.endTime}:00`).toISOString(),
      instructions:   formData.instructions,
      questions: questions.map((q, idx) => ({
        question_text: q.text,
        question_type: typeMap[q.type] || q.type,
        marks:         parseInt(q.marks || "1"),
        order:         idx + 1,
        choices:       buildChoices(q),
      })),
      assigned_students:
        formData.studentSelectionType === "all" ? null : selectedStudents.map((s) => s.id),
      student_selection_type: formData.studentSelectionType,
      security_settings: {
        behavior_detection:      getEnabled('behavior'),
        audio_detection:         getEnabled('audio'),
        live_proctoring:         getEnabled('live'),
        multiple_face_detection: getEnabled('multiface'),
        lockdown_browser:        getEnabled('lockdown'),
        object_detection:        getEnabled('object'),
        real_time_alerts:        getEnabled('alerts'),
      },
    };

    try {
      const classId = searchParams.get("classId");
      const res = await fetch(`${BASE_URL}/api/exam/class/${classId}/`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body:    JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        // DRF returns field errors as {field: ["message"]} — extract the first one
        let errorMsg = data?.detail || data?.message;
        if (!errorMsg && data && typeof data === 'object') {
          const firstKey = Object.keys(data)[0];
          const firstVal = data[firstKey];
          errorMsg = Array.isArray(firstVal) ? `${firstKey}: ${firstVal[0]}` : String(firstVal);
        }
        throw new Error(errorMsg || `Server error (${res.status})`);
      }

      clearDraft();
      navigate("/classes-instructor", { state: { message: "Exam published successfully!" } });
    } catch (err: any) {
      setApiError(err.message || "Failed to publish exam. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (window.confirm("Are you sure you want to close? All unsaved changes will be lost.")) {
      clearDraft();
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full p-8">

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create New Exam</h1>
            <p className="text-sm text-gray-600 mt-1">Follow the steps to create and configure your exam</p>
          </div>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-2xl font-light" aria-label="Close exam creation">×</button>
        </div>

        {apiError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm flex-1">{apiError}</span>
            <button onClick={() => setApiError(null)} className="text-red-500 hover:text-red-700" aria-label="Dismiss error"><X size={16} /></button>
          </div>
        )}

        {/* Steps */}
        <div className="flex items-center justify-center mb-8 gap-2 overflow-x-auto pb-2">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center gap-2 flex-shrink-0">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    step.number <= currentStep ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-600"
                  }`}
                  aria-label={`Step ${step.number}: ${step.label}`}
                >
                  {step.number < currentStep ? "✓" : step.number}
                </div>
                <span className="text-xs text-gray-600 mt-2 text-center max-w-20 whitespace-nowrap">{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-8 sm:w-14 h-1 transition-colors ${step.number < currentStep ? "bg-blue-500" : "bg-gray-200"}`} aria-hidden="true" />
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
                aria-required="true"
              />
              {errors.examTitle && <p className="mt-1 text-sm text-red-600">{errors.examTitle}</p>}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea
                id="description"
                placeholder="Brief description of the exam content..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
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
                  aria-required="true"
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
                  aria-required="true"
                />
                {errors.totalMarks && <p className="mt-1 text-sm text-red-600">{errors.totalMarks}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="startDate" type="date"
                  min={getTodayString()}
                  value={formData.startDate}
                  onChange={(e) => handleInputChange("startDate", e.target.value)}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${errors.startDate ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`}
                  aria-required="true"
                />
                {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>}
              </div>
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time <span className="text-red-500">*</span>
                </label>
                <input
                  id="startTime" type="time"
                  min={formData.startDate === getTodayString() ? getMinTime() : undefined}
                  value={formData.startTime}
                  onChange={(e) => handleInputChange("startTime", e.target.value)}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${errors.startTime ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`}
                  aria-required="true"
                />
                {errors.startTime && <p className="mt-1 text-sm text-red-600">{errors.startTime}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="endDate" type="date"
                  min={formData.startDate || getTodayString()}
                  value={formData.endDate}
                  onChange={(e) => handleInputChange("endDate", e.target.value)}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${errors.endDate ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`}
                  aria-required="true"
                />
                {errors.endDate && <p className="mt-1 text-sm text-red-600">{errors.endDate}</p>}
              </div>
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                  End Time <span className="text-red-500">*</span>
                </label>
                <input
                  id="endTime" type="time"
                  value={formData.endTime}
                  onChange={(e) => handleInputChange("endTime", e.target.value)}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${errors.endTime ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`}
                  aria-required="true"
                />
                {errors.endTime && <p className="mt-1 text-sm text-red-600">{errors.endTime}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="instructions" className="block text-sm font-medium text-gray-700 mb-2">Instructions for Students</label>
              <textarea
                id="instructions"
                placeholder="Enter exam instructions, rules, and guidelines..."
                value={formData.instructions}
                onChange={(e) => handleInputChange("instructions", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>
          </div>
        )}

        {/* ── STEP 2: Questions ── */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Exam Questions</h2>
              <button onClick={handleAddQuestion} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium" aria-label="Add new question">
                + Add Question
              </button>
            </div>

            {/* Questions summary + Total Marks editor */}
            {questions.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">Total Questions: {questions.length}</span>
                </div>
                <span className="font-medium text-gray-900">Questions Marks: {getTotalMarks()}</span>
              </div>
            )}

            {/* Marks mismatch indicator */}
            <div className={`border rounded-lg p-4 flex items-center justify-between gap-4 ${
              getTotalMarks() !== parseInt(formData.totalMarks)
                ? "bg-red-50 border-red-300"
                : "bg-green-50 border-green-300"
            }`}>
              <div className="flex items-center gap-2">
                {getTotalMarks() !== parseInt(formData.totalMarks) ? (
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                )}
                <span className={`text-sm font-medium ${
                  getTotalMarks() !== parseInt(formData.totalMarks) ? "text-red-700" : "text-green-700"
                }`}>
                  {getTotalMarks() !== parseInt(formData.totalMarks)
                    ? `Mismatch! Questions total: ${getTotalMarks()} ≠ Exam total: ${formData.totalMarks}`
                    : "Marks are matching ✓"}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <label htmlFor="totalMarksStep2" className="text-sm text-gray-600 whitespace-nowrap">
                  Exam Total Marks:
                </label>
                <input
                  id="totalMarksStep2"
                  type="number"
                  min="1"
                  value={formData.totalMarks}
                  onChange={(e) => handleInputChange("totalMarks", e.target.value)}
                  className="w-20 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Marks mismatch error (shown on Next click) */}
            {questionErrors.marksError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-600">{questionErrors.marksError.text}</p>
              </div>
            )}

            {questionErrors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{questionErrors.general.text}</p>
              </div>
            )}

            {questions.length === 0 ? (
              <div className="text-center py-12 border border-gray-200 rounded-md bg-gray-50">
                <p className="text-gray-600 mb-4">No questions added yet</p>
                <button onClick={handleAddQuestion} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium">
                  + Add Your First Question
                </button>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {questions.map((question, index) => {
                  const hasError = questionErrors[question.id] && Object.values(questionErrors[question.id]).some(Boolean);
                  return (
                  <div
                    key={question.id}
                    className={`border rounded-md p-4 ${hasError ? "border-red-300 bg-red-50" : "border-gray-300"}`}
                    data-error={hasError ? "true" : "false"}
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${hasError ? "bg-red-500 text-white" : "bg-blue-500 text-white"}`}>
                        {index + 1}
                      </div>
                      <div className="flex-1 flex gap-3 items-center">
                        <select
                          id={`question-type-${question.id}`}
                          value={question.type}
                          onChange={(e) => handleQuestionChange(question.id, "type", e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          {questionTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
                        </select>
                        <div className="flex items-center gap-1">
                          <label htmlFor={`question-marks-${question.id}`} className="text-sm text-gray-500">Marks:</label>
                          <input
                            id={`question-marks-${question.id}`}
                            type="number" min="1"
                            value={question.marks}
                            onChange={(e) => handleQuestionChange(question.id, "marks", e.target.value)}
                            className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <button onClick={() => handleDeleteQuestion(question.id)} className="text-red-500 hover:text-red-700 transition-colors" aria-label={`Delete question ${index + 1}`}>
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="mb-4">
                      <label htmlFor={`question-text-${question.id}`} className="block text-sm font-medium text-gray-700 mb-1">
                        Question Text <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id={`question-text-${question.id}`}
                        value={question.text}
                        onChange={(e) => handleQuestionChange(question.id, "text", e.target.value)}
                        placeholder="Enter your question here..."
                        className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent resize-none ${questionErrors[question.id]?.text ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`}
                        rows={3}
                      />
                      {questionErrors[question.id]?.text && (
                        <p className="mt-1 text-xs text-red-600">{questionErrors[question.id].text}</p>
                      )}
                    </div>

                    {question.type === "multiple-choice" && (
                      <fieldset className="space-y-3 ml-8">
                        <legend className="text-sm font-medium text-gray-700 mb-2">Options <span className="text-red-500">*</span></legend>
                        {question.options.map((option, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-3">
                            <input
                              type="radio"
                              id={`option-radio-${question.id}-${optIdx}`}
                              name={`question-${question.id}`}
                              checked={question.correctAnswer === optIdx}
                              onChange={() => handleCorrectAnswerChange(question.id, optIdx)}
                              className="w-4 h-4 cursor-pointer"
                            />
                            <input
                              id={`option-input-${question.id}-${optIdx}`}
                              type="text" value={option}
                              onChange={(e) => handleOptionChange(question.id, optIdx, e.target.value)}
                              placeholder={`Option ${optIdx + 1}`}
                              className={`flex-1 px-3 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent ${questionErrors[question.id]?.options && !option.trim() ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"}`}
                            />
                          </div>
                        ))}
                        {questionErrors[question.id]?.options      && <p className="text-xs text-red-600 mt-1">{questionErrors[question.id].options}</p>}
                        {questionErrors[question.id]?.correctAnswer && <p className="text-xs text-red-600 mt-1">{questionErrors[question.id].correctAnswer}</p>}
                      </fieldset>
                    )}

                    {question.type === "true-false" && (
                      <fieldset className="space-y-2 ml-8">
                        <legend className="text-sm font-medium text-gray-700 mb-2">Correct Answer <span className="text-red-500">*</span></legend>
                        {["True", "False"].map((label, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <input
                              type="radio"
                              id={`${label.toLowerCase()}-${question.id}`}
                              name={`tf-${question.id}`}
                              checked={question.correctAnswer === idx}
                              onChange={() => handleCorrectAnswerChange(question.id, idx)}
                              className="w-4 h-4 cursor-pointer"
                            />
                            <label htmlFor={`${label.toLowerCase()}-${question.id}`} className="text-sm text-gray-600">{label}</label>
                          </div>
                        ))}
                        {questionErrors[question.id]?.correctAnswer && (
                          <p className="text-xs text-red-600 mt-1">{questionErrors[question.id].correctAnswer}</p>
                        )}
                      </fieldset>
                    )}

                    {question.type === "essay" && (
                      <div className="ml-8 p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600">
                        Essay question — students will provide a written response
                      </div>
                    )}
                  </div>
                  );
                })}
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
                      <button onClick={handleAddAllStudents} disabled={getFilteredAvailableStudents().length === 0}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50">
                        Add All
                      </button>
                      <button onClick={handleRemoveAllStudents} disabled={getFilteredSelectedStudents().length === 0}
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

                      </div>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {getFilteredAvailableStudents().length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">No students available</p>
                        ) : (
                          getFilteredAvailableStudents().map((student) => (
                            <div key={student.id} className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100">
                              <div>
                                <p className="text-sm font-medium">{student.name}</p>
                                <p className="text-xs text-gray-500">{student.id}</p>
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
                        {getFilteredSelectedStudents().length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">No students found</p>
                        ) : (
                          getFilteredSelectedStudents().map((student) => (
                            <div key={student.id} className="flex items-center justify-between p-2 bg-blue-50 rounded hover:bg-blue-100">
                              <div>
                                <p className="text-sm font-medium">{student.name}</p>
                                <p className="text-xs text-gray-500">{student.id}</p>
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
                  <p className="text-sm text-gray-700">This exam will be available to all {availableStudents.length + selectedStudents.length} students.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── STEP 4: Security Settings ── */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 flex items-start gap-4">
              <Shield className="w-8 h-8 flex-shrink-0 mt-1" aria-hidden="true" />
              <div>
                <h2 className="text-xl font-bold">Anti-Cheating Configuration</h2>
                <p className="text-sm text-blue-100 mt-1">Configure proctoring features based on your exam requirements</p>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto" role="list">
              {securitySettings.map((feature) => (
                <div key={feature.id} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition-colors" role="listitem">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex-shrink-0 mt-1" aria-hidden="true">{feature.icon}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{feature.name}</h3>
                        {feature.recommended && (
                          <span className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">Recommended</span>
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
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${feature.enabled ? "translate-x-6" : "translate-x-1"}`} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>

            {getActiveFeatures().length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-blue-600" aria-hidden="true" />
                  <h3 className="font-semibold text-gray-900">Active Features Summary</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {getActiveFeatures().map((feature, idx) => (
                    <span key={idx} className="inline-block px-3 py-1 bg-blue-200 text-blue-800 text-xs font-medium rounded-full">{feature}</span>
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
              <h2 className="text-xl font-bold">Review Your Exam</h2>
              <p className="text-sm text-green-100 mt-1">Please review all details before publishing</p>
            </div>

            <div className="border border-gray-300 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-4">Exam Details</h3>
              <div className="grid grid-cols-2 gap-6">
                {[
                  ["Title",            formData.examTitle || "Not specified"],
                  ["Duration",         `${formData.duration} minutes`],
                  ["Total Marks",      `${getTotalMarks()} (Calculated from questions)`],
                  ["Start Date & Time", formData.startDate && formData.startTime ? `${formData.startDate} ${formData.startTime}` : "Not specified"],
                  ["End Date & Time",  formData.endDate   && formData.endTime   ? `${formData.endDate} ${formData.endTime}`     : "Not specified"],
                  ["Questions",        String(questions.length)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <p className="text-sm text-gray-600 mb-1">{label}</p>
                    <p className="font-semibold text-gray-900">{value}</p>
                  </div>
                ))}
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
                      {student.name} ({student.id})
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border border-gray-300 rounded-lg p-6">
              <h3 className="font-bold text-gray-900 mb-4">Security Settings</h3>
              <div className="flex flex-wrap gap-2">
                {getActiveFeatures().length > 0
                  ? getActiveFeatures().map((feature, idx) => (
                      <span key={idx} className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full">{feature}</span>
                    ))
                  : <p className="text-sm text-gray-600">No security features enabled</p>
                }
              </div>
            </div>

            {formData.description && (
              <div className="border border-gray-300 rounded-lg p-6">
                <h3 className="font-bold text-gray-900 mb-2">Description</h3>
                <p className="text-sm text-gray-600">{formData.description}</p>
              </div>
            )}

            {formData.instructions && (
              <div className="border border-gray-300 rounded-lg p-6">
                <h3 className="font-bold text-gray-900 mb-2">Instructions for Students</h3>
                <p className="text-sm text-gray-600">{formData.instructions}</p>
              </div>
            )}
          </div>
        )}

        {/* ── Navigation ── */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={handlePrevious} disabled={currentStep === 1}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${currentStep === 1 ? "bg-gray-200 text-gray-400 cursor-not-allowed" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
            aria-label="Go to previous step"
          >
            Previous
          </button>
          <button
            onClick={handleNextStep} disabled={isSubmitting}
            className={`px-6 py-2 rounded-md font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${currentStep === 5 ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}`}
            aria-label={currentStep === 5 ? "Publish exam" : "Go to next step"}
          >
            {isSubmitting ? "Publishing..." : currentStep === 5 ? "Publish Exam" : "Next Step"}
          </button>
        </div>

      </div>
    </div>
  );
}