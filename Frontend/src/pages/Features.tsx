import React from "react";
import Header from "../components/Header";
import FeaturesSection from "../components/Features";
import { FooterSecond } from "../components/Footer";

const Features = () => {
  const isRegistered = !!localStorage.getItem("access_token") && localStorage.getItem("access_token") !== "null";

  return (
    <div className="w-full min-h-screen bg-background">
      <Header showAccount={isRegistered} isRegistered={isRegistered} />
      
      <div className="pt-2">
        <FeaturesSection showOverview={false} isRegistered={isRegistered} />
      </div>

      <FooterSecond />
    </div>
  );
};

export default Features;
