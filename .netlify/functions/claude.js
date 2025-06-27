export default async (request, context) => {
  const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
  const API_URL = "https://api.anthropic.com/v1/messages";

  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  try {
    const { message, conversationHistory = [] } = await request.json();

    const body = {
      model: "claude-3-opus-20240229",
      max_tokens: 1000,
      temperature: 0.7,
      messages: [
        ...conversationHistory,
        { role: "user", content: message }
      ]
    };

    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    return new Response(JSON.stringify({
      status: "success",
      claudeReply: data.content,
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({
      error: "Claude API call failed",
      details: err.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
};
