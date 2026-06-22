import re
import traceback

# Optional imports for advanced NLP models.
# If they fail to load or download, we fall back to our premium rules-based engine.
TRANSFORMERS_AVAILABLE = False
try:
    from transformers import pipeline
    # We will initialize these lazily so startup is fast
    _sentiment_pipeline = None
    _emotion_pipeline = None
    _toxicity_pipeline = None
    TRANSFORMERS_AVAILABLE = True
except ImportError:
    pass

# --- Premium Rules-Based Fallback Engine ---

SENTIMENT_LEXICON = {
    "positive": [
        "love", "great", "awesome", "excellent", "amazing", "good", "best", "perfect", "fantastic",
        "beautiful", "smooth", "easy", "helpful", "recommend", "solved", "speedy", "happy", "clean",
        "intuitive", "brilliant", "wonderful", "cool", "superb", "satisfying", "useful"
    ],
    "negative": [
        "hate", "bad", "terrible", "worst", "awful", "horrible", "slow", "lag", "bug", "crash",
        "fail", "error", "broken", "freeze", "expensive", "overpriced", "useless", "annoying",
        "difficult", "frustrated", "disappointed", "poor", "stuck", "waste", "garbage", "trash"
    ]
}

EMOTION_KEYWORDS = {
    "joy": ["happy", "glad", "excited", "love", "joy", "delight", "amazing", "perfect", "wonderful", "celebrate"],
    "anger": ["hate", "angry", "annoyed", "mad", "pissed", "furious", "terrible", "garbage", "waste", "frustrated"],
    "fear": ["scared", "worry", "afraid", "risk", "concern", "anxious", "threat", "danger", "security", "leak"],
    "sadness": ["sad", "disappointed", "regret", "sorry", "miss", "grief", "depressed", "unhappy", "cry", "ruined"],
    "surprise": ["wow", "shocked", "unexpected", "surprise", "sudden", "incredible", "strange", "reveal", "curious"]
}

TOPIC_PATTERNS = {
    "pricing": [
        r"\bprice\b", r"\bpricing\b", r"\bcost\b", r"\bexpensive\b", r"\bcheap\b", r"\bdollar\b", r"\bbill\b",
        r"\bsubscription\b", r"\bpay\b", r"\bpayment\b", r"\bfree\b", r"\bfee\b", r"\bcharge\b", r"\bplan\b"
    ],
    "performance": [
        r"\bslow\b", r"\bfast\b", r"\bspeed\b", r"\blag\b", r"\blatency\b", r"\bresponsive\b", r"\bloading\b",
        r"\bfreeze\b", r"\bhang\b", r"\bmemory\b", r"\bcpu\b", r"\bquick\b", r"\bdelay\b", r"\bperformance\b"
    ],
    "features": [
        r"\bfeature\b", r"\brequest\b", r"\badd\b", r"\bbutton\b", r"\boption\b", r"\bdark mode\b", r"\bexport\b",
        r"\bui\b", r"\binterface\b", r"\bdesign\b", r"\bview\b", r"\bscreen\b", r"\bcustom\b", r"\bsettings\b"
    ],
    "bugs": [
        r"\bbug\b", r"\berror\b", r"\bcrash\b", r"\bfail\b", r"\bissue\b", r"\bbroken\b", r"\bglitch\b",
        r"\bwrong\b", r"\bincorrect\b", r"\bworkaround\b", r"\bwarning\b", r"\bexception\b", r"\bloop\b"
    ],
    "support": [
        r"\bsupport\b", r"\bhelp\b", r"\bticket\b", r"\bchat\b", r"\bemail\b", r"\bcontact\b", r"\breply\b",
        r"\bresponse\b", r"\bdocumentation\b", r"\bdocs\b", r"\bguide\b", r"\bfaq\b", r"\bteam\b", r"\bservice\b"
    ]
}

TOXICITY_KEYWORDS = [
    "idiot", "stupid", "dumb", "jerk", "garbage", "trash", "suck", "crap", "bastard", "fuck", "shit",
    "bitch", "asshole", "retard", "loser", "hate", "kill", "die", "disgusting", "pathetic"
]

def clean_text(text: str) -> str:
    """Preprocess text for cleaner rule matching."""
    return re.sub(r"[^\w\s']", " ", text.lower().strip())

