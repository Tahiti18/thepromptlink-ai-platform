import fetch from 'node-fetch';

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    console.log("=== Incoming event ===");
    console.log(JSON.stringify(event, null, 2));

    const body = JSON.parse(event.body);
    console.log("Parsed body:", body);

    const userPrompt = body.message || "Say hello.";
    console.log("User prompt:", userPrompt);

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: "claude-3-opus-20240229",
        max_tokens: 600,
        messages: [
          {
            role: "user",
            content: `${userPrompt}`
          }
        ]
      })
    });

    console.log("Raw anthropic response status:", anthropicResponse.status);

    const data = await anthropicResponse.json();
    console.log("Anthropic JSON:", data);

    if (!anthropicResponse.ok) {
      console.error("Anthropic API returned non-OK status:", anthropicResponse.status);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: data })
      };
    }

    let reply = "No response text.";
    if (data.content && Array.isArray(data.content) && data.content[0]?.text) {
      reply = data.content[0].text;
    } else {
      console.error("Data did not have expected content array.");
    }

    console.log("Reply to return:", reply);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: reply })
    };

  } catch (error) {
    console.error("Function Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
