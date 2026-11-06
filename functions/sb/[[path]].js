// Cloudflare Pages only: passes visitor requests on to the database under the site's own
// address, so a visitor needs to reach just one address. Limited to what visitors use,
// so it can't serve as an open door to anything else.
const UPSTREAM = 'https://jyrcywuxqfandzerlrga.supabase.co';
const RPC = '/rest/v1/rpc/';
const FILES = '/storage/v1/object/public/media/';
const ALLOWED_RPC = new Set(['get_post', 'list_public_posts', 'register_view', 'unlock_post']);
const PASS_HEADERS = ['apikey', 'content-type', 'accept', 'range'];

export async function onRequest({ request, params }) {
  const path = `/${[].concat(params.path || []).join('/')}`;
  const isRpc = request.method === 'POST' && path.startsWith(RPC) && ALLOWED_RPC.has(path.slice(RPC.length));
  const isFile = ['GET', 'HEAD'].includes(request.method) && path.startsWith(FILES);
  if (!isRpc && !isFile) return new Response('Not found', { status: 404 });

  const headers = new Headers();
  PASS_HEADERS.forEach(name => {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  });
  return fetch(UPSTREAM + path + new URL(request.url).search, {
    method: request.method,
    headers,
    body: isRpc ? request.body : undefined,
  });
}
