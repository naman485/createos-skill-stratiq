import { NextResponse } from 'next/server';

export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>STRATIQ API Documentation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; line-height: 1.6; }
    .container { max-width: 900px; margin: 0 auto; padding: 2rem; }
    h1 { font-size: 2.5rem; font-weight: 700; background: linear-gradient(135deg, #4361ee, #7c3aed); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin-bottom: 0.5rem; }
    .tagline { color: #94a3b8; font-size: 1.1rem; margin-bottom: 2rem; }
    h2 { font-size: 1.5rem; color: #f1f5f9; margin: 2rem 0 1rem; border-bottom: 1px solid #1e293b; padding-bottom: 0.5rem; }
    h3 { font-size: 1.15rem; color: #4361ee; margin: 1.5rem 0 0.75rem; }
    .badge { display: inline-block; padding: 2px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
    .badge-post { background: #166534; color: #86efac; }
    .badge-get { background: #1e40af; color: #93c5fd; }
    .badge-put { background: #854d0e; color: #fde68a; }
    .badge-delete { background: #991b1b; color: #fca5a5; }
    .endpoint { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 1.25rem; margin: 1rem 0; }
    .endpoint-title { font-size: 1rem; font-weight: 600; color: #f8fafc; display: flex; align-items: center; gap: 0.75rem; }
    .endpoint p { color: #94a3b8; margin-top: 0.5rem; font-size: 0.9rem; }
    pre { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 1rem; overflow-x: auto; margin: 0.75rem 0; }
    code { font-family: 'Fira Code', 'SF Mono', Consolas, monospace; font-size: 0.85rem; color: #a5b4fc; }
    pre code { color: #e2e8f0; }
    table { width: 100%; border-collapse: collapse; margin: 0.75rem 0; }
    th, td { padding: 0.6rem 1rem; text-align: left; border-bottom: 1px solid #1e293b; font-size: 0.9rem; }
    th { color: #94a3b8; font-weight: 600; }
    td { color: #cbd5e1; }
    td code { color: #a5b4fc; background: #1e293b; padding: 1px 6px; border-radius: 3px; }
    .zdr-banner { background: linear-gradient(135deg, #1e293b, #0f172a); border: 1px solid #4361ee33; border-radius: 8px; padding: 1.25rem; margin: 1.5rem 0; }
    .zdr-banner h3 { color: #4361ee; margin: 0 0 0.5rem; }
    .zdr-banner p { color: #94a3b8; font-size: 0.9rem; }
    .footer { margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid #1e293b; color: #64748b; font-size: 0.85rem; text-align: center; }
    a { color: #4361ee; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <h1>STRATIQ API</h1>
    <p class="tagline">Your brief is read. Your deck is ready. Enterprise AI strategy assistant.</p>

    <div class="zdr-banner">
      <h3>Zero Data Retention (ZDR)</h3>
      <p>All AI processing is ZDR-compliant. Client brief content is processed in-memory only — never stored by the AI provider, never used for training. NDA-safe by design.</p>
    </div>

    <h2>Authentication</h2>
    <p>All API endpoints (except <code>/health</code> and <code>/docs</code>) require authentication. Use JWT bearer tokens obtained from the NextAuth session.</p>

    <h2>Module 1 — Brief Intelligence</h2>

    <div class="endpoint">
      <div class="endpoint-title"><span class="badge badge-post">POST</span> /api/briefs/upload</div>
      <p>Upload a client brief (PDF or DOCX, max 100MB) for analysis.</p>
      <pre><code>curl -X POST https://stratiq.nodeops.app/api/briefs/upload \\
  -H "Authorization: Bearer TOKEN" \\
  -F "file=@client-brief.pdf"</code></pre>
    </div>

    <div class="endpoint">
      <div class="endpoint-title"><span class="badge badge-post">POST</span> /api/briefs/:id/analyze</div>
      <p>Generate 3-7 strategic insight cards from an uploaded brief.</p>
      <table>
        <tr><th>Field</th><th>Type</th><th>Default</th><th>Description</th></tr>
        <tr><td><code>cardCount</code></td><td>number</td><td>5</td><td>Number of insight cards (3-7)</td></tr>
        <tr><td><code>tracks</code></td><td>string[]</td><td>all</td><td>Filter: creative, events, art, digital, strategy</td></tr>
      </table>
      <pre><code>curl -X POST https://stratiq.nodeops.app/api/briefs/BRIEF_ID/analyze \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer TOKEN" \\
  -d '{"cardCount": 5}'</code></pre>
    </div>

    <div class="endpoint">
      <div class="endpoint-title"><span class="badge badge-get">GET</span> /api/briefs</div>
      <p>List all uploaded briefs for the authenticated user.</p>
    </div>

    <div class="endpoint">
      <div class="endpoint-title"><span class="badge badge-get">GET</span> /api/briefs/:id</div>
      <p>Get brief details including insight reports.</p>
    </div>

    <div class="endpoint">
      <div class="endpoint-title"><span class="badge badge-post">POST</span> /api/briefs/:id/feedback</div>
      <p>Submit feedback (thumbs up/down) on a specific insight card.</p>
      <table>
        <tr><th>Field</th><th>Type</th><th>Description</th></tr>
        <tr><td><code>insightId</code></td><td>string</td><td>ID of the insight card</td></tr>
        <tr><td><code>feedback</code></td><td>"up" | "down" | null</td><td>Feedback value</td></tr>
      </table>
    </div>

    <h2>Module 2 — Deck Builder</h2>

    <div class="endpoint">
      <div class="endpoint-title"><span class="badge badge-post">POST</span> /api/decks/generate</div>
      <p>Generate a branded presentation deck from brief insights.</p>
      <table>
        <tr><th>Field</th><th>Type</th><th>Required</th><th>Description</th></tr>
        <tr><td><code>reportId</code></td><td>string</td><td>Yes</td><td>Insight report to use</td></tr>
        <tr><td><code>templateId</code></td><td>string</td><td>Yes</td><td>modern-dark, clean-light, bold-color</td></tr>
        <tr><td><code>title</code></td><td>string</td><td>Yes</td><td>Deck title</td></tr>
        <tr><td><code>slideCount</code></td><td>number</td><td>No</td><td>10-25 slides (default 15)</td></tr>
      </table>
      <pre><code>curl -X POST https://stratiq.nodeops.app/api/decks/generate \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer TOKEN" \\
  -d '{"reportId": "REPORT_ID", "templateId": "modern-dark", "title": "Q4 Campaign Strategy"}'</code></pre>
    </div>

    <div class="endpoint">
      <div class="endpoint-title"><span class="badge badge-get">GET</span> /api/decks</div>
      <p>List all generated decks.</p>
    </div>

    <div class="endpoint">
      <div class="endpoint-title"><span class="badge badge-get">GET</span> /api/decks/:id/download</div>
      <p>Download the generated PPTX file.</p>
    </div>

    <div class="endpoint">
      <div class="endpoint-title"><span class="badge badge-put">PUT</span> /api/decks/:id/slides/:index</div>
      <p>Edit a specific slide's content before downloading.</p>
    </div>

    <h2>Response Format</h2>
    <pre><code>// Success
{
  "success": true,
  "data": { ... },
  "meta": { "processingMs": 4200 }
}

// Error
{
  "success": false,
  "error": {
    "code": "INVALID_INPUT",
    "message": "Readable explanation"
  }
}</code></pre>

    <h2>Error Codes</h2>
    <table>
      <tr><th>Code</th><th>HTTP</th><th>Description</th></tr>
      <tr><td><code>INVALID_INPUT</code></td><td>400</td><td>Missing or invalid parameters</td></tr>
      <tr><td><code>UNAUTHORIZED</code></td><td>401</td><td>Authentication required</td></tr>
      <tr><td><code>FORBIDDEN</code></td><td>403</td><td>Not authorized for this resource</td></tr>
      <tr><td><code>NOT_FOUND</code></td><td>404</td><td>Resource does not exist</td></tr>
      <tr><td><code>FILE_TOO_LARGE</code></td><td>413</td><td>File exceeds 100MB limit</td></tr>
      <tr><td><code>UNSUPPORTED_FORMAT</code></td><td>415</td><td>Only PDF and DOCX supported</td></tr>
      <tr><td><code>RATE_LIMITED</code></td><td>429</td><td>Too many requests</td></tr>
      <tr><td><code>AI_ERROR</code></td><td>502</td><td>AI processing failed</td></tr>
      <tr><td><code>INTERNAL_ERROR</code></td><td>500</td><td>Internal server error</td></tr>
    </table>

    <div class="footer">
      <p>STRATIQ v1.0.0 &mdash; Powered by <a href="https://nodeops.network">NodeOps</a> &middot; Deployed on <a href="https://createos.nodeops.network">CreateOS</a></p>
    </div>
  </div>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
