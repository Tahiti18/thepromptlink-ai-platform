export default async (request, context) => {
  return new Response(JSON.stringify({
    message: "✅ Netlify test function operational",
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
};
