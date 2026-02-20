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
    const bg = '#F7F7F7';
    const textMuted = '#666666';

    // Background
    doc.fillColor(bg);
    doc.rect(0, 0, doc.page.width, doc.page.height);
    doc.fill();

    // Header
    doc.fillColor('#FFFFFF');
    doc.rect(0, 0, doc.page.width, 50);
    doc.fill();

    // Logo
    doc.fillColor(aqua);
    doc.fontSize(24);
    doc.font('Helvetica-Bold');
    doc.text('PrintScore™', 20, 18);

    // Score
    const tierColor = result.tier_color || aqua;
    doc.fillColor(tierColor);
    doc.fontSize(56);
    doc.text(`${result.total_score}`, 20, 75);

    doc.fillColor(textMuted);
    doc.fontSize(22);
    doc.text('/ 100', 75, 95);

    // Tier badge
    doc.fillColor(tierColor);
    doc.roundedRect(20, 130, 100, 28, 6);
    doc.fill();

    const textColor = (tierColor === '#1F1F1F' || tierColor === '#FFE600') ? '#FFFFFF' : '#1F1F1F';
    doc.fillColor(textColor);
    doc.fontSize(14);
    doc.text(result.tier, 70, 140, { align: 'center', width: 100 });

    // Summary
    doc.fillColor(aqua);
    doc.fontSize(12);
    doc.font('Helvetica-Bold');
    doc.text('Summary', 20, 175);

    doc.fillColor(charcoal);
    doc.fontSize(11);
    doc.font('Helvetica');
    doc.text(result.summary, 20, 192, { width: 480 });

    // AI Insights
    let yPos = 240;
    
    if (result.sharpness || result.compressionArtifacts || result.colorProfile) {
      doc.fillColor(aqua);
      doc.fontSize(12);
      doc.font('Helvetica-Bold');
      doc.text('AI Quality Analysis', 20, yPos);

      yPos += 18;
      doc.fillColor('#FFFFFF');
      doc.roundedRect(20, yPos, 480, 40, 6);
      doc.fill();

      doc.fillColor(charcoal);
      doc.fontSize(9);
      doc.font('Helvetica');
      
      if (result.sharpness) {
        doc.text(`Sharpness: ${result.sharpness}`, 30, yPos + 10);
      }
      if (result.compressionArtifacts) {
        doc.text(`Artifacts: ${result.compressionArtifacts}`, 30, yPos + 22);
      }
      if (result.colorProfile) {
        doc.text(`Color: ${result.colorProfile}`, 250, yPos + 10);
      }

      yPos += 50;
    }

    // Issue sections
    const issues = [
      { title: 'Resolution', content: result.issues.resolution },
      { title: 'Color Mode', content: result.issues.color },
      { title: 'Layout', content: result.issues.layout },
      { title: 'Format', content: result.issues.format }
    ];

    issues.forEach((issue) => {
      doc.fillColor('#FFFFFF');
      doc.roundedRect(20, yPos, 480, 32, 6);
      doc.fill();

      doc.fillColor(charcoal);
      doc.fontSize(10);
      doc.font('Helvetica-Bold');
      doc.text(issue.title, 30, yPos + 8);

      doc.fillColor(textMuted);
      doc.font('Helvetica');
      doc.fontSize(9);
      doc.text(issue.content, 30, yPos + 20, { width: 450 });

      yPos += 40;
    });

    // Print size
    yPos += 10;
    doc.fillColor('#FFFFFF');
    doc.roundedRect(20, yPos, 480, 24, 6);
    doc.fill();

    doc.fillColor(aqua);
    doc.fontSize(10);
    doc.font('Helvetica-Bold');
    doc.text(`Print Size Safe Range: ${result.max_print_width_in?.toFixed(1) || '?'} × ${result.max_print_height_in?.toFixed(1) || '?'} inches at 300 DPI`, 260, yPos + 8, { align: 'center' });

    // Recommendations
    if (result.recommendations && result.recommendations.length > 0) {
      yPos += 40;
      doc.fillColor(aqua);
      doc.fontSize(12);
      doc.font('Helvetica-Bold');
      doc.text('Recommendations', 20, yPos);

      yPos += 15;
      result.recommendations.forEach((rec: string) => {
        doc.fillColor(charcoal);
        doc.fontSize(9);
        doc.font('Helvetica');
        doc.text(`→ ${rec}`, 25, yPos, { width: 470 });
        yPos += 14;
      });
    }

    // Footer
    const footerY = 720;
    doc.fillColor(aqua);
    doc.rect(0, footerY, doc.page.width, 50);
    doc.fill();

    doc.fillColor(charcoal);
    doc.fontSize(12);
    doc.font('Helvetica-Bold');
    doc.text('Scanned with PrintScore™', 20, footerY + 15);

    doc.fontSize(10);
    doc.font('Helvetica');
    doc.text('Powered by GPT-4o Vision. Files analyzed and immediately deleted.', 20, footerY + 32);

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
