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
  Video,
  AlertCircle,
  Wifi,
  CheckCircle,
  UserPlus,
  UserMinus,
  Search,
} from "lucide-react";

const BASE_URL = 'https://examguard-ai-production.up.railway.app';
const getToken = () => localStorage.getItem('access_token');

interface InstructorClass {
  id: number;
  name: string;
  code: string;
}

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
  studentSelectionType: "all" | "specific" | "class";
  selectedClass?: string;
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

// Mock students data - In real app, this would come from an API
const MOCK_STUDENTS: Student[] = [
  { id: "STU001", name: "John Doe", email: "john@example.com", class: "CS101", rollNumber: "2024001" },
  { id: "STU002", name: "Jane Smith", email: "jane@example.com", class: "CS101", rollNumber: "2024002" },
  { id: "STU003", name: "Bob Johnson", email: "bob@example.com", class: "CS102", rollNumber: "2024003" },
  { id: "STU004", name: "Alice Brown", email: "alice@example.com", class: "CS102", rollNumber: "2024004" },
  { id: "STU005", name: "Charlie Wilson", email: "charlie@example.com", class: "CS103", rollNumber: "2024005" },
  { id: "STU006", name: "Diana Miller", email: "diana@example.com", class: "CS103", rollNumber: "2024006" },
  { id: "STU007", name: "Ethan Davis", email: "ethan@example.com", class: "CS101", rollNumber: "2024007" },
  { id: "STU008", name: "Fiona Garcia", email: "fiona@example.com", class: "CS102", rollNumber: "2024008" },
];

export default function CreateExam() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [instructorClasses, setInstructorClasses] = useState<InstructorClass[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<ExamFormData>({
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
    selectedClass: searchParams.get('classId') || "",
  });
  
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: "1",
      type: "multiple-choice",
      text: "",
      options: ["", "", "", ""],
      marks: "1",
      correctAnswer: undefined,
    },
  ]);
  const [errors, setErrors] = useState<
  Partial<Record<keyof ExamFormData | "students", string>>
  >({});
  const [questionErrors, setQuestionErrors] = useState<QuestionErrors>({});

  // Student selection state
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [availableStudents, setAvailableStudents] = useState<Student[]>(MOCK_STUDENTS);
  const [studentSearchTerm, setStudentSearchTerm] = useState<string>("");
  const [classFilter, setClassFilter] = useState<string>("all");

  const [securitySettings, setSecuritySettings] = useState<SecurityFeature[]>([
    {
      id: "1",
      name: "AI Proctoring",
      description: "Automated behavior analysis and anomaly detection",
      recommended: true,
      enabled: true,
      icon: <Shield className="w-5 h-5 text-blue-500" />,
    },
    {
      id: "2",
      name: "Live Proctoring",
      description: "Real-time human monitoring during the exam",
      recommended: false,
      enabled: false,
      icon: <Eye className="w-5 h-5 text-gray-400" />,
    },
    {
      id: "3",
      name: "Eye Tracking",
      description: "Monitor eye movements and focus patterns",
      recommended: true,
      enabled: true,
      icon: <Eye className="w-5 h-5 text-blue-500" />,
    },
    {
      id: "4",
      name: "Multiple Face Detection",
      description: "Alert if multiple people are detected",
      recommended: true,
      enabled: true,
      icon: <Users className="w-5 h-5 text-blue-500" />,
    },
    {
      id: "5",
      name: "Speaker Recognition",
      description: "Detect unauthorized voices or conversations",
      recommended: false,
      enabled: false,
      icon: <Mic className="w-5 h-5 text-gray-400" />,
    },
    {
      id: "6",
      name: "Lockdown Browser",
      description: "Restrict access to other applications",
      recommended: true,
      enabled: true,
      icon: <Lock className="w-5 h-5 text-blue-500" />,
    },
    {
      id: "7",
      name: "Record & Review",
      description: "Record entire session for later review",
      recommended: false,
      enabled: false,
      icon: <Video className="w-5 h-5 text-gray-400" />,
    },
    {
      id: "8",
      name: "Object Detection",
      description: "Detect phones, notes, or unauthorized materials",
      recommended: true,
      enabled: true,
      icon: <AlertCircle className="w-5 h-5 text-blue-500" />,
    },
    {
      id: "9",
      name: "Real-Time Alerts",
      description: "Instant notifications for suspicious activity",
      recommended: true,
      enabled: true,
      icon: <AlertCircle className="w-5 h-5 text-blue-500" />,
    },
    {
      id: "10",
      name: "Offline Exam Mode",
      description: "Allow exams without internet connection",
      recommended: false,
      enabled: false,
      icon: <Wifi className="w-5 h-5 text-gray-400" />,
    },
  ]);

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch(`${BASE_URL}/api/instructors/classes/`, {
          headers: { 'Authorization': `Bearer ${getToken()}` },
        });
        if (!res.ok) throw new Error('Failed to load classes');
        const data = await res.json();
        setInstructorClasses(data.map((c: any) => ({ id: c.id, name: c.name, code: c.code })));
      } catch {
        setApiError('Could not load your classes. Please try again.');
      } finally {
        setClassesLoading(false);
      }
    };
    fetchClasses();
  }, []);

  const steps: Step[] = [
    { number: 1, label: "Basic Info" },
    { number: 2, label: "Questions" },
    { number: 3, label: "Students" },
    { number: 4, label: "Security Settings" },
    { number: 5, label: "Review" },
  ];

  const questionTypes: QuestionOption[] = [
    { value: "multiple-choice", label: "Multiple Choice" },
    { value: "true-false", label: "True/False" },
    { value: "essay", label: "Essay" },
  ];

  // Get unique classes from students
