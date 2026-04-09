// ============================================================================
// STRATIQ — PPTX Generator (pptxgenjs)
// ============================================================================

import PptxGenJS from 'pptxgenjs';
import type { Slide, DataPoint } from '@/lib/types';

// ---------------------------------------------------------------------------
// Template Definitions
// ---------------------------------------------------------------------------

interface TemplateColors {
  background: string;
  text: string;
  accent: string;
  secondaryText: string;
  cardBg: string;
  footerBg: string;
}

interface TemplateConfig {
  id: string;
  name: string;
  colors: TemplateColors;
  headingFont: string;
  bodyFont: string;
}

const TEMPLATES: Record<string, TemplateConfig> = {
  'modern-dark': {
    id: 'modern-dark',
    name: 'Modern Dark',
    colors: {
      background: '1a1a2e',
      text: 'FFFFFF',
      accent: '4361ee',
      secondaryText: 'a0a0b8',
      cardBg: '25253e',
      footerBg: '12121f',
    },
    headingFont: 'Calibri',
    bodyFont: 'Arial',
  },
  'clean-light': {
    id: 'clean-light',
    name: 'Clean Light',
    colors: {
      background: 'FFFFFF',
      text: '1e293b',
      accent: '0d9488',
      secondaryText: '64748b',
      cardBg: 'f1f5f9',
      footerBg: 'e2e8f0',
    },
    headingFont: 'Calibri',
    bodyFont: 'Arial',
  },
  'bold-color': {
    id: 'bold-color',
    name: 'Bold Color',
    colors: {
      background: '7c3aed',
      text: 'FFFFFF',
      accent: 'fbbf24',
      secondaryText: 'ddd6fe',
      cardBg: '6d28d9',
      footerBg: '5b21b6',
    },
    headingFont: 'Calibri',
    bodyFont: 'Arial',
  },
};

function getTemplate(templateId: string): TemplateConfig {
  return TEMPLATES[templateId] ?? TEMPLATES['modern-dark'];
}

// ---------------------------------------------------------------------------
// Layout Constants (inches)
// ---------------------------------------------------------------------------

const SLIDE_W = 10; // pptxgenjs default width
const SLIDE_H = 5.625; // 16:9 at 10in wide
const MARGIN_X = 0.6;
const MARGIN_Y = 0.5;
const CONTENT_W = SLIDE_W - MARGIN_X * 2;
const FOOTER_H = 0.35;
const FOOTER_Y = SLIDE_H - FOOTER_H;
const USABLE_H = FOOTER_Y - MARGIN_Y - 0.15; // leave small gap above footer

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function addFooter(
  slide: PptxGenJS.Slide,
  tmpl: TemplateConfig,
  slideNumber: number,
  totalSlides: number,
): void {
  // Footer background bar
  slide.addShape('rect', {
    x: 0,
    y: FOOTER_Y,
    w: SLIDE_W,
    h: FOOTER_H,
    fill: { color: tmpl.colors.footerBg },
  });

  // Branding text
  slide.addText('STRATIQ | Confidential', {
    x: MARGIN_X,
    y: FOOTER_Y,
    w: CONTENT_W * 0.7,
    h: FOOTER_H,
    fontSize: 8,
    fontFace: tmpl.bodyFont,
    color: tmpl.colors.secondaryText,
    valign: 'middle',
  });

  // Slide number
  slide.addText(`${slideNumber} / ${totalSlides}`, {
    x: SLIDE_W - MARGIN_X - 1.2,
    y: FOOTER_Y,
    w: 1.2,
    h: FOOTER_H,
    fontSize: 8,
    fontFace: tmpl.bodyFont,
    color: tmpl.colors.secondaryText,
    valign: 'middle',
    align: 'right',
  });
}

function addSlideBackground(
  slide: PptxGenJS.Slide,
  tmpl: TemplateConfig,
): void {
  slide.background = { fill: tmpl.colors.background };
}

// Confidence to descriptive label
function confidenceLabel(confidence: number): string {
  if (confidence >= 90) return 'Very High';
  if (confidence >= 70) return 'High';
  if (confidence >= 50) return 'Moderate';
  return 'Low';
}

