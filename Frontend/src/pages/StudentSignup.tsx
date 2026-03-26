import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ScanFace, Camera, CheckCircle, AlertTriangle,
  RefreshCw, Loader2, UserCheck, UserX, Shield,
  ChevronLeft, Info
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type RegisterStatus =
  | 'idle'
  | 'requesting-camera'
  | 'scanning'
  | 'registering'
  | 'success'
  | 'failed'
  | 'camera-error';

// ─── Component ────────────────────────────────────────────────────────────────
const FaceRegister: React.FC = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');

  // جيب student_id من الـ JWT
  const studentId = (() => {
    try {
      const payload = JSON.parse(atob(token!.split('.')[1]));
      return payload.custom_id as string;
    } catch {
      return null;
    }
  })();

  const [status, setStatus] = useState<RegisterStatus>('idle');
  const [message, setMessage] = useState('');
  const [attempts, setAttempts] = useState(0);
  const MAX_ATTEMPTS = 3;

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // ── Camera helpers ──────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    setStatus('requesting-camera');
    setMessage('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus('scanning');
    } catch {
      setStatus('camera-error');
      setMessage('Camera access was denied. Please allow camera permissions and try again.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  const captureFrame = useCallback((): string | null => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.85);
  }, []);

  // Stop camera when leaving
  useEffect(() => () => stopCamera(), [stopCamera]);

  // ── Register ────────────────────────────────────────────────────────────────
  const handleRegister = useCallback(async () => {
    if (status !== 'scanning') return;
    const image = captureFrame();
    if (!image) return;

    setStatus('registering');
    setMessage('');

    try {
      const response = await fetch(
        'https://examguard-ai-production.up.railway.app/api/student/face/register/',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ student_id: studentId, image }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setMessage(data.message || 'Face registered successfully!');
        setStatus('success');
        stopCamera();
      } else {
        setMessage(data.message || 'Registration failed. Please try again.');
        setStatus('failed');
        setAttempts(prev => prev + 1);
      }
    } catch {
      setMessage('Connection error. Please check your internet and try again.');
      setStatus('failed');
      setAttempts(prev => prev + 1);
    }
  }, [status, captureFrame, studentId, token, stopCamera]);

  const handleRetry = useCallback(() => {
    setMessage('');
    setStatus('scanning');
  }, []);

  const attemptsLeft = MAX_ATTEMPTS - attempts;
  const isMaxAttempts = attempts >= MAX_ATTEMPTS;

  // ── Border colour by status ─────────────────────────────────────────────────
  const borderColor =
    status === 'success' ? 'border-emerald-500' :
    status === 'failed' ? 'border-red-500' :
    status === 'registering' ? 'border-amber-400' :
    'border-blue-500';

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-6">

      {/* Card */}
      <div className="w-full max-w-lg bg-slate-800/70 backdrop-blur-xl border border-slate-700 rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
          <button
            onClick={() => { stopCamera(); navigate(-1); }}
            className="flex items-center gap-1 text-blue-100 hover:text-white text-sm mb-4 transition-colors"
          >
            <ChevronLeft size={16} /> Back
          </button>
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-3 rounded-2xl">
              <ScanFace className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Face Registration</h1>
              <p className="text-blue-100 text-sm mt-0.5">
                Register your face for secure exam verification
              </p>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 space-y-6">

          {/* Info Banner */}
          <div className="flex items-start gap-3 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
            <Info size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
            <p className="text-blue-200 text-sm leading-relaxed">
              Your face data is stored securely and used only for identity verification
              during exams. Make sure you're in a well-lit environment.
            </p>
          </div>

          {/* Camera View */}
          <div className={`relative rounded-2xl overflow-hidden bg-slate-900 aspect-video border-4 transition-all duration-300 ${borderColor}`}>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              style={{ transform: 'scaleX(-1)' }}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                ['registering', 'success', 'failed'].includes(status) ? 'opacity-30' : 'opacity-100'
              }`}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Overlays */}
            {status === 'scanning' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {/* Face oval guide */}
                <div className="w-44 h-56 border-4 border-blue-400 rounded-full opacity-70 animate-pulse" />
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <span className="bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
                    Position your face in the oval
                  </span>
                </div>
              </div>
            )}

            {status === 'requesting-camera' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900">
                <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                <p className="text-white text-sm">Starting camera...</p>
              </div>
            )}

            {status === 'registering' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-12 h-12 text-amber-400 animate-spin" />
                <p className="text-white font-semibold text-lg">Registering Face...</p>
                <p className="text-slate-300 text-sm">Please hold still</p>
              </div>
            )}

            {status === 'success' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="bg-emerald-500/20 p-4 rounded-full">
                  <UserCheck className="w-14 h-14 text-emerald-400" />
                </div>
                <p className="text-white font-bold text-xl">Registration Successful!</p>
                <p className="text-slate-300 text-sm text-center px-6">{message}</p>
              </div>
            )}

            {status === 'failed' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="bg-red-500/20 p-4 rounded-full">
                  <UserX className="w-14 h-14 text-red-400" />
                </div>
                <p className="text-white font-bold text-xl">Registration Failed</p>
                <p className="text-slate-300 text-sm text-center px-6">{message}</p>
              </div>
            )}

            {status === 'camera-error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900">
                <Camera className="w-12 h-12 text-slate-500" />
                <p className="text-white font-semibold">Camera Access Denied</p>
                <p className="text-slate-400 text-xs text-center px-6">{message}</p>
              </div>
            )}

            {status === 'idle' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-900">
                <Camera className="w-12 h-12 text-slate-600" />
                <p className="text-slate-400 text-sm">Camera not started</p>
              </div>
            )}

            {/* Attempts badge */}
            {attempts > 0 && status !== 'success' && (
              <div className={`absolute top-3 right-3 text-white text-xs px-2.5 py-1 rounded-full font-medium shadow ${
                isMaxAttempts ? 'bg-red-600' : 'bg-orange-500'
              }`}>
                {isMaxAttempts ? 'No attempts left' : `${attemptsLeft} attempt${attemptsLeft !== 1 ? 's' : ''} left`}
              </div>
            )}
          </div>

          {/* Tips (only when scanning) */}
          {status === 'scanning' && (
            <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-4">
              <h3 className="font-semibold text-slate-200 text-sm mb-2 flex items-center gap-2">
                <ScanFace size={16} className="text-blue-400" /> Tips for best results
              </h3>
              <ul className="text-slate-400 text-sm space-y-1">
                <li>• Make sure your face is well-lit from the front</li>
                <li>• Look directly at the camera lens</li>
                <li>• Remove glasses or hat if possible</li>
                <li>• Keep your face centered in the oval guide</li>
              </ul>
            </div>
          )}

          {/* Max attempts warning */}
          {isMaxAttempts && status === 'failed' && (
            <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
              <div>
                <p className="text-red-300 font-semibold text-sm">Maximum attempts reached</p>
                <p className="text-red-400 text-xs mt-1">
                  Please ensure your profile photo is clear and contact your instructor if the problem persists.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {(status === 'idle' || status === 'camera-error') && (
              <button
                onClick={startCamera}
                className="flex-1 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <Camera size={20} /> Start Camera
              </button>
            )}

            {status === 'scanning' && (
              <button
                onClick={handleRegister}
                className="flex-1 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <ScanFace size={20} /> Register My Face
              </button>
            )}

            {status === 'failed' && !isMaxAttempts && (
              <button
                onClick={handleRetry}
                className="flex-1 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <RefreshCw size={18} /> Try Again
              </button>
            )}

            {status === 'success' && (
              <button
                onClick={() => navigate(-1)}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <CheckCircle size={20} /> Done — Go Back
              </button>
            )}
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-slate-500 flex items-center justify-center gap-1">
            <Shield size={12} /> Face data is encrypted and stored securely
          </p>

        </div>
      </div>
    </div>
  );
};

export default FaceRegister;