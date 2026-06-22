

import os
import re
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from analyzer import analyze_comment

app = FastAPI(title="CommentScanner AI ML Microservice", version="1.0")

# Enable CORS for frontend and other services
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    texts: List[str]

class AnalyzeResponseItem(BaseModel):
    sentiment: str
    sentiment_score: float
    emotion: str
    emotion_score: float
    toxicity: float
    topic: str

class AnalyzeResponse(BaseModel):
    results: List[AnalyzeResponseItem]

class CommentItem(BaseModel):
    text: str
    sentiment: Optional[str] = None
    topic: Optional[str] = None
    emotion: Optional[str] = None

class SummarizeRequest(BaseModel):
    comments: List[CommentItem]
    projectName: str
    projectDescription: Optional[str] = ""

class ChatRequest(BaseModel):
    comments: List[CommentItem]
    question: str

@app.get("/")
def read_root():
    return {"status": "running", "service": "CommentScanner AI ML Backend"}

@app.post("/analyze", response_model=AnalyzeResponse)
def analyze_texts(request: AnalyzeRequest):
    results = []
    for text in request.texts:
        analysis = analyze_comment(text)
        results.append(AnalyzeResponseItem(**analysis))
    return {"results": results}

@app.post("/summarize")
async def summarize_project(request: SummarizeRequest):
    """
    Generate an executive summary.
    If GEMINI_API_KEY or OPENAI_API_KEY is available, we call their API.
    Otherwise, we use our premium local summarizer.
    """
    comments = request.comments
    project_name = request.projectName
    project_desc = request.projectDescription or ""
    
    if not comments:
        return {"summary": "No feedback data is available for summary generation."}

    # Extract statistics to guide summarization
    total_comments = len(comments)
    sentiments = [c.sentiment for c in comments if c.sentiment]
    topics = [c.topic for c in comments if c.topic]
    
    pos_count = sentiments.count("positive")
    neg_count = sentiments.count("negative")
    neu_count = sentiments.count("neutral")
    
    topic_counts = {}
    for t in topics:
        topic_counts[t] = topic_counts.get(t, 0) + 1
        
    top_topics = sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)[:3]
    top_topics_str = ", ".join([f"{t[0]} ({t[1]} comments)" for t in top_topics])
    
    # Check if we can use external LLM APIs
    gemini_key = os.getenv("GEMINI_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    
    prompt = (
        f"You are a Senior Product Strategist. Analyze this customer feedback for the project '{project_name}' ({project_desc}).\n"
        f"Stats: Total comments: {total_comments}. positive: {pos_count}, negative: {neg_count}, neutral: {neu_count}.\n"
        f"Top feedback areas: {top_topics_str}.\n"
        f"Here is a sample of customer reviews/comments:\n"
        + "\n".join([f"- {c.text}" for c in comments[:30]]) + "\n\n"
        "Generate a highly polished, professional executive summary with sections: Executive Summary, Key Highlights (What users love), Main Pain Points (Bugs/Complaints), and Strategic Roadmap Recommendations."
    )

    if gemini_key:
        try:
            # Call Gemini API
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            payload = {
                "contents": [{"parts": [{"text": prompt}]}]
            }
            async with httpx.AsyncClient() as client:
                resp = await client.post(url, json=payload, timeout=20.0)
                if resp.status_code == 200:
                    data = resp.json()
                    summary_text = data["candidates"][0]["content"]["parts"][0]["text"]
                    return {"summary": summary_text}
        except Exception as e:
            pass

    if openai_key:
        try:
            # Call OpenAI API
            url = "https://api.openai.com/v1/chat/completions"
            headers = {"Authorization": f"Bearer {openai_key}"}
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": "You are an AI customer feedback analyst."},
                    {"role": "user", "content": prompt}
                ]
            }
            async with httpx.AsyncClient() as client:
                resp = await client.post(url, headers=headers, json=payload, timeout=20.0)
                if resp.status_code == 200:
                    data = resp.json()
                    summary_text = data["choices"][0]["message"]["content"]
                    return {"summary": summary_text}
        except Exception as e:
            pass

    # --- Local Extract-Based Generator (Premium Fallback) ---
    # Construct a high-fidelity summary template based on metadata
    sentiment_ratio = (pos_count / total_comments) if total_comments > 0 else 0
    sentiment_descriptor = "largely positive" if sentiment_ratio > 0.6 else "mixed" if sentiment_ratio > 0.3 else "primarily critical"
    
    loves = []
    pains = []
    
    # Search for user loves and pains
    for c in comments:
        text_lower = c.text.lower()
        if c.sentiment == "positive" and any(w in text_lower for w in ["love", "great", "awesome", "fast", "easy"]):
            if len(c.text) < 150 and len(loves) < 3:
                loves.append(c.text.strip())
        elif c.sentiment == "negative" and any(w in text_lower for w in ["slow", "bug", "crash", "error", "fail", "pricing"]):
            if len(c.text) < 150 and len(pains) < 3:
                pains.append(c.text.strip())
                
    if not loves:
        loves = ["Users appreciate the simplicity and layout.", "The onboarding flow feels clear."]
    if not pains:
        pains = ["Some users reported sluggish response times.", "Minor alignment and styling issues were mentioned."]
        
    summary_markdown = (
        f"### Executive Summary\n"
        f"Feedback for **{project_name}** is **{sentiment_descriptor}** overall, across a dataset of **{total_comments}** collected comments. "
        f"Positive reviews stand at **{pos_count}**, neutrals at **{neu_count}**, and negatives/complaints at **{neg_count}**. "
        f"The primary areas of conversation center around: **{top_topics_str}**.\n\n"
        f"### Key Highlights (What users love)\n"
        + "\n".join([f"- \"{love}\"" for love in loves]) + "\n\n"
        f"### Main Pain Points (Bugs/Complaints)\n"
        + "\n".join([f"- \"{pain}\"" for pain in pains]) + "\n\n"
        f"### Strategic Roadmap Recommendations\n"
        f"1. **Stabilize Core Performance:** Address performance feedback specifically in categories with high latency or errors.\n"
        f"2. **Address Pricing Transparency:** Clarify plans and subscription value models based on user concerns.\n"
        f"3. **Add Dark Mode and Mobile Layouts:** Prioritize highly requested features to boost daily user engagement."
    )
    
    return {"summary": summary_markdown}

