import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, FileText, CheckCircle, ChevronLeft, ChevronRight, 
  Settings, Camera, Mic, Wifi, Monitor, Flag, AlertTriangle, 
  Send, Eye, Copy, Ban, Shield, Lock, Maximize2, Minimize2 
} from 'lucide-react';

const ExamInterface: React.FC = () => {
  const [currentView, setCurrentView] = useState<'rules' | 'system-check' | 'exam' | 'terminated'>('rules');
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(7200);
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  
  // Anti-cheating states
  const [copyAttempts, setCopyAttempts] = useState(0);
  const [rightClickAttempts, setRightClickAttempts] = useState(0);
  const [keyboardShortcutAttempts, setKeyboardShortcutAttempts] = useState(0);
  const [devToolsOpen, setDevToolsOpen] = useState(false);
  const [fullScreenActive, setFullScreenActive] = useState(false);
  const [tabFocus, setTabFocus] = useState(true);
  const [violationScore, setViolationScore] = useState(0);
  const [proctorAlerts, setProctorAlerts] = useState<string[]>([]);
  const [examTerminated, setExamTerminated] = useState(false);
  const [terminationReason, setTerminationReason] = useState('');
  const [isRequestingFullScreen, setIsRequestingFullScreen] = useState(false);
  
  // System check states
  const [systemCheckStatus, setSystemCheckStatus] = useState<{[key: string]: 'checking' | 'success' | 'failed'}>({
    camera: 'checking',
    microphone: 'checking',
    internet: 'checking',
    browser: 'checking',
    screen: 'checking',
    fullscreen: 'checking'
  });
  const [checkingComplete, setCheckingComplete] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const examContainerRef = useRef<HTMLDivElement>(null);
  const fullScreenCheckInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // Questions data
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
    {
      en: "What is a deadlock in operating systems?",
      ar: "ما هو الجمود في أنظمة التشغيل؟",
      options: [
        { en: "Two processes using same resource", ar: "عمليتان تستخدمان نفس المورد" },
        { en: "Process waiting indefinitely for resources", ar: "عملية تنتظر موارد إلى ما لا نهاية" },
        { en: "Process terminated abnormally", ar: "عملية منتهية بشكل غير طبيعي" },
        { en: "CPU not responding", ar: "وحدة المعالجة المركزية لا تستجيب" }
      ],
      points: 5
    },
    {
      en: "Which protocol is used for secure data transmission?",
      ar: "ما هو البروتوكول المستخدم لنقل البيانات الآمن؟",
      options: [
        { en: "HTTP", ar: "HTTP" },
        { en: "FTP", ar: "FTP" },
        { en: "HTTPS", ar: "HTTPS" },
        { en: "SMTP", ar: "SMTP" }
      ],
      points: 5
    },
    {
      en: "What is the primary function of an IP address?",
      ar: "ما هي الوظيفة الأساسية لعنوان IP؟",
      options: [
        { en: "Identify device on network", ar: "تحديد الجهاز على الشبكة" },
        { en: "Store data", ar: "تخزين البيانات" },
        { en: "Encrypt information", ar: "تشفير المعلومات" },
        { en: "Process applications", ar: "معالجة التطبيقات" }
      ],
      points: 5
    }
  ];

  // Fill remaining questions
  for (let i = questions.length; i < 20; i++) {
    questions.push({
      en: `Sample Question ${i + 1}`,
      ar: `سؤال نموذجي ${i + 1}`,
      options: [
        { en: "Option A", ar: "خيار أ" },
        { en: "Option B", ar: "خيار ب" },
        { en: "Option C", ar: "خيار ج" },
        { en: "Option D", ar: "خيار د" }
      ],
      points: 5
    });
  }

  const [answers, setAnswers] = useState<(number | null)[]>(Array(20).fill(null));
  const [flagged, setFlagged] = useState<boolean[]>(Array(20).fill(false));

  const examRules = [
    "You must remain in camera view at all times during the exam",
    "Looking away from screen for extended periods will trigger warnings",
    "Multiple faces detected in camera will be flagged as violation",
    "Tab switching and leaving the exam window is strictly prohibited",
    "Copy, paste, cut, and print functions are completely disabled",
    "Right-click and keyboard shortcuts are blocked",
    "Developer tools cannot be opened during the exam",
    "You must remain in full-screen mode at all times",
    "Exiting full-screen mode will add violation points",
    "Text selection is completely disabled",
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

  // ============ FULLSCREEN MANAGEMENT ============

  const requestFullScreen = async () => {
    if (isRequestingFullScreen) return;
    
    setIsRequestingFullScreen(true);
    try {
      await document.documentElement.requestFullscreen?.();
      setFullScreenActive(true);
    } catch (err) {
      console.error('Failed to enter fullscreen mode:', err);
      addViolation(0.5, 'Failed to enter full-screen mode');
    } finally {
      setIsRequestingFullScreen(false);
    }
  };

  const exitFullScreen = async () => {
    try {
      await document.exitFullscreen?.();
      setFullScreenActive(false);
    } catch (err) {
      console.error('Failed to exit fullscreen mode:', err);
    }
  };

  const toggleFullScreen = () => {
    if (fullScreenActive) {
      exitFullScreen();
    } else {
      requestFullScreen();
    }
  };

  // ============ ANTI-CHEATING MEASURES ============

  // 1. Disable Right Click
  useEffect(() => {
    const disableRightClick = (e: MouseEvent) => {
      if (currentView === 'exam' && !examTerminated) {
        e.preventDefault();
        setRightClickAttempts(prev => prev + 1);
        addViolation(1, 'Right-click attempt detected');
        return false;
      }
    };

    document.addEventListener('contextmenu', disableRightClick);
    return () => document.removeEventListener('contextmenu', disableRightClick);
  }, [currentView, examTerminated]);

  // 2. Disable Copy, Cut, Paste
  useEffect(() => {
    const disableCopyPaste = (e: ClipboardEvent) => {
      if (currentView === 'exam' && !examTerminated) {
        e.preventDefault();
        setCopyAttempts(prev => prev + 1);
        addViolation(0.5, 'Copy/Paste attempt detected');
        return false;
      }
    };

    document.addEventListener('copy', disableCopyPaste);
    document.addEventListener('cut', disableCopyPaste);
    document.addEventListener('paste', disableCopyPaste);
    
    return () => {
      document.removeEventListener('copy', disableCopyPaste);
      document.removeEventListener('cut', disableCopyPaste);
      document.removeEventListener('paste', disableCopyPaste);
    };
  }, [currentView, examTerminated]);

  // 3. Disable Keyboard Shortcuts
  useEffect(() => {
    const disableKeyboardShortcuts = (e: KeyboardEvent) => {
      if (currentView !== 'exam' || examTerminated) return;

      const blockedShortcuts = [
        e.ctrlKey && e.key === 'c',
        e.ctrlKey && e.key === 'v',
        e.ctrlKey && e.key === 'x',
        e.ctrlKey && e.key === 'p',
        e.ctrlKey && e.key === 's',
        e.ctrlKey && e.key === 'u',
        e.ctrlKey && e.key === 'a',
        e.ctrlKey && e.shiftKey && e.key === 'I',
        e.ctrlKey && e.shiftKey && e.key === 'J',
        e.ctrlKey && e.shiftKey && e.key === 'C',
        e.metaKey && e.key === 'c',
        e.metaKey && e.key === 'v',
        e.metaKey && e.key === 'x',
        e.metaKey && e.key === 'p',
        e.metaKey && e.key === 's',
        e.metaKey && e.key === 'a',
        e.key === 'F12',
        e.altKey && e.key === 'Tab',
        e.ctrlKey && e.key === 'n',
        e.ctrlKey && e.key === 't',
        e.ctrlKey && e.shiftKey && e.key === 'N',
        e.ctrlKey && e.key === 'w',
        e.ctrlKey && e.shiftKey && e.key === 'W',
        e.altKey && e.key === 'F4'
      ];

      if (blockedShortcuts.includes(true)) {
        e.preventDefault();
        e.stopPropagation();
        setKeyboardShortcutAttempts(prev => prev + 1);
        addViolation(1, 'Blocked keyboard shortcut');
        return false;
      }
    };

    window.addEventListener('keydown', disableKeyboardShortcuts, true);
    return () => window.removeEventListener('keydown', disableKeyboardShortcuts, true);
  }, [currentView, examTerminated]);

  // 4. Detect DevTools
  useEffect(() => {
    const detectDevTools = () => {
      if (currentView !== 'exam' || examTerminated) return;

      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold = window.outerHeight - window.innerHeight > 160;
      const devToolsOpenDetected = widthThreshold || heightThreshold;
      
      if (devToolsOpenDetected && !devToolsOpen) {
        setDevToolsOpen(true);
        addViolation(2, 'Developer tools opened');
      } else if (!devToolsOpenDetected && devToolsOpen) {
        setDevToolsOpen(false);
      }
    };

    const checkDevTools = setInterval(detectDevTools, 1000);
    window.addEventListener('resize', detectDevTools);

    return () => {
      clearInterval(checkDevTools);
      window.removeEventListener('resize', detectDevTools);
    };
  }, [currentView, examTerminated, devToolsOpen]);

  // 5. Full Screen Enforcement with Re-enter capability
  useEffect(() => {
    const handleFullScreenChange = () => {
      if (currentView === 'exam' && !examTerminated) {
        const isFullScreen = document.fullscreenElement !== null;
        setFullScreenActive(isFullScreen);
        
        if (!isFullScreen) {
          addViolation(1, 'Exited full-screen mode');
          // Auto re-enter full screen after 2 seconds
          setTimeout(() => {
            if (!document.fullscreenElement && currentView === 'exam' && !examTerminated) {
              requestFullScreen();
            }
          }, 2000);
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, [currentView, examTerminated]);

  // 6. Tab Focus Detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (currentView === 'exam' && !examTerminated) {
        const isTabFocused = document.visibilityState === 'visible';
        setTabFocus(isTabFocused);
        
        if (!isTabFocused) {
          addViolation(2, 'Tab switching detected');
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [currentView, examTerminated]);

  // 7. Disable Text Selection
  useEffect(() => {
    const disableSelection = (e: Event) => {
      if (currentView === 'exam' && !examTerminated) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('selectstart', disableSelection);
    document.addEventListener('selectionchange', disableSelection);
    
    return () => {
      document.removeEventListener('selectstart', disableSelection);
      document.removeEventListener('selectionchange', disableSelection);
    };
  }, [currentView, examTerminated]);

  // 8. Disable Drag and Drop
  useEffect(() => {
    const disableDragDrop = (e: DragEvent) => {
      if (currentView === 'exam' && !examTerminated) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('dragstart', disableDragDrop);
    document.addEventListener('drop', disableDragDrop);
    document.addEventListener('dragover', disableDragDrop);
    
    return () => {
      document.removeEventListener('dragstart', disableDragDrop);
      document.removeEventListener('drop', disableDragDrop);
      document.removeEventListener('dragover', disableDragDrop);
    };
  }, [currentView, examTerminated]);

  // 9. Disable Print
  useEffect(() => {
    const disablePrint = (e: Event) => {
      if (currentView === 'exam' && !examTerminated) {
        e.preventDefault();
        addViolation(1, 'Print attempt detected');
        return false;
      }
    };

    window.addEventListener('beforeprint', disablePrint);
    window.addEventListener('afterprint', disablePrint);
    
    return () => {
      window.removeEventListener('beforeprint', disablePrint);
      window.removeEventListener('afterprint', disablePrint);
    };
  }, [currentView, examTerminated]);

  // Violation management
  const addViolation = (points: number, reason: string) => {
    setViolationScore(prev => {
      const newScore = prev + points;
      
      setProctorAlerts(prevAlerts => [reason, ...prevAlerts].slice(0, 3));
      
      if (newScore >= 10 && !examTerminated && currentView === 'exam') {
        terminateExam(`Excessive violations: ${reason}`);
      }
      
      return newScore;
    });
  };

  // Exam termination
  const terminateExam = (reason: string) => {
    setExamTerminated(true);
    setTerminationReason(reason);
    setCurrentView('terminated');
    
    // Exit fullscreen on termination
    document.exitFullscreen?.().catch(() => {});
    
    console.log('Exam terminated:', {
      reason,
      violationScore,
      answers,
      timestamp: new Date().toISOString()
    });
  };

  // Timer
  useEffect(() => {
    if (currentView === 'exam' && !examTerminated) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentView, examTerminated]);

  // Auto submit when time expires
  const handleAutoSubmit = () => {
    console.log('Auto-submitting exam:', answers);
    alert('Time expired! Your exam has been auto-submitted.');
    setCurrentView('rules');
  };

  // System checks
  useEffect(() => {
    if (currentView === 'system-check') {
      runSystemChecks();
    }
  }, [currentView]);

  const runSystemChecks = async () => {
    setSystemCheckStatus({
      camera: 'checking',
      microphone: 'checking',
      internet: 'checking',
      browser: 'checking',
      screen: 'checking',
      fullscreen: 'checking'
    });
    setCheckingComplete(false);

    // Camera check
    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 } 
        });
        stream.getTracks().forEach(track => track.stop());
        setSystemCheckStatus(prev => ({ ...prev, camera: 'success' }));
      } catch {
        setSystemCheckStatus(prev => ({ ...prev, camera: 'failed' }));
      }
    }, 1000);

    // Microphone check
    setTimeout(async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: { echoCancellation: false } 
        });
        stream.getTracks().forEach(track => track.stop());
        setSystemCheckStatus(prev => ({ ...prev, microphone: 'success' }));
      } catch {
        setSystemCheckStatus(prev => ({ ...prev, microphone: 'failed' }));
      }
    }, 1500);

    // Internet check
    setTimeout(() => {
      const isOnline = navigator.onLine;
      setSystemCheckStatus(prev => ({ ...prev, internet: isOnline ? 'success' : 'failed' }));
    }, 2000);

    // Browser check
    setTimeout(() => {
      const isChrome = /Chrome/.test(navigator.userAgent);
      const isFirefox = /Firefox/.test(navigator.userAgent);
      const isEdge = /Edg/.test(navigator.userAgent);
      
      if (isChrome || isFirefox || isEdge) {
        setSystemCheckStatus(prev => ({ ...prev, browser: 'success' }));
      } else {
        setSystemCheckStatus(prev => ({ ...prev, browser: 'failed' }));
      }
    }, 2500);

    // Fullscreen check
    setTimeout(() => {
      // Check if fullscreen API is available by attempting to access it
      const supportsFullscreen = 'requestFullscreen' in document.documentElement;
      setSystemCheckStatus(prev => ({ ...prev, fullscreen: supportsFullscreen ? 'success' : 'failed' }));
    }, 3000);

    // Screen sharing check
    setTimeout(async () => {
      try {
        const stream = await (navigator.mediaDevices as any).getDisplayMedia({ 
          video: true,
          audio: false 
        });
        stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
        setSystemCheckStatus(prev => ({ ...prev, screen: 'success' }));
      } catch {
        setSystemCheckStatus(prev => ({ ...prev, screen: 'failed' }));
      } finally {
        setCheckingComplete(true);
      }
    }, 3500);
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
        setSystemCheckStatus(prev => ({ ...prev, internet: navigator.onLine ? 'success' : 'failed' }));
        break;
      case 'browser': {
        const isChrome = /Chrome/.test(navigator.userAgent);
        const isFirefox = /Firefox/.test(navigator.userAgent);
        const isEdge = /Edg/.test(navigator.userAgent);
        setSystemCheckStatus(prev => ({ ...prev, browser: (isChrome || isFirefox || isEdge) ? 'success' : 'failed' }));
        break;
      }
      case 'fullscreen': {
        const supportsFullscreen = 'requestFullscreen' in document.documentElement;
        setSystemCheckStatus(prev => ({ ...prev, fullscreen: supportsFullscreen ? 'success' : 'failed' }));
        break;
      }
      case 'screen':
        try {
          const stream = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
          stream.getTracks().forEach((track: MediaStreamTrack) => track.stop());
          setSystemCheckStatus(prev => ({ ...prev, screen: 'success' }));
        } catch {
          setSystemCheckStatus(prev => ({ ...prev, screen: 'failed' }));
        }
        break;
    }
  };

  // Format time
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Answer handling
  const handleAnswerSelect = (index: number) => {
    if (!examTerminated) {
      const newAnswers = [...answers];
      newAnswers[currentQuestion] = index;
      setAnswers(newAnswers);
      setSelectedAnswer(index);
    }
  };

  const handleNext = () => {
    if (currentQuestion < 19 && !examTerminated) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(answers[currentQuestion + 1]);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0 && !examTerminated) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(answers[currentQuestion - 1]);
    }
  };

  const toggleFlag = () => {
    if (!examTerminated) {
      const newFlagged = [...flagged];
      newFlagged[currentQuestion] = !newFlagged[currentQuestion];
      setFlagged(newFlagged);
    }
  };

  const getQuestionStatus = (index: number): 'answered' | 'flagged' | 'unanswered' => {
    if (answers[index] !== null) return 'answered';
    if (flagged[index]) return 'flagged';
    return 'unanswered';
  };

  const handleSubmitConfirm = () => {
    console.log('Exam submitted:', answers);
    alert('Exam submitted successfully!');
    exitFullScreen();
    setCurrentView('rules');
  };

  const startExam = async () => {
    try {
      await requestFullScreen();
      setCurrentView('exam');
      
      // Start camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { width: 640, height: 480 } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error('Camera access denied');
      }
    } catch (err) {
      alert('Please enable full-screen mode to start the exam');
    }
  };

  // ============ RENDER VIEWS ============

  // Rules View
  if (currentView === 'rules') {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
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
                  <span className="text-sm">Questions</span>
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
                  <Shield size={18} />
                  <span className="text-sm">Security</span>
                </div>
                <p className="text-2xl font-bold">Locked</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 mb-6 shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-2 rounded-lg">
                <Ban className="text-red-600" size={24} />
              </div>
              <h2 className="text-xl font-bold text-gray-800">Exam Rules & Security Measures</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-3">
              {examRules.map((rule, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
                  <p className="text-gray-700 text-sm">{rule}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToRules}
                onChange={(e) => setAgreedToRules(e.target.checked)}
                className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                aria-label="I agree to the exam rules"
              />
              <div>
                <p className="font-semibold text-gray-900 mb-2">
                  I have read and agree to all exam rules and security measures
                </p>
                <p className="text-sm text-gray-600">
                  By checking this box, you acknowledge that:
                  • All copy/paste functions are disabled
                  • Full-screen mode is mandatory
                  • Tab switching is prohibited
                  • Violations will result in point deductions
                  • Reaching 10 violation points terminates the exam
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
            aria-label="Proceed to system check"
          >
            <Shield size={20} />
            Proceed To System Check
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  // System Check View
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
        key: 'fullscreen',
        icon: Maximize2, 
        title: 'Fullscreen Support', 
        checkingDesc: 'Checking fullscreen capability...',
        successDesc: 'Fullscreen mode is supported',
        failedDesc: 'Fullscreen not supported',
        troubleshooting: 'Update your browser to the latest version'
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
                <Settings className="w-8 h-8 text-blue-600 animate-spin" style={{ animation: 'spin 3s linear infinite' }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">System Check</h1>
                <p className="text-gray-600">Verifying your system meets exam requirements</p>
              </div>
            </div>
            <button 
              onClick={() => setCurrentView('rules')}
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2"
              aria-label="Back to rules"
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
                          aria-label={`Retry ${check.title}`}
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
                onClick={startExam}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-3 transition-colors"
                aria-label="Start secure exam"
              >
                <Lock className="w-5 h-5" />
                Start Secure Exam
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
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setCurrentView('rules')}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-4 rounded-xl flex items-center justify-center gap-3 transition-colors"
                  aria-label="Back to rules"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back to Rules
                </button>
                <button 
                  onClick={runSystemChecks}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-3 transition-colors"
                  aria-label="Retry all checks"
                >
                  <Settings className="w-5 h-5" />
                  Retry All Checks
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Exam View
  if (currentView === 'exam') {
    const currentQ = questions[currentQuestion];
    
    return (
      <div 
        ref={examContainerRef}
        className="min-h-screen bg-gray-100 p-4 lg:p-8 select-none"
        style={{ userSelect: 'none', WebkitUserSelect: 'none', msUserSelect: 'none' }}
        onContextMenu={(e) => e.preventDefault()}
      >
        <div className="max-w-7xl mx-auto">
          {/* Anti-Cheating Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-t-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5" />
              <span className="font-semibold text-sm">SECURE EXAM MODE ACTIVE</span>
              <div className="hidden md:flex items-center gap-4 ml-4 text-xs">
                <span className="flex items-center gap-1">
                  <Copy size={12} /> Copy: <span className="font-bold">Blocked</span>
                </span>
                <span className="flex items-center gap-1">
                  <Ban size={12} /> Right-Click: <span className="font-bold">Blocked</span>
                </span>
                <span className="flex items-center gap-1">
                  <Maximize2 size={12} /> Fullscreen: 
                  <span className={fullScreenActive ? 'text-green-300' : 'text-yellow-300 animate-pulse'}>
                    {fullScreenActive ? 'Active' : 'Required'}
                  </span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleFullScreen}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 px-3 py-1 rounded-lg flex items-center gap-2 transition-colors"
                aria-label={fullScreenActive ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {fullScreenActive ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                <span className="text-sm">{fullScreenActive ? 'Exit' : 'Enter'} Fullscreen</span>
              </button>
              <div className="bg-white bg-opacity-20 px-3 py-1 rounded-lg">
                <span className="text-sm">Violation Score: </span>
                <span className={`font-bold ${violationScore >= 8 ? 'text-yellow-300 animate-pulse' : 'text-white'}`}>
                  {violationScore.toFixed(1)}/10
                </span>
              </div>
            </div>
          </div>

          {/* Main Header */}
          <div className="bg-white border-x border-t border-gray-200 p-6 flex flex-wrap justify-between items-center">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">Midterm Exam - Data Structures & Algorithms</h1>
              <p className="text-gray-600">Dr. Ahmed Hassan • Total: 100 Points</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end text-gray-700">
                <Clock className="w-5 h-5" />
                <span className="text-sm">Time Remaining</span>
              </div>
              <div className={`text-3xl lg:text-4xl font-mono font-bold ${timeRemaining < 300 ? 'text-red-600 animate-pulse' : 'text-gray-900'}`}>
                {formatTime(timeRemaining)}
              </div>
            </div>
          </div>

          {/* Alerts */}
          {(proctorAlerts.length > 0 || !fullScreenActive || !tabFocus) && (
            <div className="bg-white border-x border-gray-200 px-6 py-3">
              <div className="flex flex-wrap gap-3">
                {proctorAlerts.slice(0, 2).map((alert, idx) => (
                  <div key={idx} className="bg-red-100 border border-red-300 text-red-800 px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    <span>⚠️ {alert}</span>
                  </div>
                ))}
                {!fullScreenActive && (
                  <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-2 rounded-lg flex items-center gap-2 text-sm animate-pulse">
                    <Maximize2 className="w-4 h-4" />
                    <span>Exit full-screen mode detected - </span>
                    <button
                      onClick={requestFullScreen}
                      className="font-bold underline hover:no-underline"
                      aria-label="Re-enter fullscreen"
                    >
                      Click to re-enter
                    </button>
                  </div>
                )}
                {!tabFocus && (
                  <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-2 rounded-lg flex items-center gap-2 text-sm animate-pulse">
                    <Eye className="w-4 h-4" />
                    <span>Tab focus lost - Return to exam window</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="bg-white border-x border-t border-gray-200 p-6">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Question Panel */}
              <div className="lg:col-span-2">
                {/* Security Status Summary */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Security Status
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${fullScreenActive ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
                      <span>Fullscreen: {fullScreenActive ? 'Active' : 'Inactive'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className={`w-2 h-2 rounded-full ${tabFocus ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
                      <span>Tab Focus: {tabFocus ? 'Active' : 'Lost'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Copy/Paste: Blocked</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Right-Click: Blocked</span>
                    </div>
                  </div>
                  {copyAttempts > 0 && (
                    <div className="mt-2 text-xs text-red-600">
                      Copy attempts detected: {copyAttempts}
                    </div>
                  )}
                </div>

                {/* Question Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                      Question {currentQuestion + 1} of 20
                    </span>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                      {currentQ.points} points
                    </span>
                  </div>
                  <button
                    onClick={toggleFlag}
                    disabled={examTerminated}
                    className={`p-2 rounded-lg transition-colors ${
                      flagged[currentQuestion] 
                        ? 'bg-yellow-100 text-yellow-700' 
                        : 'bg-gray-100 text-gray-400 hover:text-gray-600'
                    }`}
                    aria-label={flagged[currentQuestion] ? 'Remove flag' : 'Flag question'}
                  >
                    <Flag className="w-5 h-5" fill={flagged[currentQuestion] ? 'currentColor' : 'none'} />
                  </button>
                </div>

                {/* Question Text */}
                <h2 className="text-xl font-semibold text-gray-900 mb-6" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                  {currentQ[language]}
                </h2>

                {/* Options */}
                <div className="space-y-3 mb-8">
                  {currentQ.options.map((option: any, index: number) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={examTerminated}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        answers[currentQuestion] === index
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      } ${examTerminated ? 'opacity-50 cursor-not-allowed' : ''}`}
                      aria-label={`Option ${index + 1}: ${option[language]}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          answers[currentQuestion] === index
                            ? 'border-blue-600'
                            : 'border-gray-300'
                        }`}>
                          {answers[currentQuestion] === index && (
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
                    disabled={currentQuestion === 0 || examTerminated}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous question"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <button
                    onClick={currentQuestion === 19 ? () => setShowSubmitModal(true) : handleNext}
                    disabled={examTerminated}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg text-white transition-colors ${
                      currentQuestion === 19 
                        ? 'bg-green-600 hover:bg-green-700' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    } ${examTerminated ? 'opacity-50 cursor-not-allowed' : ''}`}
                    aria-label={currentQuestion === 19 ? 'Submit exam' : 'Next question'}
                  >
                    {currentQuestion === 19 ? 'Submit Exam' : 'Next'}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Navigation Panel */}
              <div className="bg-gray-50 rounded-xl p-6 h-fit lg:sticky lg:top-6">
                <h3 className="font-semibold text-gray-900 mb-4">Questions</h3>
                
                <div className="grid grid-cols-5 gap-2 mb-6">
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
                        className={`aspect-square rounded-lg font-medium text-sm transition-all ${
                          i === currentQuestion
                            ? 'ring-2 ring-blue-600 ring-offset-2'
                            : ''
                        } ${
                          status === 'answered'
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : status === 'flagged'
                            ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-500'
                            : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-gray-300'
                        } ${examTerminated ? 'opacity-50 cursor-not-allowed' : ''}`}
                        aria-label={`Question ${i + 1}, ${status}`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2 text-sm border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Answered:</span>
                    <span className="font-semibold text-green-600">{answeredCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Flagged:</span>
                    <span className="font-semibold text-yellow-600">{flaggedCount}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Unanswered:</span>
                    <span className="font-semibold text-red-600">{unansweredCount}</span>
                  </div>
                </div>

                {/* Violation Warning */}
                {violationScore >= 8 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <span className="text-sm font-medium text-red-800">Warning: High Violation Score</span>
                    </div>
                    <p className="text-xs text-red-700">
                      {Math.max(0, 10 - violationScore).toFixed(1)} points remaining before automatic termination
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border border-gray-200 rounded-b-xl p-4 text-xs text-gray-500">
            <div className="flex flex-wrap items-center justify-between">
              <span>© 2024 Secure Exam Platform - All actions are monitored and recorded</span>
              <span className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                Copy protection enabled • Fullscreen required • Tab switching monitored
              </span>
            </div>
          </div>
        </div>

        {/* Submit Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-start gap-3 mb-4">
                <div className="bg-orange-100 p-2 rounded-full">
                  <AlertTriangle className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Submit Exam?</h2>
                  <p className="text-gray-600 text-sm mt-1">Review your progress before submitting</p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Answered Questions:</span>
                  <span className="font-semibold text-green-600">{answeredCount}/20</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Unanswered Questions:</span>
                  <span className="font-semibold text-red-600">{unansweredCount}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Flagged Questions:</span>
                  <span className="font-semibold text-yellow-600">{flaggedCount}</span>
                </div>
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Violation Score:</span>
                  <span className={`font-semibold ${violationScore >= 7 ? 'text-red-600' : 'text-gray-900'}`}>
                    {violationScore.toFixed(1)}/10
                  </span>
                </div>
              </div>

              {unansweredCount > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-orange-800">
                    You have {unansweredCount} unanswered {unansweredCount === 1 ? 'question' : 'questions'}. Are you sure you want to submit?
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
                  aria-label="Cancel submission"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitConfirm}
                  className="flex-1 px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors flex items-center justify-center gap-2"
                  aria-label="Confirm submit"
                >
                  <Send className="w-4 h-4" />
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}

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

  // Terminated View
  if (currentView === 'terminated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 p-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center">
          <div className="mb-6 flex justify-center">
            <div className="bg-red-100 p-4 rounded-full">
              <Ban className="w-16 h-16 text-red-600" />
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Exam Terminated</h1>
          
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <p className="text-lg text-gray-800 mb-4">
              Your exam has been automatically terminated due to multiple security violations.
            </p>
            
            <div className="space-y-3 text-left bg-white p-4 rounded-lg">
              <div className="flex justify-between">
                <span className="text-gray-600">Violation Score:</span>
                <span className="font-bold text-red-600">{violationScore.toFixed(1)}/10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Termination Reason:</span>
                <span className="font-bold text-gray-800">{terminationReason}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Questions Answered:</span>
                <span className="font-bold text-blue-600">{answeredCount}/20</span>
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-800">
              Your responses have been recorded and will be reviewed by the exam administrator.
              You will receive further instructions via email.
            </p>
          </div>
          
          <button
            onClick={() => {
              setCurrentView('rules');
              setExamTerminated(false);
              setViolationScore(0);
              setCopyAttempts(0);
              setRightClickAttempts(0);
              setKeyboardShortcutAttempts(0);
              setProctorAlerts([]);
              setAnswers(Array(20).fill(null));
              setFlagged(Array(20).fill(false));
              setTimeRemaining(7200);
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors"
            aria-label="Return to dashboard"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default ExamInterface;