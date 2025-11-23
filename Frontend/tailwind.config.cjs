/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#176ADA",    // الأزرق الأساسي
        secondary: "#1D7EF8",  // الأزرق الفاتح
        Tertiary:"#3DA5FA",
        Quaternary:"#61B5FB",
        Quinary:"#8EC9FC",
        Senary:"#BBDDFD",
        background:"#E3F0FE", // background

        st:"#3D93DA",

       
        accent: "#FACC15",     // أصفر تحفيزي
        background: "#E3F0FE", // خلفية عامة فاتحة
        dark: "#0F172A",       // غامق (للداشبورد)
        light: "#FFFFFF",      // أبيض نقي
        danger: "#DC2626",     // أحمر للتحذيرات
        success: "#16A34A",    // أخضر للنجاح
      },
    },
  },
  plugins: [],
};


