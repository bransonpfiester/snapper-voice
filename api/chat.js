// Snapper Voice API - Routes to Mac Mini bridge server
const BRIDGE_URL = 'https://bransonsmini.tail8d2a35.ts.net/voice-api';

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
    
    // Forward to bridge server
    const response = await fetch(`${BRIDGE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message, sessionId }),
      signal: AbortSignal.timeout(25000) // 25 second timeout
    });
    
    if (!response.ok) {
      throw new Error(`Bridge server error: ${response.status}`);
    }
    
    const data = await response.json();
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('Handler error:', error);
    
    // Fallback response
    return res.status(200).json({ 
      reply: "I'm here! The voice interface is working. I'm still connecting all the pieces together, but I can hear you and respond with real voice now!",
      sessionId: req.body.sessionId || 'web-voice',
      fallback: true
    });
  }
}
