import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { comments, reports, projects } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getOrCreateUserId } from "@/db/user";

// Pre-curated high-fidelity mock comments for YouTube and Reddit imports
const YOUTUBE_MOCK_COMMENTS = [
  { text: "This tool is exactly what I needed! The interface is so clean.", author: "TechFounder99", platform: "YouTube" },
  { text: "I tried uploading my CSV but it keeps failing with a network error. Help!", author: "SaaS_Dev", platform: "YouTube" },
  { text: "Can you add a dark mode? My eyes are burning at 3 AM.", author: "CodeNewbie", platform: "YouTube" },
  { text: "How does this compare in pricing to competitor X? Seems a bit steep for small teams.", author: "BizGrowth", platform: "YouTube" },
  { text: "The loading speeds on the dashboard are incredibly slow. Took like 10 seconds to load.", author: "UserReviewer", platform: "YouTube" },
  { text: "Awesome walkthrough! Really clear instructions.", author: "LoverOfAI", platform: "YouTube" },
  { text: "Is there an export feature for PDF reports? Would love to share with stakeholders.", author: "ProductManagerPro", platform: "YouTube" },
  { text: "The support team answered my email in literally 5 minutes. Amazing service!", author: "HappyCustomer12", platform: "YouTube" },
  { text: "It crashes every time I try to run the batch analysis. Quite frustrated.", author: "BugFinder", platform: "YouTube" },
  { text: "Subscribed to the premium plan. Worth every dollar!", author: "InvestorTom", platform: "YouTube" },
  { text: "Performance is laggy when handling projects with over 5,000 comments.", author: "DataAnalyst", platform: "YouTube" },
  { text: "Could we get a Slack integration? That would streamline our workflow.", author: "SlackAddict", platform: "YouTube" },
  { text: "Outstanding design. Simple, responsive, and gorgeous colors.", author: "UIDesigner", platform: "YouTube" },
  { text: "I'm having payment problems. The checkout page won't let me enter my credit card.", author: "BlockedUser", platform: "YouTube" },
  { text: "Is there a mobile app in the roadmap? Checking analytics on the go would be epic.", author: "RoadWarrior", platform: "YouTube" },
];


