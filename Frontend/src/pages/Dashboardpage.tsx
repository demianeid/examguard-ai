"use client"

import {
  Building2,
  Shield,
  Play,
  Eye,
  Activity,
  AlertTriangle,
  ChevronRight,
} from "lucide-react"
import { Link } from "react-router-dom"

export default function DashboardPage() {
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
            <Link to="/roi-config?examId=1">
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

      {/* Platform Capabilities Cards - بدون عنوان */}
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