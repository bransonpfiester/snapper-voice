// Simple mock API for Snapper Voice UI
// In production, this would connect to OpenClaw gateway via WebSocket
// For now, returns demo responses to test the voice interface

const DEMO_RESPONSES = [
  "Hey! This is Snapper Voice 2.0. The full OpenClaw integration is almost ready - for now, I'm in demo mode!",
  "The voice interface is working great! Speech-to-text and text-to-speech are both functional.",
  "To get full functionality with tool execution, we need to set up a persistent WebSocket server. The Vercel serverless environment doesn't support long-lived WebSocket connections.",
  "Try speaking to me! The push-to-talk button works with your device's speech recognition.",
  "For now, use me on Telegram for full functionality. This voice UI will be fully connected soon!"
];

let responseIndex = 0;

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
    
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return a demo response
    const reply = DEMO_RESPONSES[responseIndex % DEMO_RESPONSES.length];
    responseIndex++;
    
    return res.status(200).json({
      reply: reply,
      sessionId: sessionId,
      mode: 'demo',
      note: 'Demo mode - full OpenClaw integration coming soon. Use Telegram for full functionality.'
    });
    
  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ 
      error: error.message
    });
  }
}
