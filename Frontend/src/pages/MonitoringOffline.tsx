import React, { useState, useEffect,type FC } from 'react';
import { 
  Video, Camera, Monitor, Users, AlertCircle, Shield, 
  MapPin, TrendingUp, Activity, Eye, Mic, Clock, 
  Settings, Download, Play, Pause, Maximize2, Grid,
  User, Phone, FileText, Volume2, Radio, Wifi, WifiOff,
  CheckCircle, XCircle, AlertTriangle, BarChart3, Filter,
  Save
} from 'lucide-react';
import { Link } from 'react-router-dom';

// Type Definitions
type SeatStatus = 'normal' | 'warning' | 'alert';
type AlertType = 'phone' | 'face' | 'movement' | 'audio' | 'paper';
type Severity = 'high' | 'medium' | 'low';
type ViewMode = 'heatmap' | 'grid' | 'single';
type HallStatus = 'active' | 'inactive';

interface Seat {
  id: number;
  studentId: string;
  studentName: string;
  status: SeatStatus;
  faceMatch: boolean;
  violations: number;
  lastActivity: string;
  cameraId: number;
}

interface Alert {
  id: number;
  time: string;
  seat: number;
  type: AlertType;
  severity: Severity;
  message: string;
}

interface Hall {
  id: string;
  name: string;
  students: number;
  cameras: number;
  status: HallStatus;
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
  const [selectedHall, setSelectedHall] = useState<string>('hall-a');
  const [isMonitoring, setIsMonitoring] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<ViewMode>('heatmap');
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [time, setTime] = useState<number>(12967);

  // Simulated exam data
  const halls: Hall[] = [
    { id: 'hall-a', name: 'Hall A - Building 1', students: 68, cameras: 8, status: 'active' },
    { id: 'hall-b', name: 'Hall B - Building 2', students: 45, cameras: 6, status: 'active' },
    { id: 'hall-c', name: 'Hall C - Building 1', students: 52, cameras: 7, status: 'inactive' }
  ];

  const currentHall = halls.find(h => h.id === selectedHall);

  // Seating data (8 rows x 8 columns)
  const [seats, setSeats] = useState<Seat[]>(
    Array.from({ length: 68 }, (_, i) => ({
      id: i + 1,
      studentId: `STD${2021000 + i}`,
      studentName: `Student ${i + 1}`,
      status: (i % 12 === 0 ? 'warning' : i % 20 === 0 ? 'alert' : 'normal') as SeatStatus,
      faceMatch: i % 20 !== 0,
      violations: i % 20 === 0 ? Math.floor(Math.random() * 5) + 3 : i % 12 === 0 ? 1 : 0,
      lastActivity: `${Math.floor(Math.random() * 60)} min ago`,
      cameraId: Math.floor(i / 8) + 1
    }))
  );

  const [alerts, setAlerts] = useState<Alert[]>([
    { id: 1, time: '03:36:07', seat: 23, type: 'phone', severity: 'high', message: 'Mobile phone detected' },
    { id: 2, time: '03:34:22', seat: 47, type: 'face', severity: 'high', message: 'Multiple faces detected' },
    { id: 3, time: '03:33:15', seat: 12, type: 'movement', severity: 'medium', message: 'Excessive head movement' },
    { id: 4, time: '03:31:45', seat: 56, type: 'audio', severity: 'medium', message: 'Voice detected' },
    { id: 5, time: '03:30:10', seat: 8, type: 'paper', severity: 'low', message: 'External paper detected' }
  ]);

