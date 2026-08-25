// pages/FaceRecognition.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  CheckCircle, 
  AlertCircle, 
  Loader, 
  Shield, 
  X, 
  RefreshCw,
  Info
} from 'lucide-react';

interface FaceRecognitionProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  examId?: number;
  className?: string;
  studentId?: string;
}

const FaceRecognition: React.FC<FaceRecognitionProps> = ({ 
  onSuccess, 
  onCancel, 
  examId,
  className,
  studentId 
}) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'verifying' | 'success' | 'failed'>('idle');
  const [error, setError] = useState<string>('');
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [verificationMessage, setVerificationMessage] = useState('');

  // Default handlers if props not provided
  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    } else {
      // Default behavior: go to next step
      navigate('/StartExam');
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      // Default behavior: go back
      navigate(-1);
    }
  };

  // Rest of your component code...
  // Replace all calls to onSuccess() with handleSuccess()
  // Replace all calls to onCancel() with handleCancel()

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [selectedDevice]);

  const startCamera = async () => {
    try {
      const constraints = {
        video: {
          deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
        setCameraPermission(true);
        
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setDevices(videoDevices);
        if (!selectedDevice && videoDevices.length > 0) {
          setSelectedDevice(videoDevices[0].deviceId);
        }
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setCameraPermission(false);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setCameraActive(false);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageData);
        
        simulateFaceDetection(imageData);
      }
    }
  };

  const simulateFaceDetection = (imageData: string) => {
    setVerificationStatus('verifying');
    setVerificationMessage('Verifying identity...');
    
    setTimeout(() => {
      const randomSuccess = Math.random() < 0.9;
      
      if (randomSuccess) {
        setVerificationStatus('success');
        setVerificationMessage('Verification successful!');
        
        setTimeout(() => {
          handleSuccess(); // Use the handler
        }, 1500);
      } else {
        setVerificationStatus('failed');
        setVerificationMessage('Face not recognized. Please try again.');
      }
    }, 2000);
  };

  const retryVerification = () => {
    setVerificationStatus('idle');
    setCapturedImage(null);
    setError('');
  };

  const switchCamera = () => {
    const currentIndex = devices.findIndex(d => d.deviceId === selectedDevice);
    const nextIndex = (currentIndex + 1) % devices.length;
    setSelectedDevice(devices[nextIndex].deviceId);
  };

  if (cameraPermission === false) {
    return (
      <div className="bg-white rounded-xl shadow-xl p-8 max-w-md mx-auto">
        <div className="text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Camera Permission Required</h3>
          <p className="text-gray-600 mb-6">
            We need access to your camera to verify your identity before starting the exam.
          </p>
          <button
            onClick={startCamera}
            className="bg-gradient-to-r from-[#1A80F6] to-[#4A90E2] text-white px-6 py-3 rounded-lg hover:from-[#0E6AD0] hover:to-[#3A80D2] transition-all duration-200"
          >
            Allow Camera Access
          </button>
          <button
            onClick={handleCancel} // Use the handler
            className="block w-full mt-3 text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-xl overflow-hidden max-w-2xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1A80F6] to-[#4A90E2] text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6" />
            <h2 className="text-xl font-bold">Face Verification</h2>
          </div>
          <button title='close' onClick={handleCancel} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-blue-100 text-sm mt-1">
          Please ensure good lighting and that your face is clearly visible
        </p>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <AnimatePresence mode="wait">
          {verificationStatus === 'idle' && !capturedImage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Camera Preview */}
              <div className="relative rounded-lg overflow-hidden bg-gray-900 aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Face Detection Overlay */}
                <div className="absolute inset-0 border-2 border-dashed border-white/30 rounded-lg m-4">
                  <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    Your face here
                  </div>
                </div>

                {/* Camera Controls Overlay */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                  {devices.length > 1 && (
                    <button title='switch camera'
                      onClick={switchCamera}
                      className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                    >
                      <RefreshCw className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Verification Guidelines:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                      <li>Ensure good lighting on your face</li>
                      <li>Avoid cluttered backgrounds</li>
                      <li>Remove sunglasses if you're wearing them</li>
                      <li>Stay still while capturing the image</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={captureImage}
                className="w-full bg-gradient-to-r from-[#1A80F6] to-[#4A90E2] text-white py-3 rounded-lg font-semibold hover:from-[#0E6AD0] hover:to-[#3A80D2] transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Capture Image for Verification
              </button>
            </motion.div>
          )}

          {verificationStatus === 'verifying' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="relative">
                <div className="w-24 h-24 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-200"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
                </div>
                <Loader className="w-8 h-8 text-blue-600 mx-auto animate-spin absolute top-8 left-1/2 -translate-x-1/2" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                {verificationMessage || 'Verifying identity...'}
              </h3>
              <p className="text-gray-600">
                Please wait while we process your image
              </p>
            </motion.div>
          )}

          {verificationStatus === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Verification Successful!
              </h3>
              <p className="text-gray-600 mb-4">
                Redirecting to exam page...
              </p>
              <div className="w-48 h-2 bg-gray-200 rounded-full mx-auto overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.5 }}
                  className="h-full bg-gradient-to-r from-[#1A80F6] to-[#4A90E2]"
                />
              </div>
            </motion.div>
          )}

          {verificationStatus === 'failed' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8"
            >
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-red-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Verification Failed
              </h3>
              <p className="text-gray-600 mb-6">
                {verificationMessage || 'Face not recognized. Please try again.'}
              </p>
              
              {capturedImage && (
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-2">Captured image:</p>
                  <img 
                    src={capturedImage} 
                    alt="Captured" 
                    className="w-48 h-48 object-cover rounded-lg mx-auto border-2 border-gray-300"
                  />
                </div>
              )}

              <div className="flex gap-3 justify-center">
                <button
                  onClick={retryVerification}
                  className="bg-gradient-to-r from-[#1A80F6] to-[#4A90E2] text-white px-6 py-2 rounded-lg hover:from-[#0E6AD0] hover:to-[#3A80D2] transition-all duration-200 flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
                <button
                  onClick={handleCancel} // Use the handler
                  className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hidden canvas for image capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default FaceRecognition;