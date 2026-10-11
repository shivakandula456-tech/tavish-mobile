/* TAVISH & CO. customer email authentication. Uses Supabase Auth REST; no password is stored locally. */
(() => {
  'use strict';
  const cfg = window.TAVISH_SUPABASE_CONFIG || {};
  const status = document.querySelector('[data-auth-status]');
  const signedOut = document.querySelector('[data-auth-panel="signed-out"]');
  const signedIn = document.querySelector('[data-auth-panel="signed-in"]');
  const SESSION_KEY = 'tavish_customer_auth_v1';
  let session = null;
  const configReady = () => /^https:\/\//.test(cfg.url || '') && !!cfg.publishableKey;
  function message(text, kind='info') { status.textContent=text; status.dataset.kind=kind; status.hidden=false; }
  function clearMessage(){status.hidden=true;status.textContent='';}
  function setBusy(form, busy){const b=form.querySelector('button[type="submit"]');if(b){b.disabled=busy;b.dataset.oldText ||= b.textContent;b.textContent=busy?'Please wait…':b.dataset.oldText;}}
  function loadSession(){try{session=JSON.parse(localStorage.getItem(SESSION_KEY)||'null')}catch(_){session=null}}
  function saveSession(value){session=value; if(value) localStorage.setItem(SESSION_KEY,JSON.stringify(value)); else localStorage.removeItem(SESSION_KEY); renderSession();}
  async function request(path, options={}) {
    if(!configReady()) throw new Error('Customer sign-in is not connected yet. Add your Supabase project URL and publishable key in supabase-config.js, then deploy again. Guest checkout remains available.');
    const headers={'apikey':cfg.publishableKey,'Content-Type':'application/json',...(options.headers||{})};
    if(session?.access_token) headers.Authorization='Bearer '+session.access_token;
    const res=await fetch(cfg.url.replace(/\/$/,'')+path,{...options,headers});
    let body={};try{body=await res.json()}catch(_){}
    if(!res.ok) throw new Error(body.msg||body.message||body.error_description||body.error||'Request failed. Please try again.');
    return body;
  }
  async function handleOAuthCallback(){
    // Supabase implicit-flow callback places tokens in the URL hash. Consume them once,
    // resolve the user from Auth, and remove credentials from browser history.
    if(!location.hash || !/(^|&)access_token=/.test(location.hash.slice(1))) return false;
    const params=new URLSearchParams(location.hash.slice(1));
    const access_token=params.get('access_token'), refresh_token=params.get('refresh_token');
    if(!access_token) return false;
    history.replaceState(null,document.title,location.pathname+location.search);
    try{
      const user=await fetch(cfg.url.replace(/\/$/,'')+'/auth/v1/user',{headers:{apikey:cfg.publishableKey,Authorization:'Bearer '+access_token}});
      let userData={};try{userData=await user.json()}catch(_){}
      if(!user.ok) throw new Error(userData.message||'Google sign-in could not be completed. Please try again.');
      saveSession({access_token,refresh_token,token_type:params.get('token_type')||'bearer',expires_in:Number(params.get('expires_in')||3600),expires_at:Date.now()+(Number(params.get('expires_in')||3600)*1000),user:userData});
      message('Signed in with Google.','success');
    }catch(err){message(err.message,'error');}
    return true;
  }
  async function signInWithGoogle(){
    clearMessage();
    if(!configReady()){message('Google sign-in is not connected yet. Configure Supabase and Google as described in backend/supabase/README.md. Guest checkout remains available.','error');return;}
    const redirectTo=location.origin+location.pathname;
    const authorize=new URL(cfg.url.replace(/\/$/, '')+'/auth/v1/authorize');
    authorize.searchParams.set('provider','google');
    authorize.searchParams.set('redirect_to',redirectTo);
    authorize.searchParams.set('apikey',cfg.publishableKey);
    location.assign(authorize.toString());
  }
  document.querySelector('[data-auth-action="google"]').addEventListener('click',signInWithGoogle);
  async function ensureFreshSession(){
    if(!session?.access_token) return;
    if(session.expires_at && Date.now()<session.expires_at-60000) return;
    if(!session.refresh_token){saveSession(null);return;}
    try{const next=await request('/auth/v1/token?grant_type=refresh_token',{method:'POST',headers:{Authorization:'Bearer '+cfg.publishableKey},body:JSON.stringify({refresh_token:session.refresh_token})});saveSession({...next,expires_at:Date.now()+(Number(next.expires_in||3600)*1000)});}catch(_){saveSession(null);}
  }
  function renderSession(){const yes=!!session?.access_token;signedOut.hidden=yes;signedIn.hidden=!yes;if(yes){document.querySelector('[data-account-email]').textContent=session.user?.email||'';const f=document.querySelector('[data-profile-form]');if(f){f.elements.full_name.value=session.user?.user_metadata?.full_name||'';f.elements.phone.value=session.user?.user_metadata?.phone||'';}}}
  function activeTab(name){document.querySelectorAll('[data-auth-tab]').forEach(b=>{const active=b.dataset.authTab===name;b.classList.toggle('is-active',active);b.setAttribute('aria-selected',String(active));});document.querySelectorAll('[data-auth-form="signin"],[data-auth-form="signup"]').forEach(f=>f.hidden=f.dataset.authForm!==name);clearMessage();}
  document.querySelectorAll('[data-auth-tab]').forEach(b=>b.addEventListener('click',()=>activeTab(b.dataset.authTab)));
  document.querySelector('[data-auth-form="signin"]').addEventListener('submit',async e=>{e.preventDefault();clearMessage();const f=e.currentTarget;setBusy(f,true);try{const data=await request('/auth/v1/token?grant_type=password',{method:'POST',body:JSON.stringify({email:f.elements.email.value.trim(),password:f.elements.password.value})});saveSession({...data,expires_at:Date.now()+(Number(data.expires_in||3600)*1000)});message('You are signed in.','success');}catch(err){message(err.message,'error')}finally{setBusy(f,false)}});
  document.querySelector('[data-auth-form="signup"]').addEventListener('submit',async e=>{e.preventDefault();clearMessage();const f=e.currentTarget;setBusy(f,true);try{const data=await request('/auth/v1/signup?redirect_to='+encodeURIComponent(location.origin+location.pathname),{method:'POST',body:JSON.stringify({email:f.elements.email.value.trim(),password:f.elements.password.value,data:{full_name:f.elements.full_name.value.trim()}})});if(data.access_token){saveSession({...data,expires_at:Date.now()+(Number(data.expires_in||3600)*1000)});message('Account created.','success')}else{message('Check your inbox for the confirmation email, then return here to sign in.','success');activeTab('signin')}}catch(err){message(err.message,'error')}finally{setBusy(f,false)}});
  document.querySelector('[data-auth-action="forgot"]').addEventListener('click',async()=>{clearMessage();const email=document.querySelector('[data-auth-form="signin"] [name="email"]').value.trim();if(!email){message('Enter your email address above first.');return;}try{await request('/auth/v1/recover?redirect_to='+encodeURIComponent(location.origin+location.pathname),{method:'POST',body:JSON.stringify({email})});message('If an account exists for that address, a password-reset email will be sent.','success')}catch(err){message(err.message,'error')}});
  document.querySelector('[data-auth-action="signout"]').addEventListener('click',async()=>{try{if(session?.access_token)await request('/auth/v1/logout',{method:'POST'});}catch(_){}saveSession(null);message('You have signed out.','success')});
  document.querySelector('[data-profile-form]').addEventListener('submit',async e=>{e.preventDefault();clearMessage();const f=e.currentTarget;setBusy(f,true);const name=f.elements.full_name.value.trim(),phone=f.elements.phone.value.trim();try{await ensureFreshSession();if(!session?.access_token)throw new Error('Your session has expired. Please sign in again.');await request('/rest/v1/customer_profiles?on_conflict=user_id',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({user_id:session.user.id,full_name:name,phone,updated_at:new Date().toISOString()})});const user={...session.user,user_metadata:{...(session.user.user_metadata||{}),full_name:name,phone}};saveSession({...session,user});message('Profile saved.','success')}catch(err){message(err.message,'error')}finally{setBusy(f,false)}});
  loadSession();
  handleOAuthCallback().finally(()=>ensureFreshSession().finally(renderSession));
  if(!configReady()) message('Sign-in options will activate after Supabase is configured. You can still continue as a guest.','info');
})();
