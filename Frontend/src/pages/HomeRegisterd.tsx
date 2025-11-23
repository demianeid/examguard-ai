
import Header from '../components/Header'
import { motion } from "framer-motion";

const HomeRegistered = () => {
  return (
    <div className="w-full min-h-screen bg-[#E3F0FE]">
      <Header fixed={true} showAccount={true} isRegistered={true} />

      {/* Hero Section */}
      <section className="w-full min-h-[90vh] flex items-center px-6 sm:px-20 py-12 pt-32" id="home">
        <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-10">
          {/* Left Text */}
          <motion.div
            className="w-full lg:w-1/2 text-center lg:text-left max-w-[600px]"
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            <h1 className="text-4xl sm:text-5xl font-bold text-[#1d1d1d] leading-tight">
              Prevent Cheating in <br />
              <span className="text-[#1D7EF8]">Online Exams</span>
            </h1>

            <p className="mt-3 text-base sm:text-lg text-[#6b7280] leading-relaxed max-w-[450px] mx-auto lg:mx-0">
              Welcome to your academic hub! Track your progress, celebrate your achievements, and stay on top of your courses. Your journey to success starts here.
            </p>

            <div className="mt-6 flex flex-wrap gap-3 justify-center lg:justify-start">
              <button className="px-6 py-3 bg-[#176ADA] text-white font-semibold rounded-lg hover:bg-[#1D7EF8] transition-colors">
                Go To Classes
              </button>
            </div>
          </motion.div>

          {/* Right image */}
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


      {/* Footer */}
      {/* Bottom Bar */}
  <div className="border-t border-[#1d1d1d]/20 mt-8 pt-4 flex flex-col md:flex-row items-center justify-between text-center md:text-left bg-[#E3F0FE] px-6 pb-4">
  <p className="text-[#1d1d1d]/70 text-sm mb-2 md:mb-0">
    © 2024 ExamGuard. All rights reserved.
  </p>

  <div className="flex flex-wrap gap-3 justify-center md:justify-end">
    {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((item, idx) => (
      <a
        key={idx}
        href="#"
        className="text-[#1d1d1d]/70 text-sm hover:underline"
      >
        {item}
      </a>
    ))}
  </div>
</div>

    </div>
  );
};

export default HomeRegistered;

