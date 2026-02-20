export async function GET() {
  return Response.json({
    status: 'ok',
    app: 'web',
    timestamp: new Date().toISOString(),
  });
}
