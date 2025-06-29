const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // CORS headers for cross-origin requests
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight OPTIONS request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        error: 'Method Not Allowed',
        message: 'Only POST requests are supported'
      })
    };
  }

  try {
    // Parse request body
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid JSON',
          message: 'Request body must be valid JSON'
        })
      };
    }

    // Validate required fields
    const { prompt, model = 'claude-3-sonnet-20240229' } = requestBody;
    
    if (!prompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Missing Required Field',
          message: 'Prompt is required in request body'
        })
      };
    }

    // Get GenSpark API key from environment variables
    const GENSPARK_API_KEY = process.env.GENSPARK_API_KEY;
    
    if (!GENSPARK_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Configuration Error',
          message: 'GenSpark API key not configured'
        })
      };
    }

    // Prepare request to GenSpark Claude API
    const gensparkRequest = {
      model: model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: requestBody.max_tokens || 4000,
      temperature: requestBody.temperature || 0.7,
      stream: false
    };

    // Call GenSpark Claude API
    const gensparkResponse = await fetch('https://api.genspark.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GENSPARK_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'PromptLink-Netlify-Function/1.0'
      },
      body: JSON.stringify(gensparkRequest),
      timeout: 30000
    });

    // Check if GenSpark API request was successful
    if (!gensparkResponse.ok) {
      const errorData = await gensparkResponse.text();
      console.error('GenSpark API Error:', errorData);
      
      return {
        statusCode: gensparkResponse.status,
        headers,
        body: JSON.stringify({
          error: 'GenSpark API Error',
          message: `API request failed with status ${gensparkResponse.status}`,
          details: errorData
        })
      };
    }

    // Parse GenSpark response
    const gensparkData = await gensparkResponse.json();

    // Extract Claude's response
    const claudeResponse = gensparkData.choices?.[0]?.message?.content;
    
    if (!claudeResponse) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({
          error: 'Invalid Response',
          message: 'No response content received from Claude API',
          raw_response: gensparkData
        })
      };
    }

    // Return successful response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        response: claudeResponse,
        model: model,
        usage: gensparkData.usage || {},
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    console.error('Function Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Function Error',
        message: error.message || 'Internal server error',
        timestamp: new Date().toISOString()
      })
    };
  }
};
