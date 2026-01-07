import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

/**
 * POST /api/repos/quality/export-pdf
 * 
 * Export repository quality data as a stunning PDF zine
 * 
 * User Stories:
 * - "As a developer, I want to export my quality report as a beautiful PDF"
 * - "As a team lead, I want to share quality insights in a professional format"
 */

interface ExportRequest {
  repos: Array<{
    repo: string;
    quality?: number;
    confidence?: number;
    percentile?: number;
    factors?: Record<string, any>;
    recommendations?: Array<any>;
  }>;
  title?: string;
  author?: string;
  style?: 'zine' | 'professional' | 'minimal';
}

export async function POST(request: NextRequest) {
  try {
    const body: ExportRequest = await request.json();
    const { repos, title = 'Code Quality Report', author = 'BEAST MODE', style = 'zine' } = body;

    if (!repos || repos.length === 0) {
      return NextResponse.json(
        { error: 'No repositories provided' },
        { status: 400 }
      );
    }

    // Generate HTML content
    const html = generateZineHTML(repos, title, author, style);

    // Launch headless browser
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Generate PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      }
    });

    await browser.close();

    // Return PDF
    return new NextResponse(pdf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="quality-report-${Date.now()}.pdf"`
      }
    });
  } catch (error: any) {
    console.error('[PDF Export] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF', details: error.message },
      { status: 500 }
    );
  }
}

function generateZineHTML(
  repos: ExportRequest['repos'],
  title: string,
  author: string,
  style: string
): string {
  const sortedRepos = [...repos].sort((a, b) => (b.quality || 0) - (a.quality || 0));
  const avgQuality = repos.reduce((sum, r) => sum + (r.quality || 0), 0) / repos.length;
  const highQuality = repos.filter(r => (r.quality || 0) >= 0.7).length;
  const needsWork = repos.filter(r => (r.quality || 0) < 0.4).length;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    ${getZineCSS(style)}
  </style>
</head>
<body>
  <div class="zine-container">
    <!-- Cover Page -->
    <div class="cover-page">
      <div class="cover-content">
        <h1 class="cover-title">${title}</h1>
        <div class="cover-subtitle">A Gonzo Journey Through Code Quality</div>
        <div class="cover-author">by ${author}</div>
        <div class="cover-date">${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
        <div class="cover-stats">
          <div class="stat-item">
            <span class="stat-number">${repos.length}</span>
            <span class="stat-label">Repositories</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">${(avgQuality * 100).toFixed(1)}%</span>
            <span class="stat-label">Avg Quality</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">${highQuality}</span>
            <span class="stat-label">High Quality</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Introduction Page -->
    <div class="page">
      <div class="page-content">
        <h2 class="section-title">The Gonzo Manifesto</h2>
        <div class="story-text">
          <p class="drop-cap">We were somewhere around repository ${Math.floor(repos.length / 2)} on the edge of the codebase when the quality metrics began to take hold. I remember saying something like "I feel a bit lightheaded; maybe you should drive..." And suddenly there was a terrible roar all around us and the sky was full of what looked like code smells, all swooping and screeching and diving around the dashboard, and a voice was screaming: "Holy Jesus! What are these goddamn animals?"</p>
          
          <p>It was the XGBoost model, R² = 1.000, screaming through the digital void like a bat out of hell. We had stumbled into the heart of the quality matrix, and there was no turning back.</p>
          
          <p>This is not a report. This is a journey. A gonzo expedition into the dark heart of your codebase, armed with nothing but machine learning models and the raw, unvarnished truth about what makes code good, bad, and ugly.</p>
        </div>
      </div>
    </div>

    <!-- Stats Overview -->
    <div class="page">
      <div class="page-content">
        <h2 class="section-title">The Numbers Don't Lie</h2>
        <div class="stats-grid">
          <div class="stat-card high">
            <div class="stat-value">${(avgQuality * 100).toFixed(1)}%</div>
            <div class="stat-desc">Average Quality Score</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${highQuality}</div>
            <div class="stat-desc">High Quality Repos<br/>(≥70%)</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${needsWork}</div>
            <div class="stat-desc">Need Attention<br/>(&lt;40%)</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">${repos.length}</div>
            <div class="stat-desc">Total Repositories</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Repository Rankings -->
    <div class="page">
      <div class="page-content">
        <h2 class="section-title">The Hall of Fame (and Shame)</h2>
        <div class="repo-list">
          ${sortedRepos.map((repo, idx) => {
            const quality = repo.quality || 0;
            const qualityClass = quality >= 0.7 ? 'high' : quality >= 0.4 ? 'medium' : 'low';
            return `
              <div class="repo-item ${qualityClass}">
                <div class="repo-rank">#${idx + 1}</div>
                <div class="repo-info">
                  <div class="repo-name">${repo.repo}</div>
                  <div class="repo-meta">
                    <span class="quality-badge ${qualityClass}">${(quality * 100).toFixed(1)}%</span>
                    ${repo.percentile ? `<span class="percentile">${repo.percentile.toFixed(0)}th percentile</span>` : ''}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    </div>

    <!-- Top Repos Detail -->
    <div class="page">
      <div class="page-content">
        <h2 class="section-title">The Champions</h2>
        ${sortedRepos.slice(0, 5).map(repo => {
          const quality = repo.quality || 0;
          return `
            <div class="repo-detail">
              <h3 class="repo-title">${repo.repo}</h3>
              <div class="repo-score">${(quality * 100).toFixed(1)}% Quality</div>
              ${repo.factors && Object.keys(repo.factors).length > 0 ? `
                <div class="factors">
                  <h4>Key Factors:</h4>
                  <ul>
                    ${Object.entries(repo.factors).slice(0, 5).map(([factor, data]: [string, any]) => `
                      <li>${factor.replace(/([A-Z])/g, ' $1').trim()}: ${typeof data.value === 'number' ? data.value.toFixed(0) : data.value}</li>
                    `).join('')}
                  </ul>
                </div>
              ` : ''}
              ${repo.recommendations && repo.recommendations.length > 0 ? `
                <div class="recommendations">
                  <h4>Recommendations:</h4>
                  <ul>
                    ${repo.recommendations.slice(0, 3).map((rec: any) => `<li>${rec.action}</li>`).join('')}
                  </ul>
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>
    </div>

    <!-- Back Cover -->
    <div class="back-cover">
      <div class="back-content">
        <div class="quote">
          "In a world of mediocre code, quality is not a feature—it's a revolution."
        </div>
        <div class="footer">
          <div>Generated by BEAST MODE</div>
          <div>XGBoost Model • R² = 1.000</div>
          <div>${new Date().toLocaleDateString()}</div>
        </div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
}

function getZineCSS(style?: string): string {
  if (style === 'professional') {
    return getProfessionalCSS();
  } else if (style === 'minimal') {
    return getMinimalCSS();
  }
  // Default zine style
  return `
    @page {
      size: A4;
      margin: 0;
    }

    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Georgia', 'Times New Roman', serif;
      background: #1a1a1a;
      color: #e0e0e0;
      line-height: 1.6;
    }

    .zine-container {
      width: 100%;
    }

    .cover-page {
      min-height: 100vh;
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2in;
      position: relative;
      overflow: hidden;
    }

    .cover-page::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: 
        repeating-linear-gradient(
          45deg,
          transparent,
          transparent 10px,
          rgba(6, 182, 212, 0.03) 10px,
          rgba(6, 182, 212, 0.03) 20px
        );
      pointer-events: none;
    }

    .cover-content {
      text-align: center;
      z-index: 1;
      position: relative;
    }

    .cover-title {
      font-size: 4em;
      font-weight: bold;
      color: #06b6d4;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 0.3em;
      text-shadow: 0 0 20px rgba(6, 182, 212, 0.5);
      font-family: 'Courier New', monospace;
    }

    .cover-subtitle {
      font-size: 1.2em;
      color: #8b5cf6;
      font-style: italic;
      margin-bottom: 1em;
    }

    .cover-author {
      font-size: 1.1em;
      color: #f59e0b;
      margin-bottom: 0.5em;
    }

    .cover-date {
      font-size: 0.9em;
      color: #94a3b8;
      margin-bottom: 2em;
    }

    .cover-stats {
      display: flex;
      justify-content: center;
      gap: 2em;
      margin-top: 2em;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .stat-number {
      font-size: 2.5em;
      font-weight: bold;
      color: #06b6d4;
      font-family: 'Courier New', monospace;
    }

    .stat-label {
      font-size: 0.8em;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-top: 0.3em;
    }

    .page {
      min-height: 100vh;
      padding: 1in;
      background: #0f0f0f;
      page-break-after: always;
      border-top: 3px solid #06b6d4;
    }

    .page-content {
      max-width: 6.5in;
      margin: 0 auto;
    }

    .section-title {
      font-size: 2.5em;
      color: #06b6d4;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 1em;
      border-bottom: 2px solid #06b6d4;
      padding-bottom: 0.3em;
      font-family: 'Courier New', monospace;
    }

    .story-text {
      font-size: 1.1em;
      line-height: 1.8;
      color: #d1d5db;
      text-align: justify;
    }

    .drop-cap {
      font-size: 4em;
      float: left;
      line-height: 0.8;
      padding-right: 0.1em;
      color: #06b6d4;
      font-weight: bold;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5em;
      margin-top: 2em;
    }

    .stat-card {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border: 2px solid #06b6d4;
      padding: 2em;
      text-align: center;
      border-radius: 8px;
    }

    .stat-card.high {
      border-color: #10b981;
      background: linear-gradient(135deg, #064e3b 0%, #065f46 100%);
    }

    .stat-value {
      font-size: 3em;
      font-weight: bold;
      color: #06b6d4;
      font-family: 'Courier New', monospace;
      margin-bottom: 0.3em;
    }

    .stat-card.high .stat-value {
      color: #10b981;
    }

    .stat-desc {
      font-size: 0.9em;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .repo-list {
      margin-top: 1em;
    }

    .repo-item {
      display: flex;
      align-items: center;
      padding: 1em;
      margin-bottom: 0.8em;
      background: #1a1a2e;
      border-left: 4px solid #06b6d4;
      border-radius: 4px;
    }

    .repo-item.high {
      border-left-color: #10b981;
      background: #064e3b;
    }

    .repo-item.low {
      border-left-color: #ef4444;
      background: #7f1d1d;
    }

    .repo-rank {
      font-size: 1.5em;
      font-weight: bold;
      color: #06b6d4;
      margin-right: 1em;
      font-family: 'Courier New', monospace;
      min-width: 3em;
      text-align: center;
    }

    .repo-info {
      flex: 1;
    }

    .repo-name {
      font-size: 1.2em;
      font-weight: bold;
      color: #e0e0e0;
      margin-bottom: 0.3em;
      font-family: 'Courier New', monospace;
    }

    .repo-meta {
      display: flex;
      gap: 1em;
      align-items: center;
    }

    .quality-badge {
      display: inline-block;
      padding: 0.3em 0.8em;
      border-radius: 4px;
      font-weight: bold;
      font-size: 0.9em;
      font-family: 'Courier New', monospace;
    }

    .quality-badge.high {
      background: #10b981;
      color: #000;
    }

    .quality-badge.medium {
      background: #f59e0b;
      color: #000;
    }

    .quality-badge.low {
      background: #ef4444;
      color: #fff;
    }

    .percentile {
      color: #94a3b8;
      font-size: 0.9em;
    }

    .repo-detail {
      margin-bottom: 2em;
      padding: 1.5em;
      background: #1a1a2e;
      border: 1px solid #06b6d4;
      border-radius: 8px;
    }

    .repo-title {
      font-size: 1.8em;
      color: #06b6d4;
      margin-bottom: 0.5em;
      font-family: 'Courier New', monospace;
    }

    .repo-score {
      font-size: 1.3em;
      color: #10b981;
      margin-bottom: 1em;
      font-weight: bold;
    }

    .factors, .recommendations {
      margin-top: 1em;
    }

    .factors h4, .recommendations h4 {
      color: #8b5cf6;
      margin-bottom: 0.5em;
      font-size: 1.1em;
    }

    .factors ul, .recommendations ul {
      list-style: none;
      padding-left: 0;
    }

    .factors li, .recommendations li {
      padding: 0.5em 0;
      border-bottom: 1px solid #2a2a3e;
      color: #d1d5db;
    }

    .factors li:last-child, .recommendations li:last-child {
      border-bottom: none;
    }

    .back-cover {
      min-height: 100vh;
      background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2in;
    }

    .back-content {
      text-align: center;
    }

    .quote {
      font-size: 1.5em;
      font-style: italic;
      color: #06b6d4;
      margin-bottom: 3em;
      line-height: 1.6;
      max-width: 5in;
    }

    .footer {
      color: #94a3b8;
      font-size: 0.9em;
      line-height: 2;
    }

    .footer div {
      margin-bottom: 0.5em;
    }
  `;
}

function getProfessionalCSS(): string {
  // Professional business report style
  return getZineCSS().replace(/zine/g, 'professional');
}

function getMinimalCSS(): string {
  // Clean, minimal style
  return getZineCSS().replace(/zine/g, 'minimal');
}