def rule_based_analyze(text: str):
    cleaned = clean_text(text)
    words = cleaned.split()
    
    # 1. Sentiment
    pos_count = sum(1 for w in words if w in SENTIMENT_LEXICON["positive"])
    neg_count = sum(1 for w in words if w in SENTIMENT_LEXICON["negative"])
    
    # Adjust score based on counts
    total_sentiment_words = pos_count + neg_count
    if total_sentiment_words == 0:
        sentiment = "neutral"
        sentiment_score = 0.5
    else:
        diff = pos_count - neg_count
        # normalize to 0..1 scale (0 = negative, 0.5 = neutral, 1 = positive)
        sentiment_score = 0.5 + (diff / (total_sentiment_words * 2))
        
        # Apply labels
        if diff > 0:
            sentiment = "positive"
        elif diff < 0:
            sentiment = "negative"
        else:
            sentiment = "neutral"
            
    # 2. Emotion
    emotion_scores = {emotion: 0 for emotion in EMOTION_KEYWORDS}
    for emotion, kw_list in EMOTION_KEYWORDS.items():
        count = sum(1 for w in words if w in kw_list)
        emotion_scores[emotion] = count
        
    dominant_emotion = "neutral"
    max_emotion_score = 0.0
    total_emotion_hits = sum(emotion_scores.values())
    
    if total_emotion_hits > 0:
        dominant_emotion = max(emotion_scores, key=emotion_scores.get)
        max_emotion_score = emotion_scores[dominant_emotion] / total_emotion_hits
        # Normalize
        max_emotion_score = min(max_emotion_score + 0.1, 1.0)
    else:
        # Default fallback emotion depending on sentiment
        if sentiment == "positive":
            dominant_emotion = "joy"
            max_emotion_score = 0.6
        elif sentiment == "negative":
            dominant_emotion = "anger"
            max_emotion_score = 0.5
        else:
            dominant_emotion = "neutral"
            max_emotion_score = 0.8
            
    # 3. Toxicity
    toxic_hits = sum(1 for w in words if w in TOXICITY_KEYWORDS)
    # Simple toxicity grading
    toxicity_score = min(toxic_hits * 0.25, 1.0)
    
    # 4. Topic Modeling
    topic_distribution = {topic: 0 for topic in TOPIC_PATTERNS}
    for topic, patterns in TOPIC_PATTERNS.items():
        for pat in patterns:
            if re.search(pat, cleaned):
                topic_distribution[topic] += 1
                
    total_topic_hits = sum(topic_distribution.values())
    if total_topic_hits > 0:
        dominant_topic = max(topic_distribution, key=topic_distribution.get)
    else:
        dominant_topic = "other"
        
    return {
        "sentiment": sentiment,
        "sentiment_score": float(sentiment_score),
        "emotion": dominant_emotion,
        "emotion_score": float(max_emotion_score),
        "toxicity": float(toxicity_score),
        "topic": dominant_topic
    }

# --- Hugging Face lazy pipeline setup ---

def get_sentiment_pipeline():
    global _sentiment_pipeline
    if _sentiment_pipeline is None and TRANSFORMERS_AVAILABLE:
        try:
            # Using very small model for faster startup
            _sentiment_pipeline = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english", device=-1)
        except Exception:
            pass
    return _sentiment_pipeline

def get_emotion_pipeline():
    global _emotion_pipeline
    if _emotion_pipeline is None and TRANSFORMERS_AVAILABLE:
        try:
            _emotion_pipeline = pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base", device=-1)
        except Exception:
            pass
    return _emotion_pipeline

def get_toxicity_pipeline():
    global _toxicity_pipeline
    if _toxicity_pipeline is None and TRANSFORMERS_AVAILABLE:
        try:
            _toxicity_pipeline = pipeline("text-classification", model="unitary/toxic-bert", device=-1)
        except Exception:
            pass
    return _toxicity_pipeline

def transformer_analyze(text: str):
    """Attempt analysis with deep learning models, falling back if they fail or timeout."""
    if not TRANSFORMERS_AVAILABLE:
        return rule_based_analyze(text)
        
    try:
        # 1. Sentiment
        sentiment_pipe = get_sentiment_pipeline()
        if sentiment_pipe:
            res = sentiment_pipe(text[:512])[0] # Truncate to save model limit
            label = res["label"].lower() # positive / negative
            score = res["score"]
            # Map score to 0..1 scale where 0 is negative and 1 is positive
            if label == "negative":
                sentiment = "negative"
                sentiment_score = 1.0 - score
            else:
                sentiment = "positive"
                sentiment_score = score
                
            # If close to middle, label neutral
            if 0.4 <= sentiment_score <= 0.6:
                sentiment = "neutral"
        else:
            raise Exception("Sentiment pipeline unavailable")
            
        # 2. Emotion
        emotion_pipe = get_emotion_pipeline()
        if emotion_pipe:
            res = emotion_pipe(text[:512])[0]
            emotion = res["label"].lower()
            # map model emotions to categories: joy, anger, fear, sadness, surprise
            # Model output can be: anger, disgust, fear, joy, neutral, sadness, surprise
            emotion_score = res["score"]
            if emotion == "disgust":
                emotion = "anger"
        else:
            raise Exception("Emotion pipeline unavailable")
            
        # 3. Toxicity
        toxicity_pipe = get_toxicity_pipeline()
        if toxicity_pipe:
            res = toxicity_pipe(text[:512])[0]
            # unitary/toxic-bert output: LABEL_0 (non-toxic), LABEL_1 (toxic)
            # or label/score
            toxicity = res["score"] if res["label"] == "toxic" or "1" in res["label"] else (1.0 - res["score"])
        else:
            raise Exception("Toxicity pipeline unavailable")
            
        # 4. Topic modeling - Fall back to rules since BERTopic requires heavy fitting
        topic_info = rule_based_analyze(text)
        
        return {
            "sentiment": sentiment,
            "sentiment_score": float(sentiment_score),
            "emotion": emotion,
            "emotion_score": float(emotion_score),
            "toxicity": float(toxicity),
            "topic": topic_info["topic"]
        }
    except Exception as e:
        # If anything fails, fallback silently
        return rule_based_analyze(text)

def analyze_comment(text: str) -> dict:
    """Analyze a single comment text, return structured dict."""
    if not text or not isinstance(text, str):
        return {
            "sentiment": "neutral",
            "sentiment_score": 0.5,
            "emotion": "neutral",
            "emotion_score": 1.0,
            "toxicity": 0.0,
            "topic": "other"
        }
    # For speed and safety, we default to rule_based_analyze unless explicitly configured
    # Local developer machines running without GPU might hang on transformer pipeline loading.
    return rule_based_analyze(text)
