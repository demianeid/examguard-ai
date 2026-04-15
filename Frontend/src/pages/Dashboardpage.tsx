"use client"

import { useState, useEffect } from "react"
import {
  Building2,
  Shield,
  Play,
  Eye,
  Activity,
  AlertTriangle,
  ChevronRight,
  Loader2,
  Clock,
  MapPin,
  Calendar,
} from "lucide-react"
import { Link } from "react-router-dom"
import { offlineExamApi, type OfflineExam } from "../services/api"

export default function DashboardPage() {
  const [exams, setExams] = useState<OfflineExam[]>([])
  const [examsLoading, setExamsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setExamsLoading(true)
      try {
        const data = await offlineExamApi.getAll()
        setExams(data)
      } catch {}
      finally { setExamsLoading(false) }
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-background border-b border-[#1d1d1d]/20 py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-200 rounded-full text-sm text-gray-600 mb-8">
            <Shield size={14} />
            Offline AI Exam Monitoring
          </div>

          {/* Title */}
          <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-4">
            Secure Your{" "}
            <span className="text-blue-600">Exam Integrity</span>
          </h1>

          {/* Subtitle */}
          <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Detect unauthorized devices, suspicious behavior, and multiple faces
            in real-time using advanced computer vision — completely offline and privacy-first.
          </p>

          {/* CTA Buttons */}
          <div className="flex gap-4 justify-center flex-wrap">
            <Link to={exams.length > 0 ? `/MonitoringOffline?examId=${exams[0].id}` : "/roi-config"}>
              <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg">
                <Play size={16} />
                Start Session
                <ChevronRight size={16} />
              </button>
            </Link>
            <Link to="/facilites">
              <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all duration-300">
                <Building2 size={16} />
                Manage Facilities
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Active Exams */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-5">Active Exams</h2>
        {examsLoading ? (
          <div className="flex items-center gap-2 text-gray-500 justify-center py-8">
            <Loader2 size={20} className="animate-spin" />
            Loading exams...
          </div>
        ) : exams.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
            <Calendar size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No exams created yet. Set up an exam from Facilities.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900 text-lg">{exam.title}</h3>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                    exam.status === 'active'
                      ? 'bg-green-100 text-green-700'
                      : exam.status === 'completed'
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-blue-100 text-blue-700'
                  }`}>
                    {exam.status?.toUpperCase() || 'PENDING'}
                  </span>
                </div>
                <div className="space-y-1.5 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} />
                    {exam.hall_name}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    {exam.date}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} />
                    {exam.start_time} — {exam.end_time}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link to={`/MonitoringOffline?examId=${exam.id}`} className="flex-1">
                    <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors text-sm">
                      <Play size={14} />
                      Start Session
                    </button>
                  </Link>
                  <Link to={`/roi-config?examId=${exam.id}`}>
                    <button className="px-4 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm">
                      Zone Config
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Platform Capabilities Cards */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <Eye size={24} />,
              bg: "#eff6ff",
              color: "#3b82f6",
              title: "Precise ROIs",
              desc: "Map specific camera feeds to exact student seating positions for highly targeted AI analysis without cross-contamination.",
            },
            {
              icon: <Activity size={24} />,
              bg: "#f5f3ff",
              color: "#7c3aed",
              title: "Real-time Analysis",
              desc: "Instantly process video feeds using YOLOv8 and MediaPipe to track gaze direction and detect unauthorized objects.",
            },
            {
              icon: <AlertTriangle size={24} />,
              bg: "#fef2f2",
              color: "#dc2626",
              title: "Instant Alerts",
              desc: "Live WebSocket architecture streams violation events directly to the supervisor dashboard with visual severity indicators.",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: feature.bg, color: feature.color }}
              >
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}