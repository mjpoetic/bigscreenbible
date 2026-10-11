import {handleAlerts} from './index.ts';
const batch={id:'delivery-1',lease_id:'lease-1',kind:'new',recipient:'moderator@example.com',report_count:3,backlog_count:4,details:'PRIVATE ALLEGATION',username:'PRIVATE NAME'};
const env=(name:string)=>({PUSH_CRON_SECRET:'scheduler',RESEND_API_KEY:'fake-key',MODERATION_EMAIL_FROM:'Test <alerts@example.com>'}[name]);
const request=(secret='scheduler')=>new Request('https://test/alerts',{method:'POST',headers:{'x-push-cron-secret':secret}});
function client() {const calls:Record<string,unknown>[]=[];return {calls,rpc:(_name:string,args:{payload:Record<string,unknown>})=>{calls.push(args.payload);return Promise.resolve({data:args.payload.action==='claim' ? batch : {recorded:true},error:null});}};}
Deno.test('Only the protected scheduler can send; missing configuration does not claim work',async()=>{
 const db=client();let response=await handleAlerts(request('wrong'),{client:db as never,env});
 if(response.status!==401 || db.calls.length) throw new Error('Unauthorized queue access');
 response=await handleAlerts(request(),{client:db as never,env:name=>name==='RESEND_API_KEY' ? undefined : env(name)});
 if(response.status!==503 || db.calls.length) throw new Error('Missing config consumed queued work');
});
Deno.test('Email includes counts and secure link, excludes private report content, and uses stable idempotency',async()=>{
 const db=client();let body='',key='';
 const response=await handleAlerts(request(),{client:db as never,env,fetcher:((_url,init)=>{body=String(init?.body);key=new Headers(init?.headers).get('Idempotency-Key') || '';return Promise.resolve(new Response(JSON.stringify({id:'provider-1'}),{status:200}));}) as typeof fetch});
 if(response.status!==200 || body.includes('PRIVATE') || !body.includes('https://bigscreenbible.com/moderation/') || key!=='bsb-moderation/delivery-1' || db.calls[1].result!=='accepted') throw new Error('Unsafe or unrecorded email');
});
Deno.test('Provider failures queue retry without retaining provider response or secrets',async()=>{
 const db=client();const response=await handleAlerts(request(),{client:db as never,env,fetcher:(()=>Promise.resolve(new Response('sensitive provider response',{status:429}))) as typeof fetch});
 if(response.status!==502 || db.calls[1].result!=='failed' || db.calls[1].error!=='Email provider returned HTTP 429') throw new Error('Retry handling failed');
});
