"use client"

import { useState, useEffect, useRef } from "react"
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
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Wifi,
  WifiOff,
  RefreshCw,
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

function Modal({
  title, onClose, onSubmit, saving, disabled, submitLabel, children,
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
}

interface Student {
  id: number
  name: string
  student_id: string
  seat_number: string
  enrolled_at?: string
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
  const [hallToDelete, setHallToDelete] = useState<number | null>(null)
  const [hallDeleting, setHallDeleting] = useState(false)

  // Add Camera modal
  const [showCameraModal, setShowCameraModal] = useState(false)
  const [newCamName, setNewCamName] = useState("")
  const [newCamUrl, setNewCamUrl] = useState("")
  const [camSaving, setCamSaving] = useState(false)

  // Camera test / snapshot preview
  const [testingCameraId, setTestingCameraId] = useState<number | null>(null)
  const [testSnapshot, setTestSnapshot] = useState<string | null>(null)
  const [testSnapshotLoading, setTestSnapshotLoading] = useState(false)
  const [testSnapshotError, setTestSnapshotError] = useState<string | null>(null)
  // For "Test Connection" inside Add Camera modal
  const [newCamTestLoading, setNewCamTestLoading] = useState(false)
  const [newCamTestStatus, setNewCamTestStatus] = useState<"idle" | "ok" | "error">("idle")
  const [newCamTestMsg, setNewCamTestMsg] = useState("")

  // Enroll Student modal
  const [showStudentModal, setShowStudentModal] = useState(false)
  const [studentSaving, setStudentSaving] = useState(false)
  const [newStudentName, setNewStudentName] = useState("")
  const [newStudentIdCode, setNewStudentIdCode] = useState("")
  const [newStudentSeat, setNewStudentSeat] = useState("")   // ← NEW

  // Edit Student modal
  const [showEditStudentModal, setShowEditStudentModal] = useState(false)
  const [studentToEdit, setStudentToEdit] = useState<Student | null>(null)
  const [editStudentName, setEditStudentName] = useState("")
  const [editStudentIdCode, setEditStudentIdCode] = useState("")
  const [editStudentSeat, setEditStudentSeat] = useState("")
  const [editStudentSaving, setEditStudentSaving] = useState(false)

  // Delete Student confirmation
  const [studentToDelete, setStudentToDelete] = useState<number | null>(null)
  const [studentDeleting, setStudentDeleting] = useState(false)

  // Upload Excel modal
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadDragging, setUploadDragging] = useState(false)
  const [uploadSaving, setUploadSaving] = useState(false)
  const [uploadResult, setUploadResult] = useState<{
    created: number; skipped: number;
    errors: { row: number; reason: string }[];
    message: string;
  } | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
  student_id: e.student_code || '-',
  seat_number: e.seat_number || '-',
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

  const deleteHall = (id: number) => {
    setHallToDelete(id)
  }

  const confirmDeleteHall = async () => {
    if (hallToDelete === null) return
    setHallDeleting(true)
    try {
      await examHallApi.delete(hallToDelete)
      setHalls((prev) => prev.filter((h) => h.id !== hallToDelete))
      if (selectedHall?.id === hallToDelete) {
        setSelectedHall(null)
      }
      setHallToDelete(null)
    } catch {
      alert("Failed to delete facility.")
    } finally {
      setHallDeleting(false)
    }
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

  const openCameraTest = async (cam: Camera) => {
    setTestingCameraId(cam.id)
    setTestSnapshot(null)
    setTestSnapshotError(null)
    setTestSnapshotLoading(true)
    try {
      const data = await cameraApi.getSnapshot(cam.id)
      setTestSnapshot(data.snapshot)
    } catch (err: any) {
      setTestSnapshotError(
        err?.response?.data?.error || "Camera offline or unreachable."
      )
    } finally {
      setTestSnapshotLoading(false)
    }
  }

  const refreshCameraTest = async () => {
    if (!testingCameraId) return
    const cam = cameras.find((c) => c.id === testingCameraId)
    if (cam) openCameraTest(cam)
  }

  const deleteStudent = (id: number) => {
    setStudentToDelete(id)
  }

  const confirmDeleteStudent = async () => {
    if (studentToDelete === null) return
    setStudentDeleting(true)
    try {
      await hallEnrollmentApi.delete(studentToDelete)
      setStudents((prev) => prev.filter((s) => s.id !== studentToDelete))
      setStudentToDelete(null)
    } catch {
      alert("Failed to remove student.")
    } finally {
      setStudentDeleting(false)
    }
  }

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
                  <div
                    key={hall.id}
                    onClick={() => setSelectedHall(hall)}
                    className="bg-white border border-gray-200 rounded-xl p-5 text-left cursor-pointer transition-all hover:border-blue-500 hover:shadow-md"
                  >
                    {/* Hall icon + active badge */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Building2 size={20} className="text-blue-600" />
                      </div>
                      <div className="flex items-center gap-2">
                        {hall.is_active && (
                          <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full">
                            ACTIVE
                          </span>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); deleteHall(hall.id); }}
                          title="Delete facility"
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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
                  </div>
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
            <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 relative">
              <div className="absolute top-6 right-6">
                <button
                  onClick={() => deleteHall(selectedHall.id)}
                  title="Delete facility"
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors bg-white border border-gray-100 rounded-md shadow-sm"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <h2 className="text-2xl font-extrabold text-gray-900 mb-1 pr-12">
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
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openCameraTest(cam)}
                            title="Test camera connection"
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <Wifi size={13} />
                            Test
                          </button>
                          <button
                            onClick={() => deleteCamera(cam.id)}
                            title="Delete camera"
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
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
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setUploadFile(null)
                        setUploadResult(null)
                        setUploadError(null)
                        setShowUploadModal(true)
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg transition-all"
                    >
                      <FileSpreadsheet size={14} />
                      Upload Excel
                    </button>
                    <button
                      onClick={() => setShowStudentModal(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all"
                    >
                      <Plus size={14} />
                      Enroll Student
                    </button>
                  </div>
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
                            <td className="px-4 py-3 flex gap-2 justify-end">
                              <button
                                onClick={() => {
                                  setStudentToEdit(s)
                                  setEditStudentName(s.name)
                                  setEditStudentIdCode(s.student_id)
                                  setEditStudentSeat(s.seat_number === '-' ? '' : s.seat_number)
                                  setShowEditStudentModal(true)
                                }}
                                title="Edit student"
                                className="text-gray-400 hover:text-blue-500 transition-colors p-1"
                              >
                                <Edit2 size={16} />
                              </button>
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
          onClose={() => {
            setShowCameraModal(false)
            setNewCamName("")
            setNewCamUrl("")
            setNewCamTestStatus("idle")
            setNewCamTestMsg("")
          }}
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
              onChange={(e) => {
                setNewCamUrl(e.target.value)
                setNewCamTestStatus("idle")
                setNewCamTestMsg("")
              }}
              placeholder="rtsp://... or webcam index (0)"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Test Connection row */}
          {newCamUrl.trim() && (
            <div>
              <button
                type="button"
                disabled={newCamTestLoading}
                onClick={async () => {
                  // Save a temporary camera record, test it, then remove it
                  // OR just call the snapshot on an existing matching camera.
                  // Simplest: show the user we'll verify on save.
                  setNewCamTestLoading(true)
                  setNewCamTestStatus("idle")
                  try {
                    // Temporarily create the camera to test via the snapshot endpoint
                    if (!selectedHall) throw new Error("No hall selected")
                    const tmp = await cameraApi.create(selectedHall.id, {
                      name: `__test_${Date.now()}`,
                      stream_url: newCamUrl,
                    })
                    try {
                      await cameraApi.getSnapshot(tmp.id)
                      setNewCamTestStatus("ok")
                      setNewCamTestMsg("Camera reachable ✓")
                    } finally {
                      await cameraApi.delete(tmp.id)
                    }
                  } catch (err: any) {
                    setNewCamTestStatus("error")
                    setNewCamTestMsg(
                      err?.response?.data?.error || "Cannot connect to camera."
                    )
                  } finally {
                    setNewCamTestLoading(false)
                  }
                }}
                className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-colors ${
                  newCamTestLoading
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-50 border border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-600"
                }`}
              >
                {newCamTestLoading
                  ? <Loader2 size={14} className="animate-spin" />
                  : <Wifi size={14} />}
                Test Connection
              </button>
              {newCamTestStatus !== "idle" && (
                <p className={`text-xs mt-1.5 flex items-center gap-1.5 ${
                  newCamTestStatus === "ok" ? "text-green-600" : "text-red-600"
                }`}>
                  {newCamTestStatus === "ok"
                    ? <Wifi size={12} />
                    : <WifiOff size={12} />}
                  {newCamTestMsg}
                </p>
              )}
            </div>
          )}
        </Modal>
      )}

      {/* Enroll Student Modal */}
      {showStudentModal && (
        <Modal
          title="Enroll Student"
          onClose={() => {
            setShowStudentModal(false)
            setNewStudentName("")
            setNewStudentIdCode("")
            setNewStudentSeat("")
          }}
            onSubmit={async () => {
  if (!newStudentIdCode.trim() || !selectedHall) return
  setStudentSaving(true)
  try {
   const created = await hallEnrollmentApi.create(selectedHall.id, {
  student_name: newStudentName,
  student_code: newStudentIdCode,
  seat_number: newStudentSeat.trim() || undefined,
})
              setStudents(prev => [...prev, {
  id: created.id,
  name: created.student_name || newStudentName,
  student_id: created.student_code || newStudentIdCode,
  seat_number: created.seat_number || newStudentSeat.trim() || '-',
  enrolled_at: created.enrolled_at || new Date().toISOString(),
}])
              setNewStudentName("")
              setNewStudentIdCode("")
              setNewStudentSeat("")
              setShowStudentModal(false)
            } catch {
              alert("Failed to enroll student.")
            } finally {
              setStudentSaving(false)
            }
          }}
          saving={studentSaving}
          disabled={!newStudentName.trim() || !newStudentIdCode.trim()}
          submitLabel="Enroll Student"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Student Name</label>
            <input
              type="text"
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Student ID Code</label>
            <input
              type="text"
              value={newStudentIdCode}
              onChange={(e) => setNewStudentIdCode(e.target.value)}
              placeholder="STU-2024-001"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          {/* ── NEW: Assigned Seat field ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Assigned Seat</label>
            <input
              type="text"
              value={newStudentSeat}
              onChange={(e) => setNewStudentSeat(e.target.value)}
              placeholder="e.g. A1"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </Modal>
      )}

      {/* Edit Student Modal */}
      {showEditStudentModal && (
        <Modal
          title="Edit Student"
          onClose={() => {
            setShowEditStudentModal(false)
            setStudentToEdit(null)
          }}
          onSubmit={async () => {
            if (!studentToEdit || !editStudentIdCode.trim()) return
            setEditStudentSaving(true)
            try {
              const updated = await hallEnrollmentApi.update(studentToEdit.id, {
                student_name: editStudentName,
                student_code: editStudentIdCode,
                seat_number: editStudentSeat.trim() || undefined,
              })
              setStudents(prev => prev.map(s => s.id === studentToEdit.id ? {
                ...s,
                name: updated.student_name || editStudentName,
                student_id: updated.student_code || editStudentIdCode,
                seat_number: updated.seat_number || editStudentSeat.trim() || '-',
              } : s))
              setShowEditStudentModal(false)
            } catch {
              alert("Failed to update student.")
            } finally {
              setEditStudentSaving(false)
            }
          }}
          saving={editStudentSaving}
          disabled={!editStudentName.trim() || !editStudentIdCode.trim()}
          submitLabel="Save Changes"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Student Name</label>
            <input
              type="text"
              value={editStudentName}
              onChange={(e) => setEditStudentName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Student ID Code</label>
            <input
              type="text"
              value={editStudentIdCode}
              onChange={(e) => setEditStudentIdCode(e.target.value)}
              placeholder="STU-2024-001"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Assigned Seat</label>
            <input
              type="text"
              value={editStudentSeat}
              onChange={(e) => setEditStudentSeat(e.target.value)}
              placeholder="e.g. A1"
              className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </Modal>
      )}

      {/* Delete Hall Confirmation Modal */}
      {hallToDelete !== null && (
        <Modal
          title="Delete Facility"
          onClose={() => setHallToDelete(null)}
          onSubmit={confirmDeleteHall}
          saving={hallDeleting}
          disabled={false}
          submitLabel="Delete"
        >
          <p className="text-gray-600 text-sm">
            Are you sure you want to delete this facility? This action cannot be undone.
          </p>
        </Modal>
      )}

      {/* Delete Student Confirmation Modal */}
      {studentToDelete !== null && (
        <Modal
          title="Remove Student"
          onClose={() => setStudentToDelete(null)}
          onSubmit={confirmDeleteStudent}
          saving={studentDeleting}
          disabled={false}
          submitLabel="Remove"
        >
          <p className="text-gray-600 text-sm">
            Are you sure you want to remove this student from the hall? This action cannot be undone.
          </p>
        </Modal>
      )}

      {/* ── Upload Excel Modal ──────────────────────────────────── */}
      {showUploadModal && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200,
          }}
        >
          <div style={{
            background: "#fff", borderRadius: 16, padding: 32,
            width: "100%", maxWidth: 500, margin: "0 16px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ background: "#ecfdf5", borderRadius: 10, padding: 8 }}>
                  <FileSpreadsheet size={20} color="#059669" />
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: "#111827", margin: 0 }}>
                    Bulk Enroll via Excel
                  </h3>
                  <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
                    Upload a .xlsx / .xls file to enroll multiple students at once
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Template hint */}
            <div style={{
              background: "#eff6ff", border: "1px solid #bfdbfe",
              borderRadius: 10, padding: "10px 14px", marginBottom: 18,
              fontSize: 12, color: "#1d4ed8", lineHeight: 1.6,
            }}>
              <strong>Required columns (row 1):</strong>&nbsp;
              <code style={{ background: "#dbeafe", borderRadius: 4, padding: "1px 5px" }}>Student Name</code>&nbsp;
              <code style={{ background: "#dbeafe", borderRadius: 4, padding: "1px 5px" }}>ID</code>&nbsp;
              <code style={{ background: "#dbeafe", borderRadius: 4, padding: "1px 5px" }}>Seat Number</code>
              &nbsp;(Seat Number is optional)
            </div>

            {/* Drop zone */}
            {!uploadResult && (
              <div
                onDragOver={(e) => { e.preventDefault(); setUploadDragging(true) }}
                onDragLeave={() => setUploadDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setUploadDragging(false)
                  const f = e.dataTransfer.files[0]
                  if (f) { setUploadFile(f); setUploadError(null) }
                }}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${uploadDragging ? "#059669" : uploadFile ? "#059669" : "#d1d5db"}`,
                  borderRadius: 12,
                  padding: "28px 20px",
                  textAlign: "center",
                  cursor: "pointer",
                  background: uploadDragging ? "#ecfdf5" : uploadFile ? "#f0fdf4" : "#f9fafb",
                  transition: "all .2s",
                  marginBottom: 16,
                }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) { setUploadFile(f); setUploadError(null) }
                  }}
                />
                {uploadFile ? (
                  <>
                    <FileSpreadsheet size={32} color="#059669" style={{ margin: "0 auto 8px" }} />
                    <p style={{ fontWeight: 600, color: "#065f46", fontSize: 14, margin: "0 0 4px" }}>
                      {uploadFile.name}
                    </p>
                    <p style={{ fontSize: 12, color: "#6b7280", margin: 0 }}>
                      {(uploadFile.size / 1024).toFixed(1)} KB — click to change
                    </p>
                  </>
                ) : (
                  <>
                    <Upload size={32} color="#9ca3af" style={{ margin: "0 auto 8px" }} />
                    <p style={{ fontWeight: 600, color: "#374151", fontSize: 14, margin: "0 0 4px" }}>
                      Drag &amp; drop your Excel file here
                    </p>
                    <p style={{ fontSize: 12, color: "#9ca3af", margin: 0 }}>
                      or click to browse — .xlsx / .xls only
                    </p>
                  </>
                )}
              </div>
            )}

            {/* Error banner */}
            {uploadError && (
              <div style={{
                display: "flex", alignItems: "flex-start", gap: 8,
                background: "#fef2f2", border: "1px solid #fecaca",
                borderRadius: 10, padding: "10px 14px", marginBottom: 16,
                fontSize: 13, color: "#b91c1c",
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Success result */}
            {uploadResult && (
              <div style={{ marginBottom: 16 }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "#f0fdf4", border: "1px solid #bbf7d0",
                  borderRadius: 10, padding: "12px 16px", marginBottom: 12,
                }}>
                  <CheckCircle2 size={18} color="#16a34a" />
                  <span style={{ fontSize: 14, fontWeight: 600, color: "#15803d" }}>
                    {uploadResult.message}
                  </span>
                </div>

                <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                  <div style={{
                    flex: 1, textAlign: "center", background: "#ecfdf5",
                    borderRadius: 10, padding: "10px 0",
                  }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#15803d" }}>{uploadResult.created}</div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>Enrolled</div>
                  </div>
                  <div style={{
                    flex: 1, textAlign: "center", background: "#fefce8",
                    borderRadius: 10, padding: "10px 0",
                  }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: "#ca8a04" }}>{uploadResult.skipped}</div>
                    <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>Skipped (duplicate)</div>
                  </div>
                </div>

                {uploadResult.errors.length > 0 && (
                  <div style={{ background: "#fef2f2", borderRadius: 10, padding: "10px 14px" }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#b91c1c", marginBottom: 6 }}>
                      Row errors ({uploadResult.errors.length}):
                    </p>
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      {uploadResult.errors.map((e) => (
                        <li key={e.row} style={{ fontSize: 12, color: "#991b1b", marginBottom: 3 }}>
                          Row {e.row}: {e.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                onClick={() => setShowUploadModal(false)}
                style={{
                  flex: 1, padding: "10px", border: "1px solid #e5e7eb",
                  borderRadius: 8, background: "#fff", color: "#374151",
                  fontSize: 14, fontWeight: 500, cursor: "pointer",
                }}
              >
                {uploadResult ? "Close" : "Cancel"}
              </button>

              {!uploadResult && (
                <button
                  disabled={!uploadFile || uploadSaving}
                  onClick={async () => {
                    if (!uploadFile || !selectedHall) return
                    setUploadSaving(true)
                    setUploadError(null)
                    try {
                      const result = await hallEnrollmentApi.bulkUpload(selectedHall.id, uploadFile)
                      setUploadResult(result)
                      // Refresh students list
                      const data = await hallEnrollmentApi.getByHall(selectedHall.id)
                      setStudents(data.map(e => ({
                        id: e.id,
                        name: e.student_name || "Unknown",
                        student_id: e.student_code || "-",
                        seat_number: e.seat_number || "-",
                      })))
                    } catch (err: any) {
                      const msg =
                        err?.response?.data?.error ||
                        err?.response?.data?.detail ||
                        "Upload failed. Please check the file and try again."
                      setUploadError(msg)
                    } finally {
                      setUploadSaving(false)
                    }
                  }}
                  style={{
                    flex: 1, padding: "10px", border: "none", borderRadius: 8,
                    background: !uploadFile || uploadSaving ? "#d1d5db" : "#059669",
                    color: "#fff", fontSize: 14, fontWeight: 600,
                    cursor: !uploadFile || uploadSaving ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}
                >
                  {uploadSaving && <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />}
                  {uploadSaving ? "Uploading…" : "Upload & Enroll"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Camera Test Modal */}
      {testingCameraId !== null && (() => {
        const cam = cameras.find(c => c.id === testingCameraId)
        if (!cam) return null
        return (
          <CameraTestModal
            camera={cam}
            snapshot={testSnapshot}
            loading={testSnapshotLoading}
            error={testSnapshotError}
            onClose={() => {
              setTestingCameraId(null)
              setTestSnapshot(null)
              setTestSnapshotError(null)
            }}
            onRefresh={refreshCameraTest}
          />
        )
      })()}

    </div>
  )
}

// ── Camera Test Modal (live snapshot preview) ─────────────────────────────────
function CameraTestModal({
  camera,
  snapshot,
  loading,
  error,
  onClose,
  onRefresh,
}: {
  camera: Camera
  snapshot: string | null
  loading: boolean
  error: string | null
  onClose: () => void
  onRefresh: () => void
}) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300,
      }}
    >
      <div style={{
        background: "#fff", borderRadius: 16, padding: 24,
        width: "100%", maxWidth: 560, margin: "0 16px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: "#111827", margin: 0 }}>
              Camera Test — {camera.name}
            </h3>
            <p style={{ fontSize: 12, color: "#9ca3af", margin: "2px 0 0" }}>
              {camera.stream_url || "No stream URL"}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onRefresh}
              disabled={loading}
              style={{
                background: "#eff6ff", border: "none", borderRadius: 8, padding: "7px 12px",
                cursor: loading ? "not-allowed" : "pointer", color: "#3b82f6",
                display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600,
              }}
            >
              <RefreshCw size={14} />
              Refresh
            </button>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af" }}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Snapshot area */}
        <div style={{
          background: "#0f172a", borderRadius: 12, overflow: "hidden",
          aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 16, position: "relative",
        }}>
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
              <Loader2 size={32} style={{ color: "#60a5fa" }} className="animate-spin" />
              <span style={{ color: "#94a3b8", fontSize: 13 }}>Connecting to camera…</span>
            </div>
          )}
          {!loading && error && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, padding: 24, textAlign: "center" }}>
              <WifiOff size={40} style={{ color: "#f87171" }} />
              <p style={{ color: "#fca5a5", fontSize: 13, margin: 0 }}>{error}</p>
            </div>
          )}
          {!loading && snapshot && (
            <img src={snapshot} alt="Camera snapshot" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          )}
        </div>

        {/* Status */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {loading ? (
            <span style={{ fontSize: 13, color: "#9ca3af" }}>Testing connection…</span>
          ) : error ? (
            <><WifiOff size={15} style={{ color: "#ef4444" }} /><span style={{ fontSize: 13, color: "#ef4444", fontWeight: 600 }}>Camera Offline</span></>
          ) : snapshot ? (
            <><Wifi size={15} style={{ color: "#22c55e" }} /><span style={{ fontSize: 13, color: "#16a34a", fontWeight: 600 }}>Camera Online — Snapshot captured</span></>
          ) : null}
        </div>
      </div>
    </div>
  )
}