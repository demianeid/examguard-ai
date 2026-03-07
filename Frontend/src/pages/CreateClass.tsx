import React, { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Header from '../components/Header';
import {
  GraduationCap, X, ArrowLeft, Sparkles, BookOpen, Users
} from "lucide-react";

interface NewClassData {
  name: string;
  students: string;
  description: string;
}

const CreateClass = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<NewClassData>({
    name: "", students: "", description: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) return setError("Class name is required");
    if (!formData.students || parseInt(formData.students) < 1) return setError("Please enter a valid number of students");

    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');

      const response = await fetch('http://127.0.0.1:8000/api/instructors/classes/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          number_of_students: parseInt(formData.students),
          description: formData.description.trim(),
        }),
      });

     if (!response.ok) {
  let errorMessage = 'Failed to create class';
  try {
    const errorData = await response.json();
    errorMessage = errorData.detail || errorMessage;
  } catch {
    errorMessage = `Server error: ${response.status}`;
  }
  throw new Error(errorMessage);
}

      const newClass = await response.json();

      navigate('/classes-instructor', {
        state: {
          message: 'Class created successfully!',
          newClassId: newClass.id
        }
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create class. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => navigate('/classes-instructor');

  return (
    <div className="w-full pt-20 min-h-screen bg-gradient-to-br from-[#E3F0FE] to-[#F0F7FF]">
      <div className="min-h-screen p-6">
        <Header fixed={true} showAccount={true} isRegistered={true} userType="instructor" />

        <div className="max-w-4xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 sm:p-6 mb-6 border border-white/50">
            <div className="flex items-center gap-4">
              <button onClick={handleCancel}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft size={20} />
                <span className="hidden sm:inline">Back to Classes</span>
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#1A80F6] to-[#4A90E2] flex items-center justify-center text-white">
                  <GraduationCap size={20} />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#1A80F6] to-[#4A90E2] bg-clip-text text-transparent">
                  Create New Class
                </h1>
              </div>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
            className="bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-[#1A80F6] to-[#4A90E2] px-6 py-5">
              <div className="flex items-center gap-3 text-white">
                <Sparkles size={24} />
                <h2 className="text-xl font-bold">Class Information</h2>
              </div>
              <p className="text-white/80 text-sm mt-1 ml-9">Fill in the details below to create your new class</p>
            </div>

            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
                  <X size={18} className="text-red-500 flex-shrink-0" />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}

              {/* Class Name */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Class Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BookOpen size={18} className="text-gray-400" />
                  </div>
                  <input type="text" id="name" name="name" required value={formData.name} onChange={handleChange}
                    placeholder="e.g., Data Structures & Algorithms"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1A80F6] focus:border-transparent transition-shadow"
                    disabled={isSubmitting} />
                </div>
                <p className="text-xs text-gray-500">Choose a descriptive name that clearly identifies your class</p>
              </div>

              {/* Number of Students */}
              <div className="space-y-2">
                <label htmlFor="students" className="block text-sm font-medium text-gray-700">
                  Number of Students <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Users size={18} className="text-gray-400" />
                  </div>
                  <input type="number" id="students" name="students" required min="1" value={formData.students} onChange={handleChange}
                    placeholder="0"
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1A80F6] focus:border-transparent transition-shadow appearance-none"
                    disabled={isSubmitting} />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">Class Description</label>
                <textarea id="description" name="description" rows={5} value={formData.description} onChange={handleChange}
                  placeholder="Brief description of the class, course objectives, prerequisites, etc..."
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1A80F6] focus:border-transparent transition-shadow resize-none"
                  disabled={isSubmitting} />
                <p className="text-xs text-gray-500">Provide a detailed description to help students understand what they'll learn</p>
              </div>

              {/* Live Preview */}
              {formData.name && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  className="bg-gradient-to-br from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <Sparkles size={16} className="text-[#1A80F6]" /> Class Preview
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#1A80F6] to-[#4A90E2] flex items-center justify-center text-white font-bold text-lg">
                      {formData.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{formData.name}</p>
                      <p className="text-xs text-gray-600">{formData.students || "0"} students</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button type="submit" disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-[#1A80F6] to-[#4A90E2] hover:from-[#0E6AD0] hover:to-[#3A80D2] text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isSubmitting ? (
                    <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating Class...</>
                  ) : (
                    <><Sparkles size={20} /> Create Class</>
                  )}
                </button>
                <button type="button" onClick={handleCancel} disabled={isSubmitting}
                  className="flex-1 bg-white border-2 border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg hover:bg-gray-50 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                  <X size={20} /> Cancel
                </button>
              </div>
            </form>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}
            className="mt-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
            <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-[#1A80F6]" /> Tips for creating a great class
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2"><span className="text-[#1A80F6] font-bold">•</span> Use a clear, descriptive class name that reflects the course content</li>
              <li className="flex items-start gap-2"><span className="text-[#1A80F6] font-bold">•</span> Add a comprehensive description including prerequisites and learning objectives</li>
              <li className="flex items-start gap-2"><span className="text-[#1A80F6] font-bold">•</span> You can always edit these details later from the class management page</li>
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CreateClass;