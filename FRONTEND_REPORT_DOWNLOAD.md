# Frontend Report Download Integration

## React Component Code

Add this function to your Dashboard component or create a utility file:

```jsx
// src/utils/reportDownload.js or in Dashboard.jsx

import axios from 'axios';

/**
 * Download incident report PDF for a specific IP address
 * 
 * @param {string} ipAddress - IP address to generate report for
 * @param {string} apiUrl - Backend API URL (default: http://localhost:5000)
 */
export const downloadReport = async (ipAddress, apiUrl = 'http://localhost:5000') => {
    try {
        const response = await axios({
            url: `${apiUrl}/api/report/${ipAddress}`,
            method: 'GET',
            responseType: 'blob', // Important: must be 'blob' for binary data
            headers: {
                'Accept': 'application/pdf'
            }
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
            const filenameMatch = contentDisposition.match(/filename="(.+)"/);
            if (filenameMatch) {
                filename = filenameMatch[1];
            }
        }
        
        link.setAttribute('download', filename);
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        link.remove();
        window.URL.revokeObjectURL(url);
        
        return { success: true, filename };
        
    } catch (error) {
        console.error('Error downloading report:', error);
        
        if (error.response?.status === 404) {
            throw new Error(`No events found for IP address: ${ipAddress}`);
        }
        
        throw new Error(`Failed to download report: ${error.message}`);
    }
};
```

## Usage in Dashboard Component

```jsx
import { downloadReport } from '../utils/reportDownload';

// In your component:
const handleDownloadReport = async (ipAddress) => {
    try {
        setLoading(true);
        await downloadReport(ipAddress);
        // Optional: Show success toast
        alert(`Report downloaded for ${ipAddress}`);
    } catch (error) {
        // Show error message
        alert(`Error: ${error.message}`);
    } finally {
        setLoading(false);
    }
};

// In your JSX:
<button
    onClick={() => handleDownloadReport(log.ip_address)}
    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
>
    Download Report
</button>
```

## Usage in Top IPs Section

```jsx
// In Dashboard.jsx, in the Top IPs section:
{topIPs.map((ipData, index) => (
    <div key={index}>
        <span>{ipData.ip}</span>
        <button
            onClick={() => handleDownloadReport(ipData.ip)}
            className="ml-2 px-2 py-1 bg-blue-600 text-white rounded text-xs"
        >
            Download Report
        </button>
    </div>
))}
```

## Error Handling

```jsx
const handleDownloadReport = async (ipAddress) => {
    try {
        setLoading(true);
        await downloadReport(ipAddress);
    } catch (error) {
        if (error.message.includes('No events found')) {
            // Show user-friendly message
            setError(`No attack events recorded for ${ipAddress}`);
        } else {
            setError('Failed to generate report. Please try again.');
        }
    } finally {
        setLoading(false);
    }
};
```

## Loading State

```jsx
const [downloading, setDownloading] = useState(false);

<button
    onClick={() => handleDownloadReport(ip)}
    disabled={downloading}
    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
>
    {downloading ? 'Generating...' : 'Download Report'}
</button>
```



