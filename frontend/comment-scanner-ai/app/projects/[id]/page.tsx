"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileSpreadsheet,
  MessageSquare,
  Sparkles,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
  Calendar,
  Layers,
  FileText,
  ShieldAlert,
  Frown,
  CheckCircle,
  HelpCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  LogOut,
  Activity,
  Terminal,
  Cpu
} from "lucide-react";
import { signOut } from "next-auth/react";
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

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

const RedditIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 8v8M8 12h8" />
  </svg>
);

interface Comment {
  id: number;
  text: string;
  author: string | null;
  platform: string | null;
  createdAt: string;
  sentiment: string | null;
  sentimentScore: number | null;
  emotion: string | null;
  emotionScore: number | null;
  toxicity: number | null;
  topic: string | null;
}

interface ProjectStats {
  totalComments: number;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  topicDistribution: Record<string, number>;
  emotionDistribution: Record<string, number>;
  averageToxicity: number;
  topComplaints: Array<{ id: number; text: string; topic: string; sentiment: string }>;
  topFeatureRequests: Array<{ id: number; text: string; topic: string; sentiment: string }>;
}

interface ProjectData {
  project: {
    id: number;
    name: string;
    sourceType: string;
    description: string | null;
    createdAt: string;
  };
  comments: Comment[];
  reports: Array<{ id: number; summary: string; createdAt: string }>;
  stats: ProjectStats;
}

interface ChatMessage {
  sender: "user" | "ai";
  text: string;
  sources?: string[];
}

