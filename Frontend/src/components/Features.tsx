"use client"
import { motion } from "framer-motion"
import type { Variants } from "framer-motion"
import { useState } from "react"
import {
  ScanFace,
  Monitor,
  Mic,
  Video,
  Eye,
  Smartphone,
  Bell,
  FileVideo,
  FileText,
  Cctv,
  LayoutDashboard,
  Brain,
  type LucideIcon,
} from "lucide-react"

const Features = () => {
  const features: { title: string; text: string; note: string; icon: LucideIcon; image: string }[] = [
    {
      title: "Face Recognition & Identity Verification",
      text: "Verify student identity using facial recognition technology before starting the exam.",
      note: "Verify student identity and ensure correct authentication",
      icon: ScanFace,
      image: "/images/face-recognition-biometric-scanning-technology.jpg",
    },
    {
      title: "Screen Recording & Browser Lock",
      text: "Complete screen activity recording and browser lockdown during exam.",
      note: "Prevent access to external resources",
      icon: Monitor,
      image: "/images/screen-recording-monitor-lockdown-security.jpg",
    },
    {
      title: "Audio Monitoring (Microphone)",
      text: "Analyze background audio to detect talking or whispering.",
      note: "Detect suspicious audio activity",
      icon: Mic,
      image: "/images/microphone-audio-monitoring-sound-waves.jpg",
    },
    {
      title: "Webcam Monitoring",
      text: "Continuous monitoring of face and body movements through webcam.",
      note: "Observe movements and attention",
      icon: Video,
      image: "/images/webcam-video-monitoring-surveillance-camera.jpg",
    },
    {
      title: "Eye & Head Tracking",
      text: "Real-time tracking of gaze direction and head movement.",
      note: "Detect looking away from screen",
      icon: Eye,
      image: "/images/eye-tracking-gaze-detection-technology.jpg",
    },
    {
      title: "Object Detection (Phone/Paper)",
      text: "Detect presence of mobile phones, papers, or unauthorized objects.",
      note: "Identify forbidden devices or aids",
      icon: Smartphone,
      image: "/images/object-detection-phone-paper-ai-scanning.jpg",
    },
    {
      title: "Real-Time Alerts",
      text: "Send instant alerts for suspicious behavior to proctors.",
      note: "Alert proctors for immediate action",
      icon: Bell,
      image: "/images/real-time-alert-notification-warning-system.jpg",
    },
    {
      title: "Session Recording & Logs",
      text: "Save all video, audio, and screen data for review.",
      note: "Store session records for audits",
      icon: FileVideo,
      image: "/images/video-recording-session-logs-data-storage.jpg",
    },
    {
      title: "Exam Reports",
      text: "Post-exam reports summarizing alerts and results.",
      note: "Generate integrity reports and analytics",
      icon: FileText,
      image: "/images/exam-report-analytics-charts-dashboard.jpg",
    },
  ]

  const offline: { title: string; text: string; icon: LucideIcon; image: string }[] = [
    {
      title: "CCTV integration via LAN",
      text: "Connect local cameras directly to the AI module without internet dependency.",
      icon: Cctv,
      image: "/images/cctv-camera-security-surveillance-system.jpg",
    },
    {
      title: "Monitoring Dashboard",
      text: "Provides supervisors with live video feeds, alerts, and analytics in one interface.",
      icon: LayoutDashboard,
      image: "/images/monitoring-dashboard-analytics-interface.jpg",
    },
    {
      title: "Real-Time AI Behavior Analysis",
      text: "Detects suspicious movements, gestures, or group cheating with models.",
      icon: Brain,
      image: "/images/ai-brain-artificial-intelligence-analysis.jpg",
    },
  ]

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  }

  return (
    <div className="w-full min-h-screen bg-background">
      {/* Features Overview */}
      <motion.section
        className="bg-blue-50 min-h-screen pt-32 pb-0 py-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={containerVariants}
      >
        <div className="container mx-auto px-6">
          <motion.h2
            className="text-3xl font-bold text-center text-gray-800 mb-12"
            initial={{ opacity: 0, y: -30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Comprehensive Exam Integrity Solution
          </motion.h2>

          {/* Single animated feature showcase */}
          <motion.div
            className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden"
            whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="relative h-96">
              <motion.img
                src="images/g2.png"
                alt="Comprehensive Solution"
                className="w-full h-full object-cover"
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 10,
                  repeat: Number.POSITIVE_INFINITY,
                  ease: "easeInOut",
                }}
              />

              {/* Animated text overlay */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-Tertiary/50 to-Quaternary/50 flex items-center justify-center"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 1 }}
              >
                <motion.div
                  className="text-center text-white px-8"
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 1.2, delay: 0.3 }}
                >
                  <motion.h3
                    className="text-4xl font-bold mb-4"
                    animate={{
                      textShadow: [
                        "0 0 0px rgba(255,255,255,0)",
                        "0 0 20px rgba(255,255,255,0.5)",
                        "0 0 0px rgba(255,255,255,0)",
                      ],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                  >
                    All-in-One Platform
                  </motion.h3>
                  <motion.p
                    className="text-xl mb-6"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                  >
                    From online proctoring to offline surveillance
                  </motion.p>
                  <motion.div
                    className="flex justify-center gap-4"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                  >
                    <motion.div
                      className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2"
                      whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.3)" }}
                    >
                      <div className="text-2xl font-bold">99.9%</div>
                      <div className="text-sm">Accuracy</div>
                    </motion.div>
                    <motion.div
                      className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2"
                      whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.3)" }}
                    >
                      <div className="text-2xl font-bold">24/7</div>
                      <div className="text-sm">Monitoring</div>
                    </motion.div>
                    <motion.div
                      className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2"
                      whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.3)" }}
                    >
                      <div className="text-2xl font-bold">AI</div>
                      <div className="text-sm">Powered</div>
                    </motion.div>
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      <section className="w-full py-24 px-4" id="features">
        <div className="max-w-[1340px] w-full mx-auto">
          {/* Section Header */}
          <motion.h2
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center text-3xl font-bold mb-2"
          >
            Advanced Anti-Cheating Features
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="text-center text-gray-500 mb-10"
          >
            A comprehensive system that combines multiple technologies to ensure online exam integrity
          </motion.p>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f, i) => (
              <FeatureCard key={i} feature={f} index={i} />
            ))}
          </div>

          {/* Offline Section */}
          <motion.h3
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center text-3xl font-bold mt-16 mb-2"
          >
            Offline Exam Monitoring System
          </motion.h3>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="text-center text-gray-500 mb-6"
          >
            A smart AI-powered offline monitoring system using LAN-connected CCTV cameras.
          </motion.p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {offline.map((o, idx) => (
              <OfflineCard key={idx} feature={o} index={idx} />
            ))}
          </div>

          {/* Learn More */}
          <div className="text-center mt-10">
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="
                bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold 
                transition-all duration-300 hover:-translate-y-1 hover:bg-blue-700 
                shadow-md hover:shadow-xl relative overflow-hidden
              "
            >
              Learn More
            </motion.button>
          </div>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({
  feature,
  index,
}: { feature: { title: string; text: string; note: string; icon: LucideIcon; image: string }; index: number }) {
  const [isHovered, setIsHovered] = useState(false)
  const Icon = feature.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay: index * 0.1, duration: 0.6, ease: "easeOut" }}
      className="
        group bg-white rounded-xl p-5 shadow-md 
        hover:shadow-2xl
        border border-gray-100 hover:border-blue-300
        relative overflow-hidden cursor-default
        transition-all duration-300
      "
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-blue-100/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative flex items-center gap-3 mb-3 z-10">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-400 rounded-2xl blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
          <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center shadow-md transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 group-hover:bg-blue-600 relative z-10 overflow-hidden">
            {/* Icon - visible by default, hidden on hover */}
            <Icon
              className={`w-8 h-8 text-blue-600 group-hover:text-white transition-all duration-300 absolute ${isHovered ? "opacity-0 scale-75" : "opacity-100 scale-100"}`}
            />
            {/* Image - hidden by default, visible on hover */}
            <img
              src={feature.image || "/placeholder.svg"}
              alt={feature.title}
              className={`w-full h-full object-cover absolute inset-0 transition-all duration-300 ${isHovered ? "opacity-100 scale-100" : "opacity-0 scale-110"}`}
            />
          </div>
        </div>
      </div>

      <h3 className="relative z-10 font-bold text-[15px] text-gray-900 mb-1 transition-colors duration-300 group-hover:text-blue-600">
        {feature.title}
      </h3>
      <p className="relative z-10 text-[13px] text-gray-600 leading-snug mb-3 transition-colors duration-300 group-hover:text-gray-800">
        {feature.text}
      </p>

      <div
        className="
        relative z-10 mt-auto flex items-center gap-2 w-fit px-3 py-2 rounded-lg
        bg-green-100 text-green-700 text-[13px]
        transition-all duration-300 
        group-hover:bg-green-600 group-hover:text-white group-hover:scale-105 group-hover:shadow-lg
        cursor-default
      "
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path
            d="M20 6L9 17l-5-5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>{feature.note}</span>
      </div>
    </motion.div>
  )
}

