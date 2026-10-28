/**
 * VisiOS — Secure Document Ingestion & Structure Extractor
 * Step 11: Validates file integrity, detects PDF encryption/corruption, extracts page-grounded text,
 * parses headings, tables, equations, and detects scanned documents without relying on client MIME types alone.
 */

import {
  ImportedDocument,
  DocumentPage,
  DocumentSection,
  DocumentTable,
  DocumentEquation,
  DocumentValidationResult,
  SupportedFileType,
} from './DocumentTypes';

export class DocumentIngestionService {
  public static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB limit
  public static readonly MIN_SCANNED_CHAR_THRESHOLD = 50; // Under 50 chars for multi-page indicates scanned

  /**
   * Validates file size, magic numbers, and structure before processing.
   */
  public static validateFile(
    content: Uint8Array | string,
    fileName: string = 'document.pdf'
  ): DocumentValidationResult {
    const fileSize = typeof content === 'string' ? Buffer.byteLength(content, 'utf8') : content.length;

    // 1. Size bounds
    if (fileSize === 0) {
      return {
        isValid: false,
        fileType: 'unknown',
        mimeType: 'application/octet-stream',
        fileSize: 0,
        errorCode: 'EMPTY_FILE',
        errorMessage: 'The uploaded file is empty (0 bytes). Please upload a valid document.',
      };
    }

    if (fileSize > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        fileType: 'unknown',
        mimeType: 'application/octet-stream',
        fileSize,
        errorCode: 'FILE_TOO_LARGE',
        errorMessage: `File size exceeds the 10 MB limit (provided ${Math.round(fileSize / 1024)} KB).`,
      };
    }

    const cleanName = fileName.toLowerCase().trim();

    // 2. Magic byte / content inspection for PDF
    if (this.isPdfContent(content)) {
      const textSample = this.toAsciiSample(content, 2048);

      // Check for password protection / encryption
      if (textSample.includes('/Encrypt')) {
        return {
          isValid: false,
          fileType: 'pdf',
          mimeType: 'application/pdf',
          fileSize,
          errorCode: 'ENCRYPTED_PDF',
          errorMessage: 'Encrypted or password-protected PDFs are not supported. Please provide an unencrypted document.',
        };
      }

      // Check for corrupt or severely truncated PDF
      if (fileSize < 32 || (!textSample.includes('/Root') && !textSample.includes('/Pages'))) {
        return {
          isValid: false,
          fileType: 'pdf',
          mimeType: 'application/pdf',
          fileSize,
          errorCode: 'CORRUPT_FILE',
          errorMessage: 'The PDF file is malformed or corrupted and cannot be parsed.',
        };
      }

      return {
        isValid: true,
        fileType: 'pdf',
        mimeType: 'application/pdf',
        fileSize,
      };
    }

    // 3. Plain Text / Markdown inspection
    if (cleanName.endsWith('.txt') || cleanName.endsWith('.md') || this.isTextContent(content)) {
      const isMd = cleanName.endsWith('.md') || (typeof content === 'string' && content.includes('# '));
      return {
        isValid: true,
        fileType: isMd ? 'markdown' : 'text',
        mimeType: isMd ? 'text/markdown' : 'text/plain',
        fileSize,
      };
    }

