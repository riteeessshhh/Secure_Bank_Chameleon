/**
 * Professional Multi-Page PDF Report Generator
 * 
 * Generates enterprise-grade, judge-ready incident reports with:
 * - Title page with executive summary
 * - Confidential watermark
 * - Attack overview
 * - Charts (timeline, distribution, geographic)
 * - Tables (top IPs, timeline)
 * - Notes & Evidence page
 */

const jsPDF = require('jspdf').jsPDF;
const autoTable = require('jspdf-autotable');
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const dayjs = require('dayjs');

// Chart configuration
const chartWidth = 500;
const chartHeight = 300;
const chartBackgroundColor = '#ffffff';

/**
 * Generate a professional incident report PDF
 * 
 * @param {Object} params - Report parameters
 * @param {string} params.ipAddress - Target IP address
 * @param {Array} params.events - Array of attack events
 * @param {string} params.merkleRoot - Merkle root for tamper evidence
 * @param {Object} params.stats - Statistics object
 * @returns {Buffer} PDF buffer
 */
async function buildIncidentReport({ ipAddress, events, merkleRoot, stats }) {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'letter'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const contentWidth = pageWidth - (margin * 2);

    // Colors
    const colors = {
        primary: '#1e40af',      // Blue
        secondary: '#64748b',    // Gray
        danger: '#dc2626',       // Red
        warning: '#d97706',      // Orange
        success: '#059669',      // Green
        dark: '#1e293b',         // Dark blue-gray
        light: '#f1f5f9'         // Light gray
    };

    // Helper: Add watermark
    function addWatermark() {
        doc.setTextColor(200, 200, 200);
        doc.setFontSize(60);
        doc.setGState(doc.GState({ opacity: 0.1 }));
        doc.text('CONFIDENTIAL', pageWidth / 2, pageHeight / 2, {
            align: 'center',
            angle: 45
        });
        doc.setGState(doc.GState({ opacity: 1 }));
        doc.setTextColor(0, 0, 0);
    }

    // Helper: Add header
    function addHeader(pageNum, totalPages) {
        doc.setFillColor(30, 64, 175); // Blue
        doc.rect(0, 0, pageWidth, 60, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Secure Bank - Forensic Incident Report', margin, 35);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin - 50, 35);
        
        // Reset text color
        doc.setTextColor(0, 0, 0);
    }

    // Helper: Add footer
    function addFooter() {
        const footerY = pageHeight - 30;
        doc.setDrawColor(200, 200, 200);
        doc.line(margin, footerY, pageWidth - margin, footerY);
        
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text(
            `Generated: ${dayjs().format('YYYY-MM-DD HH:mm:ss')} | Secure Bank Forensic System`,
            pageWidth / 2,
            footerY + 15,
            { align: 'center' }
        );
        doc.setTextColor(0, 0, 0);
    }

    // PAGE 1: Title Page
    doc.addPage();
    addWatermark();
    addHeader(1, 1);
    
    let yPos = 120;
    
    // Title
    doc.setFontSize(32);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.dark);
    doc.text('INCIDENT REPORT', pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 50;
    doc.setFontSize(18);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.secondary);
    doc.text('Forensic Analysis & Evidence Documentation', pageWidth / 2, yPos, { align: 'center' });
    
    yPos += 80;
    
    // Executive Summary Box
    doc.setFillColor(colors.light);
    doc.roundedRect(margin, yPos, contentWidth, 200, 5, 5, 'F');
    doc.setDrawColor(colors.primary);
    doc.setLineWidth(2);
    doc.roundedRect(margin, yPos, contentWidth, 200, 5, 5, 'S');
    
    yPos += 30;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.dark);
    doc.text('EXECUTIVE SUMMARY', margin + 20, yPos);
    
    yPos += 30;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.dark);
    
    const summaryLines = [
        `Target IP Address: ${ipAddress}`,
        `Total Events Recorded: ${events.length}`,
        `First Seen: ${events.length > 0 ? dayjs(events[events.length - 1].timestamp).format('YYYY-MM-DD HH:mm:ss') : 'N/A'}`,
        `Last Seen: ${events.length > 0 ? dayjs(events[0].timestamp).format('YYYY-MM-DD HH:mm:ss') : 'N/A'}`,
        `Merkle Root: ${merkleRoot ? merkleRoot.substring(0, 32) + '...' : 'N/A'}`
    ];
    
    summaryLines.forEach(line => {
        doc.text(line, margin + 20, yPos);
        yPos += 20;
    });
    
    yPos += 30;
    doc.setFontSize(9);
    doc.setTextColor(colors.secondary);
    doc.text('This report contains confidential forensic evidence. Distribution is restricted to authorized personnel only.', margin + 20, yPos, { maxWidth: contentWidth - 40 });
    
    addFooter();
    
    // PAGE 2: Attack Overview
    doc.addPage();
    addWatermark();
    addHeader(2, 1);
    
    yPos = 100;
    
    // Section Title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.dark);
    doc.text('ATTACK OVERVIEW', margin, yPos);
    
    yPos += 40;
    
    // Attack Overview Table
    const overviewData = [
        ['Attacker IP', ipAddress],
        ['Total Events', events.length.toString()],
        ['First Detected', events.length > 0 ? dayjs(events[events.length - 1].timestamp).format('YYYY-MM-DD HH:mm:ss') : 'N/A'],
        ['Last Detected', events.length > 0 ? dayjs(events[0].timestamp).format('YYYY-MM-DD HH:mm:ss') : 'N/A'],
        ['Merkle Root (Full)', merkleRoot || 'N/A'],
        ['Merkle Root (Short)', merkleRoot ? merkleRoot.substring(0, 16) + '...' : 'N/A']
    ];
    
    autoTable(doc, {
        startY: yPos,
        head: [['Property', 'Value']],
        body: overviewData,
        theme: 'striped',
        headStyles: {
            fillColor: [30, 64, 175],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        styles: {
            fontSize: 10,
            cellPadding: 8
        },
        margin: { left: margin, right: margin }
    });
    
    yPos = doc.lastAutoTable.finalY + 30;
    
    // Attack Type Breakdown
    if (stats) {
        const attackTypes = {};
        events.forEach(event => {
            const type = event.attack_type || 'Unknown';
            attackTypes[type] = (attackTypes[type] || 0) + 1;
        });
        
        const breakdownData = Object.entries(attackTypes).map(([type, count]) => [
            type,
            count.toString(),
            `${((count / events.length) * 100).toFixed(1)}%`
        ]);
        
        yPos += 20;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Attack Type Breakdown', margin, yPos);
        
        yPos += 20;
        
        autoTable(doc, {
            startY: yPos,
            head: [['Attack Type', 'Count', 'Percentage']],
            body: breakdownData,
            theme: 'striped',
            headStyles: {
                fillColor: [30, 64, 175],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            styles: {
                fontSize: 10,
                cellPadding: 8
            },
            margin: { left: margin, right: margin }
        });
    }
    
    addFooter();
    
    // PAGE 3: Top Attacking IPs Table
    if (stats && stats.topIPs && stats.topIPs.length > 0) {
        doc.addPage();
        addWatermark();
        addHeader(3, 1);
        
        yPos = 100;
        
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('TOP 10 ATTACKING IP ADDRESSES', margin, yPos);
        
        yPos += 30;
        
        const topIPsData = stats.topIPs.slice(0, 10).map((ipData, index) => [
            (index + 1).toString(),
            ipData.ip,
            ipData.total.toString(),
            ipData.sqli.toString(),
            ipData.xss.toString(),
            ipData.benign.toString()
        ]);
        
        autoTable(doc, {
            startY: yPos,
            head: [['Rank', 'IP Address', 'Total', 'SQLi', 'XSS', 'Benign']],
            body: topIPsData,
            theme: 'striped',
            headStyles: {
                fillColor: [30, 64, 175],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            columnStyles: {
                0: { cellWidth: 40 },
                1: { cellWidth: 120 },
                2: { cellWidth: 60 },
                3: { cellWidth: 60 },
                4: { cellWidth: 60 },
                5: { cellWidth: 60 }
            },
            styles: {
                fontSize: 9,
                cellPadding: 6
            },
            margin: { left: margin, right: margin }
        });
        
        addFooter();
    }
    
    // PAGE 4: Timeline Chart
    if (events.length > 0) {
        doc.addPage();
        addWatermark();
        addHeader(4, 1);
        
        yPos = 100;
        
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('ATTACK TIMELINE', margin, yPos);
        
        yPos += 30;
        
        // Generate timeline data
        const timelineData = generateTimelineData(events);
        
        // Create chart
        const chart = await createTimelineChart(timelineData);
        
        // Add chart to PDF
        doc.addImage(chart, 'PNG', margin, yPos, contentWidth, 250);
        
        addFooter();
    }
    
    // PAGE 5: Strategy Distribution Chart
    if (stats && stats.strategies && stats.strategies.length > 0) {
        doc.addPage();
        addWatermark();
        addHeader(5, 1);
        
        yPos = 100;
        
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('DECEPTION STRATEGY DISTRIBUTION', margin, yPos);
        
        yPos += 30;
        
        // Create pie chart
        const pieChart = await createStrategyPieChart(stats.strategies);
        
        // Add chart to PDF
        doc.addImage(pieChart, 'PNG', margin, yPos, contentWidth, 300);
        
        addFooter();
    }
    
    // PAGE 6: Geographic Distribution (if available)
    if (stats && stats.geographic && stats.geographic.length > 0) {
        doc.addPage();
        addWatermark();
        addHeader(6, 1);
        
        yPos = 100;
        
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('GEOGRAPHIC DISTRIBUTION (TOP 8 COUNTRIES)', margin, yPos);
        
        yPos += 30;
        
        // Create bar chart
        const geoChart = await createGeographicChart(stats.geographic.slice(0, 8));
        
        // Add chart to PDF
        doc.addImage(geoChart, 'PNG', margin, yPos, contentWidth, 300);
        
        addFooter();
    }
    
    // PAGE 7: Event Timeline Table
    if (events.length > 0) {
        doc.addPage();
        addWatermark();
        addHeader(7, 1);
        
        yPos = 100;
        
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('EVENT TIMELINE (LAST 20 EVENTS)', margin, yPos);
        
        yPos += 30;
        
        const timelineTableData = events.slice(0, 20).map(event => [
            dayjs(event.timestamp).format('YYYY-MM-DD HH:mm:ss'),
            event.attack_type || 'Unknown',
            (event.confidence * 100).toFixed(1) + '%',
            event.deception_strategy || 'N/A',
            truncateText(event.input_payload || '', 50)
        ]);
        
        autoTable(doc, {
            startY: yPos,
            head: [['Timestamp', 'Type', 'Confidence', 'Strategy', 'Payload']],
            body: timelineTableData,
            theme: 'striped',
            headStyles: {
                fillColor: [30, 64, 175],
                textColor: [255, 255, 255],
                fontStyle: 'bold'
            },
            columnStyles: {
                0: { cellWidth: 120 },
                1: { cellWidth: 60 },
                2: { cellWidth: 60 },
                3: { cellWidth: 100 },
                4: { cellWidth: 200 }
            },
            styles: {
                fontSize: 8,
                cellPadding: 4
            },
            margin: { left: margin, right: margin },
            didDrawPage: (data) => {
                addHeader(data.pageNumber, data.totalPages);
                addFooter();
            }
        });
    }
    
    // PAGE 8: Notes & Evidence
    doc.addPage();
    addWatermark();
    addHeader(8, 1);
    
    yPos = 100;
    
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('NOTES & EVIDENCE', margin, yPos);
    
    yPos += 40;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    const notes = [
        '1. All events have been cryptographically hashed using SHA-256 and included in the Merkle tree.',
        '2. The Merkle root provides tamper-evidence: any modification to logged events will change the root.',
        '3. This report is generated from forensic logs and is admissible as evidence.',
        '4. All timestamps are in UTC format.',
        '5. Payloads may be truncated for readability. Full payloads are available in the database.',
        '6. Deception strategies were applied to delay and mislead attackers.',
        '7. This report should be stored securely and shared only with authorized personnel.',
        '',
        `Report Generated: ${dayjs().format('YYYY-MM-DD HH:mm:ss UTC')}`,
        `Merkle Root (Full): ${merkleRoot || 'N/A'}`,
        `Total Events Analyzed: ${events.length}`,
        `Report Version: 1.0`
    ];
    
    notes.forEach(note => {
        if (yPos > pageHeight - 80) {
            doc.addPage();
            addWatermark();
            addHeader(doc.internal.getNumberOfPages(), 1);
            yPos = 100;
        }
        doc.text(note, margin, yPos, { maxWidth: contentWidth });
        yPos += 20;
    });
    
    addFooter();
    
    // Update all page headers with total page count
    const totalPages = doc.internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(255, 255, 255);
        doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 50, 35);
        doc.setTextColor(0, 0, 0);
    }
    
    // Return as Buffer
    return Buffer.from(doc.output('arraybuffer'));
}

