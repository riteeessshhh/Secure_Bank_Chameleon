/**
 * Standalone Node.js script to generate PDF report
 * 
 * Called from Python backend via subprocess
 * 
 * Usage: node generateReport.js <data_file.json>
 * Output: <data_file>.pdf
 */

const fs = require('fs');
const path = require('path');
const { buildIncidentReport } = require('../services/reportGenerator');

// Get data file path from command line
const dataFile = process.argv[2];

if (!dataFile) {
    console.error('Usage: node generateReport.js <data_file.json>');
    process.exit(1);
}

// Read input data
const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

// Generate PDF
buildIncidentReport(data)
    .then(pdfBuffer => {
        // Write PDF to file
        const pdfFile = dataFile.replace('.json', '.pdf');
        fs.writeFileSync(pdfFile, pdfBuffer);
        console.log(`PDF generated: ${pdfFile}`);
        process.exit(0);
    })
    .catch(error => {
        console.error('Error generating PDF:', error);
        process.exit(1);
    });



