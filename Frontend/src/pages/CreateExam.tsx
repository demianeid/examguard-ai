import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, Clock, Calendar, Users, Shield, Eye, Camera, 
  Mic, Monitor, AlertCircle, Plus, Trash2, Settings, 
  Save, X, CheckCircle, Lock, Unlock, Brain, Video, ArrowLeft
} from 'lucide-react';

// Type definitions
interface ExamData {
  title: string;
  description: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  allowedAttempts: number;
  showResults: string;
  shuffleQuestions: boolean;
  shuffleAnswers: boolean;
}

interface ProctoringSettings {
  aiProctoring: boolean;
  liveProctoring: boolean;
  eyeTracking: boolean;
  multipleFaceDetection: boolean;
  speakerRecognition: boolean;
  recordAndReview: boolean;
  lockdownBrowser: boolean;
  objectDetection: boolean;
  idVerification: boolean;
  dualCamera: boolean;
  realTimeAlert: boolean;
  securityLevel: 'low' | 'medium' | 'high';
}

interface Question {
  id: number;
  type: string;
  question: string;
  points: number;
  options: string[];
  correctAnswer: number;
}

interface ToggleItemProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}

const CreateExamPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [examData, setExamData] = useState<ExamData>({
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

  const [proctoringSettings, setProctoringSettings] = useState<ProctoringSettings>({
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

  const [questions, setQuestions] = useState<Question[]>([]);
  const [showProctoringPanel, setShowProctoringPanel] = useState<boolean>(false);

  const handleBack = () => {
    navigate(-1);
  };

  const addQuestion = (): void => {
    setQuestions([...questions, {
      id: Date.now(),
      type: 'multiple-choice',
      question: '',
      points: 5,
      options: ['', '', '', ''],
      correctAnswer: 0
    }]);
  };

  const removeQuestion = (id: number): void => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const toggleProctoring = (setting: keyof ProctoringSettings): void => {
    setProctoringSettings({
      ...proctoringSettings,
      [setting]: !proctoringSettings[setting]
    });
  };

  const SecurityLevelIndicator: React.FC = () => {
    const level = proctoringSettings.securityLevel;
    const colors = {
      low: 'from-green-400 to-green-600',
      medium: 'from-yellow-400 to-orange-600',
      high: 'from-red-400 to-red-600'
    };
    return (
      <div 
        className={`bg-gradient-to-r ${colors[level]} text-white px-4 py-2 rounded-lg font-semibold text-sm`}
        aria-label={`Security Level: ${level.toUpperCase()}`}
      >
        Security Level: {level.toUpperCase()}
      </div>
    );
  };

  const StepIndicator: React.FC = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((step) => (
        <React.Fragment key={step}>
          <div 
            className={`flex items-center justify-center w-10 h-10 rounded-full font-bold transition-all ${
              currentStep >= step 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-500'
            }`}
            aria-label={`Step ${step} ${currentStep >= step ? 'completed' : 'not started'}`}
          >
            {step}
          </div>
          {step < 4 && (
            <div 
              className={`w-16 h-1 ${
                currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              aria-hidden="true"
            ></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const ToggleItem: React.FC<ToggleItemProps> = ({ icon, label, description, checked, onChange }) => (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
      <div className="flex items-start gap-3 flex-1">
        <div className="text-gray-600 mt-1" aria-hidden="true">{icon}</div>
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
          aria-label={`${label} - ${description}`}
        />
        <span className="absolute cursor-pointer inset-0 bg-gray-300 rounded-full transition peer-checked:bg-blue-600"></span>
        <span className="absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition peer-checked:translate-x-6"></span>
      </label>
    </div>
  );

  const ProctoringPanel: React.FC = () => (
    <motion.div 
      className={`fixed top-0 right-0 h-full w-96 bg-white shadow-2xl transform transition-transform duration-300 z-50 overflow-y-auto ${
        showProctoringPanel ? 'translate-x-0' : 'translate-x-full'
      }`}
      initial={{ x: '100%' }}
      animate={{ x: showProctoringPanel ? 0 : '100%' }}
      transition={{ duration: 0.3 }}
      role="dialog"
      aria-label="Proctoring Settings"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Shield className="text-blue-600" size={28} aria-hidden="true" />
            <h2 className="text-xl font-bold text-gray-800">Proctoring Settings</h2>
          </div>
          <button 
            onClick={() => setShowProctoringPanel(false)}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close proctoring settings"
          >
            <X size={24} aria-hidden="true" />
          </button>
        </div>

        <div className="mb-6">
          <SecurityLevelIndicator />
        </div>

        <div className="space-y-4">
          <section aria-labelledby="ai-features-heading">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 id="ai-features-heading" className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Brain size={20} className="text-blue-600" aria-hidden="true" />
                AI-Powered Features
              </h3>
              <div className="space-y-3">
                <ToggleItem 
                  icon={<Brain size={18} aria-hidden="true" />}
                  label="AI Proctoring"
                  description="Advanced behavioral analysis"
                  checked={proctoringSettings.aiProctoring}
                  onChange={() => toggleProctoring('aiProctoring')}
                />
                <ToggleItem 
                  icon={<Eye size={18} aria-hidden="true" />}
                  label="Eye Tracking"
                  description="Monitor gaze patterns"
                  checked={proctoringSettings.eyeTracking}
                  onChange={() => toggleProctoring('eyeTracking')}
                />
                <ToggleItem 
                  icon={<Users size={18} aria-hidden="true" />}
                  label="Multiple Face Detection"
                  description="Alert for multiple people"
                  checked={proctoringSettings.multipleFaceDetection}
                  onChange={() => toggleProctoring('multipleFaceDetection')}
                />
                <ToggleItem 
                  icon={<Monitor size={18} aria-hidden="true" />}
                  label="Object Detection"
                  description="Detect phones and books"
                  checked={proctoringSettings.objectDetection}
                  onChange={() => toggleProctoring('objectDetection')}
                />
              </div>
            </div>
          </section>

          <section aria-labelledby="recording-monitoring-heading">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 id="recording-monitoring-heading" className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Video size={20} className="text-purple-600" aria-hidden="true" />
                Recording & Monitoring
              </h3>
              <div className="space-y-3">
                <ToggleItem 
                  icon={<Video size={18} aria-hidden="true" />}
                  label="Live Proctoring"
                  description="Real-time human monitoring"
                  checked={proctoringSettings.liveProctoring}
                  onChange={() => toggleProctoring('liveProctoring')}
                />
                <ToggleItem 
                  icon={<Camera size={18} aria-hidden="true" />}
                  label="Record & Review"
                  description="Save session for later review"
                  checked={proctoringSettings.recordAndReview}
                  onChange={() => toggleProctoring('recordAndReview')}
                />
                <ToggleItem 
                  icon={<Camera size={18} aria-hidden="true" />}
                  label="Dual Camera"
                  description="Use webcam + phone camera"
                  checked={proctoringSettings.dualCamera}
                  onChange={() => toggleProctoring('dualCamera')}
                />
              </div>
            </div>
          </section>

          <section aria-labelledby="security-controls-heading">
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 id="security-controls-heading" className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Lock size={20} className="text-green-600" aria-hidden="true" />
                Security Controls
              </h3>
              <div className="space-y-3">
                <ToggleItem 
                  icon={<Lock size={18} aria-hidden="true" />}
                  label="Lockdown Browser"
                  description="Prevent tab switching"
                  checked={proctoringSettings.lockdownBrowser}
                  onChange={() => toggleProctoring('lockdownBrowser')}
                />
                <ToggleItem 
                  icon={<CheckCircle size={18} aria-hidden="true" />}
                  label="ID Verification"
                  description="Verify student identity"
                  checked={proctoringSettings.idVerification}
                  onChange={() => toggleProctoring('idVerification')}
                />
                <ToggleItem 
                  icon={<Mic size={18} aria-hidden="true" />}
                  label="Speaker Recognition"
                  description="Detect unauthorized voices"
                  checked={proctoringSettings.speakerRecognition}
                  onChange={() => toggleProctoring('speakerRecognition')}
                />
                <ToggleItem 
                  icon={<AlertCircle size={18} aria-hidden="true" />}
                  label="Real-time Alerts"
                  description="Instant violation notifications"
                  checked={proctoringSettings.realTimeAlert}
                  onChange={() => toggleProctoring('realTimeAlert')}
                />
              </div>
            </div>
          </section>

          <section aria-labelledby="security-level-heading">
            <div className="bg-gray-50 p-4 rounded-lg">
              <label id="security-level-heading" className="block text-sm font-semibold text-gray-700 mb-2">
                Security Level Preset
              </label>
              <select 
                value={proctoringSettings.securityLevel}
                onChange={(e) => setProctoringSettings({
                  ...proctoringSettings, 
                  securityLevel: e.target.value as 'low' | 'medium' | 'high'
                })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                aria-labelledby="security-level-heading"
              >
                <option value="low">Low - Basic Monitoring</option>
                <option value="medium">Medium - Standard Security</option>
                <option value="high">High - Maximum Security</option>
              </select>
            </div>
          </section>
        </div>
      </div>
    </motion.div>
  );

  const BasicInfoStep: React.FC = () => (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div>
        <label htmlFor="exam-title" className="block text-sm font-semibold text-gray-700 mb-2">Exam Title *</label>
        <input
          id="exam-title"
          type="text"
          value={examData.title}
          onChange={(e) => setExamData({...examData, title: e.target.value})}
          placeholder="e.g., Midterm Exam - Data Structures"
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-required="true"
        />
      </div>

      <div>
        <label htmlFor="exam-description" className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
        <textarea
          id="exam-description"
          value={examData.description}
          onChange={(e) => setExamData({...examData, description: e.target.value})}
          placeholder="Provide instructions and important notes for students..."
          rows={4}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="exam-duration" className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <Clock size={18} aria-hidden="true" />
            Duration (minutes) *
          </label>
          <input
            id="exam-duration"
            type="number"
            value={examData.duration}
            onChange={(e) => setExamData({...examData, duration: parseInt(e.target.value) || 0})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-required="true"
          />
        </div>

        <div>
          <label htmlFor="total-marks" className="block text-sm font-semibold text-gray-700 mb-2">Total Marks *</label>
          <input
            id="total-marks"
            type="number"
            value={examData.totalMarks}
            onChange={(e) => setExamData({...examData, totalMarks: parseInt(e.target.value) || 0})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-required="true"
          />
        </div>

        <div>
          <label htmlFor="passing-marks" className="block text-sm font-semibold text-gray-700 mb-2">Passing Marks *</label>
          <input
            id="passing-marks"
            type="number"
            value={examData.passingMarks}
            onChange={(e) => setExamData({...examData, passingMarks: parseInt(e.target.value) || 0})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-required="true"
          />
        </div>

        <div>
          <label htmlFor="allowed-attempts" className="block text-sm font-semibold text-gray-700 mb-2">Allowed Attempts</label>
          <input
            id="allowed-attempts"
            type="number"
            value={examData.allowedAttempts}
            onChange={(e) => setExamData({...examData, allowedAttempts: parseInt(e.target.value) || 0})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>
    </motion.div>
  );

  const SchedulingStep: React.FC = () => (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Calendar className="text-blue-600" size={24} aria-hidden="true" />
          <h3 className="font-semibold text-gray-800">Exam Availability Window</h3>
        </div>
        <p className="text-sm text-gray-600">Set when students can start and must finish the exam</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="start-date" className="block text-sm font-semibold text-gray-700 mb-2">Start Date *</label>
          <input
            id="start-date"
            type="date"
            value={examData.startDate}
            onChange={(e) => setExamData({...examData, startDate: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-required="true"
          />
        </div>

        <div>
          <label htmlFor="start-time" className="block text-sm font-semibold text-gray-700 mb-2">Start Time *</label>
          <input
            id="start-time"
            type="time"
            value={examData.startTime}
            onChange={(e) => setExamData({...examData, startTime: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-required="true"
          />
        </div>

        <div>
          <label htmlFor="end-date" className="block text-sm font-semibold text-gray-700 mb-2">End Date *</label>
          <input
            id="end-date"
            type="date"
            value={examData.endDate}
            onChange={(e) => setExamData({...examData, endDate: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-required="true"
          />
        </div>

        <div>
          <label htmlFor="end-time" className="block text-sm font-semibold text-gray-700 mb-2">End Time *</label>
          <input
            id="end-time"
            type="time"
            value={examData.endTime}
            onChange={(e) => setExamData({...examData, endTime: e.target.value})}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            aria-required="true"
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
              aria-label="Shuffle question order for each student"
            />
            <span className="text-gray-700">Shuffle question order for each student</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={examData.shuffleAnswers}
              onChange={(e) => setExamData({...examData, shuffleAnswers: e.target.checked})}
              className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              aria-label="Shuffle answer options"
            />
            <span className="text-gray-700">Shuffle answer options</span>
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="show-results" className="block text-sm font-semibold text-gray-700 mb-2">Show Results</label>
        <select
          id="show-results"
          value={examData.showResults}
          onChange={(e) => setExamData({...examData, showResults: e.target.value})}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-label="Select when to show exam results"
        >
          <option value="immediate">Immediately after submission</option>
          <option value="after-deadline">After exam deadline</option>
          <option value="manual">Manual release by instructor</option>
          <option value="never">Never show results</option>
        </select>
      </div>
    </motion.div>
  );

  const QuestionsStep: React.FC = () => {
    const updateQuestion = (id: number, field: string, value: any) => {
      setQuestions(questions.map(q => 
        q.id === id ? { ...q, [field]: value } : q
      ));
    };

    const updateOption = (questionId: number, optionIndex: number, value: string) => {
      setQuestions(questions.map(q => {
        if (q.id === questionId) {
          const newOptions = [...q.options];
          newOptions[optionIndex] = value;
          return { ...q, options: newOptions };
        }
        return q;
      }));
    };

    return (
      <motion.div 
        className="space-y-4"
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">Exam Questions</h3>
          <button
            onClick={addQuestion}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            aria-label="Add new question"
          >
            <Plus size={20} aria-hidden="true" />
            Add Question
          </button>
        </div>

        {questions.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <FileText className="mx-auto text-gray-400 mb-3" size={48} aria-hidden="true" />
            <p className="text-gray-600 mb-4">No questions added yet</p>
            <button
              onClick={addQuestion}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              aria-label="Add your first question"
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
                    aria-label={`Remove question ${index + 1}`}
                  >
                    <Trash2 size={20} aria-hidden="true" />
                  </button>
                </div>
                <div className="space-y-3">
                  <label htmlFor={`question-${q.id}`} className="sr-only">
                    Question {index + 1} text
                  </label>
                  <textarea
                    id={`question-${q.id}`}
                    value={q.question}
                    onChange={(e) => updateQuestion(q.id, 'question', e.target.value)}
                    placeholder="Enter your question here..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((opt, i) => (
                      <div key={i}>
                        <label htmlFor={`option-${q.id}-${i}`} className="sr-only">
                          Option {i + 1} for question {index + 1}
                        </label>
                        <input
                          id={`option-${q.id}-${i}`}
                          type="text"
                          value={opt}
                          onChange={(e) => updateOption(q.id, i, e.target.value)}
                          placeholder={`Option ${i + 1}`}
                          className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-4">
                    <label htmlFor={`points-${q.id}`} className="text-sm text-gray-700">Points:</label>
                    <input
                      id={`points-${q.id}`}
                      type="number"
                      value={q.points}
                      onChange={(e) => updateQuestion(q.id, 'points', parseInt(e.target.value) || 0)}
                      className="w-20 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <label htmlFor={`correct-answer-${q.id}`} className="text-sm text-gray-700">Correct Answer:</label>
                    <select 
                      id={`correct-answer-${q.id}`}
                      value={q.correctAnswer}
                      onChange={(e) => updateQuestion(q.id, 'correctAnswer', parseInt(e.target.value))}
                      className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      aria-label={`Select correct answer for question ${index + 1}`}
                    >
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
      </motion.div>
    );
  };

  const ReviewStep: React.FC = () => {
    const activeFeatures = Object.entries(proctoringSettings)
      .filter(([key, value]) => value === true && key !== 'securityLevel')
      .map(([key]) => key.replace(/([A-Z])/g, ' $1').trim());

    return (
      <motion.div 
        className="space-y-6"
        initial={{ opacity: 0, x: 100 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3 mb-3">
            <CheckCircle className="text-green-600" size={32} aria-hidden="true" />
            <h3 className="text-xl font-bold text-gray-800">Review Your Exam</h3>
          </div>
          <p className="text-gray-600">Please review all details before publishing the exam</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <FileText size={20} className="text-blue-600" aria-hidden="true" />
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
              <Calendar size={20} className="text-purple-600" aria-hidden="true" />
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
            <Shield size={20} className="text-blue-600" aria-hidden="true" />
            Proctoring Configuration
          </h4>
          <div className="mb-3">
            <SecurityLevelIndicator />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {activeFeatures.map((feature, i) => (
              <div key={i} className="bg-green-50 text-green-700 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2">
                <CheckCircle size={14} aria-hidden="true" />
                {feature}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-yellow-600 flex-shrink-0" size={24} aria-hidden="true" />
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
      </motion.div>
    );
  };

  return (
    <motion.div 
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Header مع زر Back */}
        <motion.div 
          className="bg-white rounded-xl shadow-md p-6 mb-6"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors p-2 rounded-lg hover:bg-gray-100"
                aria-label="Go back"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Create New Exam</h1>
                <p className="text-gray-600">Set up your exam with anti-cheating measures</p>
              </div>
            </div>
            <button
              onClick={() => setShowProctoringPanel(!showProctoringPanel)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-md"
              aria-label={showProctoringPanel ? "Close proctoring settings" : "Open proctoring settings"}
            >
              <Shield size={20} aria-hidden="true" />
              Proctoring Settings
              {showProctoringPanel ? <X size={18} aria-hidden="true" /> : <Settings size={18} aria-hidden="true" />}
            </button>
          </div>
        </motion.div>

        {/* Progress Steps */}
        <motion.div 
          className="bg-white rounded-xl shadow-md p-6 mb-6"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <StepIndicator />
          <div className="flex justify-center gap-2 text-sm">
            <span className={currentStep >= 1 ? 'text-blue-600 font-semibold' : 'text-gray-500'}>Basic Info</span>
            <span className="text-gray-400" aria-hidden="true">→</span>
            <span className={currentStep >= 2 ? 'text-blue-600 font-semibold' : 'text-gray-500'}>Scheduling</span>
            <span className="text-gray-400" aria-hidden="true">→</span>
            <span className={currentStep >= 3 ? 'text-blue-600 font-semibold' : 'text-gray-500'}>Questions</span>
            <span className="text-gray-400" aria-hidden="true">→</span>
            <span className={currentStep >= 4 ? 'text-blue-600 font-semibold' : 'text-gray-500'}>Review</span>
          </div>
        </motion.div>

        {/* Main Content */}
        <motion.div 
          className="bg-white rounded-xl shadow-md p-6 mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          {currentStep === 1 && <BasicInfoStep />}
          {currentStep === 2 && <SchedulingStep />}
          {currentStep === 3 && <QuestionsStep />}
          {currentStep === 4 && <ReviewStep />}
        </motion.div>

        {/* Navigation Buttons */}
        <motion.div 
          className="flex items-center justify-between"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <button
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
              currentStep === 1
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
            aria-label="Go to previous step"
          >
            Previous
          </button>

          <div className="flex gap-3">
            <button
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              aria-label="Save exam as draft"
            >
              Save as Draft
            </button>
            
            {currentStep < 4 ? (
              <button
                onClick={() => setCurrentStep(Math.min(4, currentStep + 1))}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
                aria-label="Go to next step"
              >
                Next Step
                <CheckCircle size={20} aria-hidden="true" />
              </button>
            ) : (
              <button
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-semibold hover:from-green-600 hover:to-green-700 transition-all flex items-center gap-2 shadow-md"
                aria-label="Publish exam"
              >
                <Save size={20} aria-hidden="true" />
                Publish Exam
              </button>
            )}
          </div>
        </motion.div>

        {/* Proctoring Panel */}
        <ProctoringPanel />

        {/* Backdrop */}
        {showProctoringPanel && (
          <motion.div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowProctoringPanel(false)}
            aria-hidden="true"
          ></motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default CreateExamPage;