'use client';

import { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  ArrowTopRightOnSquareIcon,
  XMarkIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

interface PatentResult {
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
}

interface PriorArtSearchResult {
  query: string;
  total_results: number;
  patents: PatentResult[];
  search_duration_ms: number;
  search_timestamp: string;
  confidence_score: number;
  search_strategy: string;
}

interface PriorArtSearchProps {
  inventionDescription?: string;
  technicalField?: string;
  keywords?: string[];
  onResultsChange?: (results: PriorArtSearchResult | null) => void;
}

export default function PriorArtSearch({
  inventionDescription = '',
  technicalField = '',
  keywords = [],
  onResultsChange
}: PriorArtSearchProps) {
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PriorArtSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPatent, setSelectedPatent] = useState<PatentResult | null>(null);

  // Search parameters
  const [searchDescription, setSearchDescription] = useState(inventionDescription);
  const [searchField, setSearchField] = useState(technicalField);
  const [searchKeywords, setSearchKeywords] = useState<string>(keywords.join(', '));
  const [maxResults, setMaxResults] = useState(20);

  // Auto-search when props change
  useEffect(() => {
    if (inventionDescription && technicalField) {
      setSearchDescription(inventionDescription);
      setSearchField(technicalField);
      setSearchKeywords(keywords.join(', '));
      performSearch();
    }
  }, [inventionDescription, technicalField, keywords]);

  const performSearch = async () => {
    if (!searchDescription.trim() || !searchField.trim()) {
      setError('Please provide invention description and technical field');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const searchKeywordsArray = searchKeywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/prior-art/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invention_description: searchDescription,
          technical_field: searchField,
          keywords: searchKeywordsArray.length > 0 ? searchKeywordsArray : null,
          max_results: maxResults
        }),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const results: PriorArtSearchResult = await response.json();
      setSearchResults(results);

      if (onResultsChange) {
        onResultsChange(results);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      setSearchResults(null);

      if (onResultsChange) {
        onResultsChange(null);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const getSimilarityColor = (score: number) => {
    if (score >= 0.7) return 'text-red-600 bg-red-50';
    if (score >= 0.5) return 'text-yellow-600 bg-yellow-50';
    if (score >= 0.3) return 'text-blue-600 bg-blue-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getSimilarityLabel = (score: number) => {
    if (score >= 0.7) return 'High Risk';
    if (score >= 0.5) return 'Medium Risk';
    if (score >= 0.3) return 'Low Risk';
    return 'Minimal Risk';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Search Interface */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center space-x-3 mb-6">
          <MagnifyingGlassIcon className="h-8 w-8 text-blue-600" />
          <h2 className="text-2xl font-bold text-gray-900">Prior Art Search</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Invention Description *
            </label>
            <textarea
              id="description"
              value={searchDescription}
              onChange={(e) => setSearchDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Describe your invention's key technical features..."
            />
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="field" className="block text-sm font-medium text-gray-700 mb-2">
                Technical Field *
              </label>
              <select
                id="field"
                value={searchField}
                onChange={(e) => setSearchField(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select technical field</option>
                <option value="Software/Computing">Software/Computing</option>
                <option value="Electronics/Hardware">Electronics/Hardware</option>
                <option value="Mechanical/Manufacturing">Mechanical/Manufacturing</option>
                <option value="Chemical/Materials">Chemical/Materials</option>
                <option value="Biotechnology/Medical">Biotechnology/Medical</option>
                <option value="Telecommunications">Telecommunications</option>
                <option value="Energy/Environmental">Energy/Environmental</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="keywords" className="block text-sm font-medium text-gray-700 mb-2">
                Additional Keywords
              </label>
              <input
                type="text"
                id="keywords"
                value={searchKeywords}
                onChange={(e) => setSearchKeywords(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="keyword1, keyword2, keyword3"
              />
              <p className="text-xs text-gray-500 mt-1">Separate keywords with commas</p>
            </div>

            <div>
              <label htmlFor="maxResults" className="block text-sm font-medium text-gray-700 mb-2">
                Max Results
              </label>
              <select
                id="maxResults"
                value={maxResults}
                onChange={(e) => setMaxResults(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={10}>10 results</option>
                <option value={20}>20 results</option>
                <option value={50}>50 results</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={performSearch}
            disabled={isSearching || !searchDescription.trim() || !searchField.trim()}
            className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSearching ? (
              <ArrowPathIcon className="h-5 w-5 animate-spin" />
            ) : (
              <MagnifyingGlassIcon className="h-5 w-5" />
            )}
            <span>{isSearching ? 'Searching...' : 'Search Patents'}</span>
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
            <span className="text-red-800 font-medium">Search Error</span>
          </div>
          <p className="text-red-700 mt-1">{error}</p>
        </div>
      )}

      {/* Search Results */}
      {searchResults && (
        <div className="space-y-6">
          {/* Results Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Search Results</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span className="flex items-center space-x-1">
                  <ClockIcon className="h-4 w-4" />
                  <span>{searchResults.search_duration_ms}ms</span>
                </span>
                <span>Strategy: {searchResults.search_strategy}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">{searchResults.patents.length}</div>
                <div className="text-sm text-blue-800">Relevant Patents</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">{searchResults.total_results}</div>
                <div className="text-sm text-green-800">Total Results</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(searchResults.confidence_score * 100)}%
                </div>
                <div className="text-sm text-purple-800">Search Confidence</div>
              </div>
            </div>

            {searchResults.patents.length === 0 && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="h-5 w-5 text-green-600" />
                  <span className="text-green-800 font-medium">No Similar Patents Found</span>
                </div>
                <p className="text-green-700 text-sm mt-1">
                  This could indicate good novelty prospects for your invention.
                </p>
              </div>
            )}
          </div>

          {/* Patent Results List */}
          {searchResults.patents.length > 0 && (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">Found Patents</h3>
                <p className="text-sm text-gray-600">
                  Click on any patent to view detailed information
                </p>
              </div>

              <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
                {searchResults.patents.map((patent, index) => (
                  <div
                    key={patent.patent_id}
                    className="p-6 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedPatent(patent)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 mr-4">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-sm font-mono text-blue-600 bg-blue-100 px-2 py-1 rounded">
                            {patent.patent_id}
                          </span>
                          <span className={`text-xs font-medium px-2 py-1 rounded ${getSimilarityColor(patent.similarity_score)}`}>
                            {getSimilarityLabel(patent.similarity_score)} ({Math.round(patent.similarity_score * 100)}%)
                          </span>
                          <span className="text-xs text-gray-500 flex items-center">
                            <BuildingOfficeIcon className="h-3 w-3 mr-1" />
                            {patent.patent_office}
                          </span>
                        </div>

                        <h4 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600">
                          {patent.title}
                        </h4>

                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {patent.abstract}
                        </p>

                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          {patent.assignee && (
                            <span>Assignee: {patent.assignee}</span>
                          )}
                          {patent.publication_date && (
                            <span>Published: {formatDate(patent.publication_date)}</span>
                          )}
                        </div>

                        {patent.relevance_reason && (
                          <div className="mt-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">
                            {patent.relevance_reason}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col items-end space-y-2">
                        <ArrowTopRightOnSquareIcon className="h-5 w-5 text-gray-400" />
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            #{index + 1}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Patent Detail Modal */}
      {selectedPatent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">Patent Details</h3>
              <button
                onClick={() => setSelectedPatent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Header Info */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="text-lg font-mono text-blue-600 bg-blue-100 px-3 py-1 rounded">
                      {selectedPatent.patent_id}
                    </span>
                    <span className={`text-sm font-medium px-3 py-1 rounded ${getSimilarityColor(selectedPatent.similarity_score)}`}>
                      {getSimilarityLabel(selectedPatent.similarity_score)} - {Math.round(selectedPatent.similarity_score * 100)}% Similar
                    </span>
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-2">
                    {selectedPatent.title}
                  </h4>
                </div>

                <a
                  href={selectedPatent.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                  <span>View Patent</span>
                </a>
              </div>

              {/* Patent Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Patent Information</h5>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-gray-500">Patent Office:</dt>
                      <dd className="font-medium">{selectedPatent.patent_office}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Filing Date:</dt>
                      <dd className="font-medium">{formatDate(selectedPatent.filing_date)}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Publication Date:</dt>
                      <dd className="font-medium">{formatDate(selectedPatent.publication_date)}</dd>
                    </div>
                    {selectedPatent.assignee && (
                      <div>
                        <dt className="text-gray-500">Assignee:</dt>
                        <dd className="font-medium">{selectedPatent.assignee}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Inventors</h5>
                  {selectedPatent.inventors.length > 0 ? (
                    <ul className="space-y-1 text-sm">
                      {selectedPatent.inventors.map((inventor, index) => (
                        <li key={index} className="text-gray-700">{inventor}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500">No inventor information available</p>
                  )}
                </div>
              </div>

              {/* Abstract */}
              <div>
                <h5 className="font-semibold text-gray-900 mb-2">Abstract</h5>
                <p className="text-gray-700 leading-relaxed">
                  {selectedPatent.abstract || 'No abstract available'}
                </p>
              </div>

              {/* Relevance */}
              {selectedPatent.relevance_reason && (
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Why This Patent is Relevant</h5>
                  <p className="text-blue-700 bg-blue-50 p-3 rounded-lg">
                    {selectedPatent.relevance_reason}
                  </p>
                </div>
              )}

              {/* Classification */}
              {selectedPatent.classification.length > 0 && (
                <div>
                  <h5 className="font-semibold text-gray-900 mb-2">Classification</h5>
                  <div className="flex flex-wrap gap-2">
                    {selectedPatent.classification.map((cls, index) => (
                      <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                        {cls}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}