export default function ProjectDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const projectId = parseInt(id);

  const [activeTab, setActiveTab] = useState<"overview" | "comments" | "chat">("overview");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [data, setData] = useState<ProjectData | null>(null);

  // Mounted check for Recharts hydration safety
  const [mounted, setMounted] = useState(false);

  // Comments Tab Filters
  const [searchText, setSearchText] = useState("");
  const [filterSentiment, setFilterSentiment] = useState("all");
  const [filterTopic, setFilterTopic] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const commentsPerPage = 10;

  // Chat Tab State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchProjectDetails();
  }, [projectId]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      const res = await fetch(`/api/projects/${projectId}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to load project details");
      }
      const projectData = await res.json();
      setData(projectData);

      setMessages([
        {
          sender: "ai",
          text: `Neural feedback buffer initialized for pipeline: **${projectData.project.name}**.\nIngested nodes: ${projectData.stats.totalComments} comments.\n\nYou can query this dataset dynamically. Try querying:
          \n* "List the top 3 user bug reports or technical issues."\n* "What features are requested most by the community?"\n* "Detail the overall sentiment feedback summary."`,
        }
      ]);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-muted-foreground gap-4 font-mono select-none">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-xs uppercase tracking-widest">Compiling classifier parameters...</p>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-6 font-mono select-none">
        <AlertTriangle className="w-12 h-12 text-primary animate-bounce" />
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">PIPELINE NODE ERROR</h2>
          <p className="text-xs text-muted-foreground max-w-md font-sans leading-relaxed">
            {errorMsg || "System failed to resolve data nodes. Connection parameters may have timed out."}
          </p>
        </div>
        <Link href="/dashboard" className="px-4 py-2 border border-primary bg-primary/10 text-primary text-xs font-bold uppercase transition hover:bg-primary hover:text-black rounded">
          &lt; BACK TO CONTROL DECK
        </Link>
      </div>
    );
  }

  const { project, comments: rawComments, reports: rawReports, stats: projectStats } = data;

  // Custom Colors matching our system
  const sentimentChartData = [
    { name: "Positive", value: projectStats.sentimentBreakdown.positive, color: "#00f5d4" }, // Teal
    { name: "Neutral", value: projectStats.sentimentBreakdown.neutral, color: "#ff9f1c" }, // Copper
    { name: "Negative", value: projectStats.sentimentBreakdown.negative, color: "#f43f5e" }, // Rose
  ];

  const topicChartData = Object.entries(projectStats.topicDistribution).map(([topic, count]) => ({
    name: topic.charAt(0).toUpperCase() + topic.slice(1),
    count: count,
  }));

  // Filtering Comments
  const filteredComments = rawComments.filter((c) => {
    const textMatch = c.text.toLowerCase().includes(searchText.toLowerCase()) ||
      (c.author && c.author.toLowerCase().includes(searchText.toLowerCase()));
    const sentimentMatch = filterSentiment === "all" || c.sentiment === filterSentiment;
    const topicMatch = filterTopic === "all" || c.topic === filterTopic;
    return textMatch && sentimentMatch && topicMatch;
  });

  // Paginated comments
  const indexOfLastComment = currentPage * commentsPerPage;
  const indexOfFirstComment = indexOfLastComment - commentsPerPage;
  const currentComments = filteredComments.slice(indexOfFirstComment, indexOfLastComment);
  const totalPages = Math.ceil(filteredComments.length / commentsPerPage);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Chat Trigger
  const handleSendChat = async (e?: React.FormEvent, customQuestion?: string) => {
    if (e) e.preventDefault();
    const query = customQuestion || chatInput;
    if (!query.trim() || chatLoading) return;

    setMessages((prev) => [...prev, { sender: "user", text: query }]);
    setChatInput("");
    setChatLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          question: query,
        }),
      });

      if (!res.ok) {
        throw new Error("Chat query failed");
      }

      const chatData = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: chatData.answer,
          sources: chatData.sources,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { sender: "ai", text: "ERROR: RAG neural interface offline. Ensure backend server processes are responding on port 8000." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col font-sans select-none">
      
      {/* Structural Wire Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
      
      {/* Ambient background glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[350px] h-[350px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[350px] h-[350px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Detail Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-muted-foreground hover:text-white p-2 border border-border bg-card rounded hover:border-muted-foreground/30 transition">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="flex flex-col">
              <h1 className="text-base font-bold font-display tracking-tight text-white flex items-center gap-2">
                {project.name}
              </h1>
              <p className="text-[10px] text-muted-foreground line-clamp-1 max-w-[200px] sm:max-w-md font-mono uppercase">
                {project.description || "NO BASELINE PARAMETERS DEFINED"}
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Tactile instrument switches) */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 border border-border bg-background/50 p-1 rounded font-mono text-[10px] font-bold">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-3 py-1.5 rounded transition uppercase cursor-pointer ${activeTab === "overview" ? "bg-primary text-black" : "text-muted-foreground hover:text-white"}`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab("comments")}
                className={`px-3 py-1.5 rounded transition uppercase cursor-pointer ${activeTab === "comments" ? "bg-primary text-black" : "text-muted-foreground hover:text-white"}`}
              >
                Log ({rawComments.length})
              </button>
              <button
                onClick={() => setActiveTab("chat")}
                className={`px-3 py-1.5 rounded transition uppercase cursor-pointer ${activeTab === "chat" ? "bg-primary text-black" : "text-muted-foreground hover:text-white"}`}
              >
                AI Chat
              </button>
            </div>
            
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="p-2 border border-border bg-card text-muted-foreground hover:text-white rounded transition cursor-pointer"
              title="Terminate Session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Detail Workspace Frame */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-8 z-10">

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            
            {/* Top Grid: System Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              <div className="instrument-card rounded p-5 flex flex-col justify-between h-[100px]">
                <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">INGESTED COUNT</span>
                <span className="text-2xl font-bold font-mono telemetry-val text-white">{projectStats.totalComments}</span>
              </div>
              <div className="instrument-card rounded p-5 flex flex-col justify-between h-[100px]">
                <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">SATISFACTION RATE</span>
                <span className="text-2xl font-bold font-mono telemetry-val text-accent">
                  {Math.round((projectStats.sentimentBreakdown.positive / (projectStats.totalComments || 1)) * 100)}%
                </span>
              </div>
              <div className="instrument-card rounded p-5 flex flex-col justify-between h-[100px]">
                <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">TOXIC FACTOR</span>
                <span className="text-2xl font-bold font-mono telemetry-val text-rose-500">
                  {Math.round(projectStats.averageToxicity * 100)}%
                </span>
              </div>
              <div className="instrument-card rounded p-5 flex flex-col justify-between h-[100px]">
                <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">INGEST_NODE</span>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-white uppercase tracking-wider">
                  {project.sourceType === "youtube" ? (
                    <>
                      <YoutubeIcon className="w-3.5 h-3.5 text-red-500" />
                      YT_SCRAP
                    </>
                  ) : project.sourceType === "reddit" ? (
                    <>
                      <RedditIcon className="w-3.5 h-3.5 text-orange-500" />
                      RD_THREAD
                    </>
                  ) : project.sourceType === "csv" ? (
                    <>
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                      CSV_FILE
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-3.5 h-3.5 text-accent" />
                      TXT_LOG
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Visual Analytics Matrices */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Pie: Sentiment share */}
              <div className="instrument-card rounded p-5 flex flex-col items-center justify-between min-h-[300px] crt-grid">
                <h3 className="text-[9px] font-mono font-bold uppercase tracking-widest text-muted-foreground w-full text-left">
                  SENTIMENT SHARE MATRIX
                </h3>
                {mounted && (
                  <div className="w-full h-[200px] flex items-center justify-center mt-2 font-mono text-[10px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sentimentChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {sentimentChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#0f1422', borderColor: '#22283a', fontFamily: 'monospace' }} />
                        <Legend iconSize={6} iconType="circle" wrapperStyle={{ fontFamily: 'monospace', fontSize: '9px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Bar: Topic Classifiers */}
              <div className="instrument-card rounded p-5 flex flex-col justify-between min-h-[300px] lg:col-span-2 crt-grid">
                <h3 className="text-[9px] font-mono font-bold uppercase tracking-widest text-muted-foreground w-full text-left">
                  TOPIC CLASSIFIER LOGS
                </h3>
                {mounted && (
                  <div className="w-full h-[220px] mt-2 font-mono text-[10px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topicChartData}>
                        <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} />
                        <Tooltip cursor={{ fill: "rgba(255,255,255,0.02)" }} contentStyle={{ background: '#0f1422', borderColor: '#22283a', fontFamily: 'monospace' }} />
                        <Bar dataKey="count" fill="#ff9f1c" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* In-depth Telemetry Matrices */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* AI summary compilation report */}
              <div className="lg:col-span-8 instrument-card rounded p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-border/40 pb-3 font-mono">
                  <h3 className="font-bold text-xs uppercase tracking-widest text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    COMPILER EXECUTIVE SUMMARY_REPORT.LOG
                  </h3>
                  <span className="text-[9px] text-muted-foreground font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    REV 1.0.0
                  </span>
                </div>

                <div className="prose prose-invert max-w-none text-neutral-300 text-xs leading-relaxed space-y-4 font-mono whitespace-pre-wrap">
                  {rawReports.length > 0 ? (
                    rawReports[0].summary
                  ) : (
                    <p className="text-muted-foreground italic">Pipeline reports buffer empty.</p>
                  )}
                </div>
              </div>

              {/* Right Side: Categorized lists */}
              <div className="lg:col-span-4 space-y-6">

                {/* Critical Complaints */}
                <div className="instrument-card rounded p-5 space-y-4 font-mono">
                  <h3 className="text-[9px] font-bold uppercase tracking-widest text-rose-400 flex items-center gap-1.5">
                    <Frown className="w-4 h-4" />
                    CRITICAL BUG_LOG_CLUSTERS
                  </h3>
                  <div className="space-y-3">
                    {projectStats.topComplaints.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground italic">No anomalies logged in priority queue.</p>
                    ) : (
                      projectStats.topComplaints.map((c, i) => (
                        <div key={c.id} className="p-3 border border-rose-500/20 bg-rose-500/5 rounded space-y-1">
                          <div className="flex items-center justify-between text-[8px] font-bold text-rose-400 uppercase tracking-widest">
                            <span>#{i + 1} ANOMALY</span>
                            <span>{c.topic}</span>
                          </div>
                          <p className="text-[10px] text-neutral-300 font-mono leading-normal line-clamp-3">
                            "{c.text}"
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Feature Requests */}
                <div className="instrument-card rounded p-5 space-y-4 font-mono">
                  <h3 className="text-[9px] font-bold uppercase tracking-widest text-accent flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    COMMUNITY_REQUEST_LOGS
                  </h3>
                  <div className="space-y-3">
                    {projectStats.topFeatureRequests.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground italic font-sans">No roadmap requests logged.</p>
                    ) : (
                      projectStats.topFeatureRequests.map((c, i) => (
                        <div key={c.id} className="p-3 border border-accent/20 bg-accent/5 rounded space-y-1">
                          <div className="flex items-center justify-between text-[8px] font-bold text-accent uppercase tracking-widest">
                            <span>#{i + 1} REQUEST</span>
                            <span>{c.topic}</span>
                          </div>
                          <p className="text-[10px] text-neutral-300 font-mono leading-normal line-clamp-3">
                            "{c.text}"
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* COMMENTS TAB (Structured Logs Table) */}
        {activeTab === "comments" && (
          <div className="space-y-6">
            
            {/* Telemetry Filter console */}
            <div className="p-4 border border-border bg-background/50 rounded flex flex-col md:flex-row items-center gap-4 font-mono">

              {/* Search query */}
              <div className="relative flex-grow w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="QUERY DATA STREAMS (handle or content)..."
                  value={searchText}
                  onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-9 pr-4 py-2 bg-background border border-border text-[10px] outline-none text-white focus:border-primary/50 transition rounded"
                />
              </div>

              {/* Sentiment filter */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <SlidersHorizontal className="w-4 h-4 text-muted-foreground hidden sm:block" />
                <select
                  value={filterSentiment}
                  onChange={(e) => { setFilterSentiment(e.target.value); setCurrentPage(1); }}
                  className="w-full md:w-40 px-2.5 py-2 rounded bg-card border border-border text-[10px] text-muted-foreground focus:border-primary/50 outline-none transition cursor-pointer"
                >
                  <option value="all">ALL SENTIMENTS</option>
                  <option value="positive">POSITIVE ONLY</option>
                  <option value="neutral">NEUTRAL ONLY</option>
                  <option value="negative">NEGATIVE ONLY</option>
                </select>
              </div>

              {/* Topic filter */}
              <div className="w-full md:w-auto">
                <select
                  value={filterTopic}
                  onChange={(e) => { setFilterTopic(e.target.value); setCurrentPage(1); }}
                  className="w-full md:w-40 px-2.5 py-2 rounded bg-card border border-border text-[10px] text-muted-foreground focus:border-primary/50 outline-none transition cursor-pointer"
                >
                  <option value="all">ALL TOPICS</option>
                  <option value="pricing">PRICING</option>
                  <option value="performance">PERFORMANCE</option>
                  <option value="features">FEATURES</option>
                  <option value="bugs">BUGS</option>
                  <option value="support">SUPPORT</option>
                  <option value="other">OTHER</option>
                </select>
              </div>
            </div>

            {/* Ingested Comments List */}
            {filteredComments.length === 0 ? (
              <div className="instrument-card rounded p-12 text-center font-mono">
                <HelpCircle className="w-9 h-9 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs font-bold text-white uppercase tracking-wider">No matching logs compiled</p>
                <p className="text-[10px] text-muted-foreground mt-1 font-sans">Modify search queries or database filter options.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3 font-mono">
                  {currentComments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-5 border border-border bg-card rounded hover:border-primary/20 transition-all duration-200 space-y-3 relative overflow-hidden"
                    >
                      {/* Log Header metadata */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/40 pb-2">
                        <div className="flex items-center gap-2.5 text-[10px]">
                          <span className="text-white font-bold">{comment.author || "ANONYMOUS_NODE"}</span>
                          <span className="text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString()}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Sentiment tag */}
                          {comment.sentiment === "positive" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded border border-accent/20 bg-accent/10 text-accent text-[8px] font-bold uppercase">
                              POSITIVE
                            </span>
                          ) : comment.sentiment === "negative" ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded border border-rose-500/20 bg-rose-500/10 text-rose-400 text-[8px] font-bold uppercase">
                              NEGATIVE
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded border border-amber-500/20 bg-amber-500/10 text-amber-500 text-[8px] font-bold uppercase">
                              NEUTRAL
                            </span>
                          )}

                          {/* Topic tag */}
                          {comment.topic && (
                            <span className="px-2 py-0.5 border border-border bg-background text-muted-foreground text-[8px] font-bold uppercase">
                              {comment.topic}
                            </span>
                          )}

                          {/* Toxicity flags */}
                          {comment.toxicity !== null && comment.toxicity > 0.4 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded border border-primary/20 bg-primary/10 text-primary text-[8px] font-bold uppercase">
                              TOX: {Math.round(comment.toxicity * 100)}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Content block */}
                      <p className="text-[11px] text-neutral-300 leading-relaxed font-mono">
                        {comment.text}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-border/40 pt-4 mt-6 font-mono">
                    <span className="text-[10px] text-muted-foreground uppercase">
                      telemetry logs {indexOfFirstComment + 1}–{Math.min(indexOfLastComment, filteredComments.length)} of {filteredComments.length} entries
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-1.5 border border-border bg-card text-muted-foreground hover:text-white rounded disabled:opacity-30 transition cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </button>

                      {Array.from({ length: totalPages }).map((_, idx) => {
                        const page = idx + 1;
                        if (totalPages > 5 && Math.abs(page - currentPage) > 2 && page !== 1 && page !== totalPages) {
                          if (page === 2 || page === totalPages - 1) {
                            return <span key={page} className="text-muted-foreground text-xs px-1">...</span>;
                          }
                          return null;
                        }
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`w-7 h-7 border text-[10px] font-bold uppercase rounded transition cursor-pointer ${currentPage === page
                                ? "bg-primary border-primary text-black"
                                : "border-border bg-card text-muted-foreground hover:text-white"
                              }`}
                          >
                            {page}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-1.5 border border-border bg-card text-muted-foreground hover:text-white rounded disabled:opacity-30 transition cursor-pointer"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* AI CHAT (Neural Query Console) TAB */}
        {activeTab === "chat" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[650px] font-mono">
            
            {/* Left Suggested prompts block */}
            <div className="lg:col-span-1 p-5 instrument-card rounded space-y-4 flex flex-col justify-start crt-grid">
              <div className="flex items-center gap-1.5 text-[9px] font-bold text-primary uppercase tracking-widest border-b border-border/40 pb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>SUGGESTED DIRECTIVES</span>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleSendChat(undefined, "List the top 3 user bug reports or technical issues.")}
                  className="p-2.5 border border-border bg-background text-[9px] text-left text-neutral-300 rounded hover:border-primary hover:bg-primary/5 transition uppercase leading-tight tracking-wider cursor-pointer"
                  disabled={chatLoading}
                >
                  List top 3 bug reports
                </button>
                <button
                  onClick={() => handleSendChat(undefined, "What features are requested most by the community?")}
                  className="p-2.5 border border-border bg-background text-[9px] text-left text-neutral-300 rounded hover:border-primary hover:bg-primary/5 transition uppercase leading-tight tracking-wider cursor-pointer"
                  disabled={chatLoading}
                >
                  What features are requested?
                </button>
                <button
                  onClick={() => handleSendChat(undefined, "What are the common performance or latency issues?")}
                  className="p-2.5 border border-border bg-background text-[9px] text-left text-neutral-300 rounded hover:border-primary hover:bg-primary/5 transition uppercase leading-tight tracking-wider cursor-pointer"
                  disabled={chatLoading}
                >
                  What are performance complaints?
                </button>
                <button
                  onClick={() => handleSendChat(undefined, "Why are users happy with this product?")}
                  className="p-2.5 border border-border bg-background text-[9px] text-left text-neutral-300 rounded hover:border-primary hover:bg-primary/5 transition uppercase leading-tight tracking-wider cursor-pointer"
                  disabled={chatLoading}
                >
                  Why are users happy?
                </button>
              </div>
            </div>

            {/* Chat screen */}
            <div className="lg:col-span-3 rounded border border-border bg-card flex flex-col h-full overflow-hidden">

              {/* Console log display viewport */}
              <div className="flex-grow p-6 overflow-y-auto space-y-5 flex flex-col scroll-smooth font-mono">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col max-w-[85%] space-y-1 ${msg.sender === "user" ? "self-end items-end animate-fade-in" : "self-start items-start animate-fade-in"}`}
                  >
                    {/* Log metadata header */}
                    <div className="flex items-center gap-1.5 text-[8px] font-bold text-muted-foreground uppercase tracking-widest">
                      {msg.sender === "user" ? "SYS_OPERATOR" : "AI_INFERENCE_ENGINE"}
                    </div>

                    {/* Console body panel */}
                    <div
                      className={`p-4 border text-[11px] leading-relaxed whitespace-pre-wrap rounded ${
                        msg.sender === "user"
                          ? "bg-primary/10 border-primary text-white"
                          : "bg-background border-border text-neutral-200"
                      }`}
                    >
                      {msg.text}
                    </div>

                    {/* Retrieval logs sources */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="w-full text-left space-y-1 mt-1 pl-1">
                        <span className="text-[8px] uppercase font-bold text-muted-foreground block tracking-wider">RETRIEVED VECTOR SOURCES:</span>
                        {msg.sources.map((src, sIdx) => (
                          <span
                            key={sIdx}
                            className="block p-1.5 rounded bg-background/50 border border-border text-[9px] text-muted-foreground line-clamp-1 italic font-sans"
                            title={src}
                          >
                            "{src}"
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {chatLoading && (
                  <div className="self-start flex flex-col items-start space-y-1 max-w-[80%]">
                    <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">AI_INFERENCE_ENGINE</span>
                    <div className="p-4 rounded border border-border bg-background text-[10px] text-muted-foreground flex items-center gap-2.5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      FETCHING DATA VECTORS AND RETRIEVING EMBEDDINGS...
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input interface */}
              <form onSubmit={handleSendChat} className="p-4 border-t border-border bg-background/60 flex items-center gap-2.5">
                <input
                  type="text"
                  placeholder="QUERY RAW DATA VECTORS (e.g. why are users happy?)..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-grow px-4 py-2.5 bg-background border border-border rounded text-[10px] text-white outline-none focus:border-primary/50 transition font-mono uppercase"
                  disabled={chatLoading}
                />
                <button
                  type="submit"
                  className="p-2.5 border border-primary bg-primary/15 text-primary rounded hover:bg-primary hover:text-black active:scale-95 transition disabled:opacity-50 cursor-pointer"
                  disabled={chatLoading || !chatInput.trim()}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

            </div>
          </div>
        )}

      </main>
    </div>
  );
}
