'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

/**
 * Admin Dashboard Home
 * 
 * INTERNAL ADMIN TOOL - Central hub for admin pages
 */

export default function AdminDashboard() {
  const adminPages = [
    {
      title: 'PLG Usage',
      description: 'Track component usage and adoption',
      href: '/admin/plg-usage',
      icon: '📊'
    },
    {
      title: 'Feedback Stats',
      description: 'ML feedback collection statistics',
      href: '/admin/feedback',
      icon: '💡'
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-slate-400">
          Internal tools and analytics for BEAST MODE team
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {adminPages.map((page) => (
          <Link key={page.href} href={page.href}>
            <Card className="bg-slate-900/90 border-slate-800 hover:border-cyan-500/50 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <span className="text-2xl">{page.icon}</span>
                  {page.title}
                </CardTitle>
                <CardDescription>{page.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8 bg-amber-900/20 border border-amber-500/50 rounded-lg p-4">
        <p className="text-sm text-amber-400">
          ⚠️ <strong>Internal Use Only:</strong> These pages are for BEAST MODE team members only.
          Customer-facing pages are available at <Link href="/quality" className="text-cyan-400 hover:underline">/quality</Link> and <Link href="/plg-demo" className="text-cyan-400 hover:underline">/plg-demo</Link>.
        </p>
      </div>
    </div>
  );
}
