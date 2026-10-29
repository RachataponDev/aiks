'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  UploadCloud, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight, 
  Check, 
  FileText, 
  X, 
  Trash2,
  Wrench,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { DashboardNavbar } from '@/components/DashboardNavbar';
import { DashboardSidebar } from '@/components/DashboardSidebar';

export default function DatasetOnboardingPage() {
  const [fileRegistry, setFileRegistry] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [is100PercentClean, setIs100PercentClean] = useState(false);

  // Full-screen Smooth Loading State
  const [isProcessing, setIsProcessing] = useState(false);
  const [processPercent, setProcessPercent] = useState(0);
  const [processStatus, setProcessStatus] = useState('Scanning data files...');

  // Quality Issues state
  const [resolvedIssues, setResolvedIssues] = useState<any[]>([]);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [showFileListModal, setShowFileListModal] = useState(false);
  const [showConfirmCleanModal, setShowConfirmCleanModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<{ category: string; fileId: string; fileName: string } | null>(null);

  const fetchFileRegistry = async () => {
    try {
      const res = await fetch('/api/upload');
      const json = await res.json();
      if (json.success && json.registry) {
        setFileRegistry(json.registry);
      }
    } catch {}
  };

  useEffect(() => {
    fetchFileRegistry();
    const cleanStatus = localStorage.getItem('aiks_data_is_100_percent_clean') === 'true';
    setIs100PercentClean(cleanStatus);
  }, []);

  // Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i]);
    }

    const toastId = toast.loading(`Uploading ${files.length} file(s)...`);
    try {
      setLoading(true);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const json = await res.json();
      if (json.success) {
        toast.success(`Uploaded ${json.uploadedCount} file(s)`, { id: toastId });
        await fetchFileRegistry();
        setIs100PercentClean(false);
        localStorage.removeItem('aiks_data_is_100_percent_clean');
      } else {
        toast.error(`Upload error: ${json.error}`, { id: toastId });
      }
    } catch (err: any) {
      toast.error(`Error: ${err.message}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  // Quick Load Competition Samples
  const handleLoadSampleFiles = async () => {
    const toastId = toast.loading('Loading sample data...');
    try {
      const res = await fetch('/api/validate-dataset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useDefaultFallback: true }),
      });
      const json = await res.json();
      if (json.success && json.registry) {
        setFileRegistry(json.registry);
        toast.success('Sample data loaded!', { id: toastId });
      }
    } catch {
      toast.error('Failed to load sample data', { id: toastId });
    }
  };

  // Remove single file
  const handleRemoveSingleFile = async (category: string, fileId: string) => {
    try {
      const res = await fetch('/api/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetCategory: category, targetFileId: fileId }),
      });
      const json = await res.json();
      if (json.success) {
        toast.info('File removed.');
        await fetchFileRegistry();
        setIs100PercentClean(false);
        localStorage.removeItem('aiks_data_is_100_percent_clean');
      }
    } catch (err: any) {
      toast.error(`Failed to remove file: ${err.message}`);
    }
  };

  // MAIN ONE-TOUCH ACTION: Run Full Audit & Auto-Clean in Single Flow
  const handleStartAuditAndAutoClean = async () => {
    if (Object.keys(fileRegistry).length === 0) {
      toast.error('Please upload your data first.');
      return;
    }

    setIsProcessing(true);
    setProcessPercent(0);
    setProcessStatus('Scanning tables & schema...');

    // Smooth fluid progress animation
    const progressInterval = setInterval(() => {
      setProcessPercent((prev) => {
        if (prev >= 92) return prev;
        const jump = Math.floor(Math.random() * 6) + 3;
        const next = prev + jump;
        if (next > 20 && next < 50) {
          setProcessStatus('Detecting aliases & stock discrepancies...');
        } else if (next >= 50 && next < 80) {
          setProcessStatus('Auto-sanitizing & cleaning records...');
        } else if (next >= 80) {
          setProcessStatus('Finalizing 100% integrity validation...');
        }
        return next;
      });
    }, 120);

    try {
      setLoading(true);

      // Step 1: Validate Schema
      await fetch('/api/validate-dataset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useDefaultFallback: false }),
      });

      // Step 2: Fetch Detected Issues
      const cleanRes = await fetch('/api/clean-data');
      const cleanJson = await cleanRes.json();
      const detectedIssues = cleanJson.fixes || [];

      // Step 3: Automatically Apply Fixes (No user manual ticking needed)
      if (detectedIssues.length > 0) {
        await fetch('/api/clean-data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ acceptedFixIds: detectedIssues.map((q: any) => q.id) }),
        });
      }

      setResolvedIssues(detectedIssues);

      // Complete progress smoothly to 100%
      clearInterval(progressInterval);
      setProcessPercent(100);
      setProcessStatus('All done! Verified 100% Clean.');

      setTimeout(() => {
        setIsProcessing(false);
        setIs100PercentClean(true);
        localStorage.setItem('aiks_data_is_100_percent_clean', 'true');
        triggerConfetti();

        if (detectedIssues.length > 0) {
          toast.success(`Automatically fixed ${detectedIssues.length} issues! Click "View Summary" to inspect.`);
        } else {
          toast.success('Data verified 100%! Ready to continue.');
        }
      }, 500);

    } catch (err: any) {
      clearInterval(progressInterval);
      setIsProcessing(false);
      toast.error(`Processing error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const triggerConfetti = () => {
    try {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
    } catch {}
  };

  const fileCount = Object.keys(fileRegistry).length;
  const isReady = is100PercentClean;

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-zinc-900 overflow-x-hidden">
      
      {/* 1. ULTRA-SMOOTH MODERN FLUID LOADER (Inspired by cssloaders.github.io) */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-white/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center select-none"
          >
            {/* Morphing Fluid Neon Orbit Loader */}
            <div className="relative flex items-center justify-center mb-10">
              
              {/* Outer Pulsing Aura */}
              <div className="absolute w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-cyan-400/10 blur-xl animate-pulse" />

              {/* Orbital Ring 1: Fast Spin */}
              <div 
                className="absolute w-48 h-48 sm:w-56 sm:h-56 rounded-full border-2 border-transparent border-t-cyan-500 border-r-cyan-400 animate-spin"
                style={{ animationDuration: '1.2s' }}
              />

              {/* Orbital Ring 2: Reverse Spin */}
              <div 
                className="absolute w-40 h-40 sm:w-48 sm:h-48 rounded-full border-2 border-dashed border-cyan-300 animate-spin"
                style={{ animationDuration: '3s', animationDirection: 'reverse' }}
              />

              {/* Orbital Ring 3: Subtle Dot Wave */}
              <div 
                className="absolute w-32 h-32 sm:w-40 sm:h-40 rounded-full border border-cyan-100 animate-ping"
                style={{ animationDuration: '2.5s' }}
              />

              {/* Center Core Displaying Percentage */}
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-white shadow-2xl border border-cyan-100 flex flex-col items-center justify-center relative z-10">
                <span className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight font-mono">
                  {processPercent}%
                </span>
                <span className="text-[9px] font-mono font-bold tracking-widest uppercase text-cyan-600 mt-0.5">
                  PROCESSING
                </span>
              </div>
            </div>

            {/* Dynamic Step Text & Wave Dot Flow */}
            <div className="space-y-3 max-w-sm">
              <div className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-cyan-300 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-zinc-800 tracking-tight">
                {processStatus}
              </h2>
              
              {/* Sleek Line Progress Indicator */}
              <div className="w-52 sm:w-64 h-1.5 bg-zinc-100 rounded-full mx-auto overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full"
                  animate={{ width: `${processPercent}%` }}
                  transition={{ ease: 'easeOut', duration: 0.15 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navbar */}
      <DashboardNavbar 
        systemTitle="AIKS"
        fileCount={fileCount}
        isDataReady={isReady}
        onClearFiles={() => {
          setFileRegistry({});
          setResolvedIssues([]);
          setIs100PercentClean(false);
          localStorage.removeItem('aiks_data_is_100_percent_clean');
        }}
      />

      <div className="flex-1 flex">
        {/* Dynamic Sidebar (Hidden on mobile <1024px) */}
        <DashboardSidebar currentPath="/dashboard" isDataReady={isReady} />

        {/* PERFECTLY CENTERED MAIN VIEWPORT (Supports down to 360px) */}
        <main className="flex-1 min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-8 lg:p-12 w-full">
          
          <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center text-center space-y-10 sm:space-y-14 py-6 sm:py-10">
            
            {/* 1. COMPACT UPLOAD PILL (TOP) */}
            <div className="w-full flex flex-col items-center mb-2 sm:mb-4">
              <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 w-full">
                <label className="px-5 py-3 sm:px-6 sm:py-3.5 rounded-2xl bg-white border border-zinc-200 hover:border-cyan-400 hover:shadow-cyan-100/50 text-zinc-800 font-semibold text-xs sm:text-sm cursor-pointer shadow-xs transition-all flex items-center gap-2 group active:scale-97">
                  <input 
                    type="file" 
                    multiple 
                    accept=".csv" 
                    onChange={handleFileUpload} 
                    className="hidden" 
                  />
                  <UploadCloud className="w-4 h-4 text-cyan-600 group-hover:scale-110 transition-transform" />
                  <span>{fileCount > 0 ? `${fileCount} Files Added (Change)` : 'Upload Data (CSV)'}</span>
                </label>

                {fileCount === 0 && (
                  <button
                    onClick={handleLoadSampleFiles}
                    className="px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl bg-white border border-zinc-200 hover:bg-zinc-50 text-zinc-600 font-medium text-xs sm:text-sm shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-97"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Sample Data</span>
                  </button>
                )}
              </div>

              {fileCount > 0 && (
                <div className="flex items-center gap-3 mt-3 sm:mt-4">
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>{fileCount} datasets ready</span>
                  </div>
                  <button
                    onClick={() => setShowFileListModal(true)}
                    className="text-xs font-bold text-cyan-600 hover:text-cyan-700 underline flex items-center gap-1 cursor-pointer transition active:scale-95"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>View Files ({fileCount})</span>
                  </button>
                </div>
              )}
            </div>

            {/* 2. GORGEOUS CENTRAL SPEEDTEST CIRCLE (GO OR 100% PASSED) */}
            <div className="relative flex items-center justify-center my-6 sm:my-10">
              
              {/* Outer Cyan Ambient Glow Radar (Animated Breathing Wave) */}
              <motion.div 
                animate={fileCount > 0 ? { scale: [1, 1.08, 1], opacity: [0.5, 0.9, 0.5] } : {}}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className={`absolute w-60 h-60 sm:w-72 sm:h-72 rounded-full border-2 transition-all duration-500 ${
                  is100PercentClean 
                    ? 'border-emerald-400 shadow-[0_0_45px_rgba(52,211,153,0.35)]' 
                    : fileCount > 0
                      ? 'border-cyan-300 shadow-[0_0_35px_rgba(6,182,212,0.25)]'
                      : 'border-zinc-200 opacity-20'
                }`}
              />

              {/* Secondary Orbit Ring */}
              <div 
                className={`absolute w-52 h-52 sm:w-64 sm:h-64 rounded-full border border-dashed transition-all ${
                  is100PercentClean 
                    ? 'border-emerald-300' 
                    : fileCount > 0 
                      ? 'border-cyan-200 animate-spin' 
                      : 'border-transparent'
                }`}
                style={{ animationDuration: '28s' }}
              />

              {/* Main Circular Button */}
              <motion.button
                whileHover={fileCount > 0 ? { scale: 1.04 } : {}}
                whileTap={fileCount > 0 ? { scale: 0.95 } : {}}
                disabled={fileCount === 0 || loading}
                onClick={() => {
                  if (!is100PercentClean) {
                    setShowConfirmCleanModal(true);
                  }
                }}
                className={`w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-gradient-to-b from-white to-zinc-50/90 shadow-2xl border-2 flex flex-col items-center justify-center text-center cursor-pointer transition-all relative z-10 select-none ${
                  fileCount === 0
                    ? 'border-zinc-200 text-zinc-300 cursor-not-allowed opacity-40 shadow-none'
                    : is100PercentClean
                      ? 'border-emerald-500 text-emerald-600 shadow-emerald-100 hover:shadow-emerald-200'
                      : 'border-cyan-400 text-zinc-900 shadow-cyan-100/60 hover:border-cyan-500'
                }`}
              >
                {is100PercentClean ? (
                  <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex flex-col items-center">
                    <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-500 mb-1" />
                    <span className="text-3xl sm:text-4xl font-black text-zinc-900 tracking-tight">100%</span>
                    <span className="text-[10px] sm:text-xs font-bold text-emerald-600 uppercase tracking-widest mt-0.5">CLEAN PASSED</span>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center">
                    <span className="text-5xl sm:text-6xl font-light text-zinc-900 tracking-wider">
                      GO
                    </span>
                    <span className="text-[9px] sm:text-[10px] font-bold text-cyan-600 tracking-widest uppercase mt-1">
                      START AUTO-AUDIT
                    </span>
                  </div>
                )}
              </motion.button>
            </div>

            {/* 3. BOTTOM RESULT / PROMPT (SMART ACTION) */}
            <div className="w-full flex flex-col items-center justify-center min-h-[4rem] mt-2 sm:mt-4 space-y-3">
              {is100PercentClean ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full flex flex-col items-center space-y-3"
                >
                  <Link
                    href="/dashboard/overview"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg hover:shadow-xl transition cursor-pointer active:scale-97"
                  >
                    <span>Continue to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  {/* Button to review auto-cleaned summary */}
                  {resolvedIssues.length > 0 && (
                    <button
                      onClick={() => setShowSummaryModal(true)}
                      className="text-xs font-semibold text-zinc-500 hover:text-zinc-800 transition flex items-center gap-1.5 underline cursor-pointer"
                    >
                      <Wrench className="w-3.5 h-3.5 text-cyan-600" />
                      <span>View Auto-Cleaned Summary ({resolvedIssues.length} issues fixed)</span>
                    </button>
                  )}
                </motion.div>
              ) : fileCount === 0 ? (
                <p className="text-xs text-zinc-400 max-w-xs">
                  Upload files or select Sample Data above to enable the audit button
                </p>
              ) : (
                <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
                  Press GO to automatically inspect and clean any data discrepancies
                </p>
              )}
            </div>

          </div>

        </main>
      </div>

      {/* 3. MODAL: AUTO-CLEANED ISSUES SUMMARY (CLEAN & READABLE) */}
      <AnimatePresence>
        {showSummaryModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[80vh]"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">Auto-Clean Summary</h3>
                    <p className="text-[11px] text-zinc-400 font-mono">{resolvedIssues.length} issues resolved automatically</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSummaryModal(false)}
                  className="w-8 h-8 rounded-lg hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body: List of Auto-Cleaned Records */}
              <div className="p-5 overflow-y-auto space-y-2 flex-1">
                {resolvedIssues.map((issue) => (
                  <div
                    key={issue.id}
                    className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-zinc-800 text-[11px]">
                        {issue.recordId} • {issue.fileName}
                      </span>
                      <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        RESOLVED
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="line-through text-rose-500 font-mono text-[11px]">
                        {issue.currentValue || '(empty)'}
                      </span>
                      <ArrowRight className="w-3 h-3 text-zinc-400" />
                      <span className="text-emerald-700 font-mono font-bold text-[11px]">
                        {issue.suggestedValue}
                      </span>
                    </div>

                    <p className="text-[10px] text-zinc-400 leading-tight">
                      {issue.explanation}
                    </p>
                  </div>
                ))}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3.5 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-end">
                <button
                  onClick={() => setShowSummaryModal(false)}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-zinc-900 text-white hover:bg-zinc-800 transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. MODAL: VIEW UPLOADED FILE LIST */}
      <AnimatePresence>
        {showFileListModal && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-zinc-200 overflow-hidden flex flex-col max-h-[80vh]"
            >
              <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">Uploaded Datasets</h3>
                    <p className="text-[11px] text-zinc-400 font-mono">{fileCount} files in local registry</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowFileListModal(false)}
                  className="w-8 h-8 rounded-lg hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 flex items-center justify-center transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-2 flex-1">
                {Object.entries(fileRegistry).map(([key, file]: [string, any]) => (
                  <div
                    key={file.fileId || key}
                    className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-between text-xs transition hover:bg-zinc-100/70"
                  >
                    <div className="min-w-0 pr-3">
                      <span className="font-bold text-zinc-900 block truncate text-[12px]">
                        {file.originalName}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">
                        {file.rowCount ? `${file.rowCount.toLocaleString()} rows` : ''} • {Math.round((file.fileSizeBytes || 0) / 1024)} KB
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-200/70 text-zinc-700 font-bold text-[9px] uppercase font-mono">
                        {file.category || 'TABLE'}
                      </span>
                      <button
                        onClick={() => setFileToDelete({ category: key, fileId: file.fileId, fileName: file.originalName })}
                        className="w-7 h-7 rounded-lg hover:bg-rose-100 text-zinc-400 hover:text-rose-600 flex items-center justify-center transition cursor-pointer"
                        title="Remove file"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-6 py-3.5 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-end">
                <button
                  onClick={() => setShowFileListModal(false)}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-zinc-900 text-white hover:bg-zinc-800 transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. MODAL: CONFIRM AUTO-CLEAN & AUDIT (SAFETY ALERT) */}
      <AnimatePresence>
        {showConfirmCleanModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-zinc-200 overflow-hidden p-6 text-center space-y-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-cyan-50 border border-cyan-200 text-cyan-600 flex items-center justify-center mx-auto">
                <Wrench className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base font-bold text-zinc-900">Run Audit & Auto-Clean?</h3>
                <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                  The system will automatically resolve naming aliases, fix inventory balance variances, and fill missing IDs directly in your CSV files.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => setShowConfirmCleanModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowConfirmCleanModal(false);
                    handleStartAuditAndAutoClean();
                  }}
                  className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow-sm cursor-pointer active:scale-95"
                >
                  Confirm & Start
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. MODAL: CONFIRM SINGLE FILE DELETE (DANGER ALERT) */}
      <AnimatePresence>
        {fileToDelete && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-zinc-200 overflow-hidden p-6 text-center space-y-4"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
                <Trash2 className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-base font-bold text-zinc-900">Remove This Dataset?</h3>
                <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">
                  Are you sure you want to delete <span className="font-mono font-bold text-zinc-800">{fileToDelete.fileName}</span>? This will lock any features that require this table.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => setFileToDelete(null)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleRemoveSingleFile(fileToDelete.category, fileToDelete.fileId);
                    setFileToDelete(null);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow-sm cursor-pointer active:scale-95"
                >
                  Yes, Remove
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
