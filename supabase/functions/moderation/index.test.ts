import {handleModeration} from './index.ts';
const id='11111111-1111-4111-8111-111111111111',session='44444444-4444-4444-8444-444444444444';
const token=`e30.${btoa(JSON.stringify({session_id:session}))}.signature`;
function mock(authorized=true) {
 const calls: Array<Record<string,unknown>>=[];
 return {calls,auth:{getUser:()=>Promise.resolve({data:{user:authorized?{id}:null},error:authorized?null:{message:'invalid'}})},rpc:(_name:string,args:Record<string,unknown>)=>{calls.push(args);return Promise.resolve({data:{allowed:true},error:null});}};
}
function request(body:unknown,jwt=token,origin='https://bigscreenbible.com') {return new Request('https://test/moderation',{method:'POST',headers:{Authorization:`Bearer ${jwt}`,Origin:origin},body:JSON.stringify(body)});}
Deno.test('Verified identity owns actions; caller-selected operator and session are ignored',async()=>{
 const admin=mock();const response=await handleModeration(request({action:'access',operator_id:'attacker',session_id:'attacker'}),admin as never);
 if(response.status!==200 || admin.calls[0].operator_id!==id || (admin.calls[0].payload as Record<string,unknown>).session_id!==session) throw new Error('Identity was not enforced');
});
Deno.test('Reject invalid auth, disallowed origin, missing report, and empty note before RPC',async()=>{
 for(const [req,admin] of [[request({action:'access'}),mock(false)],[request({action:'access'},token,'https://evil.example'),mock()],[request({action:'detail'}),mock()],[request({action:'resolve',report_id:id,note:'',expected_updated_at:new Date().toISOString()}),mock()]] as const) {
  const response=await handleModeration(req,admin as never);if(response.status<400 || admin.calls.length) throw new Error('Rejected request reached privileged RPC');
 }
});
Deno.test('A conflicting edit returns 409',async()=>{
 const admin=mock();admin.rpc=()=>Promise.resolve({data:null,error:{code:'40001',message:'Reload report'}}) as never;
 const response=await handleModeration(request({action:'review',report_id:id,note:'Reviewed',expected_updated_at:new Date().toISOString()}),admin as never);
 if(response.status!==409) throw new Error('Conflict was not surfaced');
});

Deno.test('Caller cannot supply MFA assurance or verification time',async()=>{
 const admin=mock();await handleModeration(request({action:'access',assurance:'aal2',mfa_verified_at:Date.now()/1000}),admin as never);
 const payload=admin.calls[0].payload as Record<string,unknown>;
 if(payload.assurance!=='aal1' || payload.mfa_verified_at!==0) throw new Error('Caller forged MFA');
});
Deno.test('MFA required is a step-up response, not a logout',async()=>{
 const admin=mock();admin.rpc=()=>Promise.resolve({data:null,error:{code:'28000',message:'Verify authenticator'}}) as never;
 const response=await handleModeration(request({action:'queue'}),admin as never);
 if(response.status!==428) throw new Error('MFA step-up status missing');
});

Deno.test('Account mutations are gated by the account RPC before Auth is called',async()=>{
 const admin=mock();let touched=false;
 Object.assign(admin.auth,{admin:{deleteUser:()=>{touched=true;return Promise.resolve({error:null});}}});
 admin.rpc=()=>Promise.resolve({data:null,error:{code:'28000',message:'Verify authenticator'}}) as never;
 const response=await handleModeration(request({action:'delete_user',user_id:id,email:'user@example.com',note:'Requested removal',confirmation:`DELETE ${id}`}),admin as never);
 if(response.status!==428 || touched) throw new Error('Account mutation bypassed MFA gate');
});
Deno.test('Password reset uses server-selected email and fixed redirect, then records outcome',async()=>{
 const admin=mock();const calls: Array<Record<string,unknown>>=[];let sent='';
 Object.assign(admin.auth,{resetPasswordForEmail:(email:string,options:{redirectTo:string})=>{sent=email;if(options.redirectTo!=='https://bigscreenbible.com/') throw new Error('Unsafe redirect');return Promise.resolve({error:null});}});
 admin.rpc=(_name:string,args:Record<string,unknown>)=>{calls.push(args);return Promise.resolve({data:{allowed:true,audit_id:id,email:'verified@example.com',user_id:id},error:null});};
 const response=await handleModeration(request({action:'reset_password',user_id:id,email:'input@example.com',note:'Help requested',redirectTo:'https://evil.example'}),admin as never);
 if(response.status!==200 || sent!=='verified@example.com' || calls.length!==2 || (calls[1].payload as Record<string,unknown>).success!==true) throw new Error('Reset or audit incorrect');
});
Deno.test('Deletion failures are recorded and surfaced without reporting success',async()=>{
 const admin=mock();let count=0;let success:unknown;
 Object.assign(admin.auth,{admin:{deleteUser:(target:string,soft:boolean)=>{if(target!==id || soft!==false) throw new Error('Wrong deletion');return Promise.resolve({error:{message:'Storage blocker'}});}}});
 admin.rpc=(_name:string,args:Record<string,unknown>)=>{count++;if(count===2) success=(args.payload as Record<string,unknown>).success;return Promise.resolve({data:{allowed:true,audit_id:id,user_id:id},error:null});};
 const response=await handleModeration(request({action:'delete_user',user_id:id,email:'user@example.com',note:'Requested removal',confirmation:`DELETE ${id}`}),admin as never);
 if(response.status!==502 || success!==false) throw new Error('Failed deletion not recorded');
});
