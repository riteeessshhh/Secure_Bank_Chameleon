# Tamper-Evidence & Professional Reporting

This document describes the tamper-evidence and incident report generation features implemented in THE CHAMELEON project.

## Overview

The system implements:
1. **Merkle Root Mechanism** - Cryptographic proof of log data integrity
2. **Incident Report PDF Generator** - Professional reports for forensic analysis

## Architecture

### Backend Components

#### 1. Hash Utilities (`backend/utils/hash.py`)
- `sha256(str)` - Compute SHA-256 hash
- `compute_merkle_root(hashesArray)` - Build Merkle tree from hash array
- `hash_event(event)` - Hash event objects for tamper-evidence

**Merkle Algorithm:**
- Pairs hashes: `SHA256(left + right)`
- If odd number of hashes, duplicates the last one
- Recursively computes until single root hash remains

#### 2. Merkle API (`backend/routes/merkle.py`)
- `GET /api/merkle` - Returns current Merkle root and statistics

**Response:**
```json
{
  "merkleRoot": "abc123...",
  "count": 42,
  "batchId": "batch-42",
  "updatedAt": "2025-01-15T10:30:00"
}
```

#### 3. Report API (`backend/routes/report.py`)
- `GET /api/report/:ip` - Generates PDF incident report for an IP address

**Features:**
- Summary statistics (first/last seen, event counts)
- Sample payloads
- Full chronological timeline
- Merkle root for tamper-evidence
- Professional formatting with ReportLab

### Frontend Components

#### MerkleBox Component (`client/src/components/MerkleBox.jsx`)
- Displays current Merkle root
- Copy-to-clipboard functionality
- Auto-refreshes every 5 seconds
- Shows event count and batch ID
- Tooltip explaining tamper-evidence

## API Endpoints

### POST /api/analyze
Submit attack event (existing endpoint, now includes hash computation)

**Request:**
```json
{
  "input_text": "User ID: test, Password: ' OR 1=1 --",
  "ip_address": "192.0.2.1"
}
```

**Response:**
```json
{
  "response": { ... },
  "forensics": {
    "detected_type": "SQLi",
    "confidence": 0.95,
    "merkle_root": "abc123..."
  }
}
```

### GET /api/merkle
Get current Merkle root

**Response:**
```json
{
  "merkleRoot": "0xabc123def456...",
  "count": 42,
  "batchId": "batch-42",
  "updatedAt": "2025-01-15T10:30:00"
}
```

### GET /api/report/:ip
Download incident report PDF

**Example:**
```bash
curl -o chameleon-report-192.0.2.1.pdf "http://localhost:5000/api/report/192.0.2.1"
```

**Response:** PDF file stream with `Content-Type: application/pdf`

## Usage Examples

### Testing Merkle Root

```bash
# Get current Merkle root
curl http://localhost:5000/api/merkle

# Submit an attack event
curl -X POST http://localhost:5000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"input_text": "User ID: test, Password: '\'' OR 1=1 --", "ip_address": "192.0.2.1"}'

# Check Merkle root again (should be different)
curl http://localhost:5000/api/merkle
```

### Generating Reports

```bash
# Download report for specific IP
curl -o report.pdf "http://localhost:5000/api/report/192.0.2.1"

# Check if IP has events (404 if none)
curl -v "http://localhost:5000/api/report/192.0.2.1"
```

## Security & Audit Notes

### Tamper-Evidence Mechanism

1. **Event Hashing**: Each event is hashed using SHA-256 of its canonical JSON representation
2. **Merkle Tree**: All event hashes are combined into a Merkle tree
3. **Root Hash**: The Merkle root serves as cryptographic proof of data integrity

**How it works:**
- Any modification to a log entry changes its hash
- Changed hash → different Merkle root
- Analysts can verify integrity by comparing Merkle roots

**Verification:**
```python
# Pseudocode
event_hash = sha256(canonical_json(event))
merkle_root = compute_merkle_root(all_event_hashes)
# If any event changes, merkle_root will be different
```

### Enhanced Security (Optional Next Steps)

1. **External Publication**: Publish Merkle roots to:
   - GitHub Gist (public audit trail)
   - Blockchain transaction (immutable record)
   - Trusted timestamping service

2. **Merkle Proofs**: Extend to provide proof paths for individual events
   - Allows verification of single events without full tree
   - Useful for selective disclosure

3. **Digital Signatures**: Sign Merkle roots with private key
   - Provides non-repudiation
   - Proves report authenticity

### Privacy Considerations

- **Demo Data**: Use synthetic IP addresses and payloads
- **PII Handling**: Do not include real personal information
- **Data Retention**: Implement retention policies for production

## How to Present to Judges

### Live Demo Flow

1. **Show Merkle Box**:
   - Point to MerkleBox component in dashboard
   - Show current Merkle root
   - Click refresh to demonstrate real-time updates

2. **Trigger Attack**:
   - Submit SQLi/XSS payload through login page
   - Watch Merkle root update automatically
   - Explain: "Each attack event changes the root"

3. **Generate Report**:
   - Click "Download Incident Report" on any IP
   - Open PDF and scroll to "Tamper-Evidence" section
   - Point out Merkle root in footer
   - Explain: "This root proves the report data hasn't been tampered with"

4. **Demonstrate Tamper-Evidence**:
   - Show: "If we modify any log entry, the Merkle root changes"
   - This proves data integrity to auditors/judges

### Key Talking Points

- **Cryptographic Proof**: Merkle roots provide mathematical proof of data integrity
- **Real-Time Updates**: Root updates automatically as events stream in
- **Professional Reports**: PDF reports include all forensic data + Merkle root
- **Audit Trail**: Complete chronological timeline with tamper-evidence

## Installation

### Backend Dependencies

```bash
pip install reportlab
```

Already included in `requirements.txt`.

### Frontend

No additional dependencies required. MerkleBox component uses existing React and axios.

## File Structure

```
backend/
├── utils/
│   └── hash.py              # Hash utilities
├── routes/
│   ├── merkle.py            # Merkle root API
│   └── report.py            # PDF report generation
└── main.py                  # Updated to include routers

client/src/
├── components/
│   └── MerkleBox.jsx        # Merkle root display component
└── pages/
    └── Dashboard.jsx        # Updated with MerkleBox integration
```

## Troubleshooting

### PDF Generation Fails

If `reportlab` is not installed:
```bash
pip install reportlab
```

The system will fall back to text-based reports if ReportLab is unavailable.

### Merkle Root is Null

- Check if any events have been logged: `GET /api/logs`
- Merkle root will be `null` if no events exist
- Submit a test attack to generate first root

### CORS Issues

Ensure backend CORS middleware allows your frontend origin:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or specific origins
    ...
)
```

## Future Enhancements

1. **Merkle Proof API**: Generate proof paths for individual events
2. **Root History**: Store historical Merkle roots with timestamps
3. **External Publishing**: Auto-publish roots to GitHub/blockchain
4. **Batch Verification**: Verify multiple events at once
5. **Digital Signatures**: Sign Merkle roots for non-repudiation



