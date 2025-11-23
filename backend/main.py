from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.model import MLModel
from backend.deception import DeceptionEngine
from backend.blockchain import MerkleTree
from backend.database import Database
from backend.routes.merkle import router as merkle_router
from backend.routes.report import router as report_router
from backend.routes.submit import router as submit_router
import uvicorn

# AI router (Python implementation)
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional, Dict, Any
from backend.database import Database
from backend.services.fallbackRules import explain_attack as explain_attack_python
import os

ai_router = APIRouter()
db_ai = Database()

class ExplainRequest(BaseModel):
    event_id: Optional[int] = None
    event: Optional[Dict[str, Any]] = None

@ai_router.post("/api/ai/explain")
async def explain_attack_endpoint(request: Request, payload: ExplainRequest):
    try:
        event = None
        if payload.event_id:
            logs = db_ai.get_logs()
            event = next((log for log in logs if log.get('id') == payload.event_id), None)
            if not event:
                raise HTTPException(status_code=404, detail=f"Event {payload.event_id} not found")
        elif payload.event:
            event = payload.event
        else:
            raise HTTPException(status_code=400, detail="Either event_id or event must be provided")
        
        explanation = explain_attack_python(event)
        return {
            "success": True,
            "explanation": explanation,
            "event_id": payload.event_id,
            "timestamp": explanation.get('timestamp') or event.get('timestamp')
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating explanation: {str(e)}")

@ai_router.get("/api/ai/explain/{event_id}")
async def explain_attack_by_id(event_id: int, request: Request):
    try:
        logs = db_ai.get_logs()
        event = next((log for log in logs if log.get('id') == event_id), None)
        if not event:
            raise HTTPException(status_code=404, detail=f"Event {event_id} not found")
        explanation = explain_attack_python(event)
        return {
            "success": True,
            "explanation": explanation,
            "event_id": event_id
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating explanation: {str(e)}")

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(merkle_router)
app.include_router(report_router)
app.include_router(submit_router)
app.include_router(ai_router)

# Initialize Components
model = MLModel()
deception = DeceptionEngine()
merkle = MerkleTree()
db = Database()

class AnalyzeRequest(BaseModel):
    input_text: str
    ip_address: str = "127.0.0.1"

@app.post("/api/analyze")
async def analyze(request: AnalyzeRequest):
    # 0. Check for Admin Credentials (Backdoor for Analyst)
    if "User ID: tanay@chameleon.com" in request.input_text and "Password: admin" in request.input_text:
        return {
            "response": {
                "status": 200,
                "message": "Login Successful",
                "deception": "None",
                "action": "redirect"
            },
            "forensics": {
                "detected_type": "Authorized Access",
                "confidence": 1.0,
                "merkle_root": merkle.get_root()
            }
        }

    # 1. Detect
    attack_type, confidence = model.predict(request.input_text)
    print(f"[DEBUG] Input: {request.input_text}")
    print(f"[DEBUG] Detected: {attack_type}, Confidence: {confidence}")
    
    # Fallback: Check for common SQLi/XSS patterns if model doesn't detect them
    input_lower = request.input_text.lower()
    sqli_patterns = ["' or", "or 1=1", "union select", "drop table", "'; --", "or '1'='1", "admin' --"]
    xss_patterns = ["<script", "javascript:", "onerror=", "onload=", "<img src", "<svg"]
    
    if attack_type == "Benign" and confidence < 0.8:
        # Check for SQLi patterns
        if any(pattern in input_lower for pattern in sqli_patterns):
            print(f"[DEBUG] Pattern-based detection: SQLi pattern found, overriding model")
            attack_type = "SQLi"
            confidence = 0.9
        # Check for XSS patterns
        elif any(pattern in input_lower for pattern in xss_patterns):
            print(f"[DEBUG] Pattern-based detection: XSS pattern found, overriding model")
            attack_type = "XSS"
            confidence = 0.9
    
    # 2. Deceive
    strategy_func = deception.decide_strategy(attack_type)
    response = strategy_func()
    print(f"[DEBUG] Response action: {response.get('action', 'NO ACTION')}")
    
    # 3. Log & Blockchain
    log_entry = f"{request.ip_address}|{request.input_text}|{attack_type}|{response['deception']}"
    merkle.add_leaf(log_entry)
    merkle_root = merkle.get_root()
    
    # Save to DB with hash
    log_id = db.log_attack(
        request.ip_address, 
        request.input_text, 
        attack_type, 
        confidence, 
        response['deception'],
        merkle_root
    )
    
    # Update the event hash in database (if your DB supports it)
    # For now, the hash is computed on-the-fly in merkle route
    
    return {
        "response": response,
        "forensics": {
            "detected_type": attack_type,
            "confidence": confidence,
            "merkle_root": merkle_root
        }
    }

@app.get("/api/logs")
def get_logs():
    logs = db.get_logs()
    return {
        "logs": logs,
        "merkle_root": merkle.get_root()
    }

@app.get("/api/health")
def health():
    return {"status": "ok"}

@app.post("/api/test-predict")
async def test_predict(request: AnalyzeRequest):
    """Test endpoint to see what the model predicts"""
    attack_type, confidence = model.predict(request.input_text)
    return {
        "input": request.input_text,
        "predicted_type": attack_type,
        "confidence": confidence
    }

@app.get("/api/stats/top-ips")
def get_top_ips():
    """Get top 10 attacking IPs"""
    logs = db.get_logs()
    ip_stats = {}
    
    for log in logs:
        ip = log['ip_address']
        if ip not in ip_stats:
            ip_stats[ip] = {'total': 0, 'sqli': 0, 'xss': 0, 'benign': 0}
        ip_stats[ip]['total'] += 1
        if log['attack_type'] == 'SQLi':
            ip_stats[ip]['sqli'] += 1
        elif log['attack_type'] == 'XSS':
            ip_stats[ip]['xss'] += 1
        else:
            ip_stats[ip]['benign'] += 1
    
    # Sort by total requests and get top 10
    top_ips = sorted(ip_stats.items(), key=lambda x: x[1]['total'], reverse=True)[:10]
    return [{'ip': ip, **stats} for ip, stats in top_ips]

@app.get("/api/stats/time-series")
def get_time_series():
    """Get time-series data for last 24 hours"""
    import datetime
    logs = db.get_logs()
    
    # Get last 24 hours
    now = datetime.datetime.now()
    hours = []
    for i in range(24):
        hour_time = now - datetime.timedelta(hours=23-i)
        hours.append({
            'hour': hour_time.strftime('%H:00'),
            'timestamp': hour_time.isoformat(),
            'sqli': 0,
            'xss': 0,
            'benign': 0,
            'total': 0
        })
    
    # Count attacks per hour
    for log in logs:
        try:
            log_time = datetime.datetime.fromisoformat(log['timestamp'])
            hours_ago = (now - log_time).total_seconds() / 3600
            
            if 0 <= hours_ago < 24:
                hour_idx = int(hours_ago)
                if 0 <= hour_idx < 24:
                    if log['attack_type'] == 'SQLi':
                        hours[hour_idx]['sqli'] += 1
                    elif log['attack_type'] == 'XSS':
                        hours[hour_idx]['xss'] += 1
                    else:
                        hours[hour_idx]['benign'] += 1
                    hours[hour_idx]['total'] += 1
        except:
            continue
    
    return hours

@app.get("/api/stats/strategies")
def get_strategy_stats():
    """Get deception strategy statistics"""
    logs = db.get_logs()
    strategy_counts = {}
    
    for log in logs:
        strategy = log['deception_strategy']
        strategy_counts[strategy] = strategy_counts.get(strategy, 0) + 1
    
    return [{'strategy': k, 'count': v} for k, v in sorted(strategy_counts.items(), key=lambda x: x[1], reverse=True)]

@app.get("/api/stats/confidence")
def get_confidence_stats():
    """Get confidence score statistics"""
    logs = db.get_logs()
    
    if not logs:
        return {
            'average': 0,
            'min': 0,
            'max': 0,
            'total': 0
        }
    
    confidences = [log['confidence'] for log in logs if log.get('confidence') is not None]
    
    if not confidences:
        return {
            'average': 0,
            'min': 0,
            'max': 0,
            'total': len(logs)
        }
    
    return {
        'average': sum(confidences) / len(confidences),
        'min': min(confidences),
        'max': max(confidences),
        'total': len(logs)
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=5000)
