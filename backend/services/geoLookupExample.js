/**
 * Geographic IP Lookup Example
 * 
 * This is a reference implementation showing how to integrate
 * IP geolocation services for the PDF report.
 * 
 * NOT REQUIRED TO RUN - For documentation purposes only
 */

/**
 * Example: Using MaxMind GeoIP2 (requires database file)
 * 
 * Installation:
 * npm install geoip-lite
 * 
 * Or for more accurate results:
 * npm install @maxmind/geoip2-node
 */

// Example 1: Using geoip-lite (free, less accurate)
function lookupIPGeoipLite(ipAddress) {
    const geoip = require('geoip-lite');
    const geo = geoip.lookup(ipAddress);
    
    if (!geo) {
        return { country: 'Unknown', countryCode: 'XX' };
    }
    
    return {
        country: geo.country || 'Unknown',
        countryCode: geo.country || 'XX',
        region: geo.region || '',
        city: geo.city || '',
        timezone: geo.timezone || ''
    };
}

// Example 2: Using MaxMind GeoIP2 (more accurate, requires license)
async function lookupIPMaxMind(ipAddress) {
    const Reader = require('@maxmind/geoip2-node').Reader;
    const fs = require('fs');
    
    try {
        const dbBuffer = fs.readFileSync('./GeoLite2-Country.mmdb');
        const reader = Reader.openBuffer(dbBuffer);
        const response = reader.country(ipAddress);
        
        return {
            country: response.country.names.en || 'Unknown',
            countryCode: response.country.isoCode || 'XX',
            continent: response.continent.names.en || 'Unknown'
        };
    } catch (error) {
        console.error('GeoIP lookup error:', error);
        return { country: 'Unknown', countryCode: 'XX' };
    }
}

// Example 3: Using IP-API (free, rate-limited)
async function lookupIPAPI(ipAddress) {
    const axios = require('axios');
    
    try {
        // Free tier: http://ip-api.com/json/{ip}
        // Pro tier: https://pro.ip-api.com/json/{ip}?key={key}
        const response = await axios.get(`http://ip-api.com/json/${ipAddress}`);
        
        if (response.data.status === 'success') {
            return {
                country: response.data.country || 'Unknown',
                countryCode: response.data.countryCode || 'XX',
                region: response.data.regionName || '',
                city: response.data.city || '',
                isp: response.data.isp || '',
                org: response.data.org || ''
            };
        }
        
        return { country: 'Unknown', countryCode: 'XX' };
    } catch (error) {
        console.error('IP-API lookup error:', error);
        return { country: 'Unknown', countryCode: 'XX' };
    }
}

/**
 * Aggregate geographic data from events
 * 
 * @param {Array} events - Array of event objects with ip_address
 * @returns {Array} Array of { country, count } objects
 */
async function aggregateGeographicData(events) {
    const countryCounts = {};
    
    for (const event of events) {
        const ip = event.ip_address;
        if (!ip || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
            // Skip local/private IPs
            continue;
        }
        
        // Use one of the lookup methods above
        const geo = await lookupIPAPI(ip);
        const country = geo.country || 'Unknown';
        
        countryCounts[country] = (countryCounts[country] || 0) + 1;
    }
    
    // Convert to array and sort
    return Object.entries(countryCounts)
        .map(([country, count]) => ({ country, count }))
        .sort((a, b) => b.count - a.count);
}

/**
 * Usage in reportGenerator.js:
 * 
 * const geographic = await aggregateGeographicData(events);
 * 
 * Then pass to createGeographicChart()
 */

module.exports = {
    lookupIPGeoipLite,
    lookupIPMaxMind,
    lookupIPAPI,
    aggregateGeographicData
};



