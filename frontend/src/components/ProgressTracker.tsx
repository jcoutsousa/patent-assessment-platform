'use client';

import React, { useEffect, useState } from 'react';
import {
  DocumentMagnifyingGlassIcon,
  CpuChipIcon,
  MagnifyingGlassIcon,
  DocumentChartBarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface ProgressTrackerProps {
  stage: string;
  progress: number;
  message: string;
}

interface Stage {
  name: string;
  icon: React.ElementType;
  description: string;
  duration: string;
}

const stages: Stage[] = [
  {
    name: 'Document Processing',
    icon: DocumentMagnifyingGlassIcon,
    description: 'Extracting text and identifying technical content',
    duration: '10-15 seconds'
  },
  {
    name: 'AI Analysis',
    icon: CpuChipIcon,
    description: 'Evaluating patent criteria with GPT-4',
    duration: '20-30 seconds'
  },
  {
    name: 'Prior Art Search',
    icon: MagnifyingGlassIcon,
    description: 'Searching patent databases for similar inventions',
    duration: '15-20 seconds'
  },
  {
    name: 'Report Generation',
    icon: DocumentChartBarIcon,
    description: 'Compiling assessment results and recommendations',
    duration: '5-10 seconds'
  }
];

export default function ProgressTracker({ stage, progress, message }: ProgressTrackerProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [dots, setDots] = useState('');

  useEffect(() => {
    // Animate progress bar
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  useEffect(() => {
    // Animate loading dots
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const currentStageIndex = stages.findIndex(s => s.name === stage);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Analyzing Your Invention
          </h2>
          <p className="text-lg text-gray-600">
            Our AI is conducting a comprehensive patent assessment
          </p>
        </div>

        {/* Main Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-medium text-blue-600">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${animatedProgress}%` }}
            >
              <div className="h-full bg-white/20 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Current Stage Display */}
        <div className="bg-blue-50 rounded-lg p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center animate-pulse">
                {currentStageIndex >= 0 && (
                  <div className="h-8 w-8 text-white">
                    {React.createElement(stages[currentStageIndex].icon, { className: "h-8 w-8 text-white" })}
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                {stage}{dots}
              </h3>
              <p className="text-gray-600">{message}</p>
            </div>
          </div>
        </div>

        {/* Stage Timeline */}
        <div className="space-y-6">
          <h4 className="text-lg font-semibold text-gray-900">Processing Pipeline</h4>
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-6 top-8 bottom-0 w-0.5 bg-gray-300" />

            {stages.map((s, index) => {
              const isCompleted = currentStageIndex > index;
              const isCurrent = currentStageIndex === index;
              const isPending = currentStageIndex < index;

              return (
                <div key={index} className="relative flex items-start space-x-4 pb-8">
                  {/* Stage Icon */}
                  <div className={`
                    relative z-10 flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center
                    ${isCompleted ? 'bg-green-600' :
                      isCurrent ? 'bg-blue-600 animate-pulse' :
                      'bg-gray-300'}
                  `}>
                    {isCompleted ? (
                      <CheckCircleIcon className="h-6 w-6 text-white" />
                    ) : (
                      <s.icon className={`h-6 w-6 ${isCurrent ? 'text-white' : 'text-gray-500'}`} />
                    )}
                  </div>

                  {/* Stage Info */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h5 className={`font-semibold ${
                        isCurrent ? 'text-blue-600' :
                        isCompleted ? 'text-green-600' :
                        'text-gray-500'
                      }`}>
                        {s.name}
                      </h5>
                      <span className="text-sm text-gray-500">{s.duration}</span>
                    </div>
                    <p className={`text-sm ${
                      isCurrent ? 'text-gray-700' : 'text-gray-500'
                    }`}>
                      {s.description}
                    </p>
                    {isCurrent && (
                      <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
                        <div className="h-full bg-blue-600 rounded-full animate-pulse" style={{ width: '60%' }} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Estimated Time */}
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Estimated time remaining</p>
              <p className="text-xs text-gray-500 mt-1">Processing time varies based on document complexity</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">
                {Math.max(0, Math.round((100 - progress) * 0.6))}s
              </p>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-sm text-yellow-800">
            <strong>💡 Tip:</strong> While you wait, consider preparing any additional documentation
            or prior art references you may have. These can strengthen your patent application.
          </p>
        </div>
      </div>
    </div>
  );
}