// Extract confidence from content if embedded, or default
function extractConfidence(slide: Slide): number {
  // Try to pull from sourceAttribution or content
  const match = slide.sourceAttribution?.match(/confidence:\s*(\d+)/i) ??
    slide.content.match(/confidence:\s*(\d+)/i);
  return match ? parseInt(match[1], 10) : 75;
}

// Extract track from sourceAttribution
function extractTrack(slide: Slide): string {
  const match = slide.sourceAttribution?.match(
    /\[(creative|events|art|digital|strategy|all)\]/i,
  );
  return match ? match[1].toUpperCase() : '';
}

// Strip markdown bold/italic for plain text rendering
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/^[-*]\s+/gm, '  \u2022 ')
    .replace(/^#+\s+/gm, '');
}

// ---------------------------------------------------------------------------
// Slide Layout Renderers
// ---------------------------------------------------------------------------

function renderTitleSlide(
  pptx: PptxGenJS,
  slideData: Slide,
  tmpl: TemplateConfig,
  slideNum: number,
  totalSlides: number,
): void {
  const slide = pptx.addSlide();
  addSlideBackground(slide, tmpl);

  // Accent line at top
  slide.addShape('rect', {
    x: MARGIN_X,
    y: 1.4,
    w: 1.5,
    h: 0.06,
    fill: { color: tmpl.colors.accent },
  });

  // Title
  slide.addText(slideData.title, {
    x: MARGIN_X,
    y: 1.6,
    w: CONTENT_W,
    h: 1.4,
    fontSize: 36,
    fontFace: tmpl.headingFont,
    color: tmpl.colors.text,
    bold: true,
    valign: 'top',
    wrap: true,
  });

  // Subtitle / content
  if (slideData.content) {
    slide.addText(stripMarkdown(slideData.content), {
      x: MARGIN_X,
      y: 3.1,
      w: CONTENT_W * 0.75,
      h: 1.0,
      fontSize: 16,
      fontFace: tmpl.bodyFont,
      color: tmpl.colors.secondaryText,
      valign: 'top',
      wrap: true,
    });
  }

  // STRATIQ branding
  slide.addText('STRATIQ', {
    x: MARGIN_X,
    y: 4.3,
    w: 3,
    h: 0.4,
    fontSize: 12,
    fontFace: tmpl.headingFont,
    color: tmpl.colors.accent,
    bold: true,
  });

  addFooter(slide, tmpl, slideNum, totalSlides);
}

function renderInsightSlide(
  pptx: PptxGenJS,
  slideData: Slide,
  tmpl: TemplateConfig,
  slideNum: number,
  totalSlides: number,
): void {
  const slide = pptx.addSlide();
  addSlideBackground(slide, tmpl);

  // Title bar with accent background
  slide.addShape('rect', {
    x: 0,
    y: 0,
    w: SLIDE_W,
    h: 1.1,
    fill: { color: tmpl.colors.accent },
  });

  slide.addText(slideData.title, {
    x: MARGIN_X,
    y: 0.15,
    w: CONTENT_W,
    h: 0.8,
    fontSize: 22,
    fontFace: tmpl.headingFont,
    color: 'FFFFFF',
    bold: true,
    valign: 'middle',
    wrap: true,
  });

  // Summary / content body
  const bodyText = stripMarkdown(slideData.content);
  slide.addText(bodyText, {
    x: MARGIN_X,
    y: 1.35,
    w: CONTENT_W * 0.72,
    h: USABLE_H - 1.35 + MARGIN_Y - 0.3,
    fontSize: 13,
    fontFace: tmpl.bodyFont,
    color: tmpl.colors.text,
    valign: 'top',
    wrap: true,
    lineSpacingMultiple: 1.3,
  });

  // Track badge (right side)
  const track = extractTrack(slideData);
  if (track) {
    slide.addShape('roundRect', {
      x: CONTENT_W - 0.9,
      y: 1.4,
      w: 1.5,
      h: 0.35,
      fill: { color: tmpl.colors.cardBg },
      rectRadius: 0.05,
    });
    slide.addText(track, {
      x: CONTENT_W - 0.9,
      y: 1.4,
      w: 1.5,
      h: 0.35,
      fontSize: 9,
      fontFace: tmpl.bodyFont,
      color: tmpl.colors.accent,
      bold: true,
      align: 'center',
      valign: 'middle',
    });
  }

  // Confidence indicator (right side)
  const confidence = extractConfidence(slideData);
  const confLabel = confidenceLabel(confidence);
  slide.addShape('roundRect', {
    x: CONTENT_W - 0.9,
    y: 1.9,
    w: 1.5,
    h: 0.55,
    fill: { color: tmpl.colors.cardBg },
    rectRadius: 0.05,
  });
  slide.addText(`Confidence\n${confLabel} (${confidence}%)`, {
    x: CONTENT_W - 0.9,
    y: 1.9,
    w: 1.5,
    h: 0.55,
    fontSize: 9,
    fontFace: tmpl.bodyFont,
    color: tmpl.colors.secondaryText,
    align: 'center',
    valign: 'middle',
    lineSpacingMultiple: 1.2,
  });

  // Source attribution
  if (slideData.sourceAttribution) {
    slide.addText(`Source: ${slideData.sourceAttribution}`, {
      x: MARGIN_X,
      y: FOOTER_Y - 0.35,
      w: CONTENT_W,
      h: 0.3,
      fontSize: 8,
      fontFace: tmpl.bodyFont,
      color: tmpl.colors.secondaryText,
      italic: true,
    });
  }

  addFooter(slide, tmpl, slideNum, totalSlides);
}