const uniqueClasses = Array.from(
  new Set(MOCK_STUDENTS.map(s => s.class))
).filter((c): c is string => c !== undefined);
  // Filter available students based on search and class
  const getFilteredAvailableStudents = () => {
    return availableStudents.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                           student.id.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                           student.email.toLowerCase().includes(studentSearchTerm.toLowerCase());
      const matchesClass = classFilter === "all" || student.class === classFilter;
      return matchesSearch && matchesClass && !selectedStudents.some(s => s.id === student.id);
    });
  };

  const handleInputChange = (field: keyof ExamFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
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
    setQuestionErrors((prev) => ({ ...prev, [newQuestion.id]: {} }));
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
    setQuestionErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[id];
      return newErrors;
    });
  };

  const handleQuestionChange = (
    id: string,
    field: "type" | "text" | "marks",
    value: string
  ) => {
    setQuestions(
      questions.map((q) => {
        if (q.id !== id) return q;
        if (field !== "type") return { ...q, [field]: value };
        const base = { ...q, type: value, correctAnswer: undefined };
        if (value === "multiple-choice") return { ...base, options: ["", "", "", ""] };
        if (value === "true-false") return { ...base, options: ["True", "False"] };
        return { ...base, options: [] };
      })
    );
    if (field === "text" && questionErrors[id]?.text) {
      setQuestionErrors((prev) => ({
        ...prev,
        [id]: { ...prev[id], text: undefined },
      }));
    }
  };

  const handleOptionChange = (
    questionId: string,
    optionIndex: number,
    value: string
  ) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((opt, idx) =>
                idx === optionIndex ? value : opt
              ),
            }
          : q
      )
    );
    if (questionErrors[questionId]?.options) {
      setQuestionErrors((prev) => ({
        ...prev,
        [questionId]: { ...prev[questionId], options: undefined },
      }));
    }
  };

  const handleCorrectAnswerChange = (questionId: string, optionIndex: number) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId ? { ...q, correctAnswer: optionIndex } : q
      )
    );
    if (questionErrors[questionId]?.correctAnswer) {
      setQuestionErrors((prev) => ({
        ...prev,
        [questionId]: { ...prev[questionId], correctAnswer: undefined },
      }));
    }
  };

  const handleToggleSecurityFeature = (id: string) => {
    setSecuritySettings((prev) =>
      prev.map((feature) =>
        feature.id === id ? { ...feature, enabled: !feature.enabled } : feature
      )
    );
  };

  // Student selection handlers
  const handleAddStudent = (student: Student) => {
    setSelectedStudents([...selectedStudents, student]);
    setAvailableStudents(availableStudents.filter(s => s.id !== student.id));
  };

  const handleRemoveStudent = (student: Student) => {
    setSelectedStudents(selectedStudents.filter(s => s.id !== student.id));
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
    const studentsInClass = availableStudents.filter(s => s.class === className);
    setSelectedStudents([...selectedStudents, ...studentsInClass]);
    setAvailableStudents(availableStudents.filter(s => s.class !== className));
  };

  const getActiveFeatures = () => {
    return securitySettings.filter((f) => f.enabled).map((f) => f.name);
  };

  const validateStep1 = (): boolean => {
    const newErrors: Partial<Record<keyof ExamFormData, string>> = {};

    if (!formData.examTitle.trim()) {
      newErrors.examTitle = "Exam title is required";
    }

    if (!formData.selectedClass) {
      newErrors.selectedClass = "Please select a class";
    }

    if (!formData.duration || parseInt(formData.duration) <= 0) {
      newErrors.duration = "Duration must be greater than 0";
    }

    if (!formData.totalMarks || parseInt(formData.totalMarks) <= 0) {
      newErrors.totalMarks = "Total marks must be greater than 0";
    }

    if (!formData.startDate) {
      newErrors.startDate = "Start date is required";
    }

    if (!formData.startTime) {
      newErrors.startTime = "Start time is required";
    }

    if (!formData.endDate) {
      newErrors.endDate = "End date is required";
    }

    if (!formData.endTime) {
      newErrors.endTime = "End time is required";
    }
    const today = new Date().toISOString().split('T')[0];

if (formData.startDate && formData.startDate < today) {
  newErrors.startDate = "Start date cannot be in the past";
}
if (formData.endDate && formData.endDate < today) {
  newErrors.endDate = "End date cannot be in the past";
}
if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
  newErrors.endDate = "End date must be after start date";
}
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
      const errors: { text?: string; options?: string; correctAnswer?: string } = {};

      if (!question.text.trim()) {
        errors.text = "Question text is required";
        isValid = false;
      }

      if (question.type === "multiple-choice") {
        const filledOptions = question.options.filter((opt) => opt.trim() !== "");
        if (filledOptions.length < 2) {
          errors.options = "Multiple choice questions need at least 2 options";
          isValid = false;
        }
        
        if (question.correctAnswer === undefined) {
          errors.correctAnswer = "Please select the correct answer";
          isValid = false;
        }
      }

      if (question.type === "true-false") {
        if (question.correctAnswer === undefined) {
          errors.correctAnswer = "Please select the correct answer (True/False)";
          isValid = false;
        }
      }

      if (Object.keys(errors).length > 0) {
        newQuestionErrors[question.id] = errors;
      }
    });

    setQuestionErrors(newQuestionErrors);
    return isValid;
  };

