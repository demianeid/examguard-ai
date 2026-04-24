"use client"

import { useState, useEffect, useMemo } from "react"
import {
  FileText,
  Plus,
  Trash2,
  Loader2,
  X,
  MapPin,
  Clock,
  Calendar,
  User,
  AlertTriangle,
  Play,
  Crosshair,
} from "lucide-react"
import {
  offlineExamApi,
  examHallApi,
  type OfflineExam,
  type ExamHall,
} from "../services/api"

function Modal({
  title, onClose, onSubmit, saving: isSaving, disabled, submitLabel, children,
}: {
  title: string
  onClose: () => void
  onSubmit: () => void
  saving: boolean
  disabled: boolean
  submitLabel: string
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.35)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200,
      }}
    >
      <div style={{ background: "#fff", borderRadius: 14, padding: 28, width: "100%", maxWidth: 440, margin: "0 16px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700, color: "#111827", margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {children}
          <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: "10px", border: "1px solid #e5e7eb",
                borderRadius: 8, background: "#fff", color: "#374151",
                fontSize: 14, fontWeight: 500, cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              onClick={onSubmit}
              disabled={disabled || isSaving}
              style={{
                flex: 1, padding: "10px", border: "none", borderRadius: 8,
                background: disabled || isSaving ? "#d1d5db" : "#3b82f6",
                color: "#fff", fontSize: 14, fontWeight: 600,
                cursor: disabled || isSaving ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              {isSaving && <Loader2 size={14} />}
              {submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ExamsPage() {
  const [exams, setExams] = useState<OfflineExam[]>([])
  const [examsLoading, setExamsLoading] = useState(true)

  const [showModal, setShowModal] = useState(false)
  const [halls, setHalls] = useState<ExamHall[]>([])
  const [hallsLoading, setHallsLoading] = useState(false)

  const [newTitle, setNewTitle] = useState("")
  const [newHall, setNewHall] = useState("")
  const [newDate, setNewDate] = useState("")
  const [newStartTime, setNewStartTime] = useState("")
  const [newEndTime, setNewEndTime] = useState("")
  const [saving, setSaving] = useState(false)

  // ── Live clock for time validation (refreshes every 30s) ──
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const todayStr = useMemo(() => {
    return now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0") + "-" + String(now.getDate()).padStart(2, "0")
  }, [now])

  const isToday = newDate === todayStr

  const toMinutes = (t: string) => {
    const [h, m] = t.split(":").map(Number)
    return h * 60 + m
  }

  const nowMins = now.getHours() * 60 + now.getMinutes()

  const fmtTime = (totalMins: number) => {
    const h = Math.floor(totalMins / 60) % 24
    const m = totalMins % 60
    return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0")
  }

  // Minimum allowed start = now + 5 min (only on today)
  const minStartMins = nowMins + 5
  const minStartTime = isToday ? fmtTime(minStartMins) : undefined

  // Minimum allowed end = start time (or now+1 if no start yet, only on today)
  const minEndTime = newStartTime
    ? fmtTime(toMinutes(newStartTime) + 1)
    : isToday ? fmtTime(nowMins + 1) : undefined

  // ── onChange handlers that reject invalid picks ──
  const handleStartTimeChange = (val: string) => {
    if (!val) { setNewStartTime(""); return }
    if (isToday && toMinutes(val) < minStartMins) {
      // Reject — snap to the minimum allowed time
      setNewStartTime(fmtTime(minStartMins))
      return
    }
    setNewStartTime(val)
  }

  const handleEndTimeChange = (val: string) => {
    if (!val) { setNewEndTime(""); return }
    if (isToday && toMinutes(val) <= nowMins) {
      // Reject past end times
      setNewEndTime(fmtTime(nowMins + 1))
      return
    }
    if (newStartTime && toMinutes(val) <= toMinutes(newStartTime)) {
      // Reject end <= start
      setNewEndTime(fmtTime(toMinutes(newStartTime) + 1))
      return
    }
    setNewEndTime(val)
  }

  // ── Validation messages for display ──
  const timeValidation = useMemo(() => {
    const errors: string[] = []

    if (isToday && newStartTime) {
      const startMins = toMinutes(newStartTime)
      if (startMins < nowMins) {
        errors.push("Start time cannot be in the past.")
      } else if (startMins < nowMins + 5) {
        errors.push("Start time must be at least 5 minutes from now so all setup processes can finish.")
      }
    }

    if (isToday && newEndTime) {
      if (toMinutes(newEndTime) <= nowMins) {
        errors.push("End time cannot be in the past.")
      }
    }

    if (newStartTime && newEndTime) {
      if (toMinutes(newEndTime) <= toMinutes(newStartTime)) {
        errors.push("End time must be after start time.")
      }
    }

    return { errors, hasErrors: errors.length > 0 }
  }, [newDate, newStartTime, newEndTime, isToday, nowMins])

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

  const [currentNow, setCurrentNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentNow(new Date()), 30000)
    return () => clearInterval(timer)
  }, [])

  const getMinutesToStart = (exam: OfflineExam) => {
    const [y, m, d] = exam.date.split('-').map(Number)
    const [h, min] = exam.start_time.split(':').map(Number)
    const examDate = new Date(y, m - 1, d, h, min)
    return Math.floor((examDate.getTime() - currentNow.getTime()) / 60000)
  }

  const isStartAllowed = (exam: OfflineExam) => {
    if (exam.computed_status === 'active') return true
    if (exam.computed_status !== 'upcoming') return false
    
    const diffMins = getMinutesToStart(exam)
    return diffMins <= 10 && diffMins > -100
  }

  const isZoneConfigured = (exam: OfflineExam) => {
    return localStorage.getItem(`zoneConfigured_${exam.id}`) === 'true'
  }

  const openModal = async () => {
    setShowModal(true)
    setHallsLoading(true)
    try {
      const data = await examHallApi.getAll()
      setHalls(data)
    } catch {}
    finally { setHallsLoading(false) }
  }

  const createExam = async () => {
    if (!newTitle.trim() || !newHall || !newDate || !newStartTime || !newEndTime) return
    if (timeValidation.hasErrors) return
    setSaving(true)
    try {
      const created = await offlineExamApi.create({
        title: newTitle,
        hall: Number(newHall),
        date: newDate,
        start_time: newStartTime,
        end_time: newEndTime,
      })
      setExams((prev) => [...prev, created])
      setNewTitle(""); setNewHall(""); setNewDate(""); setNewStartTime(""); setNewEndTime("")
      setShowModal(false)
    } catch { alert("Failed to create exam.") }
    finally { setSaving(false) }
  }

  const deleteExam = async (id: number) => {
    if (!confirm("Are you sure you want to delete this exam?")) return
    try {
      await offlineExamApi.delete(id)
      setExams((prev) => prev.filter((e) => e.id !== id))
    } catch {
      alert("Failed to delete exam.")
    }
  }

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-700"
      case "completed": return "bg-gray-100 text-gray-600"
      case "missed": return "bg-red-100 text-red-700"
      default: return "bg-blue-100 text-blue-700"
    }
  }


  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "system-ui, sans-serif" }}>
      <div className="px-8 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Exams</h1>
            <p className="text-gray-600 text-sm">
              Manage offline exams, schedules, and hall assignments.
            </p>
          </div>
          <button
            onClick={openModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-md"
          >
            <Plus size={16} />
            Create Exam
          </button>
        </div>

        {examsLoading ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 size={18} className="animate-spin" />
            Loading exams...
          </div>
        ) : exams.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
            <FileText size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No exams created yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {exams.map((exam) => (
              <div
                key={exam.id}
                className="bg-white border border-gray-200 rounded-xl p-5 transition-all hover:shadow-md"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <FileText size={20} className="text-blue-600" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${getStatusStyle(exam.computed_status)}`}>
                      {exam.computed_status?.toUpperCase() || "UPCOMING"}
                    </span>
                    <button
                      onClick={() => deleteExam(exam.id)}
                      title="Delete exam"
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="font-bold text-gray-900 text-lg mb-1">
                  {exam.title}
                </div>

                <div className="space-y-1.5 text-sm text-gray-500 mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-gray-400" />
                    {exam.hall_name}
                  </div>
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-gray-400" />
                    {exam.professor_name}
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-400" />
                    {exam.date}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-gray-400" />
                    {exam.start_time} — {exam.end_time}
                  </div>
                </div>

                <div className="h-px bg-gray-100 mb-4" />

                <div className="flex gap-2">
                  {exam.computed_status === 'completed' ? (
                    <a
                      href={`/report?examId=${exam.id}`}
                      className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-green-50 hover:bg-green-100 border border-green-200 text-green-700 text-xs font-bold rounded-md shadow-sm transition-all"
                    >
                      <FileText size={14} />
                      View Report
                    </a>
                  ) : exam.computed_status === 'missed' ? (
                    <>
                      <button
                        onClick={() => deleteExam(exam.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-red-200 hover:bg-red-50 text-red-600 text-xs font-semibold rounded-md shadow-sm transition-all"
                      >
                        Delete
                      </button>
                      <button
                        onClick={openModal}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-blue-200 hover:bg-blue-50 text-blue-600 text-xs font-semibold rounded-md shadow-sm transition-all"
                      >
                        Reschedule
                      </button>
                    </>
                  ) : (
                    <>
                      {!isZoneConfigured(exam) ? (
                        <button
                          disabled
                          title="Please configure zones first"
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 border border-gray-200 text-gray-400 text-xs font-semibold rounded-md shadow-sm cursor-not-allowed transition-all"
                        >
                          <Crosshair size={14} /> Config Zone First
                        </button>
                      ) : isStartAllowed(exam) ? (
                        <a
                          href={`/MonitoringOffline?examId=${exam.id}`}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 border border-blue-700 text-white text-xs font-semibold rounded-md shadow-sm transition-all"
                        >
                          <Play size={14} /> Monitor
                        </a>
                      ) : (
                        <button
                          disabled
                          title="Available 10 minutes before start"
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 border border-gray-200 text-gray-500 text-xs font-semibold rounded-md shadow-sm cursor-not-allowed transition-all"
                        >
                          <Play size={14} /> Opens 10 mins before
                        </button>
                      )}
                      
                      <a
                        href={`/roi-config?examId=${exam.id}`}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-semibold rounded-md shadow-sm transition-all"
                      >
                        Zone Config
                      </a>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <Modal
          title="Create Exam"
          onClose={() => setShowModal(false)}
          onSubmit={createExam}
          saving={saving}
          disabled={!newTitle.trim() || !newHall || !newDate || !newStartTime || !newEndTime || timeValidation.hasErrors}
          submitLabel="Create Exam"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Title *
            </label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Midterm — Data Structures"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Hall *
            </label>
            {hallsLoading ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
                <Loader2 size={14} className="animate-spin" />
                Loading halls...
              </div>
            ) : (
              <select
                value={newHall}
                onChange={(e) => setNewHall(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-blue-500 transition-colors"
              >
                <option value="">-- Select a hall --</option>
                {halls.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} — {h.building}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Date *
            </label>
            <input
              type="date"
              value={newDate}
              min={todayStr}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Start Time *
              </label>
              <input
                type="time"
                value={newStartTime}
                min={minStartTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm text-gray-900 outline-none transition-colors ${
                  timeValidation.errors.some(e => e.includes("Start")) ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-blue-500"
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                End Time *
              </label>
              <input
                type="time"
                value={newEndTime}
                min={minEndTime}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm text-gray-900 outline-none transition-colors ${
                  timeValidation.errors.some(e => e.includes("End")) ? "border-red-400 focus:border-red-500" : "border-gray-200 focus:border-blue-500"
                }`}
              />
            </div>
          </div>

          {timeValidation.errors.map((msg, i) => (
            <div
              key={`err-${i}`}
              className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-3 py-2"
            >
              <AlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
              <span>{msg}</span>
            </div>
          ))}
        </Modal>
      )}
    </div>
  )
}
