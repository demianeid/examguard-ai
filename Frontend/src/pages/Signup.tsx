import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

const Signup = () => {
  const navigate = useNavigate();

  const handleStudentClick = () => {
    navigate("/signup/student");
  };

  const handleInstructorClick = () => {
    navigate("/signup/instructor");
  };

  return (
    <div  >
      <Header hideSignup={true} />
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="w-full max-w-5xl bg-gradient-to-br from-Tertiary to-Quinary rounded-2xl shadow-2xl p-8 m"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
              Welcome to Smart Exam Platform
            </h1>
            <p className="text-white/80 text-sm">
              Select your role to access the appropriate tools and features
            </p>
          </div>

          {/* Role Cards */}
          <div className="grid md:grid-cols-2 gap-0 bg-white/10 backdrop-blur-sm rounded-2xl overflow-hidden">
            {/* Student Card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
              onClick={handleStudentClick}
              className="
                bg-gradient-to-br from-primary to-Quinary
                backdrop-blur-md p-10 text-center cursor-pointer
                relative group
                border-r border-white/10
              "
            >
              <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/20 transition-all duration-300" />
              
              <div className="relative">
                {/* Student Icon */}
                <div className="mb-6 flex justify-center">
                  <div className="w-16 h-16 flex items-center justify-center">
                    <svg
                      className="w-16 h-16 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-white mb-3">
                  Student
                </h2>

                {/* Description */}
                <p className="text-white/90 text-sm leading-relaxed px-2">
                  Prepare for exams smartly, access learning<br/>resources and effective preparation tools
                </p>
              </div>
            </motion.div>

            {/* Instructor/Teacher Card */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.3 }}
              onClick={handleInstructorClick}
              className="
                bg-gradient-to-br from-cyan-300/60 to-blue-300/60
                backdrop-blur-md p-10 text-center cursor-pointer
                relative group
              "
            >
              <div className="absolute inset-0 bg-cyan-200/0 group-hover:bg-cyan-200/30 transition-all duration-300" />
              
              <div className="relative">
                {/* Instructor Icon */}
                <div className="mb-6 flex justify-center">
                  <div className="w-16 h-16 flex items-center justify-center">
                    <svg
                      className="w-16 h-16 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
                      <circle cx="12" cy="12" r="6" strokeWidth={1.5} />
                      <circle cx="12" cy="12" r="2" fill="currentColor" />
                    </svg>
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-white mb-3">
                  Instructor / Teacher
                </h2>

                {/* Description */}
                <p className="text-white/90 text-sm leading-relaxed px-2">
                  Create smart exams, monitor integrity, and help<br/>your students succeed
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>   
  );
};

export default Signup;