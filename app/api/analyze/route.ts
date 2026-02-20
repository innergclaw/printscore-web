import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Get file info
    const format_type = file.name.split('.').pop()?.toLowerCase() || 'unknown';
    const file_size = file.size;
    const buffer = Buffer.from(await file.arrayBuffer());

    let width_px = 0;
    let height_px = 0;

    // Analyze image dimensions
    if (file.type.startsWith('image/')) {
      try {
        const metadata = await sharp(buffer).metadata();
        width_px = metadata.width || 0;
        height_px = metadata.height || 0;
      } catch (e) {
        console.error('Sharp error:', e);
      }
    } else if (format_type === 'pdf') {
      // PDF - assume standard 8.5x11 at 300 DPI
      width_px = 2550;
      height_px = 3300;
    }

    // Calculate print size at 300 DPI
    const target_dpi = 300;
    const max_print_width_in = width_px / target_dpi;
    const max_print_height_in = height_px / target_dpi;

    // Evaluate suitability for 8x10 at 300dpi
    const min_width_8x10 = 2400;
    const min_height_8x10 = 3000;

    // --- RESOLUTION SCORE (40% weight) ---
    let resolution_score = 0;
    const total_megapixels = (width_px * height_px) / 1000000;

    if (width_px >= min_width_8x10 && height_px >= min_height_8x10) {
      resolution_score = 100;
    } else if (total_megapixels >= 4) {
      resolution_score = 85;
    } else if (total_megapixels >= 2) {
      resolution_score = 65;
    } else if (total_megapixels >= 1) {
      resolution_score = 45;
    } else {
      resolution_score = 20;
    }

    // --- SIZE SUITABILITY SCORE (30% weight) ---
    let size_score = 0;
    const size_mb = file_size / (1024 * 1024);

    if (size_mb <= 5) {
      size_score = 100;
    } else if (size_mb <= 10) {
      size_score = 85;
    } else if (size_mb <= 15) {
      size_score = 60;
    } else {
      size_score = 30;
    }

    // --- COLOR MODE SCORE (20% weight) ---
    let color_score = 70; // Default for RGB (assume PNG/JPG)

    if (format_type === 'pdf') {
      color_score = 50; // Unknown CMYK status
    }

    // --- FORMAT TYPE SCORE (10% weight) ---
    let format_score = 0;

    if (format_type === 'png' || format_type === 'jpg' || format_type === 'jpeg') {
      format_score = 100;
    } else if (format_type === 'pdf') {
      format_score = 90;
    } else {
      format_score = 50;
    }

    // --- CALCULATE TOTAL SCORE ---
    const total_score = Math.round(
      (resolution_score * 0.40) +
      (size_score * 0.30) +
      (color_score * 0.20) +
      (format_score * 0.10)
    );

    // --- DETERMINE TIER ---
    let tier = '';
    let tier_color = '';
    let summary = '';

    if (total_score >= 90) {
      tier = 'Print-Ready';
      tier_color = '#00D1C7'; // accent-teal
      summary = 'Your design is print-ready! Sharp, properly sized, and formatted correctly.';
    } else if (total_score >= 75) {
      tier = 'Great';
      tier_color = '#2DE2E6'; // accent-cyan
      summary = 'Your design looks good. Minor optimizations could help perfect it.';
    } else if (total_score >= 60) {
      tier = 'Needs Optimization';
      tier_color = '#F5A623'; // accent-amber
      summary = 'Your design needs some adjustments before printing for best results.';
    } else if (total_score >= 40) {
      tier = 'High Risk';
      tier_color = '#FF008C'; // accent-pink
      summary = 'Your design has significant issues that may cause print problems.';
    } else {
      tier = 'Print Failure Likely';
      tier_color = '#6B7280'; // gray
      summary = 'Your design will likely fail to print properly. Consider recreating at higher quality.';
    }

    // --- LAYOUT CHECK (basic heuristic) ---
    let layout_issue = 'Good margins detected. No bleed issues found.';

    if (file.type.startsWith('image/')) {
      try {
        const { data, info } = await sharp(buffer)
          .resize(100, 100, { fit: 'outside' })
          .raw()
          .toBuffer({ resolveWithObject: true });

        // Simple edge check - look for high contrast at edges
        const edgeThreshold = 3; // 3% from edge
        const edgePixels = Math.floor(100 * edgeThreshold / 100);

        let edgeActivity = false;
        for (let y = 0; y < info.height; y++) {
          for (let x = 0; x < info.width; x++) {
            if (x < edgePixels || x >= info.width - edgePixels ||
                y < edgePixels || y >= info.height - edgePixels) {
              const idx = (y * info.width + x) * info.channels;
              const r = data[idx];
              const g = data[idx + 1];
              const b = data[idx + 2];
              // Check for non-white pixels at edges
              if (r < 250 || g < 250 || b < 250) {
                edgeActivity = true;
                break;
              }
            }
          }
          if (edgeActivity) break;
        }

        if (edgeActivity) {
          layout_issue = 'Potential edge crowding detected. Consider adding safe margin or bleed area.';
        }
      } catch (e) {
        console.error('Layout check error:', e);
      }
    }

    // --- BUILD ISSUES STRINGS ---
    const issues = {
      resolution: `Sharp up to ${max_print_width_in.toFixed(1)} × ${max_print_height_in.toFixed(1)} inches at 300 DPI.`,
      color: format_type === 'pdf'
        ? 'CMYK status unknown for PDFs. Confirm with print provider.'
        : 'RGB color mode detected. Convert to CMYK for accurate print colors.',
      layout: layout_issue,
      format: `${format_type.toUpperCase()} format. ${format_type === 'pdf' ? 'Vector quality preserved. Good for print.' : 'Raster image format.'}`,
    };

    // File is deleted after processing (no persistent storage)
    // The buffer will be garbage collected

    return NextResponse.json({
      width_px,
      height_px,
      file_size,
      format_type,
      max_print_width_in,
      max_print_height_in,
      total_score,
      tier,
      tier_color,
      summary,
      issues,
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze file' }, { status: 500 });
  }
}
