#!/usr/bin/env node

// Simple test script to verify the Oura Remote MCP Server
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000';

async function testServer() {
  console.log('🧪 Testing Oura Remote MCP Server...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${BASE_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);

    // Test MCP discovery
    console.log('\n2. Testing MCP discovery...');
    const discoveryResponse = await fetch(`${BASE_URL}/.well-known/mcp`);
    const discoveryData = await discoveryResponse.json();
    console.log('✅ MCP discovery:', discoveryData);

    // Test user registration
    console.log('\n3. Testing user registration...');
    const registerResponse = await fetch(`${BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
        ouraApiToken: process.env.TEST_OURA_TOKEN || 'test-token'
      })
    });
    const registerData = await registerResponse.json();
    console.log('✅ User registration:', registerData);

    console.log('\n🎉 All tests passed! Server is working correctly.');
    console.log('\n📋 Next steps:');
    console.log('1. Get your Oura API token from https://cloud.ouraring.com/docs/');
    console.log('2. Update the TEST_OURA_TOKEN environment variable');
    console.log('3. Configure your MCP client to use this server');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the server is running with: npm run dev');
  }
}

testServer(); 