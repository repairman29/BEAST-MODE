'use client';

/**
 * Feature Generator Component
 * 
 * Uses BEAST MODE to generate IDE features from user stories
 * Dogfooding: Using our own tools to build our product
 */

import { useState } from 'react';
import { useBeastModeGeneration } from '@/lib/ide/useBeastModeGeneration';

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

interface FeatureGeneratorProps {
  stories: Story[];
  onFeatureGenerated?: (storyId: string, code: string) => void;
}

export default function FeatureGenerator({ stories, onFeatureGenerated }: FeatureGeneratorProps) {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const { generateCode, generating, error } = useBeastModeGeneration();

  const handleGenerate = async () => {
    if (!selectedStory) return;

    try {
      const code = await generateCode({
        story: selectedStory,
        context: `
Current IDE structure:
- app/ide/page.tsx - Main IDE page
- components/ide/Editor.tsx - Monaco Editor component
- components/ide/Terminal.tsx - xterm Terminal component
- components/ide/FileTree.tsx - File tree component
        `,
      });

      setGeneratedCode(code);
      onFeatureGenerated?.(selectedStory.id, code);
    } catch (err) {
      console.error('Generation error:', err);
    }
  };

  const p0Stories = stories.filter(s => s.priority === 'P0');

  return (
    <div className="h-full flex flex-col bg-slate-900 text-slate-100">
      <div className="h-12 bg-slate-800 border-b border-slate-700 flex items-center px-4">
        <h2 className="text-lg font-semibold">BEAST MODE Feature Generator</h2>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Story Selection */}
        <div className="w-80 border-r border-slate-700 overflow-y-auto p-4">
          <h3 className="text-sm font-semibold mb-4">P0 User Stories ({p0Stories.length})</h3>
          <div className="space-y-2">
            {p0Stories.map((story) => (
              <button
                key={story.id}
                onClick={() => setSelectedStory(story)}
                className={`w-full text-left p-3 rounded border ${
                  selectedStory?.id === story.id
                    ? 'bg-blue-600 border-blue-500'
                    : 'bg-slate-800 border-slate-700 hover:bg-slate-750'
                }`}
              >
                <div className="text-sm font-medium">{story.title}</div>
                <div className="text-xs text-slate-400 mt-1">{story.category}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Generation Area */}
        <div className="flex-1 flex flex-col">
          {selectedStory ? (
            <>
              <div className="p-4 border-b border-slate-700">
                <h3 className="text-lg font-semibold mb-2">{selectedStory.title}</h3>
                <div className="text-sm text-slate-300 space-y-1">
                  <p><strong>As:</strong> {selectedStory.as}</p>
                  <p><strong>Want:</strong> {selectedStory.want}</p>
                  <p><strong>So That:</strong> {selectedStory.soThat}</p>
                  <div className="mt-2">
                    <strong>Criteria:</strong>
                    <ul className="list-disc list-inside ml-2">
                      {selectedStory.criteria.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded disabled:opacity-50"
                >
                  {generating ? 'Generating...' : 'Generate with BEAST MODE'}
                </button>
              </div>

              {error && (
                <div className="p-4 bg-red-900/50 border-b border-red-700">
                  <p className="text-red-300">Error: {error}</p>
                </div>
              )}

              {generatedCode && (
                <div className="flex-1 overflow-auto p-4">
                  <pre className="bg-slate-950 p-4 rounded text-sm overflow-x-auto">
                    <code>{generatedCode}</code>
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">
              <p>Select a user story to generate code</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
