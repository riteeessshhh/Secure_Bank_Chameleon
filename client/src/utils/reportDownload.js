/**
 * Report Download Utility
 * 
 * Downloads professional PDF incident reports from the backend.
 */

import axios from 'axios';

/**
 * Download incident report PDF for a specific IP address
 * 
 * @param {string} ipAddress - IP address to generate report for
 * @param {string} apiUrl - Backend API URL (default: http://localhost:5000)
 * @returns {Promise<{success: boolean, filename?: string}>}
 */
export const downloadReport = async (ipAddress, apiUrl = 'http://localhost:5000') => {
    try {
        const response = await axios({
            url: `${apiUrl}/api/report/${ipAddress}`,
            method: 'GET',
            responseType: 'blob', // Important: must be 'blob' for binary data
            headers: {
                'Accept': 'application/pdf'
            },
            timeout: 60000 // 60 second timeout for large reports
        });
        
        // Create blob from response
        const blob = new Blob([response.data], { type: 'application/pdf' });
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Extract filename from Content-Disposition header or generate
        const contentDisposition = response.headers['content-disposition'];
        let filename = `securebank-report-${ipAddress.replace(/\./g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
        
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
            if (filenameMatch) {
                filename = filenameMatch[1];
            }
        }
        
        link.setAttribute('download', filename);
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        setTimeout(() => {
            link.remove();
            window.URL.revokeObjectURL(url);
        }, 100);
        
        return { success: true, filename };
        
    } catch (error) {
        console.error('Error downloading report:', error);
        
        if (error.response?.status === 404) {
            throw new Error(`No events found for IP address: ${ipAddress}`);
        }
        
        if (error.code === 'ECONNABORTED') {
            throw new Error('Report generation timeout. The report may be too large.');
        }
        
        throw new Error(`Failed to download report: ${error.message}`);
    }
};



