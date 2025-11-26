import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="w-full min-h-[90vh] flex items-center px-5 sm:px-20 py-12 mt-16 bg-[#E3F0FE]" id="home">
      <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-10">
        {/* Left Content */}
        <motion.div
          className="w-full lg:w-1/2 text-center lg:text-left max-w-[600px]"
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <motion.h1 className="text-4xl sm:text-5xl font-bold text-[#1d1d1d] leading-tight">
            Prevent Cheating in <br />
            <span className="text-primary">Online & Offline</span> <br />
            Exams
          </motion.h1>

          <motion.p
            className="mt-3 text-base sm:text-lg text-[#6b7280] leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.4 }}
          >
            A comprehensive monitoring system that uses artificial intelligence
            and advanced technologies to ensure the integrity of online &
            offline exams and prevent cheating attempts with high effectiveness.
          </motion.p>

          {/* Buttons */}
          <motion.div
            className="mt-6 flex flex-wrap gap-3 justify-center lg:justify-start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.6 }}
          >
            <Link to="/SignUp" className="px-6 py-3 bg-[#176ADA] text-white font-semibold rounded-lg hover:bg-[#1D7EF8] transition-colors"> 
              Get Started
            </Link>
            <button className="px-6 py-3 bg-transparent border-2 border-gray-900 text-gray-900 font-semibold rounded-lg hover:bg-gray-900 hover:text-white transition-all flex items-center gap-2">
              <span className="text-sm">▶</span>
              Watch A Demo
            </button>
          </motion.div>
        </motion.div>

        {/* Right Image */}
        <motion.div
          className="w-full lg:w-1/2 flex justify-center mt-8 lg:mt-0"
          initial={{ opacity: 0, x: 130 }} // keep old slide-in
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        >
          <motion.img
            src="/images/hero.png"
            alt="exam guard ai"
            className="w-full max-w-[700px]"
            animate={{ y: [0, 30, 0] }} // drop down then rise up
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
  );
};

export default Hero;
