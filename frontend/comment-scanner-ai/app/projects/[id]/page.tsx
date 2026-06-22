"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  FileSpreadsheet,
  MessageSquare,
  Brain,
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
  AlertTriangle
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
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

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

      // Initialize chat with standard system introduction
      setMessages([
        {
          sender: "ai",
          text: `Hi! I'm your feedback assistant for **${projectData.project.name}**. I've analyzed all ${projectData.stats.totalComments} comments. You can ask me questions like:\n\n* "What features should we build next?"\n* "What are the main bugs or complaints?"\n* "Why are users leaving positive feedback?"`,
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-neutral-400 gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm font-semibold">Running ML analysis summaries...</p>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-500 animate-bounce" />
        <h2 className="text-2xl font-bold font-display">Oops! Failed to load project</h2>
        <p className="text-sm text-neutral-400 max-w-md">{errorMsg || "We couldn't retrieve the project details."}</p>
        <Link href="/dashboard" className="px-4 py-2 bg-primary rounded-xl text-xs font-bold text-white transition hover:bg-primary/90">
          Go Back Dashboard
        </Link>
      </div>
    );
  }

  const { project, comments: rawComments, reports: rawReports, stats: projectStats } = data;

  // Recharts Data Prep
  const sentimentChartData = [
    { name: "Positive", value: projectStats.sentimentBreakdown.positive, color: "#10b981" },
    { name: "Neutral", value: projectStats.sentimentBreakdown.neutral, color: "#eab308" },
    { name: "Negative", value: projectStats.sentimentBreakdown.negative, color: "#f43f5e" },
  ];

  const topicChartData = Object.entries(projectStats.topicDistribution).map(([topic, count]) => ({
    name: topic.charAt(0).toUpperCase() + topic.slice(1),
    count: count,
  }));

  const emotionChartData = Object.entries(projectStats.emotionDistribution).map(([emotion, count]) => ({
    name: emotion.charAt(0).toUpperCase() + emotion.slice(1),
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
        { sender: "ai", text: "Sorry, I had trouble parsing that. Please make sure the backend is active." },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] left-[-10%] w-[35%] h-[35%] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[35%] h-[35%] bg-violet-800/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-neutral-400 hover:text-white p-2 rounded-xl hover:bg-white/5 transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="space-y-0.5">
              <h1 className="text-lg font-bold font-display tracking-tight text-white flex items-center gap-2">
                {project.name}
              </h1>
              <p className="text-xs text-neutral-400 line-clamp-1 max-w-[200px] sm:max-w-md">
                {project.description || "No description provided."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 border border-white/5 bg-black/30 p-1.5 rounded-2xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${activeTab === "overview" ? "bg-primary text-white" : "text-neutral-400 hover:text-white"
                }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("comments")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${activeTab === "comments" ? "bg-primary text-white" : "text-neutral-400 hover:text-white"
                }`}
            >
              Comments ({rawComments.length})
            </button>
            <button
              onClick={() => setActiveTab("chat")}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${activeTab === "chat" ? "bg-primary text-white" : "text-neutral-400 hover:text-white"
                }`}
            >
              AI Chat
            </button>
          </div>
        </div>
      </header>

      {/* Detail Workspace */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-8 z-10">

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-8 animate-fade-in">
            {/* Top Grid: Main stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
              <div className="p-5 rounded-2xl glass-panel relative overflow-hidden flex flex-col justify-between h-[100px]">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Comments Ingested</span>
                <span className="text-2xl font-extrabold font-display">{projectStats.totalComments}</span>
              </div>
              <div className="p-5 rounded-2xl glass-panel relative overflow-hidden flex flex-col justify-between h-[100px]">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Sentiment Score</span>
                <span className="text-2xl font-extrabold font-display text-emerald-400">
                  {Math.round((projectStats.sentimentBreakdown.positive / (projectStats.totalComments || 1)) * 100)}% <span className="text-xs font-medium text-neutral-400 font-sans">Positive</span>
                </span>
              </div>
              <div className="p-5 rounded-2xl glass-panel relative overflow-hidden flex flex-col justify-between h-[100px]">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Average Toxicity</span>
                <span className="text-2xl font-extrabold font-display text-rose-400">
                  {Math.round(projectStats.averageToxicity * 100)}%
                </span>
              </div>
              <div className="p-5 rounded-2xl glass-panel relative overflow-hidden flex flex-col justify-between h-[100px]">
                <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Source Channel</span>
                <span className="inline-flex items-center gap-1 text-sm font-bold text-white mt-1 capitalize">
                  {project.sourceType === "youtube" ? (
                    <>
                      <YoutubeIcon className="w-4 h-4 text-red-500" />
                      YouTube
                    </>
                  ) : project.sourceType === "reddit" ? (
                    <>
                      <span className="w-4 h-4 bg-orange-600 rounded-full flex items-center justify-center text-white text-[9px] font-bold font-display">r</span>
                      Reddit
                    </>
                  ) : project.sourceType === "csv" ? (
                    <>
                      <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                      CSV Upload
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4 text-blue-500" />
                      Manual Input
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Visuals row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart: Sentiment */}
              <div className="p-5 rounded-2xl glass-panel flex flex-col items-center justify-between min-h-[300px]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 w-full text-left">Sentiment Share</h3>
                {mounted && (
                  <div className="w-full h-[200px] flex items-center justify-center mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sentimentChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {sentimentChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend iconSize={8} iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Chart: Topics */}
              <div className="p-5 rounded-2xl glass-panel flex flex-col justify-between min-h-[300px] lg:col-span-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">Feedback Topic Mappings</h3>
                {mounted && (
                  <div className="w-full h-[220px] mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topicChartData}>
                        <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                        <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* In-depth details row */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Left col: Executive summary report */}
              <div className="lg:col-span-8 p-6 rounded-2xl glass-panel space-y-4">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <h3 className="font-bold text-base font-display text-white flex items-center gap-2">
                    <FileText className="w-4 h-4 text-violet-400" />
                    AI Executive Summary
                  </h3>
                  <span className="text-[10px] text-neutral-500 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Report 1.0.0
                  </span>
                </div>

                <div className="prose prose-invert max-w-none text-neutral-300 text-xs leading-relaxed space-y-4 font-sans whitespace-pre-wrap">
                  {rawReports.length > 0 ? (
                    rawReports[0].summary
                  ) : (
                    <p className="text-neutral-500 italic">No summary report could be parsed.</p>
                  )}
                </div>
              </div>

              {/* Right col: Top Complaints & Requests lists */}
              <div className="lg:col-span-4 space-y-6">

                {/* Ranked Complaints */}
                <div className="p-5 rounded-2xl glass-panel space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                    <Frown className="w-4 h-4" />
                    Top Complaints
                  </h3>
                  <div className="space-y-3">
                    {projectStats.topComplaints.length === 0 ? (
                      <p className="text-xs text-neutral-500 italic">No critical complaint clusters detected.</p>
                    ) : (
                      projectStats.topComplaints.map((c, i) => (
                        <div key={c.id} className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 space-y-1">
                          <div className="flex items-center justify-between text-[9px] uppercase font-bold text-rose-400">
                            <span>#{i + 1} complaint</span>
                            <span>{c.topic}</span>
                          </div>
                          <p className="text-[11px] text-neutral-300 leading-normal line-clamp-3">
                            "{c.text}"
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Feature Requests */}
                <div className="p-5 rounded-2xl glass-panel space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Feature Requests
                  </h3>
                  <div className="space-y-3">
                    {projectStats.topFeatureRequests.length === 0 ? (
                      <p className="text-xs text-neutral-500 italic">No features request clusters logged yet.</p>
                    ) : (
                      projectStats.topFeatureRequests.map((c, i) => (
                        <div key={c.id} className="p-3 rounded-xl bg-primary/5 border border-primary/10 space-y-1">
                          <div className="flex items-center justify-between text-[9px] uppercase font-bold text-primary">
                            <span>#{i + 1} request</span>
                            <span>{c.topic}</span>
                          </div>
                          <p className="text-[11px] text-neutral-300 leading-normal line-clamp-3">
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

        {/* COMMENTS TAB */}
        {activeTab === "comments" && (
          <div className="space-y-6 animate-fade-in">
            {/* Filter Bar */}
            <div className="p-4 rounded-2xl glass-panel flex flex-col md:flex-row items-center gap-4">

              {/* Search input */}
              <div className="relative flex-grow w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search comments or author handle..."
                  value={searchText}
                  onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/3 border border-white/15 text-xs outline-none text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
                />
              </div>

              {/* Sentiment filter */}
              <div className="flex items-center gap-2 w-full md:w-auto">
                <SlidersHorizontal className="w-4 h-4 text-neutral-500 hidden sm:block" />
                <select
                  value={filterSentiment}
                  onChange={(e) => { setFilterSentiment(e.target.value); setCurrentPage(1); }}
                  className="w-full md:w-40 px-3 py-2.5 rounded-xl bg-[#0d1020] border border-white/10 text-xs text-neutral-300 focus:border-primary/50 outline-none transition cursor-pointer"
                >
                  <option value="all">All Sentiments</option>
                  <option value="positive">Positive</option>
                  <option value="neutral">Neutral</option>
                  <option value="negative">Negative</option>
                </select>
              </div>

              {/* Topic filter */}
              <div className="w-full md:w-auto">
                <select
                  value={filterTopic}
                  onChange={(e) => { setFilterTopic(e.target.value); setCurrentPage(1); }}
                  className="w-full md:w-40 px-3 py-2.5 rounded-xl bg-[#0d1020] border border-white/10 text-xs text-neutral-300 focus:border-primary/50 outline-none transition cursor-pointer"
                >
                  <option value="all">All Topics</option>
                  <option value="pricing">Pricing</option>
                  <option value="performance">Performance</option>
                  <option value="features">Features</option>
                  <option value="bugs">Bugs</option>
                  <option value="support">Support</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Comments List */}
            {filteredComments.length === 0 ? (
              <div className="p-12 text-center rounded-2xl border border-white/5 bg-white/2 backdrop-blur-sm">
                <HelpCircle className="w-10 h-10 text-neutral-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-neutral-400">No matching comments found</p>
                <p className="text-xs text-neutral-500 mt-1">Try resetting your filters or adjusting your search queries.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  {currentComments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-5 rounded-2xl glass-panel hover:bg-white/2 hover:border-white/15 transition-all duration-200 space-y-3 relative overflow-hidden"
                    >
                      {/* Top Header info */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-neutral-300">{comment.author || "Anonymous"}</span>
                          <span className="text-[10px] text-neutral-500">{new Date(comment.createdAt).toLocaleDateString()}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Sentiment Tag */}
                          {comment.sentiment === "positive" ? (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[9px] font-extrabold uppercase border border-emerald-500/20">
                              Positive
                            </span>
                          ) : comment.sentiment === "negative" ? (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[9px] font-extrabold uppercase border border-rose-500/20">
                              Negative
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 text-[9px] font-extrabold uppercase border border-yellow-500/20">
                              Neutral
                            </span>
                          )}

                          {/* Topic Tag */}
                          {comment.topic && (
                            <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-neutral-400 text-[9px] font-bold uppercase">
                              {comment.topic}
                            </span>
                          )}

                          {/* Toxicity Alert */}
                          {comment.toxicity !== null && comment.toxicity > 0.4 && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 text-[8px] font-extrabold uppercase border border-amber-500/20">
                              Toxic: {Math.round(comment.toxicity * 100)}%
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Comment text */}
                      <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                        {comment.text}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-6">
                    <span className="text-[11px] text-neutral-500">
                      Showing {indexOfFirstComment + 1}–{Math.min(indexOfLastComment, filteredComments.length)} of {filteredComments.length} comments
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg border border-white/5 bg-black/20 text-neutral-400 hover:text-white disabled:opacity-50 hover:bg-white/5 transition"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      {Array.from({ length: totalPages }).map((_, idx) => {
                        const page = idx + 1;
                        // Limit displayed page indicators if too many
                        if (totalPages > 5 && Math.abs(page - currentPage) > 2 && page !== 1 && page !== totalPages) {
                          if (page === 2 || page === totalPages - 1) {
                            return <span key={page} className="text-neutral-600 text-xs px-1">...</span>;
                          }
                          return null;
                        }
                        return (
                          <button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`w-7 h-7 rounded-lg border text-xs font-semibold transition ${currentPage === page
                                ? "bg-primary border-primary text-white"
                                : "border-white/5 bg-black/20 text-neutral-400 hover:text-white hover:bg-white/5"
                              }`}
                          >
                            {page}
                          </button>
                        );
                      })}

                      <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-lg border border-white/5 bg-black/20 text-neutral-400 hover:text-white disabled:opacity-50 hover:bg-white/5 transition"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* AI CHAT (RAG) TAB */}
        {activeTab === "chat" && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[650px] animate-fade-in">
            {/* Sidebar with suggested prompts */}
            <div className="lg:col-span-1 p-5 rounded-2xl glass-panel space-y-4 flex flex-col justify-start">
              <div className="flex items-center gap-1.5 text-xs font-bold text-violet-400 uppercase tracking-wider border-b border-white/5 pb-2">
                <Sparkles className="w-4 h-4" />
                <span>Suggested Inquiries</span>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleSendChat(undefined, "What are the top 3 user complaints?")}
                  className="p-2.5 rounded-xl border border-white/5 bg-white/2 hover:border-primary/40 hover:bg-primary/5 text-[11px] text-neutral-300 text-left font-medium transition cursor-pointer"
                  disabled={chatLoading}
                >
                  What are the top 3 user complaints?
                </button>
                <button
                  onClick={() => handleSendChat(undefined, "What features are users requesting next?")}
                  className="p-2.5 rounded-xl border border-white/5 bg-white/2 hover:border-primary/40 hover:bg-primary/5 text-[11px] text-neutral-300 text-left font-medium transition cursor-pointer"
                  disabled={chatLoading}
                >
                  What features are users requesting next?
                </button>
                <button
                  onClick={() => handleSendChat(undefined, "What are the common performance or speed complaints?")}
                  className="p-2.5 rounded-xl border border-white/5 bg-white/2 hover:border-primary/40 hover:bg-primary/5 text-[11px] text-neutral-300 text-left font-medium transition cursor-pointer"
                  disabled={chatLoading}
                >
                  What are common performance complaints?
                </button>
                <button
                  onClick={() => handleSendChat(undefined, "Why are users happy with this product?")}
                  className="p-2.5 rounded-xl border border-white/5 bg-white/2 hover:border-primary/40 hover:bg-primary/5 text-[11px] text-neutral-300 text-left font-medium transition cursor-pointer"
                  disabled={chatLoading}
                >
                  Why are users happy with this product?
                </button>
              </div>
            </div>

            {/* Chat Box */}
            <div className="lg:col-span-3 rounded-2xl glass-panel flex flex-col h-full overflow-hidden border border-white/5">

              {/* Messages viewport */}
              <div className="flex-grow p-6 overflow-y-auto space-y-4 flex flex-col scroll-smooth">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col max-w-[85%] space-y-1.5 ${msg.sender === "user" ? "self-end items-end" : "self-start items-start"
                      }`}
                  >
                    {/* Header */}
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-neutral-500 uppercase tracking-wider">
                      {msg.sender === "user" ? "You" : "Scanner Feedback AI"}
                    </div>

                    {/* Content Box */}
                    <div
                      className={`p-4 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${msg.sender === "user"
                          ? "bg-primary text-white rounded-tr-none"
                          : "bg-white/5 border border-white/10 text-neutral-200 rounded-tl-none"
                        }`}
                    >
                      {msg.text}
                    </div>

                    {/* Source References */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="w-full text-left space-y-1 pl-1">
                        <span className="text-[9px] uppercase font-bold text-neutral-600 block">retrieved sources:</span>
                        {msg.sources.map((src, sIdx) => (
                          <span
                            key={sIdx}
                            className="block p-1.5 rounded bg-black/30 border border-white/5 text-[10px] text-neutral-500 line-clamp-1 italic font-sans"
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
                  <div className="self-start flex flex-col items-start space-y-1.5 max-w-[80%]">
                    <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wider">Scanner Feedback AI</span>
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-neutral-400 rounded-tl-none flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      Retrieving database records and generating response...
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendChat} className="p-4 border-t border-white/5 bg-black/30 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Ask a question about comments (e.g. why are users complaining?)..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  className="flex-grow px-4 py-2.5 rounded-xl bg-white/3 border border-white/10 text-xs text-white outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition"
                  disabled={chatLoading}
                />
                <button
                  type="submit"
                  className="p-2.5 rounded-xl bg-primary hover:bg-primary/95 text-white active:scale-95 transition disabled:opacity-50 cursor-pointer"
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
