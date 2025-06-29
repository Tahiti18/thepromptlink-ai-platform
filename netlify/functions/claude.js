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

    // ENHANCED SYSTEM PROMPT FOR FORCED FORMATTING
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
• Expected outcome

Remember: Short paragraphs, clear headings, frequent breaks, organized bullets.`;

    const response = await fetch('https://api.genspark.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GENSPARK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-sonnet-20240229',
        messages: [
          { 
            role: 'system', 
            content: systemPrompt 
          },
          { 
            role: 'user', 
            content: prompt 
          }
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

    // POST-PROCESSING TO FORCE FORMATTING IF CLAUDE IGNORES INSTRUCTIONS
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

// POST-PROCESSING FUNCTION TO FORCE FORMATTING
function formatClaudeResponse(text) {
  // Remove any markdown formatting
  text = text.replace(/```[\s\S]*?```/g, ''); // Remove code blocks
  text = text.replace(/`([^`]+)`/g, '$1'); // Remove inline code
  text = text.replace(/^#{1,6}\s+/gm, ''); // Remove markdown headers
  text = text.replace(/^\>\s+/gm, ''); // Remove blockquotes
  text = text.replace(/^\-{3,}/gm, ''); // Remove horizontal rules
  
  // Split into paragraphs
  let paragraphs = text.split('\n\n');
  let formatted = [];
  
  for (let i = 0; i < paragraphs.length; i++) {
    let para = paragraphs[i].trim();
    if (!para) continue;
    
    // If paragraph is long (>200 chars), try to break it up
    if (para.length > 200 && !para.includes('•')) {
      // Split long paragraph into shorter sentences
      let sentences = para.split(/[.!?]+/).filter(s => s.trim());
      
      // Create a heading for the first part
      if (sentences.length > 0) {
        let firstSentence = sentences[0].trim();
        if (firstSentence) {
          // Extract key words for heading
          let keyWords = extractKeyWords(firstSentence);
          formatted.push(`${keyWords.toUpperCase()} 🎯\n`);
          
          // Add remaining sentences as bullets or short paragraphs
          for (let j = 1; j < sentences.length; j++) {
            let sentence = sentences[j].trim();
            if (sentence) {
              formatted.push(`• ${sentence}.\n`);
            }
          }
          formatted.push(''); // Add line break
        }
      }
    } else {
      // Keep shorter paragraphs but ensure proper formatting
      if (para.length > 100 && !para.startsWith('•') && !isAllCaps(para.split(' ')[0])) {
        // Convert to bullet if it's a medium-length statement
        formatted.push(`• ${para}\n`);
      } else {
        formatted.push(`${para}\n`);
      }
    }
  }
  
  let result = formatted.join('\n');
  
  // Ensure we have at least one ALL CAPS heading
  if (!result.match(/^[A-Z\s]{3,}[🎯⚡✨🚀💡🔥]/m)) {
    result = `CLAUDE RESPONSE 🎯\n\n${result}`;
  }
  
  // Clean up extra line breaks
  result = result.replace(/\n{3,}/g, '\n\n');
  
  return result.trim();
}

// Helper function to extract key words for headings
function extractKeyWords(sentence) {
  const stopWords = ['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of', 'as', 'by'];
  let words = sentence.split(' ').filter(word => 
    word.length > 2 && 
    !stopWords.includes(word.toLowerCase()) &&
    /[a-zA-Z]/.test(word)
  );
  return words.slice(0, 3).join(' ');
}

// Helper function to check if text is all caps
function isAllCaps(text) {
  return text === text.toUpperCase() && /[A-Z]/.test(text);
}
