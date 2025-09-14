'use client';

import { useState } from 'react';
import {
  DocumentTextIcon,
  TagIcon,
  BeakerIcon,
  ArrowLeftIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

interface AssessmentFormProps {
  documentId: string | null;
  onSubmit: (data: { project_title: string; description: string; technical_field?: string; documentId: string | null }) => void;
  onBack: () => void;
}

export default function AssessmentForm({ documentId, onSubmit, onBack }: AssessmentFormProps) {
  const [formData, setFormData] = useState({
    projectTitle: '',
    description: '',
    technicalField: '',
    inventorName: '',
    organization: '',
    priorArtKeywords: '',
    marketApplication: '',
    competitiveAdvantage: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const technicalFields = [
    'Software/Computing',
    'Electronics/Hardware',
    'Mechanical/Manufacturing',
    'Chemical/Materials',
    'Biotechnology/Medical',
    'Telecommunications',
    'Energy/Environmental',
    'Other'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.projectTitle.trim()) {
      newErrors.projectTitle = 'Project title is required';
    }
    if (!formData.description.trim() || formData.description.length < 100) {
      newErrors.description = 'Description must be at least 100 characters';
    }
    if (!formData.technicalField) {
      newErrors.technicalField = 'Technical field is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        project_title: formData.projectTitle,
        description: formData.description,
        technical_field: formData.technicalField,
        documentId
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Project Information</h2>
          <p className="text-gray-600">
            Provide details about your invention to enhance the patent assessment accuracy
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Title */}
          <div>
            <label htmlFor="projectTitle" className="block text-sm font-medium text-gray-700 mb-2">
              Project Title *
            </label>
            <div className="relative">
              <DocumentTextIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                id="projectTitle"
                name="projectTitle"
                value={formData.projectTitle}
                onChange={handleChange}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.projectTitle ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter a descriptive title for your invention"
              />
            </div>
            {errors.projectTitle && (
              <p className="mt-1 text-sm text-red-600">{errors.projectTitle}</p>
            )}
          </div>

          {/* Technical Field */}
          <div>
            <label htmlFor="technicalField" className="block text-sm font-medium text-gray-700 mb-2">
              Technical Field *
            </label>
            <div className="relative">
              <BeakerIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <select
                id="technicalField"
                name="technicalField"
                value={formData.technicalField}
                onChange={handleChange}
                className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.technicalField ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select a technical field</option>
                {technicalFields.map(field => (
                  <option key={field} value={field}>{field}</option>
                ))}
              </select>
            </div>
            {errors.technicalField && (
              <p className="mt-1 text-sm text-red-600">{errors.technicalField}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Invention Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={6}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.description ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Provide a detailed description of your invention, including the problem it solves, how it works, and its key innovative features (minimum 100 characters)"
            />
            <div className="mt-1 flex justify-between">
              <div>
                {errors.description && (
                  <p className="text-sm text-red-600">{errors.description}</p>
                )}
              </div>
              <span className="text-sm text-gray-500">
                {formData.description.length} characters
              </span>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Inventor Name */}
            <div>
              <label htmlFor="inventorName" className="block text-sm font-medium text-gray-700 mb-2">
                Inventor Name
              </label>
              <input
                type="text"
                id="inventorName"
                name="inventorName"
                value={formData.inventorName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Primary inventor's name"
              />
            </div>

            {/* Organization */}
            <div>
              <label htmlFor="organization" className="block text-sm font-medium text-gray-700 mb-2">
                Organization
              </label>
              <input
                type="text"
                id="organization"
                name="organization"
                value={formData.organization}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Company or institution"
              />
            </div>
          </div>

          {/* Prior Art Keywords */}
          <div>
            <label htmlFor="priorArtKeywords" className="block text-sm font-medium text-gray-700 mb-2">
              Prior Art Keywords
            </label>
            <div className="relative">
              <TagIcon className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                type="text"
                id="priorArtKeywords"
                name="priorArtKeywords"
                value={formData.priorArtKeywords}
                onChange={handleChange}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter keywords to search for similar patents (comma-separated)"
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Help us find relevant prior art by providing key terms related to your invention
            </p>
          </div>

          {/* Market Application */}
          <div>
            <label htmlFor="marketApplication" className="block text-sm font-medium text-gray-700 mb-2">
              Market Application
            </label>
            <textarea
              id="marketApplication"
              name="marketApplication"
              value={formData.marketApplication}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe the potential market applications and target industries"
            />
          </div>

          {/* Competitive Advantage */}
          <div>
            <label htmlFor="competitiveAdvantage" className="block text-sm font-medium text-gray-700 mb-2">
              Competitive Advantage
            </label>
            <textarea
              id="competitiveAdvantage"
              name="competitiveAdvantage"
              value={formData.competitiveAdvantage}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="What makes your invention unique compared to existing solutions?"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-6 border-t">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center space-x-2 px-6 py-3 text-gray-700 bg-gray-200 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              <span>Back to Upload</span>
            </button>

            <button
              type="submit"
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <span>Start Assessment</span>
              <ArrowRightIcon className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>

      {/* Information Panel */}
      <div className="mt-6 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Why We Need This Information</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start space-x-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>
              <strong>Project Title & Description:</strong> Helps our AI understand the core innovation
              and technical aspects of your invention
            </span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>
              <strong>Technical Field:</strong> Ensures we search the right patent databases and apply
              appropriate assessment criteria
            </span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>
              <strong>Prior Art Keywords:</strong> Improves the accuracy of our prior art search to
              identify potential conflicts
            </span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-blue-600 mt-0.5">•</span>
            <span>
              <strong>Market & Competitive Info:</strong> Helps assess the commercial viability and
              strategic value of your patent
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
}