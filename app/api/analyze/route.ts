import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import OpenAI from 'openai';

export const runtime = 'nodejs';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface AIAnalysis {
  score: number;
  tier: string;
  summary: string;
  resolutionIssue: string;
  colorIssue: string;
  layoutIssue: string;
  formatIssue: string;
  printSizeMax: string;
  sharpness: string;
  compressionArtifacts: string;
  colorProfile: string;
  recommendations: string[];
}

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
    const max_print_width_in = width_px / 300;
    const max_print_height_in = height_px / 300;

    // Use OpenAI Vision for detailed analysis
    let aiAnalysis: AIAnalysis;

    if (file.type.startsWith('image/')) {
      try {
        aiAnalysis = await analyzeWithOpenAI(buffer, file.type, width_px, height_px);
      } catch (error) {
        console.error('OpenAI analysis failed:', error);
        // Return the error to the client for debugging
        return NextResponse.json({ 
          error: 'AI analysis failed', 
          details: error instanceof Error ? error.message : 'Unknown error',
          fallback: true
        }, { status: 500 });
      }
    } else {
      // PDF - use basic analysis
      aiAnalysis = getBasicAnalysis(width_px, height_px, format_type, file_size);
    }

    // Determine tier color
    let tier_color = '#6B7280';
    if (aiAnalysis.score >= 90) tier_color = '#14D8D4'; // aqua
    else if (aiAnalysis.score >= 75) tier_color = '#14D8D4'; // aqua
    else if (aiAnalysis.score >= 60) tier_color = '#FFE600'; // yellow
    else if (aiAnalysis.score >= 40) tier_color = '#FF008C'; // pink

    // Build response
    const issues = {
      resolution: aiAnalysis.resolutionIssue,
      color: aiAnalysis.colorIssue,
      layout: aiAnalysis.layoutIssue,
      format: aiAnalysis.formatIssue,
    };

    return NextResponse.json({
      width_px,
      height_px,
      file_size,
      format_type,
      max_print_width_in,
      max_print_height_in,
      total_score: aiAnalysis.score,
      tier: aiAnalysis.tier,
      tier_color,
      summary: aiAnalysis.summary,
      issues,
      // Extra AI insights
      sharpness: aiAnalysis.sharpness,
      compressionArtifacts: aiAnalysis.compressionArtifacts,
      colorProfile: aiAnalysis.colorProfile,
      printSizeMax: aiAnalysis.printSizeMax,
      recommendations: aiAnalysis.recommendations,
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze file' }, { status: 500 });
  }
}

async function analyzeWithOpenAI(
  imageBuffer: Buffer,
  mimeType: string,
  width: number,
  height: number
): Promise<AIAnalysis> {
  // Check for API key
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  const base64Image = imageBuffer.toString('base64');
  const dataUrl = `data:${mimeType};base64,${base64Image}`;

  const megapixels = (width * height) / 1000000;
  const printSizeAt300 = `${(width / 300).toFixed(1)} × ${(height / 300).toFixed(1)} inches`;

  const prompt = `You are a professional print quality analyst. Analyze this image for PRINT COMPATIBILITY.

IMAGE METADATA:
- Dimensions: ${width} × ${height} pixels (${megapixels.toFixed(1)} MP)
- Max print size at 300 DPI: ${printSizeAt300}

Analyze the actual image quality, not just the metadata. Look for:

1. **Sharpness/Clarity**: Is the image actually sharp? Any blurriness, softness, or focus issues?
2. **Compression Artifacts**: JPEG artifacts, banding, blockiness, noise?
3. **Color Quality**: Accurate colors? Any color banding, posterization, or gamut issues?
4. **Detail Level**: Are fine details preserved or lost?
5. **Print-Specific Issues**: Moiré patterns, halftone issues, anything that would look bad in print?
6. **Content Appropriateness**: Is this a sketch/draft vs. final artwork? Is it AI-generated with typical artifacts?

SCORING GUIDE:
- 90-100: Print-Ready (sharp, clean, professional quality)
- 75-89: Great (minor issues, still good for most prints)
- 60-74: Needs Optimization (noticeable issues, recommend fixes)
- 40-59: High Risk (significant problems, may print poorly)
- 0-39: Print Failure Likely (severe issues, will not print well)

IMPORTANT: If the image is clearly a rough sketch, draft, low-quality screenshot, or placeholder - score it ACCORDINGLY (likely 20-50 range). Do not give high scores to rough work.

Respond in this EXACT JSON format (no markdown, just pure JSON):
{
  "score": <number 0-100>,
  "tier": "<Print-Ready | Great | Needs Optimization | High Risk | Print Failure Likely>",
  "summary": "<1-2 sentence honest assessment>",
  "resolutionIssue": "<specific resolution/size feedback>",
  "colorIssue": "<specific color/profile feedback>",
  "layoutIssue": "<specific composition/margin feedback>",
  "formatIssue": "<specific format/quality feedback>",
  "printSizeMax": "<recommended max print size>",
  "sharpness": "<sharpness assessment>",
  "compressionArtifacts": "<artifact assessment>",
  "colorProfile": "<color quality assessment>",
  "recommendations": ["<specific actionable recommendation 1>", "<recommendation 2>"]
}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: { url: dataUrl, detail: 'high' },
          },
        ],
      },
    ],
    max_tokens: 1000,
    temperature: 0.3,
  });

  const content = response.choices[0]?.message?.content || '';
  console.log('OpenAI response:', content.substring(0, 200));
  
  // Parse JSON response
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[0]) as AIAnalysis;
  }
  
  throw new Error('Failed to parse OpenAI response: ' + content.substring(0, 100));
}

function getBasicAnalysis(width: number, height: number, format: string, fileSize: number): AIAnalysis {
  const megapixels = (width * height) / 1000000;
  
  let score = 50;
  let tier = 'Needs Optimization';
  let summary = 'Basic analysis performed. For detailed print assessment, upload an image file.';
  
  // Resolution scoring
  if (width >= 2400 && height >= 3000) {
    score = 85;
    tier = 'Great';
    summary = 'Good resolution for standard prints. Recommend using AI analysis for detailed assessment.';
  } else if (megapixels >= 4) {
    score = 75;
    tier = 'Great';
  } else if (megapixels >= 2) {
    score = 60;
    tier = 'Needs Optimization';
    summary = 'Moderate resolution. May appear soft on larger prints.';
  } else if (megapixels >= 1) {
    score = 45;
    tier = 'High Risk';
    summary = 'Low resolution. Not suitable for quality prints.';
  } else {
    score = 25;
    tier = 'Print Failure Likely';
    summary = 'Very low resolution. Will not produce acceptable prints.';
  }

  return {
    score,
    tier,
    summary,
    resolutionIssue: `${width} × ${height}px (${megapixels.toFixed(1)} MP). Max print: ${(width / 300).toFixed(1)} × ${(height / 300).toFixed(1)} inches at 300 DPI.`,
    colorIssue: format === 'pdf' ? 'CMYK status unknown for PDFs.' : 'RGB color mode. Convert to CMYK for accurate print colors.',
    layoutIssue: 'Layout analysis requires AI vision. Upload an image for detailed assessment.',
    formatIssue: `${format.toUpperCase()} format detected.`,
    printSizeMax: `${(width / 300).toFixed(1)} × ${(height / 300).toFixed(1)} inches`,
    sharpness: 'Requires AI analysis',
    compressionArtifacts: 'Requires AI analysis',
    colorProfile: 'Requires AI analysis',
    recommendations: ['Upload an image file for AI-powered detailed analysis'],
  };
}
