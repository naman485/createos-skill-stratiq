// ============================================================================
// GET /api/health — Health check (no auth required)
// ============================================================================

import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    success: true,
    data: {
      status: 'ok',
      uptime: Math.round(process.uptime()),
      version: '1.0.0',
      service: 'stratiq',
    },
  });
}
