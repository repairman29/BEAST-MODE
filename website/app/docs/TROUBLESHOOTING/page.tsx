import { readFile } from 'fs/promises';
import { join } from 'path';
import Link from 'next/link';
import { ArrowLeft, Wrench } from 'lucide-react';

export const metadata = {
  title: 'BEAST MODE - Troubleshooting',
  description: 'Troubleshooting guide for common BEAST MODE issues',
};

// Simple markdown to HTML converter
function markdownToHtml(markdown: string): string {
  return markdown
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-white mb-4">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-cyan-400 mt-8 mb-4">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold text-slate-300 mt-6 mb-3">$1</h3>')
    .replace(/^\*\*(.*)\*\*/gim, '<strong class="text-white">$1</strong>')
    .replace(/^\- (.*$)/gim, '<li class="text-slate-300 ml-4">$1</li>')
    .replace(/^(\d+)\. (.*$)/gim, '<li class="text-slate-300 ml-4">$2</li>')
    .replace(/```([\s\S]*?)```/gim, '<pre class="bg-slate-900 p-4 rounded-lg overflow-x-auto my-4"><code class="text-cyan-400">$1</code></pre>')
    .replace(/`([^`]+)`/gim, '<code class="bg-slate-900 px-2 py-1 rounded text-cyan-400">$1</code>')
    .replace(/\n\n/gim, '</p><p class="text-slate-300 mb-4">')
    .replace(/^(?!<[h|p|l|u|o|d|s|c|t|b|i|r|e|/])/gim, '<p class="text-slate-300 mb-4">')
    .replace(/(?<!>)$/gim, '</p>');
}

export default async function TroubleshootingPage() {
  let content = '';
  try {
    const filePath = join(process.cwd(), 'docs', 'TROUBLESHOOTING.md');
    content = await readFile(filePath, 'utf-8');
  } catch (error) {
    content = '# Troubleshooting\n\nContent loading...';
  }

  const html = markdownToHtml(content);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/docs"
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Documentation
        </Link>
        <div className="prose prose-invert prose-cyan max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </div>
  );
}

