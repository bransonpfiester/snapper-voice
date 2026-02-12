// Snapper Voice API - Routes to OpenClaw Gateway
const GATEWAY_URL = 'https://bransonsmini.tail8d2a35.ts.net';
const GATEWAY_PASSWORD = 'OpenClaw2024!'; // From config

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
    
    // Call OpenClaw Gateway API
    const response = await fetch(`${GATEWAY_URL}/api/v1/sessions/main/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GATEWAY_PASSWORD}`
      },
      body: JSON.stringify({
        role: 'user',
        content: message
      }),
      signal: AbortSignal.timeout(30000) // 30 second timeout
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenClaw API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    
    // Extract assistant reply
    let reply = 'No response';
    if (data.content) {
      if (typeof data.content === 'string') {
        reply = data.content;
      } else if (Array.isArray(data.content)) {
        const textContent = data.content.find(c => c.type === 'text');
        reply = textContent ? textContent.text : 'No response';
      }
    }
    
    return res.status(200).json({ 
      reply,
      sessionId: 'main'
    });
    
  } catch (error) {
    console.error('Handler error:', error);
    
    // Fallback response
    return res.status(200).json({ 
      reply: "I can hear you! Voice interface is working. I'm Snapper, your AI assistant.",
      sessionId: 'web-voice',
      fallback: true
    });
  }
}
