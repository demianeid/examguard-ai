import React from 'react';
import { Camera, Video, Eye, Users, Shield, Database, Activity, CheckCircle, FileText, BarChart, Crosshair, MapPin, LayoutDashboard, ChevronRight, Settings, Server, Play, Building2 } from 'lucide-react';
import Header from '../components/Header';
import { FooterSecond } from '../components/Footer';
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
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

        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {/* Overview Section */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <FileText size={24} />
              </div>
              System Overview
            </h2>
            <p className="text-gray-600 leading-relaxed text-lg mb-6">
              The Offline Monitoring module is designed for institutional centers requiring high-security surveillance without constant internet reliance. By integrating directly with local CCTV hardware via LAN, it transforms standard cameras into AI-aware sensors capable of detecting unauthorized behaviors in real-time.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <Server className="text-blue-600" size={20} />
                <span className="text-sm font-semibold text-blue-900">Local Edge Processing</span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-100">
                <Shield className="text-green-600" size={20} />
                <span className="text-sm font-semibold text-green-900">End-to-End Privacy</span>
              </div>
            </div>
          </div>

          {/* Quick Stats / Highlights */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-lg p-8 text-white">
            <h3 className="text-xl font-bold mb-6">System Capability</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-white/20 pb-4">
                <span className="opacity-80">Max Cameras</span>
                <span className="text-2xl font-bold">32+</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/20 pb-4">
                <span className="opacity-80">Latency</span>
                <span className="text-2xl font-bold">&lt;150ms</span>
              </div>
              <div className="flex justify-between items-center pb-2">
                <span className="opacity-80">AI Accuracy</span>
                <span className="text-2xl font-bold">98.4%</span>
              </div>
              <div className="bg-white/10 p-4 rounded-xl mt-4">
                <p className="text-xs opacity-70 mb-2 font-medium">LATEST UPDATE</p>
                <p className="text-sm font-semibold">Improved Object Detection for mobile phones & unauthorized papers.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Core Features */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Core Capabilities</h2>
              <p className="text-gray-500">Intelligent features optimized for physical hall monitoring</p>
            </div>
            <div className="px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-xs font-bold tracking-widest uppercase">
              Visual-Only Processing
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { 
                title: 'AI Behavior Monitoring', 
                desc: 'Real-time detection of suspicious posture, looking away from papers, or standing up without permission.',
                icon: Activity,
                color: 'blue'
              },
              { 
                title: 'Object & Aid Detection', 
                desc: 'Instantly identifies unauthorized mobile phones, smartwatches, or cheat sheets on desks.',
                icon: Crosshair,
                color: 'red'
              },
              { 
                title: 'Multi-Camera Orchestration', 
                desc: 'Seamlessly switch between multiple CCTV streams to cover the entire hall from every angle.',
                icon: Video,
                color: 'purple'
              },
              { 
                title: 'Hall Seating Map', 
                desc: 'Dynamic visualization of student seating positions with real-time health/alert status indicators.',
                icon: MapPin,
                color: 'green'
              },
              { 
                title: 'Live Instructor Dashboard', 
                desc: 'A centralized command center showing live feeds, scrolling alert logs, and student metrics.',
                icon: LayoutDashboard,
                color: 'indigo'
              },
              { 
                title: 'Hardware Flexibility', 
                desc: 'Supports IP cameras (RTSP), Webcams (USB), and integrated surveillance networks via LAN.',
                icon: Camera,
                color: 'orange'
              },
              { 
                title: 'Seating Heatmaps', 
                desc: 'Visual focus maps identifying areas of high activity or frequent violations across the hall.',
                icon: Eye,
                color: 'pink'
              },
              { 
                title: 'Evidence-Based Reports', 
                desc: 'Automated generation of violation logs and session summaries with visual timestamp evidence.',
                icon: BarChart,
                color: 'teal'
              },
              { 
                title: 'Full Offline Sync', 
                desc: 'System operates entirely without internet, with optional sync to central LMS after session completion.',
                icon: Database,
                color: 'cyan'
              }
            ].map((feature, idx) => (
              <motion.div 
                key={idx} 
                className="group flex flex-col p-6 rounded-2xl border border-gray-50 hover:border-blue-100 hover:bg-blue-50/30 transition-all duration-300"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
              >
                <div className={`w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon size={24} />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Architecture Diagram */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-12">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Technical Architecture</h2>
            <p className="text-gray-500">How the four-layer system processes surveillance data locally</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
            {/* Arrows for Desktop */}
            <div className="hidden md:block absolute top-1/2 left-[12%] right-[12%] h-0.5 border-t-2 border-dashed border-gray-200 -z-0" />
            
            {[
              { 
                layer: '1. Input Layer', 
                desc: 'Physical sensors capturing 1080p video streams from strategically placed CCTV/IP cameras.',
                icon: Camera,
                subIcons: [Video, Camera],
                color: 'blue'
              },
              { 
                layer: '2. Edge Layer', 
                desc: 'Local edge nodes perform stream pre-processing, motion detection, and frame stabilization.',
                icon: Activity,
                subIcons: [Eye, Crosshair],
                color: 'green'
              },
              { 
                layer: '3. AI Control Layer', 
                desc: 'Core server hosting behavioral models, violation scoring engines, and live session management.',
                icon: Shield,
                subIcons: [Server, Database, Users],
                color: 'purple'
              },
              { 
                layer: '4. Visualization', 
                desc: 'The Instructor Dashboard presenting live seating maps, alert scrolling, and exportable reports.',
                icon: LayoutDashboard,
                subIcons: [BarChart, FileText],
                color: 'orange'
              }
            ].map((item, idx) => (
              <div key={idx} className="relative z-10 bg-[#F8FAFC] rounded-2xl p-6 border border-gray-200 text-center hover:shadow-md transition-shadow">
                <div className={`w-14 h-14 bg-white shadow-sm rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 border border-blue-100`}>
                  <item.icon size={28} />
                </div>
                <h4 className="font-bold text-gray-900 mb-3 text-sm">{item.layer}</h4>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">{item.desc}</p>
                <div className="flex justify-center gap-2">
                  {item.subIcons.map((Sub, si) => <Sub key={si} size={14} className="text-gray-400" />)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works - Workflow based on actual screens */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Implementation Workflow</h2>
          <div className="space-y-6">
            {[
              { 
                title: 'Facility Registration', 
                desc: 'Define your campus physical space. Create Exam Halls with custom capacities and assigned building locations using the Facilities manager.',
                action: 'Facilities Management',
                icon: <Building2 size={20} />
              },
              { 
                title: 'Hardware Setup', 
                desc: 'Connect CCTV cameras via LAN or USB. Assign specific cameras to monitor groups of seats within the hall to ensure 100% visibility.',
                action: 'Camera Configuration',
                icon: <Video size={20} />
              },
              { 
                title: 'Student Enrollment', 
                desc: 'Import student lists or enroll them manually. Assign specific seat numbers to create the digital seating map used during the exam.',
                action: 'Seat Assignment',
                icon: <Users size={20} />
              },
              { 
                title: 'Live Monitoring Session', 
                desc: 'Launch the monitoring dashboard. AI models continuously scan for behavioral violations and unauthorized objects, flagging events in real-time.',
                action: 'Start Monitoring',
                icon: <Activity size={20} />
              },
              { 
                title: 'Audit & Investigation', 
                desc: 'Review filtered violation logs. Download Excel-based post-exam reports containing summarized scores and suspicious activity timestamps.',
                action: 'Export Reports',
                icon: <FileText size={20} />
              }
            ].map((step, idx) => (
              <div key={idx} className="flex items-start gap-6 p-6 bg-[#F8FAFC] rounded-2xl border border-gray-100">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold shadow-lg shadow-blue-200">
                  {idx + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {step.icon}
                    <h3 className="font-bold text-gray-900">{step.title}</h3>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{step.desc}</p>
                  <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-md uppercase tracking-wider">
                    {step.action}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comparison Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Environment Comparison</h2>
          <div className="overflow-hidden rounded-xl border border-gray-200">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-900 border-b border-gray-200">
                  <th className="p-4 text-left font-bold text-sm">Deployment Pillar</th>
                  <th className="p-4 text-left font-bold text-sm text-blue-600">Online Monitoring</th>
                  <th className="p-4 text-left font-bold text-sm text-indigo-600">Offline Surveillance</th>
                 </tr>
              </thead>
              <tbody className="text-sm">
                {[
                  { pillar: 'Connectivity', online: 'Broadband Required', offline: 'LAN / Local Edge Only' },
                  { pillar: 'Stability', online: 'Network Dependent', offline: 'Zero-Latency Local' },
                  { pillar: 'Detection Scope', online: 'Browser, Screen, Webcam', offline: 'Hall, Desk, Behavior' },
                  { pillar: 'Primary Threat', online: 'Remote Aids / Browser Search', offline: 'Physical Aids / Collusion' },
                  { pillar: 'Data Strategy', online: 'Cloud Storage & Processing', offline: 'On-Premise Privacy' },
                  { pillar: 'Hardware', online: 'Standard Student Webcam', offline: 'Campus CCTV / IP Cameras' }
                ].map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#F8FAFC]'}>
                    <td className="p-4 border-b border-gray-100 font-bold text-gray-800">{row.pillar}</td>
                    <td className="p-4 border-b border-gray-100 text-gray-600">{row.online}</td>
                    <td className="p-4 border-b border-gray-100 text-gray-600 font-medium">{row.offline}</td>
                   </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-br from-gray-900 to-blue-900 rounded-3xl shadow-2xl p-16 text-center text-white mb-20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-0 left-0 w-64 h-64 bg-blue-500 rounded-full blur-[100px]" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[100px]" />
          </div>
          <motion.div 
            className="relative z-10"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
          >
            <h2 className="text-4xl font-bold mb-6">Ready to Secure Your Physical Space?</h2>
            <p className="text-xl mb-10 opacity-80 max-w-2xl mx-auto">
              Configure your halls, link your surveillance hardware, and experience professional-grade AI proctoring on-site.
            </p>
            <div className="flex justify-center">
              <Link to="/dashboard">
                <button className="px-10 py-4 bg-white text-blue-900 rounded-xl font-bold text-lg hover:bg-gray-100 transition shadow-xl">
                  Get Started
                </button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
      
      <FooterSecond />
    </div>
  );
};

export default OfflineMode;