import { createClient } from "npm:@supabase/supabase-js@2.110.1";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function allowedOrigin(origin: string) {
  if (!origin) return true;
  try {
    const url = new URL(origin);
    return (url.protocol === 'https:' && ['bigscreenbible.com','www.bigscreenbible.com'].includes(url.hostname))
      || (url.protocol === 'http:' && ['localhost','127.0.0.1'].includes(url.hostname));
  } catch { return false; }
}
function reply(request: Request, status: number, body: unknown) {
  const origin = request.headers.get('origin') || '';
  return new Response(JSON.stringify(body), {status, headers:{
    'Content-Type':'application/json', 'Cache-Control':'no-store',
    'Access-Control-Allow-Origin':allowedOrigin(origin) && origin ? origin : 'https://bigscreenbible.com',
    'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods':'POST, OPTIONS', 'Vary':'Origin',
  }});
}
export async function handleModeration(request: Request, supplied?: ReturnType<typeof createClient<any>>) {
  if (!allowedOrigin(request.headers.get('origin') || '')) return reply(request,403,{error:'Origin not allowed'});
  if (request.method==='OPTIONS') return reply(request,200,{});
  if (request.method!=='POST') return reply(request,405,{error:'Method not allowed'});
  const token=request.headers.get('authorization')?.match(/^Bearer (.+)$/i)?.[1];
  if (!token) return reply(request,401,{error:'Sign in to continue.'});
  const admin=supplied || createClient(Deno.env.get('SUPABASE_URL')!,Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
  try {
    const {data:identity,error:authError}=await admin.auth.getUser(token);
    if (authError || !identity.user) return reply(request,401,{error:'Your session expired. Sign in again.'});
    // getUser verifies this JWT first; derive the session claim only after verification.
    const claims=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0))));
    if (!uuid.test(claims.session_id || '')) return reply(request,401,{error:'Sign in again before moderating.'});
    const raw=await request.text();
    if (raw.length>8192) return reply(request,400,{error:'Request is too large.'});
    let input;
    try { input=JSON.parse(raw); } catch { return reply(request,400,{error:'Invalid request.'}); }
    if (!input || typeof input!=='object' || Array.isArray(input)) return reply(request,400,{error:'Invalid request.'});
    const actions=['access','queue','detail','review','resolve','dismiss','note','suspend','restore_access','remove_profile'];
    if (!actions.includes(input.action)) return reply(request,400,{error:'Invalid action.'});
    const payload: Record<string,unknown>={action:input.action,session_id:claims.session_id};
    if (input.action==='queue') {
      payload.status=String(input.status || 'active'); payload.reason=String(input.reason || 'all');
      payload.search=String(input.search || '').slice(0,100);
      payload.page=Number.isInteger(input.page) ? Math.max(0,Math.min(20000,input.page)) : 0;
    } else if (input.action!=='access') {
      if (!uuid.test(input.report_id || '')) return reply(request,400,{error:'Invalid report.'});
      payload.report_id=input.report_id;
      if (input.action!=='detail') {
        if (typeof input.note!=='string' || !input.note.trim() || input.note.length>2000) return reply(request,400,{error:'Add a note of 1–2000 characters.'});
        if (typeof input.expected_updated_at!=='string' || !Number.isFinite(Date.parse(input.expected_updated_at))) return reply(request,400,{error:'Reload the report before acting.'});
        payload.note=input.note.trim(); payload.expected_updated_at=input.expected_updated_at;
      }
    }
    const {data,error}=await admin.rpc('bsb_moderation',{operator_id:identity.user.id,payload});
    if (error) {
      const status=({'42501':403,'40001':409,'P0002':404,'22023':400,'22P02':400} as Record<string,number>)[error.code] || 500;
      return reply(request,status,{error:status===500 ? 'Moderation could not finish. Try again.' : error.message});
    }
    return reply(request,200,data);
  } catch {
    return reply(request,400,{error:'Could not verify this request. Sign in again if your session expired.'});
  }
}
if (import.meta.main) Deno.serve(request=>handleModeration(request));
