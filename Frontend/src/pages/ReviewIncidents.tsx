import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Search, AlertCircle } from "lucide-react";
import Header from '../components/Header';

interface Incident {
  id: number;
  student: string;
  exam: string;
  severity: "high" | "medium" | "low";
  description: string;
  time: string;
  date: string;
}

const ReviewIncidents: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");

  const handleBack = () => {
    navigate(-1);
  };

  const handleReviewFootage = (incidentId: number) => {
    // Navigate to footage review page
    console.log("Review footage for incident:", incidentId);
    alert(`Reviewing footage for incident ${incidentId}`);
  };

  // بيانات الـ Incidents
  const allIncidents: Incident[] = [
    // ... نفس البيانات السابقة
    {
      id: 1,
      student: "Student 1",
      exam: "Midterm",
      severity: "high",
      description: "Multiple faces detected",
      time: "10:23 AM",
      date: "2025-10-13"
    },
    {
      id: 2,
      student: "Student 7",
      exam: "Quiz2",
      severity: "high",
      description: "No face detected for 30s",
      time: "11:15 AM",
      date: "2025-10-13"
    },
    {
      id: 3,
      student: "Student 3",
      exam: "Midterm",
      severity: "medium",
      description: "Looking away frequently",
      time: "11:15 AM",
      date: "2025-10-13"
    },
    {
      id: 4,
      student: "Student 2",
      exam: "Midterm",
      severity: "medium",
      description: "Audio detected",
      time: "10:55 AM",
      date: "2025-10-12"
    },
    {
      id: 5,
      student: "Student 5",
      exam: "Quiz 3",
      severity: "low",
      description: "Tab switch detected",
      time: "11:02 AM",
      date: "2025-10-13"
    },
    {
      id: 6,
      student: "Student 8",
      exam: "Quiz 3",
      severity: "low",
      description: "Screen blur detected",
      time: "11:30 AM",
      date: "2025-10-12"
    }
  ];

  // Filter incidents based on severity
  const filteredIncidents = selectedSeverity === "all" 
    ? allIncidents 
    : allIncidents.filter(incident => incident.severity === selectedSeverity);

  // Filter by search query
  const searchedIncidents = filteredIncidents.filter(incident =>
    incident.student.toLowerCase().includes(searchQuery.toLowerCase()) ||
    incident.exam.toLowerCase().includes(searchQuery.toLowerCase()) ||
    incident.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get severity colors
  const getSeverityColors = (severity: string) => {
    switch(severity) {
      case "high":
        return {
          bg: "bg-red-50",
          border: "border-l-red-500",
          badge: "bg-red-600",
          button: "bg-red-600 hover:bg-red-700"
        };
      case "medium":
        return {
          bg: "bg-orange-50",
          border: "border-l-orange-500",
          badge: "bg-orange-600",
          button: "bg-orange-600 hover:bg-orange-700"
        };
      case "low":
        return {
          bg: "bg-yellow-50",
          border: "border-l-yellow-600",
          badge: "bg-yellow-700",
          button: "bg-yellow-700 hover:bg-yellow-800"
        };
      default:
        return {
          bg: "bg-gray-50",
          border: "border-l-gray-500",
          badge: "bg-gray-600",
          button: "bg-gray-600 hover:bg-gray-700"
        };
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#E8F1FA]">
      {/* Header */}
      <Header fixed={true} showAccount={true} isRegistered={true} userType="instructor" />

      <div className="pt-24 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-lg p-6 relative" // أضف relative هنا
          >
            {/* زر Back داخل البطاقة */}
            <button
              onClick={handleBack}
              className="absolute top-6 right-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors font-medium text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <h1 className="text-3xl font-bold text-gray-900">Review Incidents</h1>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search incidents..."
                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setSelectedSeverity("all")}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  selectedSeverity === "all"
                    ? "bg-gray-700 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setSelectedSeverity("high")}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  selectedSeverity === "high"
                    ? "bg-red-600 text-white"
                    : "bg-red-100 text-red-700 hover:bg-red-200"
                }`}
              >
                High
              </button>
              <button
                onClick={() => setSelectedSeverity("medium")}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  selectedSeverity === "medium"
                    ? "bg-orange-600 text-white"
                    : "bg-orange-100 text-orange-700 hover:bg-orange-200"
                }`}
              >
                Medium
              </button>
              <button
                onClick={() => setSelectedSeverity("low")}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                  selectedSeverity === "low"
                    ? "bg-yellow-700 text-white"
                    : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                }`}
              >
                Low
              </button>
            </div>

            {/* Incidents List */}
            <div className="space-y-4">
              {searchedIncidents.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="mx-auto text-gray-400 mb-3" size={48} />
                  <p className="text-gray-600">No incidents found</p>
                </div>
              ) : (
                searchedIncidents.map((incident, index) => {
                  const colors = getSeverityColors(incident.severity);
                  return (
                    <motion.div
                      key={incident.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className={`${colors.bg} ${colors.border} border-l-4 rounded-lg p-4 flex items-center justify-between`}
                    >
                      <div className="flex items-start gap-4 flex-1">
                        {/* Severity Badge */}
                        <span className={`${colors.badge} text-white text-xs font-bold px-3 py-1 rounded-full uppercase`}>
                          {incident.severity}
                        </span>

                        {/* Incident Details */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900 text-lg">
                              {incident.student}
                            </h3>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-600 text-sm">{incident.exam}</span>
                          </div>
                          <p className="text-gray-700 mb-1">{incident.description}</p>
                          <p className="text-gray-500 text-sm">
                            {incident.time} - {incident.date}
                          </p>
                        </div>
                      </div>

                      {/* Review Button */}
                      <button
                        onClick={() => handleReviewFootage(incident.id)}
                        className={`${colors.button} text-white px-5 py-2.5 rounded-lg font-semibold transition-colors whitespace-nowrap ml-4`}
                      >
                        Review Footage
                      </button>
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ReviewIncidents;