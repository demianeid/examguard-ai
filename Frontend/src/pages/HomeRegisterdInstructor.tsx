import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Play, Pause } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import Header from '../components/Header'


const HeroSection: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const navigate = useNavigate();
  const handleGoToClasses = () => {
  navigate('/classes-instructor');
};

  // Animation variants
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  const slideInLeft: Variants = {
    hidden: { x: -50, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  const slideInRight: Variants = {
    hidden: { x: 50, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  // Animated slides data
  const slides = [
    {
      id: 1,
      title: "Identity Verification",
      image: "/images/h3.jpg",
      description: "Multi-factor authentication to confirm student identity"
    },
    {
      id: 2,
      title: "Webcam Monitoring",
      image: "/images/g3.png",
      description: "Lockdown environment for exam integrity"
      
    },
    {
      id: 3,
      title: "Exam Reports",
      image: "/images/h2.jpeg",
      description: "AI-powered video analysis for behavior monitoring"
    },
    {
      id: 4,
      title: "Identity Verification",
      image: "/images/g4.png",
      description: "Multi-factor authentication to confirm student identity"
    },
    // {
    //   id: 5,
    //   title: "Smart Surveillance",
    //   image: "/images/h4.jpeg",
    //   description: "Physical room monitoring with AI detection"
    // },
    // {
    //   id: 6,
    //   title: "Advanced Analytics",
    //   image: "https://picsum.photos/seed/analytics/600/400.jpg",
    //   description: "Comprehensive reporting and insights"
    // }
  ];

  // Auto-play functionality
  React.useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [isPlaying, slides.length]);

  const slideVariants: Variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8
    })
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };

  const paginate = (newDirection: number) => {
    setCurrentSlide((prev) => (prev + newDirection + slides.length) % slides.length);
  };

  return (
    <div className="min-h-screen bg-background pt-20 overflow-hidden">
            <Header  showAccount={true} isRegistered={true}  />

      {/* Online Exams Section */}
      <section className="container mx-auto px-6 py-16">
        <motion.div 
          className="flex flex-col lg:flex-row items-center justify-between gap-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
        >
          <motion.div 
            className="lg:w-1/2"
            variants={slideInLeft}
          >
            <motion.h1 
              className="text-4xl lg:text-5xl font-bold text-gray-800 mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Prevent Cheating in <span className="text-blue-600">Online Exams</span>
            </motion.h1>
            <motion.p 
              className="text-lg text-gray-600 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Welcome to our advanced online exam monitoring system. Secure your assessments with cutting-edge technology designed to maintain academic integrity in digital environments.
            </motion.p>
            <motion.button 
              className="group bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 flex items-center gap-2 shadow-lg"
              whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              type="button"
                onClick={handleGoToClasses}
            >
              Go To Classes
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
              >
                <ChevronRight size={20} />
              </motion.div>
            </motion.button>
          </motion.div>
          
          <motion.div 
            className="lg:w-1/2 relative"
            variants={slideInRight}
          >
            <motion.div 
              className="bg-background rounded-2xl shadow-xl p-8 relative overflow-hidden"
              whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {/* Animated Image Carousel */}
              <div className="relative h-96 rounded-xl overflow-hidden">
                <AnimatePresence initial={false} custom={currentSlide}>
                  <motion.img
                    key={currentSlide}
                    src={slides[currentSlide].image}
                    alt={slides[currentSlide].title}
                    custom={currentSlide}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: "spring", stiffness: 300, damping: 30 },
                      opacity: { duration: 0.2 },
                      scale: { duration: 0.2 }
                    }}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={1}
                    onDragEnd={(e, { offset, velocity }) => {
                      const swipe = swipePower(offset.x, velocity.x);

                      if (swipe < -swipeConfidenceThreshold) {
                        paginate(1);
                      } else if (swipe > swipeConfidenceThreshold) {
                        paginate(-1);
                      }
                    }}
                    className="absolute w-full h-full object-cover rounded-xl"
                  />
                </AnimatePresence>
                
                {/* Overlay with slide info */}
                <motion.div 
                  className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <motion.h3 
                    className="text-white text-2xl font-bold mb-2"
                    key={slides[currentSlide].title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    {slides[currentSlide].title}
                  </motion.h3>
                  <motion.p 
                    className="text-white/90 text-sm"
                    key={slides[currentSlide].description}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                  >
                    {slides[currentSlide].description}
                  </motion.p>
                </motion.div>

                {/* Navigation dots */}
                <div className="absolute top-4 right-4 flex gap-2">
                  {slides.map((_, index) => (
                    <motion.button
                      key={index}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentSlide ? 'bg-white w-8' : 'bg-white/50'
                      }`}
                      onClick={() => setCurrentSlide(index)}
                      whileHover={{ scale: 1.2 }}
                      whileTap={{ scale: 0.8 }}
                    />
                  ))}
                </div>

                {/* Play/Pause button */}
                <motion.button
                  className="absolute top-4 left-4 bg-white/20 backdrop-blur-sm rounded-full p-2 text-white hover:bg-white/30 transition-colors"
                  onClick={() => setIsPlaying(!isPlaying)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </motion.button>

                {/* Navigation arrows */}
                <motion.button
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm rounded-full p-2 text-white hover:bg-white/30 transition-colors"
                  onClick={() => paginate(-1)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ChevronRight size={20} className="rotate-180" />
                </motion.button>
                <motion.button
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm rounded-full p-2 text-white hover:bg-white/30 transition-colors"
                  onClick={() => paginate(1)}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ChevronRight size={20} />
                </motion.button>
              </div>

              {/* Feature indicators */}
              <div className="mt-6 grid grid-cols-3 gap-2">
                {slides.slice(0, 3).map((slide, index) => (
                  <motion.div
                    key={slide.id}
                    className={`text-center p-2 rounded-lg transition-all duration-300 ${
                      currentSlide === index ? 'bg-blue-100 text-blue-600' : 'bg-background text-gray-600'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    onClick={() => setCurrentSlide(index)}
                  >
                    <div className="text-xs font-medium">{slide.title}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Offline Exams Section */}
      <section className="container min-h-screen pt-32 pb-0 mx-auto px-6 py-16">
        <motion.div 
          className="flex flex-col lg:flex-row-reverse items-center justify-between gap-12 "
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
        >
          <motion.div 
            className="lg:w-1/2 "
            variants={slideInRight}
          >
            <motion.h2 
              className="text-4xl lg:text-5xl font-bold text-gray-800 mb-6"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="text-blue-600">Offline Exam</span> Monitoring System
            </motion.h2>
            <motion.p 
              className="text-lg text-gray-600 mb-8"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Extend your monitoring capabilities to physical exam spaces. Our offline system ensures integrity in traditional testing environments with smart surveillance and AI-powered analysis.
            </motion.p>
            
            <motion.button 
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 flex items-center gap-2 shadow-lg"
              whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={() => navigate('/OfflineMode')}
            >
              Explore Offline Mode
              <motion.div
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
              >
                <ChevronRight size={20} />
              </motion.div>
            </motion.button>
          </motion.div>
          
          <motion.div 
            className="lg:w-1/2"
            variants={slideInLeft}
          >
            <motion.div 
              className="bg-background rounded-2xl shadow-xl p-8"
              whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(0,0,0,0.1)" }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {/* Single animated showcase image */}
              <div className="relative h-80 rounded-xl overflow-hidden">
                <motion.img
                  src="/images/g1.png"
                  alt="Exam Monitoring System"
                  className="w-full h-full object-cover rounded-xl"
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                {/* Floating badges */}
                <motion.div
                  className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold"
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  Live Monitoring
                </motion.div>
                
                <motion.div
                  className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold"
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.5
                  }}
                >
                  AI Powered
                </motion.div>
                
                <motion.div
                  className="absolute bottom-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold"
                  animate={{
                    y: [0, -10, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                  }}
                >
                  3 Proctors Active
                </motion.div>

                {/* Pulse effect overlay */}
                <motion.div
                  className="absolute inset-0 bg-blue-500/20 rounded-xl"
                  animate={{
                    opacity: [0, 0.3, 0],
                  }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Features Overview */}
      <motion.section 
        className="bg-background py-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={containerVariants}
      >
        <div className="container mx-auto px-6">
          <motion.h2 
            className="text-3xl font-bold text-center text-gray-800 mb-12"
            initial={{ opacity: 0, y: -30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Comprehensive Exam Integrity Solution
          </motion.h2>
          
          {/* Single animated feature showcase */}
          <motion.div 
            className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden"
            whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(0,0,0,0.15)" }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="relative h-96">
              <motion.img
                src="images/g2.png"
                alt="Comprehensive Solution"
                className="w-full h-full object-cover"
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              {/* Animated text overlay */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-Tertiary/60 to-Quinary/60 flex items-center justify-center"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                transition={{ duration: 1 }}
              >
                <motion.div
                  className="text-center text-white px-8"
                  initial={{ y: 50, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.3 }}
                >
                  <motion.h3 
                    className="text-4xl font-bold mb-4"
                    animate={{
                      textShadow: [
                        "0 0 0px rgba(255,255,255,0)",
                        "0 0 20px rgba(255,255,255,0.5)",
                        "0 0 0px rgba(255,255,255,0)"
                      ],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    All-in-One Platform
                  </motion.h3>
                  <motion.p 
                    className="text-xl mb-6"
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    From online proctoring to offline surveillance
                  </motion.p>
                  <motion.div
                    className="flex justify-center gap-4"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                  >
                    <motion.div
                      className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2"
                      whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.3)" }}
                    >
                      <div className="text-2xl font-bold">99.9%</div>
                      <div className="text-sm">Accuracy</div>
                    </motion.div>
                    <motion.div
                      className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2"
                      whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.3)" }}
                    >
                      <div className="text-2xl font-bold">24/7</div>
                      <div className="text-sm">Monitoring</div>
                    </motion.div>
                    <motion.div
                      className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2"
                      whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.3)" }}
                    >
                      <div className="text-2xl font-bold">AI</div>
                      <div className="text-sm">Powered</div>
                    </motion.div>
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.section>
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

export default HeroSection;