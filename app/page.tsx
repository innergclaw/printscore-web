'use client';

import { useState, useRef, useCallback } from 'react';

// Types
interface AnalysisResult {
  width_px: number;
  height_px: number;
  file_size: number;
  format_type: string;
  max_print_width_in: number;
  max_print_height_in: number;
  total_score: number;
  tier: string;
  tier_color: string;
  summary: string;
  issues: {
    resolution: string;
    color: string;
    layout: string;
    format: string;
  };
  // AI insights
  sharpness?: string;
  compressionArtifacts?: string;
  colorProfile?: string;
  printSizeMax?: string;
  recommendations?: string[];
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Handle file selection
  const handleFileSelect = useCallback((selectedFile: File) => {
    const validTypes = ['image/png', 'image/jpeg', 'application/pdf'];
    if (!validTypes.includes(selectedFile.type)) {
      alert('Please upload a PNG, JPG, or PDF file.');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('File size must be under 10MB.');
      return;
    }

    setFile(selectedFile);
    setResult(null);

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target?.result as string);
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  }, []);

  // Drag and drop handlers
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) handleFileSelect(droppedFile);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Analyze file
  const analyzeFile = async () => {
    if (!file) return;

    setIsAnalyzing(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      setResult(data);

      // Scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Analysis error:', error);
      alert('Failed to analyze file. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Download PDF
  const downloadPDF = async () => {
    if (!result) return;

    const formData = new FormData();
    if (file) formData.append('file', file);
    formData.append('result', JSON.stringify(result));

    try {
      const response = await fetch('/api/pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('PDF generation failed');

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'printscore-report.pdf';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF error:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // Format file size
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="min-h-screen bg-[#F7F7F7]">
      {/* Navigation */}
      <nav className="py-5 bg-white shadow-[0_2px_20px_rgba(0,0,0,0.06)] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
          <div className="text-2xl font-extrabold text-[#14D8D4] tracking-tight">
            PrintScore™
          </div>
          <a href="#upload" className="px-7 py-3 bg-[#14D8D4] text-[#1F1F1F] font-bold rounded-xl shadow-[0_4px_15px_rgba(20,216,212,0.3)] hover:shadow-[0_6px_25px_rgba(20,216,212,0.4)] hover:-translate-y-0.5 transition-all">
            Check Your Score
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-24 px-6 text-center bg-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-extrabold text-[#1F1F1F] leading-tight mb-6" style={{ letterSpacing: '-2px' }}>
            Made it with AI?<br />
            <span className="text-[#14D8D4]">Let&apos;s make sure it prints right.</span>
          </h1>
          <p className="text-xl text-[#666666] max-w-xl mx-auto mb-10">
            AI-powered print analysis. Upload your design, get an accurate score, and specific recommendations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#upload"
              className="px-8 py-4 border-[3px] border-[#14D8D4] text-[#14D8D4] font-bold rounded-xl bg-white hover:bg-[#14D8D4] hover:text-[#1F1F1F] hover:shadow-[0_6px_25px_rgba(20,216,212,0.3)] hover:-translate-y-0.5 transition-all"
            >
              Check My PrintScore
            </a>
            <a
              href="#how"
              className="px-8 py-4 border-2 border-[#E0E0E0] text-[#666666] font-bold rounded-xl bg-white hover:border-[#14D8D4] hover:text-[#14D8D4] transition-all"
            >
              How It Works
            </a>
          </div>
        </div>
      </section>

      {/* 3-Step Graphic */}
      <section className="py-20 px-6 bg-[#F7F7F7]">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white p-9 rounded-2xl shadow-[0_4px_25px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_35px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all">
              <div className="w-16 h-16 bg-[#14D8D4] rounded-[14px] flex items-center justify-center text-2xl text-[#1F1F1F] font-extrabold mb-5">
                1
              </div>
              <h3 className="text-xl font-bold text-[#1F1F1F] mb-2">Upload</h3>
              <p className="text-[#666666]">Drop your design file. PNG, JPG, or PDF.</p>
            </div>

            <div className="bg-white p-9 rounded-2xl shadow-[0_4px_25px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_35px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all">
              <div className="w-16 h-16 bg-[#FF008C] rounded-[14px] flex items-center justify-center text-2xl text-white font-extrabold mb-5">
                2
              </div>
              <h3 className="text-xl font-bold text-[#1F1F1F] mb-2">AI Analysis</h3>
              <p className="text-[#666666]">GPT-4o Vision examines your image for print issues.</p>
            </div>

            <div className="bg-white p-9 rounded-2xl shadow-[0_4px_25px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_35px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-all">
              <div className="w-16 h-16 bg-[#FFE600] rounded-[14px] flex items-center justify-center text-2xl text-[#1F1F1F] font-extrabold mb-5">
                3
              </div>
              <h3 className="text-xl font-bold text-[#1F1F1F] mb-2">Print Confidently</h3>
              <p className="text-[#666666]">Get your score, report, and fix recommendations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Upload Tool */}
      <section id="upload" className="py-20 px-6 bg-white">
        <div className="max-w-xl mx-auto">
          <div
            className={`
              relative p-12 rounded-2xl border-[3px] border-dashed transition-all cursor-pointer bg-white shadow-[0_4px_25px_rgba(0,0,0,0.04)]
              ${isDragging ? 'border-[#FF008C] bg-[#FFF8FC]' : 'border-[#14D8D4]'}
              ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#FF008C]'}
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !isAnalyzing && !file && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.pdf"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              disabled={isAnalyzing}
            />

            {!file ? (
              <div className="text-center">
                <div className="w-20 h-20 bg-[#14D8D4] rounded-2xl flex items-center justify-center mx-auto mb-6 text-4xl">
                  📤
                </div>
                <h3 className="text-2xl font-bold text-[#1F1F1F] mb-2">
                  Drop your design here
                </h3>
                <p className="text-[#666666] mb-5">or click to browse</p>
                <div className="flex justify-center gap-3 text-sm font-semibold mb-4">
                  <span className="bg-[#F7F7F7] px-5 py-2 rounded-lg text-[#1F1F1F]">PNG</span>
                  <span className="bg-[#F7F7F7] px-5 py-2 rounded-lg text-[#1F1F1F]">JPG</span>
                  <span className="bg-[#F7F7F7] px-5 py-2 rounded-lg text-[#1F1F1F]">PDF</span>
                </div>
                <p className="text-[#666666] text-sm">Max file size: 10MB</p>
              </div>
            ) : (
              <div className="text-center">
                {preview && (
                  <img src={preview} alt="Preview" className="w-32 h-32 object-cover rounded-xl shadow-lg mx-auto mb-4" />
                )}
                {!preview && file.type === 'application/pdf' && (
                  <div className="w-32 h-32 rounded-xl flex items-center justify-center mx-auto mb-4 bg-[#F7F7F7]">
                    <span className="text-4xl">📄</span>
                  </div>
                )}
                <p className="font-bold text-[#1F1F1F] mb-1">{file.name}</p>
                <p className="text-[#666666] text-sm mb-6">{formatSize(file.size)}</p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                    className="px-6 py-3 bg-[#F7F7F7] text-[#666666] font-semibold rounded-xl hover:bg-[#E8E8E8] transition-all"
                  >
                    Remove
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); analyzeFile(); }}
                    disabled={isAnalyzing}
                    className="px-6 py-3 bg-[#14D8D4] text-[#1F1F1F] font-bold rounded-xl shadow-[0_4px_15px_rgba(20,216,212,0.3)] hover:shadow-[0_6px_25px_rgba(20,216,212,0.4)] hover:-translate-y-0.5 transition-all disabled:opacity-50"
                  >
                    {isAnalyzing ? 'AI Analyzing...' : 'Analyze with AI'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="text-center mt-6 text-[#666666] text-sm">
            <p>Powered by GPT-4o Vision for accurate print analysis.</p>
            <p className="mt-1 text-[#666666]/70">Files analyzed and immediately deleted.</p>
          </div>
        </div>
      </section>

      {/* Results */}
      {result && (
        <section ref={resultsRef} className="py-20 px-6 bg-[#F7F7F7]">
          <div className="max-w-4xl mx-auto">
            {/* Score Gauge */}
            <div className="flex justify-center mb-8">
              <div className="relative w-60 h-60">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="80" stroke="#E8E8E8" strokeWidth="16" fill="none" />
                  <circle
                    cx="100" cy="100" r="80"
                    stroke={result.tier_color}
                    strokeWidth="16" fill="none"
                    strokeDasharray={503}
                    strokeDashoffset={503 - (result.total_score / 100) * 503}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-7xl font-extrabold text-[#1F1F1F]">
                    {result.total_score}
                  </span>
                  <span className="text-lg text-[#666666]">/ 100</span>
                </div>
              </div>
            </div>

            {/* Tier Badge */}
            <div className="text-center mb-8">
              <span
                className="inline-block px-9 py-4 rounded-[14px] font-bold text-xl shadow-[0_4px_20px_rgba(0,0,0,0.1)]"
                style={{ 
                  backgroundColor: result.tier_color,
                  color: (result.tier_color === '#1F1F1F' || result.tier_color === '#FFE600') ? '#FFFFFF' : '#1F1F1F'
                }}
              >
                {result.tier}
              </span>
            </div>

            {/* Summary */}
            <p className="text-center text-[#666666] text-xl mb-12 max-w-2xl mx-auto">
              {result.summary}
            </p>

            {/* Issue Cards */}
            <div className="grid md:grid-cols-2 gap-4 mb-10">
              <div className="bg-white rounded-[14px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_25px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all border-l-[5px] border-[#14D8D4]">
                <h4 className="font-bold text-[#1F1F1F] text-lg mb-2 flex items-center gap-2">
                  <span>📏</span> Resolution
                </h4>
                <p className="text-[#666666] text-sm leading-relaxed">{result.issues.resolution}</p>
              </div>

              <div className="bg-white rounded-[14px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_25px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all border-l-[5px] border-[#FF008C]">
                <h4 className="font-bold text-[#1F1F1F] text-lg mb-2 flex items-center gap-2">
                  <span>🎨</span> Color
                </h4>
                <p className="text-[#666666] text-sm leading-relaxed">{result.issues.color}</p>
              </div>

              <div className="bg-white rounded-[14px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_25px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all border-l-[5px] border-[#FFE600]">
                <h4 className="font-bold text-[#1F1F1F] text-lg mb-2 flex items-center gap-2">
                  <span>✂️</span> Layout
                </h4>
                <p className="text-[#666666] text-sm leading-relaxed">{result.issues.layout}</p>
              </div>

              <div className="bg-white rounded-[14px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_6px_25px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 transition-all border-l-[5px] border-[#1F1F1F]">
                <h4 className="font-bold text-[#1F1F1F] text-lg mb-2 flex items-center gap-2">
                  <span>📦</span> Format
                </h4>
                <p className="text-[#666666] text-sm leading-relaxed">{result.issues.format}</p>
              </div>
            </div>

            {/* AI Insights */}
            {(result.sharpness || result.compressionArtifacts || result.colorProfile) && (
              <div className="bg-white rounded-[14px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)] mb-10">
                <h4 className="font-bold text-[#1F1F1F] text-lg mb-4 flex items-center gap-2">
                  <span>🤖</span> AI Quality Analysis
                </h4>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  {result.sharpness && (
                    <div>
                      <span className="font-semibold text-[#1F1F1F]">Sharpness:</span>
                      <p className="text-[#666666]">{result.sharpness}</p>
                    </div>
                  )}
                  {result.compressionArtifacts && (
                    <div>
                      <span className="font-semibold text-[#1F1F1F]">Artifacts:</span>
                      <p className="text-[#666666]">{result.compressionArtifacts}</p>
                    </div>
                  )}
                  {result.colorProfile && (
                    <div>
                      <span className="font-semibold text-[#1F1F1F]">Color:</span>
                      <p className="text-[#666666]">{result.colorProfile}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations && result.recommendations.length > 0 && (
              <div className="bg-white rounded-[14px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)] mb-10">
                <h4 className="font-bold text-[#1F1F1F] text-lg mb-4 flex items-center gap-2">
                  <span>💡</span> Recommendations
                </h4>
                <ul className="space-y-2">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-[#666666] text-sm">
                      <span className="text-[#14D8D4] mt-1">→</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Print Size */}
            <div className="text-center p-6 bg-white rounded-[14px] shadow-[0_4px_20px_rgba(0,0,0,0.06)] max-w-md mx-auto mb-10">
              <span className="font-bold text-[#1F1F1F]">Print Size Safe Range:</span>{' '}
              <span className="font-bold text-[#14D8D4]">
                {result.max_print_width_in?.toFixed(1)} × {result.max_print_height_in?.toFixed(1)} inches
              </span>{' '}
              <span className="text-[#666666]">at 300 DPI</span>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={downloadPDF}
                className="px-8 py-4 bg-[#14D8D4] text-[#1F1F1F] font-bold rounded-xl shadow-[0_4px_20px_rgba(20,216,212,0.3)] hover:shadow-[0_6px_25px_rgba(20,216,212,0.4)] hover:-translate-y-0.5 transition-all"
              >
                Download PDF Report
              </button>
              <a
                href="https://shopnasgfx.com/fix-my-file"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-[#FF008C] text-white font-bold rounded-xl shadow-[0_4px_20px_rgba(255,0,140,0.3)] hover:shadow-[0_6px_25px_rgba(255,0,140,0.4)] hover:-translate-y-0.5 transition-all text-center"
              >
                Fix My File — $15
              </a>
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section id="how" className="py-20 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-extrabold text-[#1F1F1F] text-center mb-12">How It Works</h2>
          <div className="flex flex-col gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#14D8D4] rounded-[14px] flex items-center justify-center mx-auto mb-4 text-2xl font-extrabold text-[#1F1F1F]">1</div>
              <h4 className="text-xl font-bold text-[#1F1F1F] mb-2">Upload</h4>
              <p className="text-[#666666]">Drag and drop your design file.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#FF008C] rounded-[14px] flex items-center justify-center mx-auto mb-4 text-2xl font-extrabold text-white">2</div>
              <h4 className="text-xl font-bold text-[#1F1F1F] mb-2">AI Analysis</h4>
              <p className="text-[#666666]">GPT-4o Vision examines sharpness, artifacts, color, and print issues.</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#FFE600] rounded-[14px] flex items-center justify-center mx-auto mb-4 text-2xl font-extrabold text-[#1F1F1F]">3</div>
              <h4 className="text-xl font-bold text-[#1F1F1F] mb-2">Get Results</h4>
              <p className="text-[#666666]">Accurate score, detailed report, and actionable recommendations.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-[#F7F7F7]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-extrabold text-[#1F1F1F] text-center mb-12">FAQ</h2>
          <div className="flex flex-col gap-4">
            <details className="bg-white rounded-[14px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_25px_rgba(0,0,0,0.08)] transition-all group">
              <summary className="font-bold text-[#1F1F1F] cursor-pointer list-none flex justify-between items-center">
                Why do printers reject AI-generated files?
                <span className="text-[#14D8D4] text-xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-4 text-[#666666] leading-relaxed">
                AI-generated images often have low resolution, RGB color mode (printers need CMYK), compression artifacts, or missing bleed areas. PrintScore catches these issues before you print.
              </p>
            </details>

            <details className="bg-white rounded-[14px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_25px_rgba(0,0,0,0.08)] transition-all group">
              <summary className="font-bold text-[#1F1F1F] cursor-pointer list-none flex justify-between items-center">
                How accurate is the AI analysis?
                <span className="text-[#14D8D4] text-xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-4 text-[#666666] leading-relaxed">
                GPT-4o Vision examines actual image quality — not just metadata. It detects blur, compression artifacts, color issues, and other print-specific problems that basic checks miss.
              </p>
            </details>

            <details className="bg-white rounded-[14px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_25px_rgba(0,0,0,0.08)] transition-all group">
              <summary className="font-bold text-[#1F1F1F] cursor-pointer list-none flex justify-between items-center">
                What is DPI and why does it matter?
                <span className="text-[#14D8D4] text-xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-4 text-[#666666] leading-relaxed">
                DPI (dots per inch) measures print resolution. 300 DPI is standard for high-quality prints. Lower DPI results in pixelation and blur.
              </p>
            </details>

            <details className="bg-white rounded-[14px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_25px_rgba(0,0,0,0.08)] transition-all group">
              <summary className="font-bold text-[#1F1F1F] cursor-pointer list-none flex justify-between items-center">
                Do you store my files?
                <span className="text-[#14D8D4] text-xl group-open:rotate-45 transition-transform">+</span>
              </summary>
              <p className="mt-4 text-[#666666] leading-relaxed">
                No. Files are analyzed and immediately deleted. We never store or log your uploads.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-extrabold text-[#1F1F1F] mb-4">
            Print With Confidence.
          </h2>
          <p className="text-xl text-[#666666] mb-10">
            AI-powered analysis. Accurate scores. Specific recommendations.
          </p>
          <a
            href="#upload"
            className="inline-block px-8 py-4 border-[3px] border-[#14D8D4] text-[#14D8D4] font-bold rounded-xl bg-white hover:bg-[#14D8D4] hover:text-[#1F1F1F] hover:shadow-[0_6px_25px_rgba(20,216,212,0.3)] hover:-translate-y-0.5 transition-all"
          >
            Check My PrintScore
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-[#E8E8E8] bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-xl font-extrabold text-[#14D8D4] mb-4">
            PrintScore™
          </div>
          <p className="text-[#666666] text-sm mb-4">
            Powered by GPT-4o Vision. Files analyzed and immediately deleted.
          </p>
          <p className="text-xs text-[#666666]/60">
            Powered by <a href="https://innergclaw.github.io/innerg-intelligence-landing/" target="_blank" rel="noopener noreferrer" className="hover:text-[#14D8D4] transition-colors">InnerG Intelligence</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
