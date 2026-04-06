"use client"

import type React from "react"

import Header from "../components/Header"
import { useState, useRef, useEffect } from "react"
import { Shield, ChevronDown, Edit2, Trash2, Play, Plus, Lightbulb, X, Check, Loader2 } from "lucide-react"
import { Link, useSearchParams } from "react-router-dom"
import {
  examHallApi,
  cameraApi,
  studentZoneApi,
  type ExamHall,
  type Camera,
} from "../services/api"

interface Zone {
  id: string
  studentId: string
  studentName: string
  rect: { x: number; y: number; width: number; height: number }
  zoneNumber: number
  backendId?: number
}

export default function ROIConfigurationPage() {
  const [searchParams] = useSearchParams()
  const examIdParam = searchParams.get("examId")

  // --- Real data state ---
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

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  // Fetch halls on mount
  useEffect(() => {
    const load = async () => {
      setHallsLoading(true)
      setHallsError("")
      try {
        const data = await examHallApi.getAll()
        setHalls(data)
        if (data.length > 0) setSelectedHall(data[0])
      } catch {
        setHallsError("Failed to load exam halls.")
      } finally {
        setHallsLoading(false)
      }
    }
    load()
  }, [])

  // Fetch cameras when selected hall changes
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
    load()
  }, [selectedHall?.id])

  // Fetch zones when examId is provided
  useEffect(() => {
    if (!examIdParam) return
    const load = async () => {
      setZonesLoading(true)
      try {
        const data = await studentZoneApi.getByExam(Number(examIdParam))
        setZones(
          data.map((z, i) => ({
            id: String(z.id),
            studentId: String(z.student),
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

  // Draw zones on canvas
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

  const drawCanvas = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, img: HTMLImageElement) => {
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

      ctx.fillStyle = "#22c55e"
      ctx.font = "bold 20px sans-serif"
      ctx.fillText(String(index + 1), scaledRect.x + scaledRect.width / 2 - 5, scaledRect.y + scaledRect.height / 2 + 7)
    })

    if (currentRect) {
      ctx.strokeStyle = "#22c55e"
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.strokeRect(currentRect.x, currentRect.y, currentRect.width, currentRect.height)
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

  const handleMouseUp = () => {
    setIsDrawing(false)
  }

  const addZone = async () => {
    if (!studentId.trim() || !currentRect) return

    const newZone: Zone = {
      id: Date.now().toString(),
      studentId,
      studentName,
      rect: currentRect,
      zoneNumber: zones.length + 1,
    }

    if (examIdParam) {
      setZoneSaving(true)
      setZoneError("")
      try {
        const selectedCam = cameras.find(c => c.name === activeCamera)
        const created = await studentZoneApi.create(Number(examIdParam), {
          student: Number(studentId),
          camera: selectedCam?.id,
          seat_number: `Seat ${zones.length + 1}`,
          x1: Math.round(currentRect.x),
          y1: Math.round(currentRect.y),
          x2: Math.round(currentRect.x + currentRect.width),
          y2: Math.round(currentRect.y + currentRect.height),
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
    setCurrentRect(null)
    setStartPos(null)
  }

  const deleteZone = async (id: string) => {
    const zone = zones.find(z => z.id === id)
    if (zone?.backendId) {
      try {
        await studentZoneApi.delete(zone.backendId)
      } catch { /* proceed with local removal */ }
    }
    setZones(zones.filter(z => z.id !== id))
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
      zones.map(zone =>
        zone.id === editingZoneId ? { ...zone, studentId: editStudentId, studentName: editStudentName } : zone
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
      setHalls(prev => [...prev, created])
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
    <div className="min-h-screen bg-background pt-20">
      <Header showAccount={true} isRegistered={true} userType="instructor" />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">ROI Configuration</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Draw rectangles around each student&apos;s area and assign their ID. Our AI will automatically detect
            phones, suspicious movements, and other cheating behaviors.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Camera View & Active Zones */}
          <div className="lg:col-span-2 space-y-6">
            {/* Camera View Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              {/* Camera Controls */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAddHallModal(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-[#3b82f6] text-white rounded-lg hover:bg-[#2563eb] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Hall
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {camerasLoading ? (
                    <Loader2 className="animate-spin text-gray-400" size={20} />
                  ) : cameras.length === 0 ? (
                    <span className="text-gray-400 text-sm">No cameras</span>
                  ) : (
                    cameras.map(camera => (
                      <button
                        key={camera.id}
                        onClick={() => setActiveCamera(camera.name)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          activeCamera === camera.name
                            ? "bg-gray-900 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {camera.name}
                      </button>
                    ))
                  )}
                  {/* Hall Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowHallDropdown(!showHallDropdown)}
                      disabled={hallsLoading}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium"
                    >
                      {hallsLoading ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : selectedHall ? (
                        `${selectedHall.name} - ${selectedHall.building}`
                      ) : (
                        "Select Hall"
                      )}
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {showHallDropdown && (
                      <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-10 min-w-[200px]">
                        {hallsError ? (
                          <p className="px-4 py-2 text-red-500 text-sm">{hallsError}</p>
                        ) : halls.length === 0 ? (
                          <p className="px-4 py-2 text-gray-500 text-sm">No halls found</p>
                        ) : (
                          halls.map(hall => (
                            <button
                              key={hall.id}
                              onClick={() => {
                                setSelectedHall(hall)
                                setShowHallDropdown(false)
                              }}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
                            >
                              {hall.name} - {hall.building}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Camera View */}
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900 mb-3">Classroom Camera View</h3>
                <div ref={containerRef} className="relative rounded-lg overflow-hidden cursor-crosshair">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Active Zones Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Active Zones</h3>
              {zonesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="animate-spin text-blue-600" size={24} />
                  <span className="ml-2 text-gray-500">Loading zones...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {zones.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No zones added yet. Draw on the camera view to add zones.
                    </p>
                  ) : (
                    zones.map((zone, index) => (
                      <div
                        key={zone.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border-l-4 border-[#c9a227]"
                      >
                        {editingZoneId === zone.id ? (
                          <div className="flex items-center gap-3 flex-1">
                            <input
                              type="text"
                              value={editStudentId}
                              onChange={(e) => setEditStudentId(e.target.value)}
                              placeholder="Student ID"
                              className="w-24 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                            />
                            <input
                              type="text"
                              value={editStudentName}
                              onChange={(e) => setEditStudentName(e.target.value)}
                              placeholder="Student Name"
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                            />
                            <div className="flex items-center gap-1">
                              <button
                                title="check"
                                onClick={saveEditZone}
                                className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                title="cancel"
                                onClick={cancelEditZone}
                                className="p-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div>
                              <div className="font-semibold text-gray-900">{zone.studentId}</div>
                              <div className="text-sm text-gray-600">
                                Zone {index + 1} - {zone.studentName || "Unknown"}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                title="edit"
                                onClick={() => startEditZone(zone)}
                                className="p-2 bg-[#3b82f6] text-white rounded-lg hover:bg-[#2563eb]"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                title="delete"
                                onClick={() => deleteZone(zone.id)}
                                className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Add Zone Form & Instructions */}
          <div className="space-y-6">
            {/* Add New Zone Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Add New Zone</h3>
              {zoneError && <p className="text-red-500 text-sm mb-3">{zoneError}</p>}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student ID *</label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="Enter Student ID (e.g., STU-001)"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Student Name (Optional)</label>
                  <input
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="Student's full name"
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                  />
                </div>
                <button
                  onClick={addZone}
                  disabled={!studentId.trim() || !currentRect || zoneSaving}
                  className="w-full py-3 bg-[#3b82f6] text-white font-semibold rounded-lg hover:bg-[#2563eb] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {zoneSaving && <Loader2 className="animate-spin" size={18} />}
                  +Add Zone
                </button>
              </div>
            </div>

            {/* How It Works Card */}
            <div className="bg-[#f5efc7] rounded-xl p-6">
              <div className="flex items-center gap-2 text-[#a08b26] font-semibold mb-3">
                <Lightbulb className="w-5 h-5" />
                How It Works
              </div>
              <div className="space-y-2 text-sm text-[#6b5d1f]">
                <p>
                  <span className="font-semibold">Step 1:</span> Click and drag on the camera view to draw a rectangle
                  around each student
                </p>
                <p>
                  <span className="font-semibold">Step 2:</span> Enter the Student ID for that zone
                </p>
                <p>
                  <span className="font-semibold">Step 3:</span> Click &quot;Add Zone&quot; - Our AI handles everything
                  else automatically!
                </p>
                <p>
                  <span className="font-semibold">Step 4:</span> Click &quot;Start Monitoring&quot; when all students
                  are registered
                </p>
              </div>
            </div>

            {/* Start Monitoring Button */}
            <Link to={examIdParam ? `/MonitoringOffline?examId=${examIdParam}` : "/MonitoringOffline"}>
              <button className="w-full py-4 bg-[#3b82f6] text-white font-semibold rounded-xl hover:bg-[#2563eb] transition-colors flex items-center justify-center gap-2">
                <Play className="w-5 h-5" />
                Start Monitoring
              </button>
            </Link>
          </div>
        </div>
      </main>

      {/* Add New Hall Modal */}
      {showAddHallModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Add New Hall</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Hall Name *</label>
                <input
                  type="text"
                  value={newHallName}
                  onChange={(e) => setNewHallName(e.target.value)}
                  placeholder="e.g., Hall D"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Building *</label>
                <input
                  type="text"
                  value={newHallBuilding}
                  onChange={(e) => setNewHallBuilding(e.target.value)}
                  placeholder="e.g., Building 3"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
                <input
                  type="number"
                  value={newHallCapacity}
                  onChange={(e) => setNewHallCapacity(e.target.value)}
                  placeholder="e.g., 30"
                  min="1"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAddHallModal(false)}
                  className="flex-1 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addNewHall}
                  disabled={!newHallName.trim() || !newHallBuilding.trim() || !newHallCapacity || hallSaving}
                  className="flex-1 py-3 bg-[#3b82f6] text-white font-semibold rounded-lg hover:bg-[#2563eb] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {hallSaving && <Loader2 className="animate-spin" size={18} />}
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
