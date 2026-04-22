"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import {
  LayoutDashboard,
  Crosshair,
  Building2,
  Shield,
  Edit2,
  Trash2,
  X,
  Check,
  Loader2,
  Video,
  ChevronDown,
  Save,
  Plus,
  Users,
} from "lucide-react"
import { Link, useSearchParams, useLocation } from "react-router-dom"
import {
  examHallApi,
  cameraApi,
  studentZoneApi,
  hallEnrollmentApi,
  offlineExamApi,
  type ExamHall,
  type Camera,
  type HallEnrollment,
} from "../services/api"

interface Zone {
  id: string
  studentId: string
  studentName: string
  rect: { x: number; y: number; width: number; height: number }
  zoneNumber: number
  backendId?: number
}

// ==================== ROIConfigurationPage (Zone Config) ====================
export default function ROIConfigurationPage() {
  const [searchParams] = useSearchParams()
  const examIdParam = searchParams.get("examId")

  const [halls, setHalls] = useState<ExamHall[]>([])
  const [selectedHall, setSelectedHall] = useState<ExamHall | null>(null)
  const [hallsLoading, setHallsLoading] = useState(true)
  const [hallsError, setHallsError] = useState("")

  const [cameras, setCameras] = useState<Camera[]>([])
  const [camerasLoading, setCamerasLoading] = useState(false)
  const [activeCamera, setActiveCamera] = useState("")

  const [zones, setZones] = useState<Zone[]>([])
  const [zonesLoading, setZonesLoading] = useState(false)
  const [zoneSaving, setZoneSaving] = useState(false)
  const [zoneError, setZoneError] = useState("")

  const [isDrawing, setIsDrawing] = useState(false)
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null)
  const [studentId, setStudentId] = useState("")
  const [studentName, setStudentName] = useState("")
  const [showHallDropdown, setShowHallDropdown] = useState(false)
  const [showAddHallModal, setShowAddHallModal] = useState(false)
  const [newHallName, setNewHallName] = useState("")
  const [newHallBuilding, setNewHallBuilding] = useState("")
  const [newHallCapacity, setNewHallCapacity] = useState("")
  const [hallSaving, setHallSaving] = useState(false)

  const [editingZoneId, setEditingZoneId] = useState<string | null>(null)
  const [editStudentId, setEditStudentId] = useState("")
  const [editStudentName, setEditStudentName] = useState("")

  const [hallStudents, setHallStudents] = useState<HallEnrollment[]>([])
  const [studentQuery, setStudentQuery] = useState("")
  const [showStudentDropdown, setShowStudentDropdown] = useState(false)
  const studentInputRef = useRef<HTMLDivElement>(null)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    const load = async () => {
      setHallsLoading(true)
      setHallsError("")
      try {
        const data = await examHallApi.getAll()
        setHalls(data)
        
        if (examIdParam) {
          try {
            const exam = await offlineExamApi.getById(Number(examIdParam))
            const examHall = data.find(h => h.id === exam.hall)
            if (examHall) {
              setSelectedHall(examHall)
            } else if (data.length > 0) {
              setSelectedHall(data[0])
            }
          } catch {
            if (data.length > 0) setSelectedHall(data[0])
          }
        } else if (data.length > 0) {
          setSelectedHall(data[0])
        }
      } catch {
        setHallsError("Failed to load exam halls.")
      } finally {
        setHallsLoading(false)
      }
    }
    load()
  }, [examIdParam])

  useEffect(() => {
    if (!selectedHall) return
    const load = async () => {
      setCamerasLoading(true)
      try {
        const data = await cameraApi.getByHall(selectedHall.id)
        setCameras(data)
        if (data.length > 0) setActiveCamera(data[0].name)
        else setActiveCamera("")
      } catch {
        setCameras([])
      } finally {
        setCamerasLoading(false)
      }
    }
    const loadStudents = async () => {
      try {
        const data = await hallEnrollmentApi.getByHall(selectedHall.id)
        setHallStudents(data)
      } catch {
        setHallStudents([])
      }
    }
    load()
    loadStudents()
  }, [selectedHall?.id])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (studentInputRef.current && !studentInputRef.current.contains(e.target as Node)) {
        setShowStudentDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const filteredStudents = hallStudents.filter((s) => {
    const q = studentQuery.toLowerCase()
    if (!q) return true
    return (
     (s.student_name || "").toLowerCase().includes(q) ||
      (s.student_code || "").toLowerCase().includes(q)
    )
  })

  useEffect(() => {
    if (!examIdParam) return
    const load = async () => {
      setZonesLoading(true)
      try {
        const data = await studentZoneApi.getByExam(Number(examIdParam))
        setZones(
          data.map((z, i) => ({
            id: String(z.id),
            studentId: z.student_code || String(z.id),
            studentName: z.student_name,
            rect: { x: z.x1, y: z.y1, width: z.x2 - z.x1, height: z.y2 - z.y1 },
            zoneNumber: i + 1,
            backendId: z.id,
          }))
        )
      } catch {
        setZones([])
      } finally {
        setZonesLoading(false)
      }
    }
    load()
  }, [examIdParam])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = "/images/roi.jpg"
    img.onload = () => {
      imageRef.current = img
      canvas.width = container.offsetWidth
      canvas.height = (container.offsetWidth / img.width) * img.height
      drawCanvas(ctx, canvas, img)
    }
  }, [zones, currentRect])

  const drawCanvas = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    img: HTMLImageElement
  ) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    const sourceX = 35
    const sourceY = 195
    const sourceWidth = 570
    const sourceHeight = 385
    ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height)
    const scaleX = canvas.width / sourceWidth
    const scaleY = canvas.height / sourceHeight

    zones.forEach((zone, index) => {
      const scaledRect = {
        x: (zone.rect.x - sourceX) * scaleX,
        y: (zone.rect.y - sourceY) * scaleY,
        width: zone.rect.width * scaleX,
        height: zone.rect.height * scaleY,
      }
      ctx.strokeStyle = "#22c55e"
      ctx.lineWidth = 3
      ctx.strokeRect(scaledRect.x, scaledRect.y, scaledRect.width, scaledRect.height)
      ctx.fillStyle = "rgba(34,197,94,0.12)"
      ctx.fillRect(scaledRect.x, scaledRect.y, scaledRect.width, scaledRect.height)

      const label = zone.studentId || String(index + 1)
      ctx.fillStyle = "#22c55e"
      ctx.fillRect(scaledRect.x, scaledRect.y, label.length * 8 + 12, 22)
      ctx.fillStyle = "#fff"
      ctx.font = "bold 12px sans-serif"
      ctx.fillText(label, scaledRect.x + 6, scaledRect.y + 15)
    })

    if (currentRect) {
      ctx.strokeStyle = "#3b82f6"
      ctx.lineWidth = 2
      ctx.setLineDash([6, 4])
      ctx.strokeRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height)
      ctx.fillStyle = "rgba(59,130,246,0.08)"
      ctx.fillRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height)
      ctx.setLineDash([])
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    setIsDrawing(true)
    setStartPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    setCurrentRect({ x: e.clientX - rect.left, y: e.clientY - rect.top, width: 0, height: 0 })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPos) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    setCurrentRect({
      x: Math.min(startPos.x, x),
      y: Math.min(startPos.y, y),
      width: Math.abs(x - startPos.x),
      height: Math.abs(y - startPos.y),
    })
  }

  const handleMouseUp = () => setIsDrawing(false)

  const addZone = async () => {
    if (!studentId.trim() || !currentRect) return

    // Convert canvas display coords → source image coords so the zone is
    // saved (and later re-drawn) in the correct position.
    const sourceX = 35
    const sourceY = 195
    const sourceWidth = 570
    const sourceHeight = 385
    const canvas = canvasRef.current
    const scaleX = canvas ? canvas.width / sourceWidth : 1
    const scaleY = canvas ? canvas.height / sourceHeight : 1

    const imgX = currentRect.x / scaleX + sourceX
    const imgY = currentRect.y / scaleY + sourceY
    const imgW = currentRect.width / scaleX
    const imgH = currentRect.height / scaleY

    // Store zone rect in source-image space so drawCanvas can re-scale it correctly
    const imageSpaceRect = { x: imgX, y: imgY, width: imgW, height: imgH }

    const newZone: Zone = {
      id: Date.now().toString(),
      studentId,
      studentName,
      rect: imageSpaceRect,
      zoneNumber: zones.length + 1,
    }
    if (examIdParam) {
      setZoneSaving(true)
      setZoneError("")
      try {
        const selectedCam = cameras.find((c) => c.name === activeCamera)
        const created = await studentZoneApi.create(Number(examIdParam), {
          student_code: studentId,
          student_name: studentName,
          camera: selectedCam?.id,
          seat_number: `Seat ${zones.length + 1}`,
          x1: Math.round(imgX),
          y1: Math.round(imgY),
          x2: Math.round(imgX + imgW),
          y2: Math.round(imgY + imgH),
        })
        newZone.backendId = created.id
        newZone.id = String(created.id)
        newZone.studentName = created.student_name || studentName
      } catch {
        setZoneError("Failed to save zone to server.")
        setZoneSaving(false)
        return
      } finally {
        setZoneSaving(false)
      }
    }
    setZones([...zones, newZone])
    setStudentId("")
    setStudentName("")
    setStudentQuery("")
    setCurrentRect(null)
    setStartPos(null)
  }

  const deleteZone = async (id: string) => {
    const zone = zones.find((z) => z.id === id)
    if (zone?.backendId) {
      try { await studentZoneApi.delete(zone.backendId) } catch { }
    }
    setZones(zones.filter((z) => z.id !== id))
  }

  const startEditZone = (zone: Zone) => {
    setEditingZoneId(zone.id)
    setEditStudentId(zone.studentId)
    setEditStudentName(zone.studentName)
  }

  const cancelEditZone = () => {
    setEditingZoneId(null)
    setEditStudentId("")
    setEditStudentName("")
  }

  const saveEditZone = () => {
    if (!editStudentId.trim() || !editingZoneId) return
    setZones(
      zones.map((zone) =>
        zone.id === editingZoneId
          ? { ...zone, studentId: editStudentId, studentName: editStudentName }
          : zone
      )
    )
    cancelEditZone()
  }

  const addNewHall = async () => {
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
      setSelectedHall(created)
      setNewHallName("")
      setNewHallBuilding("")
      setNewHallCapacity("")
      setShowAddHallModal(false)
    } catch {
      alert("Failed to create hall.")
    } finally {
      setHallSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar with title + hall dropdown */}
      <div className="bg-white border-b border-gray-200 px-7 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Crosshair size={20} className="text-blue-600" />
          <h1 className="text-xl font-bold text-gray-900 m-0">Zone Mapping</h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAddHallModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-all"
          >
            <Save size={14} />
            Register Hall
          </button>

          <div className="relative">
            <button
              onClick={() => setShowHallDropdown(!showHallDropdown)}
              disabled={hallsLoading}
              className="flex items-center gap-2 px-3.5 py-2 border border-gray-200 rounded-lg bg-white text-sm font-medium text-gray-700 cursor-pointer min-w-[160px]"
            >
              {hallsLoading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : selectedHall ? (
                `${selectedHall.name}`
              ) : (
                "-- Select Hall --"
              )}
              <ChevronDown size={14} className="ml-auto" />
            </button>
            {showHallDropdown && (
              <div className="absolute right-0 top-full mt-1.5 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[200px] overflow-hidden">
                {hallsError ? (
                  <p className="px-3.5 py-2.5 text-red-500 text-sm">{hallsError}</p>
                ) : halls.length === 0 ? (
                  <p className="px-3.5 py-2.5 text-gray-400 text-sm">No halls found</p>
                ) : (
                  halls.map((hall) => (
                    <button
                      key={hall.id}
                      onClick={() => { setSelectedHall(hall); setShowHallDropdown(false) }}
                      className={`block w-full text-left px-3.5 py-2.5 text-sm transition-colors ${
                        selectedHall?.id === hall.id
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      {hall.name} — {hall.building}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Camera tab bar */}
      <div className="bg-white border-b border-gray-200 px-7 flex items-center gap-1">
        {camerasLoading ? (
          <div className="py-3 flex items-center gap-1.5">
            <Loader2 size={14} className="text-gray-400 animate-spin" />
            <span className="text-sm text-gray-400">Loading cameras...</span>
          </div>
        ) : cameras.length === 0 ? (
          <div className="py-3">
            <span className="text-sm text-gray-400">No cameras found for this hall</span>
          </div>
        ) : (
          cameras.map((camera) => (
            <button
              key={camera.id}
              onClick={() => setActiveCamera(camera.name)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-all ${
                activeCamera === camera.name
                  ? "text-blue-600 border-blue-600"
                  : "text-gray-500 border-transparent hover:text-gray-700"
              }`}
            >
              <Video size={14} />
              {camera.name}
            </button>
          ))
        )}
      </div>

      {/* Content: canvas + right panel */}
      <div className="flex-1 flex">
        {/* Canvas column */}
        <div className="flex-1 p-6 flex flex-col gap-3">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div
              ref={containerRef}
              className="relative cursor-crosshair bg-gray-100 min-h-[340px]"
            >
              <canvas
                ref={canvasRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="w-full block"
              />
              {cameras.length === 0 && !camerasLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2.5 min-h-[340px]">
                  <Crosshair size={32} className="text-gray-300" />
                  <p className="text-gray-400 text-sm m-0 text-center">
                    Select a camera to start drawing Regions of Interest (ROI).
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg px-4 py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Crosshair size={14} className="text-blue-600" />
              Click and drag to draw a new bounding box.
            </div>
            <span className="bg-blue-50 text-blue-600 px-3 py-0.5 rounded-full text-xs font-medium">
              {zones.length} active zones mapped
            </span>
          </div>
        </div>

        {/* Right panel */}
        <div className="w-[300px] bg-white border-l border-gray-200 flex flex-col">
          <div className="p-5">
            <div className="mb-4">
              <h2 className="text-base font-bold text-gray-900 m-0 mb-1">
                Add New Zone
              </h2>
              <p className="text-xs text-gray-400 m-0">Map drawn region to a student.</p>
            </div>

            {zoneError && (
              <p className="text-red-500 text-xs mb-2.5">{zoneError}</p>
            )}

            <div className="mb-3" ref={studentInputRef}>
              <label className="text-xs font-medium text-gray-700 block mb-1.5">
                Student ID *
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={studentQuery}
                  onChange={(e) => {
                    setStudentQuery(e.target.value)
                    setStudentId("")
                    setStudentName("")
                    setShowStudentDropdown(true)
                  }}
                  onFocus={() => setShowStudentDropdown(true)}
                  placeholder="Search by name or ID..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white outline-none focus:border-blue-500 transition-colors"
                />
                {showStudentDropdown && filteredStudents.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-[200px] overflow-y-auto">
                    {filteredStudents.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                       setStudentId(s.student_code || "")
                          setStudentName(s.seat_number || s.student_name || "")
                          setStudentQuery(`${s.student_name || "Unknown"} — ${s.student_code || ""}`)
                          setShowStudentDropdown(false)
                        }}
                        className="block w-full text-left px-3 py-2 text-sm transition-colors hover:bg-blue-50 hover:text-blue-700"
                      >
                        <div className="font-medium text-gray-900">{s.student_name || "Unknown"}</div>
                       <div className="text-xs text-gray-400">ID: {s.student_code}{s.seat_number ? ` · Seat: ${s.seat_number}` : ""}</div>
                      </button>
                    ))}
                  </div>
                )}
                {showStudentDropdown && studentQuery && filteredStudents.length === 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 px-3 py-3 text-sm text-gray-400 text-center">
                    No students found
                  </div>
                )}
              </div>
            </div>

            <div className="mb-3.5">
              <label className="text-xs font-medium text-gray-700 block mb-1.5">
                Zone Label
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. Desk 12"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <button
              onClick={addZone}
              disabled={!studentId.trim() || !currentRect || zoneSaving}
              className={`w-full py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-all ${
                !studentId.trim() || !currentRect || zoneSaving
                  ? "bg-gray-100 border border-gray-200 text-gray-400 cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {zoneSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save Mapped Zone
            </button>
          </div>

          <div className="h-px bg-gray-200" />

          <div className="flex-1 overflow-y-auto px-5 py-4">
            <h3 className="text-[11px] font-bold text-gray-400 tracking-wide uppercase m-0 mb-3">
              Active Zones
            </h3>

            {zonesLoading ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Loader2 size={14} className="animate-spin" />
                Loading zones...
              </div>
            ) : zones.length === 0 ? (
              <p className="text-sm text-gray-400 text-center mt-6">
                No zones configured for this camera.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {zones.map((zone) => (
                  <div
                    key={zone.id}
                    className="bg-gray-50 border border-gray-200 border-l-[3px] border-l-yellow-600 rounded-lg p-2.5"
                  >
                    {editingZoneId === zone.id ? (
                      <div>
                        <input
                          type="text"
                          value={editStudentId}
                          onChange={(e) => setEditStudentId(e.target.value)}
                          placeholder="Student ID"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white outline-none focus:border-blue-500 transition-colors mb-1.5"
                        />
                        <input
                          type="text"
                          value={editStudentName}
                          onChange={(e) => setEditStudentName(e.target.value)}
                          placeholder="Student Name"
                          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white outline-none focus:border-blue-500 transition-colors mb-2"
                        />
                        <div className="flex gap-1.5">
                          <button
                            onClick={saveEditZone}
                            className="flex-1 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-md flex items-center justify-center transition-all"
                          >
                            <Check size={14} />
                          </button>
                          <button
                            onClick={cancelEditZone}
                            className="flex-1 py-1.5 bg-gray-500 hover:bg-gray-600 text-white rounded-md flex items-center justify-center transition-all"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">
                            {zone.studentId}
                          </div>
                          <div className="text-[11px] text-gray-400">
                            Zone {zone.zoneNumber} · {zone.studentName || "Unknown"}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => startEditZone(zone)}
                            title="Edit"
                            className="p-1.5 bg-blue-50 hover:bg-blue-100 rounded-md text-blue-600 transition-all"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => deleteZone(zone.id)}
                            title="Delete"
                            className="p-1.5 bg-red-50 hover:bg-red-100 rounded-md text-red-500 transition-all"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200">
            <Link to={examIdParam ? `/MonitoringOffline?examId=${examIdParam}` : "/MonitoringOffline"}>
              <button className="w-full py-3 bg-green-500 hover:bg-green-600 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2 transition-all">
                <div className="w-5 h-5 rounded-full border-2 border-white/50 flex items-center justify-center">
                  <div className="w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[7px] border-l-white ml-0.5" />
                </div>
                Start Live Monitoring
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Add Hall Modal */}
      {showAddHallModal && (
        <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-7 w-full max-w-[420px] mx-4">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900 m-0">Add New Hall</h3>
              <button
                onClick={() => setShowAddHallModal(false)}
                className="bg-none border-none cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col gap-3.5">
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
                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-lg text-sm text-gray-900 bg-white outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              ))}
              <div className="flex gap-2.5 mt-1">
                <button
                  onClick={() => setShowAddHallModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-lg bg-white text-gray-700 text-sm font-medium cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addNewHall}
                  disabled={!newHallName.trim() || !newHallBuilding.trim() || !newHallCapacity || hallSaving}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    !newHallName.trim() || !newHallBuilding.trim() || !newHallCapacity || hallSaving
                      ? "bg-gray-300 text-white cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  {hallSaving && <Loader2 size={14} className="animate-spin" />}
                  Add Hall
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
