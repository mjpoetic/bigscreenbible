import {createClient} from 'npm:@supabase/supabase-js@2.110.1';
type Client=ReturnType<typeof createClient<any>>;
type Batch={id:string;lease_id:string;kind:string;recipient:string;report_count:number;backlog_count:number};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
export async function handleAlerts(request:Request,options:{client?:Client;fetcher?:typeof fetch;env?:(name:string)=>string|undefined}={}) {
 const env=options.env || (name=>Deno.env.get(name));
 if(request.method!=='POST') return json({error:'Method not allowed'},405);
 const secret=env('PUSH_CRON_SECRET'),provided=request.headers.get('x-push-cron-secret');
 if(!secret || !provided || provided!==secret) return json({error:'Unauthorized'},401);
 const key=env('RESEND_API_KEY'),from=env('MODERATION_EMAIL_FROM');
 if(!key || !from) return json({error:'Email sender configuration required'},503);
 const client=options.client || createClient(env('SUPABASE_URL')!,env('SUPABASE_SERVICE_ROLE_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
 const fetcher=options.fetcher || fetch;
 try {
  const {data,error}=await client.rpc('bsb_moderation_email_delivery',{payload:{action:'claim'}});
  if(error) return json({error:'Alert queue unavailable'},500);
  const batch=data as Batch|null;
  if(!batch) return json({checked:true,accepted:0});
  let providerId:string|null=null,failure='Email provider request failed';
  try {
   const response=await fetcher('https://api.resend.com/emails',{method:'POST',signal:AbortSignal.timeout(10000),headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json','Idempotency-Key':`bsb-moderation/${batch.id}`},body:JSON.stringify({
    from,to:[batch.recipient],subject:batch.kind==='daily' ? 'Big Screen Bible: moderation reminder':'Big Screen Bible: new moderation reports',
    text:`${batch.kind==='daily' ? 'Daily moderation reminder.' : `${batch.report_count} new report(s) were queued.`}\n${batch.backlog_count} report(s) currently need attention.\n\nReview privately: https://bigscreenbible.com/moderation/\nSign in and verify your authenticator.\n\nReports are allegations and require review. Do not reply with private report details.`,
   })});
   const result=await response.json().catch(()=>null);
   if(response.ok && typeof result?.id==='string') providerId=result.id;
   else failure=`Email provider returned HTTP ${response.status}`;
  } catch { failure='Email provider timed out or could not connect'; }
  const finish=await client.rpc('bsb_moderation_email_delivery',{payload:{action:'finish',id:batch.id,lease_id:batch.lease_id,result:providerId ? 'accepted':'failed',provider_id:providerId,error:failure}});
  if(finish.error) return json({error:'Delivery result could not be recorded; retry remains queued'},500);
  return providerId ? json({accepted:1}) : json({error:'Delivery failed; queued for retry'},502);
 } catch { return json({error:'Alert delivery unavailable'},500); }
}
if(import.meta.main) Deno.serve(request=>handleAlerts(request));
