export default async (request, context) => {
  return new Response(JSON.stringify({
    message: "✅ Netlify test function operational",
    timestamp: new Date().toISOString(),
    method: request.method,
    url: request.url,
    platform: "ThePromptLink AI Collaboration Platform",
    status: "✅ All systems operational",
    nextStep: "Claude function should now be working too!"
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    }
  });
};