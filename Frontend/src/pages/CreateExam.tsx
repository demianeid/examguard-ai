import { useState } from "react";
import type { ReactNode } from "react";
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
} from "lucide-react";

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

export default function CreateExam() {
  const [currentStep, setCurrentStep] = useState<number>(1);
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
    Partial<Record<keyof ExamFormData, string>>
  >({});
  const [questionErrors, setQuestionErrors] = useState<QuestionErrors>({});

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

  const steps: Step[] = [
    { number: 1, label: "Basic Info" },
    { number: 2, label: "Questions" },
    { number: 3, label: "Security Settings" },
    { number: 4, label: "Review" },
  ];

  const questionTypes: QuestionOption[] = [
    { value: "multiple-choice", label: "Multiple Choice" },
    { value: "true-false", label: "True/False" },
    { value: "essay", label: "Essay" },
  ];

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
    // Clear errors for the new question
    setQuestionErrors((prev) => ({ ...prev, [newQuestion.id]: {} }));
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
    // Remove errors for deleted question
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
    questions.map((q) => (q.id === id ? { ...q, [field]: value } : q))
  );
  // Only "text" has a corresponding error field
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
    // Clear options error when user starts typing
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
    // Clear correct answer error when user selects an answer
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

  const getActiveFeatures = () => {
    return securitySettings.filter((f) => f.enabled).map((f) => f.name);
  };

  const validateStep1 = (): boolean => {
    const newErrors: Partial<Record<keyof ExamFormData, string>> = {};

    if (!formData.examTitle.trim()) {
      newErrors.examTitle = "Exam title is required";
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = (): boolean => {
    const newQuestionErrors: QuestionErrors = {};
    let isValid = true;

    if (questions.length === 0) {
      // Show a general error when no questions are added
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
        // Scroll to the first error
        setTimeout(() => {
          const firstError = document.querySelector('[data-error="true"]');
          if (firstError) {
            firstError.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 100);
        return;
      }
    }

    if (currentStep === 4) {
      handlePublish();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePublish = () => {
    const examData = {
      ...formData,
      questions,
      securityFeatures: securitySettings.filter((f) => f.enabled),
      totalQuestions: questions.length,
      totalMarks: questions.reduce(
        (sum, q) => sum + parseInt(q.marks || "0"),
        0
      ),
    };

    console.log("Publishing exam:", examData);
    alert("Exam published successfully!");
  };

  const handleClose = () => {
    if (
      window.confirm(
        "Are you sure you want to close? All unsaved changes will be lost."
      )
    ) {
      window.history.back();
    }
  };

  const getTotalMarks = () => {
    return questions.reduce((sum, q) => sum + parseInt(q.marks || "0"), 0);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-3xl w-full p-8">
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

        <div className="flex items-center justify-center mb-8 gap-2">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center gap-2">
              <div className="flex  flex-col items-center">
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
                  className={`w-8 sm:w-20 h-1 transition-colors ${
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
              <div className="space-y-4 ">
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

        {currentStep === 4 && (
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
            className={`px-6 py-2 rounded-md font-medium text-white transition-colors ${
              currentStep === 4
                ? "bg-green-600 hover:bg-green-700"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            aria-label={currentStep === 4 ? "Publish exam" : "Go to next step"}
          >
            {currentStep === 4 ? "Publish Exam" : "Next Step"}
          </button>
        </div>
      </div>
    </div>
  );
}