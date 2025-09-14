'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  ChartBarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

import PriorArtSearch from '@/components/PriorArtSearch';

interface PriorArtSearchResult {
  query: string;
  total_results: number;
  patents: Array<{
    patent_id: string;
    title: string;
    abstract: string;
    inventors: string[];
    assignee: string;
    filing_date: string;
    publication_date: string;
    patent_office: string;
    classification: string[];
    url: string;
    similarity_score: number;
    relevance_reason: string;
  }>;
  search_duration_ms: number;
  search_timestamp: string;
  confidence_score: number;
  search_strategy: string;
}

export default function PriorArtPage() {
  const _router = useRouter();
  const [searchResults, setSearchResults] = useState<PriorArtSearchResult | null>(null);

  const handleResultsChange = (results: PriorArtSearchResult | null) => {
    setSearchResults(results);
  };

  const getRiskAssessment = () => {
    if (!searchResults || searchResults.patents.length === 0) {
      return {
        level: 'low',
        message: 'No similar patents found - Good novelty prospects',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        icon: CheckCircleIcon
      };
    }

    const highRiskPatents = searchResults.patents.filter(p => p.similarity_score >= 0.7);
    const mediumRiskPatents = searchResults.patents.filter(p => p.similarity_score >= 0.5 && p.similarity_score < 0.7);

    if (highRiskPatents.length > 0) {
      return {
        level: 'high',
        message: `${highRiskPatents.length} highly similar patents found - Patentability at risk`,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        icon: ExclamationTriangleIcon
      };
    } else if (mediumRiskPatents.length > 0) {
      return {
        level: 'medium',
        message: `${mediumRiskPatents.length} moderately similar patents found - Requires review`,
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        icon: ExclamationTriangleIcon
      };
    } else {
      return {
        level: 'low',
        message: 'Only low similarity patents found - Good patentability prospects',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        icon: CheckCircleIcon
      };
    }
  };

  const riskAssessment = getRiskAssessment();
  const RiskIcon = riskAssessment.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/assessment"
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeftIcon className="h-5 w-5" />
                <span>Back to Assessment</span>
              </Link>
              <div className="w-px h-6 bg-gray-300" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Prior Art Search</h1>
                <p className="text-sm text-gray-600 mt-1">
                  Search for existing patents that might impact your invention&apos;s patentability
                </p>
              </div>
            </div>

            <nav className="flex space-x-4">
              <Link
                href="/assessment"
                className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                New Assessment
              </Link>
              <button className="px-4 py-2 text-gray-600 hover:text-gray-900 font-medium">
                Help
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Risk Assessment Banner */}
        {searchResults && (
          <div className={`${riskAssessment.bgColor} border border-opacity-20 rounded-lg p-4 mb-6`}>
            <div className="flex items-center space-x-3">
              <RiskIcon className={`h-6 w-6 ${riskAssessment.color}`} />
              <div>
                <p className={`font-medium ${riskAssessment.color}`}>
                  Patentability Risk Assessment: {riskAssessment.level.toUpperCase()}
                </p>
                <p className={`text-sm ${riskAssessment.color.replace('600', '700')} mt-1`}>
                  {riskAssessment.message}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Information Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-3 mb-4">
              <MagnifyingGlassIcon className="h-8 w-8 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Comprehensive Search</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Our AI searches through millions of patents using multiple strategies to find
              the most relevant prior art for your invention.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-3 mb-4">
              <ChartBarIcon className="h-8 w-8 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Similarity Analysis</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Each patent is scored for similarity to your invention, helping you identify
              potential conflicts and understand patentability risks.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center space-x-3 mb-4">
              <DocumentTextIcon className="h-8 w-8 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">Detailed Analysis</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Review full patent details, abstracts, and our AI&apos;s explanation of why
              each patent is relevant to your invention.
            </p>
          </div>
        </div>

        {/* Prior Art Search Component */}
        <PriorArtSearch onResultsChange={handleResultsChange} />

        {/* Search Statistics */}
        {searchResults && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Search Statistics</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{searchResults.patents.length}</div>
                <div className="text-sm text-gray-600">Patents Analyzed</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round(searchResults.confidence_score * 100)}%
                </div>
                <div className="text-sm text-gray-600">Search Confidence</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {searchResults.search_duration_ms}ms
                </div>
                <div className="text-sm text-gray-600">Search Time</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {searchResults.patents.filter(p => p.similarity_score >= 0.5).length}
                </div>
                <div className="text-sm text-gray-600">High Similarity</div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                <strong>Search Strategy:</strong> {searchResults.search_strategy} |{' '}
                <strong>Query:</strong> {searchResults.query} |{' '}
                <strong>Timestamp:</strong> {new Date(searchResults.search_timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {/* Next Steps */}
        <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Next Steps</h3>

          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </span>
              <div>
                <p className="font-medium text-gray-900">Review Similar Patents</p>
                <p className="text-sm text-gray-600">
                  Examine highly similar patents to understand how your invention differs and what claims might be available.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </span>
              <div>
                <p className="font-medium text-gray-900">Strengthen Your Invention</p>
                <p className="text-sm text-gray-600">
                  Use the insights to refine your invention description and emphasize unique aspects.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </span>
              <div>
                <p className="font-medium text-gray-900">Complete Patent Assessment</p>
                <p className="text-sm text-gray-600">
                  Run a full assessment that combines AI analysis with this prior art research.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex space-x-4">
            <Link
              href="/assessment"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Start Full Assessment
            </Link>

            <button
              onClick={() => window.print()}
              className="px-6 py-3 bg-white text-blue-600 border border-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
            >
              Export Results
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}