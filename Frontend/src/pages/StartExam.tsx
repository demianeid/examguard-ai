import React, { useState, useEffect, useRef } from 'react';
import { Clock, FileText, CheckCircle, ChevronLeft, ChevronRight, Settings, Camera, Mic, Wifi, Monitor, Flag, AlertTriangle, Send } from 'lucide-react';

const ExamInterface: React.FC = () => {
  const [currentView, setCurrentView] = useState<'rules' | 'system-check' | 'exam'>('rules');
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(6402);
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  
  const [systemCheckStatus, setSystemCheckStatus] = useState<{[key: string]: 'checking' | 'success' | 'failed'}>({
    camera: 'checking',
    microphone: 'checking',
    internet: 'checking',
    browser: 'checking',
    screen: 'checking'
  });
  const [checkingComplete, setCheckingComplete] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [violationScore, setViolationScore] = useState(0);
  const [proctorAlerts, setProctorAlerts] = useState<string[]>([]);
  const [examTerminated, setExamTerminated] = useState(false);
  const [terminationReason, setTerminationReason] = useState('');

  const questions = [
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
    "Auto-submit will occur when time expires",
    "Reaching 10 violation points will result in automatic exam termination"
  ];

  const answeredCount = answers.filter(a => a !== null).length;
  const unansweredCount = 20 - answeredCount;
  const flaggedCount = flagged.filter(f => f).length;

  useEffect(() => {
    if (currentView === 'system-check') {
      setSystemCheckStatus({
        camera: 'checking',
        microphone: 'checking',
        internet: 'checking',
        browser: 'checking',
        screen: 'checking'
      });
      setCheckingComplete(false);

      setTimeout(async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop());
          setSystemCheckStatus(prev => ({ ...prev, camera: 'success' }));
        } catch {
          setSystemCheckStatus(prev => ({ ...prev, camera: 'failed' }));
        }
      }, 1000);

      setTimeout(async () => {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
          setSystemCheckStatus(prev => ({ ...prev, microphone: 'success' }));
        } catch {
          setSystemCheckStatus(prev => ({ ...prev, microphone: 'failed' }));
        }
      }, 2000);

      setTimeout(() => {
        const isOnline = navigator.onLine;
        setSystemCheckStatus(prev => ({ ...prev, internet: isOnline ? 'success' : 'failed' }));
      }, 3000);

      setTimeout(() => {
        setSystemCheckStatus(prev => ({ ...prev, browser: 'success' }));
      }, 4000);

      setTimeout(async () => {
        try {
          const stream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
          stream.getTracks().forEach((track: any) => track.stop());
          setSystemCheckStatus(prev => ({ ...prev, screen: 'success' }));
        } catch {
          setSystemCheckStatus(prev => ({ ...prev, screen: 'failed' }));
        } finally {
          setCheckingComplete(true);
        }
      }, 5000);
    }
  }, [currentView]);

  useEffect(() => {
    if (currentView === 'exam') {
      const timer = setInterval(() => {
        setTimeRemaining(prev => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentView]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
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

  const toggleFlag = () => {
    const newFlagged = [...flagged];
    newFlagged[currentQuestion] = !newFlagged[currentQuestion];
    setFlagged(newFlagged);
  };

  const getQuestionStatus = (index: number): 'answered'|'flagged'|'unanswered' => {
    if (answers[index] !== null) return 'answered';
    if (flagged[index]) return 'flagged';
    return 'unanswered';
  };

  const handleSubmitConfirm = () => {
    console.log('Exam submitted:', answers);
    alert('Exam submitted successfully!');
  };

  // Function to handle exam termination
  const terminateExam = (reason: string) => {
    setExamTerminated(true);
    setTerminationReason(reason);
    
    // Log the termination
    console.log(`Exam terminated due to: ${reason}`);
    console.log('Violation score reached:', violationScore);
    console.log('Final answers:', answers);
    
    // In a real app, you would send this data to the server
    // For now, we'll just show an alert and prevent further interaction
  };

  // Effect to check for violation score reaching 10
  useEffect(() => {
    if (violationScore >= 10 && currentView === 'exam' && !examTerminated) {
      terminateExam("Excessive violations detected");
    }
  }, [violationScore, currentView, examTerminated]);

  const retrySystemCheck = async () => {
    setCheckingComplete(false);
    setSystemCheckStatus({
      camera: 'checking',
      microphone: 'checking',
      internet: 'checking',
      browser: 'checking',
      screen: 'checking'
    });
    
    const retryChecks = async () => {
      try {
        // Camera check
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop());
          setSystemCheckStatus(prev => ({ ...prev, camera: 'success' }));
        } catch {
          setSystemCheckStatus(prev => ({ ...prev, camera: 'failed' }));
        }
        
        // Microphone check
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
          setSystemCheckStatus(prev => ({ ...prev, microphone: 'success' }));
        } catch {
          setSystemCheckStatus(prev => ({ ...prev, microphone: 'failed' }));
        }
        
        // Internet check
        const isOnline = navigator.onLine;
        setSystemCheckStatus(prev => ({ ...prev, internet: isOnline ? 'success' : 'failed' }));
        
        // Browser check - always success for modern browsers
        setSystemCheckStatus(prev => ({ ...prev, browser: 'success' }));
        
        // Screen sharing check
        try {
          const stream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
          stream.getTracks().forEach((track: any) => track.stop());
          setSystemCheckStatus(prev => ({ ...prev, screen: 'success' }));
        } catch {
          setSystemCheckStatus(prev => ({ ...prev, screen: 'failed' }));
        }
      } finally {
        setCheckingComplete(true);
      }
    };
    
    setTimeout(retryChecks, 500);
  };

  const retrySpecificCheck = async (checkKey: string) => {
    setSystemCheckStatus(prev => ({ ...prev, [checkKey]: 'checking' }));
    
    switch(checkKey) {
      case 'camera':
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach(track => track.stop());
          setSystemCheckStatus(prev => ({ ...prev, camera: 'success' }));
        } catch {
          setSystemCheckStatus(prev => ({ ...prev, camera: 'failed' }));
        }
        break;
      case 'microphone':
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach(track => track.stop());
          setSystemCheckStatus(prev => ({ ...prev, microphone: 'success' }));
        } catch {
          setSystemCheckStatus(prev => ({ ...prev, microphone: 'failed' }));
        }
        break;
      case 'internet':
        const isOnline = navigator.onLine;
        setSystemCheckStatus(prev => ({ ...prev, internet: isOnline ? 'success' : 'failed' }));
        break;
      case 'screen':
        try {
          const stream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
          stream.getTracks().forEach((track: any) => track.stop());
          setSystemCheckStatus(prev => ({ ...prev, screen: 'success' }));
        } catch {
          setSystemCheckStatus(prev => ({ ...prev, screen: 'failed' }));
        }
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (currentView !== 'exam') return;

    navigator.mediaDevices.getUserMedia({ video:true })
      .then(stream => { if(videoRef.current) videoRef.current.srcObject = stream; })
      .catch(()=>console.error("Camera access denied"));

    const mockAlerts = setInterval(() => {
      const randomAlert = Math.random();
      if (randomAlert > 0.7 && !examTerminated) {
        const alerts = ['Face not detected', 'Multiple faces detected', 'Looking away from screen'];
        const randomAlertMsg = alerts[Math.floor(Math.random() * alerts.length)];
        setProctorAlerts([randomAlertMsg]);
        setViolationScore(prev => prev + 1);
      }
    }, 8000);

    return () => {
      clearInterval(mockAlerts);
      wsRef.current?.close();
    };
  }, [currentView, examTerminated]);

  if (currentView === 'rules') {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => console.log('Back')} className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors">
            <ChevronLeft size={20} />
            <span>Back</span>
          </button>

          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 mb-6 shadow-lg text-white">
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

          <button
            onClick={() => setCurrentView('system-check')}
            disabled={!agreedToRules}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-white text-lg flex items-center justify-center gap-2 transition-all ${
              agreedToRules
                ? 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            Proceed To System Check
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  if (currentView === 'system-check') {
    const systemChecks = [
      { 
        key: 'camera',
        icon: Camera, 
        title: 'Camera Access', 
        checkingDesc: 'Checking camera permissions...',
        successDesc: 'Camera detected and working properly',
        failedDesc: 'Camera access denied',
        troubleshooting: 'Allow camera access in browser settings and ensure no other app is using the camera'
      },
      { 
        key: 'microphone',
        icon: Mic, 
        title: 'Microphone Access', 
        checkingDesc: 'Testing microphone...',
        successDesc: 'Microphone is functioning correctly',
        failedDesc: 'Microphone not accessible',
        troubleshooting: 'Check microphone permissions and ensure it\'s not muted'
      },
      { 
        key: 'internet',
        icon: Wifi, 
        title: 'Internet Connection', 
        checkingDesc: 'Testing connection speed...',
        successDesc: 'Strong internet connection detected',
        failedDesc: 'Weak or unstable connection',
        troubleshooting: 'Check your internet connection and try again'
      },
      { 
        key: 'browser',
        icon: Monitor, 
        title: 'Browser Compatibility', 
        checkingDesc: 'Verifying browser version...',
        successDesc: 'Browser is compatible and up to date',
        failedDesc: 'Browser not supported',
        troubleshooting: 'Use the latest version of Chrome, Firefox, or Edge'
      },
      { 
        key: 'screen',
        icon: Monitor, 
        title: 'Screen Sharing', 
        checkingDesc: 'Requesting screen sharing permissions...',
        successDesc: 'Screen sharing permissions granted',
        failedDesc: 'Screen sharing permission denied',
        troubleshooting: 'Allow screen sharing when prompted by your browser'
      }
    ];

    const allChecksSuccess = Object.values(systemCheckStatus).every(status => status === 'success');
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl w-full">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <Settings className="w-8 h-8 text-blue-600 animate-spin" style={{animation: 'spin 3s linear infinite'}} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">System Check</h1>
                <p className="text-gray-600">Verifying your system meets exam requirements</p>
              </div>
            </div>
            <button 
              onClick={() => setCurrentView('rules')}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
            >
              <ChevronLeft size={20} />
              <span>Back</span>
            </button>
          </div>

          <div className="space-y-3 mb-6">
            {systemChecks.map((check) => {
              const IconComponent = check.icon;
              const status = systemCheckStatus[check.key];
              
              return (
                <div
                  key={check.key}
                  className={`rounded-xl p-4 flex items-center justify-between border transition-all ${
                    status === 'success' 
                      ? 'bg-green-50 border-green-200' 
                      : status === 'failed'
                      ? 'bg-red-50 border-red-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <IconComponent className={`w-6 h-6 ${
                      status === 'checking' ? 'text-gray-400 animate-pulse' : 'text-gray-700'
                    }`} />
                    <div>
                      <h3 className="font-semibold text-gray-900">{check.title}</h3>
                      <p className="text-sm text-gray-600">
                        {status === 'checking' && check.checkingDesc}
                        {status === 'success' && check.successDesc}
                        {status === 'failed' && check.failedDesc}
                      </p>
                      {status === 'failed' && (
                        <p className="text-xs text-gray-500 mt-1">{check.troubleshooting}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {status === 'checking' && (
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    )}
                    {status === 'success' && (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    )}
                    {status === 'failed' && (
                      <>
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                        <button
                          onClick={() => retrySpecificCheck(check.key)}
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline px-2 py-1 rounded hover:bg-blue-50"
                        >
                          Retry
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {checkingComplete && allChecksSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-4 animate-fadeIn">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">All Systems Ready!</h2>
                  <p className="text-green-700">Your device meets all requirements to start the exam</p>
                </div>
              </div>

              <button 
                onClick={() => setCurrentView('exam')}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-3 transition-colors"
              >
                <Clock className="w-5 h-5" />
                Start Exam Now
                <ChevronRight size={20} />
              </button>
            </div>
          )}
          
          {checkingComplete && !allChecksSuccess && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-4 animate-fadeIn">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">System Check Failed</h2>
                    <p className="text-red-700">Please fix the issues above before starting the exam</p>
                  </div>
                </div>
                
                <div className="mb-4 p-3 bg-white rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Failed Checks:</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    {Object.entries(systemCheckStatus).map(([key, status]) => 
                      status === 'failed' && (
                        <li key={key} className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                          <span className="capitalize">{key}: Permission denied or device not found</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setCurrentView('rules')}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-4 rounded-xl flex items-center justify-center gap-3 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back to Rules
                </button>
                <button 
                  onClick={retrySystemCheck}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-3 transition-colors"
                >
                  <Settings className="w-5 h-5" />
                  Retry System Check
                </button>
              </div>
            </div>
          )}
        </div>
        
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.5s ease-out;
          }
        `}</style>
      </div>
    );
  }

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

    // If exam is terminated, show termination screen
    if (examTerminated) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 p-8 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center">
            <div className="mb-6 flex justify-center">
              <div className="bg-red-100 p-4 rounded-full">
                <AlertTriangle className="w-16 h-16 text-red-600" />
              </div>
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Exam Terminated</h1>
            
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
              <p className="text-lg text-gray-800 mb-4">
                Your exam has been automatically terminated due to multiple violations of exam rules.
              </p>
              
              <div className="space-y-3 text-left bg-white p-4 rounded-lg">
                <div className="flex justify-between">
                  <span className="text-gray-600">Violation Score:</span>
                  <span className="font-bold text-red-600">10/10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Questions Attempted:</span>
                  <span className="font-bold text-blue-600">{answeredCount}/20</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time Remaining:</span>
                  <span className="font-bold text-gray-800">{formatTime(timeRemaining)}</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mt-4">
                Reason: {terminationReason || "Excessive violations detected"}
              </p>
            </div>
            
            <div className="text-gray-700 mb-6">
              <p className="mb-3">
                The system detected multiple violations of exam rules, including:
              </p>
              <ul className="text-left space-y-2 mb-4">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Face not detected / Multiple faces</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Looking away from screen</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span>Other prohibited activities</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-800">
                Your responses have been recorded and submitted to the exam administrator for review.
                You will be notified about any further actions via your registered email.
              </p>
            </div>
            
            <button
              onClick={() => {
                // In a real app, this would redirect to dashboard or home
                alert("Redirecting to dashboard...");
                console.log("Final answers:", answers);
                console.log("Violation score:", violationScore);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <video ref={videoRef} autoPlay muted hidden />
          <canvas ref={canvasRef} hidden />

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

          <div className="flex justify-between items-center mb-4">
            <div className="space-y-1">
              {proctorAlerts.length > 0 && (
                <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-2 rounded-md flex items-center gap-2 animate-pulse">
                  <AlertTriangle className="w-5 h-5" />
                  <span>AI Alert: {proctorAlerts[0]}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                Violation Score: 
                <span className={`ml-2 font-bold ${violationScore >= 7 ? 'text-red-600' : violationScore >= 4 ? 'text-yellow-600' : 'text-green-600'}`}>
                  {violationScore} / 10
                </span>
              </div>
              
              {violationScore >= 8 && (
                <div className="bg-red-100 border border-red-300 text-red-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Warning: High violation score</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                title='flag'
                  onClick={toggleFlag}
                  className={`p-2 rounded-lg transition-colors ${
                    flagged[currentQuestion] 
                      ? 'bg-yellow-100 text-yellow-700' 
                      : 'bg-gray-100 text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <Flag className="w-5 h-5" fill={flagged[currentQuestion] ? 'currentColor' : 'none'} />
                </button>
              </div>

              <h2 className="text-xl font-semibold text-gray-900 mb-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                {currentQ[language]}
              </h2>

              <div className="space-y-3 mb-8">
                {currentQ.options.map((option: any, index: number) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={examTerminated}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      selectedAnswer === index
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    } ${examTerminated ? 'opacity-50 cursor-not-allowed' : ''}`}
                    dir={language === 'ar' ? 'rtl' : 'ltr'}
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

              <div className="flex justify-between">
                <button
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0 || examTerminated}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {t.previous}
                </button>
                <button
                  onClick={isLastQuestion ? () => setShowSubmitModal(true) : handleNext}
                  disabled={examTerminated}
                  className={`flex items-center gap-2 px-6 py-3 rounded-lg text-white hover:bg-blue-700 transition-colors ${
                    isLastQuestion 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } ${examTerminated ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLastQuestion ? t.submit : t.next}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm flex flex-col" style={{ height: 'calc(100vh - 200px)' }}>
              <h3 className="font-semibold text-gray-900 mb-4">{t.navigation}</h3>
              <div className="grid grid-cols-4 gap-2 mb-6 flex-shrink-0">
                {Array.from({ length: 20 }, (_, i) => {
                  const status = getQuestionStatus(i);
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        if (!examTerminated) {
                          setCurrentQuestion(i);
                          setSelectedAnswer(answers[i]);
                        }
                      }}
                      disabled={examTerminated}
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
                      } ${examTerminated ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>

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
              
              {/* Violation warning */}
              {violationScore >= 8 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">Warning</span>
                  </div>
                  <p className="text-xs text-red-700">
                    You have {10 - violationScore} violation points remaining before automatic termination.
                  </p>
                </div>
              )}
            </div>
          </div>

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
                  <div className="flex justify-between py-2">
                    <span className="text-gray-600">Violation Score:</span>
                    <span className={`font-semibold ${violationScore >= 7 ? 'text-red-600' : 'text-gray-900'}`}>
                      {violationScore}/10
                    </span>
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

                {violationScore >= 5 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-800">
                      High violation score ({violationScore}/10) detected. This may affect your exam evaluation.
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

  return null;
};

export default ExamInterface;