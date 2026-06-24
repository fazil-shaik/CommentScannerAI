import httpx
import re
import traceback
import os
from youtube_comment_downloader import YoutubeCommentDownloader, SORT_BY_POPULAR

def load_env():
    # Attempt to load .env from several possible directories
    possible_paths = [
        ".env",
        "../.env",
        "../../.env",
        "frontend/comment-scanner-ai/.env",
        "../frontend/comment-scanner-ai/.env"
    ]
    for path in possible_paths:
        if os.path.exists(path):
            try:
                with open(path, "r") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            parts = line.split("=", 1)
                            if len(parts) == 2:
                                key, value = parts
                                key = key.strip()
                                value = value.strip().strip("'\"")
                                if key not in os.environ:
                                    os.environ[key] = value
                print(f"Loaded environment variables from {path}")
                break
            except Exception as e:
                print(f"Failed loading environment variables from {path}: {e}")

def scrape_youtube_comments(url_or_id: str, max_comments: int = 30) -> list:
    """
    Scrape real YouTube comments using youtube-comment-downloader.
    No YouTube API key required!
    """
    try:
        downloader = YoutubeCommentDownloader()
        # Find video ID if URL was passed
        video_id = url_or_id
        if "youtube.com" in url_or_id or "youtu.be" in url_or_id:
            # Parse video ID
            m = re.search(r"(?:v=|\/)([0-9A-Za-z_-]{11})", url_or_id)
            if m:
                video_id = m.group(1)

        generator = downloader.get_comments(video_id, sort_by=SORT_BY_POPULAR)
        comments = []
        for c in generator:
            comments.append({
                "text": c.get("text", ""),
                "author": c.get("author", "Anonymous"),
                "platform": "YouTube"
            })
            if len(comments) >= max_comments:
                break
        return comments
    except Exception as e:
        print(f"Error scraping YouTube comments: {e}")
        traceback.print_exc()
        return []

