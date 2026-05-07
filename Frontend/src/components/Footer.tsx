import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-p1 py-12 md:py-10 px-4" id="contact">
      <div className="max-w-[1200px] mx-auto">
        <div className="flex flex-wrap -mx-4">
          {/* Brand Section */}
          <div className="w-full md:w-1/2 lg:w-1/4 px-4 mb-8 md:mb-6">
            <div>
              <div className="flex items-center mb-3">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-white mr-2"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
                <h4 className="text-white font-semibold text-lg mb-0">ExamGuard</h4>
              </div>
              <p className="text-white/70 text-sm mb-3">
                The most advanced and secure online exam monitoring system, designed to ensure the integrity of digital education.
              </p>
              <div className="flex gap-2">
                {/* Facebook */}
                <a
                  href="#"
                  aria-label="Facebook"
                  className="w-9 h-9 flex items-center justify-center rounded-md border border-white/30 text-white transition-all hover:bg-white/20 hover:-translate-y-1"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                  </svg>
                </a>
                {/* LinkedIn */}
                <a
                  href="#"
                  aria-label="LinkedIn"
                  className="w-9 h-9 flex items-center justify-center rounded-md border border-white/30 text-white transition-all hover:bg-white/20 hover:-translate-y-1"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/>
                    <circle cx="4" cy="4" r="2"/>
                  </svg>
                </a>
                {/* WhatsApp */}
                <a
                  href="#"
                  aria-label="WhatsApp"
                  className="w-9 h-9 flex items-center justify-center rounded-md border border-white/30 text-white transition-all hover:bg-white/20 hover:-translate-y-1"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* About Us */}
          <div className="w-full md:w-1/2 lg:w-1/4 px-4 mb-8 md:mb-6">
            <h5 className="text-white font-semibold mb-3">About us</h5>
            <p className="text-white/70 text-sm">We're a small team building AI tools for students.</p>
          </div>

          {/* Our Services */}
          <div className="w-full md:w-1/2 lg:w-1/4 px-4 mb-8 md:mb-6">
            <h5 className="text-white font-semibold mb-3">Our Services</h5>
            <ul className="space-y-2">
              {["Exam Monitoring", "Facial Recognition", "Behavior Analysis", "Reports & Analytics", "Platform Integration"].map((item, idx) => (
                <li key={idx}>
                  <a href="#" className="text-white/70 text-sm hover:underline">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Us */}
          <div className="w-full md:w-1/2 lg:w-1/4 px-4 mb-8 md:mb-6">
            <h5 className="text-white font-semibold mb-3">Contact Us</h5>
            <div className="flex flex-col gap-3">
              <a href="mailto:info@examguard.com" className="flex items-center gap-2 text-white/70 text-sm hover:underline">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                info@examguard.com
              </a>
              <a href="tel:01210770521" className="flex items-center gap-2 text-white/70 text-sm hover:underline">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                01210770521
              </a>
              <Link to="/contact" state={{ hideHeader: true }} className="text-white/70 text-sm hover:underline">More options...</Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/25 mt-8 pt-4 flex flex-col md:flex-row items-center justify-between text-center md:text-left">
          <p className="text-white/70 text-sm mb-2 md:mb-0">© 2026 ExamGuard. All rights reserved.</p>
          <div className="flex flex-wrap gap-3 justify-center md:justify-end">
            {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item, idx) => (
              <a key={idx} href="#" className="text-white/70 text-sm hover:underline">
                {item}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export const FooterSecond = () => {
  return (
    <div className="border-t border-gray-300 pt-4 flex flex-col md:flex-row items-center justify-between text-center md:text-left bg-transparent px-8 pb-4">
      <div className="mb-2 md:mb-0">
        <p className="text-gray-900 font-bold text-lg">
          ExamGuard<span className="text-blue-600"> AI</span>
        </p>
        <p className="text-gray-500 text-sm">© 2026 ExamGuard. All rights reserved.</p>
      </div>
      <div className="flex flex-wrap gap-6 justify-center md:justify-end">
        {["Privacy Policy", "Terms of Service", "Cookie Policy"].map((item, idx) => (
          <a
            key={idx}
            href="#"
            className="text-gray-500 text-sm font-medium hover:text-blue-600 transition-colors"
          >
            {item}
          </a>
        ))}
      </div>
    </div>
  );
};

export default Footer;
