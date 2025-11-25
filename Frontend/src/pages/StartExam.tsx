import React, { useState, useEffect } from 'react';
import { Clock, FileText, CheckCircle, Circle, ChevronLeft, ChevronRight, Settings, Camera, Mic, Wifi, Monitor, Flag, AlertTriangle, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Question {
  en: string;
  ar: string;
  options: { en: string; ar: string; }[];
  points: number;
}

interface SystemCheck {
  icon: React.ComponentType<any>;
  title: string;
  description: string;
  status: string;
}

const ExamInterface: React.FC = () => {
  const [currentView, setCurrentView] = useState<'rules' | 'system-check' | 'exam'>('rules');
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(6402); // 01:46:42 in seconds
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Questions data with translations
  const questions: Question[] = [
    {
      en: "What is the time complexity of binary search in a sorted array?",
      ar: "ما هي التعقيد الزمني للبحث الثنائي في مصفوفة مرتبة؟",
      options: [
        { en: "O(n)", ar: "O(n)" },
        { en: "O(log n)", ar: "O(log n)" },
        { en: "O(n log n)", ar: "O(n log n)" },
        { en: "O(1)", ar: "O(1)" }
      ],
      points: 5
    },
    {
      en: "Which data structure uses LIFO principle?",
      ar: "أي هيكل بيانات يستخدم مبدأ LIFO؟",
      options: [
        { en: "Queue", ar: "طابور" },
        { en: "Stack", ar: "كومة" },
        { en: "Array", ar: "مصفوفة" },
        { en: "Tree", ar: "شجرة" }
      ],
      points: 5
    },
    // Add more questions to reach 20
    ...Array(18).fill(null).map((_, i) => ({
      en: `Sample Question ${i + 3}`,
      ar: `سؤال نموذجي ${i + 3}`,
      options: [
        { en: "Option 1", ar: "خيار 1" },
        { en: "Option 2", ar: "خيار 2" },
        { en: "Option 3", ar: "خيار 3" },
        { en: "Option 4", ar: "خيار 4" }
      ],
      points: 5
    }))
  ];

  const [answers, setAnswers] = useState<(number | null)[]>(Array(20).fill(null));
  const [flagged, setFlagged] = useState<boolean[]>(Array(20).fill(false));

  const examRules = [
    "You must remain in camera view at all times during the exam",
    "Looking away from screen for extended periods will trigger warnings",
    "Multiple faces detected in camera will be flagged as violation",
    "Tab switching and leaving the exam window is strictly prohibited",
    "External devices (phones, tablets, books) must not be visible",
    "No communication with others during the exam",
    "Screen recording will be active throughout the exam",
    "You cannot pause the exam once started",
    "Auto-submit will occur when time expires"
  ];

  const systemChecks: SystemCheck[] = [
    {
      icon: Camera,
      title: 'Camera Access',
      description: 'Camera detected and working properly',
      status: 'success'
    },
    {
      icon: Mic,
      title: 'Microphone Access',
      description: 'Microphone is functioning correctly',
      status: 'success'
    },
    {
      icon: Wifi,
      title: 'Internet Connection',
      description: 'Strong internet connection (45 Mbps)',
      status: 'success'
    },
    {
      icon: Monitor,
      title: 'Browser Compatibility',
      description: 'Browser is compatible and up to date',
      status: 'success'
    },
    {
      icon: Monitor,
      title: 'Screen Sharing',
      description: 'Screen sharing permissions granted',
      status: 'success'
    }
  ];

  // Calculate counts for the modal
  const answeredCount = answers.filter(answer => answer !== null).length;
  const unansweredCount = 20 - answeredCount;
  const flaggedCount = flagged.filter(flag => flag).length;

  // Timer countdown
  useEffect(() => {
    if (currentView === 'exam') {
      const timer = setInterval(() => {
        setTimeRemaining(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentView]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleAnswerSelect = (index: number) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = index;
    setAnswers(newAnswers);
    setSelectedAnswer(index);
  };

  const handleNext = () => {
    if (currentQuestion < 19) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(answers[currentQuestion + 1]);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(answers[currentQuestion - 1]);
    }
  };

  const handleSubmitConfirm = () => {
    // Handle exam submission logic here
    console.log('Exam submitted with answers:', answers);
    alert('Exam submitted successfully!');
    setShowSubmitModal(false);
    setCurrentView('rules'); // Go back to rules screen or wherever appropriate
  };

  const toggleFlag = () => {
    const newFlagged = [...flagged];
    newFlagged[currentQuestion] = !newFlagged[currentQuestion];
    setFlagged(newFlagged);
  };

  const getQuestionStatus = (index: number): 'answered' | 'flagged' | 'unanswered' => {
    if (answers[index] !== null) return 'answered';
    if (flagged[index]) return 'flagged';
    return 'unanswered';
  };

  // System Check Component
  if (currentView === 'system-check') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Settings className="w-8 h-8 text-blue-600 animate-spin-slow" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">System Check</h1>
                <p className="text-gray-600">Verifying your system meets exam requirements</p>
              </div>
            </div>
            <button 
              onClick={() => setCurrentView('rules')}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
              title="Back to rules"
            >
              <ChevronLeft size={20} />
              <span>Back</span>
            </button>
          </div>

          {/* Check Items */}
          <div className="space-y-3 mb-6">
            {systemChecks.map((check, index) => {
              const IconComponent = check.icon;
              return (
                <div
                  key={index}
                  className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <IconComponent className="w-6 h-6 text-gray-700" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{check.title}</h3>
                      <p className="text-sm text-gray-600">{check.description}</p>
                    </div>
                  </div>
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              );
            })}
          </div>

          {/* Success Message */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <h2 className="text-xl font-bold text-gray-900">All Systems Ready!</h2>
                <p className="text-green-700">Your device meets all requirements to start the exam</p>
              </div>
            </div>

            {/* Start Button */}
            <button 
              onClick={() => setCurrentView('exam')}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-3 transition-colors"
              title="Start exam now"
            >
              <Clock className="w-5 h-5" />
              Start Exam Now
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <style>{`
          @keyframes spin-slow {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
          .animate-spin-slow {
            animation: spin-slow 3s linear infinite;
          }
        `}</style>
      </div>
    );
  }

  // Exam Interface Component
  if (currentView === 'exam') {
    const currentQ = questions[currentQuestion];
    const translations = {
      en: {
        title: "Midterm Exam - Data Structures",
        instructor: "Dr. Ahmed Hassan",
        total: "Total: 100 Points",
        timeRemaining: "Time Remaining",
        question: "Question",
        of: "of",
        points: "points",
        previous: "Previous",
        next: "Next",
        submit: "Submit Exam",
        navigation: "Questions Navigation",
        answered: "Answered",
        flagged: "Flagged",
        unanswered: "Unanswered"
      },
      ar: {
        title: "امتحان منتصف الفصل - هياكل البيانات",
        instructor: "د. أحمد حسن",
        total: "المجموع: 100 نقطة",
        timeRemaining: "الوقت المتبقي",
        question: "سؤال",
        of: "من",
        points: "نقاط",
        previous: "السابق",
        next: "التالي",
        submit: "تسليم الامتحان",
        navigation: "التنقل بين الأسئلة",
        answered: "تم الإجابة",
        flagged: "مميز",
        unanswered: "غير مجاب"
      }
    };

    const t = translations[language];
    const isLastQuestion = currentQuestion === 19;

    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-blue-600 text-white rounded-xl p-6 mb-6 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold mb-1">{t.title}</h1>
              <p className="text-blue-100">{t.instructor} • {t.total}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end mb-1">
                <Clock className="w-5 h-5" />
                <span className="text-sm">{t.timeRemaining}</span>
              </div>
              <div className="text-3xl font-bold">{formatTime(timeRemaining)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Question Section */}
            <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                    {t.question} {currentQuestion + 1} {t.of} 20
                  </span>
                  <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                    {currentQ.points} {t.points}
                  </span>
                </div>
                <button
                  onClick={toggleFlag}
                  className={`p-2 rounded-lg transition-colors ${
                    flagged[currentQuestion] 
                      ? 'bg-yellow-100 text-yellow-700' 
                      : 'bg-gray-100 text-gray-400 hover:text-gray-600'
                  }`}
                  title={flagged[currentQuestion] ? "Unflag question" : "Flag question"}
                >
                  <Flag className="w-5 h-5" fill={flagged[currentQuestion] ? 'currentColor' : 'none'} />
                </button>
              </div>

              <h2 className="text-xl font-semibold text-gray-900 mb-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                {currentQ[language]}
              </h2>

              {/* Options */}
              <div className="space-y-3 mb-8">
                {currentQ.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedAnswer === index
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
                    title={`Select option ${index + 1}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedAnswer === index
                          ? 'border-blue-600'
                          : 'border-gray-300'
                      }`}>
                        {selectedAnswer === index && (
                          <div className="w-3 h-3 rounded-full bg-blue-600" />
                        )}
                      </div>
                      <span className="text-gray-700">{option[language]}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Navigation Buttons */}
              <div className="flex justify-between">
                <button
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  title="Previous question"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {t.previous}
                </button>
                <button
                  onClick={isLastQuestion ? () => setShowSubmitModal(true) : handleNext}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg text-white hover:bg-blue-700 transition-colors ${
                    isLastQuestion 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                  title={isLastQuestion ? "Submit exam" : "Next question"}
                >
                  {isLastQuestion ? t.submit : t.next}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Navigation Panel */}
            <div className="bg-white rounded-xl p-6 shadow-sm flex flex-col" style={{ height: 'calc(100vh - 100px)' }}>
              <h3 className="font-semibold text-gray-900 mb-4">{t.navigation}</h3>
              <div className="grid grid-cols-4 gap-2 mb-6 flex-shrink-0">
                {Array.from({ length: 20 }, (_, i) => {
                  const status = getQuestionStatus(i);
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setCurrentQuestion(i);
                        setSelectedAnswer(answers[i]);
                      }}
                      className={`w-full aspect-square rounded-lg font-medium transition-all ${
                        i === currentQuestion
                          ? 'ring-2 ring-blue-600 ring-offset-2'
                          : ''
                      } ${
                        status === 'answered'
                          ? 'bg-green-500 text-white hover:bg-green-600'
                          : status === 'flagged'
                          ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-500'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                      title={`Question ${i + 1} - ${status}`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="space-y-2 text-sm mt-auto">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded" />
                  <span className="text-gray-600">{t.answered} ({answeredCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-400 rounded" />
                  <span className="text-gray-600">{t.flagged} ({flaggedCount})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-200 rounded" />
                  <span className="text-gray-600">{t.unanswered} ({unansweredCount})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Modal */}
          {showSubmitModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
                <div className="flex items-start gap-3 mb-4">
                  <div className="bg-orange-100 p-2 rounded-full">
                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Submit Exam?</h2>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Total Questions:</span>
                    <span className="font-semibold text-gray-900">20</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Answered:</span>
                    <span className="font-semibold text-green-600">{answeredCount}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Unanswered:</span>
                    <span className="font-semibold text-red-600">{unansweredCount}</span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Flagged:</span>
                    <span className="font-semibold text-yellow-600">{flaggedCount}</span>
                  </div>
                </div>

                {unansweredCount > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-orange-800">
                      You have unanswered questions. Are you sure you want to submit?
                    </p>
                  </div>
                )}

                <p className="text-sm text-gray-600 mb-6">
                  Once submitted, you cannot change your answers. Make sure you've reviewed all questions.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowSubmitModal(false)}
                    className="flex-1 px-6 py-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitConfirm}
                    className="flex-1 px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Submit
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Rules Interface Component (Default View)
  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Back Button */}
        <Link to="/classes/1/exams" className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors">
          <ChevronLeft size={20} />
          <span>Back</span>
        </Link>

        {/* Main Header Card */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 mb-6 shadow-lg text-white">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            Midterm Exam - Data Structures & Algorithms
          </h1>
          <p className="text-blue-100 mb-6">CS201 • Dr. Ahmed Hassan</p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2 text-blue-100">
                <Clock size={18} />
                <span className="text-sm">Duration</span>
              </div>
              <p className="text-2xl font-bold">120 minutes</p>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2 text-blue-100">
                <FileText size={18} />
                <span className="text-sm">Total Questions</span>
              </div>
              <p className="text-2xl font-bold">20</p>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2 text-blue-100">
                <FileText size={18} />
                <span className="text-sm">Total Marks</span>
              </div>
              <p className="text-2xl font-bold">100</p>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2 text-blue-100">
                <CheckCircle size={18} />
                <span className="text-sm">Passing</span>
              </div>
              <p className="text-2xl font-bold">50</p>
            </div>
          </div>
        </div>

        {/* Exam Schedule Card */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Clock className="text-purple-600" size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Exam Schedule</h2>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Date & Time</p>
              <p className="font-bold text-gray-900">October 15, 2025</p>
              <p className="text-gray-600">10:00 AM</p>
            </div>

            <div>
              <p className="text-sm text-gray-500 mb-1">Exam Window</p>
              <p className="font-bold text-gray-900">2 Hours Available</p>
              <p className="text-gray-600 text-sm">Must complete within 120 minutes</p>
            </div>
          </div>
        </div>

        {/* Exam Rules Card */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-md">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-orange-100 p-2 rounded-lg">
              <FileText className="text-orange-600" size={24} />
            </div>
            <h2 className="text-xl font-bold text-gray-800">Exam Rules & Guidelines</h2>
          </div>

          <div className="space-y-3">
            {examRules.map((rule, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-gray-700 text-sm">{rule}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Agreement Checkbox */}
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToRules}
              onChange={(e) => setAgreedToRules(e.target.checked)}
              className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <div>
              <p className="font-semibold text-gray-900 mb-2">
                I have read and agree to all the exam rules and guidelines
              </p>
              <p className="text-sm text-gray-600">
                By checking this box, you acknowledge that you understand the proctoring requirements and agree to follow all exam rules. Violations may result in exam cancellation and disciplinary action.
              </p>
            </div>
          </label>
        </div>

        {/* Proceed Button */}
        <button
          onClick={() => setCurrentView('system-check')}
          disabled={!agreedToRules}
          className={`w-full py-4 px-6 rounded-xl font-semibold text-white text-lg flex items-center justify-center gap-2 transition-all ${
            agreedToRules
              ? 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
          title={agreedToRules ? "Proceed to system check" : "Please agree to the rules first"}
        >
          Proceed To System Check
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default ExamInterface;