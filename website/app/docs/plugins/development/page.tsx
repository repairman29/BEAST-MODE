import { readFile } from 'fs/promises';
import { join } from 'path';
import { Metadata } from 'next';
import ReactMarkdown from 'react-markdown';

export const metadata: Metadata = {
  title: 'Plugin Development Guide - BEAST MODE',
  description: 'Learn how to develop plugins for BEAST MODE',
};

async function getPluginGuide() {
  try {
    const filePath = join(process.cwd(), 'PLUGIN_SYSTEM_GUIDE.md');
    const content = await readFile(filePath, 'utf-8');
    return content;
  } catch (error) {
    return '# Plugin Development Guide\n\nDocumentation coming soon...';
  }
}

export default async function PluginDevelopmentPage() {
  const content = await getPluginGuide();

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="prose prose-invert prose-lg max-w-none">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}

