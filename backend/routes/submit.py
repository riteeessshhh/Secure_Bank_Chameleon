"""
Enhanced submit endpoint that accepts and stores attacker session actions.
"""
from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
from backend.database import Database
from backend.utils.hash import hash_event
import json

router = APIRouter()
db = Database()


class Action(BaseModel):
    """Single action in a session"""
    type: str  # 'keystroke', 'click', 'navigate', 'focus', 'submit'
    ts: float  # timestamp in milliseconds
    payload: Optional[str] = None  # for keystrokes
    x: Optional[float] = None  # for clicks
    y: Optional[float] = None  # for clicks
    target: Optional[str] = None  # element id/selector
    value: Optional[str] = None  # form value at time of action


class SubmitRequest(BaseModel):
    """Enhanced submit request with actions"""
    input: str
    username: Optional[str] = None
    hp_field: Optional[str] = None
    ua: Optional[str] = None
    headers: Optional[Dict[str, Any]] = None
    actions: Optional[List[Action]] = None  # Session actions array
    ip_address: Optional[str] = "127.0.0.1"


@router.post("/api/submit")
async def submit_attack(request: Request, payload: SubmitRequest):
    """
    Accept attack submission with optional session actions.
    
    Stores the event with computed hash and emits socket.io event.
    """
    from backend.model import MLModel
    from backend.deception import DeceptionEngine
    from backend.blockchain import MerkleTree
    
    model = MLModel()
    deception = DeceptionEngine()
    merkle = MerkleTree()
    
    # 0. Check for Admin Credentials (Backdoor for Analyst)
    # The payload format is: "User ID: {userId}, Password: {password}"
    input_text = payload.input
    print(f"[DEBUG] Checking admin credentials in input: {input_text}")
    
    # Check for admin credentials - flexible matching
    # Format: "User ID: tanay@chameleon.com, Password: admin"
    has_admin_email = "tanay@chameleon.com" in input_text
    has_admin_password = "admin" in input_text.lower() and "password" in input_text.lower()
    
    # More specific check: ensure both email and password are present with correct format
    if has_admin_email and has_admin_password:
        # Check if it's in the expected format (with "User ID:" and "Password:" labels)
        if ("User ID:" in input_text or "user id:" in input_text.lower()) and \
           ("Password:" in input_text or "password:" in input_text.lower()):
            print("[DEBUG] Admin credentials detected - granting access")
            return {
                "received": True,
                "id": None,
                "hash": None,
                "response": {
                    "status": 200,
                    "message": "Login Successful",
                    "deception": "None",
                    "action": "redirect"
                },
                "forensics": {
                    "detected_type": "Authorized Access",
                    "confidence": 1.0,
                    "merkle_root": merkle.get_root() if hasattr(merkle, 'get_root') else ""
                },
                "attack_type": "Authorized Access",
                "confidence": 1.0,
                "merkle_root": merkle.get_root() if hasattr(merkle, 'get_root') else ""
            }
    
    # Detect attack type
    attack_type, confidence = model.predict(payload.input)
    
    # Fallback pattern detection - only override if model is uncertain AND patterns are clearly malicious
    # Don't override if model confidently says Benign
    input_lower = payload.input.lower()
    sqli_patterns = ["' or", "or 1=1", "union select", "drop table", "'; --", "or '1'='1", "admin' --", "union all select"]
    xss_patterns = ["<script", "javascript:", "onerror=", "onload=", "<img src", "<svg", "onclick=", "alert("]
    
    # Only apply pattern detection if:
    # 1. Model says Benign but confidence is low (< 0.6), OR
    # 2. Model prediction is uncertain (confidence < 0.7)
    # This prevents normal inputs from being misclassified
    if (attack_type == "Benign" and confidence < 0.6) or (confidence < 0.7 and attack_type != "Benign"):
        # Check for clear SQLi patterns (more specific patterns)
        if any(pattern in input_lower for pattern in sqli_patterns):
            print(f"[DEBUG] Pattern-based detection: SQLi pattern found, overriding model")
            attack_type = "SQLi"
            confidence = 0.9
        # Check for clear XSS patterns
        elif any(pattern in input_lower for pattern in xss_patterns):
            print(f"[DEBUG] Pattern-based detection: XSS pattern found, overriding model")
            attack_type = "XSS"
            confidence = 0.9
        # If no clear patterns found and model says Benign, keep it as Benign
        elif attack_type == "Benign":
            print(f"[DEBUG] Keeping Benign classification for normal input")
            attack_type = "Benign"
            confidence = max(confidence, 0.7)  # Boost confidence for normal inputs
    
    # Get deception strategy
    strategy_func = deception.decide_strategy(attack_type)
    response = strategy_func()
    
    # Create event object
    event = {
        'ip_address': payload.ip_address or request.client.host,
        'input_payload': payload.input,
        'attack_type': attack_type,
        'confidence': confidence,
        'deception_strategy': response['deception'],
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'user_agent': payload.ua,
        'headers': payload.headers or {},
        'actions': [action.dict() for action in (payload.actions or [])]  # Store actions
    }
    
    # Compute event hash
    event_hash = hash_event(event)
    event['hash'] = event_hash
    
    # Store in database
    log_id = db.log_attack(
        event['ip_address'],
        event['input_payload'],
        event['attack_type'],
        event['confidence'],
        event['deception_strategy'],
        event_hash
    )
    
    # Store actions in database
    if payload.actions:
        actions_list = [action.dict() for action in payload.actions]
        db.save_actions(log_id, actions_list)
    
    # Emit socket.io event (if socket.io is set up)
    # socketio.emit('attack_event', {
    #     'id': log_id,
    #     'time': event['timestamp'],
    #     'ip': event['ip_address'],
    #     'shortSummary': f"{attack_type} attack detected"
    # })
    
    # Return response in same format as /api/analyze for compatibility
    return {
        "received": True,
        "id": log_id,
        "hash": event_hash,
        "response": {
            "status": 200,
            "message": "Attack processed",
            "deception": response['deception'],
            "action": response.get('action', 'none')
        },
        "forensics": {
            "detected_type": attack_type,
            "confidence": confidence,
            "merkle_root": merkle.get_root() if hasattr(merkle, 'get_root') else event_hash
        },
        "attack_type": attack_type,
        "confidence": confidence,
        "merkle_root": merkle.get_root() if hasattr(merkle, 'get_root') else event_hash
    }


@router.get("/api/events/{event_id}/actions")
async def get_event_actions(event_id: int):
    """Get actions for a specific event"""
    actions = db.get_actions(event_id)
    
    return {
        "event_id": event_id,
        "actions": actions
    }


@router.get("/api/events/{event_id}")
async def get_event(event_id: int):
    """Get full event with actions"""
    logs = db.get_logs()
    event = next((log for log in logs if log.get('id') == event_id), None)
    
    if not event:
        return {"error": "Event not found"}
    
    # Get actions from database
    actions = db.get_actions(event_id)
    
    result = dict(event)
    result['actions'] = actions
    
    return result