function renderDataSlide(
  pptx: PptxGenJS,
  slideData: Slide,
  tmpl: TemplateConfig,
  slideNum: number,
  totalSlides: number,
): void {
  const slide = pptx.addSlide();
  addSlideBackground(slide, tmpl);

  // Title
  slide.addText(slideData.title, {
    x: MARGIN_X,
    y: MARGIN_Y,
    w: CONTENT_W,
    h: 0.6,
    fontSize: 22,
    fontFace: tmpl.headingFont,
    color: tmpl.colors.text,
    bold: true,
  });

  // Accent underline
  slide.addShape('rect', {
    x: MARGIN_X,
    y: MARGIN_Y + 0.65,
    w: 2.0,
    h: 0.04,
    fill: { color: tmpl.colors.accent },
  });

  // Data points table
  const dataPoints: DataPoint[] = slideData.dataPoints ?? [];
  if (dataPoints.length > 0) {
    const tableRows: PptxGenJS.TableRow[] = [
      // Header row
      [
        {
          text: 'Metric',
          options: {
            bold: true,
            fontSize: 11,
            fontFace: tmpl.headingFont,
            color: 'FFFFFF',
            fill: { color: tmpl.colors.accent },
            valign: 'middle',
            border: { type: 'none' },
          },
        },
        {
          text: 'Value',
          options: {
            bold: true,
            fontSize: 11,
            fontFace: tmpl.headingFont,
            color: 'FFFFFF',
            fill: { color: tmpl.colors.accent },
            valign: 'middle',
            border: { type: 'none' },
          },
        },
        {
          text: 'Source',
          options: {
            bold: true,
            fontSize: 11,
            fontFace: tmpl.headingFont,
            color: 'FFFFFF',
            fill: { color: tmpl.colors.accent },
            valign: 'middle',
            border: { type: 'none' },
          },
        },
      ],
    ];

    for (const dp of dataPoints) {
      const valueStr =
        dp.unit !== undefined && dp.unit !== null
          ? `${dp.value} ${dp.unit}`
          : String(dp.value);

      const isEvenRow = tableRows.length % 2 === 0;
      const rowFill = isEvenRow ? tmpl.colors.cardBg : tmpl.colors.background;

      tableRows.push([
        {
          text: dp.label,
          options: {
            fontSize: 10,
            fontFace: tmpl.bodyFont,
            color: tmpl.colors.text,
            fill: { color: rowFill },
            valign: 'middle',
            border: { type: 'none' },
          },
        },
        {
          text: valueStr,
          options: {
            fontSize: 10,
            fontFace: tmpl.bodyFont,
            color: tmpl.colors.accent,
            bold: true,
            fill: { color: rowFill },
            valign: 'middle',
            border: { type: 'none' },
          },
        },
        {
          text: slideData.sourceAttribution ?? 'STRATIQ Analysis',
          options: {
            fontSize: 9,
            fontFace: tmpl.bodyFont,
            color: tmpl.colors.secondaryText,
            fill: { color: rowFill },
            valign: 'middle',
            border: { type: 'none' },
          },
        },
      ]);
    }

    slide.addTable(tableRows, {
      x: MARGIN_X,
      y: 1.35,
      w: CONTENT_W,
      rowH: 0.4,
      colW: [CONTENT_W * 0.4, CONTENT_W * 0.3, CONTENT_W * 0.3],
    });
  }

  // Narrative text below table
  if (slideData.content) {
    const tableEndY = 1.35 + (dataPoints.length + 1) * 0.4 + 0.15;
    const remainingH = FOOTER_Y - tableEndY - 0.15;

    if (remainingH > 0.3) {
      slide.addText(stripMarkdown(slideData.content), {
        x: MARGIN_X,
        y: tableEndY,
        w: CONTENT_W,
        h: Math.min(remainingH, 1.2),
        fontSize: 11,
        fontFace: tmpl.bodyFont,
        color: tmpl.colors.secondaryText,
        valign: 'top',
        wrap: true,
        lineSpacingMultiple: 1.2,
      });
    }
  }

  addFooter(slide, tmpl, slideNum, totalSlides);
}

