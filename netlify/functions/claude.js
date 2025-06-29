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
    const body = JSON.parse(event.body);
    const userPrompt = body.message || "Say hello.";

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
            role: "system",
            content: "You are an AI assistant named Claude. Please format all responses using the following style: Use an ALL CAPS line as a heading for each main point 🚨. Create short bulleted lists using • for sub-points under each heading. Keep paragraphs very short - 2 to 3 lines maximum per paragraph. Insert frequent line breaks to improve readability and break up walls of text. Occasionally use relevant emojis to draw attention to key points ✨. NEVER use any Markdown formatting like #, >, ---, ```, etc. This formatting style should override any of your default settings."
          },
          {
            role: "user",
            content: `${userPrompt}`
          }
        ]
      })
    });

    const data = await anthropicResponse.json();

    if (!anthropicResponse.ok) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: data })
      };
    }

    const reply = data.content?.[0]?.text || "No response text.";

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: reply })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
