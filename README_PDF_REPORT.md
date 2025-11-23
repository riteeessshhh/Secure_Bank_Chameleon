# Professional PDF Report Generator

Enterprise-grade, multi-page PDF incident reports with charts, tables, and tamper-evidence.

## Installation

### Backend Dependencies

```bash
npm install jspdf jspdf-autotable chart.js chartjs-node-canvas dayjs
```

Or if using Python backend, you'll need to create a Node.js microservice or use Python alternatives:

**Python Alternative Packages:**
```bash
pip install reportlab matplotlib pandas
```

## Architecture

### Node.js Implementation (Recommended)

The report generator is implemented in Node.js for better chart rendering capabilities. You can:

1. **Option A**: Run as a separate microservice
2. **Option B**: Integrate into existing Node.js backend
3. **Option C**: Use Python alternatives (see below)

### Python Integration

If you're using Python FastAPI, you can:

1. Call the Node.js service via HTTP
2. Use Python PDF libraries (ReportLab + Matplotlib)

## File Structure

```
backend/
  services/
    reportGenerator.js      # Main PDF generator
    geoLookupExample.js     # IP geolocation examples
  routes/
    report.js               # Express route handler
    report.py               # FastAPI route (Python version)
```

## API Endpoints

### GET /api/report/:ip

Generate and download PDF report for an IP address.

**Example:**
```bash
curl -o report.pdf "http://localhost:5000/api/report/192.168.1.100"
```

**Response:**
- Content-Type: `application/pdf`
- Content-Disposition: `attachment; filename="securebank-report-192-168-1-100-2025-01-15.pdf"`
- Binary PDF stream

**Error Responses:**
- `404`: No events found for IP
- `500`: Server error during generation

## Report Contents

The generated PDF includes:

1. **Title Page**
   - Executive summary box
   - Confidential watermark
   - Key metrics

2. **Attack Overview**
   - Attacker IP details
   - Event count
   - First/Last seen timestamps
   - Merkle Root (full and short)

3. **Top 10 Attacking IPs Table**
   - Ranked by total attacks
   - Breakdown by attack type

4. **Attack Timeline Chart**
   - Line chart showing attacks over last 24 hours
   - Separate lines for SQLi, XSS, Benign

5. **Deception Strategy Distribution**
   - Pie chart showing strategy usage

6. **Geographic Distribution**
   - Bar chart of top 8 countries
   - Requires IP geolocation (see geoLookupExample.js)

7. **Event Timeline Table**
   - Last 20 events with full details
   - Auto-paginated if needed

8. **Notes & Evidence**
   - Tamper-evidence information
   - Merkle root documentation
   - Report metadata

## Configuration

### Environment Variables

```bash
# Optional: For geographic lookup
GEOIP_API_KEY=your_api_key
GEOIP_SERVICE=maxmind  # or 'ipapi', 'geoip-lite'
```

### Memory Considerations

**Chart Rendering:**
- `chartjs-node-canvas` uses significant memory for chart generation
- Each chart is ~500x300px PNG
- Recommended: 512MB+ available memory per request

**Optimization Tips:**
1. Cache generated charts for same data
2. Use lower resolution for charts (reduce chartWidth/chartHeight)
3. Limit concurrent report generations
4. Consider queue system for high-volume scenarios

## Testing

### Test with curl

```bash
# Generate report for specific IP
curl -o report.pdf "http://localhost:5000/api/report/192.168.1.100"

# Check if file was created
ls -lh report.pdf

# View PDF (Linux/Mac)
open report.pdf
```

### Test with Postman

1. Set method to GET
2. URL: `http://localhost:5000/api/report/192.168.1.100`
3. Send and Download
4. Save as PDF

### Test in Browser

```javascript
// Open browser console and run:
fetch('http://localhost:5000/api/report/192.168.1.100')
  .then(res => res.blob())
  .then(blob => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'report.pdf';
    a.click();
  });
```

## Integration with Python Backend

If using FastAPI, create a route that calls the Node.js service:

```python
# backend/routes/report.py (Python)
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import httpx

router = APIRouter()

@router.get("/api/report/{ip}")
async def get_report(ip: str):
    try:
        # Call Node.js service
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"http://localhost:4000/api/report/{ip}",
                timeout=60.0
            )
            
            if response.status_code == 404:
                raise HTTPException(status_code=404, detail="No events found")
            
            return StreamingResponse(
                iter([response.content]),
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f'attachment; filename="securebank-report-{ip.replace(".", "-")}.pdf"'
                }
            )
    except httpx.RequestError:
        raise HTTPException(status_code=500, detail="Report service unavailable")
```

## Python Alternative (ReportLab)

If you prefer pure Python, use ReportLab + Matplotlib:

```python
# Install: pip install reportlab matplotlib pandas pillow

from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors
import matplotlib.pyplot as plt
import io

def generate_pdf_python(ip_address, events, merkle_root):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter)
    
    # Build PDF content
    story = []
    styles = getSampleStyleSheet()
    
    # Title
    story.append(Paragraph("INCIDENT REPORT", styles['Title']))
    story.append(Spacer(1, 12))
    
    # Add charts using matplotlib
    # ... (similar structure to Node.js version)
    
    doc.build(story)
    buffer.seek(0)
    return buffer
```

## Performance

**Typical Generation Time:**
- Small reports (< 50 events): 2-5 seconds
- Medium reports (50-200 events): 5-10 seconds
- Large reports (200+ events): 10-20 seconds

**Optimization:**
- Cache Merkle roots
- Pre-generate common reports
- Use background jobs for large reports

## Security

1. **Input Validation**: IP addresses are validated
2. **Rate Limiting**: Implement rate limiting on report generation
3. **Access Control**: Restrict report generation to authorized users
4. **Data Sanitization**: Payloads are truncated in tables
5. **Watermarking**: Confidential watermark on all pages

## Troubleshooting

### "Module not found" errors

```bash
# Ensure all dependencies are installed
npm install jspdf jspdf-autotable chart.js chartjs-node-canvas dayjs
```

### Charts not rendering

- Check that `chartjs-node-canvas` is properly installed
- Verify Canvas dependencies (may need system libraries)
- Check server memory availability

### PDF generation fails

- Check server logs for errors
- Verify events data structure matches expected format
- Ensure Merkle root is available

### Memory issues

- Reduce chart resolution
- Limit concurrent report generations
- Increase server memory allocation

## License

Same as main project.



