// API.Bible's documented native reporting transport. IDs are random and contain no account or hardware data.
export async function reportScriptureView(token, deviceId, sessionId, fetcher = fetch) {
  if (!token || typeof token !== 'string') throw new Error('API.Bible did not return a usage token. Please try again.');
  const url = new URL('https://fums.api.bible/f3');
  url.searchParams.set('t', token);
  url.searchParams.set('dId', deviceId);
  url.searchParams.set('sId', sessionId);
  const response = await fetcher(url, { signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('API.Bible usage reporting is unavailable. Please try again.');
  await response.arrayBuffer();
}
