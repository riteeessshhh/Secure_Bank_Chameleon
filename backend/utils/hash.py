"""
Hash utilities for tamper-evidence and Merkle tree computation.
"""
import hashlib
import json
from typing import List


def sha256(data: str) -> str:
    """
    Compute SHA-256 hash of a string.
    
    Args:
        data: String to hash
        
    Returns:
        Hexadecimal hash string
    """
    return hashlib.sha256(data.encode('utf-8')).hexdigest()


def compute_merkle_root(hashes: List[str]) -> str:
    """
    Compute Merkle root from an array of hashes.
    
    Algorithm:
    - If array is empty, return empty string
    - If array has one element, return that hash
    - Pairwise combine hashes: SHA256(left + right)
    - If odd number of hashes, duplicate the last one
    - Recursively compute until single root hash remains
    
    Args:
        hashes: List of hash strings
        
    Returns:
        Merkle root hash string
    """
    if not hashes:
        return ""
    
    if len(hashes) == 1:
        return hashes[0]
    
    # Make even by duplicating last hash if odd
    current_level = hashes.copy()
    if len(current_level) % 2 == 1:
        current_level.append(current_level[-1])
    
    # Pairwise combine
    next_level = []
    for i in range(0, len(current_level), 2):
        left = current_level[i]
        right = current_level[i + 1]
        combined = sha256(left + right)
        next_level.append(combined)
    
    # Recursively compute root
    return compute_merkle_root(next_level)


def hash_event(event: dict) -> str:
    """
    Compute hash of an event object for tamper-evidence.
    
    Creates a canonical JSON representation and hashes it.
    
    Args:
        event: Event dictionary
        
    Returns:
        SHA-256 hash of the event
    """
    # Create canonical representation (sorted keys, no whitespace)
    canonical = json.dumps(event, sort_keys=True, separators=(',', ':'))
    return sha256(canonical)



