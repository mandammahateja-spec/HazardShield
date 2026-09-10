import { NextResponse } from 'next/server';
import { zoneService } from '@/lib/services/zoneService';

export async function GET() {
  try {
    const zones = await zoneService.getAllZones();
    return NextResponse.json(
      {
        success: true,
        count: zones.length,
        data: zones,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error retrieving hazard zones:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve hazard zones',
      },
      { status: 500 }
    );
  }
}
