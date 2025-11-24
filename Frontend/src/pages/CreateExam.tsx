import React, { useState } from 'react';
import { 
  FileText, Clock, Calendar, Users, Shield, Eye, Camera, 
  Mic, Monitor, AlertCircle, Plus, Trash2, Settings, 
  Save, X, CheckCircle, Lock, Unlock, Brain, Video
} from 'lucide-react';

const CreateExamPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [examData, setExamData] = useState({
    title: '',
    description: '',
    duration: 60,
    totalMarks: 100,
    passingMarks: 50,
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    allowedAttempts: 1,
    showResults: 'immediate',
    shuffleQuestions: false,
    shuffleAnswers: false,
  });

  const [proctoringSettings, setProctoringSettings] = useState({
    aiProctoring: true,
    liveProctoring: false,
    eyeTracking: true,
    multipleFaceDetection: true,
    speakerRecognition: false,
    recordAndReview: true,
    lockdownBrowser: true,
    objectDetection: false,
    idVerification: true,
    dualCamera: false,
    realTimeAlert: true,
    securityLevel: 'medium'
  });

  const [questions, setQuestions] = useState([]);
  const [showProctoringPanel, setShowProctoringPanel] = useState(false);

  const addQuestion = () => {
    setQuestions([...questions, {
      id: Date.now(),
      type: 'multiple-choice',
      question: '',
      points: 5,
      options: ['', '', '', ''],
      correctAnswer: 0
    }]);
  };

  const removeQuestion = (id) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const toggleProctoring = (setting) => {
    setProctoringSettings({
      ...proctoringSettings,
      [setting]: !proctoringSettings[setting]
    });
  };

  const SecurityLevelIndicator = () => {
    const level = proctoringSettings.securityLevel;
    const colors = {
      low: 'from-green-400 to-green-600',
      medium: 'from-yellow-400 to-orange-600',
      high: 'from-red-400 to-red-600'
    };
    return (
      <div className={`bg-gradient-to-r ${colors[level]} text-white px-4 py-2 rounded-lg font-semibold text-sm`}>
        Security Level: {level.toUpperCase()}
      </div>
    );
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((step) => (
        <React.Fragment key={step}>
          <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all ${
            currentStep >= step 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-500'
          }`}>
            {step}
          </div>
          {step < 4 && (
            <div className={`w-16 h-1 ${
              currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
            }`}></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const ProctoringPanel = () => (
    <div className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 z-50 overflow-y-auto ${
      showProctoringPanel ? 'translate-x-0' : 'translate-x-full'
    }`}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield className="text-blue-600" size={28} />
            <h2 className="text-xl font-bold text-gray-800">Proctoring Settings</h2>
          </div>
          <button 
            onClick={() => setShowProctoringPanel(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-6">
          <SecurityLevelIndicator />
        </div>

        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Brain size={20} className="text-blue-600" />
              AI-Powered Features
            </h3>
            <div className="space-y-3">
              <ToggleItem 
                icon={<Brain size={18} />}
                label="AI Proctoring"
                description="Advanced behavioral analysis"
                checked={proctoringSettings.aiProctoring}
                onChange={() => toggleProctoring('aiProctoring')}
              />
              <ToggleItem 
                icon={<Eye size={18} />}
                label="Eye Tracking"
                description="Monitor gaze patterns"
                checked={proctoringSettings.eyeTracking}
                onChange={() => toggleProctoring('eyeTracking')}
              />
              <ToggleItem 
                icon={<Users size={18} />}
                label="Multiple Face Detection"
                description="Alert for multiple people"
                checked={proctoringSettings.multipleFaceDetection}
                onChange={() => toggleProctoring('multipleFaceDetection')}
              />
              <ToggleItem 
                icon={<Monitor size={18} />}
                label="Object Detection"
                description="Detect phones and books"
                checked={proctoringSettings.objectDetection}
                onChange={() => toggleProctoring('objectDetection')}
              />
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Video size={20} className="text-purple-600" />
              Recording & Monitoring
            </h3>
            <div className="space-y-3">
              <ToggleItem 
                icon={<Video size={18} />}
                label="Live Proctoring"
                description="Real-time human monitoring"
                checked={proctoringSettings.liveProctoring}
                onChange={() => toggleProctoring('liveProctoring')}
              />
              <ToggleItem 
                icon={<Camera size={18} />}
                label="Record & Review"
                description="Save session for later review"
                checked={proctoringSettings.recordAndReview}
                onChange={() => toggleProctoring('recordAndReview')}
              />
              <ToggleItem 
                icon={<Camera size={18} />}
                label="Dual Camera"
                description="Use webcam + phone camera"
                checked={proctoringSettings.dualCamera}
                onChange={() => toggleProctoring('dualCamera')}
              />
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Lock size={20} className="text-green-600" />
              Security Controls
            </h3>
            <div className="space-y-3">
              <ToggleItem 
                icon={<Lock size={18} />}
                label="Lockdown Browser"
                description="Prevent tab switching"
                checked={proctoringSettings.lockdownBrowser}
                onChange={() => toggleProctoring('lockdownBrowser')}
              />
              <ToggleItem 
                icon={<CheckCircle size={18} />}
                label="ID Verification"
                description="Verify student identity"
                checked={proctoringSettings.idVerification}
                onChange={() => toggleProctoring('idVerification')}
              />
              <ToggleItem 
                icon={<Mic size={18} />}
                label="Speaker Recognition"
                description="Detect unauthorized voices"
                checked={proctoringSettings.speakerRecognition}
                onChange={() => toggleProctoring('speakerRecognition')}
              />
              <ToggleItem 
                icon={<AlertCircle size={18} />}
                label="Real-time Alerts"
                description="Instant violation notifications"
                checked={proctoringSettings.realTimeAlert}
                onChange={() => toggleProctoring('realTimeAlert')}
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Security Level Preset
            </label>
            <select 
              value={proctoringSettings.securityLevel}
              onChange={(e) => setProctoringSettings({...proctoringSettings, securityLevel: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="low">Low - Basic Monitoring</option>
              <option value="medium">Medium - Standard Security</option>
              <option value="high">High - Maximum Security</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  const ToggleItem = ({ icon, label, description, checked, onChange }) => (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
      <div className="flex items-start gap-3 flex-1">
        <div className="text-gray-600 mt-1">{icon}</div>
        <div className="flex-1">
          <p className="font-medium text-gray-800 text-sm">{label}</p>
          <p className="text-xs text-gray-500">{description}</p>
        </div>
      </div>
      <label className="relative inline-block w-12 h-6 flex-shrink-0">
        <input 
          type="checkbox" 
          className="peer sr-only" 
          checked={checked}
          onChange={onChange}
        />
        <span className="absolute cursor-pointer inset-0 bg-gray-300 rounded-full transition peer-checked:bg-blue-600"></span>
        <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition peer-checked:translate-x-6"></span>
      </label>
    </div>
  );

  const BasicInfoStep = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Exam Title *</label>
        <input
          type="text"
          value={examData.title}
          onChange={(e) => setExamData({...examData, title: e.target.value})}
          placeholder="e.g., Midterm Exam - Data Structures"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
        <textarea
          value={examData.description}
          onChange={(e) => setExamData({...examData, description: e.target.value})}
          placeholder="Provide instructions and important notes for students..."
          rows="4"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Clock size={18} />
            Duration (minutes) *
          </label>
          <input
            type="number"
            value={examData.duration}
            onChange={(e) => setExamData({...examData, duration: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Total Marks *</label>
          <input
            type="number"
            value={examData.totalMarks}
            onChange={(e) => setExamData({...examData, totalMarks: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Passing Marks *</label>
          <input
            type="number"
            value={examData.passingMarks}
            onChange={(e) => setExamData({...examData, passingMarks: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Allowed Attempts</label>
          <input
            type="number"
            value={examData.allowedAttempts}
            onChange={(e) => setExamData({...examData, allowedAttempts: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </div>
  );

  const SchedulingStep = () => (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="text-blue-600" size={24} />
          <h3 className="font-semibold text-gray-800">Exam Availability Window</h3>
        </div>
        <p className="text-sm text-gray-600">Set when students can start and must finish the exam</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date *</label>
          <input
            type="date"
            value={examData.startDate}
            onChange={(e) => setExamData({...examData, startDate: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time *</label>
          <input
            type="time"
            value={examData.startTime}
            onChange={(e) => setExamData({...examData, startTime: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">End Date *</label>
          <input
            type="date"
            value={examData.endDate}
            onChange={(e) => setExamData({...examData, endDate: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">End Time *</label>
          <input
            type="time"
            value={examData.endTime}
            onChange={(e) => setExamData({...examData, endTime: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold text-gray-800 mb-4">Additional Settings</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={examData.shuffleQuestions}
              onChange={(e) => setExamData({...examData, shuffleQuestions: e.target.checked})}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-700">Shuffle question order for each student</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={examData.shuffleAnswers}
              onChange={(e) => setExamData({...examData, shuffleAnswers: e.target.checked})}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-700">Shuffle answer options</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Show Results</label>
        <select
          value={examData.showResults}
          onChange={(e) => setExamData({...examData, showResults: e.target.value})}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="immediate">Immediately after submission</option>
          <option value="after-deadline">After exam deadline</option>
          <option value="manual">Manual release by instructor</option>
          <option value="never">Never show results</option>
        </select>
      </div>
    </div>
  );

  const QuestionsStep = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Exam Questions</h3>
        <button
          onClick={addQuestion}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Question
        </button>
      </div>

      {questions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <FileText className="mx-auto text-gray-400 mb-3" size={48} />
          <p className="text-gray-600 mb-4">No questions added yet</p>
          <button
            onClick={addQuestion}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Add Your First Question
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, index) => (
            <div key={q.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between mb-4">
                <h4 className="font-semibold text-gray-800">Question {index + 1}</h4>
                <button
                  onClick={() => removeQuestion(q.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 size={20} />
                </button>
              </div>
              <div className="space-y-3">
                <textarea
                  placeholder="Enter your question here..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="3"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {q.options.map((opt, i) => (
                    <input
                      key={i}
                      type="text"
                      placeholder={`Option ${i + 1}`}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  ))}
                </div>
                <div className="flex items-center gap-4">
                  <label className="text-sm text-gray-700">Points:</label>
                  <input
                    type="number"
                    defaultValue={q.points}
                    className="w-20 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="text-sm text-gray-700">Correct Answer:</label>
                  <select className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="0">Option 1</option>
                    <option value="1">Option 2</option>
                    <option value="2">Option 3</option>
                    <option value="3">Option 4</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const ReviewStep = () => {
    const activeFeatures = Object.entries(proctoringSettings)
      .filter(([key, value]) => value === true && key !== 'securityLevel')
      .map(([key]) => key.replace(/([A-Z])/g, ' $1').trim());

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="text-green-600" size={32} />
            <h3 className="text-xl font-bold text-gray-800">Review Your Exam</h3>
          </div>
          <p className="text-gray-600">Please review all details before publishing the exam</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FileText size={20} className="text-blue-600" />
              Basic Information
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Title:</span>
                <span className="font-medium">{examData.title || 'Not set'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Duration:</span>
                <span className="font-medium">{examData.duration} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Marks:</span>
                <span className="font-medium">{examData.totalMarks}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Questions:</span>
                <span className="font-medium">{questions.length}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Calendar size={20} className="text-purple-600" />
              Schedule
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Start:</span>
                <span className="font-medium">{examData.startDate} {examData.startTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">End:</span>
                <span className="font-medium">{examData.endDate} {examData.endTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Show Results:</span>
                <span className="font-medium">{examData.showResults}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Shield size={20} className="text-blue-600" />
            Proctoring Configuration
          </h4>
          <div className="mb-3">
            <SecurityLevelIndicator />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {activeFeatures.map((feature, i) => (
              <div key={i} className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2">
                <CheckCircle size={14} />
                {feature}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-yellow-600 flex-shrink-0" size={24} />
            <div>
              <h4 className="font-semibold text-gray-800 mb-1">Important Notes</h4>
              <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside">
                <li>Students will be notified about this exam via email</li>
                <li>Proctoring features will be active during the exam</li>
                <li>You can edit exam details until the start time</li>
                <li>All violations will be recorded for review</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Create New Exam</h1>
              <p className="text-gray-600">Set up your exam with anti-cheating measures</p>
            </div>
            <button
              onClick={() => setShowProctoringPanel(!showProctoringPanel)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
            >
              <Shield size={20} />
              Proctoring Settings
              {showProctoringPanel ? <X size={18} /> : <Settings size={18} />}
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <StepIndicator />
          <div className="flex justify-center gap-2 text-sm">
            <span className={currentStep >= 1 ? 'text-blue-600 font-semibold' : 'text-gray-500'}>Basic Info</span>
            <span className="text-gray-400">→</span>
            <span className={currentStep >= 2 ? 'text-blue-600 font-semibold' : 'text-gray-500'}>Scheduling</span>
            <span className="text-gray-400">→</span>
            <span className={currentStep >= 3 ? 'text-blue-600 font-semibold' : 'text-gray-500'}>Questions</span>
            <span className="text-gray-400">→</span>
            <span className={currentStep >= 4 ? 'text-blue-600 font-semibold' : 'text-gray-500'}>Review</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          {currentStep === 1 && <BasicInfoStep />}
          {currentStep === 2 && <SchedulingStep />}
          {currentStep === 3 && <QuestionsStep />}
          {currentStep === 4 && <ReviewStep />}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              currentStep === 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
          >
            Previous
          </button>

          <div className="flex gap-3">
            <button
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              Save as Draft
            </button>
            
            {currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                Next Step
                <CheckCircle size={20} />
              </button>
            ) : (
              <button
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center gap-2 shadow-md"
              >
                <Save size={20} />
                Publish Exam
              </button>
            )}
          </div>
        </div>

        {/* Proctoring Panel */}
        <ProctoringPanel />

        {/* Backdrop */}
        {showProctoringPanel && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowProctoringPanel(false)}
          ></div>
        )}
      </div>
    </div>
  );
};

export default CreateExamPage;