'use client';

import React from 'react';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
              The Story Behind <span className="text-blue-400">BEAST MODE</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              We're building the developer tool we wish existed. Here's why.
            </p>
          </div>
        </div>
      </div>

      {/* Origin Story */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-invert prose-lg max-w-none">
          <h2 className="text-3xl font-bold text-white mb-6">The Problem</h2>
          <p className="text-gray-300 mb-6">
            Once upon a time, developers were drowning in code quality problems.
          </p>
          <p className="text-gray-300 mb-6">
            They spent hours:
          </p>
          <ul className="text-gray-300 mb-8 space-y-2">
            <li>• Googling "why is my code slow?"</li>
            <li>• Debugging issues that should have been caught</li>
            <li>• Reviewing PRs manually</li>
            <li>• Maintaining technical debt</li>
            <li>• Wondering "is my code good enough?"</li>
          </ul>

          <h2 className="text-3xl font-bold text-white mb-6 mt-12">The Solution</h2>
          <p className="text-gray-300 mb-6">
            Then came <strong className="text-blue-400">BEAST MODE</strong>.
          </p>
          <p className="text-gray-300 mb-6">
            A developer tool that doesn't just tell you what's wrong—it fixes it. That doesn't just analyze—it learns. That doesn't just report—it acts.
          </p>
          <p className="text-gray-300 mb-8">
            <strong className="text-blue-400">BEAST MODE</strong> is the developer's co-pilot. The silent partner. The quality guardian.
          </p>

          <h2 className="text-3xl font-bold text-white mb-6 mt-12">The Promise</h2>
          <div className="bg-gray-800 rounded-lg p-6 mb-8 border-l-4 border-blue-400">
            <p className="text-2xl font-bold text-white mb-4">
              "BEAST MODE makes you a better developer, faster."
            </p>
            <p className="text-gray-300">
              What that means:
            </p>
            <ul className="text-gray-300 mt-4 space-y-2">
              <li>✅ Write better code (quality scores improve)</li>
              <li>✅ Ship faster (less debugging, fewer bugs)</li>
              <li>✅ Sleep better (code improves while you sleep)</li>
              <li>✅ Learn continuously (context-aware recommendations)</li>
              <li>✅ Scale confidently (team quality improves together)</li>
            </ul>
          </div>

          <h2 className="text-3xl font-bold text-white mb-6 mt-12">What We Do</h2>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-3">1. Analyze</h3>
              <p className="text-gray-300">Tell you what's wrong with your code</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-3">2. Recommend</h3>
              <p className="text-gray-300">Show you how to fix it</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-3">3. Fix</h3>
              <p className="text-gray-300">Automatically improve your code</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-xl font-bold text-white mb-3">4. Learn</h3>
              <p className="text-gray-300">Get smarter over time</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 md:col-span-2">
              <h3 className="text-xl font-bold text-white mb-3">5. Maintain</h3>
              <p className="text-gray-300">Keep your codebase clean (Day 2 Operations)</p>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-white mb-6 mt-12">Our Values</h2>
          <div className="space-y-6 mb-8">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Confident but not arrogant</h3>
              <p className="text-gray-300">We know code quality. We've got this. But we're not here to brag—we're here to help.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Helpful and practical</h3>
              <p className="text-gray-300">Here's what's wrong and how to fix it. No 50-page reports. Just actionable insights.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Developer-first</h3>
              <p className="text-gray-300">We speak your language. We get it. We're developers too.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Transparent and honest</h3>
              <p className="text-gray-300">Here's what we do well. Here's what we don't. No BS. Just truth.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2">Action-oriented</h3>
              <p className="text-gray-300">One click. Code fixed. You're done. No endless options. Just results.</p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try BEAST MODE Free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
