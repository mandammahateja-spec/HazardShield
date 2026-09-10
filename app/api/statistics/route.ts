import { NextResponse } from 'next/server';
import { zoneService } from '@/lib/services/zoneService';

export async function GET() {
  try {
    const stats = await zoneService.getStatistics();
    return NextResponse.json(
      {
        success: true,
        data: stats,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error calculating hazard statistics:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to calculate hazard statistics',
      },
      { status: 500 }
    );
  }
}
