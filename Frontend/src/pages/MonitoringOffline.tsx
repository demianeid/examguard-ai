import React, { useState, useEffect, useRef, type FC } from 'react';
import {
  Video, Camera, Users, AlertCircle, Shield,
  MapPin, Activity, Eye, Mic, Clock,
  Download,
  User, Phone, FileText, Volume2, Radio, WifiOff,
  CheckCircle, XCircle, AlertTriangle, Wifi,
  Save, Loader2, Play, FileSpreadsheet
} from 'lucide-react';
import { downloadXlsx } from '../utils/xlsxExport';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  examHallApi,
  monitoringApi,
  offlineExamApi,
  studentZoneApi,
  cameraApi,
  type ExamHall,
  type Alert as HwAlert,
  type MonitoringSession,
  type OfflineExam,
  type StudentZone,
  type Camera as CameraType,
} from '../services/api';

type SeatStatus = 'normal' | 'warning' | 'alert';

interface Seat {
  id: number;
  studentId: string;
  studentName: string;
  seatNumber: string;
  status: SeatStatus;
  faceMatch: boolean;
  violations: number;
  lastActivity: string;
  cameraId?: number;
  streamUrl: string;
  zoneId: number;
}

interface Stats {
  totalStudents: number;
  normalBehavior: number;
  suspicious: number;
  violations: number;
  camerasOnline: number;
  faceMatchRate: number;
  avgViolationsPerStudent: number;
}

interface Feature {
  icon: React.ReactNode;
  label: string;
  status: boolean;
}

// --- Live Zone Canvas Component ---
// Crops an MJPEG live stream in real-time onto a canvas (0 lag)
// Defined OUTSIDE to prevent React from unmounting it on every parent render
const LiveZoneCanvas: FC<{ streamUrl: string; zone: StudentZone }> = ({ streamUrl, zone }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    let animationId: number;
    const draw = () => {
      const canvas = canvasRef.current;
      const img = imgRef.current;
      if (canvas && img && img.complete && img.naturalWidth > 0) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Zone bounds (rounded to avoid floating point canvas resizing loops)
          const x = Math.round(Math.max(0, zone.x1));
          const y = Math.round(Math.max(0, zone.y1));
          const w = Math.round(Math.max(1, zone.x2 - zone.x1));
          const h = Math.round(Math.max(1, zone.y2 - zone.y1));

          if (canvas.width !== w) canvas.width = w;
          if (canvas.height !== h) canvas.height = h;

          ctx.drawImage(img, x, y, w, h, 0, 0, w, h);
        }
      }
      animationId = requestAnimationFrame(draw);
    };
    animationId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animationId);
  }, [zone.x1, zone.y1, zone.x2, zone.y2]);

  return (
    <>
      <img ref={imgRef} src={streamUrl} style={{ display: 'none' }} crossOrigin="anonymous" />
      <canvas ref={canvasRef} className="w-full h-full object-cover rounded-xl block bg-black" />
    </>
  );
};

