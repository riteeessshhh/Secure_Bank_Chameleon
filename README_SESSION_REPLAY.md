# Session Replay System

Full-stack session replay system that records attacker actions and provides an analyst-facing replay player.

## Features

- **Recording**: Captures keystrokes, clicks, navigation, focus events, and form submissions
- **Playback**: Replays sessions with original timing, autotyping, and visual indicators
- **Controls**: Play/Pause, step forward/backward, speed control (0.5x, 1x, 2x)
- **Export**: Download replay sessions as JSON
- **Demo Mode**: Sample recorded sessions for testing

## Architecture

### Backend (FastAPI)

- **`backend/routes/submit.py`**: Enhanced submit endpoint that accepts and stores session actions
- **Storage**: In-memory array (can be migrated to database)
- **Endpoints**:
  - `POST /api/submit` - Submit attack with actions
  - `GET /api/events/{event_id}` - Get event with actions
  - `GET /api/events/{event_id}/actions` - Get actions for event

### Frontend (React)

- **`client/src/components/ReplayPlayer.jsx`**: Main replay player component
- **`client/src/pages/IncidentReplay.jsx`**: Page that loads and displays replay
- **`client/src/hooks/useReplay.js`**: Hook for playback logic
- **`client/src/utils/sessionRecorder.js`**: Session recording utility

## Installation

### Backend Dependencies

No additional dependencies required (uses existing FastAPI setup).

### Frontend Dependencies

```bash
cd client
npm install framer-motion
```

## Usage

### Recording Sessions

#### Demo Mode (Default)

Recording is enabled by default in demo mode. To disable:

1. Open `client/src/pages/Trap.jsx`
2. Set `const DEMO_MODE = false;` at the top of the file

**⚠️ WARNING**: In production, disable keystroke capture for password fields and sensitive data. The `sessionRecorder` has a `production` mode that skips password field keystrokes.

#### How Recording Works

1. When user loads the login page, recording starts automatically (if DEMO_MODE is true)
2. Keystrokes are captured with timestamps
3. Focus events are recorded
4. Clicks are recorded with coordinates
5. Form submission is recorded
6. Actions are sent to backend with the attack submission

### Creating Demo Replays

1. **Enable Demo Mode**: Ensure `DEMO_MODE = true` in `Trap.jsx`
2. **Record a Session**:
   - Navigate to `/login`
   - Type in the form fields
   - Submit the form
   - Actions are automatically recorded
3. **View Replay**: 
   - Go to Dashboard
   - Click "View Replay" on any logged event
   - Or navigate to `/replay/{event_id}`

### Using Demo Data

Sample replays are available in `public/demo_replays.json`:

- **Event 1**: SQLi attack (`admin' OR 1=1--`)
- **Event 2**: XSS attack (`<script>alert('XSS')</script>`)
- **Event 3**: Benign login

To use demo data:

1. Navigate to `/replay/1`, `/replay/2`, or `/replay/3`
2. The system will automatically load from demo data if the event doesn't exist in the database

## API Endpoints

### POST /api/submit

Submit an attack with session actions.

**Request Body:**
```json
{
  "input": "User ID: admin' OR 1=1--, Password: test",
  "username": "admin",
  "ip_address": "192.168.1.100",
  "actions": [
    {
      "type": "keystroke",
      "ts": 150,
      "payload": "a",
      "target": "userid"
    },
    {
      "type": "click",
      "ts": 2000,
      "x": 450,
      "y": 520,
      "target": "submit_button"
    },
    {
      "type": "submit",
      "ts": 2100
    }
  ]
}
```

**Response:**
```json
{
  "received": true,
  "id": 123,
  "hash": "abc123..."
}
```

### GET /api/events/{event_id}

Get full event with actions.

