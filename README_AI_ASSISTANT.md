# AI Forensic Assistant

Modular AI-powered forensic analysis system that provides intelligent explanations for attack events.

## Features

- **AI-Powered Analysis**: Uses LLM APIs (Claude/GPT) for intelligent attack explanations
- **Offline Fallback**: Heuristic rules for demo/offline mode
- **Structured Output**: Summary, attack type, intent, severity, recommended actions
- **Rate Limiting**: Prevents API abuse
- **Token Truncation**: Handles long payloads safely
- **Copy to Clipboard**: Easy sharing of analysis
- **Report Integration**: Add explanations to PDF reports

## Architecture

### Backend

- **`backend/services/aiAssistant.js`**: Node.js LLM wrapper (for reference)
- **`backend/services/fallbackRules.js`**: Python fallback rules (active)
- **`backend/services/fallbackRules.py`**: Python implementation (used)
- **`backend/routes/ai.py`**: FastAPI endpoints

### Frontend

- **`client/src/components/AiExplainPanel.jsx`**: React component for displaying AI explanations

## API Endpoints

### POST /api/ai/explain

Get AI explanation for an attack event.

**Request:**
```json
{
  "event_id": 123
}
```

Or with direct event:
```json
{
  "event": {
    "input_payload": "admin' OR 1=1--",
    "attack_type": "SQLi",
    "confidence": 0.95
  }
}
```

**Response:**
```json
{
  "success": true,
  "explanation": {
    "summary": "SQL injection attack detected...",
    "type": "SQL Injection - Authentication Bypass",
    "intent": "Bypass authentication to gain unauthorized access",
    "severity": 8,
    "recommendedActions": [
      "Implement parameterized queries",
      "Add input validation",
      "..."
    ],
    "confidence": 0.95,
    "source": "fallback-rules"
  }
}
```

### GET /api/ai/explain/{event_id}

Get AI explanation by event ID.

## Configuration

### Environment Variables

```bash
# LLM API Configuration (optional)
LLM_API_KEY=your_api_key_here
LLM_API_URL=https://api.anthropic.com/v1/messages  # or OpenAI URL
LLM_MODEL=claude-3-sonnet-20240229  # or gpt-4-turbo-preview

# AI Mode
AI_MODE=fallback  # or 'llm' to use API
```

⚠️ **SECURITY WARNING**: Never commit API keys to version control. Use environment variables or secure secret management.

### Fallback Mode (Default)

By default, the system uses heuristic rules (offline mode). This works without any API keys and is suitable for demos.

To enable LLM mode:
1. Set `LLM_API_KEY` environment variable
2. Set `AI_MODE=llm` (or remove it, as fallback is default)
3. Optionally set `LLM_API_URL` and `LLM_MODEL`

## Usage

### In Dashboard

1. Click "AI Explain" button on any attack event
2. View AI-generated explanation
3. Use "Regenerate" to get a new explanation
4. Copy to clipboard or add to report

### In Incident Replay Page

The AI explanation panel automatically appears when viewing an event replay.

### Programmatic Usage

```python
from backend.services.fallbackRules import explain_attack

event = {
    'input_payload': "admin' OR 1=1--",
    'attack_type': 'SQLi',
    'confidence': 0.95
}

explanation = explain_attack(event)
print(explanation['summary'])
```

## Prompt Engineering

The system uses a structured prompt with:

1. **System Prompt**: Defines the AI's role as a cybersecurity analyst
2. **Few-Shot Examples**: 4 examples showing input→output format
3. **Structured Output**: JSON format with specific fields

### Example Prompt Structure

```
System: You are a cybersecurity forensic analyst assistant...

Examples:
1. SQLi authentication bypass → Explanation
2. XSS attack → Explanation
3. Benign login → Explanation
4. SQLi data destruction → Explanation

User: Analyze this attack event: [payload, type, etc.]
```

The exact prompts are in `backend/services/aiAssistant.js` (Node.js version) for reference.

## Rate Limiting

- **Window**: 1 minute
- **Max Requests**: 10 per window per IP
- **Store**: In-memory (use Redis in production)

## Token Management

- **Max Payload Length**: 2000 characters
- **Truncation**: Long payloads are truncated with `...[TRUNCATED]` marker
- **Max Tokens**: 1000 tokens for LLM response

## Fallback Rules

The fallback system uses pattern matching to identify:

- **SQL Injection**: Authentication bypass, data extraction, data destruction
- **XSS**: Code execution, session hijacking
- **Command Injection**: System command execution
- **Path Traversal**: File system access
- **Benign**: Normal activity

Each pattern maps to:
- Severity score (1-10)
- Intent description
- Recommended actions
- Confidence level

## Integration

### Add to Dashboard

```jsx
import AiExplainPanel from '../components/AiExplainPanel';

<AiExplainPanel 
  eventId={log.id}
  eventData={log}
  onAddToReport={(explanation) => {
    // Add to PDF report
  }}
/>
```

### Add to PDF Reports

The explanation can be added to PDF reports by including it in the report generation:

```python
# In backend/routes/report.py
explanation = explain_attack(event)
# Add explanation to PDF
```

## Troubleshooting

### "Failed to load explanation"

- Check backend is running
- Verify event exists in database
- Check browser console for errors

### "Rate limit exceeded"

- Wait 1 minute before retrying
- Check rate limiting configuration
- In production, use Redis for distributed rate limiting

### API Errors

- Verify `LLM_API_KEY` is set correctly
- Check API URL and model name
- Ensure API quota is not exceeded
- System will fallback to rules on error

## Security Considerations

1. **API Keys**: Never log or commit API keys
2. **Payload Truncation**: Long payloads are truncated to prevent token overflow
3. **Rate Limiting**: Prevents abuse of LLM APIs
4. **Input Validation**: Events are validated before processing
5. **Error Handling**: Errors don't expose sensitive information

## Future Enhancements

- [ ] Support for more LLM providers (Gemini, etc.)
- [ ] Caching of explanations
- [ ] Multi-language support
- [ ] Custom prompt templates
- [ ] Explanation history/versioning
- [ ] Batch analysis for multiple events

## License

Same as main project.