function renderCaseStudySlide(
  pptx: PptxGenJS,
  slideData: Slide,
  tmpl: TemplateConfig,
  slideNum: number,
  totalSlides: number,
): void {
  const slide = pptx.addSlide();
  addSlideBackground(slide, tmpl);

  // Title
  slide.addText(slideData.title, {
    x: MARGIN_X,
    y: MARGIN_Y,
    w: CONTENT_W,
    h: 0.6,
    fontSize: 22,
    fontFace: tmpl.headingFont,
    color: tmpl.colors.text,
    bold: true,
  });

  // Image placeholder area (left side)
  const placeholderW = CONTENT_W * 0.45;
  const placeholderH = 2.4;
  const placeholderY = 1.3;

  slide.addShape('roundRect', {
    x: MARGIN_X,
    y: placeholderY,
    w: placeholderW,
    h: placeholderH,
    fill: { color: tmpl.colors.cardBg },
    rectRadius: 0.1,
  });

  // Placeholder label
  slide.addText(
    slideData.imageCaption ?? 'Visual reference',
    {
      x: MARGIN_X + 0.2,
      y: placeholderY + placeholderH / 2 - 0.25,
      w: placeholderW - 0.4,
      h: 0.5,
      fontSize: 10,
      fontFace: tmpl.bodyFont,
      color: tmpl.colors.secondaryText,
      align: 'center',
      valign: 'middle',
      italic: true,
      wrap: true,
    },
  );

  // Caption below placeholder
  if (slideData.imageCaption) {
    slide.addText(slideData.imageCaption, {
      x: MARGIN_X,
      y: placeholderY + placeholderH + 0.1,
      w: placeholderW,
      h: 0.3,
      fontSize: 8,
      fontFace: tmpl.bodyFont,
      color: tmpl.colors.secondaryText,
      italic: true,
      align: 'center',
    });
  }

  // Body text (right side)
  const bodyX = MARGIN_X + placeholderW + 0.3;
  const bodyW = CONTENT_W - placeholderW - 0.3;

  slide.addText(stripMarkdown(slideData.content), {
    x: bodyX,
    y: 1.3,
    w: bodyW,
    h: USABLE_H - 1.3 + MARGIN_Y - 0.1,
    fontSize: 12,
    fontFace: tmpl.bodyFont,
    color: tmpl.colors.text,
    valign: 'top',
    wrap: true,
    lineSpacingMultiple: 1.3,
  });

  // Source attribution
  if (slideData.sourceAttribution) {
    slide.addText(`Source: ${slideData.sourceAttribution}`, {
      x: bodyX,
      y: FOOTER_Y - 0.35,
      w: bodyW,
      h: 0.3,
      fontSize: 8,
      fontFace: tmpl.bodyFont,
      color: tmpl.colors.secondaryText,
      italic: true,
    });
  }

  addFooter(slide, tmpl, slideNum, totalSlides);
}

