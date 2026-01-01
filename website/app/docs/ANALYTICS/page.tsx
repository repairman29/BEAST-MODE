import { readFile } from 'fs/promises';
import { join } from 'path';
import Link from 'next/link';
import { ArrowLeft, TrendingUp, BarChart3, Activity, Users } from 'lucide-react';

export const metadata = {
  title: 'BEAST MODE - Unified Analytics Documentation',
  description: 'Learn how to use BEAST MODE unified analytics to track your development activity',
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

export default async function AnalyticsDocsPage() {
  const content = `# Unified Analytics

## Overview

BEAST MODE's Unified Analytics system tracks your development activity across all touchpoints - CLI sessions, API usage, web dashboard, and IDE integrations (like Cursor). All activity is tied to your GitHub account for a complete picture of your development workflow.

## Features

### 📊 Activity Tracking

- **CLI Sessions**: Track all commands run via the BEAST MODE CLI
- **API Usage**: Monitor API calls and endpoints accessed
- **Web Dashboard**: Track interactions in the web interface
- **IDE Integration**: Monitor activity in Cursor and other IDE extensions

### 🔗 GitHub Integration

All analytics are connected to your GitHub account, allowing you to:
- See activity across all your repositories
- Track improvements over time
- Understand your development patterns
- Identify optimization opportunities

### 📈 Metrics Tracked

- **Session Count**: Number of active sessions
- **Event Count**: Total events tracked
- **Activity Timeline**: Chronological view of all activity
- **Source Breakdown**: Activity by source (CLI, API, Web, IDE)
- **Repository Activity**: Activity per repository

## Accessing Analytics

1. Go to the **Dashboard**
2. Click on the **Analytics** tab in the sidebar
3. View your unified analytics dashboard

## Understanding the Dashboard

### Activity Overview

The dashboard shows:
- Total sessions across all sources
- Total events tracked
- Activity timeline
- Source breakdown (CLI, API, Web, IDE)

### Session Details

Each session shows:
- Start and end time
- Source (CLI, API, Web, IDE)
- Number of events
- Associated repository (if applicable)

### Event Details

Events include:
- Timestamp
- Event type
- Source
- Metadata (repository, action, etc.)

## Use Cases

### Track Development Activity

See how much time you spend in different tools and identify where you can optimize your workflow.

### Monitor Repository Activity

Understand which repositories you work on most and track improvements over time.

### Analyze Workflow Patterns

Identify patterns in your development workflow and optimize for efficiency.

## Privacy

All analytics data is:
- Tied to your GitHub account
- Stored securely
- Only visible to you
- Used to improve your experience

## Troubleshooting

### Not seeing analytics?

1. Make sure you're logged in with GitHub
2. Check that you've connected your GitHub account
3. Verify you've used BEAST MODE from at least one source (CLI, API, Web, or IDE)

### Missing data?

- CLI: Make sure you're using the latest version of the CLI
- IDE: Ensure the Cursor extension is installed and active
- API: Check that API calls are being made with proper authentication

## Next Steps

- Learn about [Enterprise Features](/docs/ENTERPRISE) for team analytics
- Check out the [API Documentation](/docs/API) for programmatic access
- Read the [User Guide](/docs/USER_GUIDE) for more features`;

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

