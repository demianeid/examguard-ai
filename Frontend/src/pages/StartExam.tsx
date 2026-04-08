import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Clock, FileText, CheckCircle, ChevronLeft, ChevronRight,
  Settings, Camera, Mic, Wifi, Monitor, Flag, AlertTriangle,
  Send, Eye, Copy, Ban, Shield, Lock, Maximize2, Minimize2,
  ScanFace, UserCheck, UserX, Loader2, RefreshCw
} from 'lucide-react';

// --- Types ---
interface Choice {
  id: number;
  choice_text: string;
}

interface Question {
  id: number;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'essay';
  marks: number;
  order: number;
  choices: Choice[];
}

interface ExamData {
  id: number;
  title: string;
  duration: number;
  total_marks: number;
  instructions: string;
  end_datetime?: string;
  questions: Question[];
}

const ExamInterface: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');

  // --- Exam Data ---
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [examLoading, setExamLoading] = useState(true);
  const [examError, setExamError] = useState<string | null>(null);

  // --- Exam State ---
  const [currentView, setCurrentView] = useState<'rules' | 'face-recognition' | 'system-check' | 'exam' | 'terminated' | 'time-up'>('rules');
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [flagged, setFlagged] = useState<boolean[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [timeUp, setTimeUp] = useState(false);

  // --- Anti-Cheating State ---
  const [copyAttempts, setCopyAttempts] = useState(0);
  const [fullScreenActive, setFullScreenActive] = useState(false);
  const [tabFocus, setTabFocus] = useState(true);
  const [violationScore, setViolationScore] = useState(0);
  const [proctorAlerts, setProctorAlerts] = useState<string[]>([]);
  const [examTerminated, setExamTerminated] = useState(false);
  const [terminationReason, setTerminationReason] = useState('');
  const [isRequestingFullScreen, setIsRequestingFullScreen] = useState(false);
  const [devToolsOpen, setDevToolsOpen] = useState(false);

  // --- Face Recognition State ---
  type FaceStatus = 'idle' | 'requesting-camera' | 'scanning' | 'verifying' | 'success' | 'failed' | 'camera-error';
  const [faceStatus, setFaceStatus] = useState<FaceStatus>('idle');
  const [faceAttempts, setFaceAttempts] = useState(0);
  const [faceMessage, setFaceMessage] = useState('');
  const MAX_FACE_ATTEMPTS = 3;

  // --- System Check State ---
  const [systemCheckStatus, setSystemCheckStatus] = useState<{ [key: string]: 'checking' | 'success' | 'failed' }>({
    camera: 'checking', microphone: 'checking', internet: 'checking',
    browser: 'checking', screen: 'checking', fullscreen: 'checking',
  });
  const [checkingComplete, setCheckingComplete] = useState(false);

  // --- Refs ---
  const videoRef = useRef<HTMLVideoElement>(null);
  const examContainerRef = useRef<HTMLDivElement>(null);
  const faceVideoRef = useRef<HTMLVideoElement>(null);
  const faceCanvasRef = useRef<HTMLCanvasElement>(null);
  const faceStreamRef = useRef<MediaStream | null>(null);
  const isTerminatedRef = useRef(false); // sync ref — event listeners always see latest value

  // ============================================================
  // Fetch exam data from backend
  // ============================================================
  useEffect(() => {
    if (!examId) return;

    const fetchExam = async () => {
      setExamLoading(true);
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/student/exams/${examId}/`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) {
  const errData = await res.json();
  throw new Error(errData.detail || 'Failed to load exam');
}
        const data: ExamData = await res.json();
        setExamData(data);
        if (data.end_datetime) {
          const endStr = data.end_datetime;
          const endMs = Date.parse(/[Z+]|[+-]\d{2}:/.test(endStr) ? endStr : endStr + 'Z');
          setTimeRemaining(Math.max(0, Math.floor((endMs - Date.now()) / 1000)));
        } else {
          setTimeRemaining(data.duration * 60);
        }
        setAnswers(Array(data.questions.length).fill(null));
        setFlagged(Array(data.questions.length).fill(false));
      } catch (err: any) {
        setExamError(err.message || 'Failed to load exam');
      } finally {
        setExamLoading(false);
      }
    };

    fetchExam();
  }, [examId]);

  // ============================================================
  // Derived values
  // ============================================================
  const answeredCount = answers.filter(a => a !== null).length;
  const unansweredCount = answers.length - answeredCount;
  const flaggedCount = flagged.filter(f => f).length;

  // ============================================================
  // Fullscreen
  // ============================================================
  const requestFullScreen = async () => {
    if (isRequestingFullScreen) return;
    setIsRequestingFullScreen(true);
    try {
      await document.documentElement.requestFullscreen?.();
      setFullScreenActive(true);
    } catch {
      addViolation(0.5, 'Failed to enter full-screen mode');
    } finally {
      setIsRequestingFullScreen(false);
    }
  };

  const exitFullScreen = async () => {
    try {
      await document.exitFullscreen?.();
      setFullScreenActive(false);
    } catch {}
  };

  const toggleFullScreen = () => fullScreenActive ? exitFullScreen() : requestFullScreen();

  // ============================================================
  // Anti-Cheating
  // ============================================================
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (currentView === 'exam' && !examTerminated) {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', handler);
    return () => document.removeEventListener('contextmenu', handler);
  }, [currentView, examTerminated]);

  useEffect(() => {
    const handler = (e: ClipboardEvent) => {
      if (currentView === 'exam' && !examTerminated) {
        e.preventDefault();
        setCopyAttempts(prev => prev + 1);
        addViolation(0.5, 'Copy/Paste attempt detected');
      }
    };
    document.addEventListener('copy', handler);
    document.addEventListener('cut', handler);
    document.addEventListener('paste', handler);
    return () => {
      document.removeEventListener('copy', handler);
      document.removeEventListener('cut', handler);
      document.removeEventListener('paste', handler);
    };
  }, [currentView, examTerminated]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (currentView !== 'exam' || examTerminated) return;
      const blocked = [
        e.ctrlKey && ['c','v','x','p','s','u','a','n','t','w'].includes(e.key),
        e.ctrlKey && e.shiftKey && ['I','J','C','N','W'].includes(e.key),
        e.metaKey && ['c','v','x','p','s','a'].includes(e.key),
        e.key === 'F12',
        e.altKey && e.key === 'Tab',
        e.altKey && e.key === 'F4',
      ];
      if (blocked.includes(true)) {
        e.preventDefault();
        e.stopPropagation();
        addViolation(1, 'Blocked keyboard shortcut');
      }
    };
    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [currentView, examTerminated]);

  useEffect(() => {
    const detect = () => {
      if (currentView !== 'exam' || examTerminated) return;
      const detected = window.outerWidth - window.innerWidth > 160 || window.outerHeight - window.innerHeight > 160;
      if (detected && !devToolsOpen) { setDevToolsOpen(true); addViolation(2, 'Developer tools opened'); }
      else if (!detected && devToolsOpen) setDevToolsOpen(false);
    };
    const interval = setInterval(detect, 1000);
    window.addEventListener('resize', detect);
    return () => { clearInterval(interval); window.removeEventListener('resize', detect); };
  }, [currentView, examTerminated, devToolsOpen]);

  useEffect(() => {
    const handler = () => {
      // Guard with both React state AND the sync ref to handle async state closure issue
      if (currentView === 'exam' && !examTerminated && !isTerminatedRef.current) {
        const isFS = document.fullscreenElement !== null;
        setFullScreenActive(isFS);
        if (!isFS) {
          addViolation(1, 'Exited full-screen mode');
          setTimeout(() => {
            if (!document.fullscreenElement && !isTerminatedRef.current) requestFullScreen();
          }, 2000);
        }
      }
    };
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, [currentView, examTerminated]);

  useEffect(() => {
    const handler = () => {
      if (currentView === 'exam' && !examTerminated) {
        const focused = document.visibilityState === 'visible';
        setTabFocus(focused);
        if (!focused) addViolation(2, 'Tab switching detected');
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [currentView, examTerminated]);

  useEffect(() => {
    const handler = (e: Event) => { if (currentView === 'exam' && !examTerminated) e.preventDefault(); };
    document.addEventListener('selectstart', handler);
    document.addEventListener('dragstart', handler);
    return () => { document.removeEventListener('selectstart', handler); document.removeEventListener('dragstart', handler); };
  }, [currentView, examTerminated]);

  // ============================================================
  // Violation & Termination
  // ============================================================
  const addViolation = (points: number, reason: string) => {
    setViolationScore(prev => {
      const newScore = prev + points;
      setProctorAlerts(prevAlerts => [reason, ...prevAlerts].slice(0, 3));
      if (newScore >= 10 && !examTerminated && currentView === 'exam') {
        terminateExam(`Excessive violations: ${reason}`, newScore);
      }
      return newScore;
    });
  };

  const terminateExam = (reason: string, score?: number) => {
    isTerminatedRef.current = true; // set sync ref FIRST so fullscreenchange handler sees it immediately
    setExamTerminated(true);
    setTerminationReason(reason);
    setCurrentView('terminated');
    exitFullScreen();
    // Auto-submit on termination
    submitExam(true, score ?? violationScore);
  };

  // ============================================================
  // Timer
  // ============================================================
  useEffect(() => {
    if (currentView !== 'exam' || examTerminated || timeUp) return;
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeUp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentView, examTerminated, timeUp]);

  useEffect(() => {
    if (!timeUp || !examData) return;
    isTerminatedRef.current = true; // prevent fullscreenchange from re-entering FS on auto-submit
    setExamTerminated(true);
    exitFullScreen();
    const doAutoSubmit = async () => {
      await submitExam(true, violationScore);
      setCurrentView('time-up');
      setTimeout(() => navigate('/classes'), 5000);
    };
    doAutoSubmit();
  }, [timeUp]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // ============================================================
  // Submit exam to backend
  // ============================================================
  const submitExam = async (isTerminated: boolean = false, finalViolationScore: number = violationScore) => {
    if (!examData) return;
    setSubmitLoading(true);

    // Build answers array using question id and selected choice id
    const answersPayload = examData.questions
      .map((q, index) => {
        const selectedIndex = answers[index];
        if (selectedIndex === null) return null;
        const selectedChoice = q.choices[selectedIndex];
        return {
          question_id: q.id,
          choice_id: selectedChoice?.id ?? null,
        };
      })
      .filter(Boolean);

    try {
      await fetch(`http://127.0.0.1:8000/api/student/exams/${examData.id}/submit/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          answers: answersPayload,
          is_terminated: isTerminated,
          violation_score: finalViolationScore,
        }),
      });
    } catch (err) {
      console.error('Submit failed:', err);
    } finally {
      setSubmitLoading(false);
      exitFullScreen();
    }
  };

  const handleSubmitConfirm = async () => {
    isTerminatedRef.current = true; // set sync ref FIRST so fullscreenchange handler sees it immediately
    await submitExam(false, violationScore);
    setShowSubmitModal(false);
    navigate('/classes');
  };

  // ============================================================
  // Answer & Navigation
  // ============================================================
  const handleAnswerSelect = (choiceIndex: number) => {
    if (examTerminated) return;
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = choiceIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (examData && currentQuestion < examData.questions.length - 1)
      setCurrentQuestion(currentQuestion + 1);
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) setCurrentQuestion(currentQuestion - 1);
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

  // ============================================================
  // Start Exam
  // ============================================================
  const startExam = async () => {
    try {
      await fetch(`http://127.0.0.1:8000/api/student/exams/${examId}/start/`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
    } catch { console.error('Failed to register exam session'); }

    await requestFullScreen();
    setCurrentView('exam');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch { console.error('Camera access denied'); }
  };

  // ============================================================
  // Face Recognition
  // ============================================================
  const startFaceCamera = useCallback(async () => {
    setFaceStatus('requesting-camera');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
      faceStreamRef.current = stream;
      if (faceVideoRef.current) { faceVideoRef.current.srcObject = stream; await faceVideoRef.current.play(); }
      setFaceStatus('scanning');
    } catch { setFaceStatus('camera-error'); }
  }, []);

  const stopFaceCamera = useCallback(() => {
    faceStreamRef.current?.getTracks().forEach(t => t.stop());
    faceStreamRef.current = null;
  }, []);

  const captureFrame = useCallback((): string | null => {
    const video = faceVideoRef.current;
    const canvas = faceCanvasRef.current;
    if (!video || !canvas) return null;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.85);
  }, []);

  // TODO: Replace with real API call when face model is ready
  const verifyFaceWithModel = async (imageBase64: string): Promise<{ verified: boolean; message: string }> => {
  const token = localStorage.getItem('access_token');
  
  // بنجيب student_id من الـ token
  const payload = JSON.parse(atob(token!.split('.')[1]));
  const studentId = payload.custom_id;

const response = await fetch('http://localhost:8000/api/student/face/verify/', {    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({
      student_id: studentId,
      image: imageBase64,
    }),
  });

  const data = await response.json();
  return {
    verified: data.verified,
    message: data.message,
  };
};

  const handleFaceVerify = useCallback(async () => {
    if (faceStatus !== 'scanning') return;
    const image = captureFrame();
    if (!image) return;
    setFaceStatus('verifying');
    try {
      const result = await verifyFaceWithModel(image);
      setFaceMessage(result.message);
      if (result.verified) {
        setFaceStatus('success');
        stopFaceCamera();
        setTimeout(() => setCurrentView('system-check'), 2000);
      } else {
        setFaceStatus('failed');
        setFaceAttempts(prev => prev + 1);
      }
    } catch {
      setFaceMessage('Connection error. Please try again.');
      setFaceStatus('failed');
      setFaceAttempts(prev => prev + 1);
    }
  }, [faceStatus, captureFrame, stopFaceCamera]);

  const handleFaceRetry = useCallback(() => { setFaceMessage(''); setFaceStatus('scanning'); }, []);

  useEffect(() => {
    if (currentView === 'face-recognition') startFaceCamera();
    else stopFaceCamera();
  }, [currentView]);

  // ============================================================
  // System Checks
  // ============================================================
  useEffect(() => { if (currentView === 'system-check') runSystemChecks(); }, [currentView]);

  const runSystemChecks = async () => {
    setSystemCheckStatus({ camera: 'checking', microphone: 'checking', internet: 'checking', browser: 'checking', screen: 'checking', fullscreen: 'checking' });
    setCheckingComplete(false);

    setTimeout(async () => {
      try { const s = await navigator.mediaDevices.getUserMedia({ video: true }); s.getTracks().forEach(t => t.stop()); setSystemCheckStatus(p => ({ ...p, camera: 'success' })); }
      catch { setSystemCheckStatus(p => ({ ...p, camera: 'failed' })); }
    }, 1000);

    setTimeout(async () => {
      try { const s = await navigator.mediaDevices.getUserMedia({ audio: true }); s.getTracks().forEach(t => t.stop()); setSystemCheckStatus(p => ({ ...p, microphone: 'success' })); }
      catch { setSystemCheckStatus(p => ({ ...p, microphone: 'failed' })); }
    }, 1500);

    setTimeout(() => { setSystemCheckStatus(p => ({ ...p, internet: navigator.onLine ? 'success' : 'failed' })); }, 2000);

    setTimeout(() => {
      const ok = /Chrome|Firefox|Edg/.test(navigator.userAgent);
      setSystemCheckStatus(p => ({ ...p, browser: ok ? 'success' : 'failed' }));
    }, 2500);

    setTimeout(() => {
      setSystemCheckStatus(p => ({ ...p, fullscreen: 'requestFullscreen' in document.documentElement ? 'success' : 'failed' }));
    }, 3000);

  setTimeout(async () => {
  try {
    const s = await (navigator.mediaDevices as any).getDisplayMedia({ video: { displaySurface: 'monitor' } });
    const surface = s.getVideoTracks()[0].getSettings().displaySurface;
    s.getTracks().forEach((t: MediaStreamTrack) => t.stop());
    setSystemCheckStatus(p => ({ ...p, screen: (surface === 'monitor' || surface === undefined) ? 'success' : 'failed' }));
  } catch {
    setSystemCheckStatus(p => ({ ...p, screen: 'failed' }));
  } finally {
    setCheckingComplete(true);
  }
}, 3500);
  };

  const retrySpecificCheck = async (key: string) => {
    setSystemCheckStatus(p => ({ ...p, [key]: 'checking' }));
    switch (key) {
      case 'camera': try { const s = await navigator.mediaDevices.getUserMedia({ video: true }); s.getTracks().forEach(t => t.stop()); setSystemCheckStatus(p => ({ ...p, camera: 'success' })); } catch { setSystemCheckStatus(p => ({ ...p, camera: 'failed' })); } break;
      case 'microphone': try { const s = await navigator.mediaDevices.getUserMedia({ audio: true }); s.getTracks().forEach(t => t.stop()); setSystemCheckStatus(p => ({ ...p, microphone: 'success' })); } catch { setSystemCheckStatus(p => ({ ...p, microphone: 'failed' })); } break;
      case 'internet': setSystemCheckStatus(p => ({ ...p, internet: navigator.onLine ? 'success' : 'failed' })); break;
      case 'browser': setSystemCheckStatus(p => ({ ...p, browser: /Chrome|Firefox|Edg/.test(navigator.userAgent) ? 'success' : 'failed' })); break;
      case 'fullscreen': setSystemCheckStatus(p => ({ ...p, fullscreen: 'requestFullscreen' in document.documentElement ? 'success' : 'failed' })); break;
     case 'screen':
  try {
    const s = await (navigator.mediaDevices as any).getDisplayMedia({ video: { displaySurface: 'monitor' } });
    const surface = s.getVideoTracks()[0].getSettings().displaySurface;
    s.getTracks().forEach((t: MediaStreamTrack) => t.stop());
    setSystemCheckStatus(p => ({ ...p, screen: (surface === 'monitor' || surface === undefined || surface === null) ? 'success' : 'failed' }));
  } catch {
    setSystemCheckStatus(p => ({ ...p, screen: 'failed' }));
  }
  break;
    }
  };

  // ============================================================
  // Auto-redirect if exam already submitted / ended
  // ============================================================
  const isAlreadySubmitted =
    !!examError &&
    (examError.toLowerCase().includes('already') ||
      examError.toLowerCase().includes('submitted') ||
      examError.toLowerCase().includes('ended'));

  useEffect(() => {
    if (isAlreadySubmitted) navigate('/classes');
  }, [isAlreadySubmitted]);

  // ============================================================
  // Loading / Error States
  // ============================================================
  if (examLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading exam...</p>
        </div>
      </div>
    );
  }

  if (isAlreadySubmitted) return null;

  if (examError || !examData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center bg-white p-8 rounded-xl shadow-md max-w-md">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Failed to Load Exam</h2>
          <p className="text-gray-500 mb-4">{examError}</p>
          <button onClick={() => navigate('/classes')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Back to Classes
          </button>
        </div>
      </div>
    );
  }

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
    "Reaching 10 violation points will result in automatic exam termination",
  ];

  // ============================================================
  // Rules View
  // ============================================================
  if (currentView === 'rules') {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 mb-6 shadow-lg text-white">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{examData.title}</h1>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2 text-blue-100"><Clock size={18} /><span className="text-sm">Duration</span></div>
                <p className="text-2xl font-bold">{examData.duration} min</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2 text-blue-100"><FileText size={18} /><span className="text-sm">Questions</span></div>
                <p className="text-2xl font-bold">{examData.questions.length}</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2 text-blue-100"><FileText size={18} /><span className="text-sm">Total Marks</span></div>
                <p className="text-2xl font-bold">{examData.total_marks}</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2 text-blue-100"><Shield size={18} /><span className="text-sm">Security</span></div>
                <p className="text-2xl font-bold">Locked</p>
              </div>
            </div>
          </div>

          {examData.instructions && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-6">
              <h3 className="font-semibold text-blue-800 mb-2">Instructions</h3>
              <p className="text-blue-700 text-sm">{examData.instructions}</p>
            </div>
          )}

          <div className="bg-white rounded-xl p-6 mb-6 shadow-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-2 rounded-lg"><Ban className="text-red-600" size={24} /></div>
              <h2 className="text-xl font-bold text-gray-800">Exam Rules & Security Measures</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {examRules.map((rule, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="text-green-500 flex-shrink-0 mt-0.5" size={20} />
                  <p className="text-gray-700 text-sm">{rule}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={agreedToRules} onChange={e => setAgreedToRules(e.target.checked)}
                className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
              <div>
                <p className="font-semibold text-gray-900 mb-2">I have read and agree to all exam rules and security measures</p>
                <p className="text-sm text-gray-600">By checking this box, you acknowledge that all copy/paste functions are disabled, full-screen mode is mandatory, tab switching is prohibited, and violations will result in point deductions.</p>
              </div>
            </label>
          </div>

          <button onClick={() => setCurrentView('face-recognition')} disabled={!agreedToRules}
            className={`w-full py-4 px-6 rounded-xl font-semibold text-white text-lg flex items-center justify-center gap-2 transition-all ${agreedToRules ? 'bg-blue-600 hover:bg-blue-700 shadow-lg' : 'bg-gray-400 cursor-not-allowed'}`}>
            <ScanFace size={20} /> Proceed To Identity Verification <ChevronRight size={20} />
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // Face Recognition View
  // ============================================================
  if (currentView === 'face-recognition') {
    const attemptsLeft = MAX_FACE_ATTEMPTS - faceAttempts;
    const isMaxAttempts = faceAttempts >= MAX_FACE_ATTEMPTS;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-lg w-full">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-3 rounded-full"><ScanFace className="w-7 h-7 text-blue-600" /></div>
              <div><h1 className="text-xl font-bold text-gray-900">Identity Verification</h1><p className="text-gray-500 text-sm">Step 1 of 3 · Face Recognition</p></div>
            </div>
            <button onClick={() => { stopFaceCamera(); setCurrentView('rules'); }} className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm">
              <ChevronLeft size={18} /> Back
            </button>
          </div>

          <div className="flex items-center gap-2 mb-6">
            {[{ label: 'Identity', active: true, done: faceStatus === 'success' }, { label: 'System Check', active: false, done: false }, { label: 'Start Exam', active: false, done: false }].map((step, i) => (
              <React.Fragment key={i}>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${step.done ? 'bg-green-100 text-green-700' : step.active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                  {step.done ? <CheckCircle size={12} /> : <span className="w-4 h-4 rounded-full border-2 border-current flex items-center justify-center text-[10px]">{i + 1}</span>}
                  {step.label}
                </div>
                {i < 2 && <div className="flex-1 h-px bg-gray-200" />}
              </React.Fragment>
            ))}
          </div>

          <div className="relative mb-6">
            <div className={`relative rounded-2xl overflow-hidden bg-gray-900 aspect-video border-4 transition-colors duration-300 ${faceStatus === 'success' ? 'border-green-500' : faceStatus === 'failed' ? 'border-red-500' : faceStatus === 'verifying' ? 'border-yellow-400' : 'border-blue-500'}`}>
              <video ref={faceVideoRef} autoPlay muted playsInline style={{ transform: 'scaleX(-1)' }}
                className={`w-full h-full object-cover transition-opacity duration-300 ${['verifying', 'success', 'failed'].includes(faceStatus) ? 'opacity-30' : 'opacity-100'}`} />
              <canvas ref={faceCanvasRef} className="hidden" />

              {faceStatus === 'scanning' && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-44 h-56 border-4 border-blue-400 rounded-full opacity-70 animate-pulse" />
                  <div className="absolute bottom-4 left-0 right-0 text-center">
                    <span className="bg-black/50 text-white text-xs px-3 py-1 rounded-full">Position your face in the oval</span>
                  </div>
                </div>
              )}
              {faceStatus === 'requesting-camera' && (<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900"><Loader2 className="w-10 h-10 text-blue-400 animate-spin" /><p className="text-white text-sm">Starting camera...</p></div>)}
              {faceStatus === 'verifying' && (<div className="absolute inset-0 flex flex-col items-center justify-center gap-3"><Loader2 className="w-12 h-12 text-yellow-400 animate-spin" /><p className="text-white font-semibold text-lg">Verifying Identity...</p></div>)}
              {faceStatus === 'success' && (<div className="absolute inset-0 flex flex-col items-center justify-center gap-3"><div className="bg-green-500/20 p-4 rounded-full"><UserCheck className="w-14 h-14 text-green-400" /></div><p className="text-white font-bold text-xl">Identity Confirmed!</p><p className="text-gray-300 text-sm animate-pulse">Redirecting to System Check...</p></div>)}
              {faceStatus === 'failed' && (<div className="absolute inset-0 flex flex-col items-center justify-center gap-3"><div className="bg-red-500/20 p-4 rounded-full"><UserX className="w-14 h-14 text-red-400" /></div><p className="text-white font-bold text-xl">Verification Failed</p><p className="text-gray-300 text-sm text-center px-6">{faceMessage}</p></div>)}
              {faceStatus === 'camera-error' && (<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900"><Camera className="w-12 h-12 text-gray-500" /><p className="text-white font-semibold">Camera Access Denied</p></div>)}
              {faceStatus === 'idle' && (<div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900"><Camera className="w-12 h-12 text-gray-500" /><p className="text-gray-400 text-sm">Camera not started</p></div>)}
            </div>
            {faceAttempts > 0 && faceStatus !== 'success' && (
              <div className={`absolute top-3 right-3 text-white text-xs px-2.5 py-1 rounded-full font-medium shadow ${isMaxAttempts ? 'bg-red-600' : 'bg-orange-500'}`}>
                {isMaxAttempts ? 'No attempts left' : `${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} left`}
              </div>
            )}
          </div>

          {faceStatus === 'scanning' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5">
              <h3 className="font-semibold text-blue-800 text-sm mb-2 flex items-center gap-2"><ScanFace size={16} /> Tips for best results</h3>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• Ensure good lighting on your face</li>
                <li>• Look directly at the camera</li>
                <li>• Remove glasses or hat if possible</li>
                <li>• Keep your face centered in the oval</li>
              </ul>
            </div>
          )}

          {isMaxAttempts && faceStatus === 'failed' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-5">
              <div className="flex items-start gap-2">
                <AlertTriangle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                <div><p className="text-red-800 font-semibold text-sm">Maximum attempts reached</p><p className="text-red-700 text-xs mt-1">Please contact your instructor for assistance.</p></div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            {faceStatus === 'idle' && (<button onClick={startFaceCamera} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2"><Camera size={20} /> Start Camera</button>)}
            {faceStatus === 'scanning' && (<button onClick={handleFaceVerify} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2"><ScanFace size={20} /> Verify My Identity</button>)}
            {faceStatus === 'failed' && !isMaxAttempts && (<button onClick={handleFaceRetry} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"><RefreshCw size={18} /> Try Again</button>)}
            {faceStatus === 'camera-error' && (<button onClick={startFaceCamera} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2"><Camera size={18} /> Retry Camera Access</button>)}
          </div>

          <p className="text-center text-xs text-gray-400 mt-4 flex items-center justify-center gap-1"><Shield size={12} /> Verification is encrypted and secure</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // System Check View
  // ============================================================
  if (currentView === 'system-check') {
    const checks = [
      { key: 'camera', icon: Camera, title: 'Camera Access', checkingDesc: 'Checking camera...', successDesc: 'Camera working properly', failedDesc: 'Camera access denied', troubleshooting: 'Allow camera access in browser settings' },
      { key: 'microphone', icon: Mic, title: 'Microphone Access', checkingDesc: 'Testing microphone...', successDesc: 'Microphone functioning correctly', failedDesc: 'Microphone not accessible', troubleshooting: 'Check microphone permissions' },
      { key: 'internet', icon: Wifi, title: 'Internet Connection', checkingDesc: 'Testing connection...', successDesc: 'Strong internet connection', failedDesc: 'Weak or unstable connection', troubleshooting: 'Check your internet connection' },
      { key: 'browser', icon: Monitor, title: 'Browser Compatibility', checkingDesc: 'Verifying browser...', successDesc: 'Browser is compatible', failedDesc: 'Browser not supported', troubleshooting: 'Use Chrome, Firefox, or Edge' },
      { key: 'fullscreen', icon: Maximize2, title: 'Fullscreen Support', checkingDesc: 'Checking fullscreen...', successDesc: 'Fullscreen mode supported', failedDesc: 'Fullscreen not supported', troubleshooting: 'Update your browser' },
      { key: 'screen', icon: Monitor, title: 'Screen Sharing', checkingDesc: '⚠️ Please select "Entire Screen" from the list then click Allow', successDesc: 'Screen sharing granted', failedDesc: 'Screen sharing denied',troubleshooting: 'You must share your Entire Screen — window or tab sharing is not allowed' },
    ];
    const allSuccess = Object.values(systemCheckStatus).every(s => s === 'success');

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 p-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-3xl w-full">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="bg-blue-100 p-3 rounded-full"><Settings className="w-8 h-8 text-blue-600" /></div>
              <div><h1 className="text-2xl font-bold text-gray-900">System Check</h1><p className="text-gray-600">Verifying your system meets exam requirements</p></div>
            </div>
            <button onClick={() => setCurrentView('face-recognition')} className="text-gray-600 hover:text-gray-900 flex items-center gap-2"><ChevronLeft size={20} /> Back</button>
          </div>

          <div className="space-y-3 mb-6">
            {checks.map(check => {
              const Icon = check.icon;
              const s = systemCheckStatus[check.key];
              return (
                <div key={check.key} className={`rounded-xl p-4 flex items-center justify-between border transition-all ${s === 'success' ? 'bg-green-50 border-green-200' : s === 'failed' ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center gap-4">
                    <Icon className={`w-6 h-6 ${s === 'checking' ? 'text-gray-400 animate-pulse' : 'text-gray-700'}`} />
                    <div>
                      <h3 className="font-semibold text-gray-900">{check.title}</h3>
                      <p className="text-sm text-gray-600">{s === 'checking' ? check.checkingDesc : s === 'success' ? check.successDesc : check.failedDesc}</p>
                      {s === 'failed' && <p className="text-xs text-gray-500 mt-1">{check.troubleshooting}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {s === 'checking' && <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
                    {s === 'success' && <CheckCircle className="w-6 h-6 text-green-600" />}
                    {s === 'failed' && (<><AlertTriangle className="w-6 h-6 text-red-600" /><button onClick={() => retrySpecificCheck(check.key)} className="text-sm text-blue-600 hover:underline px-2 py-1">Retry</button></>)}
                  </div>
                </div>
              );
            })}
          </div>

          {checkingComplete && allSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4"><CheckCircle className="w-8 h-8 text-green-600" /><div><h2 className="text-xl font-bold text-gray-900">All Systems Ready!</h2><p className="text-green-700">Your device meets all requirements</p></div></div>
              <button onClick={startExam} className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-3">
                <Lock className="w-5 h-5" /> Start Secure Exam <ChevronRight size={20} />
              </button>
            </div>
          )}

          {checkingComplete && !allSuccess && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-6"><div className="flex items-center gap-3"><AlertTriangle className="w-8 h-8 text-red-600" /><div><h2 className="text-xl font-bold text-gray-900">System Check Failed</h2><p className="text-red-700">Please fix the issues above before starting</p></div></div></div>
              <div className="flex gap-3">
                <button onClick={() => setCurrentView('face-recognition')} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-4 rounded-xl flex items-center justify-center gap-3"><ChevronLeft className="w-5 h-5" /> Back</button>
                <button onClick={runSystemChecks} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-3"><Settings className="w-5 h-5" /> Retry All Checks</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================================
  // Exam View
  // ============================================================
  if (currentView === 'exam' && examData) {
    const currentQ = examData.questions[currentQuestion];

    return (
      <div ref={examContainerRef} className="min-h-screen bg-gray-100 p-4 lg:p-8 select-none"
        style={{ userSelect: 'none', WebkitUserSelect: 'none' }} onContextMenu={e => e.preventDefault()}>
        <div className="max-w-7xl mx-auto">

          {/* Security Header */}
          <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-t-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5" />
              <span className="font-semibold text-sm">SECURE EXAM MODE ACTIVE</span>
              <div className="hidden md:flex items-center gap-4 ml-4 text-xs">
                <span className="flex items-center gap-1"><Copy size={12} /> Copy: <strong>Blocked</strong></span>
                <span className="flex items-center gap-1"><Ban size={12} /> Right-Click: <strong>Blocked</strong></span>
                <span className="flex items-center gap-1"><Maximize2 size={12} /> Fullscreen: <strong className={fullScreenActive ? 'text-green-300' : 'text-yellow-300 animate-pulse'}>{fullScreenActive ? 'Active' : 'Required'}</strong></span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={toggleFullScreen} className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg flex items-center gap-2">
                {fullScreenActive ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                <span className="text-sm">{fullScreenActive ? 'Exit' : 'Enter'} Fullscreen</span>
              </button>
              <div className="bg-white/20 px-3 py-1 rounded-lg">
                <span className="text-sm">Violations: </span>
                <span className={`font-bold ${violationScore >= 8 ? 'text-yellow-300 animate-pulse' : ''}`}>{violationScore.toFixed(1)}/10</span>
              </div>
            </div>
          </div>

          {/* Exam Header */}
          <div className="bg-white border-x border-t border-gray-200 p-6 flex flex-wrap justify-between items-center">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-gray-900">{examData.title}</h1>
              <p className="text-gray-600">Total: {examData.total_marks} Points</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end text-gray-700"><Clock className="w-5 h-5" /><span className="text-sm">Time Remaining</span></div>
              <div className={`text-3xl lg:text-4xl font-mono font-bold ${timeRemaining < 300 ? 'text-red-600 animate-pulse' : 'text-gray-900'}`}>{formatTime(timeRemaining)}</div>
            </div>
          </div>

          {/* Alerts */}
          {(proctorAlerts.length > 0 || !fullScreenActive || !tabFocus) && (
            <div className="bg-white border-x border-gray-200 px-6 py-3">
              <div className="flex flex-wrap gap-3">
                {proctorAlerts.slice(0, 2).map((alert, i) => (
                  <div key={i} className="bg-red-100 border border-red-300 text-red-800 px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4" /> ⚠️ {alert}
                  </div>
                ))}
                {!fullScreenActive && (
                  <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-2 rounded-lg flex items-center gap-2 text-sm animate-pulse">
                    <Maximize2 className="w-4 h-4" /> Full-screen exited —
                    <button onClick={requestFullScreen} className="font-bold underline">Click to re-enter</button>
                  </div>
                )}
                {!tabFocus && (
                  <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-2 rounded-lg flex items-center gap-2 text-sm animate-pulse">
                    <Eye className="w-4 h-4" /> Tab focus lost — Return to exam window
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
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                      Question {currentQuestion + 1} of {examData.questions.length}
                    </span>
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                      {currentQ.marks} marks
                    </span>
                  </div>
                  <button
                    title='Flag Question' onClick={toggleFlag} disabled={examTerminated}
                    className={`p-2 rounded-lg transition-colors ${flagged[currentQuestion] ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-400 hover:text-gray-600'}`}>
                    <Flag className="w-5 h-5" fill={flagged[currentQuestion] ? 'currentColor' : 'none'} />
                  </button>
                </div>

                <h2 className="text-xl font-semibold text-gray-900 mb-6">{currentQ.question_text}</h2>

                {/* Choices */}
                <div className="space-y-3 mb-8">
                  {currentQ.choices.map((choice, index) => (
                    <button key={choice.id} onClick={() => handleAnswerSelect(index)} disabled={examTerminated}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${answers[currentQuestion] === index ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300 bg-white'} ${examTerminated ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${answers[currentQuestion] === index ? 'border-blue-600' : 'border-gray-300'}`}>
                          {answers[currentQuestion] === index && <div className="w-3 h-3 rounded-full bg-blue-600" />}
                        </div>
                        <span className="text-gray-700">{choice.choice_text}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Navigation */}
                <div className="flex justify-between">
                  <button onClick={handlePrevious} disabled={currentQuestion === 0 || examTerminated}
                    className="flex items-center gap-2 px-6 py-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed">
                    <ChevronLeft className="w-4 h-4" /> Previous
                  </button>
                  <button onClick={currentQuestion === examData.questions.length - 1 ? () => setShowSubmitModal(true) : handleNext}
                    disabled={examTerminated}
                    className={`flex items-center gap-2 px-6 py-3 rounded-lg text-white transition-colors ${currentQuestion === examData.questions.length - 1 ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} ${examTerminated ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {currentQuestion === examData.questions.length - 1 ? 'Submit Exam' : 'Next'} <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Navigator */}
              <div className="bg-gray-50 rounded-xl p-6 h-fit lg:sticky lg:top-6">
                <h3 className="font-semibold text-gray-900 mb-4">Questions</h3>
                <div className="grid grid-cols-5 gap-2 mb-6">
                  {examData.questions.map((_, i) => {
                    const s = getQuestionStatus(i);
                    return (
                      <button key={i} onClick={() => { if (!examTerminated) setCurrentQuestion(i); }} disabled={examTerminated}
                        className={`aspect-square rounded-lg font-medium text-sm transition-all ${i === currentQuestion ? 'ring-2 ring-blue-600 ring-offset-2' : ''} ${s === 'answered' ? 'bg-green-500 text-white' : s === 'flagged' ? 'bg-yellow-400 text-gray-900' : 'bg-white border-2 border-gray-200 text-gray-700'} ${examTerminated ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        {i + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Camera Preview */}
                <div className="mb-4 border border-gray-200 rounded-lg overflow-hidden bg-black aspect-video relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <Camera size={12} />
                    <span>Camera Active</span>
                  </div>
                  <div className="absolute top-2 right-2">
                    <div className="flex items-center gap-1 bg-green-500/80 text-white text-xs px-2 py-1 rounded-full">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                      LIVE
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm border-t border-gray-200 pt-4">
                  <div className="flex justify-between"><span className="text-gray-600">Answered:</span><span className="font-semibold text-green-600">{answeredCount}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Flagged:</span><span className="font-semibold text-yellow-600">{flaggedCount}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Unanswered:</span><span className="font-semibold text-red-600">{unansweredCount}</span></div>
                </div>
                {violationScore >= 8 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4 text-red-600" /><span className="text-sm font-medium text-red-800">High Violation Score</span></div>
                    <p className="text-xs text-red-700">{Math.max(0, 10 - violationScore).toFixed(1)} points before termination</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-b-xl p-4 text-xs text-gray-500 flex flex-wrap justify-between">
            <span>© ExamGuard — All actions are monitored and recorded</span>
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Secure Exam Mode Active</span>
          </div>
        </div>

        {/* Submit Modal */}
        {showSubmitModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
              <div className="flex items-start gap-3 mb-4">
                <div className="bg-orange-100 p-2 rounded-full"><AlertTriangle className="w-6 h-6 text-orange-600" /></div>
                <div><h2 className="text-xl font-bold text-gray-900">Submit Exam?</h2><p className="text-gray-600 text-sm mt-1">Review your progress before submitting</p></div>
              </div>
              <div className="space-y-3 mb-4">
                <div className="flex justify-between py-2 border-b"><span className="text-gray-600">Answered:</span><span className="font-semibold text-green-600">{answeredCount}/{examData.questions.length}</span></div>
                <div className="flex justify-between py-2 border-b"><span className="text-gray-600">Unanswered:</span><span className="font-semibold text-red-600">{unansweredCount}</span></div>
                <div className="flex justify-between py-2 border-b"><span className="text-gray-600">Flagged:</span><span className="font-semibold text-yellow-600">{flaggedCount}</span></div>
                <div className="flex justify-between py-2 border-b"><span className="text-gray-600">Violation Score:</span><span className={`font-semibold ${violationScore >= 7 ? 'text-red-600' : 'text-gray-900'}`}>{violationScore.toFixed(1)}/10</span></div>
              </div>
              {unansweredCount > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-orange-800">You have {unansweredCount} unanswered question{unansweredCount !== 1 ? 's' : ''}.</p>
                </div>
              )}
              <p className="text-sm text-gray-600 mb-6">Once submitted, you cannot change your answers.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowSubmitModal(false)} className="flex-1 px-6 py-3 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium">Cancel</button>
                <button onClick={handleSubmitConfirm} disabled={submitLoading}
                  className="flex-1 px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium flex items-center justify-center gap-2 disabled:opacity-60">
                  {submitLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Send className="w-4 h-4" />}
                  {submitLoading ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // Terminated View
  // ============================================================
  if (currentView === 'terminated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 p-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center">
          <div className="mb-6 flex justify-center"><div className="bg-red-100 p-4 rounded-full"><Ban className="w-16 h-16 text-red-600" /></div></div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Exam Terminated</h1>
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
            <p className="text-lg text-gray-800 mb-4">Your exam has been automatically terminated due to multiple security violations.</p>
            <div className="space-y-3 text-left bg-white p-4 rounded-lg">
              <div className="flex justify-between"><span className="text-gray-600">Violation Score:</span><span className="font-bold text-red-600">{violationScore.toFixed(1)}/10</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Reason:</span><span className="font-bold text-gray-800">{terminationReason}</span></div>
              <div className="flex justify-between"><span className="text-gray-600">Questions Answered:</span><span className="font-bold text-blue-600">{answeredCount}/{examData?.questions.length}</span></div>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-800">Your responses have been recorded and will be reviewed by the exam administrator.</p>
          </div>
          <button onClick={() => navigate('/classes')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // Time Up View
  // ============================================================
  if (currentView === 'time-up') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-yellow-100 p-8 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full text-center">
          <div className="mb-6 flex justify-center">
            <div className="bg-orange-100 p-4 rounded-full">
              <Clock className="w-16 h-16 text-orange-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Time's Up!</h1>
          <p className="text-lg text-gray-700 mb-6">
            Your exam has been submitted automatically.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-800">
              Your responses have been recorded. You will be redirected shortly.
            </p>
          </div>
          <button onClick={() => navigate('/classes')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors">
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default ExamInterface;