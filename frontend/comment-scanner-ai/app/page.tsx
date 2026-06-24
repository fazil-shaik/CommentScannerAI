"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  FileSpreadsheet,
  MessageSquare,
  ShieldAlert,
  BarChart3,
  Brain,
  ChevronRight,
  TrendingUp,
  Cpu,
  Terminal,
  Activity,
  Play,
  Layers,
  CheckCircle,
  FileText
} from "lucide-react";

const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
  </svg>
);


interface ScannerPreset {
  name: string;
  source: string;
  comment: string;
  sentiment: "positive" | "negative" | "neutral";
  sentimentScore: number;
  topic: string;
  toxicity: number;
  emotion: string;
  summary: string;
}

const PRESETS: ScannerPreset[] = [
  {
    name: "YouTube Feed",
    source: "youtube",
    comment: "This tool is amazing! The database migrations are so fast now. Can you please add support for direct Postgres connections? That would save our team so much time.",
    sentiment: "positive",
    sentimentScore: 0.92,
    topic: "Feature Request",
    toxicity: 0.02,
    emotion: "Joy",
    summary: "Satisfied with database migration speed; requests direct PostgreSQL support."
  },

  {
    name: "Abusive Forum Node",
    source: "manual",
    comment: "Your software is complete garbage and anyone using it is an idiot. Go back to school and learn how to code, this is absolutely useless trash.",
    sentiment: "negative",
    sentimentScore: 0.97,
    topic: "Toxicity / Filtered",
    toxicity: 0.96,
    emotion: "Hostility",
    summary: "Abusive user comment targeting platform quality; flagged for automated moderation."
  }
];

