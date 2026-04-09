# STRATIQ

> Your brief is read. Your deck is ready. Let's get to the real work.

STRATIQ is an enterprise AI strategy assistant built for marketing agencies. It reads 40-70 page client briefs in seconds, extracts track-tagged strategic insights, and generates branded presentation decks — all while maintaining NDA compliance through Zero Data Retention (ZDR) AI processing.

## Try It

```bash
# Upload and analyze a brief
curl -X POST https://stratiq.nodeops.app/api/briefs/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@client-brief.pdf"

# Generate insights from the brief
curl -X POST https://stratiq.nodeops.app/api/briefs/{briefId}/analyze \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"cardCount": 5, "tracks": ["creative", "events", "art"]}'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "report-uuid",
    "insights": [
      {
        "id": "1",
        "title": "Core Campaign Objective",
        "summary": "The brief targets Gen Z urban consumers with a sustainability-led narrative, emphasizing eco-friendly packaging as the primary differentiator.",
        "pageReference": "Pages 12-15",
        "track": "creative",
        "confidence": 92
      }
    ],
    "processingMs": 4200
  }
}
```

## Features

### Module 1 — STRATIQ Reads (Brief Intelligence)
- PDF + DOCX ingestion (up to 100MB)
- AI-powered insight extraction (3-7 cards per brief)
- Track-based filtering (Creative / Events / Art / Digital / Strategy)
- Confidence scoring with page references
- Feedback loop (thumbs up/down per insight)
- Export as shareable report

### Module 2 — STRATIQ Builds (Deck Builder)
- AI slide sequencing from brief insights
- 3 branded templates (Modern Dark, Clean Light, Bold Color)
- Auto-generated captions and source attribution
- PPTX export (fully editable in PowerPoint / Google Slides)
- Slide-level editing before export

## API Reference

### `POST /api/briefs/upload`
Upload a client brief for analysis.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| file | File | Yes | PDF or DOCX file (max 100MB) |

### `POST /api/briefs/:id/analyze`
Generate insight cards from an uploaded brief.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| cardCount | number | No | Number of insights (3-7, default 5) |
| tracks | string[] | No | Filter by tracks |

### `POST /api/decks/generate`
Generate a presentation deck from brief insights.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| reportId | string | Yes | Insight report to build from |
| templateId | string | Yes | Template: modern-dark, clean-light, bold-color |
| title | string | Yes | Deck title |
| slideCount | number | No | Number of slides (10-25, default 15) |

### `GET /api/decks/:id/download`
Download the generated PPTX file.

### Error Codes
| Code | Description |
|------|-------------|
| INVALID_INPUT | Missing or invalid request parameters |
| FILE_TOO_LARGE | File exceeds 100MB limit |
| UNSUPPORTED_FORMAT | File is not PDF or DOCX |
| BRIEF_NOT_FOUND | Brief ID does not exist |
| DECK_NOT_FOUND | Deck ID does not exist |
| UNAUTHORIZED | Authentication required |
| AI_ERROR | AI processing failed |
| RATE_LIMITED | Too many requests |

## Data Privacy

STRATIQ enforces Zero Data Retention (ZDR) on all AI calls:
- Client brief content is processed in-memory only
- No data stored by the AI provider after response
- No data used for model training
- All files stored on our own infrastructure
- TLS 1.3 encryption end-to-end

## Pricing

| Operation | Credits | USD |
|-----------|---------|-----|
| Brief Analysis | 10 | $0.10 |
| Deck Generation | 25 | $0.25 |

> Processing 20 briefs + decks per week earns **$56/month** for the publisher.

## MCP Integration (AI Agents)

```json
GET https://stratiq.nodeops.app/mcp-tool.json
```

## Deploy Your Own

```bash
git clone https://github.com/naman485/createos-skill-stratiq
cd createos-skill-stratiq
cp .env.example .env
# Add your OPENROUTER_API_KEY
npm install
npx prisma db push
npm run dev
```

## Tech Stack
- Next.js 14 (App Router)
- Tailwind CSS + shadcn/ui
- Prisma (SQLite)
- OpenRouter (ZDR-compliant AI)
- pptxgenjs (PPTX generation)
- Deployed on [CreateOS](https://createos.nodeops.network)
