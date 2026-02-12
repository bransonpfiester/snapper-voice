#!/usr/bin/env node

// Simple WebSocket test client for Snapper Voice
import WebSocket from 'ws';

const WS_URL = process.argv[2] || 'wss://bransonsmini.tail8d2a35.ts.net/ws';
const TEST_MESSAGE = process.argv[3] || 'Hello Snapper! This is a test of the real-time streaming system.';

console.log('🧪 Snapper Voice WebSocket Test');
console.log(`   Connecting to: ${WS_URL}`);
console.log(`   Test message: "${TEST_MESSAGE}"\n`);

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
  console.log('✅ WebSocket connected\n');
  
  // Send test message
  console.log('📤 Sending test message...');
  ws.send(JSON.stringify({
    type: 'chat',
    content: TEST_MESSAGE
  }));
});

ws.on('message', (data) => {
  const msg = JSON.parse(data.toString());
  
  switch (msg.type) {
    case 'connected':
      console.log(`🔗 ${msg.message} (Client ID: ${msg.clientId})`);
      break;
    
    case 'status':
      console.log(`📊 Status: ${msg.status}`);
      break;
    
    case 'text':
      console.log(`\n💬 Response: "${msg.content}"\n`);
      break;
    
    case 'audio':
      console.log(`🔊 Audio chunk received (${msg.chunk})`);
      break;
    
    case 'audio_complete':
      console.log('✅ Audio playback complete');
      break;
    
    case 'complete':
      console.log('\n✅ Response complete!\n');
      ws.close();
      break;
    
    case 'error':
      console.error(`\n❌ Error: ${msg.error}\n`);
      ws.close();
      break;
    
    default:
      console.log(`📨 Unknown message type: ${msg.type}`);
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
  process.exit(1);
});

ws.on('close', () => {
  console.log('👋 WebSocket disconnected');
  process.exit(0);
});

// Timeout after 30 seconds
setTimeout(() => {
  console.error('\n⏱️  Test timeout (30s)');
  ws.close();
  process.exit(1);
}, 30000);
