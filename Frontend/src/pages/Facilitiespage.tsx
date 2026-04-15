"use client"

import { useState, useEffect } from "react"
import {
  LayoutDashboard,
  Crosshair,
  Building2,
  Shield,
  Plus,
  Trash2,
  Video,
  Users,
  ChevronLeft,
  Loader2,
  X,
} from "lucide-react"
import { Link, useLocation } from "react-router-dom"
import {
  examHallApi,
  cameraApi,
  hallEnrollmentApi,
  studentListApi,
  type ExamHall,
  type Camera,
} from "../services/api"

interface Student {
  id: number
  name: string
  student_id: string
  seat_number: string
}

export default function FacilitiesPage() {
  const [halls, setHalls] = useState<ExamHall[]>([])
  const [hallsLoading, setHallsLoading] = useState(true)
  const [selectedHall, setSelectedHall] = useState<ExamHall | null>(null)
  const [activeTab, setActiveTab] = useState<"cameras" | "students">("cameras")

  const [cameras, setCameras] = useState<Camera[]>([])
  const [camerasLoading, setCamerasLoading] = useState(false)

  const [students, setStudents] = useState<Student[]>([])
  const [studentsLoading, setStudentsLoading] = useState(false)

  // Register Hall modal
  const [showHallModal, setShowHallModal] = useState(false)
  const [newHallName, setNewHallName] = useState("")
  const [newHallBuilding, setNewHallBuilding] = useState("")
  const [newHallCapacity, setNewHallCapacity] = useState("")
  const [hallSaving, setHallSaving] = useState(false)

  // Add Camera modal
  const [showCameraModal, setShowCameraModal] = useState(false)
  const [newCamName, setNewCamName] = useState("")
  const [newCamUrl, setNewCamUrl] = useState("")
  const [camSaving, setCamSaving] = useState(false)

  // Enroll Student modal
  const [showStudentModal, setShowStudentModal] = useState(false)
const [studentSaving, setStudentSaving] = useState(false)
const [availableStudents, setAvailableStudents] = useState<{id: number, name: string}[]>([])
const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      setHallsLoading(true)
      try {
        const data = await examHallApi.getAll()
        setHalls(data)
      } catch { }
      finally { setHallsLoading(false) }
    }
    load()
  }, [])

  useEffect(() => {
    if (!selectedHall) return
    const loadCams = async () => {
      setCamerasLoading(true)
      try {
        const data = await cameraApi.getByHall(selectedHall.id)
        setCameras(data)
      } catch { setCameras([]) }
      finally { setCamerasLoading(false) }
    }
    const loadStudents = async () => {
      setStudentsLoading(true)
      try {
        const data = await hallEnrollmentApi.getByHall(selectedHall.id)
        setStudents(data.map(e => ({
          id: e.id,
          name: e.student_name || 'Unknown',
          student_id: String(e.student),
          seat_number: '-',
        })))
      } catch { setStudents([]) }
      finally { setStudentsLoading(false) }
    }
    loadCams()
    loadStudents()
  }, [selectedHall?.id])

  const addHall = async () => {
    if (!newHallName.trim() || !newHallBuilding.trim() || !newHallCapacity) return
    setHallSaving(true)
    try {
      const created = await examHallApi.create({
        name: newHallName,
        building: newHallBuilding,
        capacity: Number(newHallCapacity),
        is_active: true,
      })
      setHalls((prev) => [...prev, created])
      setNewHallName(""); setNewHallBuilding(""); setNewHallCapacity("")
      setShowHallModal(false)
    } catch { alert("Failed to create hall.") }
    finally { setHallSaving(false) }
  }

