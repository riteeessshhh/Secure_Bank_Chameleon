"""
PDF Incident Report generation endpoints.
Enhanced with professional multi-page PDF generation.
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from backend.database import Database
from backend.routes.merkle import get_merkle_root
from datetime import datetime
from io import BytesIO
import json
import subprocess
import os

router = APIRouter()
db = Database()

# Check if Node.js report generator is available
NODE_REPORT_GENERATOR_AVAILABLE = os.path.exists('backend/services/reportGenerator.js')

try:
    from reportlab.lib.pagesizes import letter, A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
    from reportlab.lib import colors
    from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
    REPORTLAB_AVAILABLE = True
except ImportError:
    REPORTLAB_AVAILABLE = False


def generate_minimal_pdf(ip_address: str) -> BytesIO:
    """
    Generate a minimal valid PDF without external dependencies.
    This is a fallback when ReportLab is not available.
    """
    # Get logs for this IP
    all_logs = db.get_logs()
    ip_logs = [log for log in all_logs if log.get('ip_address') == ip_address]
    
    if not ip_logs:
        raise HTTPException(status_code=404, detail=f"No events found for IP: {ip_address}")
    
    # Get Merkle root
    merkle_data = get_merkle_root()
    
    # Create a minimal PDF structure
    # PDF format: %PDF-1.4 header, objects, xref table, trailer
    pdf_content = []
    
    # PDF Header
    pdf_content.append("%PDF-1.4")
    
    # Catalog object (obj 1)
    pdf_content.append("1 0 obj")
    pdf_content.append("<< /Type /Catalog /Pages 2 0 R >>")
    pdf_content.append("endobj")
    
    # Pages object (obj 2)
    pdf_content.append("2 0 obj")
    pdf_content.append("<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
    pdf_content.append("endobj")
    
    # Page object (obj 3)
    pdf_content.append("3 0 obj")
    pdf_content.append("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>")
    pdf_content.append("endobj")
    
    # Content stream (obj 4) - Simple text report
    content_text = f"""
