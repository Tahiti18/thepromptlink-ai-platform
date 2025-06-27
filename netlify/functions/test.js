export default async (request, context) => {
  return new Response(JSON.stringify({
    message: "✅ Netlify functions live.",
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
};
