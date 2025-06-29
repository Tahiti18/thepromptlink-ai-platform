import fetch from 'node-fetch';

// Post-processing to enforce formatting rules
const enforceFormatting = (text) => {
  let processed = text
    .replace(/^#+\s*(.*)/gm, (_, p1) => `\n${p1.toUpperCase()}\n`) // markdown to ALL CAPS
    .replace(/^[-*]\s+/gm, '• ') // normalize bullet points
    .replace(/\n{2,}/g, '\n\n') // consistent spacing
    .replace(/([^\n])\n([^\n•])/g, '$1\n\n$2') // add blank lines
    .replace(/[#>_*`~]/g, '') // strip markdown symbols
    .replace(/([a-z])\n([A-Z]{2,})/g, '$1\n\n$2') // spacing before ALL CAPS
    .replace(/([A-Z]{2,})\n([a-z])/g, '$1\n\n$2'); // spacing after ALL CAPS

  return processed.trim();
};

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
        max_tokens: 1000,
        system: `You are an AI assistant that STRICTLY follows these formatting rules:
        
1. HEADINGS: Each main point must begin with an ALL CAPS heading followed by a blank line.
2. STRUCTURE: Use bullet points (•) for lists. Keep paragraphs under 3 lines.
3. SPACING: Always have blank lines between sections and after headings.
4. EMOJIS: Use relevant emojis sparingly to highlight key points.
5. DO NOT: Use markdown (#, *, >, \`\`\`, etc.), long paragraphs, or unbroken walls of text.

EXAMPLE OUTPUT:

INTRODUCTION
Thank you for your question!

MAIN POINTS
• Short, clear explanation.
• Another concise point.

CONCLUSION
Summed up clearly ✨`,
        messages: [
          { role: "user", content: userPrompt }
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

    let reply = data.content?.[0]?.text || "No response text.";

    reply = enforceFormatting(reply);

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
