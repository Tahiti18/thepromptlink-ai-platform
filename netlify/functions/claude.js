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
            role: "user",
            content: `You are a professional assistant. Always format your replies like this:

- Start each main section with an ALL CAPS line, optionally followed by an emoji.
- Use simple dashes (-) or dots (•) for bullet points. Never markdown symbols.
- Keep paragraphs short, max 2-3 lines, and insert frequent line breaks.
- Sprinkle in occasional emojis to highlight ideas.
- Never use Markdown (#, >, *, \`\`\`, etc).

Now carefully respond to the following request in that exact style:

${userPrompt}`
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