function OfflineCard({
  feature,
  index,
}: { feature: { title: string; text: string; icon: LucideIcon; image: string }; index: number }) {
  const [isHovered, setIsHovered] = useState(false)
  const Icon = feature.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ delay: index * 0.15, duration: 0.6, ease: "easeOut" }}
      className="
        group bg-white rounded-xl p-5 text-center shadow-md
        hover:shadow-2xl 
        relative overflow-hidden cursor-default
        border border-gray-100 hover:border-blue-300
        transition-all duration-300
      "
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        <div className="relative inline-block">
          <div className="absolute inset-0 bg-blue-400 rounded-full blur-lg opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
          <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3 shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 group-hover:bg-primary relative z-10 overflow-hidden">
            {/* Icon - visible by default, hidden on hover */}
            <Icon
              className={`w-8 h-8 text-primary group-hover:text-white transition-all duration-300 absolute ${isHovered ? "opacity-0 scale-75" : "opacity-100 scale-100"}`}
            />
            {/* Image - hidden by default, visible on hover */}
            <img
              src={feature.image || "/placeholder.svg"}
              alt={feature.title}
              className={`w-full h-full object-cover absolute inset-0 transition-all duration-300 rounded-full ${isHovered ? "opacity-100 scale-100" : "opacity-0 scale-110"}`}
            />
          </div>
        </div>
      </div>

      <h4 className="relative z-10 font-bold text-[16px] mb-1 text-gray-900 transition-colors duration-300 group-hover:text-primary">
        {feature.title}
      </h4>

      <p className="relative z-10 text-gray-600 text-[13px] transition-colors duration-300 group-hover:text-gray-800">
        {feature.text}
      </p>
    </motion.div>
  )
}

export default Features
