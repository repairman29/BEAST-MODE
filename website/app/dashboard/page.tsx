"use client";

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import BeastModeDashboard from '../../components/beast-mode/BeastModeDashboard'

export default function DashboardPage() {
  const searchParams = useSearchParams();

  return (
    <div className="fixed inset-0 overflow-hidden pt-0" style={{ pointerEvents: 'auto' }}>
      <BeastModeDashboard initialView={searchParams.get('view') || null} />
    </div>
  )
}