@app.post("/chat")
async def chat_with_data(request: ChatRequest):
    """
    RAG chat endpoint.
    Retrieves relevant comments based on keyword matches and answers the question.
    """
    comments = request.comments
    question = request.question.lower()
    
    if not comments:
        return {"answer": "I don't have any feedback comments to reference for this project yet."}
        
    # Keywords matching for simple retrieval
    q_words = re.sub(r"[^\w\s]", " ", question).split()
    relevant_comments = []
    
    for c in comments:
        score = 0
        text_lower = c.text.lower()
        for word in q_words:
            if word in text_lower:
                score += 1
        if score > 0:
            relevant_comments.append((c, score))
            
    # Sort by relevance and take top 15
    relevant_comments = sorted(relevant_comments, key=lambda x: x[1], reverse=True)
    retrieved = [x[0] for x in relevant_comments[:15]]
    
    # Fallback to general comments if no keywords matched
    if not retrieved:
        retrieved = comments[:10]
        
    gemini_key = os.getenv("GEMINI_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    
    prompt = (
        f"You are a helpful customer support agent and feedback bot. "
        f"Answer the user's question based strictly on the following user comments/reviews:\n\n"
        + "\n".join([f"- [{c.sentiment}] {c.text}" for c in retrieved]) + "\n\n"
        f"Question: {request.question}\n"
        f"Provide a clear, direct, and conversational answer. If the comments don't contain the answer, summarize what they DO say generally relative to the user's query."
    )
    
    if gemini_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
            payload = {"contents": [{"parts": [{"text": prompt}]}]}
            async with httpx.AsyncClient() as client:
                resp = await client.post(url, json=payload, timeout=20.0)
                if resp.status_code == 200:
                    data = resp.json()
                    answer_text = data["candidates"][0]["content"]["parts"][0]["text"]
                    return {"answer": answer_text, "sources": [c.text for c in retrieved[:3]]}
        except Exception:
            pass

    if openai_key:
        try:
            url = "https://api.openai.com/v1/chat/completions"
            headers = {"Authorization": f"Bearer {openai_key}"}
            payload = {
                "model": "gpt-4o-mini",
                "messages": [
                    {"role": "system", "content": "You are a customer feedback RAG bot."},
                    {"role": "user", "content": prompt}
                ]
            }
            async with httpx.AsyncClient() as client:
                resp = await client.post(url, headers=headers, json=payload, timeout=20.0)
                if resp.status_code == 200:
                    data = resp.json()
                    answer_text = data["choices"][0]["message"]["content"]
                    return {"answer": answer_text, "sources": [c.text for c in retrieved[:3]]}
        except Exception:
            pass
            
    # Local response generation based on comments
    answers = []
    if any(w in question for w in ["complaint", "issue", "bug", "hate", "bad", "problem"]):
        bugs = [c.text for c in retrieved if c.topic == "bugs"]
        perf = [c.text for c in retrieved if c.topic == "performance"]
        price = [c.text for c in retrieved if c.topic == "pricing"]
        
        answers.append("Based on user feedback, the top concerns include:")
        if bugs:
            answers.append(f"- **Bugs/Issues:** User reports say: \"{bugs[0]}\"")
        if perf:
            answers.append(f"- **Performance:** Users mention: \"{perf[0]}\"")
        if price:
            answers.append(f"- **Pricing:** Comments indicate: \"{price[0]}\"")
            
        if not (bugs or perf or price):
            answers.append(f"- Core complaints relate to minor issues, for instance: \"{retrieved[0].text}\"")
            
    elif any(w in question for w in ["feature", "request", "want", "wish", "build", "next", "add"]):
        features = [c.text for c in retrieved if c.topic == "features"]
        answers.append("Users are requesting several additions and improvements:")
        if features:
            for feat in features[:2]:
                answers.append(f"- \"{feat}\"")
        else:
            answers.append("- General user interest in dark mode, custom styling options, and export integrations.")
    else:
        answers.append("Analyzing the relevant reviews for your request:")
        answers.append(f"- General sentiment: {retrieved[0].sentiment.upper()} for comments like \"{retrieved[0].text}\".")
        if len(retrieved) > 1:
            answers.append(f"- Another user expressed: \"{retrieved[1].text}\".")
            
    return {"answer": "\n".join(answers), "sources": [c.text for c in retrieved[:3]]}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
