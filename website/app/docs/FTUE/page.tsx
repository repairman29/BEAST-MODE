import { readFile } from 'fs/promises';
import { join } from 'path';
import { marked } from 'marked';

export const metadata = {
  title: 'BEAST MODE - First Time User Experience (FTUE)',
  description: 'Complete 100-step guide for new BEAST MODE users',
};

export default async function FTUEPage() {
  const filePath = join(process.cwd(), '..', '..', 'docs', 'FTUE.md');
  let content = '';
  
  try {
    content = await readFile(filePath, 'utf-8');
  } catch (error) {
    content = '# FTUE Guide\n\nDocumentation file not found.';
  }

  // Simple markdown rendering (or use a library like marked)
  const html = await marked(content);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto prose prose-invert prose-cyan">
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}

