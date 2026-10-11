import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../assets/bible-app.js',import.meta.url),'utf8');
function extract(name) {
 const start=source.search(new RegExp(`(?:async )?function ${name}\\(`));
 assert.ok(start>=0,name);
 const next=source.slice(start+1).search(/\n(?:async )?function /);
 return source.slice(start,next<0?source.length:start+1+next);
}
const state={authUser:{id:'self'},socialConsent:false,socialSafetyReady:true,socialAccessAllowed:false,socialProfile:{username:'reader'},socialBlocks:[],friendshipActionBusyId:''};
const messages=[];let clientCalls=0;
const context={state,escapeHtml:s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),
 socialProfileAvatarMarkup:()=>'<span></span>',
 captureSocialProfileDraft:()=>({username:'reader',displayName:'Reader',termsAccepted:false}),
 showToast:m=>messages.push(m),createSupabaseClient:()=>{clientCalls++;},
 friendshipCollections:()=>({friends:[],incoming:[],outgoing:[]}),
 socialProfileValidationMessage:()=>'', renderPreservingReaderScroll:()=>{},
 document:{getElementById:()=>null},socialAvatarKeys:['initials'], normalizeProfileUsername:s=>s,
 socialProfileDraft:()=>({termsAccepted:true}),
};
vm.createContext(context);
vm.runInContext(['friendshipActionButton','friendshipPersonRow','friendsPanelContent','friendsCard','saveSocialProfile','captureSocialProfileDraft'].map(extract).join('\n'),context);
const html=context.friendshipPersonRow({userId:'other',username:'bad<img>',displayName:'<script>alert(1)</script>'});
assert.match(html,/data-friend-action="report"/);assert.match(html,/data-friend-action="block"/);
assert.ok(!html.includes('<script>'));assert.ok(!html.includes('bad<img>'));
const self=context.friendshipPersonRow({userId:'self',username:'reader'});
assert.ok(!self.includes('data-friend-action="block"'));
assert.match(context.friendsCard(),/Accept the Community Standards/);
state.socialConsent=true;
assert.match(context.friendsCard(),/suspended/);
state.socialConsent=false;
// Explicitly unchecked acceptance must override a previously checked draft.
context.document.getElementById=id=>id==='socialTermsAccepted'?{checked:false}:null;
state.socialProfileDraft={username:'reader',displayName:'Reader',avatarKey:'initials',termsAccepted:true};
assert.equal(context.captureSocialProfileDraft().termsAccepted,false);
await context.saveSocialProfile({preventDefault(){}});
assert.equal(clientCalls,0,'No write before explicit consent');assert.match(messages.at(-1),/Accept the Community Standards/);
state.socialSafetyReady=false;
await context.saveSocialProfile({preventDefault(){}});
assert.equal(clientCalls,0,'No write when safety state is unavailable');
state.friendsPanelTab='blocked';state.socialBlocks=[{blocked_id:'other',username_snapshot:'<script>'}];
const blocked=context.friendsPanelContent();assert.match(blocked,/data-friend-action="unblock"/);assert.ok(!blocked.includes('<script>'));
console.log('Social safety UI checks passed (consent gates, escaping, reporting and block controls).');
