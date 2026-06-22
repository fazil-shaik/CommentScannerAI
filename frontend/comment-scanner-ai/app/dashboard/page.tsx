"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Plus, 
  FileSpreadsheet, 
  MessageSquare, 
  Trash2, 
  Folder, 
  Calendar, 
  Loader2, 
  X,
  UploadCloud,
  Layers,
  Brain,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Cpu,
  LogOut
} from "lucide-react";
import { signOut } from "next-auth/react";

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

interface Project {
  id: number;
  name: string;
  sourceType: string;
  description: string | null;
  createdAt: string;
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  
  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sourceType, setSourceType] = useState("manual"); // manual | csv | youtube | reddit
  const [inputText, setInputText] = useState(""); // manual text or URL
  const [csvContent, setCsvContent] = useState("");
  const [csvFileName, setCsvFileName] = useState("");
  const [creating, setCreating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [dbError, setDbError] = useState("");

  // Aggregate stats
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalComments: 0,
    activeIntegrations: 3
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setErrorMsg("");
      setDbError("");
      const res = await fetch("/api/projects");
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to load projects");
      }
      const data = await res.json();
      setProjects(data);

      // Simple estimate of total comments: we can hit project details to count later or count locally
      setStats({
        totalProjects: data.length,
        totalComments: data.length * 25, // estimate for visuals
        activeIntegrations: 4
      });
    } catch (err: any) {
      console.error(err);
      if (err.message.includes("DATABASE_URL")) {
        setDbError(err.message);
      } else {
        setErrorMsg(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this project? All associated comments and reports will be deleted.")) return;
    
    try {
      setDeletingId(id);
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete project");
      }
      setProjects(projects.filter((p) => p.id !== id));
      setStats(prev => ({
        ...prev,
        totalProjects: prev.totalProjects - 1
      }));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
    };
    reader.readAsText(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim()) {
      setErrorMsg("Project name is required.");
      return;
    }

    let finalData = "";
    if (sourceType === "manual") {
      finalData = inputText;
      if (!finalData.trim()) {
        setErrorMsg("Please paste some comments to analyze.");
        return;
      }
    } else if (sourceType === "csv") {
      finalData = csvContent;
      if (!finalData.trim()) {
        setErrorMsg("Please select and upload a valid CSV file.");
        return;
      }
    } else {
      // YouTube or Reddit URL
      finalData = inputText;
      if (!finalData.trim()) {
        setErrorMsg(`Please enter a valid ${sourceType === "youtube" ? "YouTube Video" : "Reddit Post"} URL.`);
        return;
      }
    }

    try {
      setCreating(true);
      
      // Step 1: Create Project
      const projectRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, sourceType, description }),
      });

      if (!projectRes.ok) {
        const err = await projectRes.json();
        throw new Error(err.error || "Failed to create project");
      }

      const newProject = await projectRes.json();

      // Step 2: Ingest comments
      const ingestRes = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: newProject.id,
          sourceType,
          data: finalData
        }),
      });

      if (!ingestRes.ok) {
        const err = await ingestRes.json();
        // Delete project if ingestion completely failed to avoid dangling empty projects
        await fetch(`/api/projects/${newProject.id}`, { method: "DELETE" });
        throw new Error(err.error || "Failed to process and analyze feedback comments");
      }

      // Reset form and close
      setName("");
      setDescription("");
      setInputText("");
      setCsvContent("");
      setCsvFileName("");
      setModalOpen(false);
      
      fetchProjects();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground flex flex-col">
      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-800/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="border-b border-white/5 bg-black/40 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary to-violet-500 flex items-center justify-center">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight font-display">
              CommentScanner <span className="text-primary font-bold">AI</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/95 transition shadow-lg shadow-primary/10 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl glass-panel border-white/10 text-neutral-400 hover:text-white text-sm font-medium transition cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-10 space-y-10 z-10">
        
        {/* Connection Error Banner */}
        {dbError && (
          <div className="p-5 rounded-2xl bg-destructive/15 border border-destructive/20 flex flex-col md:flex-row items-start gap-4">
            <div className="p-2 rounded-lg bg-destructive/20 text-destructive-foreground mt-0.5">
              <ShieldAlert className="w-5 h-5 text-red-400" />
            </div>
            <div className="space-y-1 flex-grow">
              <h3 className="font-bold text-red-200">Database Connection Required</h3>
              <p className="text-xs text-neutral-400 max-w-2xl leading-normal">
                {dbError}
              </p>
              <div className="pt-2">
                <span className="text-[10px] bg-black/40 px-2.5 py-1.5 rounded-lg border border-white/5 text-neutral-400 font-mono">
                  DATABASE_URL=postgresql://your-neon-username:your-password@ep-something.neon.tech/neondb?sslmode=require
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl glass-panel relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-xl" />
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Total Projects</p>
            <h2 className="text-3xl font-extrabold font-display mt-2">{loading ? "..." : stats.totalProjects}</h2>
          </div>
          <div className="p-5 rounded-2xl glass-panel relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl" />
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Comments Analyzed</p>
            <h2 className="text-3xl font-extrabold font-display mt-2">{loading ? "..." : stats.totalComments}</h2>
          </div>
          <div className="p-5 rounded-2xl glass-panel relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-xl" />
            <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Ingestion Channels</p>
            <h2 className="text-3xl font-extrabold font-display mt-2">4 Active</h2>
          </div>
        </section>

        {/* Projects list */}
        <section className="space-y-4">
          <h2 className="text-xl font-bold font-display tracking-tight flex items-center gap-2">
            <Folder className="w-5 h-5 text-primary" />
            Your Workspace Projects
          </h2>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-neutral-400 gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm">Connecting to database...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="p-12 text-center rounded-2xl border border-white/5 bg-white/2 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400">
                <Layers className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-neutral-200">No projects found</h3>
                <p className="text-xs text-neutral-500 max-w-sm">Create a project and upload feedback to begin analysis.</p>
              </div>
              <button
                onClick={() => setModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-neutral-200 transition cursor-pointer"
              >
                Create Project
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group relative rounded-2xl glass-panel p-5 flex flex-col justify-between hover:border-primary/40 hover:bg-white/3 transition-all duration-300 shadow-md cursor-pointer"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      {project.sourceType === "youtube" ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-bold uppercase border border-red-500/20">
                          <YoutubeIcon className="w-3 h-3" />
                          YouTube
                        </span>
                      ) : project.sourceType === "reddit" ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-orange-500/10 text-orange-400 text-[10px] font-bold uppercase border border-orange-500/20">
                          <span className="w-2.5 h-2.5 bg-orange-600 rounded-full flex items-center justify-center text-white text-[8px] font-bold font-display">r</span>
                          Reddit
                        </span>
                      ) : project.sourceType === "csv" ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase border border-emerald-500/20">
                          <FileSpreadsheet className="w-3 h-3" />
                          CSV Upload
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase border border-blue-500/20">
                          <MessageSquare className="w-3 h-3" />
                          Manual Paste
                        </span>
                      )}

                      <button
                        onClick={(e) => handleDelete(project.id, e)}
                        disabled={deletingId === project.id}
                        className="text-neutral-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/5 transition"
                      >
                        {deletingId === project.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="space-y-1">
                      <h3 className="font-bold text-neutral-100 group-hover:text-primary transition font-display text-base">
                        {project.name}
                      </h3>
                      <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                        {project.description || "No description provided."}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-neutral-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-neutral-400 group-hover:text-white transition">
                      View Report
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Creation Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="w-full max-w-xl rounded-2xl glass-panel-glow bg-[#0b0e1b] overflow-hidden flex flex-col border border-white/10 shadow-2xl">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-base font-display">Create Analytics Project</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-neutral-400 hover:text-white transition p-1 rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
              {errorMsg && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300">
                  {errorMsg}
                </div>
              )}

              {/* Project metadata */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Project Name</label>
                <input
                  type="text"
                  placeholder="e.g. Acme SaaS v2 Release"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/3 border border-white/10 text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none text-white transition"
                  disabled={creating}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Description (Optional)</label>
                <textarea
                  placeholder="What is this customer intelligence folder for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/3 border border-white/10 text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none text-white transition h-20 resize-none"
                  disabled={creating}
                />
              </div>

              {/* Source selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Data Source Ingestion</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setSourceType("manual")}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition cursor-pointer ${
                      sourceType === "manual"
                        ? "bg-primary/10 border-primary text-primary"
                        : "bg-white/2 border-white/5 text-neutral-400 hover:bg-white/5 hover:text-white"
                    }`}
                    disabled={creating}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Paste Text</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSourceType("csv")}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition cursor-pointer ${
                      sourceType === "csv"
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400"
                        : "bg-white/2 border-white/5 text-neutral-400 hover:bg-white/5 hover:text-white"
                    }`}
                    disabled={creating}
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">CSV Upload</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSourceType("youtube")}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition cursor-pointer ${
                      sourceType === "youtube"
                        ? "bg-red-500/10 border-red-500 text-red-400"
                        : "bg-white/2 border-white/5 text-neutral-400 hover:bg-white/5 hover:text-white"
                    }`}
                    disabled={creating}
                  >
                    <YoutubeIcon className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">YouTube</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSourceType("reddit")}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition cursor-pointer ${
                      sourceType === "reddit"
                        ? "bg-orange-500/10 border-orange-500 text-orange-400"
                        : "bg-white/2 border-white/5 text-neutral-400 hover:bg-white/5 hover:text-white"
                    }`}
                    disabled={creating}
                  >
                    <span className="w-4 h-4 bg-orange-600 rounded-full flex items-center justify-center text-white text-[9px] font-bold font-display">r</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Reddit</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Ingestion Data Inputs */}
              {sourceType === "manual" && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Paste Comments</label>
                  <textarea
                    placeholder="Paste individual feedback comments, separated by line breaks or empty lines..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/3 border border-white/10 text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none text-white transition h-32 resize-none"
                    disabled={creating}
                    required
                  />
                </div>
              )}

              {sourceType === "csv" && (
                <div className="space-y-2 animate-fade-in">
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Upload CSV File</label>
                  <div className="border border-dashed border-white/10 hover:border-emerald-500/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition relative group bg-white/1">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={creating}
                    />
                    <UploadCloud className="w-8 h-8 text-neutral-500 group-hover:text-emerald-400 transition mb-2" />
                    {csvFileName ? (
                      <span className="text-xs font-semibold text-emerald-400">{csvFileName} loaded</span>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-neutral-300">Click to upload or drag & drop</p>
                        <p className="text-[10px] text-neutral-500">Supports comment, text, review, message headers</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(sourceType === "youtube" || sourceType === "reddit") && (
                <div className="space-y-1.5 animate-fade-in">
                  <label className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                    {sourceType === "youtube" ? "YouTube Video URL" : "Reddit Thread/Post URL"}
                  </label>
                  <input
                    type="url"
                    placeholder={sourceType === "youtube" ? "https://www.youtube.com/watch?v=..." : "https://www.reddit.com/r/..."}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/3 border border-white/10 text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/20 outline-none text-white transition"
                    disabled={creating}
                    required
                  />
                  <p className="text-[10px] text-neutral-500">
                    * Integrates comment scraper logic to fetch discussion logs. (Mock data generator enables instant local evaluation for any link).
                  </p>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-neutral-400 text-sm font-semibold hover:bg-white/10 hover:text-white transition cursor-pointer"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-sm font-semibold text-white transition flex items-center gap-1.5 cursor-pointer ${
                    sourceType === "csv" 
                      ? "bg-emerald-600 hover:bg-emerald-500" 
                      : sourceType === "youtube" 
                      ? "bg-red-600 hover:bg-red-500" 
                      : sourceType === "reddit"
                      ? "bg-orange-600 hover:bg-orange-500"
                      : "bg-primary hover:bg-primary/95"
                  }`}
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Cpu className="w-4 h-4" />
                      Create & Analyze
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}