/* Private data is fetched only after server authorization; never persist reports locally. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const config=window.BigScreenBibleSupabase;
  if (!window.supabase || !config?.url || !config?.anonKey) { $('access-message').textContent='Sign-in tools could not load. Refresh or check your connection.'; return; }
  const client=window.supabase.createClient(config.url,config.anonKey);
  let page=0,total=0,selected=null,busy=false,authorized=false,generation=0,lastOpen=null,currentUser=null,mfaFactor=null;
  const drafts=new Map();
  const titles={review:'Start review',resolve:'Resolve report',dismiss:'Dismiss report',note:'Save note',suspend:'Suspend social access',restore_access:'Restore social access',remove_profile:'Remove profile'};
  function node(tag,text,className) { const n=document.createElement(tag); if(text!==undefined) n.textContent=String(text); if(className) n.className=className; return n; }
  function date(value) { return value ? new Date(value).toLocaleString() : '—'; }
  function notice(text) { $('notice').textContent=text; }
  function lock(value) { busy=value; document.querySelectorAll('button').forEach(b=>b.disabled=value); if(!value) { $('previous').disabled=page===0; $('next').disabled=(page+1)*25>=total; document.querySelectorAll('[data-protected]').forEach(b=>b.disabled=true); } }
  function clear() { mfaFactor=null; $('mfa').hidden=true; $('mfa').replaceChildren(); authorized=false; generation++; selected=null; lastOpen=null; drafts.clear(); $('workspace').hidden=true; $('access').hidden=false; $('queue').replaceChildren(); $('detail').replaceChildren(node('h2','Select a report'),node('p','Review the profile snapshot, details, and action history before taking action.')); $('summary').replaceChildren(); $('account').textContent=''; $('alerts-status').textContent=''; }
  async function api(payload) {
    const {data,error}=await client.auth.getSession();
    if(error || !data.session) { clear(); throw new Error('Sign in through Big Screen Bible, then return here.'); }
    const response=await fetch(`${config.url}/functions/v1/moderation`,{method:'POST',cache:'no-store',headers:{'Content-Type':'application/json',apikey:config.anonKey,Authorization:`Bearer ${data.session.access_token}`},body:JSON.stringify(payload)});
    const result=await response.json().catch(()=>({error:'Could not read the response.'}));
    if(!response.ok) { if(response.status===428) { clear(); await showMfa(); } if(response.status===401 || response.status===403) { clear(); $('access-message').textContent=result.error || 'Moderator access required.'; } throw new Error(result.error || 'Request failed.'); }
    return result;
  }
  async function queue(announce=false) {
    const gen=generation;
    const data=await api({action:'queue',status:$('status').value,reason:$('reason').value,search:$('search').value,page});
    if(gen!==generation) return;
    total=data.total; page=data.page;
    const alerts=data.alerts;
    if(alerts) $('alerts-status').textContent=!alerts.configured || !alerts.enabled ? 'Email alerts need server configuration. Keep reviewing this queue daily.' : `${alerts.recipient}: ${alerts.pending} report alert(s) pending. Last accepted by email provider: ${date(alerts.last_success)}.${alerts.last_error || alerts.failed ? ' Delivery problems need administrator review; do not rely on email alone.' : ''}`;
    $('summary').replaceChildren(...['open','reviewing','resolved','dismissed'].map(s=>node('span',`${s[0].toUpperCase()+s.slice(1)}: ${data.counts[s] || 0}`)));
    const open=Number(data.counts.open || 0);
    if(announce && lastOpen!==null && open>lastOpen) notice(`${open-lastOpen} additional open report(s). Review the queue.`);
    lastOpen=open;
    $('queue').replaceChildren();
    for(const r of data.items) {
      const b=node('button',r.reported_name,'report'); b.type='button'; b.dataset.reportId=r.id; b.setAttribute('aria-pressed',String(selected===r.id));
      b.append(node('small',`${r.reason} · ${r.status}${r.suspended ? ' · social access suspended':''}`),node('small',date(r.created_at)));
      b.addEventListener('click',()=>run(()=>detail(r.id))); $('queue').append(b);
    }
    if(!data.items.length) $('queue').append(node('p','No reports match these filters.'));
    $('page').textContent=`Page ${page+1} · ${total} report(s)`;
  }
  async function detail(id) {
    const gen=generation,data=await api({action:'detail',report_id:id});
    if(gen!==generation) return;
    selected=id; const r=data.report,d=$('detail'); d.replaceChildren();
    document.querySelectorAll('.report').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.reportId===id)));
    d.append(node('h2',data.profile?.display_name || data.profile?.username || r.profile_snapshot?.username || 'Removed profile'));
    const info=node('dl');
    for(const [label,value] of [['Reason',r.reason],['Status',r.status],['Submitted',date(r.created_at)],['Reporter',data.reporter?.display_name || data.reporter?.username || 'Removed profile'],['Social access',data.suspension ? 'Suspended':'Available subject to consent'],['Reviewed',date(r.reviewed_at)]]) info.append(node('dt',label),node('dd',value));
    d.append(info,node('h3','Report details'),node('p',r.details || 'No written details were supplied.','report-details'));
    const snap=node('div',undefined,'snapshot'); snap.append(node('h3','Profile when reported'),node('p',`Username: ${r.profile_snapshot?.username || '—'}`),node('p',`Display name: ${r.profile_snapshot?.display_name || '—'}`)); d.append(snap);
    if(data.suspension) d.append(node('p',`Suspension reason: ${data.suspension.reason}`));
    if(data.target_is_moderator) d.append(node('p','This is a moderator account. Account restrictions require review in the Supabase administrator dashboard.'));
    d.append(node('h3','Review action'),node('p','Investigate before restricting an account. Closing a report does not automatically suspend or remove its profile.'));
    const label=node('label','Moderator note (required)'); const note=node('textarea'); note.id='moderator-note'; note.maxLength=2000; note.value=drafts.get(id) || ''; note.addEventListener('input',()=>drafts.set(id,note.value)); label.append(note); d.append(label);
    const actions=node('div',undefined,'actions');
    for(const action of ['review','resolve','dismiss','note',data.suspension ? 'restore_access':'suspend','remove_profile']) {
      const button=node('button',titles[action],['suspend','remove_profile'].includes(action) ? 'danger':''); button.type='button';
      if(data.target_is_moderator && ['suspend','restore_access','remove_profile'].includes(action)) { button.disabled=true; button.dataset.protected='true'; }
      button.addEventListener('click',()=>run(async()=>{
        if(!note.value.trim()) { notice('Add a moderator note before taking action.'); note.focus(); return; }
        if(['suspend','restore_access','remove_profile'].includes(action)) {
          const explanation=action==='suspend' ? 'This ends active shared games and disables social interactions. Private reading remains available.' : action==='restore_access' ? 'Cancelled games and removed friendships are not restored.' : 'This removes the public profile. It does not delete the app account. The previous profile is retained in the private action history while the report exists.';
          if(!window.confirm(`${titles[action]}? ${explanation}`)) return;
        }
        await api({action,report_id:id,note:note.value,expected_updated_at:r.updated_at});
        drafts.delete(id); await detail(id); await queue(); notice(`${titles[action]} completed and recorded.`);
      })); actions.append(button);
    }
    const reload=node('button','Reload report'); reload.addEventListener('click',()=>run(()=>detail(id))); actions.append(reload); d.append(actions);
    d.append(node('h3','Action history')); const history=node('ol',undefined,'history');
    for(const event of data.history) { const li=node('li'); li.append(node('strong',`${titles[event.action] || event.action} · ${event.moderator_name}`),node('p',event.note),node('small',date(event.created_at))); history.append(li); }
    d.append(history); if(!data.history.length) d.append(node('p','No moderator actions yet.'));
  }
  async function run(fn) { if(busy) return; lock(true); try { await fn(); } catch(e) { notice(e.message || 'Something went wrong.'); } finally { lock(false); } }
  async function showMfa() {
    const gen=generation;
    const {data,error}=await client.auth.mfa.listFactors();
    if(error) throw new Error('Authenticator information could not load. Refresh to retry.');
    if(gen!==generation) return;
    const panel=$('mfa'); panel.hidden=false; panel.replaceChildren(node('h2','Verify moderator access'),node('p','Your authenticator code is required before you can see or act on private reports.'));
    const factors=(data.totp || []).filter(f=>f.status==='verified');
    if(factors.length) {
      const label=node('label','Authenticator'); const select=node('select'); select.id='mfa-factor';
      factors.forEach((f,i)=>{const option=node('option',f.friendly_name || `Authenticator ${i+1}`); option.value=f.id; select.append(option);}); label.append(select); panel.append(label);
      mfaFactor=factors[0].id; select.addEventListener('change',()=>mfaFactor=select.value); addCodeForm(panel,false);
    } else {
      panel.append(node('p','Set up an authenticator for this account. Save it securely and add a backup after verifying.'));
      const button=node('button','Set up authenticator'); button.addEventListener('click',()=>run(enrollAuthenticator)); panel.append(button);
    }
    $('access').hidden=true;
  }
  function addCodeForm(panel,enrolling) {
    const form=node('form'); const label=node('label','Six-digit authenticator code'); const input=node('input');
    input.type='text'; input.inputMode='numeric'; input.autocomplete='one-time-code'; input.pattern='[0-9]{6}'; input.maxLength=6; input.required=true; label.append(input);
    const submit=node('button',enrolling ? 'Verify and save authenticator':'Verify code'); submit.type='submit'; form.append(label,submit); panel.append(form);
    form.addEventListener('submit',event=>{event.preventDefault();run(async()=>{
      if(!/^[0-9]{6}$/.test(input.value.trim())) { notice('Enter the six-digit code from your authenticator.'); return; }
      const gen=generation,factor=mfaFactor;
      const {error}=await client.auth.mfa.challengeAndVerify({factorId:factor,code:input.value.trim()}); input.value='';
      if(error) { notice('The code could not be verified. Try the current code from your authenticator.'); return; }
      if(gen!==generation) return;
      await start(); notice(enrolling ? 'Authenticator saved. Moderator access verified.':'Moderator access verified for 15 minutes.');
    });});
  }
  async function enrollAuthenticator() {
    const gen=generation;
    const {data,error}=await client.auth.mfa.enroll({factorType:'totp',issuer:'Big Screen Bible',friendlyName:`Moderator authenticator ${new Date().toISOString()}`});
    if(error) throw new Error('Authenticator setup could not start. Refresh to retry or use an existing authenticator.');
    if(gen!==generation) return;
    authorized=false; $('workspace').hidden=true; $('access').hidden=true; const panel=$('mfa'); panel.hidden=false; panel.replaceChildren(node('h2','Set up your authenticator'),node('p','Scan this QR code in your authenticator app. Keep the setup key private; do not send it to support or paste it into chat.'));
    mfaFactor=data.id; const qr=node('img'); qr.className='mfa-qr'; qr.alt='Authenticator setup QR code'; qr.src=`data:image/svg+xml;charset=utf-8,${encodeURIComponent(data.totp.qr_code)}`; panel.append(qr,node('p','If scanning is unavailable, enter this setup key in your authenticator:'));
    panel.append(node('code',data.totp.secret,'mfa-secret')); addCodeForm(panel,true);
    const cancel=node('button','Cancel this setup'); cancel.type='button'; cancel.addEventListener('click',()=>run(async()=>{
      const {error}=await client.auth.mfa.unenroll({factorId:data.id}); if(error) throw new Error('Setup could not be cancelled. Refresh and try again.'); await start();
    })); panel.append(cancel);
  }
  async function start() {
    clear(); notice(''); const gen=generation; const {data}=await client.auth.getSession();
    if(gen!==generation) return;
    if(!data.session) { $('access-message').textContent='Sign in through Big Screen Bible, then return here.'; return; }
    const access=await api({action:'access'}); if(gen!==generation) return; if(access.mfa_required) { currentUser=data.session.user.id; await showMfa(); return; } currentUser=data.session.user.id; authorized=true; $('access').hidden=true; $('workspace').hidden=false; $('account').textContent=data.session.user.email || 'Moderator'; await queue();
  }
  $('add-authenticator').addEventListener('click',()=>run(async()=>{const access=await api({action:'access'}); if(access.mfa_required) { clear(); await showMfa(); return; } await enrollAuthenticator();}));
  $('lock-moderation').addEventListener('click',()=>run(async()=>{const {error}=await client.auth.signOut({scope:'local'}); if(error) throw new Error('Sign out could not finish. Try again.'); await start();}));
  $('refresh').addEventListener('click',()=>run(async()=>{ if(!authorized) await start(); else { await queue(true); if(selected) await detail(selected); } }));
  $('filters').addEventListener('submit',e=>{e.preventDefault();page=0;run(()=>queue());});
  $('previous').addEventListener('click',()=>{if(page>0){page--;run(()=>queue());}});
  $('next').addEventListener('click',()=>{if((page+1)*25<total){page++;run(()=>queue());}});
  client.auth.onAuthStateChange((event,session)=>{if(['SIGNED_OUT','USER_UPDATED'].includes(event) || (currentUser && session?.user.id!==currentUser)) { clear(); currentUser=null; }});
  window.addEventListener('pagehide',clear);
  window.addEventListener('pageshow',event=>{if(event.persisted) run(start);});
  setInterval(()=>{if(authorized && !busy && !document.hidden) run(()=>queue(true));},60000);
  run(start);
})();
