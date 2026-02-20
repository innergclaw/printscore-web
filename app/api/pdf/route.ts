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

    // Colors
    const aqua = '#14D8D4';
    const pink = '#FF008C';
    const yellow = '#FFE600';
    const charcoal = '#1F1F1F';

    // Header band
    doc.fillColor(aqua);
    doc.rect(0, 0, doc.page.width, 120);
    doc.fill();

    // Logo placeholder
    doc.fillColor(charcoal);
    doc.fontSize(28);
    doc.font('Helvetica-Bold');
    doc.text('PrintScore™', 50, 40);

    // Score
    doc.fontSize(48);
    doc.text(`Score: ${result.total_score}`, 50, 150);

    // Tier badge
    const tierColor = result.tier_color || aqua;
    doc.fillColor(tierColor);
    doc.roundedRect(50, 210, 200, 50, 25);
    doc.fill();

    doc.fillColor(charcoal);
    doc.fontSize(20);
    doc.font('Helvetica-Bold');
    doc.text(result.tier.replace(/[🟢🟡🟠🔴]/g, '').trim(), 50, 225, { width: 200, align: 'center' });

    // Summary
    doc.fontSize(14);
    doc.font('Helvetica-Bold');
    doc.text('Summary', 50, 290);

    doc.fontSize(12);
    doc.font('Helvetica');
    doc.text(result.summary, 50, 310, { width: doc.page.width - 100 });

    // Current Y position
    let yPos = 380;

    // Issue sections
    const sections = [
      { title: 'Resolution', content: result.issues.resolution, color: aqua },
      { title: 'Color Mode', content: result.issues.color, color: pink },
      { title: 'Layout', content: result.issues.layout, color: yellow },
      { title: 'Format', content: result.issues.format, color: '#888888' },
    ];

    sections.forEach((section) => {
      // Section background
      doc.fillColor(section.color);
      doc.roundedRect(50, yPos, doc.page.width - 100, 60, 10);
      doc.fill();

      // Section title
      doc.fillColor(charcoal);
      doc.fontSize(14);
      doc.font('Helvetica-Bold');
      doc.text(section.title, 65, yPos + 15);

      // Section content
      doc.fontSize(11);
      doc.font('Helvetica');
      doc.text(section.content, 65, yPos + 35, { width: doc.page.width - 130 });

      yPos += 75;
    });

    // Print size safe range
    yPos += 10;
    doc.fillColor('#666666');
    doc.fontSize(10);
    doc.text(`Print size safe range: ${result.max_print_width_in?.toFixed(1) || '?'} × ${result.max_print_height_in?.toFixed(1) || '?'} inches at 300 DPI.`, 50, yPos);

    // Footer
    const footerY = doc.page.height - 100;
    doc.fillColor(pink);
    doc.rect(0, footerY, doc.page.width, 100);
    doc.fill();

    doc.fillColor('white');
    doc.fontSize(11);
    doc.font('Helvetica-Bold');
    doc.text('Scanned with PrintScore™', 50, footerY + 30);
    doc.font('Helvetica');
    doc.text('Files are analyzed and automatically deleted.', 50, footerY + 50);

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
