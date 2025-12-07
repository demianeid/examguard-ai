import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Users, Award, BarChart3, Download, Clock } from "lucide-react";
import Header from '../components/Header';

interface StudentResult {
  id: number;
  name: string;
  studentId: string;
  avgScore: number;
  status: "pass" | "fail";
  timeSpent: string;
}

const ExamResults: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1);
  };

  const handleViewProfile = (studentId: string) => {
    navigate(`/instructor/student-profile/${studentId}`);
  };

  const handleExportResults = () => {
    alert("Exporting results...");
  };

  // بيانات الامتحان
  const examData = {
    name: "Quiz 3 - Data Structures",
    date: "November 18, 2025",
    duration: "60 minutes",
    totalStudents: 45,
    avgScore: 81.6,
    passRate: "92%",
    students: [
      { id: 1, name: "Student 1", studentId: "2025001", avgScore: 86, status: "pass", timeSpent: "58 min" },
      { id: 2, name: "Student 2", studentId: "2025002", avgScore: 91, status: "pass", timeSpent: "55 min" },
      { id: 3, name: "Student 3", studentId: "2025003", avgScore: 76, status: "pass", timeSpent: "60 min" },
      { id: 4, name: "Student 4", studentId: "2025004", avgScore: 82, status: "pass", timeSpent: "52 min" },
      { id: 5, name: "Student 5", studentId: "2025005", avgScore: 73, status: "pass", timeSpent: "59 min" },
      { id: 6, name: "Student 6", studentId: "2025006", avgScore: 45, status: "fail", timeSpent: "47 min" },
      { id: 7, name: "Student 7", studentId: "2025007", avgScore: 88, status: "pass", timeSpent: "57 min" },
      { id: 8, name: "Student 8", studentId: "2025008", avgScore: 79, status: "pass", timeSpent: "60 min" },
      { id: 9, name: "Student 9", studentId: "2025009", avgScore: 94, status: "pass", timeSpent: "48 min" },
      { id: 10, name: "Student 10", studentId: "2025010", avgScore: 68, status: "pass", timeSpent: "60 min" }
    ]
  };

  const passingScore = 60;

  return (
    <div className="w-full min-h-screen bg-[#E8F1FA]">
      {/* Header */}
      <Header fixed={true} showAccount={true} isRegistered={true} userType="instructor" />

      <div className="pt-24 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          {/* بطاقة واحدة رئيسية تحتوي على كل شيء */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 relative">
              {/* زر Back */}
              <button
                onClick={handleBack}
                className="absolute top-6 right-6 flex items-center gap-2 text-white hover:text-blue-100 transition-colors font-medium"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>

              <div className="pr-16">
                <h1 className="text-3xl font-bold mb-3">{examData.name} - Results</h1>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    <span>{examData.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    <span>{examData.duration}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Section */}
            <div className="p-6 border-b">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="text-blue-600" size={24} />
                    <h3 className="font-semibold text-gray-800">Total Students</h3>
                  </div>
                  <p className="text-3xl font-bold text-blue-700">{examData.totalStudents}</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Award className="text-green-600" size={24} />
                    <h3 className="font-semibold text-gray-800">Average Score</h3>
                  </div>
                  <p className="text-3xl font-bold text-green-700">{examData.avgScore}%</p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-3 mb-2">
                    <BarChart3 className="text-purple-600" size={24} />
                    <h3 className="font-semibold text-gray-800">Pass Rate</h3>
                  </div>
                  <p className="text-3xl font-bold text-purple-700">{examData.passRate}</p>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Student Results</h2>
                <p className="text-gray-600 text-sm mt-1">
                  Showing {examData.students.length} of {examData.totalStudents} students
                </p>
              </div>
              <button
                onClick={handleExportResults}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors flex items-center gap-2"
              >
                <Download size={18} />
                Export Results
              </button>
            </div>

            {/* Students Results Table */}
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 text-gray-700 text-sm">
                      <th className="py-3 px-4 text-left rounded-l-lg">Student</th>
                      <th className="py-3 px-4 text-left">ID</th>
                      <th className="py-3 px-4 text-left">Score</th>
                      <th className="py-3 px-4 text-left">Status</th>
                      <th className="py-3 px-4 text-left">Time Spent</th>
                      <th className="py-3 px-4 text-left rounded-r-lg">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {examData.students.map((student, index) => (
                      <motion.tr
                        key={student.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                              {student.name.charAt(0)}
                            </div>
                            <span className="font-medium text-gray-900">{student.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-600">{student.studentId}</td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-xl font-bold ${
                              student.avgScore >= passingScore ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {student.avgScore}%
                            </span>
                            {student.avgScore >= 90 && (
                              <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                                Top
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            student.status === 'pass' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {student.status === 'pass' ? 'Passed' : 'Failed'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-600">{student.timeSpent}</td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleViewProfile(student.studentId)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            View Profile
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Section */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                  <h3 className="font-bold text-gray-900 mb-3">Score Distribution</h3>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">90-100% (Excellent)</span>
                        <span className="font-medium">2 students</span>
                      </div>
                      <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600" style={{ width: '20%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">80-89% (Good)</span>
                        <span className="font-medium">4 students</span>
                      </div>
                      <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500" style={{ width: '40%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">60-79% (Pass)</span>
                        <span className="font-medium">3 students</span>
                      </div>
                      <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-500" style={{ width: '30%' }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700">Below 60% (Fail)</span>
                        <span className="font-medium">1 student</span>
                      </div>
                      <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500" style={{ width: '10%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                  <h3 className="font-bold text-gray-900 mb-3">Performance Insights</h3>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2 text-gray-700">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>9 out of 10 students passed the exam</span>
                    </li>
                    <li className="flex items-center gap-2 text-gray-700">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Average completion time: 56 minutes</span>
                    </li>
                    <li className="flex items-center gap-2 text-gray-700">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span>2 students scored above 90%</span>
                    </li>
                    <li className="flex items-center gap-2 text-gray-700">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span>1 student needs remedial support</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ExamResults;