  const [stats, setStats] = useState<Stats>({
    totalStudents: 68,
    normalBehavior: 58,
    suspicious: 7,
    violations: 3,
    camerasOnline: 8,
    faceMatchRate: 97,
    avgViolationsPerStudent: 0.15
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(prev => prev + 1);
      
      // Simulate random alerts
      if (Math.random() > 0.97) {
        const randomSeat = Math.floor(Math.random() * 68) + 1;
        const types: AlertType[] = ['movement', 'audio', 'face', 'phone', 'paper'];
        const severities: Severity[] = ['high', 'medium', 'low'];
        const severity: Severity = Math.random() > 0.7 ? 'high' : Math.random() > 0.4 ? 'medium' : 'low';
        
        const newAlert: Alert = {
          id: Date.now(),
          time: formatTime(time),
          seat: randomSeat,
          type: types[Math.floor(Math.random() * types.length)],
          severity: severity,
          message: 'New suspicious activity detected'
        };
        setAlerts(prev => [newAlert, ...prev].slice(0, 10));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [time]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: SeatStatus): string => {
    switch(status) {
      case 'normal': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'alert': return 'bg-red-500';
      default: return 'bg-gray-300';
    }
  };

  const getSeverityColor = (severity: Severity): string => {
    switch(severity) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-orange-600 bg-orange-50';
      case 'low': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getAlertIcon = (type: AlertType): React.ReactNode => {
    switch(type) {
      case 'phone': return <Phone size={16} />;
      case 'face': return <User size={16} />;
      case 'movement': return <Activity size={16} />;
      case 'audio': return <Volume2 size={16} />;
      case 'paper': return <FileText size={16} />;
      default: return <AlertCircle size={16} />;
    }
  };

  const StatusBar: FC = () => (
    <div className="bg-gradient-to-r from-blue-900 to-blue-800 text-white p-4 shadow-lg">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <Radio className="text-green-400 animate-pulse" size={24} />
              <div>
                <p className="text-xs opacity-75">Monitoring Status</p>
                <p className="font-bold text-lg">LIVE</p>
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

            <div className="flex items-center gap-3">
              <WifiOff size={24} className="text-green-400" />
              <div>
                <p className="text-xs opacity-75">Mode</p>
                <p className="font-bold">OFFLINE</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
           
            <button className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2">
              <AlertCircle size={20} />
              Alert All
            </button>
            <Link to={'/Roi'}>
            <button className="bg-red-500 hover:bg-red-600 px-6 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2">
              <Save size={20} />
              End Exam
            </button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  const HallSelector: FC = () => (
    <div className="bg-white rounded-lg shadow-md p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Select Exam Hall</h3>
        <Link to={'/Roi'}>
        <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
          + Add New Hall
        </button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {halls.map(hall => (
          <button
            key={hall.id}
            onClick={() => setSelectedHall(hall.id)}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selectedHall === hall.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-gray-800">{hall.name}</h4>
              <span className={`w-3 h-3 rounded-full ${
                hall.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
              }`}></span>
            </div>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Users size={14} />
                {hall.students} Students
              </div>
              <div className="flex items-center gap-2">
                <Camera size={14} />
                {hall.cameras} Cameras
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const StatsGrid: FC = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-3 rounded-lg">
            <Users className="text-blue-600" size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-600">Total Students</p>
            <p className="text-2xl font-bold text-gray-800">{stats.totalStudents}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-green-100 p-3 rounded-lg">
            <CheckCircle className="text-green-600" size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-600">Normal Behavior</p>
            <p className="text-2xl font-bold text-green-600">{stats.normalBehavior}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-yellow-100 p-3 rounded-lg">
            <AlertTriangle className="text-yellow-600" size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-600">Suspicious</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.suspicious}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-red-100 p-3 rounded-lg">
            <XCircle className="text-red-600" size={24} />
          </div>
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
            <p className="text-sm text-gray-600">Monitoring {currentHall?.name}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('heatmap')}
            className={`px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${
              viewMode === 'heatmap' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <MapPin size={16} className="inline mr-1" />
            Heatmap
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${
              viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
            }`}
          >
            <Grid size={16} className="inline mr-1" />
            Grid
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mb-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span className="text-gray-600">Normal</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span className="text-gray-600">Suspicious</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span className="text-gray-600">Violation</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-gray-300 rounded"></div>
          <span className="text-gray-600">Empty</span>
        </div>
      </div>

      {/* Seating Grid */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <div className="grid grid-cols-8 gap-3">
          {seats.map((seat) => (
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

        {/* Front of Hall */}
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
        <button className="text-blue-600 hover:text-blue-700 font-semibold text-sm">
          Clear All
        </button>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {alerts.map(alert => (
          <div
            key={alert.id}
            className={`p-3 rounded-lg border-l-4 ${
              alert.severity === 'high' ? 'border-red-500 bg-red-50' :
              alert.severity === 'medium' ? 'border-orange-500 bg-orange-50' :
              'border-yellow-500 bg-yellow-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className={`p-2 rounded-lg ${getSeverityColor(alert.severity)}`}>
                  {getAlertIcon(alert.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-800">Seat {alert.seat}</span>
                    <span className="text-xs text-gray-500">{alert.time}</span>
                  </div>
                  <p className="text-sm text-gray-600">{alert.message}</p>
                </div>
              </div>
              <button title='eye' className="text-gray-400 hover:text-gray-600">
                <Eye size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
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
          <button
            onClick={() => setSelectedSeat(null)}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          {/* Student Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                {selectedSeat.studentName.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold text-gray-800">{selectedSeat.studentName}</h4>
                <p className="text-sm text-gray-600">{selectedSeat.studentId}</p>
                <p className="text-xs text-gray-500">Seat #{selectedSeat.id}</p>
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

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Violations</p>
              <p className="text-2xl font-bold text-blue-600">{selectedSeat.violations}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600 mb-1">Face Match</p>
              <p className="text-2xl font-bold text-green-600">
                {selectedSeat.faceMatch ? '✓' : '✗'}
              </p>
            </div>
          </div>

          {/* Camera Feed */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">Camera Feed</p>
            <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center">
              <Video className="text-gray-600" size={48} />
            </div>
            <p className="text-xs text-gray-500 mt-2">Camera {selectedSeat.cameraId} • ROI Active</p>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <button className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              <Eye size={18} className="inline mr-2" />
              View Full Recording
            </button>
            <button className="w-full bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors">
              <AlertCircle size={18} className="inline mr-2" />
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
      { icon: <Activity size={18} />, label: 'Movement Detection', status: true }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <StatusBar />

      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Offline Exam Monitoring</h1>
              <p className="text-gray-600">Real-time monitoring with AI-powered detection</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                <Download size={20} />
                Export Report
              </button>
            </div>
          </div>
        </div>

        <HallSelector />
        <StatsGrid />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <HeatmapView />
            <FeaturesPanel />
          </div>

          {/* Sidebar */}
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