'use client';

/**
 * BEAST MODE Feature Generator Page
 * 
 * Uses BEAST MODE APIs to generate IDE features from user stories
 * Dogfooding: Using our own tools to build our product
 */

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

const FeatureGenerator = dynamic(() => import('@/components/ide/FeatureGenerator'), { ssr: false });

interface Story {
  id: string;
  title: string;
  category: string;
  as: string;
  want: string;
  soThat: string;
  criteria: string[];
  priority: string;
}

export default function GeneratorPage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load user stories
    fetch('/api/ide/user-stories')
      .then(res => res.json())
      .then(data => {
        setStories(data.stories || []);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error loading stories:', err);
        setLoading(false);
      });
  }, []);

  const handleFeatureGenerated = (storyId: string, code: string) => {
    console.log('Feature generated:', storyId);
    // Save generated code
    // Could save to file system or show in IDE
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950">
        <div className="text-slate-400">Loading user stories...</div>
      </div>
    );
  }

  return <FeatureGenerator stories={stories} onFeatureGenerated={handleFeatureGenerated} />;
}
