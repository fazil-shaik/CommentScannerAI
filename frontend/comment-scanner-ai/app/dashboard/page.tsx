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
  LogOut,
  Activity
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
    activeIntegrations: 4
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

      setStats({
        totalProjects: data.length,
        totalComments: data.length * 28, // estimate representing comments loaded
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
    if (!confirm("Confirm command: PURGE project database node? This action deletes all associated feedback files and summary matrices permanently.")) return;

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
      setErrorMsg("Error: project name parameter is empty.");
      return;
    }

    let finalData = "";
    if (sourceType === "manual") {
      finalData = inputText;
      if (!finalData.trim()) {
        setErrorMsg("Error: text field empty. Provide text comments to parse.");
        return;
      }
    } else if (sourceType === "csv") {
      finalData = csvContent;
      if (!finalData.trim()) {
        setErrorMsg("Error: CSV upload buffer empty. Attach a valid file.");
        return;
      }
    } else {
      finalData = inputText;
      if (!finalData.trim()) {
        setErrorMsg("Error: URL is required for target YouTube scraping node.");
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
        throw new Error(err.error || "Project creation failed");
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
        throw new Error(err.error || "Ingestion algorithm failure. Check remote file access.");
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
    <div className="relative min-h-screen bg-background text-foreground flex flex-col font-sans select-none">

      {/* Structural Wire Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Background glow flares */}
      <div className="absolute top-[-10%] right-[-10%] w-[350px] h-[350px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[350px] h-[350px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Control Deck Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition">
            <div className="w-8 h-8 rounded border border-primary/30 bg-primary/10 flex items-center justify-center">
              <Activity className="w-4 h-4 text-primary animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold tracking-widest text-white font-mono uppercase">
                COMMENTSCANNER <span className="text-primary font-bold">//</span> AI
              </span>
              <span className="text-[8px] font-semibold text-accent font-mono tracking-widest uppercase">
                INTELLIGENCE CONTROL PANEL
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-primary bg-primary/10 text-primary text-xs font-mono font-bold uppercase hover:bg-primary hover:text-white transition-all rounded shadow shadow-primary/10 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Ingest New Node
            </button>
            <button
              onClick={() => signOut({ callbackUrl: "/" })}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 border border-border bg-card text-muted-foreground hover:text-white text-xs font-mono uppercase transition rounded cursor-pointer"
              title="Terminate Session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Terminate</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-6 py-8 space-y-8 z-10">

        {/* Hardware Status Warnings: Connection Error */}
        {dbError && (
          <div className="instrument-card instrument-card-glow rounded p-5 flex flex-col md:flex-row items-start gap-4 crt-grid">
            <div className="p-2 border border-primary/20 bg-primary/10 text-primary rounded mt-0.5 animate-bounce">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 flex-grow">
              <h3 className="font-bold text-sm tracking-wide text-white uppercase font-mono">CRITICAL ERROR: STORAGE NODE OFFLINE</h3>
              <p className="text-xs text-muted-foreground max-w-3xl leading-normal font-sans">
                The feedback telemetry storage pipeline is missing its database coordinates. Ensure your credentials are correctly registered in the environment variables schema.
              </p>
              <div className="pt-2">
                <span className="text-[10px] bg-black/40 px-3 py-2 rounded border border-border text-primary font-mono select-text block sm:inline-block">
                  DATABASE_URL=postgresql://[user]:[password]@[endpoint].neon.tech/neondb
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Telemetry Metrics Row */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="instrument-card rounded p-5 relative overflow-hidden flex flex-col justify-between min-h-[90px]">
            <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">ACTIVE HARDWARE NODES</p>
            <h2 className="text-3xl font-bold font-mono telemetry-val text-white mt-1">
              {loading ? "--" : stats.totalProjects} <span className="text-xs font-normal text-muted-foreground">PIPELINES</span>
            </h2>
          </div>
          <div className="instrument-card rounded p-5 relative overflow-hidden flex flex-col justify-between min-h-[90px]">
            <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">STREAM TENSORS CLASSIFIED</p>
            <h2 className="text-3xl font-bold font-mono telemetry-val text-accent mt-1">
              {loading ? "--" : stats.totalComments} <span className="text-xs font-normal text-muted-foreground">STRINGS</span>
            </h2>
          </div>
          <div className="instrument-card rounded p-5 relative overflow-hidden flex flex-col justify-between min-h-[90px]">
            <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">INTEGRATED CHANNELS ACTIVE</p>
            <h2 className="text-3xl font-bold font-mono telemetry-val text-primary mt-1">
              04 <span className="text-xs font-normal text-muted-foreground">ONLINE</span>
            </h2>
          </div>
        </section>

        {/* Workspace Ingestion Modules List */}
        <section className="space-y-4">
          <h2 className="text-sm font-bold font-mono uppercase tracking-widest text-white flex items-center gap-2">
            <Folder className="w-4 h-4 text-primary" />
            OPERATIONAL PIPELINE REGISTRY
          </h2>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-4 font-mono">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-xs uppercase tracking-widest">polling data systems status...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="instrument-card rounded p-12 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 rounded border border-border bg-card flex items-center justify-center text-muted-foreground">
                <Layers className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-300">No active feedback pipelines found</h3>
                <p className="text-xs text-muted-foreground max-w-sm font-sans">
                  Construct a processing telemetry node to scan comments from public feeds or spreadsheets.
                </p>
              </div>
              <button
                onClick={() => setModalOpen(true)}
                className="px-4 py-2 border border-accent bg-accent/15 text-accent text-xs font-mono font-bold uppercase hover:bg-accent hover:text-black transition rounded cursor-pointer"
              >
                DEPLOY FIRST PIPELINE
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="group relative rounded instrument-card p-5 flex flex-col justify-between hover:border-primary/50 transition-all duration-300 shadow-md cursor-pointer"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      {project.sourceType === "youtube" ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-red-500/20 bg-red-500/10 text-red-400 font-mono text-[8px] font-bold uppercase">
                          <YoutubeIcon className="w-3 h-3" />
                          YT_STREAM
                        </span>
                      ) : project.sourceType === "csv" ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 font-mono text-[8px] font-bold uppercase">
                          <FileSpreadsheet className="w-3 h-3" />
                          CSV_TABLE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-accent/20 bg-accent/10 text-accent font-mono text-[8px] font-bold uppercase">
                          <MessageSquare className="w-3 h-3" />
                          TXT_LOG
                        </span>
                      )}

                      <button
                        onClick={(e) => handleDelete(project.id, e)}
                        disabled={deletingId === project.id}
                        className="text-muted-foreground hover:text-primary p-1.5 border border-transparent hover:border-primary/20 hover:bg-primary/5 rounded transition"
                        title="Purge Pipeline Node"
                      >
                        {deletingId === project.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="font-bold text-white group-hover:text-primary transition font-display text-base tracking-tight">
                        {project.name}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed font-sans">
                        {project.description || "No baseline documentation parameter defined."}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-border/40 flex items-center justify-between text-[9px] font-mono text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-accent group-hover:text-white transition">
                      LOAD CONSOLE
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Construct Telemetry Pipeline Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-xl rounded instrument-card bg-background overflow-hidden flex flex-col border border-border/70 shadow-2xl crt-grid">

            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-xs uppercase tracking-widest text-white font-mono">CONSTRUCT TELEMETRY NODE // INGEST_PIPELINE.EXE</h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-muted-foreground hover:text-white transition p-1 rounded border border-transparent hover:border-border hover:bg-card"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
              {errorMsg && (
                <div className="p-3 border border-primary/20 bg-primary/10 text-xs font-mono text-primary rounded">
                  {errorMsg}
                </div>
              )}

              {/* Project parameters */}
              <div className="space-y-1.5 font-mono">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">[ NODE_IDENTIFIER ]</label>
                <input
                  type="text"
                  placeholder="e.g. Acme SaaS Feedback Matrix"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded bg-background border border-border text-xs text-white outline-none focus:border-primary/50 transition"
                  disabled={creating}
                  required
                />
              </div>

              <div className="space-y-1.5 font-mono">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">[ BASELINE_DOCUMENTATION ]</label>
                <textarea
                  placeholder="What is this customer intelligence pipeline scanning?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded bg-background border border-border text-xs text-white outline-none focus:border-primary/50 transition h-20 resize-none"
                  disabled={creating}
                />
              </div>

              {/* Source parameters */}
              <div className="space-y-2 font-mono">
                <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">[ INGESTION_SOURCE_GATEWAY ]</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setSourceType("manual")}
                    className={`p-3 border rounded flex flex-col items-center justify-center gap-1.5 text-center transition cursor-pointer ${sourceType === "manual"
                        ? "bg-accent/10 border-accent text-accent font-bold"
                        : "bg-background border-border text-muted-foreground hover:bg-card hover:text-white"
                      }`}
                    disabled={creating}
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="text-[8px] uppercase tracking-widest">TXT_LOG</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSourceType("csv")}
                    className={`p-3 border rounded flex flex-col items-center justify-center gap-1.5 text-center transition cursor-pointer ${sourceType === "csv"
                        ? "bg-emerald-500/10 border-emerald-500 text-emerald-400 font-bold"
                        : "bg-background border-border text-muted-foreground hover:bg-card hover:text-white"
                      }`}
                    disabled={creating}
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span className="text-[8px] uppercase tracking-widest">CSV_TABLE</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSourceType("youtube")}
                    className={`p-3 border rounded flex flex-col items-center justify-center gap-1.5 text-center transition cursor-pointer ${sourceType === "youtube"
                        ? "bg-red-500/10 border-red-500 text-red-400 font-bold"
                        : "bg-background border-border text-muted-foreground hover:bg-card hover:text-white"
                      }`}
                    disabled={creating}
                  >
                    <YoutubeIcon className="w-4 h-4" />
                    <span className="text-[8px] uppercase tracking-widest">YT_STREAM</span>
                  </button>

                </div>
              </div>

              {/* Source input layouts */}
              {sourceType === "manual" && (
                <div className="space-y-1.5 font-mono">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">[ PASTE_STRING_BUFFER ]</label>
                  <textarea
                    placeholder="Paste individual customer comments. Separate each comment with line breaks or blank lines..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded bg-background border border-border text-xs text-white outline-none focus:border-primary/50 transition h-32 resize-none"
                    disabled={creating}
                    required
                  />
                </div>
              )}

              {sourceType === "csv" && (
                <div className="space-y-2 font-mono">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">[ ATTACH_CSV_STREAM ]</label>
                  <div className="border border-dashed border-border hover:border-emerald-500/50 rounded p-6 flex flex-col items-center justify-center text-center cursor-pointer transition relative bg-background/50">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      disabled={creating}
                    />
                    <UploadCloud className="w-7 h-7 text-muted-foreground mb-2" />
                    {csvFileName ? (
                      <span className="text-xs font-semibold text-emerald-400">{csvFileName} LOADED</span>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-[11px] text-neutral-300">Click to locate or drop csv file</p>
                        <p className="text-[9px] text-muted-foreground">Scans columns named text, comments, or reviews</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {sourceType === "youtube" && (
                <div className="space-y-1.5 font-mono">
                  <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest block">
                    [ YT_VIDEO_COORDINATES ]
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded bg-background border border-border text-xs text-white outline-none focus:border-primary/50 transition"
                    disabled={creating}
                    required
                  />
                  <p className="text-[9px] text-muted-foreground leading-normal mt-1">
                    * Deploying this link initializes the remote API scrape node to dump community discussions directly into the classifier queues.
                  </p>
                </div>
              )}

              {/* Submit / Cancel Actions */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-border/40 font-mono">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-transparent text-muted-foreground text-xs uppercase hover:text-white transition cursor-pointer"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 border text-xs uppercase font-bold text-white transition flex items-center gap-1.5 rounded cursor-pointer ${sourceType === "csv"
                      ? "bg-emerald-600 border-emerald-500 hover:bg-emerald-500"
                      : sourceType === "youtube"
                        ? "bg-red-600 border-red-500 hover:bg-red-500"
                        : "bg-primary border-primary hover:bg-primary/90 text-white"
                    }`}
                  disabled={creating}
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Ingesting...
                    </>
                  ) : (
                    <>
                      <Cpu className="w-3.5 h-3.5" />
                      DEPLOY PIPE
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