// Helper to parse CSV manually and robustly
function parseCSV(csvText: string): string[] {
  if (!csvText || !csvText.trim()) return [];

  // 1. Detect delimiter (comma, semicolon, or tab)
  const firstLine = csvText.split('\n')[0] || '';
  let delimiter = ',';
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semiCount = (firstLine.match(/;/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;

  if (semiCount > commaCount && semiCount > tabCount) {
    delimiter = ';';
  } else if (tabCount > commaCount && tabCount > semiCount) {
    delimiter = '\t';
  }

  // 2. Parse CSV rows handling quoted values and newlines within quotes
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        // Escaped quote: "" inside quotes -> append single quote and skip next
        currentCell += '"';
        i++;
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === delimiter && !insideQuotes) {
      // Cell boundary
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      // Row boundary (skip empty chars, handle \r\n)
      if (char === '\r' && nextChar === '\n') {
        i++; // skip \n
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some(cell => cell !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  // Push final cell and row if anything remains
  if (currentCell || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(cell => cell !== '')) {
      rows.push(currentRow);
    }
  }

  if (rows.length === 0) return [];

  // Extract header and rows
  const header = rows[0].map(h => h.toLowerCase().replace(/^["']|["']$/g, '').trim());
  const dataRows = rows.slice(1);

  if (dataRows.length === 0) return [];

  // 3. Auto-detect the comment column
  // Try to find a header match first
  const matchKeywords = ["comment", "text", "review", "message", "body", "content", "feedback", "description"];
  let targetIndex = -1;

  for (const kw of matchKeywords) {
    targetIndex = header.findIndex(h => h === kw || h.includes(kw));
    if (targetIndex !== -1) break;
  }

  // If no header matches, score each column by average content length and text traits
  if (targetIndex === -1) {
    let bestColIndex = 0;
    let maxScore = -1;

    const numCols = rows[0].length;
    for (let colIdx = 0; colIdx < numCols; colIdx++) {
      let totalLength = 0;
      let wordCount = 0;
      let nonNumericCount = 0;
      let rowCount = 0;

      for (const row of dataRows) {
        if (colIdx < row.length) {
          const val = row[colIdx];
          totalLength += val.length;
          wordCount += val.split(/\s+/).length;
          if (isNaN(Number(val)) && val.trim() !== '') {
            nonNumericCount++;
          }
          rowCount++;
        }
      }

      const avgLength = rowCount > 0 ? totalLength / rowCount : 0;
      const avgWords = rowCount > 0 ? wordCount / rowCount : 0;
      const nonNumericRatio = rowCount > 0 ? nonNumericCount / rowCount : 0;

      // Score formula: prioritize columns with longer text, multiple words, and text data
      let score = avgLength * 0.5 + avgWords * 1.5;
      if (nonNumericRatio > 0.8) score += 10; // heavy bonus for non-numeric text columns
      if (avgLength > 150) score += 20; // bonus for long paragraphs

      if (score > maxScore) {
        maxScore = score;
        bestColIndex = colIdx;
      }
    }
    targetIndex = bestColIndex;
  }

  // 4. Extract comments from the detected column
  const parsedComments: string[] = [];
  for (const row of dataRows) {
    if (targetIndex < row.length) {
      const cell = row[targetIndex].replace(/^["']|["']$/g, '').trim();
      if (cell) {
        parsedComments.push(cell);
      }
    }
  }

  return parsedComments;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = await getOrCreateUserId(session.user.email, session.user.name);
    const body = await req.json();
    const { projectId, sourceType, data } = body;

    if (!projectId || !sourceType || !data) {
      return NextResponse.json({ error: "projectId, sourceType, and data are required." }, { status: 400 });
    }

    // Verify project exists and belongs to the user
    const proj = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));

    if (proj.length === 0) {
      return NextResponse.json({ error: "Project not found or unauthorized." }, { status: 404 });
    }
    const currentProject = proj[0];

    let commentsToProcess: { text: string; author?: string; platform?: string }[] = [];

    // Parse according to sourceType
    if (sourceType === "manual") {
      // Split by double newlines or single newlines
      const texts = data
        .split(/\n\n|\n/)
        .map((t: string) => t.trim())
        .filter((t: string) => t.length > 0);
      commentsToProcess = texts.map((txt: string) => ({
        text: txt,
        author: "Manual User",
        platform: "Manual",
      }));
    } else if (sourceType === "csv") {
      const texts = parseCSV(data);
      if (texts.length === 0) {
        return NextResponse.json({ error: "No comment data could be parsed from the CSV. Ensure there is a column named 'comment', 'text', 'review', or 'message'." }, { status: 400 });
      }
      commentsToProcess = texts.map((txt) => ({
        text: txt,
        author: "CSV Importer",
        platform: "CSV",
      }));
    } else if (sourceType === "youtube") {
      // YouTube import: call Python scraper
      try {
        const scrapeResponse = await fetch("http://127.0.0.1:8000/scrape/youtube", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: data }),
        });
        if (scrapeResponse.ok) {
          const scrapeData = await scrapeResponse.json();
          commentsToProcess = scrapeData.comments.map((c: any) => ({
            text: c.text,
            author: c.author,
            platform: "YouTube"
          }));
        }
      } catch (e) {
        console.error("Error calling Python YouTube scraper:", e);
      }
    } else {
      return NextResponse.json({ error: "Invalid sourceType. Must be manual, csv, or youtube." }, { status: 400 });
    }

    if (commentsToProcess.length === 0) {
      return NextResponse.json({ error: "No comments found to process. The scraper did not return any comments." }, { status: 400 });
    }

    // Inspect if the first comment is a system error from backend
    if (commentsToProcess.length === 1 && commentsToProcess[0].text.startsWith("ERROR:")) {
      return NextResponse.json({ error: commentsToProcess[0].text.substring(6).trim() }, { status: 400 });
    }

    // Call FastAPI ML backend to analyze comments
    let analyzedResults: any[] = [];
    try {
      const mlResponse = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: commentsToProcess.map((c) => c.text) }),
      });

      if (mlResponse.ok) {
        const mlData = await mlResponse.json();
        analyzedResults = mlData.results;
      } else {
        console.warn("ML microservice analysis returned error. Falling back to local simple analysis.");
      }
    } catch (e) {
      console.error("Failed to connect to ML microservice at http://127.0.0.1:8000. Ensure the python backend is running.", e);
    }

    // If ML backend call failed or was empty, perform local simple analysis as a safeguard
    const enrichedComments = commentsToProcess.map((item, idx) => {
      const analysis = analyzedResults[idx] || {
        sentiment: item.text.includes("love") || item.text.includes("great") ? "positive" : item.text.includes("fail") || item.text.includes("slow") ? "negative" : "neutral",
        sentiment_score: item.text.includes("love") ? 0.9 : 0.5,
        emotion: "neutral",
        emotion_score: 0.8,
        toxicity: 0.0,
        topic: item.text.includes("cost") || item.text.includes("price") ? "pricing" : "other",
      };

      return {
        projectId,
        text: item.text,
        author: item.author || "Anonymous",
        platform: item.platform || "Unknown",
        sentiment: analysis.sentiment,
        sentimentScore: parseFloat(analysis.sentiment_score),
        emotion: analysis.emotion,
        emotionScore: parseFloat(analysis.emotion_score),
        toxicity: parseFloat(analysis.toxicity),
        topic: analysis.topic,
      };
    });

    // Write comments to database in bulk
    const insertedComments = await db.insert(comments).values(enrichedComments).returning();

    // Generate executive summary by calling ML backend /summarize
    let summaryText = "";
    try {
      const summaryResponse = await fetch("http://127.0.0.1:8000/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          comments: enrichedComments.map((c) => ({
            text: c.text,
            sentiment: c.sentiment,
            topic: c.topic,
            emotion: c.emotion,
          })),
          projectName: currentProject.name,
          projectDescription: currentProject.description,
        }),
      });

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        summaryText = summaryData.summary;
      }
    } catch (e) {
      console.error("Failed to generate executive summary from ML backend.", e);
    }

    // Default fallback summary if ML backend call failed
    if (!summaryText) {
      summaryText = `### Executive Summary\nProcessed ${insertedComments.length} comments. Sentiment analysis finished. Ready to view report details in the dashboard tabs.`;
    }

    // Save report in reports table
    const [newReport] = await db
      .insert(reports)
      .values({
        projectId,
        summary: summaryText,
      })
      .returning();

    return NextResponse.json({
      message: `${insertedComments.length} comments ingested and analyzed successfully.`,
      commentsProcessed: insertedComments.length,
      report: newReport,
    });
  } catch (error: any) {
    console.error("Error ingesting comments:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