const validateStep3 = (): boolean => {
  if (formData.studentSelectionType === "specific" && selectedStudents.length === 0) {
    setErrors(prev => ({ ...prev, students: "Please select at least one student" }));
    return false;
  }
  return true;
};

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!validateStep1()) {
        return;
      }
    }

    if (currentStep === 2) {
      if (!validateStep2()) {
        setTimeout(() => {
          const firstError = document.querySelector('[data-error="true"]');
          if (firstError) {
            firstError.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 100);
        return;
      }
    }

    if (currentStep === 3) {
      if (!validateStep3()) {
        return;
      }
    }

    if (currentStep === 5) {
      handlePublish();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePublish = async () => {
    setIsSubmitting(true);
    setApiError(null);

    const typeMap: Record<string, string> = {
      'multiple-choice': 'multiple_choice',
      'true-false': 'true_false',
      'essay': 'essay',
    };

    const buildChoices = (q: Question) => {
      if (q.type === 'essay') return [];
      if (q.type === 'true-false') {
        return [
          { choice_text: 'True', is_correct: q.correctAnswer === 0 },
          { choice_text: 'False', is_correct: q.correctAnswer === 1 },
        ];
      }
      return q.options
        .filter((opt) => opt.trim() !== '')
        .map((opt, idx) => ({ choice_text: opt, is_correct: q.correctAnswer === idx }));
    };

    const body = {
      title: formData.examTitle,
      description: formData.description,
      duration: parseInt(formData.duration),
      total_marks: parseInt(formData.totalMarks),
      start_datetime: `${formData.startDate}T${formData.startTime}:00`,
      end_datetime: `${formData.endDate}T${formData.endTime}:00`,
      instructions: formData.instructions,
      questions: questions.map((q, idx) => ({
        question_text: q.text,
        question_type: typeMap[q.type] || q.type,
        marks: parseInt(q.marks || '1'),
        order: idx + 1,
        choices: buildChoices(q),
      })),
      // Student assignment data (you may need to adjust this based on your backend)
      assigned_students: formData.studentSelectionType === 'all' 
        ? null 
        : selectedStudents.map(s => s.id),
      student_selection_type: formData.studentSelectionType,
    };

    try {
      const classId = searchParams.get('classId') || formData.selectedClass;
      const res = await fetch(`${BASE_URL}/api/exam/class/${classId}/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || data?.message || `Server error (${res.status})`);
      }

      navigate('/classes-instructor', { state: { message: 'Exam published successfully!' } });
    } catch (err: any) {
      setApiError(err.message || 'Failed to publish exam. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (
      window.confirm(
        "Are you sure you want to close? All unsaved changes will be lost."
      )
    ) {
      navigate(-1);
    }
  };

  const getTotalMarks = () => {
    return questions.reduce((sum, q) => sum + parseInt(q.marks || "0"), 0);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Create New Exam
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Follow the steps to create and configure your exam
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-2xl font-light"
            aria-label="Close exam creation"
          >
            ×
          </button>
        </div>

        {apiError && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm flex-1">{apiError}</span>
            <button onClick={() => setApiError(null)} className="text-red-500 hover:text-red-700" aria-label="Dismiss error"><X size={16} /></button>
          </div>
        )}

        <div className="flex items-center justify-center mb-8 gap-2 overflow-x-auto pb-2">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center gap-2 flex-shrink-0">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    step.number === currentStep
                      ? "bg-blue-500 text-white"
                      : step.number < currentStep
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
                  aria-label={`Step ${step.number}: ${step.label}`}
                >
                  {step.number < currentStep ? "✓" : step.number}
                </div>
                <span className="text-xs text-gray-600 mt-2 text-center max-w-20 whitespace-nowrap">
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-8 sm:w-16 h-1 transition-colors ${
                    step.number < currentStep ? "bg-blue-500" : "bg-gray-200"
                  }`}
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>

        {currentStep === 1 && (
          <div className="space-y-5">
            <div>
              <label
                htmlFor="examTitle"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Exam Title <span className="text-red-500">*</span>
              </label>
              <input
                id="examTitle"
                type="text"
                placeholder="e.g., Midterm Exam - Data Structure"
                value={formData.examTitle}
                onChange={(e) => handleInputChange("examTitle", e.target.value)}
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                  errors.examTitle
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                aria-required="true"
                aria-describedby={
                  errors.examTitle ? "examTitle-error" : undefined
                }
              />
              {errors.examTitle && (
                <p id="examTitle-error" className="mt-1 text-sm text-red-600">
                  {errors.examTitle}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="selectedClass"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Select Class <span className="text-red-500">*</span>
              </label>
              <select
                id="selectedClass"
                value={formData.selectedClass}
                onChange={(e) =>
                  handleInputChange("selectedClass", e.target.value)
                }
                className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent bg-white ${
                  errors.selectedClass
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                aria-required="true"
                aria-describedby={
                  errors.selectedClass ? "selectedClass-error" : undefined
                }
              >
                <option value="">{classesLoading ? 'Loading classes...' : 'Choose a class...'}</option>
                {instructorClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
              {errors.selectedClass && (
                <p
                  id="selectedClass-error"
                  className="mt-1 text-sm text-red-600"
                >
                  {errors.selectedClass}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description
              </label>
              <textarea
                id="description"
                placeholder="Brief description of the exam content..."
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="duration"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Duration (Minutes) <span className="text-red-500">*</span>
                </label>
                <input
                  id="duration"
                  type="number"
                  min="1"
                  value={formData.duration}
                  onChange={(e) =>
                    handleInputChange("duration", e.target.value)
                  }
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                    errors.duration
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                  aria-required="true"
                  aria-describedby={
                    errors.duration ? "duration-error" : undefined
                  }
                />
                {errors.duration && (
                  <p id="duration-error" className="mt-1 text-sm text-red-600">
                    {errors.duration}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="totalMarks"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Total Marks <span className="text-red-500">*</span>
                </label>
                <input
                  id="totalMarks"
                  type="number"
                  min="1"
                  value={formData.totalMarks}
                  onChange={(e) =>
                    handleInputChange("totalMarks", e.target.value)
                  }
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                    errors.totalMarks
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                  aria-required="true"
                  aria-describedby={
                    errors.totalMarks ? "totalMarks-error" : undefined
                  }
                />
                {errors.totalMarks && (
                  <p
                    id="totalMarks-error"
                    className="mt-1 text-sm text-red-600"
                  >
                    {errors.totalMarks}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="startDate"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  id="startDate"
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={formData.startDate}
                  onChange={(e) =>
                    handleInputChange("startDate", e.target.value)
                  }
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                    errors.startDate
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                  aria-required="true"
                  aria-describedby={
                    errors.startDate ? "startDate-error" : undefined
                  }
                />
                {errors.startDate && (
                  <p id="startDate-error" className="mt-1 text-sm text-red-600">
                    {errors.startDate}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="startTime"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Start Time <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      handleInputChange("startTime", e.target.value)
                    }
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                      errors.startTime
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                    aria-required="true"
                    aria-describedby={
                      errors.startTime ? "startTime-error" : undefined
                    }
                  />
                </div>
                {errors.startTime && (
                  <p id="startTime-error" className="mt-1 text-sm text-red-600">
                    {errors.startTime}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="endDate"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  End Date <span className="text-red-500">*</span>
                </label>
                <input
               id="endDate"
                  type="date"
                  min={formData.startDate || new Date().toISOString().split('T')[0]}
                  value={formData.endDate}
                  onChange={(e) => handleInputChange("endDate", e.target.value)}
                  className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                    errors.endDate
                      ? "border-red-300 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                  aria-required="true"
                  aria-describedby={
                    errors.endDate ? "endDate-error" : undefined
                  }
                />
                {errors.endDate && (
                  <p id="endDate-error" className="mt-1 text-sm text-red-600">
                    {errors.endDate}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="endTime"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  End Time <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      handleInputChange("endTime", e.target.value)
                    }
                    className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:border-transparent ${
                      errors.endTime
                        ? "border-red-300 focus:ring-red-500"
                        : "border-gray-300 focus:ring-blue-500"
                    }`}
                    aria-required="true"
                    aria-describedby={
                      errors.endTime ? "endTime-error" : undefined
                    }
                  />
                </div>
                {errors.endTime && (
                  <p id="endTime-error" className="mt-1 text-sm text-red-600">
                    {errors.endTime}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                htmlFor="instructions"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Instructions for Students
              </label>
              <textarea
                id="instructions"
                placeholder="Enter exam instructions, rules, and guidelines..."
                value={formData.instructions}
                onChange={(e) =>
                  handleInputChange("instructions", e.target.value)
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Exam Questions
              </h2>
              <button
                onClick={handleAddQuestion}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                aria-label="Add new question"
              >
                + Add Question
              </button>
            </div>

            {questions.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-gray-900">
                    Total Questions: {questions.length}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-medium text-gray-900">
                    Total Marks: {getTotalMarks()}
                  </span>
                </div>
              </div>
            )}

            {questionErrors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-600">{questionErrors.general.text}</p>
              </div>
            )}

            {questions.length === 0 ? (
              <div className="text-center py-12 border border-gray-200 rounded-md bg-gray-50">
                <p className="text-gray-600 mb-4">No questions added yet</p>
                <button
                  onClick={handleAddQuestion}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
                  aria-label="Add your first question"
                >
                  + Add Your First Question
                </button>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    className={`border rounded-md p-4 ${
                      questionErrors[question.id] ? "border-red-300 bg-red-50" : "border-gray-300"
                    }`}
                    data-error={questionErrors[question.id] ? "true" : "false"}
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm ${
                          questionErrors[question.id] ? "bg-red-500 text-white" : "bg-blue-500 text-white"
                        }`}
                        aria-label={`Question ${index + 1}`}
                      >
                        {index + 1}
                      </div>
                      <div className="flex-1 flex gap-3 items-center">
                        <label
                          htmlFor={`question-type-${question.id}`}
                          className="sr-only"
                        >
                          Question type
                        </label>
                        <select
                          id={`question-type-${question.id}`}
                          value={question.type}
                          onChange={(e) =>
                            handleQuestionChange(
                              question.id,
                              "type",
                              e.target.value
                            )
                          }
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                          aria-label={`Question type for question ${index + 1}`}
                        >
                          {questionTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.label}
                            </option>
                          ))}
                        </select>
                        <div className="flex items-center gap-1">
                          <label
                            htmlFor={`question-marks-${question.id}`}
                            className="text-sm text-gray-500"
                          >
                            Marks:
                          </label>
                          <input
                            id={`question-marks-${question.id}`}
                            type="number"
                            min="1"
                            value={question.marks}
                            onChange={(e) =>
                              handleQuestionChange(
                                question.id,
                                "marks",
                                e.target.value
                              )
                            }
                            className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            aria-label={`Marks for question ${index + 1}`}
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                        aria-label={`Delete question ${index + 1}`}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="mb-4">
                      <label
                        htmlFor={`question-text-${question.id}`}
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Question Text <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id={`question-text-${question.id}`}
                        value={question.text}
                        onChange={(e) =>
                          handleQuestionChange(
                            question.id,
                            "text",
                            e.target.value
                          )
                        }
                        placeholder="Enter your question here..."
                        className={`w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent resize-none ${
                          questionErrors[question.id]?.text
                            ? "border-red-300 focus:ring-red-500"
                            : "border-gray-300 focus:ring-blue-500"
                        }`}
                        rows={3}
                        aria-label={`Question text for question ${index + 1}`}
                      />
                      {questionErrors[question.id]?.text && (
                        <p className="mt-1 text-xs text-red-600">
                          {questionErrors[question.id].text}
                        </p>
                      )}
                    </div>

                    {question.type === "multiple-choice" && (
                      <fieldset className="space-y-3 ml-8">
                        <legend className="text-sm font-medium text-gray-700 mb-2">
                          Options <span className="text-red-500">*</span>
                        </legend>
                        {question.options.map((option, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-3">
                            <input
                              type="radio"
                              id={`option-radio-${question.id}-${optIdx}`}
                              name={`question-${question.id}`}
                              checked={question.correctAnswer === optIdx}
                              onChange={() => handleCorrectAnswerChange(question.id, optIdx)}
                              className="w-4 h-4 cursor-pointer"
                              aria-label={`Mark option ${optIdx + 1} as correct`}
                            />
                            <label
                              htmlFor={`option-input-${question.id}-${optIdx}`}
                              className="sr-only"
                            >
                              Option {optIdx + 1} text
                            </label>
                            <input
                              id={`option-input-${question.id}-${optIdx}`}
                              type="text"
                              value={option}
                              onChange={(e) =>
                                handleOptionChange(
                                  question.id,
                                  optIdx,
                                  e.target.value
                                )
                              }
                              placeholder={`Option ${optIdx + 1}`}
                              className={`flex-1 px-3 py-1 border rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent ${
                                questionErrors[question.id]?.options && !option.trim()
                                  ? "border-red-300 focus:ring-red-500"
                                  : "border-gray-300 focus:ring-blue-500"
                              }`}
                              aria-label={`Text for option ${optIdx + 1}`}
                            />
                          </div>
                        ))}
                        {questionErrors[question.id]?.options && (
                          <p className="text-xs text-red-600 mt-1">
                            {questionErrors[question.id].options}
                          </p>
                        )}
                        {questionErrors[question.id]?.correctAnswer && (
                          <p className="text-xs text-red-600 mt-1">
                            {questionErrors[question.id].correctAnswer}
                          </p>
                        )}
                      </fieldset>
                    )}

                    {question.type === "true-false" && (
                      <fieldset className="space-y-2 ml-8">
                        <legend className="text-sm font-medium text-gray-700 mb-2">
                          Correct Answer <span className="text-red-500">*</span>
                        </legend>
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            id={`true-${question.id}`}
                            name={`tf-${question.id}`}
                            checked={question.correctAnswer === 0}
                            onChange={() => handleCorrectAnswerChange(question.id, 0)}
                            className="w-4 h-4 cursor-pointer"
                          />
                          <label
                            htmlFor={`true-${question.id}`}
                            className="text-sm text-gray-600"
                          >
                            True
                          </label>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            id={`false-${question.id}`}
                            name={`tf-${question.id}`}
                            checked={question.correctAnswer === 1}
                            onChange={() => handleCorrectAnswerChange(question.id, 1)}
                            className="w-4 h-4 cursor-pointer"
                          />
                          <label
                            htmlFor={`false-${question.id}`}
                            className="text-sm text-gray-600"
                          >
                            False
                          </label>
                        </div>
                        {questionErrors[question.id]?.correctAnswer && (
                          <p className="text-xs text-red-600 mt-1">
                            {questionErrors[question.id].correctAnswer}
                          </p>
                        )}
                      </fieldset>
                    )}

                    {question.type === "essay" && (
                      <div className="ml-8 p-3 bg-gray-50 border border-gray-200 rounded text-sm text-gray-600">
                        Essay question - students will provide a written response
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-primary to-Tertiary text-white rounded-lg p-6">
              <h2 className="text-xl font-bold mb-2">Select Students</h2>
              <p className="text-sm text-purple-100">
                Choose who can take this exam
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="studentSelection"
                    checked={formData.studentSelectionType === "all"}
                    onChange={() => {
                      setFormData({ ...formData, studentSelectionType: "all" });
                      setErrors(prev => ({ ...prev, students: undefined }));
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">All Students ({MOCK_STUDENTS.length})</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="studentSelection"
                    checked={formData.studentSelectionType === "specific"}
                    onChange={() => {
                      setFormData({ ...formData, studentSelectionType: "specific" });
                      setErrors(prev => ({ ...prev, students: undefined }));
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">Specific Students</span>
                </label>
              </div>

              {formData.studentSelectionType === "specific" && (
                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-900">
                      Selected Students: {selectedStudents.length}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={handleAddAllStudents}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        disabled={availableStudents.length === 0}
                      >
                        Add All
                      </button>
                      <button
                        onClick={handleRemoveAllStudents}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                        disabled={selectedStudents.length === 0}
                      >
                        Remove All
                      </button>
                    </div>
                  </div>

                  {errors.students && (
                    <p className="text-sm text-red-600 mb-4">{errors.students}</p>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {/* Available Students */}
                    <div className="border rounded-lg p-3">
                      <h4 className="font-medium text-gray-700 mb-3">Available Students</h4>
                      
                      {/* Search and filter */}
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
                          {uniqueClasses.map(cls => (
                            <option key={cls} value={cls}>{cls}</option>
                          ))}
                        </select>
                        
                        {/* Class quick add buttons */}
                        <div className="flex flex-wrap gap-2">
                          {uniqueClasses.map(cls => {
                            const countInClass = availableStudents.filter(s => s.class === cls).length;
                            return countInClass > 0 && (
                              <button
                                key={cls}
                                onClick={() => handleAddByClass(cls)}
                                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                              >
                                Add {cls} ({countInClass})
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Students list */}
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {getFilteredAvailableStudents().length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">
                            No students available
                          </p>
                        ) : (
                          getFilteredAvailableStudents().map(student => (
                            <div
                              key={student.id}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100"
                            >
                              <div>
                                <p className="text-sm font-medium">{student.name}</p>
                                <p className="text-xs text-gray-500">
                                  {student.id} • {student.class} • {student.rollNumber}
                                </p>
                              </div>
                              <button
                                onClick={() => handleAddStudent(student)}
                                className="text-blue-600 hover:text-blue-800"
                                title="Add student"
                              >
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
                          <p className="text-sm text-gray-500 text-center py-4">
                            No students selected
                          </p>
                        ) : (
                          selectedStudents.map(student => (
                            <div
                              key={student.id}
                              className="flex items-center justify-between p-2 bg-blue-50 rounded hover:bg-blue-100"
                            >
                              <div>
                                <p className="text-sm font-medium">{student.name}</p>
                                <p className="text-xs text-gray-500">
                                  {student.id} • {student.class} • {student.rollNumber}
                                </p>
                              </div>
                              <button
                                onClick={() => handleRemoveStudent(student)}
                                className="text-red-600 hover:text-red-800"
                                title="Remove student"
                              >
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
                    This exam will be available to all {MOCK_STUDENTS.length} students.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 flex items-start gap-4">
              <Shield
                className="w-8 h-8 flex-shrink-0 mt-1"
                aria-hidden="true"
              />
              <div>
                <h2 className="text-xl font-bold">
                  Anti-Cheating Configuration
                </h2>
                <p className="text-sm text-blue-100 mt-1">
                  Configure proctoring features based on your exam requirements
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto" role="list">
              {securitySettings.map((feature) => (
                <div
                  key={feature.id}
                  className="border border-gray-200 rounded-lg p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  role="listitem"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex-shrink-0 mt-1" aria-hidden="true">
                      {feature.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900">
                          {feature.name}
                        </h3>
                        {feature.recommended && (
                          <span
                            className="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded"
                            aria-label="Recommended feature"
                          >
                            Recommended
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {feature.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex-shrink-0 ml-4">
                    <button
                      onClick={() => handleToggleSecurityFeature(feature.id)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        feature.enabled ? "bg-blue-500" : "bg-gray-300"
                      }`}
                      aria-label={`${feature.enabled ? "Disable" : "Enable"} ${
                        feature.name
                      }`}
                      {...(feature.enabled ? { "aria-pressed": true } : {})}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          feature.enabled ? "translate-x-6" : "translate-x-1"
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {getActiveFeatures().length > 0 && (
              <div
                className="bg-blue-50 border border-blue-200 rounded-lg p-4"
                role="region"
                aria-label="Active features summary"
              >
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle
                    className="w-5 h-5 text-blue-600"
                    aria-hidden="true"
                  />
                  <h3 className="font-semibold text-gray-900">
                    Active Features Summary
                  </h3>
                </div>
                <div
                  className="flex flex-wrap gap-2"
                  role="list"
                  aria-label="Active features list"
                >
                  {getActiveFeatures().map((feature, idx) => (
                    <span
                      key={idx}
                      className="inline-block px-3 py-1 bg-blue-200 text-blue-800 text-xs font-medium rounded-full"
                      role="listitem"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-4">
            <div className="bg-green-600 text-white rounded-lg p-6 flex items-start gap-4">
              <div>
                <h2 className="text-xl font-bold">Review Your Exam</h2>
                <p className="text-sm text-green-100 mt-1">
                  Please review all details before publishing
                </p>
              </div>
            </div>

            <div
              className="border border-gray-300 rounded-lg p-6"
              role="region"
              aria-label="Exam details"
            >
              <h3 className="font-bold text-gray-900 mb-4">Exam Details</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Title</p>
                  <p className="font-semibold text-gray-900">
                    {formData.examTitle || "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Class</p>
                  <p className="font-semibold text-gray-900">
                    {instructorClasses.find(c => String(c.id) === formData.selectedClass)?.name || "Not selected"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Duration</p>
                  <p className="font-semibold text-gray-900">
                    {formData.duration} minutes
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Marks</p>
                  <p className="font-semibold text-gray-900">
                    {getTotalMarks()} (Calculated from questions)
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Start Date & Time
                  </p>
                  <p className="font-semibold text-gray-900">
                    {formData.startDate && formData.startTime
                      ? `${formData.startDate} ${formData.startTime}`
                      : "Not specified"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">End Date & Time</p>
                  <p className="font-semibold text-gray-900">
                    {formData.endDate && formData.endTime
                      ? `${formData.endDate} ${formData.endTime}`
                      : "Not specified"}
                  </p>
                </div>
              </div>
            </div>

            <div
              className="border border-gray-300 rounded-lg p-6"
              role="region"
              aria-label="Questions summary"
            >
              <h3 className="font-bold text-gray-900 mb-4">Questions</h3>
              <p className="text-sm text-gray-600">
                Total Questions: {questions.length}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Total Marks: {getTotalMarks()}
              </p>
            </div>

            <div
              className="border border-gray-300 rounded-lg p-6"
              role="region"
              aria-label="Student assignment"
            >
              <h3 className="font-bold text-gray-900 mb-4">Assigned To</h3>
              <p className="text-sm text-gray-600">
                {formData.studentSelectionType === "all" 
                  ? `All Students (${MOCK_STUDENTS.length} students)` 
                  : `${selectedStudents.length} Specific Student${selectedStudents.length !== 1 ? 's' : ''}`}
              </p>
              {formData.studentSelectionType === "specific" && selectedStudents.length > 0 && (
                <div className="mt-3 max-h-32 overflow-y-auto">
                  {selectedStudents.map(student => (
                    <div key={student.id} className="text-sm text-gray-600 py-1 border-b last:border-0">
                      {student.name} ({student.id}) - {student.class}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div
              className="border border-gray-300 rounded-lg p-6"
              role="region"
              aria-label="Security settings"
            >
              <h3 className="font-bold text-gray-900 mb-4">
                Security Settings
              </h3>
              <div
                className="flex flex-wrap gap-2"
                role="list"
                aria-label="Active security features"
              >
                {getActiveFeatures().length > 0 ? (
                  getActiveFeatures().map((feature, idx) => (
                    <span
                      key={idx}
                      className="inline-block px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded-full"
                      role="listitem"
                    >
                      {feature}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-gray-600">
                    No security features enabled
                  </p>
                )}
              </div>
            </div>

            {formData.description && (
              <div
                className="border border-gray-300 rounded-lg p-6"
                role="region"
                aria-label="Description"
              >
                <h3 className="font-bold text-gray-900 mb-2">Description</h3>
                <p className="text-sm text-gray-600">{formData.description}</p>
              </div>
            )}

            {formData.instructions && (
              <div
                className="border border-gray-300 rounded-lg p-6"
                role="region"
                aria-label="Instructions"
              >
                <h3 className="font-bold text-gray-900 mb-2">
                  Instructions for Students
                </h3>
                <p className="text-sm text-gray-600">{formData.instructions}</p>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${
              currentStep === 1
                ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            aria-label="Go to previous step"
          >
            Previous
          </button>
          <button
            onClick={handleNextStep}
            disabled={isSubmitting}
            className={`px-6 py-2 rounded-md font-medium text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              currentStep === 5
                ? "bg-green-600 hover:bg-green-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            aria-label={currentStep === 5 ? "Publish exam" : "Go to next step"}
          >
            {isSubmitting ? "Publishing..." : currentStep === 5 ? "Publish Exam" : "Next Step"}
          </button>
        </div>
      </div>
    </div>
  );
}