BT
/F1 12 Tf
50 750 Td
(Secure Bank - Forensic Incident Report) Tj
0 -20 Td
(IP Address: {ip_address}) Tj
0 -20 Td
(Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}) Tj
0 -30 Td
(Total Events: {len(ip_logs)}) Tj
0 -20 Td
(First Seen: {ip_logs[0].get('timestamp', 'N/A')[:19] if ip_logs else 'N/A'}) Tj
0 -20 Td
(Last Seen: {ip_logs[-1].get('timestamp', 'N/A')[:19] if ip_logs else 'N/A'}) Tj
0 -30 Td
(Merkle Root: {merkle_data.get('merkleRoot', 'N/A')[:50]}...) Tj
0 -30 Td
(Note: Install reportlab for full-featured reports) Tj
ET
"""
    
    content_stream = content_text.encode('latin-1')
    pdf_content.append("4 0 obj")
    pdf_content.append(f"<< /Length {len(content_stream)} >>")
    pdf_content.append("stream")
    pdf_content.append(content_text)
    pdf_content.append("endstream")
    pdf_content.append("endobj")
    
    # Font object (obj 5) - Helvetica
    pdf_content.append("5 0 obj")
    pdf_content.append("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    pdf_content.append("endobj")
    
    # Build PDF content first to calculate offsets
    pdf_text = '\n'.join(pdf_content)
    pdf_bytes_so_far = pdf_text.encode('latin-1')
    
    # Calculate actual object offsets
    lines = pdf_text.split('\n')
    offsets = {}
    current_offset = 0
    
    for i, line in enumerate(lines):
        if line.strip().endswith('obj'):
            obj_num = int(line.strip().split()[0])
            offsets[obj_num] = current_offset
        current_offset += len(line.encode('latin-1')) + 1  # +1 for newline
    
    # Xref table
    xref_start = len(pdf_bytes_so_far)
    pdf_content.append("xref")
    pdf_content.append("0 6")
    pdf_content.append("0000000000 65535 f ")
    pdf_content.append(f"{offsets.get(1, 0):010d} 00000 n ")
    pdf_content.append(f"{offsets.get(2, 0):010d} 00000 n ")
    pdf_content.append(f"{offsets.get(3, 0):010d} 00000 n ")
    pdf_content.append(f"{offsets.get(4, 0):010d} 00000 n ")
    pdf_content.append(f"{offsets.get(5, 0):010d} 00000 n ")
    
    # Trailer
    trailer_start = len('\n'.join(pdf_content).encode('latin-1'))
    pdf_content.append("trailer")
    pdf_content.append("<< /Size 6 /Root 1 0 R >>")
    pdf_content.append("startxref")
    pdf_content.append(f"{xref_start}")
    pdf_content.append("%%EOF")
    
    # Combine all parts
    pdf_bytes = '\n'.join(pdf_content).encode('latin-1')
    buffer = BytesIO(pdf_bytes)
    buffer.seek(0)
    return buffer


def generate_pdf_report(ip_address: str) -> BytesIO:
    """
    Generate a professional PDF incident report for an IP address.
    
    Args:
        ip_address: IP address to generate report for
        
    Returns:
        BytesIO buffer containing PDF data
    """
    print(f"[PDF REPORT] generate_pdf_report called for IP: {ip_address}")
    print(f"[PDF REPORT] REPORTLAB_AVAILABLE: {REPORTLAB_AVAILABLE}")
    
    if not REPORTLAB_AVAILABLE:
        # Fallback: Generate a minimal valid PDF using raw PDF structure
        # This ensures we always return a valid PDF, even without ReportLab
        print("[PDF REPORT] ReportLab not available, using minimal PDF generator")
        return generate_minimal_pdf(ip_address)
    
    # Get logs for this IP
    all_logs = db.get_logs()
    ip_logs = [log for log in all_logs if log.get('ip_address') == ip_address]
    
    if not ip_logs:
        raise HTTPException(status_code=404, detail=f"No events found for IP: {ip_address}")
    
    # Sort by timestamp
    ip_logs.sort(key=lambda x: x.get('timestamp', ''))
    
    # Get Merkle root
    merkle_data = get_merkle_root()
    
    # Create PDF buffer
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
    
    # Styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#10b981'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=colors.HexColor('#1f2937'),
        spaceAfter=12,
        spaceBefore=12
    )
    
    # Build PDF content
    story = []
    
    # Title
    story.append(Paragraph("Secure Bank", title_style))
    story.append(Paragraph("Forensic Incident Report", styles['Heading2']))
    story.append(Spacer(1, 0.2*inch))
    
    # Report metadata
    story.append(Paragraph(f"<b>IP Address:</b> {ip_address}", styles['Normal']))
    story.append(Paragraph(f"<b>Generated:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}", styles['Normal']))
    story.append(Paragraph(f"<b>Report ID:</b> INC-{ip_address.replace('.', '-')}-{datetime.now().strftime('%Y%m%d')}", styles['Normal']))
    story.append(Spacer(1, 0.3*inch))
    
    # Summary statistics
    first_seen = ip_logs[0].get('timestamp', 'N/A')
    last_seen = ip_logs[-1].get('timestamp', 'N/A')
    
    sqli_count = sum(1 for log in ip_logs if log.get('attack_type') == 'SQLi')
    xss_count = sum(1 for log in ip_logs if log.get('attack_type') == 'XSS')
    benign_count = sum(1 for log in ip_logs if log.get('attack_type') == 'Benign')
    
    story.append(Paragraph("Summary", heading_style))
    summary_data = [
        ['First Seen', first_seen],
        ['Last Seen', last_seen],
        ['Total Events', str(len(ip_logs))],
        ['SQL Injection', str(sqli_count)],
        ['XSS Attacks', str(xss_count)],
        ['Benign Traffic', str(benign_count)]
    ]
    summary_table = Table(summary_data, colWidths=[2*inch, 4*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#f3f4f6')),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey)
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 0.3*inch))
    
    # Sample payloads
    story.append(Paragraph("Sample Payloads", heading_style))
    sample_payloads = ip_logs[:5]  # First 5 as samples
    for i, log in enumerate(sample_payloads, 1):
        payload = log.get('input_payload', 'N/A')[:100]  # Truncate long payloads
        attack_type = log.get('attack_type', 'Unknown')
        story.append(Paragraph(f"<b>{i}. [{attack_type}]</b> {payload}", styles['Normal']))
        story.append(Spacer(1, 0.1*inch))
    
    if len(ip_logs) > 5:
        story.append(Paragraph(f"... and {len(ip_logs) - 5} more events", styles['Italic']))
    
    story.append(PageBreak())
    
    # Full chronological timeline
    story.append(Paragraph("Chronological Timeline", heading_style))
    
    timeline_data = [['Timestamp', 'Type', 'Payload', 'Strategy']]
    for log in ip_logs:
        timestamp = log.get('timestamp', 'N/A')
        if len(timestamp) > 19:
            timestamp = timestamp[:19]  # Truncate to readable format
        
        attack_type = log.get('attack_type', 'Unknown')
        payload = log.get('input_payload', 'N/A')
        if len(payload) > 40:
            payload = payload[:37] + "..."
        
        strategy = log.get('deception_strategy', 'N/A')
        if len(strategy) > 30:
            strategy = strategy[:27] + "..."
        
        timeline_data.append([timestamp, attack_type, payload, strategy])
    
    timeline_table = Table(timeline_data, colWidths=[1.5*inch, 0.8*inch, 2.5*inch, 1.2*inch], repeatRows=1)
    timeline_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1f2937')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('GRID', (0, 0), (-1, -1), 1, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f9fafb')])
    ]))
    story.append(timeline_table)
    story.append(Spacer(1, 0.3*inch))
    
    # Merkle root for tamper-evidence
    story.append(Paragraph("Tamper-Evidence", heading_style))
    story.append(Paragraph(
        "This report was generated from log data protected by a Merkle tree. "
        "The Merkle root below serves as cryptographic proof of data integrity.",
        styles['Normal']
    ))
    story.append(Spacer(1, 0.1*inch))
    story.append(Paragraph(f"<b>Merkle Root:</b>", styles['Normal']))
    story.append(Paragraph(
        f"<font face='Courier' size='8'>{merkle_data.get('merkleRoot', 'N/A')}</font>",
        styles['Normal']
    ))
    story.append(Paragraph(f"<b>Events Included:</b> {merkle_data.get('count', 0)}", styles['Normal']))
    story.append(Paragraph(f"<b>Batch ID:</b> {merkle_data.get('batchId', 'N/A')}", styles['Normal']))
    story.append(Spacer(1, 0.2*inch))
    
    # Footer
    story.append(Spacer(1, 0.3*inch))
    story.append(Paragraph(
        "This report is generated automatically by Secure Bank Forensic Dashboard. "
        "Any modification to the underlying log data will result in a different Merkle root.",
        ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8, textColor=colors.grey, alignment=TA_CENTER)
    ))
    
    # Build PDF
    doc.build(story)
    buffer.seek(0)
    return buffer


async def generate_report_nodejs(ip_address: str):
    """
    Generate report using Node.js service (better chart rendering).
    
    This calls a Node.js script that uses jsPDF and chartjs-node-canvas.
    """
    # Get events from database
    all_logs = db.get_logs()
    ip_logs = [log for log in all_logs if log.get('ip_address') == ip_address]
    
    if not ip_logs:
        raise HTTPException(status_code=404, detail=f"No events found for IP: {ip_address}")
    
    # Sort by timestamp (newest first)
    ip_logs.sort(key=lambda x: x.get('timestamp', ''), reverse=True)
    
    # Get Merkle root
    merkle_data = get_merkle_root()
    merkle_root = merkle_data.get('merkleRoot', '')
    
    # Calculate stats
    stats = calculate_stats_for_report(ip_logs, all_logs)
    
    # Prepare data for Node.js script
    import tempfile
    
    data_file = tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.json')
    json.dump({
        'ipAddress': ip_address,
        'events': ip_logs,
        'merkleRoot': merkle_root,
        'stats': stats
    }, data_file, default=str)
    data_file.close()
    
    try:
        # Call Node.js script
        script_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'scripts', 'generateReport.js')
        result = subprocess.run(
            ['node', script_path, data_file.name],
            capture_output=True,
            timeout=30,
            cwd=os.getcwd()
        )
        
        if result.returncode != 0:
            error_msg = result.stderr.decode() if result.stderr else 'Unknown error'
            raise Exception(f"Node.js script failed: {error_msg}")
        
        # Read generated PDF
        pdf_path = data_file.name.replace('.json', '.pdf')
        if os.path.exists(pdf_path):
            with open(pdf_path, 'rb') as f:
                pdf_data = f.read()
            os.unlink(pdf_path)
            os.unlink(data_file.name)
            
            filename = f"securebank-report-{ip_address.replace('.', '-')}-{datetime.now().strftime('%Y-%m-%d')}.pdf"
            
            return StreamingResponse(
                BytesIO(pdf_data),
                media_type="application/pdf",
                headers={
                    "Content-Disposition": f'attachment; filename="{filename}"'
                }
            )
        else:
            raise Exception("PDF file not generated")
            
    except subprocess.TimeoutExpired:
        if os.path.exists(data_file.name):
            os.unlink(data_file.name)
        raise HTTPException(status_code=500, detail="Report generation timeout")
    except Exception as e:
        if os.path.exists(data_file.name):
            os.unlink(data_file.name)
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")


def calculate_stats_for_report(ip_logs, all_logs):
    """Calculate statistics for the report"""
    # Top IPs
    ip_stats = {}
    for log in all_logs:
        ip = log.get('ip_address')
        if not ip:
            continue
        if ip not in ip_stats:
            ip_stats[ip] = {'ip': ip, 'total': 0, 'sqli': 0, 'xss': 0, 'benign': 0}
        ip_stats[ip]['total'] += 1
        attack_type = log.get('attack_type', 'Benign')
        if attack_type == 'SQLi':
            ip_stats[ip]['sqli'] += 1
        elif attack_type == 'XSS':
            ip_stats[ip]['xss'] += 1
        else:
            ip_stats[ip]['benign'] += 1
    
    top_ips = sorted(ip_stats.values(), key=lambda x: x['total'], reverse=True)[:10]
    
    # Strategy distribution
    strategy_counts = {}
    for log in ip_logs:
        strategy = log.get('deception_strategy', 'Unknown')
        strategy_counts[strategy] = strategy_counts.get(strategy, 0) + 1
    
    strategies = [{'strategy': k, 'count': v} for k, v in sorted(strategy_counts.items(), key=lambda x: x[1], reverse=True)]
    
    # Geographic (placeholder - implement with geo lookup)
    geographic = [
        {'country': 'United States', 'count': max(1, len(ip_logs) // 3)},
        {'country': 'China', 'count': max(1, len(ip_logs) // 5)},
        {'country': 'Russia', 'count': max(1, len(ip_logs) // 7)},
        {'country': 'Germany', 'count': max(1, len(ip_logs) // 10)},
        {'country': 'United Kingdom', 'count': max(1, len(ip_logs) // 12)},
        {'country': 'France', 'count': max(1, len(ip_logs) // 15)},
        {'country': 'Japan', 'count': max(1, len(ip_logs) // 20)},
        {'country': 'Brazil', 'count': max(1, len(ip_logs) // 25)}
    ]
    geographic = [g for g in geographic if g['count'] > 0]
    geographic.sort(key=lambda x: x['count'], reverse=True)
    
    return {
        'topIPs': top_ips,
        'strategies': strategies,
        'geographic': geographic[:8]
    }


@router.get("/api/report/{ip_address}")
async def get_incident_report(ip_address: str):
    """
    Generate and download professional multi-page PDF incident report for an IP address.
    
    Tries Node.js generator first (better charts), falls back to Python ReportLab.
    
    Args:
        ip_address: IP address to generate report for
        
    Returns:
        PDF file stream
    """
    print(f"[PDF REPORT] Generating report for IP: {ip_address}")
    print(f"[PDF REPORT] ReportLab available: {REPORTLAB_AVAILABLE}")
    print(f"[PDF REPORT] Node.js generator available: {NODE_REPORT_GENERATOR_AVAILABLE}")
    
    # Try Node.js generator first (if available)
    if NODE_REPORT_GENERATOR_AVAILABLE:
        try:
            print("[PDF REPORT] Attempting Node.js generator...")
            return await generate_report_nodejs(ip_address)
        except Exception as e:
            print(f"[PDF REPORT] Node.js generator failed: {e}")
            # Fall through to Python implementation
    
    # Python ReportLab implementation (existing)
    try:
        print("[PDF REPORT] Using Python ReportLab generator...")
        pdf_buffer = generate_pdf_report(ip_address)
        filename = f"securebank-report-{ip_address.replace('.', '-')}-{datetime.now().strftime('%Y-%m-%d')}.pdf"
        
        # Ensure buffer is at the start
        pdf_buffer.seek(0)
        
        # Verify it's a valid PDF
        pdf_data = pdf_buffer.read()
        print(f"[PDF REPORT] Generated PDF size: {len(pdf_data)} bytes")
        print(f"[PDF REPORT] PDF starts with: {pdf_data[:10]}")
        
        if not pdf_data.startswith(b'%PDF'):
            # If not a valid PDF, something went wrong
            error_msg = f"Generated file is not a valid PDF. First 50 bytes: {pdf_data[:50]}"
            print(f"[PDF REPORT] ERROR: {error_msg}")
            raise HTTPException(status_code=500, detail=error_msg)
        
        pdf_buffer.seek(0)  # Reset for streaming
        
        print(f"[PDF REPORT] Returning valid PDF: {len(pdf_data)} bytes")
        return StreamingResponse(
            pdf_buffer,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=\"{filename}\"",
                "Content-Length": str(len(pdf_data))
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"[PDF REPORT] Error generating PDF: {e}")
        print(f"[PDF REPORT] Traceback:\n{error_trace}")
        raise HTTPException(status_code=500, detail=f"Error generating report: {str(e)}")

