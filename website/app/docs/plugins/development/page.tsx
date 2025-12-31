import { readFile } from 'fs/promises';
import { join } from 'path';
import { Metadata } from 'next';

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

function MarkdownContent({ content }: { content: string }) {
  // Simple markdown rendering without external dependencies
  const lines = content.split('\n');
  const elements: JSX.Element[] = [];
  let currentParagraph: string[] = [];
  let inCodeBlock = false;
  let codeBlockContent: string[] = [];
  let codeLanguage = '';

  const renderParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(' ');
      if (text.trim()) {
        elements.push(
          <p key={`p-${elements.length}`} className="mb-4 text-slate-300 leading-relaxed">
            {text.split(/(\[.*?\]\(.*?\)|`.*?`|\*\*.*?\*\*)/).map((part, i) => {
              // Handle links [text](url)
              if (part.match(/^\[.*?\]\(.*?\)$/)) {
                const match = part.match(/\[(.*?)\]\((.*?)\)/);
                if (match) {
                  return (
                    <a
                      key={i}
                      href={match[2]}
                      className="text-cyan-400 hover:text-cyan-300 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {match[1]}
                    </a>
                  );
                }
              }
              // Handle inline code `code`
              if (part.match(/^`.*?`$/)) {
                return (
                  <code key={i} className="bg-slate-900 px-1.5 py-0.5 rounded text-cyan-300 text-sm">
                    {part.slice(1, -1)}
                  </code>
                );
              }
              // Handle bold **text**
              if (part.match(/^\*\*.*?\*\*$/)) {
                return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
              }
              return <span key={i}>{part}</span>;
            })}
          </p>
        );
      }
      currentParagraph = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // End code block
        elements.push(
          <pre key={`code-${elements.length}`} className="bg-slate-950 border border-slate-800 rounded-lg p-4 mb-4 overflow-x-auto">
            <code className="text-sm text-slate-300 font-mono whitespace-pre">
              {codeBlockContent.join('\n')}
            </code>
          </pre>
        );
        codeBlockContent = [];
        inCodeBlock = false;
        codeLanguage = '';
      } else {
        // Start code block
        renderParagraph();
        codeLanguage = line.slice(3).trim();
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    if (line.startsWith('# ')) {
      renderParagraph();
      elements.push(
        <h1 key={`h1-${elements.length}`} className="text-4xl font-bold text-white mb-6 mt-8">
          {line.slice(2)}
        </h1>
      );
    } else if (line.startsWith('## ')) {
      renderParagraph();
      elements.push(
        <h2 key={`h2-${elements.length}`} className="text-3xl font-bold text-white mb-4 mt-8">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith('### ')) {
      renderParagraph();
      elements.push(
        <h3 key={`h3-${elements.length}`} className="text-2xl font-semibold text-white mb-3 mt-6">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith('- ')) {
      renderParagraph();
      elements.push(
        <li key={`li-${elements.length}`} className="ml-6 mb-2 text-slate-300 list-disc">
          {line.slice(2)}
        </li>
      );
    } else if (line.trim() === '---') {
      renderParagraph();
      elements.push(
        <hr key={`hr-${elements.length}`} className="my-8 border-slate-800" />
      );
    } else if (line.trim() === '') {
      renderParagraph();
    } else {
      currentParagraph.push(line);
    }
  }

  renderParagraph();

  return <div>{elements}</div>;
}

export default async function PluginDevelopmentPage() {
  const content = await getPluginGuide();

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="border-b border-slate-800 bg-black/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <a href="/" className="text-cyan-400 hover:text-cyan-300">
            ← Back to BEAST MODE
          </a>
        </div>
      </nav>
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="prose prose-invert max-w-none">
          <MarkdownContent content={content} />
        </div>
      </div>
    </div>
  );
}