    // 4. Unsupported binary or unknown formats
    return {
      isValid: false,
      fileType: 'unknown',
      mimeType: 'application/octet-stream',
      fileSize,
      errorCode: 'UNSUPPORTED_FORMAT',
      errorMessage: 'Unsupported document format. Only PDF, Markdown (.md), and plain text (.txt) files are supported.',
    };
  }

  /**
   * Securely ingests and extracts structured document data with page references.
   */
  public static async ingestDocument(
    content: Uint8Array | string,
    rawFileName: string = 'document.pdf'
  ): Promise<ImportedDocument> {
    const sanitizedFileName = this.sanitizeFileName(rawFileName);
    const validation = this.validateFile(content, sanitizedFileName);

    if (!validation.isValid) {
      throw new Error(validation.errorMessage || `Document ingestion rejected: ${validation.errorCode}`);
    }

    const checksum = this.computeChecksum(content);
    const docId = `doc_${checksum.substring(0, 10)}_${Date.now().toString(36)}`;
    const now = Date.now();

    const warnings: string[] = [];

    // Extract pages, sections, tables, equations
    let pages: DocumentPage[] = [];
    let isScanned = false;
    let ocrStatus: 'none' | 'ocr_unavailable' | 'ocr_processed' = 'none';

    if (validation.fileType === 'pdf') {
      const pdfExtraction = this.extractPdfStructure(content);
      pages = pdfExtraction.pages;
      isScanned = pdfExtraction.isScanned;

      if (isScanned) {
        ocrStatus = 'ocr_unavailable';
        warnings.push(
          'Scanned document detected with minimal text layer. OCR capability is currently unavailable; text may be incomplete.'
        );
      }
    } else {
      pages = this.extractTextStructure(content);
    }

    // Fallback page if extraction returned empty
    if (pages.length === 0) {
      pages = [
        {
          pageNumber: 1,
          rawText: typeof content === 'string' ? content.trim() : this.toAsciiSample(content, 4000),
          headings: [],
          hasTables: false,
          hasEquations: false,
          wordCount: 0,
        },
      ];
    }

    // Derive document title from headings or filename
    const firstHeading = pages[0]?.headings[0];
    const docTitle = firstHeading || sanitizedFileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

    // Extract sections across pages
    const sections = this.buildSections(pages);

    // Extract tables across pages
    const tables = this.extractTables(pages);

    // Extract equations across pages
    const equations = this.extractEquations(pages);

    return {
      id: docId,
      fileName: sanitizedFileName,
      fileSize: validation.fileSize,
      fileType: validation.fileType,
      mimeType: validation.mimeType,
      title: docTitle,
      totalPages: pages.length,
      pages,
      sections,
      tables,
      equations,
      isScanned,
      ocrStatus,
      warnings,
      processingStatus: 'completed',
      extractedAt: now,
      checksum,
    };
  }

  /**
   * PDF text and page structure extractor.
   */
  private static extractPdfStructure(content: Uint8Array | string): {
    pages: DocumentPage[];
    isScanned: boolean;
  } {
    const rawStr = typeof content === 'string' ? content : this.toAsciiSample(content, content.length);
    const pages: DocumentPage[] = [];

    // Strategy 1: Look for physical /Page object delimiters or stream chunks
    const pageSplits = rawStr.split(/\/Type\s*\/Page\b/);

    if (pageSplits.length > 1) {
      // Multiple page markers found
      for (let i = 1; i < pageSplits.length; i++) {
        const pageChunk = pageSplits[i];
        const pageText = this.extractTextFromPdfChunk(pageChunk);
        const headings = this.detectHeadings(pageText);

        pages.push({
          pageNumber: i,
          rawText: pageText,
          headings,
          hasTables: pageText.includes('|') || /\b(table|row|column)\b/i.test(pageText),
          hasEquations: /[\$\=\+\-\^]/.test(pageText),
          wordCount: pageText.split(/\s+/).filter(Boolean).length,
        });
      }
    } else {
      // Single page or unpartitioned streams
      const fullText = this.extractTextFromPdfChunk(rawStr);
      const headings = this.detectHeadings(fullText);

      pages.push({
        pageNumber: 1,
        rawText: fullText,
        headings,
        hasTables: fullText.includes('|'),
        hasEquations: /[\$\=\+\-\^]/.test(fullText),
        wordCount: fullText.split(/\s+/).filter(Boolean).length,
      });
    }

    // Check if document is scanned (total extracted characters across all pages < threshold)
    const totalChars = pages.reduce((acc, p) => acc + p.rawText.trim().length, 0);
    const isScanned = totalChars < this.MIN_SCANNED_CHAR_THRESHOLD;

    return { pages, isScanned };
  }

  /**
   * Extracts text strings from PDF stream blocks and text operators.
   */
  private static extractTextFromPdfChunk(chunk: string): string {
    const textPieces: string[] = [];

    // 1. Literal parentheses strings in text operators: (Hello World) Tj or (Text) '
    const literalMatches = Array.from(chunk.matchAll(/\(([^()]*)\)\s*(?:Tj|'|TJ)/g));
    for (const match of literalMatches) {
      const decoded = this.unescapePdfString(match[1]);
      if (decoded.trim()) textPieces.push(decoded.trim());
    }

    // 2. Bracketed array strings: [(Part 1) -20 (Part 2)] TJ
    const arrayMatches = Array.from(chunk.matchAll(/\[(.*?)\]\s*TJ/g));
    for (const match of arrayMatches) {
      const inner = match[1];
      const parts = Array.from(inner.matchAll(/\(([^()]*)\)/g));
      const combined = parts
        .map((p: any) => this.unescapePdfString(p[1]))
        .join('');
      if (combined.trim()) textPieces.push(combined.trim());
    }

    // 3. Fallback: stream blocks containing plain readable text
    if (textPieces.length === 0) {
      const streamBlocks = Array.from(chunk.matchAll(/stream([\s\S]*?)endstream/g));
      for (const block of streamBlocks) {
        const streamData = block[1];
        const readable = streamData.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ');
        if (readable.length > 20) {
          textPieces.push(readable.trim());
        }
      }
    }

    // Neutralize prompt injection patterns in untrusted input
    const assembled = textPieces.join('\n\n');
    return this.neutralizePromptInjection(assembled);
  }

  /**
   * Text & Markdown structure extractor.
   */
  private static extractTextStructure(content: Uint8Array | string): DocumentPage[] {
    const text = typeof content === 'string' ? content : new TextDecoder('utf-8').decode(content);
    const sanitized = this.neutralizePromptInjection(text);

    // Look for explicit page breaks (--- or === Page N === or Page N of M)
    const pageBreakRegex = /(?:\n\s*---\s*\n|\n\s*===\s*Page\s*\d+\s*===\s*\n|\n\s*Page\s+\d+\s+of\s+\d+\s*\n)/i;
    const rawPages = sanitized.split(pageBreakRegex);

    if (rawPages.length > 1) {
      return rawPages.map((pageText, idx) => {
        const headings = this.detectHeadings(pageText);
        return {
          pageNumber: idx + 1,
          rawText: pageText.trim(),
          headings,
          hasTables: pageText.includes('|'),
          hasEquations: pageText.includes('$$') || pageText.includes('\\(') || pageText.includes('='),
          wordCount: pageText.split(/\s+/).filter(Boolean).length,
        };
      });
    }

    // If no explicit breaks, check if text is large (> 2500 chars) and partition into logical pages
    const PAGE_CHAR_LIMIT = 2500;
    if (sanitized.length > PAGE_CHAR_LIMIT) {
      const chunks: string[] = [];
      const paragraphs = sanitized.split(/\n\s*\n/);
      let currentChunk = '';

      for (const p of paragraphs) {
        if (currentChunk.length + p.length > PAGE_CHAR_LIMIT && currentChunk.length > 500) {
          chunks.push(currentChunk.trim());
          currentChunk = p;
        } else {
          currentChunk += (currentChunk ? '\n\n' : '') + p;
        }
      }
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
      }

      return chunks.map((chunk, idx) => ({
        pageNumber: idx + 1,
        rawText: chunk,
        headings: this.detectHeadings(chunk),
        hasTables: chunk.includes('|'),
        hasEquations: chunk.includes('$$') || chunk.includes('\\(') || chunk.includes('='),
        wordCount: chunk.split(/\s+/).filter(Boolean).length,
      }));
    }

    // Single page
    return [
      {
        pageNumber: 1,
        rawText: sanitized.trim(),
        headings: this.detectHeadings(sanitized),
        hasTables: sanitized.includes('|'),
        hasEquations: sanitized.includes('$$') || sanitized.includes('\\(') || sanitized.includes('='),
        wordCount: sanitized.split(/\s+/).filter(Boolean).length,
      },
    ];
  }

  /**
   * Builds logical sections across document pages.
   */
  private static buildSections(pages: DocumentPage[]): DocumentSection[] {
    const sections: DocumentSection[] = [];
    let sectionIdx = 1;

    for (const page of pages) {
      if (page.headings.length > 0) {
        for (const h of page.headings) {
          sections.push({
            id: `sec_${sectionIdx++}`,
            title: h,
            startPage: page.pageNumber,
            endPage: page.pageNumber,
            content: page.rawText.slice(0, 500),
          });
        }
      }
    }

    // Fallback section if no explicit headings found
    if (sections.length === 0 && pages.length > 0) {
      sections.push({
        id: 'sec_1',
        title: 'Core Document Material',
        startPage: 1,
        endPage: pages.length,
        content: pages[0].rawText.slice(0, 500),
      });
    }

    return sections;
  }

  /**
   * Extracts tables from extracted page text (Markdown tables).
   */
  private static extractTables(pages: DocumentPage[]): DocumentTable[] {
    const tables: DocumentTable[] = [];
    let tableId = 1;

    for (const page of pages) {
      const lines = page.rawText.split('\n');
      let currentTableLines: string[] = [];

      for (const line of lines) {
        if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
          currentTableLines.push(line.trim());
        } else {
          if (currentTableLines.length >= 2) {
            const parsed = this.parseMarkdownTable(currentTableLines, page.pageNumber, tableId++);
            if (parsed) tables.push(parsed);
          }
          currentTableLines = [];
        }
      }

      if (currentTableLines.length >= 2) {
        const parsed = this.parseMarkdownTable(currentTableLines, page.pageNumber, tableId++);
        if (parsed) tables.push(parsed);
      }
    }

    return tables;
  }

  private static parseMarkdownTable(lines: string[], pageNumber: number, id: number): DocumentTable | null {
    if (lines.length < 2) return null;
    const headerLine = lines[0];
    const headers = headerLine.split('|').map((c) => c.trim()).filter(Boolean);
    const rows: string[][] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Skip delimiter line |---|---|
      if (/^\|[-:\s|]+\|$/.test(line)) continue;
      const row = line.split('|').map((c) => c.trim()).filter(Boolean);
      if (row.length > 0) rows.push(row);
    }

    return {
      id: `table_${id}`,
      pageNumber,
      headers,
      rows,
    };
  }

  /**
   * Extracts mathematical equations from extracted page text.
   */
  private static extractEquations(pages: DocumentPage[]): DocumentEquation[] {
    const equations: DocumentEquation[] = [];
    let eqId = 1;

    for (const page of pages) {
      // 1. Math in $$...$$ or \[...\]
      const displayMath = Array.from(page.rawText.matchAll(/\$\$([\s\S]*?)\$\$|\\\[([\s\S]*?)\\\]/g));
      for (const match of displayMath) {
        const rawExpression = (match[1] || match[2] || '').trim();
        if (rawExpression) {
          equations.push({
            id: `eq_${eqId++}`,
            pageNumber: page.pageNumber,
            rawExpression,
            contextText: 'Display equation extracted from document.',
          });
        }
      }

      // 2. Common STEM equations (e.g. F = ma, v = u + at, E = mc^2)
      const stemFormulas = Array.from(page.rawText.matchAll(/\b([A-Za-z_]{1,4}\s*=\s*[^,\n;]{3,30})\b/g));
      for (const match of stemFormulas) {
        const expr = match[1].trim();
        if (expr.includes('+') || expr.includes('*') || expr.includes('/') || expr.includes('·') || expr.length > 5) {
          if (!equations.some((e) => e.rawExpression === expr)) {
            equations.push({
              id: `eq_${eqId++}`,
              pageNumber: page.pageNumber,
              rawExpression: expr,
              contextText: match[0],
            });
          }
        }
      }
    }

    return equations;
  }

  /**
   * Detects headings in text.
   */
  private static detectHeadings(text: string): string[] {
    const headings: string[] = [];
    const lines = text.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      // Markdown headings: # Heading, ## Section
      if (/^#{1,3}\s+(.+)$/.test(trimmed)) {
        const h = trimmed.replace(/^#{1,3}\s+/, '').trim();
        if (h && !headings.includes(h)) headings.push(h);
      }
      // Section prefixes: Section 1: Intro, Chapter 2: ...
      else if (/^(?:Section|Chapter|Part)\s+\d+[:\s]+(.+)$/i.test(trimmed)) {
        if (!headings.includes(trimmed)) headings.push(trimmed);
      }
    }

    return headings;
  }

  /**
   * Neutralizes prompt injection patterns in untrusted student document data.
   */
  public static neutralizePromptInjection(text: string): string {
    if (!text) return '';
    // Strip common adversarial instructions while preserving student reading content
    return text
      .replace(/ignore\s+(?:all\s+)?previous\s+instructions/gi, '[neutralized instruction attempt]')
      .replace(/system\s*:\s*override/gi, '[neutralized system directive]')
      .replace(/you\s+are\s+now\s+in\s+developer\s+mode/gi, '[neutralized prompt injection]');
  }

  /**
   * Checks if byte array or string begins with PDF magic bytes (%PDF-).
   */
  private static isPdfContent(content: Uint8Array | string): boolean {
    if (typeof content === 'string') {
      return content.startsWith('%PDF-') || content.includes('%PDF-');
    }
    if (content.length < 5) return false;
    // %PDF- = 0x25, 0x50, 0x44, 0x46, 0x2D
    return (
      content[0] === 0x25 &&
      content[1] === 0x50 &&
      content[2] === 0x44 &&
      content[3] === 0x46 &&
      content[4] === 0x2d
    );
  }

  /**
   * Checks if content is plain ASCII or UTF-8 text without excessive null/binary bytes.
   */
  private static isTextContent(content: Uint8Array | string): boolean {
    if (typeof content === 'string') return true;
    let nullCount = 0;
    const len = Math.min(content.length, 512);
    for (let i = 0; i < len; i++) {
      if (content[i] === 0) nullCount++;
    }
    return nullCount === 0;
  }

  private static unescapePdfString(s: string): string {
    return s
      .replace(/\\n/g, '\n')
      .replace(/\\r/g, '\r')
      .replace(/\\t/g, '\t')
      .replace(/\\\(/g, '(')
      .replace(/\\\)/g, ')')
      .replace(/\\\\/g, '\\');
  }

  private static toAsciiSample(content: Uint8Array | string, maxBytes: number): string {
    if (typeof content === 'string') return content.slice(0, maxBytes);
    const slice = content.subarray(0, Math.min(content.length, maxBytes));
    return new TextDecoder('latin1').decode(slice);
  }

  private static sanitizeFileName(name: string): string {
    return (name || 'uploaded_document')
      .replace(/[/\\]/g, '_')
      .replace(/\.\.+/g, '.')
      .replace(/[^\w.\-\s]/g, '')
      .trim()
      .slice(0, 100);
  }

  private static computeChecksum(content: Uint8Array | string): string {
    let hash = 0;
    const str = typeof content === 'string' ? content : this.toAsciiSample(content, 1024);
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(16);
  }
}
