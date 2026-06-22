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
  Cpu
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

export default function Home() {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden flex flex-col justify-between">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[120px] pointer-events-none animate-pulse-slow" />
      
      {/* Navigation Header */}
      <header className="relative w-full max-w-7xl mx-auto px-6 py-5 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-violet-500 flex items-center justify-center shadow-lg shadow-primary/20">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-neutral-400 bg-clip-text text-transparent font-display">
            CommentScanner <span className="text-primary font-extrabold">AI</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-neutral-400">
          <a href="#features" className="hover:text-white transition">Features</a>
          <a href="#how-it-works" className="hover:text-white transition">How it Works</a>
          <a href="#integrations" className="hover:text-white transition">Integrations</a>
        </div>

        <Link 
          href="/dashboard" 
          className="relative inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-xl bg-white text-black hover:bg-neutral-200 transition-all duration-300 shadow-md hover:shadow-lg shadow-white/5 active:scale-95"
        >
          Open Dashboard
          <ArrowRight className="ml-2 w-4 h-4" />
        </Link>
      </header>

      {/* Hero Section */}
      <main className="relative flex-grow flex flex-col justify-center max-w-7xl mx-auto px-6 py-12 md:py-24 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Text Area */}
          <div className="lg:col-span-7 flex flex-col items-start text-left space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel border-white/10 text-xs font-semibold text-primary">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI-Powered Customer Intelligence Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.1] font-display">
              Convert raw feedback into <br />
              <span className="bg-gradient-to-r from-primary via-violet-400 to-white bg-clip-text text-transparent">
                actionable decisions
              </span>
            </h1>

            <p className="text-base sm:text-lg text-neutral-400 max-w-xl leading-relaxed">
              Instantly aggregate reviews and comments from YouTube, Reddit, CSV, and manual feedback. Apply deep-learning classifiers to isolate sentiment, toxicity, complaints, and chat with your feedback using local AI RAG.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link 
                href="/dashboard" 
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl bg-gradient-to-r from-primary to-violet-600 text-white font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:opacity-95 transition active:scale-95 text-sm"
              >
                Start Scanning Free
                <ChevronRight className="ml-1.5 w-4.5 h-4.5" />
              </Link>
              <a 
                href="#features" 
                className="inline-flex items-center justify-center px-6 py-3.5 rounded-xl glass-panel border-white/10 text-white font-semibold hover:bg-white/5 transition text-sm"
              >
                See Features
              </a>
            </div>
            
            {/* Trust Badges */}
            <div className="pt-8 border-t border-white/5 w-full">
              <p className="text-xs uppercase tracking-wider font-semibold text-neutral-500 mb-4">Supported channels</p>
              <div className="flex items-center gap-6 text-neutral-400">
                <div className="flex items-center gap-2 hover:text-white transition">
                  <YoutubeIcon className="w-5 h-5 text-red-500" />
                  <span className="text-sm font-medium">YouTube Comments</span>
                </div>
                <div className="flex items-center gap-2 hover:text-white transition">
                  <span className="w-5 h-5 bg-orange-600 rounded-full flex items-center justify-center text-white text-xs font-bold font-display">r</span>
                  <span className="text-sm font-medium">Reddit Threads</span>
                </div>
                <div className="flex items-center gap-2 hover:text-white transition">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-medium">CSV Uploads</span>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Showcase Panel */}
          <div className="lg:col-span-5 relative w-full aspect-square max-w-md mx-auto animate-float">
            {/* Visual Glass Board */}
            <div className="absolute inset-0 rounded-3xl glass-panel-glow p-6 flex flex-col justify-between">
              {/* Box Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                </div>
                <div className="px-2.5 py-1 rounded bg-primary/15 text-primary text-[10px] font-bold tracking-wider uppercase">
                  Scanner Active
                </div>
              </div>

              {/* Data Visuals Mockup */}
              <div className="my-auto space-y-4">
                {/* Visual Bar Sentiment */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-neutral-300">Sentiment Distribution</span>
                    <span className="text-primary font-bold">78% Positive</span>
                  </div>
                  <div className="w-full h-3 rounded-full bg-neutral-900 overflow-hidden flex">
                    <div className="h-full bg-emerald-500 w-[78%]" />
                    <div className="h-full bg-neutral-700 w-[14%]" />
                    <div className="h-full bg-rose-500 w-[8%]" />
                  </div>
                </div>

                {/* Sentiment Tags */}
                <div className="flex gap-2">
                  <div className="flex-1 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <div className="text-[10px] text-emerald-400 font-semibold uppercase">Positive</div>
                    <div className="text-base font-bold text-emerald-300">120</div>
                  </div>
                  <div className="flex-1 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
                    <div className="text-[10px] text-rose-400 font-semibold uppercase">Negative</div>
                    <div className="text-base font-bold text-rose-300">22</div>
                  </div>
                </div>

                {/* AI Summary Block */}
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                  <div className="flex items-center gap-1.5 text-violet-400 font-semibold text-xs">
                    <Cpu className="w-3.5 h-3.5 animate-pulse" />
                    <span>Executive Summary Extract</span>
                  </div>
                  <p className="text-[11px] text-neutral-400 leading-normal">
                    Users love the onboarding speed and UI look. Main complaint centers around payment processing limits.
                  </p>
                </div>
              </div>

              {/* Chat Input Mockup */}
              <div className="flex items-center gap-2 p-1.5 rounded-xl bg-black/30 border border-white/5">
                <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="text-[11px] text-neutral-500 flex-grow">What do users want built next?</div>
                <div className="px-2 py-1 rounded bg-white/5 text-[9px] font-bold text-neutral-400 border border-white/10">ASK</div>
              </div>
            </div>
          </div>
          
        </div>
      </main>

      {/* Features Grid Section */}
      <section id="features" className="relative w-full max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl font-bold font-display">Engineered with Deep-Learning Classifiers</h2>
          <p className="text-neutral-400 max-w-2xl mx-auto text-sm">
            Our platform parses text comments in real-time, executing full structural classification.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl glass-panel hover:border-primary/30 transition-all duration-300 hover:translate-y-[-2px] space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-display">Sentiment & Emotion</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Isolate positive, negative, and neutral sentiments with detailed confidence scoring alongside emotional mappings like joy, anger, fear, and sadness.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl glass-panel hover:border-primary/30 transition-all duration-300 hover:translate-y-[-2px] space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-display">Toxicity & Abuse</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Identify insults, hate speech, threats, and harassment automatically to protect your brand and filter out non-constructive forum noise.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl glass-panel hover:border-primary/30 transition-all duration-300 hover:translate-y-[-2px] space-y-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-display">Topic Distribution</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Automatically model comments into distinct categories: Bug Reports, Feature Requests, Pricing, Performance Concerns, and Support requests.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl glass-panel hover:border-primary/30 transition-all duration-300 hover:translate-y-[-2px] space-y-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <MessageSquare className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-display">AI Conversational Chat</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Execute conversational queries. Ask questions like \"What should we build next?\" and get structured answers retrieved directly from comments.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-2xl glass-panel hover:border-primary/30 transition-all duration-300 hover:translate-y-[-2px] space-y-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-display">Executive Summaries</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Skip reading thousands of comments. Generate a comprehensive business report outline highlighting loves, pain points, and product roadmap items.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-2xl glass-panel hover:border-primary/30 transition-all duration-300 hover:translate-y-[-2px] space-y-4">
            <div className="w-12 h-12 rounded-xl bg-neutral-500/10 border border-neutral-500/20 flex items-center justify-center text-neutral-300">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold font-display">CSV & Integrations</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Instantly parser uploaded spreadsheets or insert manual comments. Set up automated scraping imports for Reddit threads and YouTube video links.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 text-center text-xs text-neutral-500 border-t border-white/5">
        <p>© 2026 CommentScanner AI. Built with Drizzle ORM, Neon, Next.js, and FastAPI.</p>
      </footer>
    </div>
  );
}
