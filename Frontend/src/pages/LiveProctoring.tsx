import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Video, Clock, Users, AlertCircle, Play } from "lucide-react";
import Header from '../components/Header';

interface Student {
  id: number;
  name: string;
  status: "online" | "offline";
  hasAlert: boolean;
}

const LiveProctoring: React.FC = () => {
  const navigate = useNavigate();
  const [timer, setTimer] = useState({ hours: 0, minutes: 59, seconds: 45 });
  const [students, setStudents] = useState<Student[]>([
    { id: 1, name: "Student 1", status: "online", hasAlert: false },
    { id: 2, name: "Student 2", status: "online", hasAlert: false },
    { id: 3, name: "Student 3", status: "online", hasAlert: true },
    { id: 4, name: "Student 4", status: "online", hasAlert: false },
    { id: 5, name: "Student 5", status: "online", hasAlert: false },
    { id: 6, name: "Student 6", status: "online", hasAlert: false },
    { id: 7, name: "Student 7", status: "online", hasAlert: true },
    { id: 8, name: "Student 8", status: "online", hasAlert: false },
    { id: 9, name: "Student 9", status: "online", hasAlert: false },
    { id: 10, name: "Student 10", status: "online", hasAlert: false },
    { id: 11, name: "Student 11", status: "online", hasAlert: false },
    { id: 12, name: "Student 12", status: "online", hasAlert: false }
  ]);

  const activeStudents = students.filter(s => s.status === "online").length;
  const alertCount = students.filter(s => s.hasAlert).length;
  const alertedStudents = students.filter(s => s.hasAlert);

  // Timer countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { hours: prev.hours, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleBack = () => {
    navigate(-1);
  };

  const handleViewStream = (studentId: number) => {
    console.log(`Viewing stream for student ${studentId}`);
    alert(`Opening stream for student ${studentId}`);
  };

  const formatTime = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className="w-full min-h-screen bg-[#E8F1FA]">
      {/* Header */}
      <Header fixed={true} showAccount={true} isRegistered={true} userType="instructor" />

      <div className="pt-24 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Main Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-lg p-6 relative"
          >
            {/* زر Back داخل البطاقة في الزاوية اليمنى العليا */}
            <button
              onClick={handleBack}
              className="absolute top-6 right-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors font-medium text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {/* Header Section */}
            <div className="flex items-center mb-6 pr-16"> {/* أضف pr-16 لإفساح مكان لزر Back */}
              <div className="flex items-center gap-3">
                <Video className="w-8 h-8 text-blue-600" />
                <h1 className="text-3xl font-bold text-gray-900">Live Proctoring</h1>
              </div>
            </div>

            {/* Info Bar */}
            <div className="flex items-center gap-6 mb-6">
              {/* Timer */}
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-red-600" />
                <span className="text-xl font-mono font-bold text-gray-900">
                  {formatTime(timer.hours)}:{formatTime(timer.minutes)}:{formatTime(timer.seconds)}
                </span>
              </div>

              {/* Live Badge */}
              <div className="flex items-center gap-2 bg-blue-100 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <span className="text-blue-700 font-semibold text-sm">Live</span>
              </div>

              {/* Active Students */}
              <div className="flex items-center gap-2 text-gray-600">
                <Users className="w-5 h-5" />
                <span className="font-semibold">{activeStudents} students active</span>
              </div>
            </div>

            {/* Alert Banner */}
            {alertCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6"
              >
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="font-semibold text-yellow-900">{alertCount} New Alerts</p>
                    <p className="text-sm text-yellow-700">
                      Students: {alertedStudents.map(s => s.name.split(' ')[1]).join(', ')} • Flagged for suspicious behaviour
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Students Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {students.map((student, index) => (
                <motion.div
                  key={student.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`relative bg-gray-900 rounded-xl overflow-hidden ${
                    student.hasAlert ? 'ring-4 ring-red-500' : ''
                  }`}
                >
                  {/* Alert Badge */}
                  {student.hasAlert && (
                    <div className="absolute top-3 right-3 z-10 bg-red-600 text-white px-3 py-1 rounded-full flex items-center gap-1 text-sm font-semibold">
                      <AlertCircle className="w-4 h-4" />
                      Alert
                    </div>
                  )}

                  {/* Video Placeholder */}
                  <div className="aspect-video bg-gray-800 flex items-center justify-center relative group">
                    {/* Play Button Overlay */}
                    <button
                      onClick={() => handleViewStream(student.id)}
                      className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-200 group"
                    >
                      <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-200">
                        <Play className="w-8 h-8 text-white ml-1" />
                      </div>
                    </button>

                    {/* Student Info */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-white font-semibold text-lg">{student.name}</h3>
                          <span className="text-blue-400 text-sm font-medium">
                            {student.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LiveProctoring;