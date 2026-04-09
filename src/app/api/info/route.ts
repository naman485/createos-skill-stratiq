// ============================================================================
// GET /api/info — Service metadata (CreateOS discovery, no auth required)
// ============================================================================

import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    success: true,
    data: {
      name: 'stratiq',
      version: '1.0.0',
      description:
        'AI-powered marketing brief intelligence — upload briefs, extract strategic insights, generate presentation decks.',
      pricing: {
        credits: 10,
        usd: '$0.10',
      },
      endpoints: [
        {
          method: 'POST',
          path: '/api/briefs/upload',
          description: 'Upload a PDF or DOCX brief for parsing',
        },
        {
          method: 'GET',
          path: '/api/briefs',
          description: 'List all briefs for the authenticated user',
        },
        {
          method: 'GET',
          path: '/api/briefs/:id',
          description: 'Get a brief with its insight reports',
        },
        {
          method: 'DELETE',
          path: '/api/briefs/:id',
          description: 'Delete a brief and all associated data',
        },
        {
          method: 'POST',
          path: '/api/briefs/:id/analyze',
          description: 'Run AI analysis on a brief to extract insight cards',
        },
        {
          method: 'POST',
          path: '/api/briefs/:id/feedback',
          description: 'Submit thumbs-up/down feedback on an insight card',
        },
      ],
      docs: '/docs',
      health: '/api/health',
      mcp: '/mcp-tool.json',
    },
  });
}
