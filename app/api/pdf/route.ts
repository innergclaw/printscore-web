import { NextRequest, NextResponse } from 'next/server';
import PDFDocument from 'pdfkit';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const resultJson = formData.get('result') as string;

    if (!resultJson) {
      return NextResponse.json({ error: 'No result data provided' }, { status: 400 });
    }

    const result = JSON.parse(resultJson);

    // Create PDF document
    const doc = new PDFDocument({
      size: 'LETTER',
      margin: 50,
    });

    // Buffer to store PDF
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));

    // Colors (OwnYourWeb dark theme)
    const bg = '#0F1115';
    const surface = '#1A1E24';
    const text = '#E8E8E8';
    const textMuted = '#9CA3AF';
    const accentTeal = '#00D1C7';
    const accentCyan = '#2DE2E6';
    const accentLime = '#C7F464';
    const accentAmber = '#F5A623';
    const accentPink = '#FF008C';

    // Background
    doc.fillColor(bg);
    doc.rect(0, 0, doc.page.width, doc.page.height);
    doc.fill();

    // Header band
    doc.fillColor(surface);
    doc.rect(0, 0, doc.page.width, 120);
    doc.fill();

    // Logo
    doc.fillColor(accentTeal);
    doc.fontSize(28);
    doc.font('Helvetica-Bold');
    doc.text('PrintScore™', 50, 40);

    // Score label
    doc.fillColor(textMuted);
    doc.fontSize(12);
    doc.text('Print Compatibility Score', 50, 75);

    // Large Score
    const tierColor = result.tier_color || accentTeal;
    doc.fillColor(tierColor);
    doc.fontSize(72);
    doc.font('Helvetica-Bold');
    doc.text(`${result.total_score}`, 50, 150);

    doc.fillColor(textMuted);
    doc.fontSize(24);
    doc.text('/ 100', 140, 175);

    // Tier badge
    doc.fillColor(tierColor);
    doc.roundedRect(50, 240, 180, 45, 22);
    doc.fill();

    doc.fillColor(bg);
    doc.fontSize(18);
    doc.font('Helvetica-Bold');
    doc.text(result.tier, 50, 255, { width: 180, align: 'center' });

    // Summary section
    let yPos = 310;

    doc.fillColor(accentTeal);
    doc.fontSize(14);
    doc.font('Helvetica-Bold');
    doc.text('Summary', 50, yPos);

    doc.fillColor(text);
    doc.fontSize(12);
    doc.font('Helvetica');
    doc.text(result.summary, 50, yPos + 22, { width: doc.page.width - 100 });

    yPos = 400;

    // Issue sections with colored borders
    const sections = [
      { title: 'Resolution', content: result.issues.resolution, color: accentTeal, icon: '📏' },
      { title: 'Color Mode', content: result.issues.color, color: accentPink, icon: '🎨' },
      { title: 'Layout', content: result.issues.layout, color: accentAmber, icon: '✂️' },
      { title: 'Format', content: result.issues.format, color: '#6B7280', icon: '📦' },
    ];

    sections.forEach((section, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = 50 + (col * 255);
      const y = yPos + (row * 85);

      // Card background
      doc.fillColor(surface);
      doc.roundedRect(x, y, 240, 75, 8);
      doc.fill();

      // Left border accent
      doc.fillColor(section.color);
      doc.rect(x, y, 4, 75);
      doc.fill();

      // Title
      doc.fillColor(text);
      doc.fontSize(12);
      doc.font('Helvetica-Bold');
      doc.text(`${section.icon} ${section.title}`, x + 14, y + 12);

      // Content
      doc.fillColor(textMuted);
      doc.fontSize(10);
      doc.font('Helvetica');
      doc.text(section.content, x + 14, y + 32, { width: 215, height: 35 });
    });

    // Print size safe range
    yPos = 580;
    doc.fillColor(surface);
    doc.roundedRect(50, yPos, doc.page.width - 100, 40, 8);
    doc.fill();

    doc.fillColor(accentLime);
    doc.fontSize(11);
    doc.font('Helvetica-Bold');
    doc.text('Print Size Safe Range:', 65, yPos + 12);

    doc.fillColor(text);
    doc.font('Helvetica');
    doc.text(`${result.max_print_width_in?.toFixed(1) || '?'} × ${result.max_print_height_in?.toFixed(1) || '?'} inches at 300 DPI`, 200, yPos + 12);

    // Footer
    const footerY = doc.page.height - 100;
    doc.fillColor(accentTeal);
    doc.rect(0, footerY, doc.page.width, 100);
    doc.fill();

    doc.fillColor(bg);
    doc.fontSize(14);
    doc.font('Helvetica-Bold');
    doc.text('Scanned with PrintScore™', 50, footerY + 30);

    doc.fontSize(11);
    doc.font('Helvetica');
    doc.text('Files are analyzed and automatically deleted.', 50, footerY + 52);

    // Finalize PDF
    doc.end();

    // Wait for PDF to be generated
    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
    });

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="printscore-report.pdf"',
      },
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
