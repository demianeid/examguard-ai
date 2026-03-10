import React from "react";
import { motion } from "framer-motion";
import { Mail, Phone, TrendingUp, BookOpen, ArrowLeft, User, BarChart3 } from "lucide-react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

const AccountStudentInstructorView: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const studentData = location.state?.studentData;

  const handleBack = () => navigate(-1);

  if (!studentData) return (
    <div className="min-h-screen bg-[#E8F1FA] flex items-center justify-center">
      <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
        <p className="text-red-500 mb-4">Student data not found</p>
        <button onClick={handleBack} className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600">
          Go Back
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full min-h-screen bg-[#E8F1FA] relative">
      <button
        onClick={handleBack}
        className="absolute top-6 right-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors font-medium text-sm z-10"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="w-full py-8 px-4">
        <div className="max-w-[1000px] mx-auto space-y-6">

          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden"
          >
            <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-600 rounded-t-2xl"></div>

            <div className="bg-white px-6 pb-8 -mt-16 relative">
              <div className="flex flex-col items-center">
                {/* Avatar */}
                <div className="w-40 h-40 rounded-full shadow-lg border-4 border-white overflow-hidden bg-blue-500 flex items-center justify-center mb-4">
                  {studentData.profile_image ? (
                    <img
                      src={studentData.profile_image}
                      alt={studentData.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-16 h-16 text-white" />
                  )}
                </div>

                {/* Name & ID */}
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{studentData.full_name}</h1>
                <p className="text-gray-600 text-lg mb-6">{studentData.student_custom_id}</p>

                {/* Contact */}
                <div className="flex flex-wrap justify-center gap-8 text-gray-600">
                  {studentData.real_email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-blue-500" />
                      <span>{studentData.real_email}</span>
                    </div>
                  )}
                  {studentData.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-5 h-5 text-green-500" />
                      <span>{studentData.phone}</span>
                    </div>
                  )}
                </div>

                {/* Enrolled At */}
                {studentData.enrolled_at && (
                  <p className="text-sm text-gray-400 mt-4">
                    Enrolled: {new Date(studentData.enrolled_at).toLocaleDateString('en-US', {
                      year: 'numeric', month: 'long', day: 'numeric'
                    })}
                  </p>
                )}
              </div>
            </div>
          </motion.div>

          {/* Performance Dashboard */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
            </div>

            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-white/80 text-sm mb-1">Average Score</div>
                  <div className="text-4xl font-bold text-white">—</div>
                </div>
                <div className="text-center border-x border-white/20">
                  <div className="text-white/80 text-sm mb-1">Completed Exams</div>
                  <div className="text-4xl font-bold text-white">—</div>
                </div>
                <div className="text-center">
                  <div className="text-white/80 text-sm mb-1">Attendance Rate</div>
                  <div className="text-4xl font-bold text-white">—</div>
                </div>
              </div>
            </div>

            <div className="text-center text-gray-400 py-8">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Performance data will be available after exams are completed</p>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default AccountStudentInstructorView;