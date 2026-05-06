import React from "react";
import Header from '../components/Header';
import HowWork from '../components/HowItWorks';
import { useUser } from '../context/UserContext';
import { FooterSecond } from "../components/Footer";

const HowItWorks: React.FC = () => {
  const { userType } = useUser();

  return (
    <div className="w-full min-h-screen bg-[#E3F0FE] flex flex-col">
      <Header 
        showAccount={true} 
        isRegistered={true} 
        userType={userType}
      />
      
      <div className="pt-20 flex-grow flex items-center w-full">
        <div className="w-full">
          <HowWork bgColor="bg-[#E3F0FE]" />
        </div>
      </div>

      <FooterSecond />
    </div>
  );
};

export default HowItWorks;