**Response:**
```json
{
  "id": 123,
  "timestamp": "2025-01-15T10:30:00",
  "ip_address": "192.168.1.100",
  "input_payload": "User ID: admin' OR 1=1--",
  "attack_type": "SQLi",
  "confidence": 0.95,
  "deception_strategy": "Slow Loading + Fake Dashboard",
  "actions": [...]
}
```

## Replay Player Features

### Controls

- **Play/Pause**: Start or pause playback
- **Step Forward/Backward**: Navigate frame by frame
- **Reset**: Return to beginning
- **Speed Control**: 0.5x, 1x, 2x playback speed
- **Timeline Slider**: Seek to any point in the replay

### Visual Indicators

- **Keystrokes**: Autotyped into simulated form
- **Clicks**: Red "CLICK" overlay at recorded coordinates
- **Focus**: Yellow "FOCUS" indicator
- **Submit**: Green "SUBMIT" indicator
- **Action Timeline**: List of all actions with timestamps

### Export

Click "Export" to download the replay as JSON, including:
- Event metadata
- All recorded actions
- Timestamps and coordinates
- Export timestamp

## Production Considerations

### Security & Privacy

1. **Disable Keystroke Capture**: Set `DEMO_MODE = false` in production
2. **Password Fields**: Never record password field keystrokes in production
3. **User Consent**: Ensure compliance with privacy regulations
4. **Data Retention**: Implement policies for storing recorded sessions

### Performance

- **Storage**: Consider migrating from in-memory to database
- **Compression**: Compress action arrays for long sessions
- **Sampling**: Consider sampling keystrokes for very long sessions

### Code Changes for Production

In `client/src/pages/Trap.jsx`:

```javascript
// Change this:
const DEMO_MODE = true;

// To this:
const DEMO_MODE = false;
```

In `client/src/utils/sessionRecorder.js`, the recorder already has production mode:

```javascript
// Set mode to production
sessionRecorder.setMode('production');
// This will skip password field keystrokes
```

## Testing

### Manual Testing

1. **Record a Session**:
   - Go to `/login`
   - Type a SQLi payload: `admin' OR 1=1--`
   - Submit form
   - Check Dashboard for the event

2. **View Replay**:
   - Click "View Replay" on the event
   - Use controls to play back the session
   - Verify keystrokes appear correctly
   - Check click indicators appear

3. **Test Demo Data**:
   - Navigate to `/replay/1`
   - Should load SQLi demo replay
   - Test all playback controls

### Automated Testing

```bash
# Test backend endpoint
curl -X POST http://localhost:5000/api/submit \
  -H "Content-Type: application/json" \
  -d '{
    "input": "test",
    "actions": [{"type": "keystroke", "ts": 0, "payload": "t", "target": "input"}]
  }'

# Get event with actions
curl http://localhost:5000/api/events/1
```

## Troubleshooting

### Replay Not Loading

- Check browser console for errors
- Verify event ID exists in database
- Check if demo data is accessible at `/demo_replays.json`

### Actions Not Recording

- Verify `DEMO_MODE = true` in `Trap.jsx`
- Check browser console for recorder errors
- Ensure session recorder is initialized

### Playback Issues

- Verify `framer-motion` is installed
- Check that actions array is not empty
- Ensure timestamps are valid numbers

## File Structure

```
backend/
  routes/
    submit.py          # Enhanced submit endpoint
  main.py              # Router registration

client/
  src/
    components/
      ReplayPlayer.jsx # Main replay component
    pages/
      IncidentReplay.jsx # Replay page
      Trap.jsx          # Login page with recording
    hooks/
      useReplay.js      # Playback logic hook
    utils/
      sessionRecorder.js # Recording utility

public/
  demo_replays.json    # Sample replay data
```

## Future Enhancements

- [ ] Database storage for actions
- [ ] Real-time socket.io events
- [ ] Video export of replays
- [ ] Search/filter replays
- [ ] Annotations on replays
- [ ] Collaborative replay viewing
- [ ] Replay comparison tool

## License

Same as main project.



