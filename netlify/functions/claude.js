const fetch = require('node-fetch');

exports.handler = async (event, context) => {
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
    const { prompt } = JSON.parse(event.body);
    
    if (!prompt) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Prompt required' })
      };
    }

    const GENSPARK_API_KEY = process.env.GENSPARK_API_KEY;
    
    if (!GENSPARK_API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'API key not configured' })
      };
    }

    const systemPrompt = `You are Claude, an AI assistant for PromptLink. You MUST follow these formatting rules in EVERY response:

CRITICAL FORMATTING REQUIREMENTS:
• Start with an ALL CAPS heading for your main point
• Use bullet points (•) for all lists
• Keep paragraphs to 2-3 lines maximum
• Add line breaks between every major point
• Use emojis sparingly but effectively
• NEVER use markdown symbols (no #, >, ---, backticks)
• Structure: HEADING → brief explanation → bullet points → line break → next section

EXAMPLE FORMAT:
UNDERSTANDING YOUR REQUEST 🎯

This is a brief explanation of what you're asking for.
I'll break this down into clear, digestible points.

• First key point here
• Second important detail
• Third relevant insight

PRACTICAL SOLUTION ⚡

Here's how to approach this specific situation.
Each paragraph stays short and focused.

• Action step one
• Action step two
• Expected outcome`;

    const response = await fetch('https://api.genspark.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GENSPARK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: 4000,
        temperature: 0.7
      })
    });

    const data = await response.json();
    let claudeResponse = data.choices?.[0]?.message?.content;

    if (!claudeResponse) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'No response from Claude' })
      };
    }

    claudeResponse = formatClaudeResponse(claudeResponse);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        response: claudeResponse,
        success: true,
        timestamp: new Date().toISOString()
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};

function formatClaudeResponse(text) {
  text = text.replace(/```[\s\S]*?```/g, '');
  text = text.replace(/`([^`]+)`/g, '$1');
  text = text.replace(/^#{1,6}\s+/gm, '');
  text = text.replace(/^\>\s+/gm, '');
  text = text.replace(/^\-{3,}/gm, '');

  let paragraphs = text.split('\n\n');
  let formatted = [];

  for (let i = 0; i < paragraphs.length; i++) {
    let para = paragraphs[i].trim();
    if (!para) continue;

    if (para.length > 200 && !para.includes('•')) {
      let sentences = para.split(/[.!?]+/).filter(s => s.trim());
      if (sentences.length > 0) {
        let firstSentence = sentences[0].trim();
        if (firstSentence) {
          let keyWords = extractKeyWords(firstSentence);
          formatted.push(`${keyWords.toUpperCase()} 🎯\n`);
          for (let j = 1; j < sentences.length; j++) {
            let sentence = sentences[j].trim();
            if (sentence) {
              formatted.push(`• ${sentence}.\n`);
            }
          }
          formatted.push('');
        }
      }
    } else {
      if (para.length > 100 && !para.startsWith('•') && !isAllCaps(para.split(' ')[0])) {
        formatted.push(`• ${para}\n`);
      } else {
        formatted.push(`${para}\n`);
      }
    }
  }

  let result = formatted.join('\n');
  if (!result.match(/^[A-Z\s]{3,}[🎯⚡✨🚀💡🔥]/m)) {
    result = `CLAUDE RESPONSE 🎯\n\n${result}`;
  }
  result = result.replace(/\n{3,}/g, '\n\n');

  return result.trim();
}

function extractKeyWords(sentence) {
  const stopWords = ['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of', 'as', 'by'];
  let words = sentence.split(' ').filter(word => 
    word.length > 2 && 
    !stopWords.includes(word.toLowerCase()) &&
    /[a-zA-Z]/.test(word)
  );
  return words.slice(0, 3).join(' ');
}

function isAllCaps(text) {
  return text === text.toUpperCase() && /[A-Z]/.test(text);
}
