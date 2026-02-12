# Snapper Voice - Real-Time Streaming Deployment

Complete deployment guide for the real-time WebSocket streaming system.

## Architecture

```
┌─────────────────────┐
│   Vercel Frontend   │ (https://snapper-voice.vercel.app)
│   index.html        │
└──────────┬──────────┘
           │ WebSocket (wss://)
           ▼
┌─────────────────────┐
│  Tailscale Funnel   │ (wss://bransonsmini.tail8d2a35.ts.net/ws)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  WebSocket Server   │ (localhost:18791)
│  ws-server/         │
└──────────┬──────────┘
           │
           ├─► OpenClaw Gateway (https://bransonsmini.tail8d2a35.ts.net)
           │
           └─► ElevenLabs TTS API (streaming)
```

## Components

### 1. WebSocket Server (Mac Mini)
**Location:** `/Users/bpfiester/Coding/snapper-voice/ws-server/`
**Port:** 18791
**Purpose:** Real-time communication hub

**Features:**
- WebSocket connections from frontend
- OpenClaw API integration
- ElevenLabs streaming TTS
- Audio chunk streaming

**Start/Stop:**
```bash
cd /Users/bpfiester/Coding/snapper-voice/ws-server
./start.sh    # Start server
./stop.sh     # Stop server
```

**Check status:**
```bash
curl http://localhost:18791/health
# Should return: {"status":"ok","connections":0}
```

### 2. Tailscale Funnel (Public Access)
**URL:** `wss://bransonsmini.tail8d2a35.ts.net/ws`
**Purpose:** Expose WebSocket server to internet

**Configuration:**
```bash
# View current config
tailscale funnel status

# Add WebSocket endpoint (already configured)
tailscale funnel --bg --https=443 --set-path=/ws 18791
```

**Verify:**
```bash
# Check funnel status
tailscale funnel status | grep "/ws"
# Should show: |-- /ws proxy http://127.0.0.1:18791
```

### 3. Frontend (Vercel)
**URL:** https://snapper-voice.vercel.app
**Files:** 
- `index.html` - Streaming version
- `index-http-backup.html` - Original HTTP version

**Deploy:**
```bash
cd /Users/bpfiester/Coding/snapper-voice
git add -A
git commit -m "Update frontend"
git push origin main
# Vercel auto-deploys
```

## Testing the Complete System

### 1. Test WebSocket Server (Local)
```bash
curl http://localhost:18791/health
```

### 2. Test via Tailscale Funnel
```bash
curl -i https://bransonsmini.tail8d2a35.ts.net/ws/health
# Note: WebSocket upgrade happens automatically
```

### 3. Test Frontend
1. Open https://snapper-voice.vercel.app
2. Check browser console for:
   - `✅ WebSocket connected`
   - Status: "Connected (Streaming Mode)"
3. Click "Hold to Talk" and speak
4. Should see:
   - Your transcribed message
   - AI response text (immediately)
   - Audio streaming (plays while generating)

## How It Works

### User Speaks:
1. Frontend uses browser SpeechRecognition API
2. Transcript sent via WebSocket to server
3. Server forwards to OpenClaw Gateway
4. OpenClaw generates response

### AI Responds:
1. Text response sent to frontend immediately
2. Server streams audio via ElevenLabs
3. Audio chunks sent to frontend as they arrive
4. Frontend plays chunks using Web Audio API
5. Smooth, ChatGPT-like experience

## Auto-Start on Boot

Create a LaunchAgent to start WebSocket server automatically:

**File:** `~/Library/LaunchAgents/com.snapper.voice-ws.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.snapper.voice-ws</string>
    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/Users/bpfiester/Coding/snapper-voice/ws-server/server.js</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/bpfiester/Coding/snapper-voice/ws-server</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/bpfiester/Coding/snapper-voice/ws-server/logs/stdout.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/bpfiester/Coding/snapper-voice/ws-server/logs/stderr.log</string>
</dict>
</plist>
```

**Load it:**
```bash
launchctl load ~/Library/LaunchAgents/com.snapper.voice-ws.plist
```

## Monitoring

### View Logs
```bash
# WebSocket server logs
tail -f /Users/bpfiester/Coding/snapper-voice/ws-server/logs/server.log

# Check connections
curl http://localhost:18791/health | jq
```

### Check Process
```bash
# Find WebSocket server process
lsof -i :18791

# Check if running
ps aux | grep "node server.js"
```

## Troubleshooting

### WebSocket won't connect
1. Check server is running: `lsof -i :18791`
2. Check Tailscale funnel: `tailscale funnel status`
3. Check browser console for errors
4. Verify URL: `wss://bransonsmini.tail8d2a35.ts.net/ws`

### Audio not playing
1. Check browser console for audio errors
2. Verify ElevenLabs API key in `ws-server/.env`
3. Check server logs for TTS errors
4. Try clicking page first (browser autoplay policy)

### Server crashes
1. Check logs: `tail -f ws-server/logs/server.log`
2. Restart: `./stop.sh && ./start.sh`
3. Check for port conflicts: `lsof -i :18791`

### OpenClaw errors
1. Verify gateway URL in `ws-server/.env`
2. Check gateway password is correct
3. Test gateway directly: `curl https://bransonsmini.tail8d2a35.ts.net/health`

## Performance

- **Latency:** ~500ms-1s (including OpenClaw processing)
- **Audio streaming:** Chunks arrive every ~200ms
- **Concurrent users:** Supports multiple connections
- **Bandwidth:** ~50kb/s per active voice session

## Security

- ✅ HTTPS/WSS encryption via Tailscale
- ✅ API keys stored in .env (not committed)
- ✅ Gateway password authentication
- ⚠️  Public access via Tailscale funnel (consider adding auth)

## Future Improvements

- [ ] Add user authentication
- [ ] Support multiple voice profiles
- [ ] Add conversation history
- [ ] Support voice interruption
- [ ] Add voice activity detection (VAD)
- [ ] Optimize audio buffering
- [ ] Add reconnection logic
- [ ] Support mobile apps via same WebSocket API
