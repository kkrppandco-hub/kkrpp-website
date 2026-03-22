export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');

  if (!code) {
    const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
    githubAuthUrl.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
    githubAuthUrl.searchParams.set('redirect_uri', url.origin + '/api/auth');
    githubAuthUrl.searchParams.set('scope', 'repo');
    return Response.redirect(githubAuthUrl.toString(), 302);
  }

  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code: code,
      redirect_uri: url.origin + '/api/auth'
    })
  });

  const tokenData = await tokenResponse.json();
  if (tokenData.error) {
    return new Response('Auth error: ' + tokenData.error_description, { status: 400 });
  }

  const token = tokenData.access_token;
  const html = '<!DOCTYPE html><html><body><script>(function(){function receiveMessage(e){window.opener.postMessage("authorization:github:success:{\"token\":\"' + token + '\",\"provider\":\"github\"}",e.origin);}window.addEventListener("message",receiveMessage,false);window.opener.postMessage("authorizing:github","*");})();<\/script><p>Authenticating...</p></body></html>';

  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}
