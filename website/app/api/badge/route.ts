import { NextRequest, NextResponse } from 'next/server';

/**
 * Quality Badge API
 * 
 * Generates SVG badge showing repository quality score
 * PLG: Instant value, viral, embeddable
 * 
 * Usage: <img src="https://beast-mode.com/api/badge?repo=owner/repo" />
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const repo = searchParams.get('repo');
  const style = searchParams.get('style') || 'flat'; // flat, plastic, flat-square
  
  if (!repo) {
    return NextResponse.json({ error: 'Repository name required' }, { status: 400 });
  }
  
  try {
    // Get quality score
    const qualityResponse = await fetch(`${process.env.BEAST_MODE_API || 'http://localhost:3000'}/api/repos/quality`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repo, platform: 'badge' })
    });
    
    if (!qualityResponse.ok) {
      throw new Error('Quality API failed');
    }
    
    const qualityData = await qualityResponse.json();
    const quality = Math.round(qualityData.quality * 100);
    const confidence = Math.round(qualityData.confidence * 100);
    
    // Determine color based on quality
    let color = '#e05d44'; // red
    if (quality >= 80) color = '#4c1'; // green
    else if (quality >= 60) color = '#dfb317'; // yellow
    else if (quality >= 40) color = '#fe7d37'; // orange
    
    // Generate SVG badge
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="20">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <mask id="a">
    <rect width="150" height="20" rx="3" fill="#fff"/>
  </mask>
  <g mask="url(#a)">
    <path fill="#555" d="M0 0h63v20H0z"/>
    <path fill="${color}" d="M63 0h87v20H63z"/>
    <path fill="url(#b)" d="M0 0h150v20H0z"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="31.5" y="15" fill="#010101" fill-opacity=".3">quality</text>
    <text x="31.5" y="14">quality</text>
    <text x="106.5" y="15" fill="#010101" fill-opacity=".3">${quality}%</text>
    <text x="106.5" y="14">${quality}%</text>
  </g>
</svg>`;
    
    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600'
      }
    });
  } catch (error) {
    // Return error badge
    const errorSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="20">
  <rect width="120" height="20" fill="#e05d44" rx="3"/>
  <text x="60" y="14" fill="#fff" text-anchor="middle" font-family="DejaVu Sans" font-size="11">error</text>
</svg>`;
    
    return new NextResponse(errorSvg, {
      headers: { 'Content-Type': 'image/svg+xml' }
    });
  }
}
