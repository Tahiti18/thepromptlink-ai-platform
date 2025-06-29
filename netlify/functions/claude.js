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
            content: userPrompt
          }
        ]
      })
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

    let reply = data.content?.[0]?.text || "No response text.";

    // 🔥 INSERT POST-PROCESSING HERE
    reply = enforceClaudeFormatting(reply);

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

// EXACT post-processing function you provided
function enforceClaudeFormatting(text) {
  let formattedText = text;

  formattedText = formattedText.split('\n').map(line => {
    line = line.trim();
    if (line.length > 3 && line.length < 50 && !line.endsWith('.') && !line.endsWith('?') && !line.endsWith('!')) {
      if (line !== line.toUpperCase()) {
        line = line.toUpperCase();
      }
      if (!/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/u.test(line)) {
        line += ' ✨';
      }
    }
    return line;
  }).join('\n');

  formattedText = formattedText.replace(/^(\s*)[\*-]\s*(.*)$/gm, '$1• $2');

  let lines = formattedText.split('\n');
  let newLines = [];
  let currentParagraphLines = 0;

  for (let i = 0; i < lines.length; i++) {
    newLines.push(lines[i]);
    if (lines[i].trim() !== '') {
      currentParagraphLines++;
    } else {
      currentParagraphLines = 0;
    }

    if (currentParagraphLines >= 3 && i < lines.length - 1 && lines[i+1].trim() !== '') {
      newLines.push('');
      currentParagraphLines = 0;
    }
  }
  formattedText = newLines.join('\n');

  formattedText = formattedText.replace(/\*\*([^\*]+)\*\*/g, '$1');
  formattedText = formattedText.replace(/\*([^\*]+)\*/g, '$1');
  formattedText = formattedText.replace(/_([^_]+)_/g, '$1');
  formattedText = formattedText.replace(/```[a-zA-Z]*\n/g, '').replace(/```/g, '');

  return formattedText;
}