const OfflineMonitoringPage: FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const examIdParam = searchParams.get('examId');

  const [halls, setHalls] = useState<ExamHall[]>([]);
  const [selectedHallId, setSelectedHallId] = useState<number | null>(null);
  const [hallsLoading, setHallsLoading] = useState(true);
  const [hallsError, setHallsError] = useState('');

  const [exam, setExam] = useState<OfflineExam | null>(null);
  const [zones, setZones] = useState<StudentZone[]>([]);
  const [hallCameras, setHallCameras] = useState<CameraType[]>([]);
  const [zonesLoading, setZonesLoading] = useState(false);

  const [session, setSession] = useState<MonitoringSession | null>(null);
  const [alerts, setAlerts] = useState<HwAlert[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [showEarlyStartWarning, setShowEarlyStartWarning] = useState(false);
  const [earlyMins, setEarlyMins] = useState(0);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [time, setTime] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [wsConnected, setWsConnected] = useState(false);
  const [expandedSnap, setExpandedSnap] = useState<string | null>(null);
  const [expandedCameraUrl, setExpandedCameraUrl] = useState<string | null>(null);

  // Snapshot fallback for local webcams (e.g., "0")
  const [seatSnapshot, setSeatSnapshot] = useState<string | null>(null);
  const [seatSnapshotLoading, setSeatSnapshotLoading] = useState(false);
  const seatSnapshotIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentHall = halls.find(h => h.id === selectedHallId);

  // Build seats from zones + alerts
  const seats: Seat[] = React.useMemo(() => {
    return zones.map((zone, i) => {
      const zoneAlerts = alerts.filter(a => a.zone === zone.id);
      const highCount   = zoneAlerts.filter(a => a.severity === 'high').length;
      const mediumCount = zoneAlerts.filter(a => a.severity === 'medium').length;
      const lowCount    = zoneAlerts.filter(a => a.severity === 'low').length;

      let status: SeatStatus = 'normal';
      if (highCount > 0) status = 'alert';
      else if (mediumCount > 0 || lowCount > 0) status = 'warning';

      const cam = hallCameras.find(c => c.id === zone.camera);
      const faceAlerts = zoneAlerts.filter(a =>
        a.alert_type === 'no_face' || a.alert_type === 'multiple_faces'
      );

      return {
        id: i + 1,
        studentId: String(zone.student_code || ''),
        // Prefer the dynamically-resolved name from enrollment; fall back to static field
        studentName:
          zone.dynamic_student_name ||
          zone.student_name ||
          `Student ${zone.student_code || i + 1}`,
        // Prefer the dynamically-resolved seat number; fall back to static field
        seatNumber:
          zone.dynamic_seat_number ||
          zone.seat_number ||
          String(i + 1),
        status,
        faceMatch: faceAlerts.length === 0,
        violations: zoneAlerts.length,
        lastActivity: zoneAlerts.length > 0
          ? new Date(zoneAlerts[zoneAlerts.length - 1].timestamp).toLocaleTimeString()
          : 'No activity',
        cameraId: zone.camera,
        streamUrl: cam?.stream_url || '',
        zoneId: zone.id,
      };
    });
  }, [zones, alerts, hallCameras]);

  const stats: Stats = React.useMemo(() => {
    const total = seats.length;
    const violationCount = seats.filter(s => s.status === 'alert').length;
    const suspiciousCount = seats.filter(s => s.status === 'warning').length;
    return {
      totalStudents: total,
      normalBehavior: total - violationCount - suspiciousCount,
      suspicious: suspiciousCount,
      violations: violationCount,
      camerasOnline: hallCameras.length,
      faceMatchRate: total > 0 ? Math.round((seats.filter(s => s.faceMatch).length / total) * 100) : 0,
      avgViolationsPerStudent: total > 0 ? parseFloat((seats.reduce((sum, s) => sum + s.violations, 0) / total).toFixed(2)) : 0,
    };
  }, [seats, hallCameras]);

  // Fetch halls
  useEffect(() => {
    const load = async () => {
      setHallsLoading(true);
      setHallsError('');
      try {
        const data = await examHallApi.getAll();
        setHalls(data);
        if (!examIdParam && data.length > 0) setSelectedHallId(data[0].id);
      } catch {
        setHallsError('Failed to load exam halls.');
      } finally {
        setHallsLoading(false);
      }
    };
    load();
  }, []);

  // Fetch exam details → auto-select hall
  useEffect(() => {
    if (!examIdParam) return;
    offlineExamApi.getById(Number(examIdParam))
      .then(e => {
        setExam(e);
        setSelectedHallId(e.hall);
      })
      .catch(() => {});
  }, [examIdParam]);

  // Fetch zones for exam
  useEffect(() => {
    if (!examIdParam) return;
    setZonesLoading(true);
    studentZoneApi.getByExam(Number(examIdParam))
      .then(z => setZones(z))
      .catch(() => setZones([]))
      .finally(() => setZonesLoading(false));
  }, [examIdParam]);

  // Fetch cameras for the exam's hall
  useEffect(() => {
    if (!exam?.hall) return;
    cameraApi.getByHall(exam.hall)
      .then(c => setHallCameras(c))
      .catch(() => setHallCameras([]));
  }, [exam?.hall]);

  // Fetch session + alerts when examId is present
  useEffect(() => {
    if (!examIdParam) return;
    const examId = Number(examIdParam);
    const loadSession = async () => {
      try {
        const s = await monitoringApi.getSession(examId);
        setSession(s);
        if (s.status === 'active' || s.status === 'running') {
          setIsMonitoring(true);
          const elapsed = Math.floor((Date.now() - new Date(s.started_at).getTime()) / 1000);
          setTime(Math.max(0, elapsed));
        }
        if (s.id) {
          setAlertsLoading(true);
          const a = await monitoringApi.getAlerts(s.id);
          setAlerts(a);
          setAlertsLoading(false);
        }
      } catch {
        // No active session yet
      }
    };
    loadSession();
  }, [examIdParam]);

  // WebSocket — real-time alert feed (Phase 6)
  useEffect(() => {
    if (!isMonitoring || !session?.id || !examIdParam) return;

    const defaultWsUrl = `ws://${window.location.hostname}:8000`;
    const WS_BASE = (import.meta.env.VITE_WS_URL || defaultWsUrl).replace(/\/$/, '');
    const wsUrl   = `${WS_BASE}/ws/exam/${examIdParam}/alerts/`;
    const ws      = new WebSocket(wsUrl);

    ws.onopen = () => {
      setWsConnected(true);
      console.log('[WS] Connected to', wsUrl);
    };

    ws.onmessage = (event) => {
      try {
        const alert = JSON.parse(event.data) as HwAlert;
        setAlerts(prev => {
          // Prevent duplicates if REST API already fetched it
          if (prev.some(a => a.id === alert.id)) return prev;
          return [alert, ...prev];
        });
      } catch (e) {
        console.warn('[WS] Could not parse message:', event.data);
      }
    };

    ws.onerror = (err) => console.error('[WS] Error:', err);

    ws.onclose = () => {
      setWsConnected(false);
      console.log('[WS] Disconnected');
    };

    // FALLBACK: Poll the database every 1 second.
    // This is required because run_local_ai runs in a separate process, and
    // Django's InMemoryChannelLayer cannot route messages between processes!
    const pollInterval = setInterval(async () => {
      try {
        const freshAlerts = await monitoringApi.getAlerts(session.id);
        setAlerts(freshAlerts);
      } catch (err) {
        console.error('[Polling] Failed to fetch alerts:', err);
      }
    }, 1000);

    return () => {
      ws.close();
      setWsConnected(false);
      clearInterval(pollInterval);
    };
  }, [isMonitoring, session?.id, examIdParam]);

  // Poll alerts every 1 s — always on while monitoring
  // (WebSocket push is a bonus on top of this reliable baseline)
  useEffect(() => {
    if (!isMonitoring || !session?.id) return;
    const interval = setInterval(async () => {
      try {
        const a = await monitoringApi.getAlerts(session.id);
        setAlerts(a);
      } catch { /* ignore */ }
    }, 1000);
    return () => clearInterval(interval);
  }, [isMonitoring, session?.id]);

  // Zone snapshot — polls the cropped zone view every 2s when a seat is selected
  useEffect(() => {
    if (seatSnapshotIntervalRef.current) {
      clearInterval(seatSnapshotIntervalRef.current);
      seatSnapshotIntervalRef.current = null;
    }

    if (!selectedSeat?.zoneId) {
      setSeatSnapshot(null);
      return;
    }

    const fetchSnap = async () => {
      setSeatSnapshotLoading(true);
      try {
        const data = await studentZoneApi.getZoneSnapshot(selectedSeat.zoneId);
        setSeatSnapshot(data.snapshot);
      } catch {
        setSeatSnapshot(null);
      } finally {
        setSeatSnapshotLoading(false);
      }
    };

    fetchSnap();
    seatSnapshotIntervalRef.current = setInterval(fetchSnap, 2000);

    return () => {
      if (seatSnapshotIntervalRef.current) {
        clearInterval(seatSnapshotIntervalRef.current);
        seatSnapshotIntervalRef.current = null;
      }
    };
  }, [selectedSeat?.zoneId]);

  // Timer ticks while monitoring
  useEffect(() => {
    if (!isMonitoring) return;
    const timer = setInterval(() => setTime(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [isMonitoring]);

  // --- Actions ---
  const onStartMonitoringClick = () => {
    if (!examIdParam || !exam) return;
    
    // Time check
    const [y, m, d] = exam.date.split('-').map(Number);
    const [h, min] = exam.start_time.split(':').map(Number);
    const examDate = new Date(y, m - 1, d, h, min);
    const now = new Date();
    const diffMins = Math.floor((examDate.getTime() - now.getTime()) / 60000);
    
    if (exam.computed_status === 'upcoming' && diffMins > 0) {
      setEarlyMins(diffMins);
      setShowEarlyStartWarning(true);
    } else {
      executeStartMonitoring();
    }
  };

  const executeStartMonitoring = async () => {
    if (!examIdParam) return;
    setShowEarlyStartWarning(false);
    setActionLoading(true);
    setActionError('');
    try {
      const s = await monitoringApi.startMonitoring(Number(examIdParam));
      setSession(s);
      setIsMonitoring(true);
      setTime(0);
    } catch {
      setActionError('Failed to start monitoring.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndMonitoringClick = () => {
    setShowEndConfirm(true);
  };

  const executeEndMonitoring = async () => {
    if (!session?.id) return;

    setActionLoading(true);
    setActionError('');
    try {
      await monitoringApi.endMonitoring(session.id);
      
      // Auto-generate the report to connect AI detection alerts for the ReportPage
      try {
        await monitoringApi.generateReport(session.id);
      } catch (err) {
        console.error("Failed to auto-generate report:", err);
      }

      setIsMonitoring(false);
      setSession(prev => prev ? { ...prev, status: 'ended' } : null);
      setShowEndConfirm(false);
      navigate('/exams');
    } catch {
      setActionError('Failed to end monitoring.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (!session?.id) return;
    setActionLoading(true);
    setActionError('');
    try {
      // 1. Generate report on backend (connects violations)
      await monitoringApi.generateReport(session.id);

      // 2. Fetch raw violations from backend
      const violations = await monitoringApi.getViolations(session.id);

      // ── Sheet 1: Session Summary ──────────────────────────────
      const examTitle  = exam?.title  || 'N/A';
      const hallName   = currentHall?.name ?? exam?.hall_name ?? 'N/A';
      const exportedAt = new Date().toLocaleString();

      const summaryRows = [
        { Field: 'Exam Title',                  Value: examTitle },
        { Field: 'Hall',                        Value: hallName },
        { Field: 'Session ID',                  Value: session.id },
        { Field: 'Session Status',              Value: session.status },
        { Field: 'Started At',                  Value: session.started_at ? new Date(session.started_at).toLocaleString() : 'N/A' },
        { Field: 'Ended At',                    Value: session.ended_at   ? new Date(session.ended_at).toLocaleString()   : 'In Progress' },
        { Field: 'Monitoring Duration',         Value: formatTime(time) },
        { Field: 'Total Students',              Value: stats.totalStudents },
        { Field: 'Normal Behavior',             Value: stats.normalBehavior },
        { Field: 'Suspicious',                  Value: stats.suspicious },
        { Field: 'Violation Seats',             Value: stats.violations },
        { Field: 'Total Alerts',                Value: alerts.length },
        { Field: 'Cameras Online',              Value: stats.camerasOnline },
        { Field: 'Face Match Rate',             Value: `${stats.faceMatchRate}%` },
        { Field: 'Avg Violations / Student',    Value: stats.avgViolationsPerStudent },
        { Field: 'Report Exported At',          Value: exportedAt },
      ];

      // ── Sheet 2: Student Violations (per seat) ────────────────
      const studentRows = seats.map(seat => ({
        'Student Name':      seat.studentName,
        'Student ID':        seat.studentId,
        'Seat Number':       seat.seatNumber,
        'Status':            seat.status.toUpperCase(),
        'Total Alerts':      seat.violations,
        'Face Match':        seat.faceMatch ? 'Yes' : 'No',
        'Last Activity':     seat.lastActivity,
      }));

      // ── Sheet 3: Full Alert Log ────────────────────────────────
      const alertRows = alerts.map(a => {
        const zone = zones.find(z => z.id === a.zone);
        return {
          'Alert ID':      a.id,
          'Student Name':  a.student_name || zone?.student_name || `Zone ${a.zone}`,
          'Student ID':    zone?.student_code || '',
          'Seat':          a.seat_number   || zone?.seat_number   || '',
          'Alert Type':    a.alert_type.replace(/_/g, ' '),
          'Severity':      a.severity,
          'Timestamp':     new Date(a.timestamp).toLocaleString(),
          'Reviewed':      a.is_reviewed ? 'Yes' : 'No',
        };
      });

      // ── Sheet 4: Backend Violations Summary ───────────────────
      const violationRows = violations.map(v => ({
        'Student Name':       v.student_name,
        'Student ID':         v.student_code,
        'Seat':               v.seat_number,
        'Exam':               v.exam_title,
        'Total Alerts':       v.total_alerts,
        'High Severity':      v.high_severity,
        'Medium Severity':    v.medium_severity,
        'Low Severity':       v.low_severity,
        'Violation Score':    v.violation_score,
      }));

      const filename = `exam-report-session-${session.id}-${new Date().toISOString().slice(0,10)}.xlsx`;

      downloadXlsx(
        [
          { name: 'Session Summary',       rows: summaryRows },
          { name: 'Student Violations',    rows: studentRows.length > 0 ? studentRows : [{ Note: 'No students monitored' }] },
          { name: 'Alert Log',             rows: alertRows.length    > 0 ? alertRows    : [{ Note: 'No alerts recorded' }] },
          { name: 'Violations Summary',    rows: violationRows.length > 0 ? violationRows : [{ Note: 'No backend violations' }] },
        ],
        filename
      );

    } catch {
      setActionError('Failed to generate report.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviewAlert = async (alertId: number) => {
    try {
      await monitoringApi.reviewAlert(alertId);
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_reviewed: true } : a));
    } catch { /* ignore */ }
  };

  const handleFlagForInvestigation = async () => {
    if (!session?.id || !selectedSeat) return;
    setActionLoading(true);
    setActionError('');
    try {
      const newAlert = await monitoringApi.createAlert(session.id, {
        zone: selectedSeat.zoneId,
        alert_type: 'manual_flag',
        severity: 'high',
      });
      setAlerts(prev => [...prev, newAlert]);
    } catch {
      setActionError('Failed to flag student.');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Helpers ---
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: SeatStatus): string => {
    switch (status) {
      case 'normal': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'alert': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-orange-600 bg-orange-50';
      case 'low': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getAlertIcon = (type: string): React.ReactNode => {
    switch (type) {
      case 'mobile_phone': return <Phone size={16} />;
      case 'multiple_faces': case 'no_face': return <User size={16} />;
      case 'head_movement': case 'looking_away': return <Activity size={16} />;
      case 'voice_detected': return <Volume2 size={16} />;
      case 'external_paper': return <FileText size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  // ============================
  // Sub-components
  // ============================
  const renderStatusBar = () => (
    <header className="bg-gradient-to-r from-blue-900 to-blue-800 text-white px-6 py-3 shadow-lg">
      <div className="max-w-screen-2xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center">
            <Shield size={18} className="text-white" />
          </div>
          <div>
            <p className="font-extrabold text-sm leading-tight tracking-wide text-white">
              {exam?.title || 'Exam Monitor'}
            </p>
            <p className="text-[10px] text-blue-200 font-medium">
              {exam?.hall_name || ''} · Offline Mode
            </p>
          </div>
        </div>

        {/* Status pills */}
        <div className="flex items-center gap-3 flex-wrap justify-center">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${
            isMonitoring
              ? 'bg-green-500/20 border-green-400/50 text-green-200'
              : 'bg-white/10 border-white/20 text-blue-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${ isMonitoring ? 'bg-green-400 animate-pulse' : 'bg-blue-300' }`} />
            {isMonitoring ? 'LIVE' : 'STOPPED'}
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-mono font-bold text-white">
            <Clock size={12} className="text-blue-200" />
            {formatTime(time)}
          </div>

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border ${
            wsConnected
              ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200'
              : 'bg-yellow-500/20 border-yellow-400/50 text-yellow-200'
          }`}>
            <span className={`w-2 h-2 rounded-full ${ wsConnected ? 'bg-cyan-400 animate-pulse' : 'bg-yellow-400' }`} />
            {wsConnected ? 'WS LIVE' : 'POLLING'}
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-bold text-white">
            <Camera size={12} className="text-blue-200" />
            {hallCameras.length} Camera{hallCameras.length !== 1 ? 's' : ''}
          </div>

          {alerts.length > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-400/50 text-xs font-bold text-red-200">
              <AlertCircle size={12} />
              {alerts.length} Alert{alerts.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleGenerateReport}
            disabled={!session?.id || actionLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 border border-white/20 text-xs font-semibold transition-all disabled:opacity-40"
          >
            <FileSpreadsheet size={13} />
            Export
          </button>

          {!isMonitoring && examIdParam && (
            <button
              onClick={onStartMonitoringClick}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-green-500 hover:bg-green-400 text-xs font-bold shadow-lg shadow-green-900/30 transition-all disabled:opacity-50"
            >
              {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
              Start Monitoring
            </button>
          )}
          {isMonitoring && (
            <button
              onClick={handleEndMonitoringClick}
              disabled={actionLoading}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-red-500 hover:bg-red-400 text-xs font-bold shadow-lg shadow-red-900/30 transition-all disabled:opacity-50"
            >
              {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
              End Exam
            </button>
          )}
        </div>
      </div>
      {actionError && (
        <p className="text-center text-xs text-red-300 mt-1">{actionError}</p>
      )}
    </header>
  );

  const renderHallSelector = () => (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Select Exam Hall</h3>
      </div>

      {hallsLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <span className="ml-3 text-gray-600">Loading halls...</span>
        </div>
      ) : hallsError ? (
        <p className="text-red-600 text-sm py-4">{hallsError}</p>
      ) : halls.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No exam halls found. Create one from the ROI page.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {halls.map(hall => (
            <button
              key={hall.id}
              onClick={() => setSelectedHallId(hall.id)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedHallId === hall.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-800">{hall.name}</h4>
                <span className={`w-3 h-3 rounded-full ${
                  hall.is_active ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
                }`}></span>
              </div>
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin size={14} />
                  {hall.building}
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} />
                  Capacity: {hall.capacity}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  const renderStatsGrid = () => (
    <div className="grid grid-cols-4 gap-3">
      {[
        { label: 'Total Students', value: stats.totalStudents,  icon: <Users size={18}/>,         bg: 'bg-blue-100',   text: 'text-blue-600',   border: 'border-blue-200' },
        { label: 'Normal',         value: stats.normalBehavior, icon: <CheckCircle size={18}/>,   bg: 'bg-green-100',  text: 'text-green-600',  border: 'border-green-200' },
        { label: 'Suspicious',     value: stats.suspicious,     icon: <AlertTriangle size={18}/>, bg: 'bg-yellow-100', text: 'text-yellow-600', border: 'border-yellow-200' },
        { label: 'Violations',     value: stats.violations,     icon: <XCircle size={18}/>,       bg: 'bg-red-100',    text: 'text-red-600',    border: 'border-red-200' },
      ].map(({ label, value, icon, bg, text, border }) => (
        <div key={label} className={`bg-white rounded-xl p-4 flex items-center gap-3 shadow-sm border ${border}`}>
          <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center ${text} shrink-0`}>
            {icon}
          </div>
          <div>
            <p className="text-2xl font-extrabold text-gray-800 leading-none">{value}</p>
            <p className="text-[11px] text-gray-500 mt-0.5 font-medium">{label}</p>
          </div>
        </div>
      ))}
    </div>
  );

  const renderSeatingMapView = () => (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex-1">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2.5">
          <MapPin size={16} className="text-blue-600" />
          <div>
            <h3 className="font-bold text-gray-800 text-sm">Seating Map</h3>
            <p className="text-[10px] text-gray-500">{currentHall?.name ?? exam?.hall_name ?? 'N/A'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-gray-500">
          {[['bg-green-500','Normal'],['bg-yellow-500','Suspicious'],['bg-red-500','Violation'],['bg-gray-300','Empty']].map(([c,l]) => (
            <span key={l} className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-sm ${c}`} />{l}
            </span>
          ))}
        </div>
      </div>
      {/* Grid */}
      <div className="p-5 bg-gray-50">
        {zonesLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-blue-600" size={28} />
            <span className="ml-3 text-gray-500 text-sm">Loading zones...</span>
          </div>
        ) : seats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <MapPin size={36} className="text-gray-400 mb-3" />
            <p className="text-gray-500 text-sm">
              {examIdParam ? 'No zones configured. Go to Zone Config.' : 'No seats to display.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(52px, 1fr))' }}>
            {seats.map(seat => {
              const colors = {
                normal: 'bg-green-500 hover:bg-green-600 shadow-green-200',
                warning: 'bg-yellow-500 hover:bg-yellow-600 shadow-yellow-200',
                alert: 'bg-red-500 hover:bg-red-600 shadow-red-200',
              };
              return (
                <button
                  key={seat.id}
                  onClick={() => setSelectedSeat(seat)}
                  title={seat.studentName}
                  className={`relative aspect-square rounded-xl ${
                    colors[seat.status]
                  } shadow-md hover:scale-110 transition-all duration-150 ${
                    selectedSeat?.id === seat.id ? 'ring-2 ring-blue-500 ring-offset-2 scale-110' : ''
                  }`}
                >
                  <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-[11px]">
                    {seat.seatNumber}
                  </span>
                  {seat.violations > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-700 border border-white text-white text-[9px] font-extrabold rounded-full w-[18px] h-[18px] flex items-center justify-center shadow">
                      {seat.violations}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
        <div className="mt-5 text-center">
          <div className="inline-flex items-center gap-2 bg-gray-200 text-gray-600 text-xs font-semibold px-4 py-2 rounded-lg">
            📋 Front / Proctor Station
          </div>
        </div>
      </div>
    </div>
  );

  const renderFullCameraStream = () => {
    if (!hallCameras || hallCameras.length === 0) return null;

    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Video size={14} className="text-white" />
            <h3 className="font-bold text-white text-sm">Live Camera{hallCameras.length > 1 ? 's' : ''}</h3>
          </div>
          {isMonitoring && (
            <span className="flex items-center gap-1.5 bg-green-500/20 border border-green-400/50 text-green-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              LIVE
            </span>
          )}
        </div>
        <div className="p-3 bg-gray-50 space-y-3">
          {hallCameras.map(cam => (
            <div 
              key={cam.id} 
              className="relative rounded-xl overflow-hidden bg-gray-100 aspect-video shadow group cursor-pointer hover:ring-2 hover:ring-blue-500 transition-all"
              onClick={() => { if (cam.stream_url) setExpandedCameraUrl(cam.stream_url) }}
            >
              {cam.stream_url ? (
                <img
                  src={cam.stream_url}
                  alt={cam.name}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                  <WifiOff size={22} className="mb-2 opacity-50" />
                  <span className="text-xs font-semibold">Camera Offline</span>
                </div>
              )}
              <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Camera size={9} /> {cam.name}
              </div>
              
              {cam.stream_url && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="bg-black/60 text-white p-2.5 rounded-full backdrop-blur-md shadow-lg transform scale-90 group-hover:scale-100 transition-all">
                    <Video size={20} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderAlertsPanel = () => {
    const BACKEND = `http://${window.location.hostname}:8000`;

    const severityConfig: Record<string, { bar: string; bg: string; badge: string; label: string }> = {
      high:   { bar: 'bg-red-500',    bg: 'bg-red-50',    badge: 'bg-red-100 text-red-700',    label: 'HIGH' },
      medium: { bar: 'bg-amber-500',  bg: 'bg-amber-50',  badge: 'bg-amber-100 text-amber-700', label: 'MED'  },
      low:    { bar: 'bg-yellow-400', bg: 'bg-yellow-50', badge: 'bg-yellow-100 text-yellow-700',label: 'LOW'  },
    };

    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-rose-600 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <AlertCircle size={18} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm leading-tight">Live Alerts</h3>
              <p className="text-white/70 text-[10px]">Real-time AI detection events</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isMonitoring && (
              <span className="flex items-center gap-1.5 bg-white/20 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                LIVE
              </span>
            )}
            <span className="bg-white/20 text-white text-xs font-extrabold px-2.5 py-1 rounded-full">
              {alerts.length}
            </span>
          </div>
        </div>

        {/* Body */}
        {alertsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="animate-spin text-red-500" size={28} />
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mb-3">
              <CheckCircle size={28} className="text-green-400" />
            </div>
            <p className="text-gray-500 font-medium text-sm">No alerts yet</p>
            <p className="text-gray-400 text-xs mt-1">AI is watching — all clear so far</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 max-h-[520px] overflow-y-auto">
            {alerts.map(a => {
              const matchedZone = zones.find(z => z.id === a.zone);
              const displayName = a.student_name || matchedZone?.dynamic_student_name || matchedZone?.student_name || `Zone ${a.zone}`;
              const displaySeat = a.seat_number || matchedZone?.dynamic_seat_number || matchedZone?.seat_number || '';
              const displayId   = matchedZone?.student_code || '';
              const sc = severityConfig[a.severity] ?? severityConfig.low;
              const snapUrl = a.snapshot
                ? (a.snapshot.startsWith('http') ? a.snapshot : `${BACKEND}${a.snapshot}`)
                : null;

              return (
                <div
                  key={a.id}
                  className={`relative flex gap-0 transition-all duration-200 ${a.is_reviewed ? 'opacity-50' : 'hover:bg-gray-50'}`}
                >
                  {/* Severity bar */}
                  <div className={`w-1 shrink-0 ${sc.bar}`} />

                  <div className="flex-1 p-3 flex gap-3 min-w-0">
                    {/* Snapshot thumbnail */}
                    <div className="shrink-0">
                      {snapUrl ? (
                        <button
                          onClick={() => setExpandedSnap(expandedSnap === String(a.id) ? null : String(a.id))}
                          className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-900 group border-2 border-gray-100 hover:border-red-300 transition-all"
                          title="Click to enlarge"
                        >
                          <img
                            src={snapUrl}
                            alt="Alert snapshot"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                            <Eye size={14} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </button>
                      ) : (
                        <div className={`w-16 h-16 rounded-lg flex flex-col items-center justify-center ${sc.bg} border border-gray-100`}>
                          <div className="text-gray-400">{getAlertIcon(a.alert_type)}</div>
                          <span className="text-[9px] text-gray-400 mt-1 text-center leading-tight px-1">No snap</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1 mb-1">
                        <div className="min-w-0">
                          <p className="font-bold text-gray-800 text-xs truncate leading-tight">{displayName}</p>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            {displaySeat && (
                              <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">
                                Seat {displaySeat.replace(/^Seat\s+/i, '')}
                              </span>
                            )}
                            {displayId && (
                              <span className="text-[10px] text-gray-400 font-mono">#{displayId}</span>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${sc.badge}`}>
                            {sc.label}
                          </span>
                          {!a.is_reviewed && (
                            <button
                              onClick={() => handleReviewAlert(a.id)}
                              title="Mark reviewed"
                              className="text-gray-300 hover:text-green-500 transition-colors"
                            >
                              <Eye size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-semibold capitalize ${
                          a.severity === 'high' ? 'text-red-600' :
                          a.severity === 'medium' ? 'text-amber-600' : 'text-yellow-600'
                        }`}>
                          {a.alert_type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-gray-300">•</span>
                        <span className="text-[10px] text-gray-400">
                          {new Date(a.timestamp).toLocaleTimeString()}
                        </span>
                        {a.is_reviewed && (
                          <span className="ml-auto flex items-center gap-0.5 text-[9px] text-green-600">
                            <CheckCircle size={10} /> Reviewed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded snapshot removed, using global modal instead */}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderStudentDetailsPanel = () => {
    const seatAlerts = selectedSeat
      ? alerts.filter(a => a.zone === selectedSeat.zoneId)
      : [];

    if (!selectedSeat) {
      return (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-5 flex items-center gap-3">
            <Shield size={22} className="text-blue-200" />
            <h3 className="font-bold text-white text-lg">Student Details & AI Monitoring</h3>
          </div>
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <User className="text-gray-300" size={40} />
            </div>
            <p className="text-gray-500 font-medium">No student selected</p>
            <p className="text-gray-400 text-sm mt-1">Click any seat on the map to view live details and AI alerts</p>
          </div>
          {/* Active features strip */}
          <div className="border-t border-gray-100 bg-gray-50 p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Active AI Modules</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: <Eye size={14}/>, label: 'Behavior Analysis' },
                { icon: <Phone size={14}/>, label: 'Object Detection' },
                { icon: <Camera size={14}/>, label: 'Multi-Camera' },
                { icon: <Activity size={14}/>, label: 'Head Pose & Movement' },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
                  <span className="text-blue-600">{f.icon}</span>
                  <span className="text-xs text-gray-700 font-medium">{f.label}</span>
                  <CheckCircle size={12} className="text-green-500 ml-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    const statusConfig = {
      normal:  { bg: 'bg-emerald-500', text: 'text-emerald-700', badge: 'bg-emerald-100', label: 'NORMAL', dot: 'bg-emerald-400' },
      warning: { bg: 'bg-amber-500',   text: 'text-amber-700',   badge: 'bg-amber-100',   label: 'SUSPICIOUS', dot: 'bg-amber-400' },
      alert:   { bg: 'bg-red-500',     text: 'text-red-700',     badge: 'bg-red-100',     label: 'VIOLATION',  dot: 'bg-red-500' },
    };
    const sc = statusConfig[selectedSeat.status];

    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
        {/* Header bar */}
        <div className={`${sc.bg} p-4 flex items-center justify-between`}>
          <div className="flex items-center gap-3 min-w-0">
            {/* Avatar circle */}
            <div className="w-12 h-12 rounded-full bg-white/25 flex items-center justify-center text-white font-extrabold text-xl shrink-0 border-2 border-white/40">
              {selectedSeat.studentName.charAt(0).toUpperCase()}
            </div>
            {/* Student info */}
            <div className="min-w-0">
              <p className="font-extrabold text-white text-base leading-tight truncate">
                {selectedSeat.studentName}
              </p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                {/* Seat number badge */}
                <span className="flex items-center gap-1 bg-white/20 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">
                  📍 Seat {selectedSeat.seatNumber.replace(/^Seat\s+/i, '')}
                </span>
                {/* Student code */}
                <span className="text-white/80 text-[11px] font-mono">
                  #{selectedSeat.studentId}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} animate-pulse`} />
              {sc.label}
            </span>
            <button
              onClick={() => setSelectedSeat(null)}
              className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white font-bold transition-colors text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Metrics Row */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
              <p className="text-2xl font-extrabold text-gray-800">{selectedSeat.violations}</p>
              <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-wide font-semibold">Total Alerts</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
              <p className="text-xl font-bold text-gray-700 leading-tight mt-1">{selectedSeat.seatNumber}</p>
              <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-wide font-semibold">Seat</p>
            </div>
          </div>

          {/* Severity Breakdown */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-red-50 rounded-lg p-2 text-center border border-red-100">
              <p className="text-lg font-bold text-red-700">{seatAlerts.filter(a => a.severity === 'high').length}</p>
              <p className="text-[9px] text-red-600 uppercase tracking-wider font-bold">High</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-2 text-center border border-orange-100">
              <p className="text-lg font-bold text-orange-700">{seatAlerts.filter(a => a.severity === 'medium').length}</p>
              <p className="text-[9px] text-orange-600 uppercase tracking-wider font-bold">Medium</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-2 text-center border border-yellow-100">
              <p className="text-lg font-bold text-yellow-700">{seatAlerts.filter(a => a.severity === 'low').length}</p>
              <p className="text-[9px] text-yellow-600 uppercase tracking-wider font-bold">Low</p>
            </div>
          </div>

          {/* Zone Live View — shows exactly what the AI sees */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <Camera size={15} className="text-blue-600" /> AI Zone View
              </p>
              <span className="text-[10px] text-gray-400 font-mono">Zone #{selectedSeat.zoneId}</span>
            </div>
            <div className="bg-gray-900 rounded-xl overflow-hidden relative border border-gray-700" style={{minHeight:'140px'}}>
              {selectedSeat.streamUrl.startsWith('http') && zones.find(z => z.id === selectedSeat.zoneId) ? (
                <LiveZoneCanvas 
                  streamUrl={selectedSeat.streamUrl} 
                  zone={zones.find(z => z.id === selectedSeat.zoneId)!} 
                />
              ) : seatSnapshot ? (
                <img
                  src={seatSnapshot}
                  alt="Zone Live View"
                  className="w-full h-full block object-cover rounded-xl"
                />
              ) : seatSnapshotLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <Loader2 size={28} className="text-blue-400 animate-spin" />
                  <span className="text-gray-400 text-xs">Loading zone view…</span>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <WifiOff className="text-gray-600" size={36} />
                  <span className="text-gray-500 text-xs">Zone not available</span>
                </div>
              )}
              {/* LIVE badge */}
              {(selectedSeat.streamUrl.startsWith('http') || seatSnapshot) && (
                <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full z-10">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  AI VIEW
                </div>
              )}
              <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full z-10">
                <Eye size={9} className="text-white/70" />
                <span className="text-white/70 text-[9px] font-semibold">What AI sees</span>
              </div>
              {/* Alert overlay if violation */}
              {selectedSeat.status === 'alert' && (
                <div className="absolute bottom-2 left-2 right-2 bg-red-600/80 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1.5">
                  <AlertCircle size={12} className="shrink-0" />
                  Violation Detected — Review Required
                </div>
              )}
            </div>
          </div>

          {/* Per-student alert log */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <AlertCircle size={15} className="text-red-500" />
              Alert History
              {seatAlerts.length > 0 && (
                <span className="ml-auto bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full">{seatAlerts.length}</span>
              )}
            </p>
            {seatAlerts.length === 0 ? (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                <span className="text-xs text-emerald-700 font-medium">No alerts for this student — all good!</span>
              </div>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {seatAlerts.slice().reverse().map(a => (
                  <div
                    key={a.id}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border-l-4 ${
                      a.severity === 'high'   ? 'border-red-500 bg-red-50' :
                      a.severity === 'medium' ? 'border-amber-500 bg-amber-50' :
                                                'border-yellow-400 bg-yellow-50'
                    } ${a.is_reviewed ? 'opacity-50' : ''}`}
                  >
                    <div className={`p-1.5 rounded-lg mt-0.5 ${
                      a.severity === 'high' ? 'bg-red-100 text-red-600' :
                      a.severity === 'medium' ? 'bg-amber-100 text-amber-600' :
                      'bg-yellow-100 text-yellow-600'
                    }`}>
                      {getAlertIcon(a.alert_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800 capitalize">{a.alert_type.replace(/_/g, ' ')}</p>
                      <p className="text-[10px] text-gray-500">{new Date(a.timestamp).toLocaleTimeString()}</p>
                    </div>
                    {!a.is_reviewed && (
                      <button
                        onClick={() => handleReviewAlert(a.id)}
                        title="Mark reviewed"
                        className="text-gray-300 hover:text-emerald-600 shrink-0 transition-colors mt-0.5"
                      >
                        <Eye size={15} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    );
  };

  const renderEndExamModal = () => {
    if (!showEndConfirm) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="text-red-600" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">End Exam Session</h3>
              <p className="text-sm text-gray-500">This action requires confirmation</p>
            </div>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <p className="text-gray-700 text-sm">
              Are you sure you want to end the monitoring session for <strong>{currentHall?.name ?? exam?.title ?? 'this exam'}</strong>? 
            </p>
            <ul className="mt-3 text-sm text-gray-600 list-disc list-inside space-y-1">
              <li>All active camera feeds will be disconnected.</li>
              <li>AI analysis and alerting will stop immediately.</li>
              <li>A final violation report will be generated.</li>
            </ul>
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setShowEndConfirm(false)}
              disabled={actionLoading}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={executeEndMonitoring}
              disabled={actionLoading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Confirm End Exam
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderEarlyStartModal = () => {
    if (!showEarlyStartWarning) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="text-yellow-600" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Start Early?</h3>
              <p className="text-sm text-gray-500">The exam hasn't started yet</p>
            </div>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
            <p className="text-gray-700 text-sm">
              The exam is scheduled to start in <strong>{earlyMins} minute{earlyMins !== 1 ? 's' : ''}</strong>.
            </p>
            <p className="text-gray-700 text-sm mt-2">
              You can start the monitoring session early, but this is at your own risk. Do you want to proceed?
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowEarlyStartWarning(false)}
              className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={executeStartMonitoring}
              className="flex-1 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg font-semibold transition-colors"
            >
              Proceed Anyway
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ============================
  // Main render
  // ============================
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {renderStatusBar()}

      <main className="flex-1 p-4 lg:p-5 max-w-screen-2xl mx-auto w-full space-y-4">

        {/* Stats Row */}
        {selectedHallId && renderStatsGrid()}

        {!selectedHallId ? (
          /* Hall selector */
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
            <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
              <MapPin size={18} className="text-blue-600" /> Select Exam Hall
            </h3>
            {hallsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-blue-600" size={32} />
                <span className="ml-3 text-gray-500">Loading halls...</span>
              </div>
            ) : hallsError ? (
              <p className="text-red-500 text-sm py-4">{hallsError}</p>
            ) : halls.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No exam halls found. Create one from the ROI page.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {halls.map(hall => (
                  <button
                    key={hall.id}
                    onClick={() => setSelectedHallId(hall.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedHallId === hall.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-800">{hall.name}</h4>
                      <span className={`w-2.5 h-2.5 rounded-full ${ hall.is_active ? 'bg-green-500 animate-pulse' : 'bg-gray-300' }`} />
                    </div>
                    <div className="space-y-1 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5"><MapPin size={11} /> {hall.building}</div>
                      <div className="flex items-center gap-1.5"><Users size={11} /> Capacity: {hall.capacity}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ── Main 3-column command-center grid ── */
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">

            {/* LEFT COLUMN: Camera + Alerts */}
            <div className="xl:col-span-3 space-y-4">
              {renderFullCameraStream()}
              {renderAlertsPanel()}
            </div>

            {/* CENTER COLUMN: Seating Map */}
            <div className="xl:col-span-5 flex flex-col">
              {renderSeatingMapView()}
            </div>

            {/* RIGHT COLUMN: Student Details */}
            <div className="xl:col-span-4">
              {renderStudentDetailsPanel()}
            </div>

          </div>
        )}
      </main>

      {renderEndExamModal()}
      {renderEarlyStartModal()}

      {/* Expanded Snapshot Modal */}
      {expandedSnap && (
        (() => {
          const a = alerts.find(alt => String(alt.id) === expandedSnap);
          const BACKEND = `http://${window.location.hostname}:8000`;
          const snapUrl = a?.snapshot ? (a.snapshot.startsWith('http') ? a.snapshot : `${BACKEND}${a.snapshot}`) : '';
          return (
            <div 
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
              onClick={() => setExpandedSnap(null)}
            >
              <div className="relative max-w-5xl w-full" onClick={e => e.stopPropagation()}>
                <button 
                  className="absolute -top-12 right-0 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-red-500 text-white flex items-center justify-center transition-colors backdrop-blur-md"
                  onClick={() => setExpandedSnap(null)}
                >
                  <XCircle size={24} />
                </button>
                {a && (
                  <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-bold flex items-center gap-2">
                    <span className="capitalize">{a.alert_type.replace(/_/g, ' ')}</span>
                    <span className="text-white/50 px-1">•</span>
                    <span className="text-white/80">{new Date(a.timestamp).toLocaleString()}</span>
                  </div>
                )}
                <img 
                  src={snapUrl} 
                  alt="Expanded Alert Snapshot" 
                  className="w-full rounded-xl shadow-2xl object-contain max-h-[85vh] border border-gray-800"
                  crossOrigin="anonymous"
                />
              </div>
            </div>
          );
        })()
      )}

      {/* Expanded Full Camera Modal */}
      {expandedCameraUrl && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setExpandedCameraUrl(null)}
        >
          <div className="relative w-full max-w-6xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800" onClick={e => e.stopPropagation()}>
            <button 
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-red-500 text-white flex items-center justify-center transition-colors backdrop-blur-md"
              onClick={() => setExpandedCameraUrl(null)}
            >
              <XCircle size={24} />
            </button>
            <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full text-white text-xs font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              LIVE CAMERA FEED
            </div>
            <img 
              src={expandedCameraUrl} 
              alt="Expanded Live Stream" 
              className="w-full h-full object-contain"
              crossOrigin="anonymous"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineMonitoringPage;
