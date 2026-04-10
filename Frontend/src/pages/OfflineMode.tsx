import React from 'react';
import { Camera, Video, Mic, Volume2, Eye, Users, Shield, Database, Activity, CheckCircle, AlertTriangle, FileText, BarChart } from 'lucide-react';
import Header from '../components/Header';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { ChevronRight, Play, Pause } from 'lucide-react';
import { Link } from 'react-router-dom';


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

const OfflineMode: React.FC = () => {
    
  return (
    <div className="min-h-screen p-10 pb-0 bg-background">
      {/* Navigation */}
      <Header showAccount={true} isRegistered={true} userType="instructor" />

      {/* Hero Section */}
      <div className="max-w-8xl mx-auto px-0 sm:px-6 lg:px-8 pb-0">
        
        {/* Offline Exams Section */}
        <section className="container min-h-600 pt-20 pb-10 mx-auto px-6 py-16">
          <motion.div 
            className="flex flex-col lg:flex-row-reverse items-center justify-between gap-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={containerVariants}
          >
            <motion.div 
              className="lg:w-1/2"
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
              
              {/* تم التعديل هنا - تغيير الرابط من "/Roi" إلى "/dashboard" */}
              <Link to="/dashboard">
                <motion.button
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 flex items-center gap-2 shadow-lg"
                  whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(0,0,0,0.2)" }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                >
                  Get Started
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                  >
                    <ChevronRight size={20} />
                  </motion.div>
                </motion.button>
              </Link>
            </motion.div>
            
            <motion.div 
              className="lg:w-1/2 hidden md:block"
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

        {/* Overview Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-blue-600 mb-4 flex items-center">
            <FileText className="w-6 h-6 mr-2" />
            Overview
          </h2>
          <p className="text-gray-700 leading-relaxed">
            The Offline Exam Monitoring System ensures secure exam sessions without an internet connection. It leverages AI-powered monitoring for face detection, object detection, and behavior analysis to prevent cheating during offline exams.
          </p>
        </div>

        {/* Architecture Diagram */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-blue-600 mb-4">Architecture Diagram</h2>
          <p className="text-gray-700 mb-6">
            The system architecture is composed of four main layers, each responsible for a critical function in the offline monitoring process:
          </p>
          
          <div className="space-y-4 mb-8">
            <div className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-bold text-gray-900 mb-2">1. Input & Sensing Layer:</h3>
              <p className="text-gray-600">Includes camera that captures real-time video, audio, and environmental data from the exam hall.</p>
            </div>
            <div className="border-l-4 border-green-500 pl-4">
              <h3 className="font-bold text-gray-900 mb-2">2. Edge Processing Layer:</h3>
              <p className="text-gray-600">Uses local devices (Edge Node) that pre-process streams, detect motion or objects, and reduce network load.</p>
            </div>
            <div className="border-l-4 border-purple-500 pl-4">
              <h3 className="font-bold text-gray-900 mb-2">3. AI Analysis & Control Layer:</h3>
              <p className="text-gray-600">A local on-premise server equipped with AI models for face recognition, behavior analysis, and sound detection. It generates alerts and an instructor dashboard displaying live results, student activity, and post-exam reports, ensuring full transparency and control.</p>
            </div>
            <div className="border-l-4 border-orange-500 pl-4">
              <h3 className="font-bold text-gray-900 mb-2">4. Visualization & Reporting Layer:</h3>
              <p className="text-gray-600">An instructor dashboard displaying live results, student activity, and post-exam reports, ensuring full transparency and control.</p>
            </div>
          </div>

          {/* Architecture Visual */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-6 text-center border-2 border-blue-200">
              <Camera className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <Mic className="w-8 h-8 text-blue-600 mx-auto mb-3" />
              <h4 className="font-bold text-gray-900 mb-2">1. Input & Sensing Layer</h4>
            </div>
            <div className="bg-green-50 rounded-lg p-6 text-center border-2 border-green-200">
              <Video className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <Eye className="w-8 h-8 text-green-600 mx-auto mb-3" />
              <h4 className="font-bold text-gray-900 mb-2">2. Edge Processing Layer</h4>
            </div>
            <div className="bg-purple-50 rounded-lg p-6 text-center border-2 border-purple-200">
              <Users className="w-12 h-12 text-purple-600 mx-auto mb-3" />
              <Activity className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <Database className="w-8 h-8 text-purple-600 mx-auto mb-3" />
              <h4 className="font-bold text-gray-900 mb-2">3. AI Analysis & Control Layer</h4>
            </div>
            <div className="bg-orange-50 rounded-lg p-6 text-center border-2 border-orange-200">
              <BarChart className="w-12 h-12 text-orange-600 mx-auto mb-3" />
              <h4 className="font-bold text-gray-900 mb-2">4. Visualization & Reporting Layer</h4>
            </div>
          </div>
        </div>

        {/* Core Features */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-blue-600 mb-6">Core Features</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { title: 'Face Recognition', desc: 'Matches the student\'s face at entry and during the exam to prevent impersonation.' },
              { title: 'Behavior Monitoring', desc: 'Detects suspicious activities such as looking away, talking, or standing, triggering real-time alerts or auto-declining the exam submission.' },
              { title: 'Mobile or Paper Detection', desc: 'Identifies unauthorized items like mobile phones or cheat sheets using computer vision.' },
              { title: 'Multi-Camera Support', desc: 'Connects multiple cameras for full classroom coverage of monitoring from different angles.' },
              { title: 'Control Panel (Seating Map)', desc: 'Display student seating positions and timer-based alerts for easy supervision.' },
              { title: 'Heatmap Visualization', desc: 'Shows real-time focus maps to identify students with irregular behavior at a glance.' },
              { title: 'Suspicious Activity & Log Alerts', desc: 'Records the full exam session and flags suspicious events for post-exam review.' },
              { title: 'Post-Exam Reports', desc: 'Generates recent examination suspicious activities per student for ethical documentation.' },
              { title: 'Offline Functionality', desc: 'Operates without internet but allows sync after the session completes.' },
              { title: 'Hardware Flexibility', desc: 'Supports both CCTV cameras and standard webcams for cost-efficient or deployment.' },
              { title: 'Integration with LMS', desc: 'Easily connects with existing Learning Management Systems to leverage current infrastructure.' }
            ].map((feature, idx) => (
              <div key={idx} className="flex items-start space-x-3 p-4 rounded-lg hover:bg-blue-50 transition">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold text-gray-900">{feature.title}:</h3>
                  <p className="text-gray-600 text-sm">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Key Benefits */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-blue-600 mb-6">Key Benefits</h2>
          <div className="space-y-3">
            {[
              { title: 'Secure Offline Operation', desc: 'Ensures secure and uninterrupted exam even without an internet connection.' },
              { title: 'Data Privacy', desc: 'Protects sensitive student data through local storage and offline processing.' },
              { title: 'Cost Efficiency', desc: 'Reduces operational costs through hardware flexibility and existing system integration.' },
              { title: 'Full Transparency', desc: 'Provides complete visibility via video logs, heatmaps, and detailed activity reports.' },
              { title: 'Improved Monitoring', desc: 'Enhances proctor efficiency with real-time alerts and centralized control panels.' },
              { title: 'Evidence-Based Reporting', desc: 'Supplies verifiable documentation for any post-exam review or investigation.' }
            ].map((benefit, idx) => (
              <div key={idx} className="flex items-start space-x-3 p-4 border-l-4 border-blue-500 bg-blue-50">
                <div>
                  <h3 className="font-bold text-gray-900">{benefit.title}:</h3>
                  <p className="text-gray-600">{benefit.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-blue-600 mb-6">How It Works</h2>
          <div className="space-y-4">
            {[
              { num: '1', title: 'Configuration', desc: 'Initialize the local network, connect cameras, and ensure all devices are synchronized and accessible for the exam session.' },
              { num: '2', title: 'Setup (ID)', desc: 'Register all students by capturing their profile photos and linking them with their ID before the session.' },
              { num: '3', title: 'Monitoring', desc: 'AI models continuously analyze faces, objects, and environmental sounds to detect suspicious or abnormal activities.' },
              { num: '4', title: 'Alerts', desc: 'When prohibited actions are detected, real-time alerts are triggered and displayed on the supervisor\'s dashboard for review.' },
              { num: '5', title: 'Reports', desc: 'After the exam, the system generates detailed logs and behavior reports, securely stored locally for transparency and auditing.' }
            ].map((step, idx) => (
              <div key={idx} className="flex items-start space-x-4 p-4 bg-gradient-to-r from-blue-50 to-white rounded-lg border-l-4 border-blue-600">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  {step.num}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{step.title}:</h3>
                  <p className="text-gray-600">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-blue-600 mb-6">Comparison (Online vs Offline)</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-blue-600 text-white">
                  <th className="p-4 text-left border border-blue-700">Feature</th>
                  <th className="p-4 text-left border border-blue-700">Online System</th>
                  <th className="p-4 text-left border border-blue-700">Offline System</th>
                 </tr>
              </thead>
              <tbody>
                {[
                  { feature: 'Internet Required', online: 'Yes', offline: 'No' },
                  { feature: 'Performance', online: 'Dependent on Network', offline: 'Stable and Fast' },
                  { feature: 'Behavior Detection', online: 'Higher accuracy using deep learning algorithms', offline: 'May be lower without sufficient camera angles' },
                  { feature: 'Computer Vision', online: 'Eye tracking, looking outside the screen', offline: 'Depends on student behavior' },
                  { feature: 'Audio Analysis', online: 'Detect any sound in the room', offline: 'Hard with background noise' },
                  { feature: 'Data Analysis', online: 'Tracks screen actions', offline: 'Tracks movements' }
                ].map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="p-4 border border-gray-300 font-medium">{row.feature}</td>
                    <td className="p-4 border border-gray-300">{row.online}</td>
                    <td className="p-4 border border-gray-300">{row.offline}</td>
                   </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA Section - تم التعديل هنا أيضاً */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to Secure Your Exams Offline?</h2>
          <p className="text-lg mb-8 opacity-90">
            Experience the power of AI-based offline monitoring.<br />
            Ensure fairness, transparency, and complete control — even without the internet.
          </p>
          <Link to="/dashboard">
            <button className="px-8 py-4 bg-white text-blue-600 rounded-lg font-bold text-lg hover:bg-gray-100 transform hover:scale-105 transition shadow-lg">
              Get Started
            </button>
          </Link>
        </div>
      </div>
      
      {/* Footer */}
      {/* Bottom Bar */}
      <div className="border-t border-[#1d1d1d]/20 mt-8 pt-4 flex flex-col md:flex-row items-center justify-between text-center md:text-left bg-background px-6 pb-4">
        <p className="text-[#1d1d1d]/70 text-sm mb-2 md:mb-0">
          © 2024 ExamGuard. All rights reserved.
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

export default OfflineMode;