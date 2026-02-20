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
      {/* Navigation */}
      <nav className="py-6 border-b border-surface bg-bg">
        <div className="max-w-6xl mx-auto px-6 flex justify-between items-center">
          <div className="text-2xl font-bold text-accent-teal" style={{ textShadow: '0 0 20px rgba(0, 209, 199, 0.3)' }}>
            PrintScore™
          </div>
          <a href="#upload" className="px-5 py-2.5 bg-accent-teal text-bg font-semibold rounded-lg hover:bg-accent-teal/80 transition-all" style={{ boxShadow: '0 0 15px rgba(0, 209, 199, 0.3)' }}>
            Check Your Score
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-24 md:py-32 px-6 text-center bg-bg">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-text leading-tight mb-6" style={{ letterSpacing: '-2px', textShadow: '0 0 40px rgba(0, 209, 199, 0.2)' }}>
            Made it with AI?<br />
            <span className="text-accent-teal">Let&apos;s make sure it prints right.</span>
          </h1>
          <p className="text-xl text-text-muted max-w-2xl mx-auto mb-10">
            Upload your design. Get an instant print compatibility score. Download a shareable PDF report.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="#upload"
              className="px-8 py-4 border-2 border-accent-teal text-accent-teal font-semibold rounded-lg hover:bg-accent-teal/10 transition-all"
              style={{ boxShadow: '0 0 20px rgba(0, 209, 199, 0.2)' }}
            >
              Check My PrintScore
            </a>
            <a
              href="#how-it-works"
              className="px-8 py-4 border-2 border-surface text-text-muted font-semibold rounded-lg hover:border-accent-cyan hover:text-accent-cyan transition-all"
            >
              How It Works
            </a>
          </div>
        </div>
      </section>

      {/* 3-Step Graphic */}
      <section className="py-16 px-6 bg-surface">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-bg p-8 rounded-2xl border border-surface hover:border-accent-teal transition-all group">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 border-2 border-accent-teal text-accent-teal text-2xl font-bold" style={{ boxShadow: '0 0 20px rgba(0, 209, 199, 0.2)' }}>
                1
              </div>
              <h3 className="font-bold text-text text-xl mb-2">Upload</h3>
              <p className="text-text-muted">Drop your AI-generated design file. PNG, JPG, or PDF.</p>
            </div>

            <div className="bg-bg p-8 rounded-2xl border border-surface hover:border-accent-cyan transition-all group">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 border-2 border-accent-cyan text-accent-cyan text-2xl font-bold" style={{ boxShadow: '0 0 20px rgba(45, 226, 230, 0.2)' }}>
                2
              </div>
              <h3 className="font-bold text-text text-xl mb-2">Scan</h3>
              <p className="text-text-muted">Instant analysis of resolution, color mode, layout, and format.</p>
            </div>

            <div className="bg-bg p-8 rounded-2xl border border-surface hover:border-accent-lime transition-all group">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6 border-2 border-accent-lime text-accent-lime text-2xl font-bold" style={{ boxShadow: '0 0 20px rgba(199, 244, 100, 0.2)' }}>
                3
              </div>
              <h3 className="font-bold text-text text-xl mb-2">Print Confidently</h3>
              <p className="text-text-muted">Download your detailed report. Fix issues if needed.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Upload Tool */}
      <section id="upload" className="py-20 px-6 bg-bg">
        <div className="max-w-3xl mx-auto">
          <div
            className={`
              relative p-10 rounded-2xl border-2 border-dashed transition-all cursor-pointer bg-surface
              ${isDragging ? 'border-accent-lime' : 'border-accent-teal/50'}
              ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : 'hover:border-accent-teal'}
            `}
            style={isDragging ? { boxShadow: '0 0 30px rgba(199, 244, 100, 0.3)' } : {}}
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
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 border-2 border-accent-teal text-accent-teal" style={{ boxShadow: '0 0 20px rgba(0, 209, 199, 0.2)' }}>
                  <span className="text-3xl">↑</span>
                </div>
                <h3 className="text-2xl font-bold text-text mb-3">
                  Drop your design here
                </h3>
                <p className="text-text-muted mb-6">or click to browse</p>
                <div className="flex justify-center gap-3 text-sm font-medium mb-4">
                  <span className="bg-bg px-4 py-2 rounded-lg border border-surface text-text-muted">PNG</span>
                  <span className="bg-bg px-4 py-2 rounded-lg border border-surface text-text-muted">JPG</span>
                  <span className="bg-bg px-4 py-2 rounded-lg border border-surface text-text-muted">PDF</span>
                </div>
                <p className="text-text-muted/60 text-sm">Max file size: 10MB</p>
              </div>
            ) : (
              <div className="text-center">
                {preview && (
                  <img src={preview} alt="Preview" className="w-32 h-32 object-cover rounded-xl mx-auto mb-4 border border-surface" />
                )}
                {!preview && file.type === 'application/pdf' && (
                  <div className="w-32 h-32 rounded-xl flex items-center justify-center mx-auto mb-4 border border-surface bg-bg">
                    <span className="text-4xl">📄</span>
                  </div>
                )}
                <p className="font-medium text-text mb-1">{file.name}</p>
                <p className="text-text-muted text-sm mb-6">{formatSize(file.size)}</p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                    className="px-6 py-2.5 bg-surface hover:bg-surface/80 text-text-muted font-medium rounded-lg border border-surface transition-all"
                  >
                    Remove
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); analyzeFile(); }}
                    disabled={isAnalyzing}
                    className="px-6 py-2.5 bg-accent-teal hover:bg-accent-teal/80 text-bg font-bold rounded-lg transition-all"
                    style={{ boxShadow: '0 0 15px rgba(0, 209, 199, 0.3)' }}
                  >
                    {isAnalyzing ? 'Scanning...' : 'Scan File'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="text-center mt-6 text-text-muted text-sm">
            <p>Free instant print score — no signup required.</p>
            <p className="mt-1 text-text-muted/60">Files are analyzed instantly and automatically deleted.</p>
          </div>
        </div>
      </section>

      {/* Results */}
      {result && (
        <section ref={resultsRef} className="py-20 px-6 bg-surface">
          <div className="max-w-4xl mx-auto">
            {/* Score Gauge */}
            <div className="flex justify-center mb-8">
              <div className="relative w-56 h-56">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
                  <circle cx="100" cy="100" r="80" stroke="#1A1E24" strokeWidth="16" fill="none" />
                  <circle
                    cx="100" cy="100" r="80"
                    stroke={result.tier_color}
                    strokeWidth="16" fill="none"
                    strokeDasharray={503}
                    strokeDashoffset={503 - (result.total_score / 100) * 503}
                    strokeLinecap="round"
                    style={{
                      transition: 'stroke-dashoffset 1s ease-out',
                      filter: `drop-shadow(0 0 12px ${result.tier_color}60)`,
                    }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span
                    className="text-6xl font-black"
                    style={{ color: result.tier_color, textShadow: `0 0 20px ${result.tier_color}40` }}
                  >
                    {result.total_score}
                  </span>
                  <span className="text-base font-medium text-text-muted">/ 100</span>
                </div>
              </div>
            </div>

            {/* Tier Badge */}
            <div className="text-center mb-8">
              <span
                className="inline-block px-8 py-3 rounded-full font-bold text-lg text-bg"
                style={{ backgroundColor: result.tier_color, boxShadow: `0 0 20px ${result.tier_color}40` }}
              >
                {result.tier}
              </span>
            </div>

            {/* Summary */}
            <p className="text-center text-text-muted text-xl mb-12 max-w-2xl mx-auto">
              {result.summary}
            </p>

            {/* Result Cards */}
            <div className="grid md:grid-cols-2 gap-4 mb-12">
              <div className="bg-bg rounded-xl p-6 border border-surface hover:border-accent-teal transition-all" style={{ borderLeftWidth: '4px', borderLeftColor: '#00D1C7' }}>
                <h4 className="font-bold text-text text-lg mb-2 flex items-center gap-2">
                  <span className="text-accent-teal">📏</span> Resolution
                </h4>
                <p className="text-text-muted">{result.issues.resolution}</p>
              </div>

              <div className="bg-bg rounded-xl p-6 border border-surface hover:border-accent-pink transition-all" style={{ borderLeftWidth: '4px', borderLeftColor: '#FF008C' }}>
                <h4 className="font-bold text-text text-lg mb-2 flex items-center gap-2">
                  <span className="text-accent-pink">🎨</span> Color
                </h4>
                <p className="text-text-muted">{result.issues.color}</p>
              </div>

              <div className="bg-bg rounded-xl p-6 border border-surface hover:border-accent-amber transition-all" style={{ borderLeftWidth: '4px', borderLeftColor: '#F5A623' }}>
                <h4 className="font-bold text-text text-lg mb-2 flex items-center gap-2">
                  <span className="text-accent-amber">✂️</span> Layout
                </h4>
                <p className="text-text-muted">{result.issues.layout}</p>
              </div>

              <div className="bg-bg rounded-xl p-6 border border-surface hover:border-text-muted transition-all" style={{ borderLeftWidth: '4px', borderLeftColor: '#6B7280' }}>
                <h4 className="font-bold text-text text-lg mb-2 flex items-center gap-2">
                  <span>📦</span> Format
                </h4>
                <p className="text-text-muted">{result.issues.format}</p>
              </div>
            </div>

            {/* Print Size Safe Range */}
            <div className="text-center mb-10 p-6 bg-bg rounded-xl border border-surface max-w-xl mx-auto">
              <p className="text-text-muted">
                <span className="text-accent-lime font-semibold">Print Size Safe Range:</span>{' '}
                {result.max_print_width_in?.toFixed(1)} × {result.max_print_height_in?.toFixed(1)} inches at 300 DPI
              </p>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={downloadPDF}
                className="px-8 py-4 bg-accent-teal hover:bg-accent-teal/80 text-bg font-bold rounded-lg transition-all"
                style={{ boxShadow: '0 0 20px rgba(0, 209, 199, 0.3)' }}
              >
                Download PDF Report
              </button>
              <a
                href="https://shopnasgfx.com/fix-my-file"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-accent-amber hover:bg-accent-amber/80 text-bg font-bold rounded-lg transition-all text-center"
                style={{ boxShadow: '0 0 20px rgba(245, 166, 35, 0.3)' }}
              >
                Fix My File — $15
              </a>
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-6 bg-bg">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-text text-center mb-12">How It Works</h2>
          <div className="flex flex-col gap-8">
            <div className="text-center">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 border-2 border-accent-teal text-accent-teal text-xl font-bold" style={{ boxShadow: '0 0 20px rgba(0, 209, 199, 0.2)' }}>
                1
              </div>
              <h4 className="font-bold text-text text-lg mb-2">Upload</h4>
              <p className="text-text-muted">Drag and drop your AI-generated design file.</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 border-2 border-accent-cyan text-accent-cyan text-xl font-bold" style={{ boxShadow: '0 0 20px rgba(45, 226, 230, 0.2)' }}>
                2
              </div>
              <h4 className="font-bold text-text text-lg mb-2">Scan</h4>
              <p className="text-text-muted">Instant analysis of resolution, color mode, layout, and format.</p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 border-2 border-accent-lime text-accent-lime text-xl font-bold" style={{ boxShadow: '0 0 20px rgba(199, 244, 100, 0.2)' }}>
                3
              </div>
              <h4 className="font-bold text-text text-lg mb-2">Download Report</h4>
              <p className="text-text-muted">Get your print score + PDF. Optionally fix your file.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6 bg-surface">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-text text-center mb-12">Frequently Asked Questions</h2>
          <div className="flex flex-col gap-4">
            <details className="bg-bg rounded-xl p-6 border border-surface hover:border-accent-teal transition-all group">
              <summary className="font-bold text-text cursor-pointer list-none flex justify-between items-center">
                Why do printers reject AI-generated files?
                <span className="text-accent-teal group-open:rotate-180 transition-transform text-xl">+</span>
              </summary>
              <p className="mt-4 text-text-muted leading-relaxed">
                AI-generated images often have low resolution, RGB color mode (printers need CMYK), or missing bleed areas. PrintScore catches these issues before you print.
              </p>
            </details>

            <details className="bg-bg rounded-xl p-6 border border-surface hover:border-accent-teal transition-all group">
              <summary className="font-bold text-text cursor-pointer list-none flex justify-between items-center">
                What is DPI?
                <span className="text-accent-teal group-open:rotate-180 transition-transform text-xl">+</span>
              </summary>
              <p className="mt-4 text-text-muted leading-relaxed">
                DPI stands for &quot;dots per inch&quot; and measures print resolution. 300 DPI is standard for high-quality prints. Anything lower may look pixelated or blurry.
              </p>
            </details>

            <details className="bg-bg rounded-xl p-6 border border-surface hover:border-accent-teal transition-all group">
              <summary className="font-bold text-text cursor-pointer list-none flex justify-between items-center">
                What is CMYK?
                <span className="text-accent-teal group-open:rotate-180 transition-transform text-xl">+</span>
              </summary>
              <p className="mt-4 text-text-muted leading-relaxed">
                CMYK (cyan, magenta, yellow, black) is the color mode used for printing. AI images are typically RGB, which can cause color shifts when printed.
              </p>
            </details>

            <details className="bg-bg rounded-xl p-6 border border-surface hover:border-accent-teal transition-all group">
              <summary className="font-bold text-text cursor-pointer list-none flex justify-between items-center">
                Do you store my files?
                <span className="text-accent-teal group-open:rotate-180 transition-transform text-xl">+</span>
              </summary>
              <p className="mt-4 text-text-muted leading-relaxed">
                No. Files are analyzed instantly and automatically deleted immediately after processing. We never store or log your uploads.
              </p>
            </details>

            <details className="bg-bg rounded-xl p-6 border border-surface hover:border-accent-teal transition-all group">
              <summary className="font-bold text-text cursor-pointer list-none flex justify-between items-center">
                What file types are supported?
                <span className="text-accent-teal group-open:rotate-180 transition-transform text-xl">+</span>
              </summary>
              <p className="mt-4 text-text-muted leading-relaxed">
                PNG, JPG/JPEG, and PDF files up to 10MB are supported. For best results, use high-resolution images (at least 2400×3000 pixels for 8×10 prints).
              </p>
            </details>

            <details className="bg-bg rounded-xl p-6 border border-surface hover:border-accent-teal transition-all group">
              <summary className="font-bold text-text cursor-pointer list-none flex justify-between items-center">
                How accurate is the score?
                <span className="text-accent-teal group-open:rotate-180 transition-transform text-xl">+</span>
              </summary>
              <p className="mt-4 text-text-muted leading-relaxed">
                The score is guidance based on resolution, color mode, layout, and format. It&apos;s a helpful indicator, but always confirm with your print provider for final specs.
              </p>
            </details>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 text-center" style={{ background: 'linear-gradient(180deg, #0F1115 0%, #1A1E24 50%, #0F1115 100%)' }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-bold text-accent-teal mb-4" style={{ textShadow: '0 0 40px rgba(0, 209, 199, 0.3)' }}>
            Print With Confidence.
          </h2>
          <p className="text-xl text-text-muted mb-10">
            Know your print score before you send it to the printer.
          </p>
          <div className="flex justify-center">
            <a
              href="#upload"
              className="px-8 py-4 border-2 border-accent-teal text-accent-teal font-semibold rounded-lg hover:bg-accent-teal/10 transition-all"
              style={{ boxShadow: '0 0 20px rgba(0, 209, 199, 0.2)' }}
            >
              Check My PrintScore
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-surface bg-bg">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-xl font-bold text-accent-teal mb-4" style={{ textShadow: '0 0 20px rgba(0, 209, 199, 0.3)' }}>
            PrintScore™
          </div>
          <p className="text-text-muted/60 text-sm mb-6">
            Files are analyzed and automatically deleted.
          </p>
          <p className="text-text-muted/40 text-xs">
            Powered by <a href="https://innergclaw.github.io/innerg-intelligence-landing/" target="_blank" rel="noopener noreferrer" className="hover:text-accent-teal transition-colors">InnerG Intelligence</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
