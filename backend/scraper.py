import httpx
import re
import traceback
from youtube_comment_downloader import YoutubeCommentDownloader, SORT_BY_POPULAR

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

def scrape_reddit_comments(url: str, max_comments: int = 30) -> list:
    """
    Scrape Reddit comments by appending .json to the URL.
    No Reddit API client key required!
    """
    try:
        # Standardize URL: strip trailing slash and add .json
        clean_url = url.split("?")[0].rstrip("/")
        if not clean_url.endswith(".json"):
            json_url = f"{clean_url}.json"
        else:
            json_url = clean_url

        headers = {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

        with httpx.Client() as client:
            resp = client.get(json_url, headers=headers, follow_redirects=True, timeout=15.0)
            if resp.status_code != 200:
                print(f"Reddit returned status code {resp.status_code}")
                return []
            
            data = resp.json()
            # Reddit API returns a list [post_listing, comments_listing]
            if not isinstance(data, list) or len(data) < 2:
                print("Unexpected Reddit JSON response format")
                return []

            comment_listing = data[1]
            children = comment_listing.get("data", {}).get("children", [])

            extracted = []

            def recurse(nodes):
                for node in nodes:
                    if len(extracted) >= max_comments:
                        break
                    
                    kind = node.get("kind")
                    node_data = node.get("data", {})
                    
                    # Ignore 'more' markers
                    if kind == "more":
                        continue
                        
                    body = node_data.get("body")
                    author = node_data.get("author")
                    
                    if body and author and body != "[deleted]" and body != "[removed]":
                        extracted.append({
                            "text": body.strip(),
                            "author": f"u/{author}",
                            "platform": "Reddit"
                        })
                        
                    replies = node_data.get("replies")
                    if isinstance(replies, dict):
                        replies_children = replies.get("data", {}).get("children", [])
                        recurse(replies_children)

            recurse(children)
            return extracted
    except Exception as e:
        print(f"Error scraping Reddit comments: {e}")
        traceback.print_exc()
        return []
