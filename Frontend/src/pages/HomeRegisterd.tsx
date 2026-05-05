import Header from "../components/Header";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ChevronRight } from 'lucide-react';

const HomeRegistered = () => {
  return (
    <div className="w-full min-h-screen bg-[#E3F0FE]">
      <Header fixed={true} showAccount={true} isRegistered={true} />

      {/* Hero Section */}
      <section
        className="w-full min-h-screen flex items-center px-6 sm:px-20 py-12 pt-32"
        id="home"
      >
        <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-10">
          {/* Left Text */}
          <motion.div
            className="w-full lg:w-1/2 text-center lg:text-left max-w-[600px]"
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-[#1d1d1d] leading-tight">
              Smart Exam Platform for  <br />
              <span className="text-blue-600">Trusted Results</span>
            </h1>

            <p className="mt-3 text-base sm:text-lg text-[#6b7280] leading-relaxed max-w-[450px] mx-auto lg:mx-0">
              Welcome to your academic hub! Track your progress, celebrate your
              achievements, and stay on top of your courses. Your journey to
              success starts here.
            </p>

            <div className="mt-6 flex flex-wrap gap-3 justify-center lg:justify-start">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.6 }}
              >
                <Link
                  to="/classes" // Replace with your actual classes route
                  className="group bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl"
                >
                  Go To Classes
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                  >
                    <ChevronRight size={20} />
                  </motion.div>
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* Right image */}
          <motion.div
            className="w-full lg:w-1/2 flex justify-center mt-8 lg:mt-0"
            initial={{ opacity: 0, x: 130 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            <motion.img
              src="/images/banner.png"
              alt="exam guard ai"
              className="w-full max-w-[600px]"
              animate={{ y: [0, 30, 0] }}
              transition={{
                delay: 1.5,
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      {/* Bottom Bar */}
      <div className="border-t border-[#1d1d1d]/20 mt-8 pt-4 flex flex-col md:flex-row items-center justify-between text-center md:text-left bg-[#E3F0FE] px-6 pb-4">
        <p className="text-[#1d1d1d]/70 text-sm mb-2 md:mb-0">
          © 2026 ExamGuard. All rights reserved.
        </p>

        <div className="flex flex-wrap gap-3 justify-center md:justify-end">
          {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(
            (item, idx) => (
              <a
                key={idx}
                href="#"
                className="text-[#1d1d1d]/70 text-sm hover:underline"
              >
                {item}
              </a>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default HomeRegistered;