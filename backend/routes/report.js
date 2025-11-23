/**
 * Professional PDF Report Generation Routes
 * 
 * GET /api/report/:ip - Generate and stream multi-page PDF report
 */

const express = require('express');
const router = express.Router();
const { buildIncidentReport } = require('../services/reportGenerator');
const dayjs = require('dayjs');

// In-memory store (replace with your actual database)
// This should match your existing event store
let eventsStore = [];
let merkleStore = {};

/**
 * GET /api/report/:ip
 * 
 * Generate professional multi-page PDF report for an IP address
 */
router.get('/api/report/:ip', async (req, res) => {
    try {
        const ipAddress = req.params.ip;
        
        // Load events for this IP from your store
        // Replace this with your actual database query
        const events = eventsStore.filter(event => event.ip_address === ipAddress);
        
        if (!events || events.length === 0) {
            return res.status(404).json({
                error: 'Not Found',
                message: `No events found for IP address: ${ipAddress}`
            });
        }
        
        // Sort events by timestamp (newest first)
        events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        // Get Merkle root for this IP (or global)
        const merkleRoot = merkleStore[ipAddress] || merkleStore.global || '';
        
        // Calculate statistics
        const stats = calculateStats(events, eventsStore);
        
        // Generate PDF
        const pdfBuffer = await buildIncidentReport({
            ipAddress,
            events,
            merkleRoot,
            stats
        });
        
        // Generate filename
        const filename = `securebank-report-${ipAddress.replace(/\./g, '-')}-${dayjs().format('YYYY-MM-DD')}.pdf`;
        
        // Set headers for PDF download
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        
        // Stream PDF to client
        res.send(pdfBuffer);
        
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to generate report',
            details: error.message
        });
    }
});

/**
 * Calculate statistics for the report
 */
function calculateStats(ipEvents, allEvents) {
    // Top IPs (from all events)
    const ipStats = {};
    allEvents.forEach(event => {
        const ip = event.ip_address;
        if (!ipStats[ip]) {
            ipStats[ip] = { ip, total: 0, sqli: 0, xss: 0, benign: 0 };
        }
        ipStats[ip].total++;
        if (event.attack_type === 'SQLi') ipStats[ip].sqli++;
        else if (event.attack_type === 'XSS') ipStats[ip].xss++;
        else ipStats[ip].benign++;
    });
    
    const topIPs = Object.values(ipStats)
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);
    
    // Strategy distribution
    const strategyCounts = {};
    ipEvents.forEach(event => {
        const strategy = event.deception_strategy || 'Unknown';
        strategyCounts[strategy] = (strategyCounts[strategy] || 0) + 1;
    });
    
    const strategies = Object.entries(strategyCounts)
        .map(([strategy, count]) => ({ strategy, count }))
        .sort((a, b) => b.count - a.count);
    
    // Geographic distribution (placeholder - implement with geo lookup)
    const geographic = [
        { country: 'United States', count: Math.floor(ipEvents.length * 0.4) },
        { country: 'China', count: Math.floor(ipEvents.length * 0.2) },
        { country: 'Russia', count: Math.floor(ipEvents.length * 0.15) },
        { country: 'Germany', count: Math.floor(ipEvents.length * 0.1) },
        { country: 'United Kingdom', count: Math.floor(ipEvents.length * 0.08) },
        { country: 'France', count: Math.floor(ipEvents.length * 0.05) },
        { country: 'Japan', count: Math.floor(ipEvents.length * 0.015) },
        { country: 'Brazil', count: Math.floor(ipEvents.length * 0.005) }
    ].filter(g => g.count > 0)
     .sort((a, b) => b.count - a.count);
    
    return {
        topIPs,
        strategies,
        geographic
    };
}

module.exports = router;