function renderClosingSlide(
  pptx: PptxGenJS,
  slideData: Slide,
  tmpl: TemplateConfig,
  slideNum: number,
  totalSlides: number,
): void {
  const slide = pptx.addSlide();
  addSlideBackground(slide, tmpl);

  // Large accent shape
  slide.addShape('rect', {
    x: 0,
    y: 0,
    w: SLIDE_W,
    h: 2.2,
    fill: { color: tmpl.colors.accent },
  });

  // Thank you / title
  slide.addText(slideData.title || 'Thank You', {
    x: MARGIN_X,
    y: 0.4,
    w: CONTENT_W,
    h: 0.8,
    fontSize: 32,
    fontFace: tmpl.headingFont,
    color: 'FFFFFF',
    bold: true,
    valign: 'middle',
  });

  // Subtitle
  slide.addText('Strategic insights powered by STRATIQ', {
    x: MARGIN_X,
    y: 1.3,
    w: CONTENT_W,
    h: 0.5,
    fontSize: 14,
    fontFace: tmpl.bodyFont,
    color: 'FFFFFF',
    valign: 'middle',
  });

  // Content / next steps
  if (slideData.content) {
    slide.addText(stripMarkdown(slideData.content), {
      x: MARGIN_X,
      y: 2.5,
      w: CONTENT_W * 0.75,
      h: 1.8,
      fontSize: 13,
      fontFace: tmpl.bodyFont,
      color: tmpl.colors.text,
      valign: 'top',
      wrap: true,
      lineSpacingMultiple: 1.3,
    });
  }

  // Branding
  slide.addText('STRATIQ', {
    x: SLIDE_W - MARGIN_X - 2,
    y: FOOTER_Y - 0.55,
    w: 2,
    h: 0.4,
    fontSize: 14,
    fontFace: tmpl.headingFont,
    color: tmpl.colors.accent,
    bold: true,
    align: 'right',
  });

  addFooter(slide, tmpl, slideNum, totalSlides);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a PPTX presentation buffer from slide data.
 *
 * @param slides - Array of Slide objects defining content
 * @param templateId - Template style identifier
 * @param title - Deck title (used for PPTX metadata)
 * @returns Buffer containing the .pptx file
 */
export async function generatePPTX(
  slides: Slide[],
  templateId: string,
  title: string,
): Promise<Buffer> {
  const tmpl = getTemplate(templateId);
  const pptx = new PptxGenJS();

  // Presentation metadata
  pptx.author = 'STRATIQ';
  pptx.company = 'STRATIQ';
  pptx.title = title;
  pptx.subject = 'Strategic Presentation';
  pptx.layout = 'LAYOUT_WIDE'; // 13.33 x 7.5 -> actually 10 x 5.625 in 16:9

  const totalSlides = slides.length;

  for (const slideData of slides) {
    const slideNum = slideData.index + 1;

    switch (slideData.type) {
      case 'title':
        renderTitleSlide(pptx, slideData, tmpl, slideNum, totalSlides);
        break;
      case 'insight':
        renderInsightSlide(pptx, slideData, tmpl, slideNum, totalSlides);
        break;
      case 'data':
        renderDataSlide(pptx, slideData, tmpl, slideNum, totalSlides);
        break;
      case 'case-study':
        renderCaseStudySlide(pptx, slideData, tmpl, slideNum, totalSlides);
        break;
      case 'closing':
        renderClosingSlide(pptx, slideData, tmpl, slideNum, totalSlides);
        break;
      default:
        // Fallback: render as insight
        renderInsightSlide(pptx, slideData, tmpl, slideNum, totalSlides);
        break;
    }
  }

  // Generate as Node.js Buffer
  const output = await pptx.write({ outputType: 'nodebuffer' });
  return output as Buffer;
}

/**
 * Get the list of available template IDs.
 */
export function getAvailableTemplates(): Array<{
  id: string;
  name: string;
}> {
  return Object.values(TEMPLATES).map((t) => ({ id: t.id, name: t.name }));
}
