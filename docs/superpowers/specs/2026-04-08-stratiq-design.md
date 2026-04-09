# STRATIQ — Enterprise AI Strategy Assistant

## Overview
STRATIQ is Tribe WW's private AI strategy assistant. Two modules:
1. **STRATIQ Reads** — Upload 40-70 page briefs → get 3-7 track-tagged insight cards
2. **STRATIQ Builds** — Take insights → generate branded PPTX decks with matched images

## Architecture

### Stack
- **Framework:** Next.js 14 (App Router) — single repo, single deployment
- **UI:** Tailwind CSS + shadcn/ui
- **Auth:** NextAuth.js (credentials provider for MVP, JWT sessions)
- **AI:** OpenRouter API with `zdr: true` on every call
- **Document Parsing:** pdf-parse (PDF), mammoth (DOCX)
- **PPTX Generation:** pptxgenjs
- **Database:** SQLite via Prisma (upgradeable to Postgres)
- **File Storage:** Local filesystem with `/uploads` directory
- **Deployment:** CreateOS (Node.js 20, 500m CPU, 1024MB RAM)

### Data Flow

```
Brief Upload → Parse PDF/DOCX → Extract text chunks
  → Send to OpenRouter (ZDR) → Receive insight cards
  → Store in SQLite → Display in UI

Deck Generation → Load insight report → AI plans slide sequence (ZDR)
  → Match assets per slide → Generate captions/citations
  → Build PPTX → Store + serve download
```

## Module 1 — STRATIQ Reads (Brief Intelligence)

### API Routes
- `POST /api/briefs/upload` — Accept PDF/DOCX (max 100MB), parse, store
- `POST /api/briefs/[id]/analyze` — Run ZDR AI analysis, return insight cards
- `GET /api/briefs` — List user's briefs
- `GET /api/briefs/[id]` — Get brief with insights
- `DELETE /api/briefs/[id]` — Remove brief + insights
- `POST /api/briefs/[id]/feedback` — Thumbs up/down on insight card

### Insight Card Schema
```typescript
interface InsightCard {
  id: string;
  title: string;
  summary: string; // max 3 sentences
  pageReference: string;
  track: 'creative' | 'events' | 'art' | 'digital' | 'strategy' | 'all';
  confidence: number; // 0-100
  feedback?: 'up' | 'down' | null;
}
```

### UI Pages
- `/dashboard` — Overview with recent briefs, quick stats
- `/briefs` — List all uploaded briefs
- `/briefs/[id]` — Brief detail with insight cards, track filter, export

## Module 2 — STRATIQ Builds (Deck Builder)

### API Routes
- `POST /api/decks/generate` — Generate deck from brief/insights
- `GET /api/decks` — List user's decks
- `GET /api/decks/[id]` — Get deck with slides
- `GET /api/decks/[id]/download` — Download PPTX
- `PUT /api/decks/[id]/slides/[slideIdx]` — Edit slide content
- `POST /api/decks/[id]/slides/[slideIdx]/swap-image` — Get alternative images

### Slide Schema
```typescript
interface Slide {
  index: number;
  type: 'title' | 'insight' | 'data' | 'case-study' | 'closing';
  title: string;
  content: string;
  imageUrl?: string;
  imageCaption?: string; // max 15 words
  sourceAttribution?: string;
  dataPoints?: { label: string; value: string; source: string }[];
}
```

### Templates
MVP includes 3 branded templates:
1. **Modern Dark** — Dark background, white text, accent gradients
2. **Clean Light** — White background, dark text, minimal
3. **Bold Color** — Vibrant accent colors, large typography

### UI Pages
- `/decks` — List all generated decks
- `/decks/new` — Select brief + template → generate
- `/decks/[id]` — Deck preview with slide editor, image swap, download

## Authentication

### NextAuth.js Configuration
- **Credentials Provider** — email/password for MVP
- **JWT sessions** — stateless, stored client-side
- **Middleware** — protect all `/dashboard`, `/briefs`, `/decks` routes
- **User model** — id, email, name, hashedPassword, role, createdAt

## Data Privacy (ZDR)

### Enforcement Layer
Every OpenRouter API call includes:
```typescript
headers: {
  'HTTP-Referer': 'https://stratiq.nodeops.app',
  'X-Title': 'STRATIQ'
},
body: {
  // ... prompt data
  provider: { data_collection: 'deny' }
}
```

### Data Handling Rules
1. Brief text sent to AI is chunked — never the full document at once
2. AI responses stored in our DB, not on provider servers
3. All file uploads stay on our server/S3
4. No client data logged to stdout (only request metadata)

## Database Schema (Prisma)

### Models
- **User** — id, email, name, passwordHash, role, createdAt
- **Brief** — id, userId, filename, originalName, fileSize, status, textContent, createdAt
- **InsightReport** — id, briefId, userId, insights (JSON), trackFilter, createdAt
- **Deck** — id, userId, briefId, reportId, templateId, title, slides (JSON), status, filePath, createdAt
- **AuditLog** — id, userId, action, resourceType, resourceId, createdAt

## File Structure
```
/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx (landing)
│   │   ├── globals.css
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── briefs/
│   │   │   ├── page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── decks/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── briefs/
│   │       ├── decks/
│   │       └── health/route.ts
│   ├── components/
│   │   ├── ui/ (shadcn)
│   │   ├── layout/
│   │   ├── briefs/
│   │   └── decks/
│   └── lib/
│       ├── ai/openrouter.ts
│       ├── ai/prompts.ts
│       ├── documents/parser.ts
│       ├── deck/generator.ts
│       ├── auth.ts
│       ├── db.ts
│       └── utils.ts
├── prisma/schema.prisma
├── public/
├── package.json
├── next.config.js
├── tailwind.config.ts
├── .env.example
├── README.md
└── mcp-tool.json
```

## Performance Targets
- Brief upload + parse: < 5s
- Insight generation (AI): < 30s for 70-page brief
- Deck generation: < 60s for 15-slide deck
- PPTX download: < 3s
- Page loads: < 200ms (SSR)

## Security
- Password hashing: bcrypt (12 rounds)
- JWT secret: env var
- File upload validation: type + size checks
- SQL injection: prevented by Prisma ORM
- XSS: React auto-escaping + CSP headers
- CORS: configured for production domain only
- Rate limiting: 100 req/min per user on AI endpoints
