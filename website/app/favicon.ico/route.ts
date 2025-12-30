import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Try to read from public directory first
    const publicPath = path.join(process.cwd(), 'public', 'favicon.ico');
    if (fs.existsSync(publicPath)) {
      const content = fs.readFileSync(publicPath, 'utf-8');
      return new NextResponse(content, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    }
  } catch (error) {
    console.error('Error reading favicon:', error);
  }

  // Fallback SVG
  const fallbackSvg = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="32" height="32" rx="6" fill="url(#gradient)"/>
    <path d="M16 8L20 12L16 16L12 12L16 8Z" fill="white" opacity="0.9"/>
    <path d="M8 16L12 20L16 16L12 12L8 16Z" fill="white" opacity="0.7"/>
    <path d="M16 16L20 20L24 16L20 12L16 16Z" fill="white" opacity="0.7"/>
    <path d="M16 24L20 20L16 16L12 20L16 24Z" fill="white" opacity="0.5"/>
    <defs>
      <linearGradient id="gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stop-color="#06b6d4"/>
        <stop offset="100%" stop-color="#a855f7"/>
      </linearGradient>
    </defs>
  </svg>`;

  return new NextResponse(fallbackSvg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

