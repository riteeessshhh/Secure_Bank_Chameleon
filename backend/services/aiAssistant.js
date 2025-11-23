/**
 * AI Forensic Assistant Service
 * 
 * Provides AI-powered explanations for attack events using LLM APIs
 * with fallback to heuristic rules for offline/demo use.
 */

// ⚠️ SECURITY WARNING: Never log or commit API keys
// Use environment variables: LLM_API_KEY, LLM_API_URL, LLM_MODEL

const MAX_PAYLOAD_LENGTH = 2000; // Truncate long payloads
const MAX_TOKENS = 1000; // Limit response tokens
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map();

/**
 * Rate limiting check
 */
function checkRateLimit(ip) {
    const now = Date.now();
    const key = ip || 'default';
    const requests = rateLimitStore.get(key) || [];
    
    // Remove old requests outside the window
    const recentRequests = requests.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
    
    if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
        return false;
    }
    
    recentRequests.push(now);
    rateLimitStore.set(key, recentRequests);
    return true;
}

/**
 * Truncate payload for LLM input
 */
function truncatePayload(payload) {
    if (!payload || typeof payload !== 'string') {
        return '';
    }
    
    if (payload.length <= MAX_PAYLOAD_LENGTH) {
        return payload;
    }
    
    // Truncate and add indicator
    return payload.substring(0, MAX_PAYLOAD_LENGTH) + '...[TRUNCATED]';
}

/**
 * System prompt for the LLM
 */
const SYSTEM_PROMPT = `You are a cybersecurity forensic analyst assistant. Your task is to analyze attack events and provide concise, professional explanations.

Analyze the provided attack event and return a structured explanation including:
1. Attack Type: The specific type of attack (SQL Injection, XSS, etc.)
2. Intent: What the attacker was likely trying to achieve
3. Severity: Score from 1-10 (1=low, 5=medium, 10=critical)
4. Recommended Actions: 3-5 specific defensive actions
5. Summary: One concise paragraph for incident reports

Be precise, technical, and actionable. Focus on what security teams need to know.`;

/**
 * Few-shot examples for the LLM
 */
const FEW_SHOT_EXAMPLES = [
    {
        input: {
            payload: "admin' OR '1'='1",
            attack_type: "SQLi",
            headers: {"User-Agent": "Mozilla/5.0"}
        },
        output: {
            summary: "SQL injection attempt targeting authentication bypass. Attacker attempted to manipulate SQL query logic using boolean-based injection to bypass login credentials.",
            type: "SQL Injection - Authentication Bypass",
            intent: "Gain unauthorized access to admin accounts by bypassing authentication checks",
            severity: 9,
            recommendedActions: [
                "Implement parameterized queries/prepared statements",
                "Add input validation and sanitization",
                "Enable SQL injection detection in WAF",
                "Review and restrict database user permissions",
                "Implement account lockout after failed attempts"
            ],
            confidence: 0.95
        }
    },
    {
        input: {
            payload: "<script>alert('XSS')</script>",
            attack_type: "XSS",
            headers: {"User-Agent": "Mozilla/5.0"}
        },
        output: {
            summary: "Cross-site scripting (XSS) attack attempting to execute malicious JavaScript in user browsers. This could lead to session hijacking or data theft.",
            type: "Cross-Site Scripting (XSS) - Stored/Reflected",
            intent: "Execute arbitrary JavaScript in victim browsers to steal sessions, cookies, or perform actions on behalf of users",
            severity: 7,
            recommendedActions: [
                "Implement Content Security Policy (CSP) headers",
                "Encode/sanitize all user inputs before rendering",
                "Use framework's built-in XSS protection",
                "Enable XSS filters in web application firewall",
                "Conduct security code review of output encoding"
            ],
            confidence: 0.98
        }
    },
    {
        input: {
            payload: "User ID: test@example.com, Password: password123",
            attack_type: "Benign",
            headers: {"User-Agent": "Mozilla/5.0"}
        },
        output: {
            summary: "Normal login attempt with standard credentials. No malicious patterns detected. This appears to be legitimate user activity.",
            type: "Benign - Normal Authentication",
            intent: "Standard user login attempt",
            severity: 1,
            recommendedActions: [
                "Continue monitoring for suspicious patterns",
                "Ensure password policies are enforced",
                "Verify user account status"
            ],
            confidence: 0.85
        }
    },
    {
        input: {
            payload: "'; DROP TABLE users; --",
            attack_type: "SQLi",
            headers: {"User-Agent": "Mozilla/5.0"}
        },
        output: {
            summary: "Critical SQL injection attack attempting database destruction. Attacker attempted to drop database tables, which could result in complete data loss.",
            type: "SQL Injection - Data Destruction",
            intent: "Delete or destroy database tables to cause data loss or system disruption",
            severity: 10,
            recommendedActions: [
                "Immediately block source IP address",
                "Review database backup integrity",
                "Audit database user permissions (principle of least privilege)",
                "Implement database activity monitoring",
                "Escalate to incident response team",
                "Review application logs for successful exploitation"
            ],
            confidence: 0.99
        }
    }
];

