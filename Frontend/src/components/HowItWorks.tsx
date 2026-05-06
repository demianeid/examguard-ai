import React from "react";
import { motion } from "framer-motion";

const HowWork = ({ bgColor = "bg-[#F1F8FF]" }: { bgColor?: string }) => {
  const steps = [
    {
      number: 1,
      title: "Identity Verification",
      description:
        "Student registers and activates camera to verify identity using facial recognition technology",
    },
    {
      number: 2,
      title: "Start Monitoring",
      description:
        "All monitoring systems are activated: camera, microphone, screen recording, and eye tracking",
    },
    {
      number: 3,
      title: "Detection & Alerts",
      description:
        "System continuously monitors behavior and sends instant alerts when suspicious activity is detected",
    },
    {
      number: 4,
      title: "Final Report",
      description:
        "After exam completion, a comprehensive report is generated containing all events and alerts",
    },
  ];

  return (
    <div className={`${bgColor} py-12 `} id="howitworks">
      <div className="max-w-[1200px] mx-auto px-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            How Does the System Work?
          </h2>
          <p className="text-gray-500">
            A simple and secure process that ensures exam integrity from start
            to finish
          </p>
        </motion.div>

        <div className="lg:flex lg:gap-12 items-center">
          {/* Left Side - Steps */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="lg:w-1/2 flex flex-col gap-6 mb-8 lg:mb-0"
          >
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ delay: index * 0.3, duration: 0.8, ease: "easeOut" }}
                className="flex items-start gap-4"
              >
                {/* Number Badge */}
                <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 bg-blue-600 text-white font-bold text-lg rounded-full">
                  {step.number}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h5 className="text-gray-900 font-semibold text-lg">
                      {step.title}
                    </h5>
                  </div>
                  <p className="text-gray-500 text-sm">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Right Side - Image */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="lg:w-1/2"
          >
            <div className="relative">
              <img
                src="images/cct.png"
                alt="Security Camera Monitoring"
                className="w-full h-auto max-h-[500px] object-cover rounded-lg shadow-lg"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default HowWork;
