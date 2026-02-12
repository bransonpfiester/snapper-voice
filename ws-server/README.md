# Snapper Voice WebSocket Server

Real-time streaming server for Snapper Voice interface.

## Features

- **Real-time WebSocket connections** - Bi-directional streaming
- **OpenClaw API integration** - Routes messages to main agent session
- **ElevenLabs streaming TTS** - Audio chunks stream as they're generated
- **Health checks** - Monitor server status

## Running the Server

### Development
```bash
npm start
```

### Production (with PM2)
```bash
pm2 start ecosystem.config.cjs
```

### Background Process
```bash
node server.js &
```

## Endpoints

- **WebSocket**: `wss://bransonsmini.tail8d2a35.ts.net/ws`
- **Health Check**: `https://bransonsmini.tail8d2a35.ts.net/ws/health`

## Configuration

Environment variables (see `.env`):
- `PORT` - Server port (default: 18791)
- `GATEWAY_URL` - OpenClaw gateway URL
- `GATEWAY_PASSWORD` - Auth password
- `ELEVENLABS_API_KEY` - ElevenLabs API key
- `ELEVENLABS_VOICE_ID` - Voice ID for TTS

## WebSocket Protocol

### Client → Server

**Chat message:**
```json
{
  "type": "chat",
  "content": "Your message here"
}
```

**Ping:**
```json
{
  "type": "ping"
}
```

### Server → Client

**Connection established:**
```json
{
  "type": "connected",
  "clientId": "abc123",
  "message": "Connected to Snapper Voice streaming server"
}
```

**Status update:**
```json
{
  "type": "status",
  "status": "thinking" | "speaking"
}
```

**Text response:**
```json
{
  "type": "text",
  "content": "Response text"
}
```

**Audio chunk:**
```json
{
  "type": "audio",
  "data": "base64-encoded-audio",
  "chunk": 0
}
```

**Completion:**
```json
{
  "type": "complete"
}
```

**Error:**
```json
{
  "type": "error",
  "error": "Error message"
}
```

## Tailscale Funnel Setup

The server is exposed via Tailscale funnel:

```bash
tailscale funnel --bg --https=443 --set-path=/ws 18791
```

This makes it accessible at:
- `https://bransonsmini.tail8d2a35.ts.net/ws` (WebSocket)
- Automatically upgrades HTTP connections to WebSocket

## Auto-Start on Boot

Add to crontab or launchd to start automatically:

```bash
@reboot cd /Users/bpfiester/Coding/snapper-voice/ws-server && node server.js >> logs/cron.log 2>&1 &
```
