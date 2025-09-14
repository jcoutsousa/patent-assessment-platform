'use client';

import { useState, useEffect } from 'react';
import {
  ChartBarIcon,
  DocumentTextIcon,
  LightBulbIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  DocumentDuplicateIcon,
  MagnifyingGlassIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

interface PriorArtPatent {
  patent_id: string;
  title: string;
  similarity_score: number;
  url: string;
  relevance_reason: string;
}

interface PriorArtData {
  total_found: number;
  analyzed: number;
  top_conflicts: PriorArtPatent[];
  search_confidence: number;
  impact_analysis: {
    novelty_reduction: number;
    obviousness_increase: number;
    summary: string;
    recommendations: string[];
    risk_factors: string[];
  };
}

interface AssessmentResult {
  assessment_id: string;
  project_title: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  novelty_score: number;
  non_obviousness_score: number;
  utility_score: number;
  enablement_score: number;
  overall_patentability_score: number;
  confidence_level: number;
  summary: string;
  recommendations: string[];
  key_features: string[];
  risk_factors: string[];
  created_at: string;
  technical_field?: string;
  prior_art?: PriorArtData;
}

interface ScoreCardProps {
  title: string;
  score: number;
  icon: React.ElementType;
  description: string;
  color: string;
}

function ScoreCard({ title, score, icon: Icon, description, color }: ScoreCardProps) {
  const percentage = Math.round(score * 100);
  const getScoreColor = (score: number) => {
    if (score >= 0.7) return 'text-green-600';
    if (score >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 0.9) return 'Excellent';
    if (score >= 0.7) return 'Good';
    if (score >= 0.4) return 'Moderate';
    return 'Poor';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Icon className={`h-8 w-8 ${color}`} />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <span className={`text-sm font-medium ${getScoreColor(score)}`}>
          {getScoreLabel(score)}
        </span>
      </div>

      <div className="mb-4">
        <div className="flex items-end justify-between mb-2">
          <span className={`text-3xl font-bold ${getScoreColor(score)}`}>
            {percentage}%
          </span>
          <span className="text-sm text-gray-500">Score: {score.toFixed(2)}</span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              score >= 0.7 ? 'bg-green-500' :
              score >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}

export default function AssessmentDashboard({ assessmentId }: { assessmentId?: string }) {
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (assessmentId) {
      fetchAssessment(assessmentId);
    } else {
      // For demo, use mock data
      setAssessment(getMockAssessment());
      setLoading(false);
    }
  }, [assessmentId]);

  const fetchAssessment = async (id: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/assess/${id}`);
      if (!response.ok) throw new Error('Failed to fetch assessment');
      const data = await response.json();
      setAssessment(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  const getMockAssessment = (): AssessmentResult => ({
    assessment_id: 'mock-123',
    project_title: 'AI-Powered Document Analysis System',
    status: 'completed',
    novelty_score: 0.82,
    non_obviousness_score: 0.75,
    utility_score: 0.88,
    enablement_score: 0.91,
    overall_patentability_score: 0.84,
    confidence_level: 0.78,
    technical_field: 'Software/Computing',
    summary: 'This invention demonstrates strong patent potential with innovative technical features in document analysis using advanced AI techniques. The system shows clear novelty in its approach to multi-modal analysis and presents non-obvious solutions to existing technical problems.',
    recommendations: [
      'Consider broadening claims to cover additional document types and analysis methods',
      'Conduct additional prior art search in natural language processing domain',
      'Strengthen technical specifications for machine learning model architecture',
      'File provisional patent application within 3-6 months to establish priority date'
    ],
    key_features: [
      'Novel multi-modal document analysis approach',
      'Innovative AI-driven pattern recognition system',
      'Unique hierarchical processing pipeline',
      'Advanced confidence scoring mechanism'
    ],
    risk_factors: [
      'Similar approaches may exist in unpublished patent applications',
      'Rapid evolution in AI field may impact long-term patent value'
    ],
    created_at: new Date().toISOString()
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg text-gray-700">{error}</p>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return null;
  }

  const overallPercentage = Math.round(assessment.overall_patentability_score * 100);
  const confidencePercentage = Math.round(assessment.confidence_level * 100);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg shadow-xl p-8 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">{assessment.project_title}</h1>
            <p className="text-blue-100">
              Patent Assessment Report • {new Date(assessment.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-100 mb-1">Technical Field</div>
            <div className="text-lg font-semibold">{assessment.technical_field || 'Not specified'}</div>
          </div>
        </div>

        {/* Overall Score Display */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/10 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-3">Overall Patentability Score</h3>
            <div className="flex items-center space-x-4">
              <div className="relative w-32 h-32">
                <svg className="transform -rotate-90 w-32 h-32">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="rgba(255,255,255,0.2)"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="white"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${overallPercentage * 3.52} 352`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold">{overallPercentage}%</span>
                </div>
              </div>
              <div>
                <p className="text-lg font-medium">
                  {overallPercentage >= 70 ? 'Strong Patent Potential' :
                   overallPercentage >= 40 ? 'Moderate Patent Potential' :
                   'Low Patent Potential'}
                </p>
                <p className="text-sm text-blue-100 mt-1">
                  Based on comprehensive AI analysis
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-3">Analysis Confidence</h3>
            <div className="flex items-center space-x-4">
              <ShieldCheckIcon className="h-16 w-16" />
              <div>
                <p className="text-3xl font-bold">{confidencePercentage}%</p>
                <p className="text-sm text-blue-100 mt-1">
                  AI confidence in assessment accuracy
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Individual Score Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <ScoreCard
          title="Novelty"
          score={assessment.novelty_score}
          icon={LightBulbIcon}
          description="How new and unique is this invention compared to existing solutions"
          color="text-purple-600"
        />
        <ScoreCard
          title="Non-Obviousness"
          score={assessment.non_obviousness_score}
          icon={ChartBarIcon}
          description="Would this be non-obvious to someone skilled in the field"
          color="text-blue-600"
        />
        <ScoreCard
          title="Utility"
          score={assessment.utility_score}
          icon={CheckCircleIcon}
          description="Does this invention have practical application and solve real problems"
          color="text-green-600"
        />
        <ScoreCard
          title="Enablement"
          score={assessment.enablement_score}
          icon={DocumentTextIcon}
          description="Is the invention described clearly enough for reproduction"
          color="text-indigo-600"
        />
      </div>

      {/* Summary Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Executive Summary</h2>
        <p className="text-gray-700 leading-relaxed">{assessment.summary}</p>
      </div>

      {/* Key Features and Risks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-4">
            <ArrowTrendingUpIcon className="h-6 w-6 text-green-600" />
            <h3 className="text-xl font-bold text-gray-900">Key Novel Features</h3>
          </div>
          <ul className="space-y-3">
            {assessment.key_features.map((feature, index) => (
              <li key={index} className="flex items-start space-x-2">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-4">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
            <h3 className="text-xl font-bold text-gray-900">Risk Factors</h3>
          </div>
          <ul className="space-y-3">
            {assessment.risk_factors.map((risk, index) => (
              <li key={index} className="flex items-start space-x-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Prior Art Analysis */}
      {assessment.prior_art && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center space-x-2 mb-6">
            <MagnifyingGlassIcon className="h-6 w-6 text-indigo-600" />
            <h3 className="text-xl font-bold text-gray-900">Prior Art Analysis</h3>
          </div>

          {/* Prior Art Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{assessment.prior_art.total_found}</div>
              <div className="text-sm text-blue-800">Patents Found</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">{assessment.prior_art.analyzed}</div>
              <div className="text-sm text-purple-800">Analyzed</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(assessment.prior_art.search_confidence * 100)}%
              </div>
              <div className="text-sm text-green-800">Search Confidence</div>
            </div>
          </div>

          {/* Impact Analysis */}
          {assessment.prior_art.impact_analysis && (
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Impact on Patentability</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-gray-700 mb-3">{assessment.prior_art.impact_analysis.summary}</p>

                {assessment.prior_art.impact_analysis.novelty_reduction > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-orange-700 bg-orange-50 px-3 py-2 rounded mb-2">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    <span>
                      Novelty impact: -{Math.round(assessment.prior_art.impact_analysis.novelty_reduction * 100)}%
                      reduction due to similar patents
                    </span>
                  </div>
                )}

                {assessment.prior_art.impact_analysis.obviousness_increase > 0 && (
                  <div className="flex items-center space-x-2 text-sm text-red-700 bg-red-50 px-3 py-2 rounded">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    <span>
                      Non-obviousness risk: +{Math.round(assessment.prior_art.impact_analysis.obviousness_increase * 100)}%
                      due to existing solutions
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Similar Patents */}
          {assessment.prior_art.top_conflicts.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                Most Similar Patents
              </h4>
              <div className="space-y-3">
                {assessment.prior_art.top_conflicts.map((patent, index) => (
                  <div key={patent.patent_id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-sm font-mono text-blue-600 bg-blue-100 px-2 py-1 rounded">
                            {patent.patent_id}
                          </span>
                          <span className={`text-xs font-medium px-2 py-1 rounded ${
                            patent.similarity_score >= 0.7 ? 'text-red-600 bg-red-50' :
                            patent.similarity_score >= 0.5 ? 'text-yellow-600 bg-yellow-50' :
                            'text-blue-600 bg-blue-50'
                          }`}>
                            {Math.round(patent.similarity_score * 100)}% Similar
                          </span>
                          <span className="text-xs text-gray-500">
                            #{index + 1} Most Similar
                          </span>
                        </div>

                        <h5 className="font-medium text-gray-900 mb-2">
                          {patent.title}
                        </h5>

                        {patent.relevance_reason && (
                          <p className="text-sm text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">
                            {patent.relevance_reason}
                          </p>
                        )}
                      </div>

                      <a
                        href={patent.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium ml-4"
                      >
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                        <span>View</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Prior Art Found */}
          {assessment.prior_art.total_found === 0 && (
            <div className="text-center py-8">
              <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-green-800 mb-2">
                No Similar Patents Found
              </h4>
              <p className="text-green-600 max-w-md mx-auto">
                Our comprehensive search did not find any patents with significant similarity to your invention.
                This is a positive indicator for novelty and patentability.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Recommendations */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
        <div className="flex items-center space-x-2 mb-4">
          <DocumentDuplicateIcon className="h-6 w-6 text-blue-600" />
          <h3 className="text-xl font-bold text-gray-900">Recommendations</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {assessment.recommendations.map((rec, index) => (
            <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
              <div className="flex items-start space-x-3">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </span>
                <p className="text-gray-700">{rec}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <button className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
          Download Full Report
        </button>
        <button className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors">
          Schedule Consultation
        </button>
        <button className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">
          Start Patent Filing
        </button>
      </div>
    </div>
  );
}