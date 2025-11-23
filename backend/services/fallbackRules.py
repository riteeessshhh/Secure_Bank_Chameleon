"""
Fallback Rules for AI Assistant (Python version)
"""

def explain_attack(event):
    """
    Explain attack using pattern-based rules.
    
    Args:
        event: Dictionary with attack event data
        
    Returns:
        Dictionary with explanation fields
    """
    payload = (event.get('input_payload') or event.get('payload') or '').lower()
    attack_type = event.get('attack_type', 'Unknown')
    confidence = event.get('confidence', 0.5)
    
    import re
    
    # SQL Injection patterns
    if attack_type == 'SQLi' or re.search(r"('|\"|`).*(or|and).*[=<>]|union.*select|drop.*table|';.*--|exec.*\(|xp_cmdshell", payload, re.IGNORECASE):
        severity = 7
        intent = 'Bypass authentication or extract database information'
        attack_type_name = 'SQL Injection'
        
        # Detect specific SQLi types
        if re.search(r'drop.*table|delete.*from|truncate', payload, re.IGNORECASE):
            severity = 10
            intent = 'Destroy database tables or data'
            attack_type_name = 'SQL Injection - Data Destruction'
        elif re.search(r'union.*select|select.*from|information_schema', payload, re.IGNORECASE):
            severity = 9
            intent = 'Extract sensitive data from database'
            attack_type_name = 'SQL Injection - Data Extraction'
        elif re.search(r"or.*1.*=.*1|or.*'1'.*=.*'1'", payload, re.IGNORECASE):
            severity = 8
            intent = 'Bypass authentication to gain unauthorized access'
            attack_type_name = 'SQL Injection - Authentication Bypass'
        
        return {
            'summary': f'{attack_type_name} attack detected. Attacker attempted to manipulate SQL queries to {intent.lower()}. This is a critical security vulnerability that could lead to data breach or system compromise.',
            'type': attack_type_name,
            'intent': intent,
            'severity': severity,
            'recommendedActions': [
                'Implement parameterized queries (prepared statements)',
                'Add input validation and sanitization',
                'Enable SQL injection detection in WAF',
                'Review and restrict database user permissions',
                'Implement account lockout after failed attempts',
                'Conduct security code review of database queries'
            ],
            'confidence': min(confidence + 0.1, 0.95),
            'source': 'fallback-rules'
        }
    
    # XSS patterns
    if attack_type == 'XSS' or re.search(r'<script|javascript:|onerror=|onload=|onclick=|<img.*onerror|eval\(|document\.cookie', payload, re.IGNORECASE):
        severity = 7
        intent = 'Execute malicious JavaScript in victim browsers'
        attack_type_name = 'Cross-Site Scripting (XSS)'
        
        # Detect XSS types
        if re.search(r'document\.cookie|localStorage|sessionStorage', payload, re.IGNORECASE):
            severity = 9
            intent = 'Steal user sessions, cookies, or stored credentials'
            attack_type_name = 'XSS - Session Hijacking'
        elif re.search(r'<script|eval\(', payload, re.IGNORECASE):
            severity = 8
            intent = 'Execute arbitrary JavaScript code'
            attack_type_name = 'XSS - Code Execution'
        
        return {
            'summary': f'{attack_type_name} attack detected. Attacker attempted to {intent.lower()}. This could lead to session hijacking, credential theft, or unauthorized actions on behalf of users.',
            'type': attack_type_name,
            'intent': intent,
            'severity': severity,
            'recommendedActions': [
                'Implement Content Security Policy (CSP) headers',
                'Encode/sanitize all user inputs before rendering',
                "Use framework's built-in XSS protection",
                'Enable XSS filters in web application firewall',
                'Conduct security code review of output encoding',
                'Implement HttpOnly and Secure cookie flags'
            ],
            'confidence': min(confidence + 0.1, 0.95),
            'source': 'fallback-rules'
        }
    
    # Command Injection patterns
    if re.search(r';.*\||`.*`|\$\(|exec\(|system\(|shell_exec', payload, re.IGNORECASE):
        return {
            'summary': 'Command injection attack detected. Attacker attempted to execute arbitrary system commands on the server. This is a critical vulnerability that could lead to complete system compromise.',
            'type': 'Command Injection',
            'intent': 'Execute arbitrary system commands on the server',
            'severity': 10,
            'recommendedActions': [
                'Validate and sanitize all user inputs',
                'Use parameterized command execution',
                'Implement least privilege for application user',
                'Disable dangerous system functions',
                'Enable command injection detection',
                'Review and restrict system permissions'
            ],
            'confidence': 0.9,
            'source': 'fallback-rules'
        }
    
    # Path Traversal patterns
    if re.search(r'\.\.\/|\.\.\\\\|\.\.%2f|\.\.%5c|etc\/passwd|windows\/system32', payload, re.IGNORECASE):
        return {
            'summary': 'Path traversal attack detected. Attacker attempted to access files outside the intended directory. This could lead to sensitive file disclosure or system information leakage.',
            'type': 'Path Traversal',
            'intent': 'Access files outside the intended directory',
            'severity': 8,
            'recommendedActions': [
                'Validate and sanitize file paths',
                'Use whitelist of allowed file paths',
                'Implement proper access controls',
                'Enable path traversal detection',
                'Review file system permissions'
            ],
            'confidence': 0.85,
            'source': 'fallback-rules'
        }
    
    # Benign/Unknown
    if attack_type == 'Benign' or confidence < 0.5:
        return {
            'summary': 'Normal or low-risk activity detected. No clear malicious patterns identified. This appears to be legitimate user activity or a false positive.',
            'type': 'Benign - Normal Activity',
            'intent': 'Standard user interaction',
            'severity': 1,
            'recommendedActions': [
                'Continue monitoring for suspicious patterns',
                'Verify user account status',
                'Review authentication logs if applicable'
            ],
            'confidence': 0.7,
            'source': 'fallback-rules'
        }
    
    # Generic attack
    return {
        'summary': f'{attack_type} attack detected with {confidence * 100:.0f}% confidence. This requires further investigation to determine the full scope and impact.',
        'type': attack_type,
        'intent': 'Unknown - requires investigation',
        'severity': 5,
        'recommendedActions': [
            'Review full attack payload and context',
            'Check system logs for related activity',
            'Verify if attack was successful',
            'Implement general security hardening',
            'Conduct security assessment'
        ],
        'confidence': confidence,
        'source': 'fallback-rules'
    }



