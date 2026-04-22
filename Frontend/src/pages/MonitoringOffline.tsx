import React, { useState, useEffect, type FC } from 'react';
import {
  Video, Camera, Users, AlertCircle, Shield,
  MapPin, Activity, Eye, Mic, Clock,
  Download, Grid,
  User, Phone, FileText, Volume2, Radio, WifiOff,
  CheckCircle, XCircle, AlertTriangle,
  Save, Loader2, Play
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
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
type ViewMode = 'heatmap' | 'grid';

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

const OfflineMonitoringPage: FC = () => {
  const [searchParams] = useSearchParams();
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
  const [viewMode, setViewMode] = useState<ViewMode>('heatmap');
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [time, setTime] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [wsConnected, setWsConnected] = useState(false);

  const currentHall = halls.find(h => h.id === selectedHallId);

  // Build seats from zones + alerts
  const seats: Seat[] = React.useMemo(() => {
    return zones.map((zone, i) => {
      const zoneAlerts = alerts.filter(a => a.zone === zone.id);
      const highCount = zoneAlerts.filter(a => a.severity === 'high').length;
      const mediumCount = zoneAlerts.filter(a => a.severity === 'medium').length;

      let status: SeatStatus = 'normal';
      if (highCount > 0) status = 'alert';
      else if (mediumCount > 0) status = 'warning';

      const cam = hallCameras.find(c => c.id === zone.camera);
      const faceAlerts = zoneAlerts.filter(a =>
        a.alert_type === 'no_face' || a.alert_type === 'multiple_faces'
      );

      return {
        id: i + 1,
        studentId: String(zone.student_code || ''),
        studentName: zone.student_name || `Student ${zone.student_code || 'Unknown'}`,
        seatNumber: zone.seat_number || `Seat ${i + 1}`,
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

    const WS_BASE = (import.meta.env.VITE_WS_URL || 'ws://localhost:8000').replace(/\/$/, '');
    const wsUrl   = `${WS_BASE}/ws/exam/${examIdParam}/alerts/`;
    const ws      = new WebSocket(wsUrl);

    ws.onopen = () => {
      setWsConnected(true);
      console.log('[WS] Connected to', wsUrl);
    };

    ws.onmessage = (event) => {
      try {
        const alert = JSON.parse(event.data) as HwAlert;
        setAlerts(prev => [alert, ...prev]);
      } catch (e) {
        console.warn('[WS] Could not parse message:', event.data);
      }
    };

    ws.onerror = (err) => console.error('[WS] Error:', err);

    ws.onclose = () => {
      setWsConnected(false);
      console.log('[WS] Disconnected');
    };

    return () => {
      ws.close();
      setWsConnected(false);
    };
  }, [isMonitoring, session?.id, examIdParam]);

  // Fallback polling every 15 s (catches any alerts that missed the WS push)
  useEffect(() => {
    if (!isMonitoring || !session?.id || wsConnected) return;
    const interval = setInterval(async () => {
      try {
        const a = await monitoringApi.getAlerts(session.id);
        setAlerts(a);
      } catch { /* ignore */ }
    }, 15_000);
    return () => clearInterval(interval);
  }, [isMonitoring, session?.id, wsConnected]);

  // Timer ticks while monitoring
  useEffect(() => {
    if (!isMonitoring) return;
    const timer = setInterval(() => setTime(prev => prev + 1), 1000);
    return () => clearInterval(timer);
  }, [isMonitoring]);

  // --- Actions ---
  const handleStartMonitoring = async () => {
    if (!examIdParam) return;
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

  const handleEndMonitoring = async () => {
    if (!session?.id) return;
    setActionLoading(true);
    setActionError('');
    try {
      await monitoringApi.endMonitoring(session.id);
      setIsMonitoring(false);
      setSession(prev => prev ? { ...prev, status: 'ended' } : null);
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
      await monitoringApi.generateReport(session.id);
      const violations = await monitoringApi.getViolations(session.id);
      const blob = new Blob([JSON.stringify(violations, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `violation-report-session-${session.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
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
        alert_type: 'head_movement',
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
  const StatusBar: FC = () => (
    <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-4 shadow-lg">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <Radio className={`${isMonitoring ? 'text-green-400 animate-pulse' : 'text-gray-400'}`} size={24} />
              <div>
                <p className="text-xs opacity-75">Monitoring Status</p>
                <p className="font-bold text-lg">{isMonitoring ? 'LIVE' : 'STOPPED'}</p>
              </div>
            </div>

            <div className="h-10 w-px bg-blue-600"></div>

            <div className="flex items-center gap-3">
              <Clock size={24} />
              <div>
                <p className="text-xs opacity-75">Exam Duration</p>
                <p className="font-bold text-lg">{formatTime(time)}</p>
              </div>
            </div>

            <div className="h-10 w-px bg-blue-600"></div>

            {/* WebSocket status badge */}
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${wsConnected ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`} />
              <div>
                <p className="text-xs opacity-75">Alerts Channel</p>
                <p className="font-bold text-sm">{wsConnected ? 'WS LIVE' : 'POLLING'}</p>
              </div>
            </div>

            <div className="h-10 w-px bg-blue-600"></div>

            <div className="flex items-center gap-3">
              <WifiOff size={24} className="text-green-400" />
              <div>
                <p className="text-xs opacity-75">Mode</p>
                <p className="font-bold">OFFLINE</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!isMonitoring && examIdParam && (
              <button
                onClick={handleStartMonitoring}
                disabled={actionLoading}
                className="bg-green-500 hover:bg-green-600 disabled:opacity-50 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                {actionLoading ? <Loader2 size={20} className="animate-spin" /> : <Play size={20} />}
                Start Monitoring
              </button>
            )}
            {isMonitoring && (
              <button
                onClick={handleEndMonitoring}
                disabled={actionLoading}
                className="bg-red-500 hover:bg-red-600 disabled:opacity-50 px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
              >
                {actionLoading ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                End Exam
              </button>
            )}
          </div>
        </div>
        {actionError && <p className="mt-2 text-sm text-red-300">{actionError}</p>}
      </div>
    </div>
  );

  const HallSelector: FC = () => (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Select Exam Hall</h3>
        <Link to="/Roi">
          <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
            + Add New Hall
          </button>
        </Link>
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

  const StatsGrid: FC = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-3 rounded-lg"><Users className="text-blue-600" size={24} /></div>
          <div>
            <p className="text-xs text-gray-600">Total Students</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalStudents}</p>
          </div>
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-green-100 p-3 rounded-lg"><CheckCircle className="text-green-600" size={24} /></div>
          <div>
            <p className="text-xs text-gray-600">Normal Behavior</p>
            <p className="text-2xl font-bold text-green-600">{stats.normalBehavior}</p>
          </div>
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-100 p-3 rounded-lg"><AlertTriangle className="text-yellow-600" size={24} /></div>
          <div>
            <p className="text-xs text-gray-600">Suspicious</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.suspicious}</p>
          </div>
        </div>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-red-100 p-3 rounded-lg"><XCircle className="text-red-600" size={24} /></div>
          <div>
            <p className="text-xs text-gray-600">Violations</p>
            <p className="text-2xl font-bold text-red-600">{stats.violations}</p>
          </div>
        </div>
      </div>
    </div>
  );

  const HeatmapView: FC = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <MapPin className="text-blue-600" size={24} />
          <div>
            <h3 className="font-semibold text-gray-800">Hall Seating Map</h3>
            <p className="text-sm text-gray-600">Monitoring {currentHall?.name ?? exam?.hall_name ?? 'N/A'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('heatmap')}
            className={`px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${
              viewMode === 'heatmap' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <MapPin size={16} className="inline mr-1" />Heatmap
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${
              viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <Grid size={16} className="inline mr-1" />Grid
          </button>
        </div>
      </div>

      <div className="flex items-center gap-6 mb-4 text-sm">
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-500 rounded"></div><span className="text-gray-600">Normal</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-yellow-500 rounded"></div><span className="text-gray-600">Suspicious</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-500 rounded"></div><span className="text-gray-600">Violation</span></div>
        <div className="flex items-center gap-2"><div className="w-4 h-4 bg-gray-300 rounded"></div><span className="text-gray-600">Empty</span></div>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg">
        {zonesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-blue-600" size={24} />
            <span className="ml-3 text-gray-600">Loading zones...</span>
          </div>
        ) : seats.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            {examIdParam
              ? 'No zones configured. Go to Zone Config to set up student zones.'
              : 'No seats to display. Select a hall with capacity.'}
          </p>
        ) : (
          <div className="grid grid-cols-8 gap-3">
            {seats.map(seat => (
              <button
                key={seat.id}
                onClick={() => setSelectedSeat(seat)}
                className={`relative aspect-square rounded-lg ${getStatusColor(seat.status)}
                  hover:ring-2 hover:ring-blue-500 transition-all group cursor-pointer
                  ${selectedSeat?.id === seat.id ? 'ring-4 ring-blue-500 scale-110' : ''}`}
              >
                <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
                  {seat.id}
                </span>
                {seat.violations > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {seat.violations}
                  </span>
                )}
                {!seat.faceMatch && (
                  <AlertCircle className="absolute -bottom-1 -right-1 text-red-600 bg-white rounded-full" size={16} />
                )}
              </button>
            ))}
          </div>
        )}
        <div className="mt-4 text-center">
          <div className="bg-gray-300 text-gray-700 py-2 px-4 rounded-lg inline-block font-semibold">
            📋 Front / Proctor Station
          </div>
        </div>
      </div>
    </div>
  );

  const AlertsPanel: FC = () => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="text-red-600" size={24} />
          <h3 className="font-semibold text-gray-800">Live Alerts</h3>
        </div>
        <span className="text-sm text-gray-500">{alerts.length} total</span>
      </div>

      {alertsLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-blue-600" size={24} />
        </div>
      ) : alerts.length === 0 ? (
        <p className="text-gray-500 text-center py-8 text-sm">No alerts yet.</p>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {alerts.map(a => (
            <div
              key={a.id}
              className={`p-3 rounded-lg border-l-4 ${
                a.severity === 'high' ? 'border-red-500 bg-red-50' :
                a.severity === 'medium' ? 'border-orange-500 bg-orange-50' :
                'border-yellow-500 bg-yellow-50'
              } ${a.is_reviewed ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${getSeverityColor(a.severity)}`}>
                    {getAlertIcon(a.alert_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-800">{a.seat_number || `Zone ${a.zone}`}</span>
                      <span className="text-xs text-gray-500">{new Date(a.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-sm text-gray-600">{a.student_name} — {a.alert_type.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                {!a.is_reviewed && (
                  <button onClick={() => handleReviewAlert(a.id)} title="Mark reviewed" className="text-gray-400 hover:text-green-600">
                    <Eye size={18} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const StudentDetailsPanel: FC = () => {
    if (!selectedSeat) {
      return (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center py-8">
            <User className="mx-auto text-gray-300 mb-3" size={48} />
            <p className="text-gray-500">Select a seat to view student details</p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Student Details</h3>
          <button onClick={() => setSelectedSeat(null)} className="text-gray-400 hover:text-gray-600">×</button>
        </div>
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {selectedSeat.studentName.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-gray-800">{selectedSeat.studentName}</h4>
                <p className="text-sm text-gray-600">ID: {selectedSeat.studentId}</p>
                <p className="text-xs text-gray-500">{selectedSeat.seatNumber}</p>
              </div>
            </div>
            <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
              selectedSeat.status === 'normal' ? 'bg-green-100 text-green-700' :
              selectedSeat.status === 'warning' ? 'bg-yellow-100 text-yellow-700' :
              'bg-red-100 text-red-700'
            }`}>
              {selectedSeat.status.toUpperCase()}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Violations</p>
              <p className="text-2xl font-bold text-blue-600">{selectedSeat.violations}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Face Match</p>
              <p className="text-2xl font-bold text-green-600">{selectedSeat.faceMatch ? '✓' : '✗'}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Camera Feed</p>
            <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center overflow-hidden">
              {selectedSeat.streamUrl ? (
                <img src={selectedSeat.streamUrl} alt="Camera Feed" className="w-full h-full object-cover" />
              ) : (
                <Video className="text-gray-600" size={48} />
              )}
            </div>
            <p className="text-xs text-gray-500 mt-2">Camera {selectedSeat.cameraId} • ROI Active</p>
          </div>
          <div className="space-y-2">
            <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              <Eye size={18} className="inline mr-2" />View Full Recording
            </button>
            <button
              onClick={handleFlagForInvestigation}
              disabled={!session?.id || actionLoading}
              className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {actionLoading ? (
                <Loader2 size={18} className="inline mr-2 animate-spin" />
              ) : (
                <AlertCircle size={18} className="inline mr-2" />
              )}
              Flag for Investigation
            </button>
          </div>
        </div>
      </div>
    );
  };

  const FeaturesPanel: FC = () => {
    const features: Feature[] = [
      { icon: <User size={18} />, label: 'Face Recognition', status: true },
      { icon: <Eye size={18} />, label: 'Behavior Analysis', status: true },
      { icon: <Phone size={18} />, label: 'Object Detection', status: true },
      { icon: <Mic size={18} />, label: 'Audio Analysis', status: true },
      { icon: <Camera size={18} />, label: 'Multi-Camera Tracking', status: true },
      { icon: <Activity size={18} />, label: 'Movement Detection', status: true },
    ];

    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Shield size={20} className="text-blue-600" />
          Active Monitoring Features
        </h3>
        <div className="space-y-3">
          {features.map((feature, i) => (
            <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="text-blue-600">{feature.icon}</div>
                <span className="text-sm font-medium text-gray-700">{feature.label}</span>
              </div>
              <CheckCircle className="text-green-600" size={18} />
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ============================
  // Main render
  // ============================
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <StatusBar />

      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {exam?.title || 'Offline Exam Monitoring'}
              </h1>
              <p className="text-gray-600">Real-time monitoring with AI-powered detection</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleGenerateReport}
                disabled={!session?.id || actionLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <Download size={20} />
                Export Report
              </button>
            </div>
          </div>
        </div>

        <HallSelector />
        <StatsGrid />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <HeatmapView />
            <FeaturesPanel />
          </div>
          <div className="space-y-6">
            <AlertsPanel />
            <StudentDetailsPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflineMonitoringPage;