const addCamera = async () => {
  if (!newCamName.trim() || !selectedHall) return
  setCamSaving(true)
  try {
    const created = await cameraApi.create(selectedHall.id, {
      name: newCamName,
      stream_url: newCamUrl,
    })
    setCameras((prev) => [...prev, created])
    setNewCamName(""); setNewCamUrl("")
    setShowCameraModal(false)
  } catch (error) {
    console.error("Failed to add camera:", error)
    alert("Failed to add camera.")
  }
  finally { setCamSaving(false) }
}

  const deleteCamera = async (id: number) => {
    if (!confirm("Are you sure you want to delete this camera?")) return
    try {
      await cameraApi.delete(id)
      setCameras((prev) => prev.filter((c) => c.id !== id))
    } catch {
      alert("Failed to delete camera.")
    }
  }

  const deleteStudent = async (id: number) => {
    if (!confirm("Remove this student from the hall?")) return
    try {
      await hallEnrollmentApi.delete(id)
      setStudents((prev) => prev.filter((s) => s.id !== id))
    } catch {
      alert("Failed to remove student.")
    }
  }

  const fieldStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    border: "1px solid #e5e7eb",
    borderRadius: 8,
    fontSize: 13,
    color: "#111827",
    background: "#fff",
    outline: "none",
    boxSizing: "border-box",
  }

  const Modal = ({
    title, onClose, onSubmit, saving, disabled, submitLabel, children,
  }: {
    title: string
    onClose: () => void
    onSubmit: () => void
    saving: boolean
    disabled: boolean
    submitLabel: string
    children: React.ReactNode
  }) => (
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
              disabled={disabled || saving}
              style={{
                flex: 1, padding: "10px", border: "none", borderRadius: 8,
                background: disabled || saving ? "#d1d5db" : "#3b82f6",
                color: "#fff", fontSize: 14, fontWeight: 600,
                cursor: disabled || saving ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              {saving && <Loader2 size={14} />}
              {submitLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-background" style={{ fontFamily: "system-ui, sans-serif" }}>
      <div className="px-8 py-8">
        {/* ── LIST VIEW ─────────────────────────────── */}
        {!selectedHall ? (
          <div>
            {/* Header */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Facilities</h1>
                <p className="text-gray-600 text-sm">
                  Manage exam halls, capacities, and attached hardware.
                </p>
              </div>
              <button
                onClick={() => setShowHallModal(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all duration-300 shadow-md"
              >
                <Plus size={16} />
                Register Hall
              </button>
            </div>

            {/* Hall cards */}
            {hallsLoading ? (
              <div className="flex items-center gap-2 text-gray-500">
                <Loader2 size={18} className="animate-spin" />
                Loading facilities...
              </div>
            ) : halls.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl p-10 text-center">
                <Building2 size={40} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No facilities registered yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {halls.map((hall) => (
                  <button
                    key={hall.id}
                    onClick={() => setSelectedHall(hall)}
                    className="bg-white border border-gray-200 rounded-xl p-5 text-left cursor-pointer transition-all hover:border-blue-500 hover:shadow-md"
                  >
                    {/* Hall icon + active badge */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Building2 size={20} className="text-blue-600" />
                      </div>
                      {hall.is_active && (
                        <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                          ACTIVE
                        </span>
                      )}
                    </div>

                    <div className="font-bold text-gray-900 text-lg mb-1">
                      {hall.name}
                    </div>
                    <div className="text-gray-500 text-sm mb-4">
                      {hall.building} · Max Capacity: {hall.capacity}
                    </div>

                    <div className="h-px bg-gray-100 mb-4" />

                    <div className="flex gap-2">
                      <span className="bg-gray-50 border border-gray-200 rounded-full px-3 py-1 text-xs text-gray-700 font-medium">
                        — STUDENTS
                      </span>
                      <span className="bg-gray-50 border border-gray-200 rounded-full px-3 py-1 text-xs text-gray-700 font-medium">
                        — CAMERAS
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ── DETAIL VIEW ──────────────────────────── */
          <div>
            {/* Back */}
            <button
              onClick={() => setSelectedHall(null)}
              className="flex items-center gap-2 text-gray-600 text-sm mb-6 hover:text-blue-600 transition-colors"
            >
              <ChevronLeft size={16} />
              Back to Facilities
            </button>

            {/* Hall header card */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
              <h2 className="text-2xl font-extrabold text-gray-900 mb-1">
                {selectedHall.name}
              </h2>
              <p className="text-gray-500 text-sm mb-5">
                {selectedHall.building} · Capacity: {selectedHall.capacity}
              </p>

              {/* Tabs */}
              <div className="flex border-b border-gray-200">
                {(["cameras", "students"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex items-center gap-2 px-5 py-2.5 text-sm font-medium transition-all ${
                      activeTab === tab
                        ? "text-blue-600 border-b-2 border-blue-600"
                        : "text-gray-500 border-b-2 border-transparent hover:text-gray-700"
                    }`}
                  >
                    {tab === "cameras" ? <Video size={15} /> : <Users size={15} />}
                    {tab === "cameras"
                      ? `Cameras (${cameras.length})`
                      : `Students (${students.length})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            {activeTab === "cameras" ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    Registered Cameras
                  </h3>
                  <button
                    onClick={() => setShowCameraModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all"
                  >
                    <Plus size={14} />
                    Add Camera
                  </button>
                </div>

                {camerasLoading ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 size={16} className="animate-spin" />
                    Loading cameras...
                  </div>
                ) : cameras.length === 0 ? (
                  <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                    <Video size={32} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No cameras registered yet.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {cameras.map((cam) => (
                      <div
                        key={cam.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                            <Video size={18} className="text-blue-600" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{cam.name}</div>
                            <div className="text-xs text-gray-400">{cam.stream_url || "No stream URL"}</div>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteCamera(cam.id)}
                          title="Delete camera"
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Students tab */
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    Enrolled Students
                  </h3>
                 <button
  onClick={async () => {
    setShowStudentModal(true)
    try {
      const data = await studentListApi.getAll()
      setAvailableStudents(data)
    } catch {}
  }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all"
                  >
                    <Plus size={14} />
                    Enroll Student
                  </button>
                </div>

                {studentsLoading ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 size={16} className="animate-spin" /> Loading students...
                  </div>
                ) : students.length === 0 ? (
                  <div className="bg-white border border-gray-200 rounded-xl p-8 text-center">
                    <Users size={32} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">No students enrolled yet.</p>
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          {["STUDENT ID", "NAME", "SEAT NO.", ""].map((h) => (
                            <th
                              key={h}
                              className="px-4 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((s, i) => (
                          <tr
                            key={s.id}
                            className={i < students.length - 1 ? "border-b border-gray-100" : ""}
                          >
                            <td className="px-4 py-3 text-sm text-blue-600 font-medium">
                              {s.student_id}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">{s.name}</td>
                            <td className="px-4 py-3">
                              <span className="bg-gray-50 border border-gray-200 rounded-md px-3 py-1 text-xs text-gray-700">
                                {s.seat_number}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => deleteStudent(s.id)}
                                title="Remove student"
                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Register Hall Modal */}
      {showHallModal && (
        <Modal
          title="Register Hall"
          onClose={() => setShowHallModal(false)}
          onSubmit={addHall}
          saving={hallSaving}
          disabled={!newHallName.trim() || !newHallBuilding.trim() || !newHallCapacity}
          submitLabel="Register Hall"
        >
          {[
            { label: "Hall Name *", value: newHallName, setter: setNewHallName, placeholder: "e.g. Hall D", type: "text" },
            { label: "Building *", value: newHallBuilding, setter: setNewHallBuilding, placeholder: "e.g. Building 3", type: "text" },
            { label: "Capacity *", value: newHallCapacity, setter: setNewHallCapacity, placeholder: "e.g. 30", type: "number" },
          ].map(({ label, value, setter, placeholder, type }) => (
            <div key={label}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {label}
              </label>
              <input
                type={type}
                value={value}
                onChange={(e) => setter(e.target.value)}
                placeholder={placeholder}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          ))}
        </Modal>
      )}

      {/* Add Camera Modal */}
      {showCameraModal && (
        <Modal
          title="Add Camera"
          onClose={() => setShowCameraModal(false)}
          onSubmit={addCamera}
          saving={camSaving}
          disabled={!newCamName.trim()}
          submitLabel="Add Camera"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Camera Name / Location
            </label>
            <input
              type="text"
              value={newCamName}
              onChange={(e) => setNewCamName(e.target.value)}
              placeholder="e.g. Front Left"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Stream URL
            </label>
            <input
              type="text"
              value={newCamUrl}
              onChange={(e) => setNewCamUrl(e.target.value)}
              placeholder="rtsp://... or USB index (0)"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </Modal>
      )}

  {/* Enroll Student Modal */}
{showStudentModal && (
  <Modal
    title="Enroll Student"
    onClose={() => { setShowStudentModal(false); setSelectedStudentId(null) }}
    onSubmit={async () => {
      if (!selectedStudentId || !selectedHall) return
      setStudentSaving(true)
      try {
        const created = await hallEnrollmentApi.create(selectedHall.id, {
          student: selectedStudentId,
        })
        setStudents(prev => [...prev, {
          id: created.id,
          name: created.student_name || 'Unknown',
          student_id: String(created.student),
          seat_number: '-',
        }])
        setSelectedStudentId(null)
        setShowStudentModal(false)
      } catch {
        alert("Failed to enroll student.")
      } finally {
        setStudentSaving(false)
      }
    }}
    saving={studentSaving}
    disabled={!selectedStudentId}
    submitLabel="Enroll Student"
  >
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        Select Student
      </label>
      {availableStudents.length === 0 ? (
        <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
          <Loader2 size={14} className="animate-spin" />
          Loading students...
        </div>
      ) : (
        <select
          onChange={(e) => setSelectedStudentId(Number(e.target.value))}
          className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-blue-500"
        >
          <option value="">-- Select a student --</option>
          {availableStudents.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      )}
    </div>
  </Modal>
)}
   
    </div>
  )
}