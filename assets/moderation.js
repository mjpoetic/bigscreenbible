/* Private data is fetched only after server authorization; never persist reports locally. */
(() => {
  'use strict';
  const syncAppearance=()=>window.BigScreenBibleThemeCatalog?.applyStoredTheme({migrate:false});
  window.addEventListener('storage',syncAppearance);
  window.addEventListener('pageshow',syncAppearance);
  const $=id=>document.getElementById(id);
  const config=window.BigScreenBibleSupabase;
  if (!window.supabase || !config?.url || !config?.anonKey) { $('access-message').textContent='Sign-in tools could not load. Refresh or check your connection.'; return; }
  const client=window.supabase.createClient(config.url,config.anonKey);
  let page=0,total=0,selected=null,busy=false,authorized=false,generation=0,lastOpen=null,currentUser=null,mfaFactor=null;
  let accountPage=0,accountHasNext=false,activeTab='reports',accountsLoaded=false;
  const drafts=new Map();
  const titles={review:'Start review',resolve:'Resolve report',dismiss:'Dismiss report',note:'Save note',suspend:'Suspend social access',restore_access:'Restore social access',remove_profile:'Remove profile'};
  function node(tag,text,className) { const n=document.createElement(tag); if(text!==undefined) n.textContent=String(text); if(className) n.className=className; return n; }
  function date(value) { return value ? new Date(value).toLocaleString() : '—'; }
  function notice(text) { $('notice').textContent=text; }
  function lock(value) { busy=value; document.querySelectorAll('button:not([role="tab"])').forEach(b=>b.disabled=value); if(!value) { $('accounts-previous').disabled=accountPage===0; $('accounts-next').disabled=!accountHasNext; $('previous').disabled=page===0; $('next').disabled=(page+1)*25>=total; document.querySelectorAll('[data-protected]').forEach(b=>b.disabled=true); } }
  function clear() { activeTab='reports'; accountsLoaded=false; syncTabs(); $('verified').hidden=true; $('account-detail').hidden=true; document.querySelector('.account-panel').classList.remove('viewing-account'); document.querySelector('.columns').classList.remove('reviewing'); document.querySelector('.security-panel').open=false; accountPage=0; accountHasNext=false; $('account-search').value=''; $('account-results').replaceChildren(); $('account-detail').replaceChildren(); $('accounts-page').textContent=''; mfaFactor=null; $('mfa').hidden=true; $('mfa').replaceChildren(); authorized=false; generation++; selected=null; lastOpen=null; drafts.clear(); $('workspace').hidden=true; $('access').hidden=false; $('queue').replaceChildren(); $('detail').replaceChildren(node('h2','Select a report'),node('p','Review the profile snapshot, details, and action history before taking action.')); $('summary').replaceChildren(); $('account').textContent=''; $('alerts-status').textContent=''; }
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
    const countLabels={open:'Need review',reviewing:'In progress',resolved:'Resolved',dismissed:'Dismissed'};
    $('summary').replaceChildren(...Object.entries(countLabels).map(([key,label])=>{const card=node('div',undefined,'count-card');card.append(node('strong',data.counts[key] || 0),node('span',label));return card;}));
    const open=Number(data.counts.open || 0);
    if(announce && lastOpen!==null && open>lastOpen) notice(`${open-lastOpen} additional open report(s). Review the queue.`);
    lastOpen=open;
    $('queue').replaceChildren();
    for(const r of data.items) {
      const b=personButton(r.reported_name,`${r.reason} · ${r.status}${r.suspended ? ' · social access suspended':''}`,date(r.created_at)); b.type='button'; b.dataset.reportId=r.id; b.setAttribute('aria-pressed',String(selected===r.id));
      b.addEventListener('click',()=>run(()=>detail(r.id))); $('queue').append(b);
    }
    if(!data.items.length) { const empty=node('div',undefined,'empty-state');empty.append(node('strong','All caught up'),node('p','No reports match these filters. Thank you for caring for the community.'));$('queue').append(empty); }
    $('page').textContent=`Page ${page+1} · ${total} report(s)`;
  }
  async function detail(id) {
    const gen=generation,data=await api({action:'detail',report_id:id});
    if(gen!==generation) return;
    selected=id; document.querySelector('.columns').classList.add('reviewing'); const r=data.report,d=$('detail'); d.replaceChildren();
    const back=node('button','← All reports','detail-back');back.type='button';back.addEventListener('click',()=>{document.querySelector('.columns').classList.remove('reviewing');$('queue').scrollIntoView({behavior:'smooth',block:'start'});});d.append(back);
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
    d.scrollIntoView({behavior:'smooth',block:'start'});
  }
  async function accounts() {
    const gen=generation,data=await api({action:'accounts',search:$('account-search').value,page:accountPage});
    if(gen!==generation) return;
    accountsLoaded=true; accountHasNext=data.items.length>25; $('account-detail').hidden=true; document.querySelector('.account-panel').classList.remove('viewing-account');
    $('account-detail').replaceChildren(); $('account-results').replaceChildren();
    for(const account of data.items.slice(0,25)) {
      const button=personButton(account.name || account.email || 'Account',account.email || account.id,`${account.protected ? 'Moderator' : 'View account'} · ${linkedSignInMethods(account.providers).join(' · ')}`); button.type='button';
      button.addEventListener('click',()=>accountDetail(account)); $('account-results').append(button);
    }
    if(!data.items.length) $('account-results').append(node('p','No accounts found.'));
    $('accounts-page').textContent=`Page ${accountPage+1}`;
  }
  function linkedSignInMethods(providers) {
    const labels={google:'Google',apple:'Apple',email:'Email',github:'GitHub',azure:'Microsoft'};
    const methods=Array.isArray(providers) ? [...new Set(providers.filter(p=>typeof p==='string' && p.trim()).map(p=>p.trim()))] : [];
    return methods.length ? methods.map(provider=>labels[provider] || provider) : ['Not available'];
  }
  function accountDetail(account) {
    if(busy) return;
    const gen=generation,d=$('account-detail'); d.hidden=false; d.replaceChildren();
    document.querySelector('.account-panel').classList.add('viewing-account');
    const back=node('button','← All accounts','detail-back');back.type='button';back.addEventListener('click',()=>{d.hidden=true;d.replaceChildren();document.querySelector('.account-panel').classList.remove('viewing-account');$('account-search').focus();});d.append(back);
    const identity=node('div',undefined,'identity-card');identity.append(node('span',initials(account.name || account.email),'avatar'),node('h3',account.name || account.email || 'Account details'),node('p',account.email || account.id),node('span',account.email_confirmed_at ? '✓ Email verified' : 'Email unverified','badge')); d.append(identity);
    const methods=node('section',undefined,'sign-in-methods');methods.append(node('h3','Linked sign-in methods'));
    const badges=node('div',undefined,'provider-badges');
    linkedSignInMethods(account.providers).forEach(name=>badges.append(node('span',name,'badge')));
    methods.append(badges); d.append(methods);
    const metadata=node('details',undefined,'account-metadata');metadata.append(node('summary','Account details'));
    const info=node('dl');
    for(const [label,value] of [['User ID',account.id],['Name',account.name || '—'],['Created',date(account.created_at)],['Last sign-in',date(account.last_sign_in_at)],['Email verified',date(account.email_confirmed_at)]]) info.append(node('dt',label),node('dd',value));
    metadata.append(info); d.append(metadata);
    if(account.protected) { d.append(node('p','Manage moderator accounts in the Supabase administrator dashboard.')); return; }
    d.append(node('h3','Account support'));
    const label=node('label','Reason for action (required)'),note=node('textarea'); note.maxLength=2000; label.append(note); d.append(label);
    const confirmationLabel=node('label','Type DELETE to confirm'),confirmation=node('input'); confirmation.type='text'; confirmation.autocomplete='off'; confirmation.autocapitalize='characters'; confirmation.spellcheck=false; confirmationLabel.append(confirmation);
    d.append(node('p','Password reset sends an email so the user can choose a password. For Apple or Google accounts, the user can continue using their existing sign-in method.'));
    const reset=node('button','Send password reset email'); reset.type='button'; reset.disabled=!account.email;
    if(!account.email) reset.dataset.protected='true';
    const remove=node('button','Permanently delete account','danger'); remove.type='button';
    for(const [button,action] of [[reset,'reset_password'],[remove,'delete_user']]) button.addEventListener('click',()=>run(async()=>{
      if(gen!==generation || !authorized) return;
      if(!note.value.trim()) { notice('Add an account action note first.'); note.focus(); return; }
      if(action==='delete_user' && confirmation.value.trim()!=='DELETE') { notice('Type DELETE to confirm account deletion.'); confirmation.focus(); return; }
      if(!window.confirm(action==='delete_user' ? `Permanently delete ${account.email || account.id}? This cannot be undone. Account data will be removed, including saved study data and social records. Sessions and notification subscriptions are removed first; existing access tokens expire normally. External Apple/Google authorization is managed by the user.` : `Send a password reset email to ${account.email}?`)) return;
      await api({action,user_id:account.id,email:account.email || '',note:note.value,confirmation:action==='delete_user' ? `DELETE ${account.id}` : ''});
      if(gen!==generation) return;
      await accounts(); await queue(); notice(action==='delete_user' ? 'Account permanently deleted and action recorded.' : 'Password reset email requested and action recorded. Ask the user to check their inbox.');
    }));
    reset.className='support-action'; d.append(reset);
    // Bind the short human confirmation to the selected account's existing server contract.
    const danger=node('details',undefined,'danger-zone');danger.append(node('summary','Delete account'),node('p',`Account to delete: ${account.name ? account.name+' · ' : ''}${account.email || account.id}`),node('p','This permanently removes the account and its saved data. Report history tied to the account may also be removed. The account action audit is retained.'),confirmationLabel,remove);
    const cancel=node('button','Cancel');cancel.type='button';cancel.addEventListener('click',()=>{danger.open=false;confirmation.value='';});danger.append(cancel);d.append(danger);
    d.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  $('account-search-form').addEventListener('submit',event=>{event.preventDefault();accountPage=0;run(accounts);});
  $('accounts-previous').addEventListener('click',()=>{if(accountPage>0){accountPage--;run(accounts);}});
  $('accounts-next').addEventListener('click',()=>{if(accountHasNext){accountPage++;run(accounts);}});
  function initials(name) { return String(name || '?').trim().split(/\s+/).map(part=>part[0]).slice(0,2).join('').toUpperCase(); }
  function personButton(name,description,meta) {
    const button=node('button',undefined,'report person-row');button.type='button';
    const copy=node('span',undefined,'person-copy');copy.append(node('strong',name),node('small',description),node('small',meta));
    button.append(node('span',initials(name),'avatar'),copy,node('span','›','row-chevron'));return button;
  }
  function syncTabs() {
    for(const name of ['reports','accounts']) { const on=activeTab===name;$(name+'-tab').setAttribute('aria-selected',String(on));$(name+'-tab').tabIndex=on?0:-1;$(name+'-panel').hidden=!on; }
  }
  for(const name of ['reports','accounts']) {
    $(name+'-tab').addEventListener('click',()=>run(async()=>{activeTab=name;syncTabs();if(name==='accounts' && !accountsLoaded) await accounts();}));
    $(name+'-tab').addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key) || busy) return;
      event.preventDefault();const next=event.key==='Home' ? 'reports' : event.key==='End' ? 'accounts' : name==='reports' ? 'accounts' : 'reports';$(next+'-tab').focus();$(next+'-tab').click();
    });
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
      mfaFactor=factors[0].id; select.title=select.options[select.selectedIndex].textContent; select.addEventListener('change',()=>{mfaFactor=select.value; select.title=select.options[select.selectedIndex].textContent;}); addCodeForm(panel,false);
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
    const access=await api({action:'access'}); if(gen!==generation) return; if(access.mfa_required) { currentUser=data.session.user.id; await showMfa(); return; } currentUser=data.session.user.id; authorized=true; $('verified').hidden=false; $('access').hidden=true; $('workspace').hidden=false; $('account').textContent=data.session.user.email || 'Moderator'; await queue();
  }
  $('add-authenticator').addEventListener('click',()=>run(async()=>{const access=await api({action:'access'}); if(access.mfa_required) { clear(); await showMfa(); return; } await enrollAuthenticator();}));
  $('lock-moderation').addEventListener('click',()=>run(async()=>{const {error}=await client.auth.signOut({scope:'local'}); if(error) throw new Error('Sign out could not finish. Try again.'); await start();}));
  $('refresh').addEventListener('click',()=>run(async()=>{ if(!authorized) await start(); else { await queue(true); if(activeTab==='accounts') await accounts(); else if(selected) await detail(selected); } }));
  $('filters').addEventListener('submit',e=>{e.preventDefault();page=0;run(()=>queue());});
  $('previous').addEventListener('click',()=>{if(page>0){page--;run(()=>queue());}});
  $('next').addEventListener('click',()=>{if((page+1)*25<total){page++;run(()=>queue());}});
  client.auth.onAuthStateChange((event,session)=>{if(['SIGNED_OUT','USER_UPDATED'].includes(event) || (currentUser && session?.user.id!==currentUser)) { clear(); currentUser=null; }});
  window.addEventListener('pagehide',clear);
  window.addEventListener('pageshow',event=>{if(event.persisted) run(start);});
  setInterval(()=>{if(authorized && !busy && !document.hidden) run(()=>queue(true));},60000);
  run(start);
})();
