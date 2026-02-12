import WebSocket from 'ws';

const GATEWAY_WS_URL = 'wss://bransonsmini.tail8d2a35.ts.net';
const GATEWAY_PASSWORD = '64b5408ca5a2ba319fb0075f6d353fe0aded3fe89d6ca56f';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { message, sessionId = 'web-voice' } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Connect to OpenClaw via WebSocket
    const ws = new WebSocket(GATEWAY_WS_URL);
    let responseText = '';
    let authSuccess = false;
    
    const timeout = setTimeout(() => {
      ws.close();
      if (!res.headersSent) {
        res.status(504).json({ error: 'Gateway timeout' });
      }
    }, 30000); // 30 second timeout
    
    ws.on('open', () => {
      // Authenticate
      ws.send(JSON.stringify({
        type: 'auth',
        password: GATEWAY_PASSWORD
      }));
    });
    
    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        
        if (msg.type === 'auth_success') {
          authSuccess = true;
          // Send the user message
          ws.send(JSON.stringify({
            type: 'chat',
            sessionKey: `agent:main:${sessionId}`,
            message: message
          }));
        } else if (msg.type === 'chat_response' || msg.type === 'message') {
          responseText += msg.text || msg.content || '';
        } else if (msg.type === 'chat_complete' || msg.type === 'done') {
          clearTimeout(timeout);
          ws.close();
          res.status(200).json({
            reply: responseText || 'No response',
            sessionId: sessionId
          });
        } else if (msg.type === 'error') {
          clearTimeout(timeout);
          ws.close();
          res.status(500).json({ error: msg.message || 'Gateway error' });
        }
      } catch (err) {
        console.error('Message parse error:', err);
      }
    });
    
    ws.on('error', (error) => {
      clearTimeout(timeout);
      console.error('WebSocket error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'WebSocket connection failed' });
      }
    });
    
    ws.on('close', () => {
      clearTimeout(timeout);
      if (!res.headersSent) {
        // If we got a response, send it
        if (responseText) {
          res.status(200).json({ reply: responseText, sessionId: sessionId });
        } else {
          res.status(500).json({ error: 'Connection closed without response' });
        }
      }
    });
    
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ error: error.message });
  }
}
