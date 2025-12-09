"use client"

import type React from "react"
 
import Header from "../components/Header"
import { useState, useRef, useEffect } from "react"
import { Shield, ChevronDown, Edit2, Trash2, Play, Plus, Lightbulb, X, Check } from "lucide-react"
import { Link } from "react-router-dom"

// Types
interface Zone {
  id: string
  studentId: string
  studentName: string
  rect: { x: number; y: number; width: number; height: number }
  zoneNumber: number
}

interface Hall {
  id: string
  name: string
  building: string
  numberOfStudents: number
  cameras: number
}

export default function ROIConfigurationPage() {
  // State
  const [activeCamera, setActiveCamera] = useState("Camera 1")
  const [selectedHall, setSelectedHall] = useState<Hall>({
    id: "1",
    name: "Hall A",
    building: "building 1",
    numberOfStudents: 30,
    cameras: 3,
  })
  const [halls, setHalls] = useState<Hall[]>([
    { id: "1", name: "Hall A", building: "building 1", numberOfStudents: 30, cameras: 3 },
    { id: "2", name: "Hall B", building: "building 1", numberOfStudents: 25, cameras: 2 },
    { id: "3", name: "Hall C", building: "building 2", numberOfStudents: 40, cameras: 4 },
  ])
  const [zones, setZones] = useState<Zone[]>([
    {
      id: "1",
      studentId: "18",
      studentName: "Salma",
      rect: { x: 180, y: 280, width: 100, height: 100 },
      zoneNumber: 1,
    },
    { id: "2", studentId: "22", studentName: "Kiro", rect: { x: 380, y: 280, width: 100, height: 100 }, zoneNumber: 2 },
  ])
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null)
  const [studentId, setStudentId] = useState("")
  const [studentName, setStudentName] = useState("")
  const [showHallDropdown, setShowHallDropdown] = useState(false)
  const [showAddHallModal, setShowAddHallModal] = useState(false)
  const [newHallName, setNewHallName] = useState("")
  const [newHallBuilding, setNewHallBuilding] = useState("")
  const [newHallStudents, setNewHallStudents] = useState("")
  const [newHallCameras, setNewHallCameras] = useState("")

  const [editingZoneId, setEditingZoneId] = useState<string | null>(null)
  const [editStudentId, setEditStudentId] = useState("")
  const [editStudentName, setEditStudentName] = useState("")

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)

  const cameras = ["Camera 1", "Camera 2", "Camera 3"]

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

    // Draw image (cropped to show just the classroom)
    const sourceX = 35
    const sourceY = 195
    const sourceWidth = 570
    const sourceHeight = 385
    ctx.drawImage(img, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height)

    // Scale factor for zones
    const scaleX = canvas.width / sourceWidth
    const scaleY = canvas.height / sourceHeight

    // Draw existing zones
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

      // Draw zone number
      ctx.fillStyle = "#22c55e"
      ctx.font = "bold 20px sans-serif"
      ctx.fillText(String(index + 1), scaledRect.x + scaledRect.width / 2 - 5, scaledRect.y + scaledRect.height / 2 + 7)
    })

    // Draw current drawing rectangle
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
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsDrawing(true)
    setStartPos({ x, y })
    setCurrentRect({ x, y, width: 0, height: 0 })
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

  const addZone = () => {
    if (!studentId.trim() || !currentRect) return

    const newZone: Zone = {
      id: Date.now().toString(),
      studentId: studentId,
      studentName: studentName,
      rect: currentRect,
      zoneNumber: zones.length + 1,
    }

    setZones([...zones, newZone])
    setStudentId("")
    setStudentName("")
    setCurrentRect(null)
    setStartPos(null)
  }

  const deleteZone = (id: string) => {
    setZones(zones.filter((zone) => zone.id !== id))
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
        zone.id === editingZoneId ? { ...zone, studentId: editStudentId, studentName: editStudentName } : zone,
      ),
    )
    cancelEditZone()
  }

  const addNewHall = () => {
    if (!newHallName.trim() || !newHallBuilding.trim() || !newHallStudents || !newHallCameras) return

    const newHall: Hall = {
      id: Date.now().toString(),
      name: newHallName,
      building: newHallBuilding,
      numberOfStudents: Number.parseInt(newHallStudents),
      cameras: Number.parseInt(newHallCameras),
    }

    setHalls([...halls, newHall])
    setNewHallName("")
    setNewHallBuilding("")
    setNewHallStudents("")
    setNewHallCameras("")
    setShowAddHallModal(false)
  }

  return (
    <div className="min-h-screen bg-background pt-20">
      {/* Header */}
      <Header showAccount={true} isRegistered={true} userType="instructor" />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Title */}
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
                  {/* Add New Hall Button */}
                  <button
                    onClick={() => setShowAddHallModal(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-[#3b82f6] text-white rounded-lg hover:bg-[#2563eb] transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Hall
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  {cameras.map((camera) => (
                    <button
                      key={camera}
                      onClick={() => setActiveCamera(camera)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        activeCamera === camera
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {camera}
                    </button>
                  ))}
                  {/* Hall Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setShowHallDropdown(!showHallDropdown)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium"
                    >
                      {selectedHall.name} - {selectedHall.building}
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {showHallDropdown && (
                      <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 z-10 min-w-[200px]">
                        {halls.map((hall) => (
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
                        ))}
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
            </div>
          </div>

          {/* Right Column - Add Zone Form & Instructions */}
          <div className="space-y-6">
            {/* Add New Zone Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-gray-900 mb-4">Add New Zone</h3>
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
                  disabled={!studentId.trim() || !currentRect}
                  className="w-full py-3 bg-[#3b82f6] text-white font-semibold rounded-lg hover:bg-[#2563eb] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
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
            <Link to="/MonitoringOffline">
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
                  placeholder="e.g., building 3"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Students *</label>
                <input
                  type="number"
                  value={newHallStudents}
                  onChange={(e) => setNewHallStudents(e.target.value)}
                  placeholder="e.g., 30"
                  min="1"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#3b82f6]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Number of Cameras *</label>
                <input
                  type="number"
                  value={newHallCameras}
                  onChange={(e) => setNewHallCameras(e.target.value)}
                  placeholder="e.g., 3"
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
                  disabled={!newHallName.trim() || !newHallBuilding.trim() || !newHallStudents || !newHallCameras}
                  className="flex-1 py-3 bg-[#3b82f6] text-white font-semibold rounded-lg hover:bg-[#2563eb] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
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
