import { WebSocketServer } from 'ws';
import fetch from 'node-fetch';
import { createServer } from 'http';

// Configuration
const PORT = 18791;
const GATEWAY_URL = 'https://bransonsmini.tail8d2a35.ts.net';
const GATEWAY_PASSWORD = 'OpenClaw2024!';
const ELEVENLABS_API_KEY = 'sk_6e29c2c4e7217fd6e947103b18524c8868ae8f6b954f6bcf';
const ELEVENLABS_VOICE_ID = 'IKne3meq5aSn9XLyUdCD'; // Charlie voice

// Create HTTP server for health checks
const httpServer = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', connections: wss.clients.size }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

// Create WebSocket server
const wss = new WebSocketServer({ server: httpServer });

console.log(`🚀 Snapper Voice WebSocket Server`);
console.log(`   Port: ${PORT}`);
console.log(`   Gateway: ${GATEWAY_URL}`);
console.log(`   Waiting for connections...`);

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const clientId = Math.random().toString(36).substring(7);
  console.log(`✅ Client connected: ${clientId} from ${req.socket.remoteAddress}`);
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connected',
    clientId,
    message: 'Connected to Snapper Voice streaming server'
  }));
  
  // Handle incoming messages
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      await handleMessage(ws, clientId, message);
    } catch (error) {
      console.error(`❌ Error handling message from ${clientId}:`, error);
      ws.send(JSON.stringify({
        type: 'error',
        error: error.message
      }));
    }
  });
  
  ws.on('close', () => {
    console.log(`👋 Client disconnected: ${clientId}`);
  });
  
  ws.on('error', (error) => {
    console.error(`❌ WebSocket error for ${clientId}:`, error);
  });
});

// Handle different message types
async function handleMessage(ws, clientId, message) {
  switch (message.type) {
    case 'chat':
      await handleChatMessage(ws, clientId, message);
      break;
    
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong' }));
      break;
    
    default:
      console.log(`⚠️  Unknown message type from ${clientId}:`, message.type);
  }
}

// Handle chat messages with streaming
async function handleChatMessage(ws, clientId, message) {
  const userMessage = message.content || message.message;
  
  if (!userMessage) {
    ws.send(JSON.stringify({
      type: 'error',
      error: 'No message content provided'
    }));
    return;
  }
  
  console.log(`💬 ${clientId}: "${userMessage}"`);
  
  try {
    // Send status update
    ws.send(JSON.stringify({
      type: 'status',
      status: 'thinking'
    }));
    
    // Use the existing Vercel API endpoint (already working)
    const response = await fetch('https://snapper-voice.vercel.app/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: userMessage,
        sessionId: 'web-voice-streaming'
      }),
      signal: AbortSignal.timeout(30000)
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }
    
    const data = await response.json();
    const replyText = data.reply || 'No response';
    
    console.log(`🤖 Response: "${replyText.substring(0, 100)}..."`);
    
    // Send text response
    ws.send(JSON.stringify({
      type: 'text',
      content: replyText
    }));
    
    // Stream TTS audio
    await streamTTS(ws, clientId, replyText);
    
    // Send completion
    ws.send(JSON.stringify({
      type: 'complete'
    }));
    
  } catch (error) {
    console.error(`❌ Error processing chat for ${clientId}:`, error);
    ws.send(JSON.stringify({
      type: 'error',
      error: error.message
    }));
  }
}

// Stream TTS audio using ElevenLabs streaming API
async function streamTTS(ws, clientId, text) {
  if (!text || text.trim().length === 0) {
    return;
  }
  
  try {
    console.log(`🔊 Streaming TTS for ${clientId}...`);
    
    ws.send(JSON.stringify({
      type: 'status',
      status: 'speaking'
    }));
    
    // Use ElevenLabs streaming endpoint
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}/stream`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75
          }
        })
      }
    );
    
    if (!response.ok) {
      throw new Error(`ElevenLabs error: ${response.status}`);
    }
    
    // Stream audio chunks to client
    const reader = response.body;
    let chunkCount = 0;
    
    for await (const chunk of reader) {
      if (ws.readyState !== ws.OPEN) {
        console.log(`⚠️  Client ${clientId} disconnected during TTS`);
        break;
      }
      
      // Send audio chunk as base64
      ws.send(JSON.stringify({
        type: 'audio',
        data: chunk.toString('base64'),
        chunk: chunkCount++
      }));
    }
    
    console.log(`✅ TTS streaming complete for ${clientId} (${chunkCount} chunks)`);
    
    ws.send(JSON.stringify({
      type: 'audio_complete'
    }));
    
  } catch (error) {
    console.error(`❌ TTS streaming error for ${clientId}:`, error);
    ws.send(JSON.stringify({
      type: 'error',
      error: `TTS error: ${error.message}`
    }));
  }
}

// Start server
httpServer.listen(PORT, () => {
  console.log(`\n🎙️  Server running on port ${PORT}`);
  console.log(`   WebSocket: ws://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/health`);
  console.log(`\n   Ready for connections!\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n👋 Shutting down gracefully...');
  wss.clients.forEach((ws) => {
    ws.close(1000, 'Server shutting down');
  });
  httpServer.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
