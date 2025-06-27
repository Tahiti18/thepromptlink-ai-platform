// netlify/functions/claude.js
export default async (request, context) => {
  // Handle CORS preflight requests
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
    
    // For now, we'll return a mock response
    // Later we'll integrate with actual Claude API
    const response = {
      message: `Claude received: "${message}". This is a test response from the Claude function. Integration with Anthropic's API will be added next.`,
      timestamp: new Date().toISOString(),
      status: 'success',
      conversationHistory: [...conversationHistory, {
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      }, {
        role: 'assistant',
        content: `Claude received: "${message}". This is a test response from the Claude function. Integration with Anthropic's API will be added next.`,
        timestamp: new Date().toISOString()
      }]
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    });

  } catch (error) {
    console.error('Claude function error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error.message,
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
