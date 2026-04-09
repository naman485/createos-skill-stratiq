// ============================================================================
// STRATIQ — Document Parsing (PDF, DOCX)
// ============================================================================

import { DocumentParseError } from '@/lib/types';
import type { ParsedDocument } from '@/lib/types';

// ---------------------------------------------------------------------------
// PDF Parsing
// ---------------------------------------------------------------------------

export async function parsePDF(buffer: Buffer): Promise<ParsedDocument> {
  try {
    // pdf-parse uses a default export
    const pdfParse = (await import('pdf-parse')).default;
    const result = await pdfParse(buffer);

    if (!result.text || result.text.trim().length === 0) {
      throw new DocumentParseError(
        'PDF appears to contain no extractable text. It may be a scanned image.',
        'EMPTY_PDF',
      );
    }

    return {
      text: result.text,
      pageCount: result.numpages ?? 1,
    };
  } catch (error: unknown) {
    if (error instanceof DocumentParseError) throw error;

    throw new DocumentParseError(
      error instanceof Error
        ? `Failed to parse PDF: ${error.message}`
        : 'Failed to parse PDF: unknown error',
      'PDF_PARSE_ERROR',
      error,
    );
  }
}

// ---------------------------------------------------------------------------
// DOCX Parsing
// ---------------------------------------------------------------------------

export async function parseDOCX(buffer: Buffer): Promise<ParsedDocument> {
  try {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ buffer });

    if (!result.value || result.value.trim().length === 0) {
      throw new DocumentParseError(
        'DOCX appears to contain no extractable text.',
        'EMPTY_DOCX',
      );
    }

    // mammoth doesn't provide page count; estimate from content
    // Typical page is roughly 3000 characters
    const estimatedPages = Math.max(1, Math.ceil(result.value.length / 3000));

    return {
      text: result.value,
      pageCount: estimatedPages,
    };
  } catch (error: unknown) {
    if (error instanceof DocumentParseError) throw error;

    throw new DocumentParseError(
      error instanceof Error
        ? `Failed to parse DOCX: ${error.message}`
        : 'Failed to parse DOCX: unknown error',
      'DOCX_PARSE_ERROR',
      error,
    );
  }
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

const SUPPORTED_MIME_TYPES: Record<
  string,
  (buffer: Buffer) => Promise<ParsedDocument>
> = {
  'application/pdf': parsePDF,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    parseDOCX,
  // Common alias
  'application/docx': parseDOCX,
};

/**
 * Parse a document buffer based on its MIME type.
 * Throws DocumentParseError for unsupported formats or corrupt files.
 */
export async function parseDocument(
  buffer: Buffer,
  mimeType: string,
): Promise<ParsedDocument> {
  const normalizedMime = mimeType.toLowerCase().trim();
  const parser = SUPPORTED_MIME_TYPES[normalizedMime];

  if (!parser) {
    throw new DocumentParseError(
      `Unsupported document format: ${mimeType}. Supported formats: PDF, DOCX.`,
      'UNSUPPORTED_FORMAT',
    );
  }

  if (!buffer || buffer.length === 0) {
    throw new DocumentParseError(
      'Document buffer is empty',
      'EMPTY_BUFFER',
    );
  }

  return parser(buffer);
}

// ---------------------------------------------------------------------------
// Text Chunking
// ---------------------------------------------------------------------------

/**
 * Split text into overlapping chunks suitable for AI processing.
 *
 * @param text         Full document text
 * @param maxChunkSize Maximum characters per chunk (default 8000)
 * @param overlap      Character overlap between consecutive chunks (default 200)
 * @returns Array of text chunks
 */
export function chunkText(
  text: string,
  maxChunkSize: number = 8000,
  overlap: number = 200,
): string[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const trimmed = text.trim();

  // If the text fits in a single chunk, return it directly
  if (trimmed.length <= maxChunkSize) {
    return [trimmed];
  }

  const chunks: string[] = [];
  let start = 0;

  while (start < trimmed.length) {
    let end = start + maxChunkSize;

    if (end >= trimmed.length) {
      // Last chunk — take everything remaining
      chunks.push(trimmed.slice(start).trim());
      break;
    }

    // Try to break at a paragraph boundary first
    const paragraphBreak = trimmed.lastIndexOf('\n\n', end);
    if (paragraphBreak > start + maxChunkSize * 0.5) {
      end = paragraphBreak;
    } else {
      // Fall back to sentence boundary
      const sentenceBreak = trimmed.lastIndexOf('. ', end);
      if (sentenceBreak > start + maxChunkSize * 0.5) {
        end = sentenceBreak + 1; // Include the period
      } else {
        // Fall back to word boundary
        const wordBreak = trimmed.lastIndexOf(' ', end);
        if (wordBreak > start + maxChunkSize * 0.5) {
          end = wordBreak;
        }
        // else: hard cut at maxChunkSize (rare, only with very long words)
      }
    }

    chunks.push(trimmed.slice(start, end).trim());

    // Next chunk starts with overlap for context continuity
    start = end - overlap;
    if (start < 0) start = 0;

    // Safety: prevent infinite loops if overlap >= chunk size
    if (start >= trimmed.length) break;
  }

  return chunks.filter((chunk) => chunk.length > 0);
}
