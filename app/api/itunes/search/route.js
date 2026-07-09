export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const term = searchParams.get('term')?.trim() || '';
  const limit = Math.min(Math.max(Number(searchParams.get('limit') || 25), 1), 50);

  if (!term) {
    return Response.json({ resultCount: 0, results: [] });
  }

  try {
    const apiUrl =
      `https://itunes.apple.com/search?` +
      `term=${encodeURIComponent(term)}` +
      `&media=music&entity=song&limit=${limit}&country=vn`;

    const res = await fetch(apiUrl, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      return Response.json(
        { error: 'iTunes API unavailable', resultCount: 0, results: [] },
        { status: 502 }
      );
    }

    const data = await res.json();
    return Response.json(data, {
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    console.error('iTunes proxy error:', err);
    return Response.json(
      { error: 'Failed to reach iTunes', resultCount: 0, results: [] },
      { status: 500 }
    );
  }
}