/**
 * Call LLM API (Claude/GPT)
 */
async function callLLMAPI(event, apiKey, apiUrl, model) {
    const truncatedPayload = truncatePayload(event.input_payload || event.payload || '');
    
    // Build user message with event details
    const userMessage = `Analyze this attack event:

Payload: ${truncatedPayload}
Attack Type: ${event.attack_type || 'Unknown'}
IP Address: ${event.ip_address || 'Unknown'}
Timestamp: ${event.timestamp || 'Unknown'}
Confidence: ${event.confidence || 'Unknown'}
User-Agent: ${event.headers?.user_agent || event.ua || 'Unknown'}

Provide analysis in JSON format matching the structure of the examples.`;

    // Prepare messages for few-shot learning
    const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...FEW_SHOT_EXAMPLES.flatMap(example => [
            { role: 'user', content: JSON.stringify(example.input) },
            { role: 'assistant', content: JSON.stringify(example.output) }
        ]),
        { role: 'user', content: userMessage }
    ];

    // Try Claude API (Anthropic)
    if (apiUrl?.includes('anthropic') || model?.includes('claude')) {
        const response = await fetch(apiUrl || 'https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: model || 'claude-3-sonnet-20240229',
                max_tokens: MAX_TOKENS,
                messages: messages.filter(m => m.role !== 'system').map(m => ({
                    role: m.role === 'system' ? 'user' : m.role,
                    content: m.content
                })),
                system: SYSTEM_PROMPT
            })
        });

        if (!response.ok) {
            throw new Error(`Claude API error: ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.content[0].text;
        
        // Parse JSON from response
        try {
            return JSON.parse(content);
        } catch {
            // If not JSON, try to extract JSON from text
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Failed to parse LLM response as JSON');
        }
    }

    // Try OpenAI GPT API
    if (apiUrl?.includes('openai') || model?.includes('gpt')) {
        const response = await fetch(apiUrl || 'https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model || 'gpt-4-turbo-preview',
                messages: messages,
                max_tokens: MAX_TOKENS,
                temperature: 0.3
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API error: ${response.statusText}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        
        // Parse JSON from response
        try {
            return JSON.parse(content);
        } catch {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Failed to parse LLM response as JSON');
        }
    }

    throw new Error('Unsupported API provider. Use Claude or OpenAI.');
}

/**
 * Main function to explain an attack event
 * 
 * @param {Object} event - Attack event object
 * @param {string} apiKey - LLM API key (optional)
 * @param {string} apiUrl - LLM API URL (optional)
 * @param {string} model - LLM model name (optional)
 * @param {string} ip - Client IP for rate limiting
 * @returns {Promise<Object>} Explanation object
 */
async function explainAttack(event, apiKey = null, apiUrl = null, model = null, ip = null) {
    // Rate limiting check
    if (!checkRateLimit(ip)) {
        throw new Error('Rate limit exceeded. Please try again later.');
    }

    // Validate event
    if (!event || (!event.input_payload && !event.payload)) {
        throw new Error('Invalid event: missing payload');
    }

    // If no API key, use fallback rules
    if (!apiKey || process.env.AI_MODE === 'fallback') {
        const fallbackRules = require('./fallbackRules');
        return fallbackRules.explainAttack(event);
    }

    // Call LLM API
    try {
        const explanation = await callLLMAPI(event, apiKey, apiUrl, model);
        
        // Validate and structure response
        return {
            summary: explanation.summary || 'Analysis completed',
            type: explanation.type || event.attack_type || 'Unknown',
            intent: explanation.intent || 'Unknown intent',
            severity: explanation.severity || 5,
            recommendedActions: explanation.recommendedActions || [],
            confidence: explanation.confidence || 0.8,
            source: 'llm',
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('LLM API error:', error);
        // Fallback to rules on error
        const fallbackRules = require('./fallbackRules');
        return {
            ...fallbackRules.explainAttack(event),
            source: 'fallback',
            error: error.message
        };
    }
}

module.exports = {
    explainAttack,
    checkRateLimit,
    truncatePayload
};



