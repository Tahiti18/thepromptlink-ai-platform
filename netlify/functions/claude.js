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
    const userPrompt = body.message || "Say hello and tell me about your capabilities.";

    const anthropicPayload = {
      model: "claude-3-opus-20240229", // Or your preferred Claude 3 model
      max_tokens: 600,
      messages: [
        {
          role: "system",
          content: `You are an AI assistant named Claude. Your primary goal is to provide concise, easily digestible, and visually distinct output.
          
          ALWAYS ADHERE TO THESE STRICT FORMATTING RULES:
          
          1.  CLEAR HEADINGS: Every main point MUST begin with an ALL CAPS line. Example: "MAIN TOPIC HERE 🚀"
          2.  BULLET LISTS: Use short bulleted lists for sub-points. Use the solid bullet character (•). Example:
              •  Sub-point one
              •  Sub-point two
          3.  SHORT PARAGRAPHS: Keep all paragraphs exceptionally brief, maximum 2-3 lines. Break up longer thoughts.
          4.  FREQUENT LINE BREAKS: Use ample line breaks to ensure generous white space and prevent dense text blocks.
          5.  EMOJIS: Occasionally use relevant, positive emojis for emphasis or to highlight key ideas.
          6.  NO MARKDOWN: Absolutely, under no circumstances, use ANY Markdown symbols (e.g., #, ##, *, -, >, \`\`\`, ---). This is critical.
          
          Your output must be designed for quick scanning and high readability. Prioritize this formatting above all else.`
        },
        {
          role: "user",
          content: userPrompt
        },
        {
            role: "assistant", // This can sometimes "kickstart" the formatting
            content: "Alright! I'm ready to help and will ensure my response is perfectly formatted according to your strict guidelines. What would you like to know or discuss? ✨"
        }
      ]
    };

    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
      },
      body: JSON.stringify(anthropicPayload)
    });

    const data = await anthropicResponse.json();

    if (!anthropicResponse.ok) {
      console.error("Anthropic API Error:", JSON.stringify(data, null, 2));
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: data.error?.message || "Unknown error from Anthropic API" })
      };
    }

    const reply = data.content?.[0]?.text || "No response text.";

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
