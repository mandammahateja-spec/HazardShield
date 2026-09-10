import { NextResponse } from 'next/server';
import { zoneService } from '@/lib/services/zoneService';

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Zone ID parameter is required',
        },
        { status: 400 }
      );
    }

    const zone = await zoneService.getZoneById(id);

    if (!zone) {
      return NextResponse.json(
        {
          success: false,
          error: `Hazard zone with ID '${id}' was not found`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: zone,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error retrieving hazard zone with ID ${params?.id}:`, error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve hazard zone',
      },
      { status: 500 }
    );
  }
}
