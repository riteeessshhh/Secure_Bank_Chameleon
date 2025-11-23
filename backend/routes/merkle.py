"""
Merkle root API endpoints for tamper-evidence verification.
"""
from fastapi import APIRouter
from backend.database import Database
from backend.blockchain import MerkleTree
from datetime import datetime

router = APIRouter()
db = Database()
merkle = MerkleTree()


@router.get("/api/merkle")
def get_merkle_root():
    """
    Get current Merkle root and statistics.
    
    Returns:
        {
            "merkleRoot": "hex_string",
            "count": N,
            "batchId": "batch-N",
            "updatedAt": "ISO_timestamp"
        }
    """
    logs = db.get_logs()
    
    if not logs:
        return {
            "merkleRoot": None,
            "count": 0,
            "batchId": "batch-0",
            "updatedAt": datetime.now().isoformat()
        }
    
    # Recompute Merkle root from all log hashes
    # Each log entry should have a hash field
    log_hashes = []
    for log in logs:
        # Create a hash from log data if not already present
        if 'merkle_hash' in log and log['merkle_hash']:
            log_hashes.append(log['merkle_hash'])
        else:
            # Generate hash from log entry
            from backend.utils.hash import hash_event
            log_hash = hash_event({
                'id': log.get('id'),
                'timestamp': log.get('timestamp'),
                'ip_address': log.get('ip_address'),
                'input_payload': log.get('input_payload'),
                'attack_type': log.get('attack_type'),
                'confidence': log.get('confidence'),
                'deception_strategy': log.get('deception_strategy')
            })
            log_hashes.append(log_hash)
    
    # Compute Merkle root
    from backend.utils.hash import compute_merkle_root
    root = compute_merkle_root(log_hashes) if log_hashes else ""
    
    return {
        "merkleRoot": root,
        "count": len(logs),
        "batchId": f"batch-{len(logs)}",
        "updatedAt": datetime.now().isoformat()
    }



