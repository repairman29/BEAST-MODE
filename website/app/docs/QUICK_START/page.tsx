import { readFile } from 'fs/promises';
import { join } from 'path';
import { marked } from 'marked';

export const metadata = {
  title: 'BEAST MODE - Quick Start Guide',
  description: 'Get up and running with BEAST MODE in 5 minutes',
};

export default async function QuickStartPage() {
  const filePath = join(process.cwd(), '..', '..', 'docs', 'QUICK_START.md');
  let content = '';
  
  try {
    content = await readFile(filePath, 'utf-8');
  } catch (error) {
    content = '# Quick Start Guide\n\nDocumentation file not found.';
  }

  const html = await marked(content);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto prose prose-invert prose-cyan">
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}

