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
    <div className="min-h-screen">
      {/* HERO */}
      <section className="py-20 px-4 text-center bg-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-charcoal mb-6 leading-tight">
            made it with ai?<br />
            <span className="text-aqua">let&apos;s make sure it prints right.</span>
          </h1>
          <p className="text-xl md:text-2xl text-charcoal/70 mb-8">
            upload your design ~ get an instant print score + a shareable pdf report.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#upload"
              className="bg-aqua hover:bg-aqua/90 text-charcoal font-bold py-4 px-8 rounded-xl text-lg transition-all hover:-translate-y-1 hover:shadow-glow-aqua"
            >
              check my printscore
            </a>
            <a
              href="#how-it-works"
              className="bg-white border-2 border-charcoal/20 hover:border-charcoal text-charcoal font-bold py-4 px-8 rounded-xl text-lg transition-all hover:-translate-y-1"
            >
              how it works
            </a>
          </div>
        </div>
      </section>

      {/* 3-STEP GRAPHIC */}
      <section className="py-16 px-4 bg-bg-light">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-8 shadow-soft hover:-translate-y-1 transition-transform text-center">
              <div className="w-16 h-16 bg-aqua/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">📤</span>
              </div>
              <h3 className="font-bold text-charcoal text-xl mb-2">Upload</h3>
              <p className="text-charcoal/60">drop your ai-generated design file</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-soft hover:-translate-y-1 transition-transform text-center">
              <div className="w-16 h-16 bg-pink/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🔍</span>
              </div>
              <h3 className="font-bold text-charcoal text-xl mb-2">Scan</h3>
              <p className="text-charcoal/60">instant print compatibility analysis</p>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-soft hover:-translate-y-1 transition-transform text-center">
              <div className="w-16 h-16 bg-yellow/40 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">🖨️</span>
              </div>
              <h3 className="font-bold text-charcoal text-xl mb-2">Print Confidently</h3>
              <p className="text-charcoal/60">download your detailed report</p>
            </div>
          </div>
        </div>
      </section>

      {/* UPLOAD TOOL */}
      <section id="upload" className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto">
          <div
            className={`
              relative p-10 rounded-2xl border-2 border-dashed transition-all cursor-pointer bg-bg-light
              ${isDragging ? 'border-pink shadow-glow-pink scale-[1.02]' : 'border-aqua'}
              ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : 'hover:border-pink hover:shadow-glow-pink'}
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
                <div className="w-20 h-20 bg-aqua/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">📤</span>
                </div>
                <h3 className="text-2xl font-bold text-charcoal mb-3">
                  drop your design here
                </h3>
                <p className="text-charcoal/60 mb-6">or click to browse</p>
                <div className="flex justify-center gap-3 text-sm font-medium mb-4">
                  <span className="bg-white px-4 py-2 rounded-lg border border-charcoal/20">PNG</span>
                  <span className="bg-white px-4 py-2 rounded-lg border border-charcoal/20">JPG</span>
                  <span className="bg-white px-4 py-2 rounded-lg border border-charcoal/20">PDF</span>
                </div>
                <p className="text-charcoal/50 text-sm">max file size: 10MB</p>
              </div>
            ) : (
              <div className="text-center">
                {preview && (
                  <img src={preview} alt="Preview" className="w-32 h-32 object-cover rounded-xl mx-auto mb-4" />
                )}
                {!preview && file.type === 'application/pdf' && (
                  <div className="w-32 h-32 bg-charcoal/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl">📄</span>
                  </div>
                )}
                <p className="font-medium text-charcoal mb-1">{file.name}</p>
                <p className="text-charcoal/50 text-sm mb-6">{formatSize(file.size)}</p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                    className="bg-charcoal/10 hover:bg-charcoal/20 text-charcoal font-medium py-2 px-6 rounded-lg transition-all"
                  >
                    remove
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); analyzeFile(); }}
                    disabled={isAnalyzing}
                    className="bg-aqua hover:bg-aqua/90 text-charcoal font-bold py-2 px-6 rounded-lg transition-all"
                  >
                    {isAnalyzing ? 'scanning...' : 'scan file'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="text-center mt-6 text-charcoal/60 text-sm">
            <p>free instant print score ~ no signup required.</p>
            <p className="mt-1">files are analyzed instantly and automatically deleted.</p>
          </div>
        </div>
      </section>

      {/* RESULTS */}
      {result && (
        <section ref={resultsRef} className="py-16 px-4 bg-bg-light">
          <div className="max-w-4xl mx-auto">
            {/* Score Gauge */}
            <div className="flex justify-center mb-8">
              <div className="relative w-56 h-56">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="80" stroke="#E5E5E5" strokeWidth="16" fill="none" />
                  <circle
                    cx="100" cy="100" r="80"
                    stroke={result.tier_color}
                    strokeWidth="16" fill="none"
                    strokeDasharray={503}
                    strokeDashoffset={503 - (result.total_score / 100) * 503}
                    strokeLinecap="round"
                    style={{
                      transition: 'stroke-dashoffset 1s ease-out',
                      filter: `drop-shadow(0 0 8px ${result.tier_color}80)`,
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span
                    className="text-6xl font-black"
                    style={{ color: result.tier_color }}
                  >
                    {result.total_score}
                  </span>
                  <span className="text-base font-medium text-charcoal/60">/ 100</span>
                </div>
              </div>
            </div>

            {/* Tier Badge */}
            <div className="text-center mb-8">
              <span
                className="inline-block px-8 py-3 rounded-full font-bold text-lg text-charcoal"
                style={{ backgroundColor: result.tier_color }}
              >
                {result.tier}
              </span>
            </div>

            {/* Summary */}
            <p className="text-center text-charcoal/80 text-xl mb-12 max-w-2xl mx-auto">
              {result.summary}
            </p>

            {/* Result Cards */}
            <div className="grid md:grid-cols-2 gap-4 mb-12">
              <div className="bg-white rounded-xl p-6 shadow-soft border-l-4 border-aqua">
                <h4 className="font-bold text-charcoal text-lg mb-2 flex items-center gap-2">
                  <span>📏</span> Resolution
                </h4>
                <p className="text-charcoal/70">{result.issues.resolution}</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-soft border-l-4 border-pink">
                <h4 className="font-bold text-charcoal text-lg mb-2 flex items-center gap-2">
                  <span>🎨</span> Color
                </h4>
                <p className="text-charcoal/70">{result.issues.color}</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-soft border-l-4 border-yellow">
                <h4 className="font-bold text-charcoal text-lg mb-2 flex items-center gap-2">
                  <span>✂️</span> Layout
                </h4>
                <p className="text-charcoal/70">{result.issues.layout}</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-soft border-l-4 border-charcoal/40">
                <h4 className="font-bold text-charcoal text-lg mb-2 flex items-center gap-2">
                  <span>📦</span> Format
                </h4>
                <p className="text-charcoal/70">{result.issues.format}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={downloadPDF}
                className="bg-aqua hover:bg-aqua/90 text-charcoal font-bold py-4 px-8 rounded-xl text-lg transition-all hover:-translate-y-1 hover:shadow-glow-aqua"
              >
                download pdf report
              </button>
              <button
                className="bg-pink hover:bg-pink/90 text-white font-bold py-4 px-8 rounded-xl text-lg transition-all hover:-translate-y-1"
              >
                fix my file ~ $15
              </button>
            </div>
          </div>
        </section>
      )}

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-16 px-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-charcoal text-center mb-12">how it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-aqua/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="font-bold text-aqua">1</span>
              </div>
              <h4 className="font-bold text-charcoal mb-2">Upload</h4>
              <p className="text-charcoal/60 text-sm">drag and drop your ai-generated design file</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-pink/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="font-bold text-pink">2</span>
              </div>
              <h4 className="font-bold text-charcoal mb-2">Scan</h4>
              <p className="text-charcoal/60 text-sm">instant analysis of resolution, color, layout, format</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow/40 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="font-bold text-charcoal">3</span>
              </div>
              <h4 className="font-bold text-charcoal mb-2">Download Report</h4>
              <p className="text-charcoal/60 text-sm">get your print score + pdf (and optionally fix your file)</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-4 bg-bg-light">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-charcoal text-center mb-12">frequently asked questions</h2>
          <div className="space-y-4">
            <details className="bg-white rounded-xl p-6 shadow-soft group">
              <summary className="font-bold text-charcoal cursor-pointer list-none flex justify-between items-center">
                why do printers reject ai-generated files?
                <span className="text-aqua group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-4 text-charcoal/70">
                ai-generated images often have low resolution, rgb color mode (printers need cmyk), or missing bleed areas. printscore catches these issues before you print.
              </p>
            </details>

            <details className="bg-white rounded-xl p-6 shadow-soft group">
              <summary className="font-bold text-charcoal cursor-pointer list-none flex justify-between items-center">
                what is dpi?
                <span className="text-aqua group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-4 text-charcoal/70">
                dpi stands for &quot;dots per inch&quot; and measures print resolution. 300 dpi is standard for high-quality prints. anything lower may look pixelated or blurry.
              </p>
            </details>

            <details className="bg-white rounded-xl p-6 shadow-soft group">
              <summary className="font-bold text-charcoal cursor-pointer list-none flex justify-between items-center">
                what is cmyk?
                <span className="text-aqua group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-4 text-charcoal/70">
                cmyk (cyan, magenta, yellow, black) is the color mode used for printing. ai images are typically rgb, which can cause color shifts when printed.
              </p>
            </details>

            <details className="bg-white rounded-xl p-6 shadow-soft group">
              <summary className="font-bold text-charcoal cursor-pointer list-none flex justify-between items-center">
                do you store my files?
                <span className="text-aqua group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-4 text-charcoal/70">
                no. files are analyzed instantly and automatically deleted immediately after processing. we never store or log your uploads.
              </p>
            </details>

            <details className="bg-white rounded-xl p-6 shadow-soft group">
              <summary className="font-bold text-charcoal cursor-pointer list-none flex justify-between items-center">
                what file types are supported?
                <span className="text-aqua group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-4 text-charcoal/70">
                png, jpg/jpeg, and pdf files up to 10mb are supported. for best results, use high-resolution images (at least 2400x3000 pixels for 8x10 prints).
              </p>
            </details>

            <details className="bg-white rounded-xl p-6 shadow-soft group">
              <summary className="font-bold text-charcoal cursor-pointer list-none flex justify-between items-center">
                how accurate is the score?
                <span className="text-aqua group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-4 text-charcoal/70">
                the score is guidance based on resolution, color mode, layout, and format. it&apos;s a helpful indicator, but always confirm with your print provider for final specs.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-4 bg-charcoal text-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
            <div className="font-bold text-xl">PrintScore™</div>
            <div className="flex gap-6 text-sm">
              <a href="#" className="hover:text-aqua transition-colors">privacy</a>
              <a href="#" className="hover:text-aqua transition-colors">terms</a>
            </div>
          </div>
          <p className="text-center text-white/50 text-sm">
            files are analyzed and automatically deleted.
          </p>
        </div>
      </footer>
    </div>
  );
}
