import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CommentScanner AI - Customer Feedback Intelligence Platform",
  description: "Aggregate comments from YouTube, Reddit, CSV, and manual feedback. Classify sentiment, detect toxicity and emotion, and query your feedback with AI Chat.",
  keywords: ["customer intelligence", "feedback analysis", "sentiment analysis", "NLP dashboard", "YouTube comments analyzer", "Reddit discussions insights", "product roadmap tools"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="min-h-full bg-background text-foreground flex flex-col antialiased selection:bg-primary/30 selection:text-primary-foreground">
        {children}
      </body>
    </html>
  );
}
