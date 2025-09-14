import Link from "next/link";
import {
  BeakerIcon,
  DocumentMagnifyingGlassIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  LightBulbIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 opacity-70" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              AI-Powered Patent Assessment
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Discover your invention&apos;s patent potential in minutes, not weeks.
              Our advanced AI analyzes your innovation against millions of patents
              to provide comprehensive patentability assessments.
            </p>
            <div className="flex justify-center space-x-4 mb-6">
              <Link
                href="/assessment"
                className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
              >
                Start Free Assessment
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </Link>
              <button className="inline-flex items-center px-8 py-4 bg-white text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors shadow-lg border border-gray-200">
                Watch Demo
              </button>
            </div>

            <div className="flex justify-center">
              <Link
                href="/prior-art"
                className="inline-flex items-center px-6 py-3 text-blue-600 font-medium hover:text-blue-700 transition-colors"
              >
                <DocumentMagnifyingGlassIcon className="mr-2 h-5 w-5" />
                Search Prior Art Only
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600">
              Get comprehensive patent analysis in four simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <DocumentMagnifyingGlassIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">1. Upload Document</h3>
              <p className="text-gray-600">
                Upload your invention description, technical drawings, or patent draft
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <BeakerIcon className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">2. AI Analysis</h3>
              <p className="text-gray-600">
                Our AI evaluates novelty, non-obviousness, utility, and enablement
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChartBarIcon className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">3. Prior Art Search</h3>
              <p className="text-gray-600">
                Comprehensive search across global patent databases
              </p>
            </div>

            <div className="text-center">
              <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheckIcon className="h-8 w-8 text-indigo-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">4. Get Results</h3>
              <p className="text-gray-600">
                Receive detailed assessment with scores and recommendations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">
                Why Choose Our Platform?
              </h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <CheckCircleIcon className="h-6 w-6 text-green-500 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Save Time & Money
                    </h3>
                    <p className="text-gray-600">
                      Get results in minutes instead of weeks, at a fraction of traditional costs
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <LightBulbIcon className="h-6 w-6 text-yellow-500 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      AI-Powered Accuracy
                    </h3>
                    <p className="text-gray-600">
                      GPT-4 powered analysis with comprehensive scoring across all patent criteria
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <ClockIcon className="h-6 w-6 text-blue-500 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Instant Results
                    </h3>
                    <p className="text-gray-600">
                      Receive comprehensive assessment reports with actionable recommendations
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <ShieldCheckIcon className="h-6 w-6 text-indigo-500 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      Secure & Confidential
                    </h3>
                    <p className="text-gray-600">
                      Your inventions are protected with enterprise-grade security
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Patent Assessment Includes:
              </h3>
              <ul className="space-y-4">
                <li className="flex items-center space-x-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Novelty Analysis Score</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Non-Obviousness Evaluation</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Utility Assessment</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Enablement Verification</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Prior Art Search Results</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Risk Factor Analysis</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Strategic Recommendations</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  <span className="text-gray-700">Patent Draft Assistance</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Assess Your Innovation?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of inventors who have discovered their patent potential
          </p>
          <Link
            href="/assessment"
            className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
          >
            Start Your Free Assessment
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-white font-semibold mb-4">Patent Assessment Platform</h4>
              <p className="text-sm">
                AI-powered patent analysis for inventors and innovators
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/assessment" className="hover:text-white">Start Assessment</Link></li>
                <li><Link href="/pricing" className="hover:text-white">Pricing</Link></li>
                <li><Link href="/features" className="hover:text-white">Features</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/guide" className="hover:text-white">Patent Guide</Link></li>
                <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
                <li><Link href="/faq" className="hover:text-white">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><Link href="/contact" className="hover:text-white">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-white">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm">
            © 2025 Patent Assessment Platform. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}