import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Users, Award, BarChart3, Download, Clock, AlertCircle } from "lucide-react";
import Header from '../components/Header';

interface StudentResult {
  student_id: string;
  student_name: string;
   profile_image: string | null;  
  total_marks_obtained: number;
  total_marks: number;
  percentage: number;
  submitted_at: string;
  is_terminated: boolean;
  violation_score: number;
}

interface ExamResultData {
  exam_id: number;
  exam_title: string;
  total_students: number;
  results: StudentResult[];
}

const ExamResults: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const token = localStorage.getItem('access_token');

  const [examData, setExamData] = useState<ExamResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!examId) return;

    const fetchResults = async () => {
      setLoading(true);
      // http://localhost:8000
      try {
        const res = await fetch(`http://localhost:8000/api/exam/${examId}/results/`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load results');
        const data = await res.json();
        setExamData(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load results');
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [examId]);

const handleViewProfile = (student: StudentResult) => {
  navigate(`/instructor/student-profile/${student.student_id}`, {
   state: {
  studentData: {
    full_name: student.student_name,
    student_custom_id: student.student_id,
    profile_image: student.profile_image
      ? `http://localhost:8000${student.profile_image}`
      : null,
  }
}
  });
};
  const handleExportResults = () => {
    if (!examData) return;
    const csv = [
      ['Student Name', 'Student ID', 'Score', 'Percentage', 'Status', 'Terminated', 'Submitted At'],
      ...examData.results.map(r => [
        r.student_name,
        r.student_id,
        `${r.total_marks_obtained}/${r.total_marks}`,
        `${r.percentage}%`,
        r.percentage >= 60 ? 'Passed' : 'Failed',
        r.is_terminated ? 'Yes' : 'No',
        new Date(r.submitted_at).toLocaleDateString(),
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${examData.exam_title}_results.csv`;
    a.click();
  };

  // --- Derived stats ---
  const avgScore = examData?.results.length
    ? (examData.results.reduce((sum, r) => sum + r.percentage, 0) / examData.results.length).toFixed(1)
    : '0';

  const passCount = examData?.results.filter(r => r.percentage >= 60).length ?? 0;
  const passRate = examData?.results.length
    ? Math.round((passCount / examData.results.length) * 100)
    : 0;

  const scoreDistribution = examData ? {
    excellent: examData.results.filter(r => r.percentage >= 90).length,
    good: examData.results.filter(r => r.percentage >= 80 && r.percentage < 90).length,
    pass: examData.results.filter(r => r.percentage >= 60 && r.percentage < 80).length,
    fail: examData.results.filter(r => r.percentage < 60).length,
  } : { excellent: 0, good: 0, pass: 0, fail: 0 };

  // --- Loading ---
  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[#E8F1FA] flex items-center justify-center">
        <Header fixed={true} showAccount={true} isRegistered={true} userType="instructor" />
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading results...</p>
        </div>
      </div>
    );
  }

  // --- Error ---
  if (error || !examData) {
    return (
      <div className="w-full min-h-screen bg-[#E8F1FA] flex items-center justify-center">
        <Header fixed={true} showAccount={true} isRegistered={true} userType="instructor" />
        <div className="text-center bg-white p-8 rounded-xl shadow-md max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Failed to Load Results</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button onClick={() => navigate(-1)} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#E8F1FA]">
      <Header fixed={true} showAccount={true} isRegistered={true} userType="instructor" />

      <div className="pt-24 pb-8 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-white rounded-2xl shadow-xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 relative">
              <button
                onClick={() => navigate(-1)}
                className="absolute top-6 right-6 flex items-center gap-2 text-white hover:text-blue-100 transition-colors font-medium"
              >
                <ArrowLeft className="w-5 h-5" />
                Back
              </button>
              <div className="pr-16">
                <h1 className="text-3xl font-bold mb-3">{examData.exam_title} - Results</h1>
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    <span>{examData.total_students} students submitted</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="p-6 border-b">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="text-blue-600" size={24} />
                    <h3 className="font-semibold text-gray-800">Total Students</h3>
                  </div>
                  <p className="text-3xl font-bold text-blue-700">{examData.total_students}</p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3 mb-2">
                    <Award className="text-green-600" size={24} />
                    <h3 className="font-semibold text-gray-800">Average Score</h3>
                  </div>
                  <p className="text-3xl font-bold text-green-700">{avgScore}%</p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-3 mb-2">
                    <BarChart3 className="text-purple-600" size={24} />
                    <h3 className="font-semibold text-gray-800">Pass Rate</h3>
                  </div>
                  <p className="text-3xl font-bold text-purple-700">{passRate}%</p>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="p-6 border-b bg-gray-50 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Student Results</h2>
                <p className="text-gray-600 text-sm mt-1">
                  Showing {examData.results.length} of {examData.total_students} students
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

            {/* Table */}
            <div className="p-6">
              {examData.results.length === 0 ? (
                <div className="text-center py-12">
                  <Users size={48} className="text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No Results Yet</h3>
                  <p className="text-gray-500 text-sm">No students have submitted this exam yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 text-gray-700 text-sm">
                        <th className="py-3 px-4 text-left rounded-l-lg">Student</th>
                        <th className="py-3 px-4 text-left">ID</th>
                        <th className="py-3 px-4 text-left">Score</th>
                        <th className="py-3 px-4 text-left">Status</th>
                        <th className="py-3 px-4 text-left">Submitted</th>
                        <th className="py-3 px-4 text-left">Violations</th>
                        <th className="py-3 px-4 text-left rounded-r-lg">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {examData.results.map((student, index) => (
                        <motion.tr
                          key={student.student_id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              {student.profile_image ? (
  <img
  src={`http://localhost:8000${student.profile_image}`}
  alt={student.student_name}
  className="w-10 h-10 rounded-full object-cover border-2 border-blue-100"
/>
  // http://localhost:8000
) : (
  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
    {student.student_name.charAt(0)}
  </div>
)}
                              <div>
                                <span className="font-medium text-gray-900">{student.student_name}</span>
                                {student.is_terminated && (
                                  <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Terminated</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-gray-600">{student.student_id}</td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <span className={`text-xl font-bold ${student.percentage >= 60 ? 'text-green-600' : 'text-red-600'}`}>
                                {student.percentage}%
                              </span>
                              <span className="text-xs text-gray-400">
                                ({student.total_marks_obtained}/{student.total_marks})
                              </span>
                              {student.percentage >= 90 && (
                                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">Top</span>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              student.percentage >= 60
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {student.percentage >= 60 ? 'Passed' : 'Failed'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-gray-600 text-sm">
                            {new Date(student.submitted_at).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4">
                            <span className={`text-sm font-medium ${
                              student.violation_score >= 7 ? 'text-red-600' :
                              student.violation_score >= 4 ? 'text-orange-500' : 'text-gray-500'
                            }`}>
                              {student.violation_score}/10
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <button
                             onClick={() => handleViewProfile(student)}
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
              )}

              {/* Score Distribution */}
              {examData.results.length > 0 && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                    <h3 className="font-bold text-gray-900 mb-3">Score Distribution</h3>
                    <div className="space-y-3">
                      {[
                        { label: '90-100% (Excellent)', count: scoreDistribution.excellent, color: 'bg-blue-600', pct: scoreDistribution.excellent / examData.results.length },
                        { label: '80-89% (Good)', count: scoreDistribution.good, color: 'bg-green-500', pct: scoreDistribution.good / examData.results.length },
                        { label: '60-79% (Pass)', count: scoreDistribution.pass, color: 'bg-yellow-500', pct: scoreDistribution.pass / examData.results.length },
                        { label: 'Below 60% (Fail)', count: scoreDistribution.fail, color: 'bg-red-500', pct: scoreDistribution.fail / examData.results.length },
                      ].map(({ label, count, color, pct }) => (
                        <div key={label}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-700">{label}</span>
                            <span className="font-medium">{count} student{count !== 1 ? 's' : ''}</span>
                          </div>
                          <div className="h-2 bg-blue-200 rounded-full overflow-hidden">
                            <div className={`h-full ${color}`} style={{ width: `${pct * 100}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                    <h3 className="font-bold text-gray-900 mb-3">Performance Insights</h3>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-gray-700">
                        <div className="w-2 h-2 bg-green-500 rounded-full" />
                        <span>{passCount} out of {examData.results.length} students passed</span>
                      </li>
                      <li className="flex items-center gap-2 text-gray-700">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <span>Average score: {avgScore}%</span>
                      </li>
                      <li className="flex items-center gap-2 text-gray-700">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                        <span>{scoreDistribution.excellent} student{scoreDistribution.excellent !== 1 ? 's' : ''} scored above 90%</span>
                      </li>
                      <li className="flex items-center gap-2 text-gray-700">
                        <div className="w-2 h-2 bg-red-500 rounded-full" />
                        <span>{scoreDistribution.fail} student{scoreDistribution.fail !== 1 ? 's' : ''} need{scoreDistribution.fail === 1 ? 's' : ''} remedial support</span>
                      </li>
                      <li className="flex items-center gap-2 text-gray-700">
                        <div className="w-2 h-2 bg-orange-500 rounded-full" />
                        <span>{examData.results.filter(r => r.is_terminated).length} exam{examData.results.filter(r => r.is_terminated).length !== 1 ? 's' : ''} terminated due to violations</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ExamResults;