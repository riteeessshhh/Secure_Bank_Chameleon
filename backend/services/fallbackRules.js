/**
 * Fallback Rules for AI Assistant
 * 
 * Heuristic-based attack explanation when LLM API is unavailable.
 * Used for offline/demo mode.
 */

/**
 * Explain attack using pattern-based rules
 */
function explainAttack(event) {
    const payload = (event.input_payload || event.payload || '').toLowerCase();
    const attackType = event.attack_type || 'Unknown';
    const confidence = event.confidence || 0.5;

    // SQL Injection patterns
    if (attackType === 'SQLi' || /('|"|`).*(or|and).*[=<>]|union.*select|drop.*table|';.*--|exec.*\(|xp_cmdshell/i.test(payload)) {
        let severity = 7;
        let intent = 'Bypass authentication or extract database information';
        let type = 'SQL Injection';
        
        // Detect specific SQLi types
        if (/drop.*table|delete.*from|truncate/i.test(payload)) {
            severity = 10;
            intent = 'Destroy database tables or data';
            type = 'SQL Injection - Data Destruction';
        } else if (/union.*select|select.*from|information_schema/i.test(payload)) {
            severity = 9;
            intent = 'Extract sensitive data from database';
            type = 'SQL Injection - Data Extraction';
        } else if (/or.*1.*=.*1|or.*'1'.*=.*'1'/i.test(payload)) {
            severity = 8;
            intent = 'Bypass authentication to gain unauthorized access';
            type = 'SQL Injection - Authentication Bypass';
        }

        return {
            summary: `${type} attack detected. Attacker attempted to manipulate SQL queries to ${intent.toLowerCase()}. This is a critical security vulnerability that could lead to data breach or system compromise.`,
            type: type,
            intent: intent,
            severity: severity,
            recommendedActions: [
                'Implement parameterized queries (prepared statements)',
                'Add input validation and sanitization',
                'Enable SQL injection detection in WAF',
                'Review and restrict database user permissions',
                'Implement account lockout after failed attempts',
                'Conduct security code review of database queries'
            ],
            confidence: Math.min(confidence + 0.1, 0.95),
            source: 'fallback-rules'
        };
    }

    // XSS patterns
    if (attackType === 'XSS' || /<script|javascript:|onerror=|onload=|onclick=|<img.*onerror|eval\(|document\.cookie/i.test(payload)) {
        let severity = 7;
        let intent = 'Execute malicious JavaScript in victim browsers';
        let type = 'Cross-Site Scripting (XSS)';
        
        // Detect XSS types
        if (/document\.cookie|localStorage|sessionStorage/i.test(payload)) {
            severity = 9;
            intent = 'Steal user sessions, cookies, or stored credentials';
            type = 'XSS - Session Hijacking';
        } else if (/<script|eval\(/i.test(payload)) {
            severity = 8;
            intent = 'Execute arbitrary JavaScript code';
            type = 'XSS - Code Execution';
        }

        return {
            summary: `${type} attack detected. Attacker attempted to ${intent.toLowerCase()}. This could lead to session hijacking, credential theft, or unauthorized actions on behalf of users.`,
            type: type,
            intent: intent,
            severity: severity,
            recommendedActions: [
                'Implement Content Security Policy (CSP) headers',
                'Encode/sanitize all user inputs before rendering',
                'Use framework\'s built-in XSS protection',
                'Enable XSS filters in web application firewall',
                'Conduct security code review of output encoding',
                'Implement HttpOnly and Secure cookie flags'
            ],
            confidence: Math.min(confidence + 0.1, 0.95),
            source: 'fallback-rules'
        };
    }

    // Command Injection patterns
    if (/;.*\||`.*`|\$\(|exec\(|system\(|shell_exec/i.test(payload)) {
        return {
            summary: 'Command injection attack detected. Attacker attempted to execute arbitrary system commands on the server. This is a critical vulnerability that could lead to complete system compromise.',
            type: 'Command Injection',
            intent: 'Execute arbitrary system commands on the server',
            severity: 10,
            recommendedActions: [
                'Validate and sanitize all user inputs',
                'Use parameterized command execution',
                'Implement least privilege for application user',
                'Disable dangerous system functions',
                'Enable command injection detection',
                'Review and restrict system permissions'
            ],
            confidence: 0.9,
            source: 'fallback-rules'
        };
    }

    // Path Traversal patterns
    if (/\.\.\/|\.\.\\|\.\.%2f|\.\.%5c|etc\/passwd|windows\/system32/i.test(payload)) {
        return {
            summary: 'Path traversal attack detected. Attacker attempted to access files outside the intended directory. This could lead to sensitive file disclosure or system information leakage.',
            type: 'Path Traversal',
            intent: 'Access files outside the intended directory',
            severity: 8,
            recommendedActions: [
                'Validate and sanitize file paths',
                'Use whitelist of allowed file paths',
                'Implement proper access controls',
                'Enable path traversal detection',
                'Review file system permissions'
            ],
            confidence: 0.85,
            source: 'fallback-rules'
        };
    }

    // Benign/Unknown
    if (attackType === 'Benign' || confidence < 0.5) {
        return {
            summary: 'Normal or low-risk activity detected. No clear malicious patterns identified. This appears to be legitimate user activity or a false positive.',
            type: 'Benign - Normal Activity',
            intent: 'Standard user interaction',
            severity: 1,
            recommendedActions: [
                'Continue monitoring for suspicious patterns',
                'Verify user account status',
                'Review authentication logs if applicable'
            ],
            confidence: 0.7,
            source: 'fallback-rules'
        };
    }

    // Generic attack
    return {
        summary: `${attackType} attack detected with ${(confidence * 100).toFixed(0)}% confidence. This requires further investigation to determine the full scope and impact.`,
        type: attackType,
        intent: 'Unknown - requires investigation',
        severity: 5,
        recommendedActions: [
            'Review full attack payload and context',
            'Check system logs for related activity',
            'Verify if attack was successful',
            'Implement general security hardening',
            'Conduct security assessment'
        ],
        confidence: confidence,
        source: 'fallback-rules'
    };
}

module.exports = {
    explainAttack
};



