'use client';

import { useState } from 'react';
import FileUpload from '@/components/FileUpload';
import AssessmentDashboard from '@/components/AssessmentDashboard';
import AssessmentForm from '@/components/AssessmentForm';
import ProgressTracker from '@/components/ProgressTracker';

type ViewMode = 'upload' | 'form' | 'processing' | 'results';

export default function AssessmentPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('upload');
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [uploadedDocumentId, setUploadedDocumentId] = useState<string | null>(null);
  const [processingStatus, setProcessingStatus] = useState({
    stage: '',
    progress: 0,
    message: ''
  });

  const handleFileUploadComplete = (documentId: string) => {
    setUploadedDocumentId(documentId);
    setViewMode('form');
  };

  const handleAssessmentStart = async (_data: { project_title: string; description: string; technical_field?: string }) => {
    setViewMode('processing');
    setProcessingStatus({
      stage: 'Analyzing document',
      progress: 25,
      message: 'Extracting text and identifying technical features...'
    });

    try {
      // Simulate processing stages
      setTimeout(() => {
        setProcessingStatus({
          stage: 'AI Analysis',
          progress: 50,
          message: 'Running patent assessment with GPT-4...'
        });
      }, 2000);

      setTimeout(() => {
        setProcessingStatus({
          stage: 'Prior Art Search',
          progress: 75,
          message: 'Searching patent databases for similar inventions...'
        });
      }, 4000);

      setTimeout(() => {
        setProcessingStatus({
          stage: 'Generating Report',
          progress: 90,
          message: 'Compiling assessment results and recommendations...'
        });
      }, 6000);

      // In real implementation, this would be an API call
      setTimeout(() => {
        setAssessmentId('mock-assessment-123');
        setViewMode('results');
      }, 8000);

    } catch (error) {
      console.error('Assessment failed:', error);
      setProcessingStatus({
        stage: 'Error',
        progress: 0,
        message: 'Assessment failed. Please try again.'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Patent Assessment Platform</h1>
              <p className="text-sm text-gray-600 mt-1">AI-powered patent potential analysis</p>
            </div>
            <nav className="flex space-x-4">
              <button
                onClick={() => setViewMode('upload')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  viewMode === 'upload' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                New Assessment
              </button>
              <button className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium">
                My Assessments
              </button>
              <button className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium">
                Help
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Progress Indicator */}
      {viewMode !== 'results' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-center space-x-8">
            <StepIndicator
              number={1}
              label="Upload Document"
              active={viewMode === 'upload'}
              completed={['form', 'processing', 'results'].includes(viewMode)}
            />
            <div className="w-16 h-0.5 bg-gray-300" />
            <StepIndicator
              number={2}
              label="Project Details"
              active={viewMode === 'form'}
              completed={['processing', 'results'].includes(viewMode)}
            />
            <div className="w-16 h-0.5 bg-gray-300" />
            <StepIndicator
              number={3}
              label="AI Analysis"
              active={viewMode === 'processing'}
              completed={(viewMode as string) === 'results'}
            />
            <div className="w-16 h-0.5 bg-gray-300" />
            <StepIndicator
              number={4}
              label="Results"
              active={(viewMode as string) === 'results'}
              completed={false}
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {viewMode === 'upload' && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Start Your Patent Assessment
              </h2>
              <p className="text-lg text-gray-600">
                Upload your invention documentation to receive an AI-powered patent potential analysis
              </p>
            </div>
            <FileUpload onUploadComplete={handleFileUploadComplete} />
          </div>
        )}

        {viewMode === 'form' && (
          <AssessmentForm
            documentId={uploadedDocumentId}
            onSubmit={handleAssessmentStart}
            onBack={() => setViewMode('upload')}
          />
        )}

        {viewMode === 'processing' && (
          <ProgressTracker
            stage={processingStatus.stage}
            progress={processingStatus.progress}
            message={processingStatus.message}
          />
        )}

        {viewMode === 'results' && assessmentId && (
          <AssessmentDashboard assessmentId={assessmentId} />
        )}
      </main>
    </div>
  );
}

function StepIndicator({
  number,
  label,
  active,
  completed
}: {
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className="flex flex-col items-center">
      <div className={`
        w-10 h-10 rounded-full flex items-center justify-center font-semibold
        ${completed ? 'bg-green-600 text-white' :
          active ? 'bg-blue-600 text-white' :
          'bg-gray-300 text-gray-600'}
      `}>
        {completed ? '✓' : number}
      </div>
      <span className={`text-sm mt-2 ${active ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>
        {label}
      </span>
    </div>
  );
}