export default function Home() {
  const [activePreset, setActivePreset] = useState<number>(0);
  const [customText, setCustomText] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [scanOutput, setScanOutput] = useState<ScannerPreset | null>(PRESETS[0]);

  const handleCustomScan = () => {
    if (!customText.trim()) return;
    setIsScanning(true);
    setProgress(0);
    setScanOutput(null);
  };

  const handlePresetSelect = (idx: number) => {
    if (isScanning) return;
    setActivePreset(idx);
    setCustomText("");
    setIsScanning(true);
    setProgress(0);
    setScanOutput(null);
  };

  // Simulate scanning progress
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isScanning) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsScanning(false);
            if (customText.trim()) {
              // Parse custom text properties dynamically
              const text = customText.toLowerCase();
              let sentiment: "positive" | "negative" | "neutral" = "neutral";
              let sentimentScore = 0.5;
              let topic = "General Support";
              let toxicity = 0.05;
              let emotion = "Neutral";
              let summary = "User submitted feedback for pipeline parsing.";

              if (text.includes("love") || text.includes("great") || text.includes("awesome") || text.includes("perfect")) {
                sentiment = "positive";
                sentimentScore = 0.85;
                emotion = "Satisfaction";
              } else if (text.includes("broken") || text.includes("error") || text.includes("fail") || text.includes("slow")) {
                sentiment = "negative";
                sentimentScore = 0.80;
                topic = "Bug Report";
                emotion = "Concern";
              }

              if (text.includes("add") || text.includes("feature") || text.includes("support")) {
                topic = "Feature Request";
              }

              if (text.includes("pricing") || text.includes("cost") || text.includes("pay")) {
                topic = "Pricing Query";
              }

              if (text.includes("trash") || text.includes("hate") || text.includes("idiot") || text.includes("garbage")) {
                toxicity = 0.88;
                sentiment = "negative";
                topic = "Toxicity Filter";
                emotion = "Aggression";
                summary = "Flagged abusive language detected in community pipeline.";
              }

              setScanOutput({
                name: "Custom Stream",
                source: "manual",
                comment: customText,
                sentiment,
                sentimentScore,
                topic,
                toxicity,
                emotion,
                summary
              });
            } else {
              setScanOutput(PRESETS[activePreset]);
            }
            return 100;
          }
          return prev + 8;
        });
      }, 80);
    }
    return () => clearInterval(interval);
  }, [isScanning, customText, activePreset]);

  return (
    <div className="relative min-h-screen bg-background overflow-hidden flex flex-col justify-between select-none">

      {/* Decorative Matrix Grid Backing */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Dynamic Radar Sweeper Background */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[150px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[150px] pointer-events-none animate-pulse-slow" />

      {/* Navigation Header */}
      <header className="relative w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-10 border-b border-border/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg border border-primary/30 bg-primary/10 flex items-center justify-center">
            <Activity className="w-5 h-5 text-primary" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold tracking-widest text-white font-mono uppercase">
              COMMENTSCANNER <span className="text-primary font-bold">//</span> AI
            </span>
            <span className="text-[9px] font-semibold text-accent font-mono tracking-widest uppercase">
              FEEDBACK TELEMETRY MODULE
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-8 text-xs font-mono font-medium text-muted-foreground uppercase tracking-wider">
          <a href="#console" className="hover:text-white transition">Live Console</a>
          <a href="#calibrations" className="hover:text-white transition">Telemetry Specs</a>
          <a href="#channels" className="hover:text-white transition">Ingestion Nodes</a>
        </div>

        <Link
          href="/dashboard"
          className="relative inline-flex items-center justify-center px-4 py-2 border border-primary/40 bg-primary/10 text-xs font-mono font-bold text-primary hover:bg-primary hover:text-black transition-all duration-300 rounded shadow-md active:scale-95"
        >
          INITIALIZE CONTROL
          <ArrowRight className="ml-2 w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Hero Section */}
      <main className="relative flex-grow flex flex-col justify-center max-w-7xl w-full mx-auto px-6 py-10 md:py-20 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Left: The Thesis */}
          <div className="lg:col-span-6 flex flex-col items-start text-left space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-accent/20 bg-accent/5 text-[10px] font-mono tracking-wider font-semibold text-accent uppercase">
              <span className="led-indicator led-teal" />
              <span>ACTIVE INGESTION STREAM: 60Hz</span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl sm:text-5xl md:text-[54px] leading-[1.05] font-extrabold text-white tracking-tight font-display">
                AGGREGATE THE NOISE. <br />
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  EXTRACT TELEMETRY.
                </span>
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground max-w-xl leading-relaxed font-sans">
                Stop reading thousands of scattered forum logs. CommentScanner AI processes raw, unstructured text streams from YouTube and CSV files, converting public chaos into clear, structured product decisions.
              </p>
            </div>

            {/* Quick Metrics Dashboard */}
            <div className="grid grid-cols-3 gap-4 w-full pt-2 border-t border-border/30">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">LATENCY</span>
                <p className="text-xl font-bold font-mono telemetry-val text-accent">&lt; 140ms</p>
              </div>
              <div className="space-y-1 border-l border-border/30 pl-4">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">CLASSIFIERS</span>
                <p className="text-xl font-bold font-mono telemetry-val text-primary">5-STAGE</p>
              </div>
              <div className="space-y-1 border-l border-border/30 pl-4">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">INGESTION</span>
                <p className="text-xl font-bold font-mono telemetry-val text-white">AUTO-POLL</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-4 w-full">
              <Link
                href="/dashboard"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center px-6 py-3.5 bg-primary text-white font-mono font-bold text-xs hover:bg-primary/90 transition active:scale-95 rounded"
              >
                START SCANNING TELEMETRY
                <ChevronRight className="ml-2 w-4 h-4" />
              </Link>
              <a
                href="#calibrations"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center px-6 py-3.5 border border-border bg-card hover:bg-card/85 text-white font-mono text-xs transition rounded"
              >
                VIEW DIAGNOSTICS
              </a>
            </div>
          </div>

          {/* Right: The Signature Laser Scanner Console */}
          <div id="console" className="lg:col-span-6 relative w-full max-w-lg mx-auto">
            <div className="instrument-card instrument-card-glow rounded p-5 flex flex-col justify-between min-h-[460px] crt-grid">

              {/* Console Header */}
              <div className="flex items-center justify-between border-b border-border/40 pb-3">
                <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                  <span className={`w-2 h-2 rounded-full ${isScanning ? "bg-primary animate-ping" : "bg-accent shadow-accent shadow-sm"}`} />
                  <span>FEEDBACK ANALYZER CONSOLE v4.2</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full led-teal" />
                  <span className="w-1.5 h-1.5 rounded-full led-copper" />
                  <span className="w-1.5 h-1.5 rounded-full led-neutral" />
                </div>
              </div>

              {/* Feed Presets Selector */}
              <div className="grid grid-cols-3 gap-2 my-4">
                {PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handlePresetSelect(idx)}
                    disabled={isScanning}
                    className={`px-2 py-2 border font-mono text-[9px] uppercase tracking-wider rounded transition cursor-pointer text-center ${activePreset === idx && !customText
                        ? "bg-primary/10 border-primary text-primary font-semibold"
                        : "bg-background/40 border-border text-muted-foreground hover:text-white hover:border-muted-foreground/30"
                      }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>

              {/* Console Content Screen */}
              <div className="relative flex-grow inset-chassis rounded p-4 font-mono text-xs flex flex-col justify-between min-h-[220px] overflow-hidden">

                {/* Laser Sweep Line */}
                {isScanning && (
                  <div
                    className="absolute left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent animate-scan-sweep pointer-events-none"
                    style={{ zIndex: 10 }}
                  />
                )}

                <div className="space-y-3 flex-grow z-10">
                  <div className="flex items-center justify-between text-[9px] uppercase text-muted-foreground border-b border-white/5 pb-1">
                    <span>SOURCE FEED: {customText ? "CUSTOM_SANDBOX" : PRESETS[activePreset].name.toUpperCase().replace(" ", "_")}</span>
                    <span>LENGTH: {customText ? customText.length : PRESETS[activePreset].comment.length} Chars</span>
                  </div>

                  {/* Dynamic Stream Text Display */}
                  <div className="text-neutral-300 leading-relaxed text-[11px] font-mono min-h-[90px] whitespace-pre-wrap">
                    {isScanning ? (
                      <span className="text-accent">Analyzing text buffers... [Scanning {Math.round(progress)}%]</span>
                    ) : customText ? (
                      customText
                    ) : (
                      PRESETS[activePreset].comment
                    )}
                  </div>
                </div>

                {/* Real-time Meter Telemetry */}
                <div className="mt-4 pt-3 border-t border-white/5 grid grid-cols-2 gap-4 text-left font-mono z-10">

                  {/* Sentiment Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] uppercase text-muted-foreground">
                      <span>SENTIMENT DETECTOR</span>
                      <span className={
                        scanOutput?.sentiment === "positive" ? "text-accent" :
                          scanOutput?.sentiment === "negative" ? "text-rose-400" : "text-amber-400"
                      }>
                        {scanOutput ? `${Math.round(scanOutput.sentimentScore * 100)}% ${scanOutput.sentiment.toUpperCase()}` : "--"}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-background rounded-full overflow-hidden flex">
                      {scanOutput ? (
                        <div
                          className={`h-full transition-all duration-500 ${scanOutput.sentiment === "positive" ? "bg-accent" :
                              scanOutput.sentiment === "negative" ? "bg-rose-500" : "bg-amber-500"
                            }`}
                          style={{ width: `${scanOutput.sentimentScore * 100}%` }}
                        />
                      ) : (
                        <div className="h-full bg-border w-0" />
                      )}
                    </div>
                  </div>

                  {/* Toxicity Meter */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] uppercase text-muted-foreground">
                      <span>TOXICITY FACTOR</span>
                      <span className={scanOutput && scanOutput.toxicity > 0.4 ? "text-rose-400 font-bold" : "text-accent"}>
                        {scanOutput ? `${Math.round(scanOutput.toxicity * 100)}%` : "--"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="flex-grow h-1.5 bg-background rounded-full overflow-hidden">
                        {scanOutput ? (
                          <div
                            className={`h-full transition-all duration-500 ${scanOutput.toxicity > 0.4 ? "bg-rose-500" : "bg-accent"}`}
                            style={{ width: `${scanOutput.toxicity * 100}%` }}
                          />
                        ) : (
                          <div className="h-full bg-border w-0" />
                        )}
                      </div>
                      <span className="text-[9px] font-bold text-neutral-400">
                        {scanOutput ? (scanOutput.toxicity > 0.4 ? "FLAG" : "SAFE") : "--"}
                      </span>
                    </div>
                  </div>

                  {/* Emotion & Category Tag */}
                  <div className="col-span-2 grid grid-cols-2 gap-2 text-[10px]">
                    <div className="p-2 rounded bg-background/50 border border-border">
                      <span className="text-[8px] uppercase text-muted-foreground block">DETECTED AFFECT</span>
                      <span className="text-white font-semibold uppercase font-mono">{scanOutput ? scanOutput.emotion : "--"}</span>
                    </div>
                    <div className="p-2 rounded bg-background/50 border border-border">
                      <span className="text-[8px] uppercase text-muted-foreground block">PIPELINE ROUTE</span>
                      <span className="text-primary font-semibold uppercase font-mono">{scanOutput ? scanOutput.topic : "--"}</span>
                    </div>
                  </div>

                  {/* Executive Extraction Compiler */}
                  <div className="col-span-2 p-2.5 rounded border border-primary/30 bg-primary/10 space-y-0.5">
                    <span className="text-[8px] uppercase text-primary font-bold tracking-wider block">COMPILER SUMMARY SUMMARY_EXTRACT.LOG</span>
                    <p className="text-[10px] text-neutral-200 italic leading-snug">
                      {scanOutput ? `"${scanOutput.summary}"` : "Waiting for scan process to complete..."}
                    </p>
                  </div>
                </div>

              </div>

              {/* Custom Ingestion Input Sandbox */}
              <div className="mt-4 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Feed custom string to the scanner sandbox..."
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  className="flex-grow px-3 py-2 bg-background border border-border rounded font-mono text-[10px] text-white outline-none focus:border-primary/50 transition"
                  disabled={isScanning}
                />
                <button
                  type="button"
                  onClick={handleCustomScan}
                  disabled={isScanning || !customText.trim()}
                  className="px-3.5 py-2 border border-accent bg-accent/15 text-accent hover:bg-accent hover:text-black font-mono font-bold text-[9px] uppercase tracking-wider rounded transition disabled:opacity-50 active:scale-95 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 inline mr-1" />
                  SCAN
                </button>
              </div>

            </div>
          </div>

        </div>
      </main>

      {/* Telemetry Calibrations Section */}
      <section id="calibrations" className="relative w-full max-w-7xl mx-auto px-6 py-24 border-t border-border/40">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start mb-16">
          <div className="space-y-3 md:col-span-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 border border-primary/20 bg-primary/5 rounded font-mono text-[9px] font-bold text-primary uppercase tracking-widest">
              SYSTEM SPECS
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">ENGINE CALIBRATIONS</h2>
            <p className="text-xs text-muted-foreground font-mono leading-relaxed uppercase tracking-wider">
              A detailed overview of our high-precision deep learning classifier nodes.
            </p>
          </div>
          <div className="md:col-span-2 text-sm text-muted-foreground leading-relaxed font-sans pt-4 space-y-4">
            <p>
              CommentScanner AI operates on local inference architectures that automatically stream textual parameters into mathematical tensors. Every incoming log is processed symmetrically without templates, guaranteeing clean routing.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Card 1 */}
          <div className="instrument-card rounded p-6 hover:border-accent/40 transition-all duration-300 group">
            <div className="w-10 h-10 border border-accent/20 bg-accent/5 flex items-center justify-center text-accent rounded mb-5">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight font-display mb-2 group-hover:text-accent transition">SENTIMENT & AFFECT</h3>
            <p className="text-xs text-muted-foreground leading-relaxed font-mono uppercase tracking-wide">
              Examines language vectors to split positive, negative, and neutral bias. Flags joy, anger, disappointment, and concern confidence indexes.
            </p>
          </div>

          {/* Card 2 */}
          <div className="instrument-card rounded p-6 hover:border-primary/40 transition-all duration-300 group">
            <div className="w-10 h-10 border border-primary/20 bg-primary/5 flex items-center justify-center text-primary rounded mb-5">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight font-display mb-2 group-hover:text-primary transition">ABUSE SHIELDING</h3>
            <p className="text-xs text-muted-foreground leading-relaxed font-mono uppercase tracking-wide">
              Automatically filters out toxic flame wars, generic insults, and hate threats, protecting developer sanity and prioritizing clean feedback logs.
            </p>
          </div>

          {/* Card 3 */}
          <div className="instrument-card rounded p-6 hover:border-accent/40 transition-all duration-300 group">
            <div className="w-10 h-10 border border-accent/20 bg-accent/5 flex items-center justify-center text-accent rounded mb-5">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight font-display mb-2 group-hover:text-accent transition">TOPIC CLASSIFIERS</h3>
            <p className="text-xs text-muted-foreground leading-relaxed font-mono uppercase tracking-wide">
              Routes incoming comments into designated telemetry buckets: Bug Reports, Feature Requests, Pricing, Performance, and Support inquiries.
            </p>
          </div>

          {/* Card 4 */}
          <div className="instrument-card rounded p-6 hover:border-primary/40 transition-all duration-300 group">
            <div className="w-10 h-10 border border-primary/20 bg-primary/5 flex items-center justify-center text-primary rounded mb-5">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight font-display mb-2 group-hover:text-primary transition">NEURAL QUERY (RAG)</h3>
            <p className="text-xs text-muted-foreground leading-relaxed font-mono uppercase tracking-wide">
              Enables semantic questioning of feedback vaults. Query thousands of records simultaneously like a conversational relational database.
            </p>
          </div>

          {/* Card 5 */}
          <div className="instrument-card rounded p-6 hover:border-accent/40 transition-all duration-300 group">
            <div className="w-10 h-10 border border-accent/20 bg-accent/5 flex items-center justify-center text-accent rounded mb-5">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight font-display mb-2 group-hover:text-accent transition">COMPOSER GENERATOR</h3>
            <p className="text-xs text-muted-foreground leading-relaxed font-mono uppercase tracking-wide">
              Bypasses long reading blocks. Produces structural summaries and roadmap bullet points mapped directly from aggregated comment sets.
            </p>
          </div>

          {/* Card 6 */}
          <div className="instrument-card rounded p-6 hover:border-primary/40 transition-all duration-300 group">
            <div className="w-10 h-10 border border-primary/20 bg-primary/5 flex items-center justify-center text-primary rounded mb-5">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white tracking-tight font-display mb-2 group-hover:text-primary transition">INGESTION NODES</h3>
            <p className="text-xs text-muted-foreground leading-relaxed font-mono uppercase tracking-wide">
              Scrapes YouTube API responses, parses CSV datasets, or handles manual pastes in seconds.
            </p>
          </div>

        </div>
      </section>

      {/* Ingestion Channels Badges */}
      <section id="channels" className="w-full max-w-7xl mx-auto px-6 py-12 border-t border-border/40 text-center font-mono">
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-6">INTEGRATED TELEMETRY PIPELINES</p>
        <div className="flex flex-wrap items-center justify-center gap-8 text-neutral-400">
          <div className="flex items-center gap-2 hover:text-white transition">
            <YoutubeIcon className="w-4 h-4 text-red-500" />
            <span className="text-[11px] font-semibold tracking-wider">YOUTUBE COMMENTS SCAPE</span>
          </div>
          <div className="flex items-center gap-2 hover:text-white transition">
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span className="text-[11px] font-semibold tracking-wider">CSV INGESTION BUFFER</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 text-center font-mono text-[9px] uppercase tracking-widest text-muted-foreground border-t border-border/40">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 CommentScanner AI. System status: CALIBRATED.</p>
          <p>STABILIZED ARCHITECTURE // NEXT.JS + NEON + FASTAPI</p>
        </div>
      </footer>
    </div>
  );
}