/**
 * Generate timeline data from events
 */
function generateTimelineData(events) {
    const hours = {};
    const now = dayjs();
    
    // Group events by hour (last 24 hours)
    for (let i = 23; i >= 0; i--) {
        const hour = now.subtract(i, 'hour');
        const hourKey = hour.format('YYYY-MM-DD HH:00');
        hours[hourKey] = { sqli: 0, xss: 0, benign: 0, total: 0 };
    }
    
    events.forEach(event => {
        const eventTime = dayjs(event.timestamp);
        const hoursAgo = now.diff(eventTime, 'hour');
        
        if (hoursAgo >= 0 && hoursAgo < 24) {
            const hourKey = eventTime.format('YYYY-MM-DD HH:00');
            if (hours[hourKey]) {
                hours[hourKey].total++;
                if (event.attack_type === 'SQLi') hours[hourKey].sqli++;
                else if (event.attack_type === 'XSS') hours[hourKey].xss++;
                else hours[hourKey].benign++;
            }
        }
    });
    
    return Object.entries(hours).map(([hour, data]) => ({
        hour: dayjs(hour).format('HH:00'),
        ...data
    }));
}

/**
 * Create timeline line chart
 */
async function createTimelineChart(data) {
    const chartJSNodeCanvas = new ChartJSNodeCanvas({
        width: chartWidth,
        height: chartHeight,
        backgroundColour: chartBackgroundColor
    });
    
    const configuration = {
        type: 'line',
        data: {
            labels: data.map(d => d.hour),
            datasets: [
                {
                    label: 'SQLi',
                    data: data.map(d => d.sqli),
                    borderColor: 'rgb(220, 38, 38)',
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'XSS',
                    data: data.map(d => d.xss),
                    borderColor: 'rgb(217, 119, 6)',
                    backgroundColor: 'rgba(217, 119, 6, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Benign',
                    data: data.map(d => d.benign),
                    borderColor: 'rgb(5, 150, 105)',
                    backgroundColor: 'rgba(5, 150, 105, 0.1)',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top'
                },
                title: {
                    display: true,
                    text: 'Attack Timeline (Last 24 Hours)',
                    font: { size: 16, weight: 'bold' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    };
    
    return await chartJSNodeCanvas.renderToBuffer(configuration);
}

/**
 * Create strategy distribution pie chart
 */
async function createStrategyPieChart(strategies) {
    const chartJSNodeCanvas = new ChartJSNodeCanvas({
        width: chartWidth,
        height: chartHeight,
        backgroundColour: chartBackgroundColor
    });
    
    const configuration = {
        type: 'pie',
        data: {
            labels: strategies.map(s => s.strategy),
            datasets: [{
                data: strategies.map(s => s.count),
                backgroundColor: [
                    'rgb(220, 38, 38)',
                    'rgb(217, 119, 6)',
                    'rgb(5, 150, 105)',
                    'rgb(30, 64, 175)',
                    'rgb(139, 92, 246)',
                    'rgb(236, 72, 153)'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                },
                title: {
                    display: true,
                    text: 'Deception Strategy Distribution',
                    font: { size: 16, weight: 'bold' }
                }
            }
        }
    };
    
    return await chartJSNodeCanvas.renderToBuffer(configuration);
}

/**
 * Create geographic distribution bar chart
 */
async function createGeographicChart(geographic) {
    const chartJSNodeCanvas = new ChartJSNodeCanvas({
        width: chartWidth,
        height: chartHeight,
        backgroundColour: chartBackgroundColor
    });
    
    const configuration = {
        type: 'bar',
        data: {
            labels: geographic.map(g => g.country),
            datasets: [{
                label: 'Attack Count',
                data: geographic.map(g => g.count),
                backgroundColor: 'rgb(30, 64, 175)'
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                },
                title: {
                    display: true,
                    text: 'Geographic Distribution (Top 8 Countries)',
                    font: { size: 16, weight: 'bold' }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    };
    
    return await chartJSNodeCanvas.renderToBuffer(configuration);
}

/**
 * Truncate text for table display
 */
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
}

module.exports = {
    buildIncidentReport
};



