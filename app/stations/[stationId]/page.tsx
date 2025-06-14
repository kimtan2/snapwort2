// app/stations/[stationId]/page.tsx
'use client';

import { StationPage } from '@/components/station/StationPage';
import { use } from 'react';

interface StationPageProps {
  params: Promise<{
    stationId: string;
  }>;
}

export default function StationPageRoute({ params }: StationPageProps) {
  const resolvedParams = use(params);
  return <StationPage stationId={resolvedParams.stationId} />;
}