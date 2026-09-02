const $=selector=>document.querySelector(selector),SUPABASE_URL=window.JMY_SUPABASE_URL,PUBLISHABLE_KEY=window.JMY_SUPABASE_PUBLISHABLE_KEY,RETURN_URL=`${location.origin}${location.pathname}`;
let accessToken='';
const bytesToBase64=bytes=>{let value='';bytes.forEach(byte=>value+=String.fromCharCode(byte));return btoa(value)};
const show=(node,text,error=false)=>{node.textContent=text;node.classList.toggle('error',error);node.hidden=false};
async function encryptIntake(value,password){
  const encoder=new TextEncoder(),salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12)),iterations=310000;
  const material=await crypto.subtle.importKey('raw',encoder.encode(password),'PBKDF2',false,['deriveKey']);
  const key=await crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations},material,{name:'AES-GCM',length:256},false,['encrypt']);
  const encrypted=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},key,encoder.encode(JSON.stringify(value))));
  return JSON.stringify({v:1,algorithm:'AES-256-GCM',kdf:'PBKDF2-SHA256',iterations,salt:bytesToBase64(salt),iv:bytesToBase64(iv),data:bytesToBase64(encrypted)});
}
async function verifyAdmin(token){const userResponse=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:PUBLISHABLE_KEY,Authorization:`Bearer ${token}`}}),user=await userResponse.json();if(!userResponse.ok||!user.id)return false;const response=await fetch(`${SUPABASE_URL}/rest/v1/admins?user_id=eq.${encodeURIComponent(user.id)}&select=user_id`,{headers:{apikey:PUBLISHABLE_KEY,Authorization:`Bearer ${token}`}});return response.ok&&(await response.json()).length>0}
async function acceptSession(){
  const params=new URLSearchParams(location.hash.slice(1)),token=params.get('access_token');
  if(token){history.replaceState(null,'',RETURN_URL);if(!await verifyAdmin(token))throw new Error('This GitHub account is not an approved JMY administrator.');accessToken=token;sessionStorage.setItem('jmy-mobile-supabase-session',JSON.stringify({token,expiresAt:Date.now()+Math.max(60,Number(params.get('expires_in')||3600)-60)*1000}))}
  if(!accessToken){try{const saved=JSON.parse(sessionStorage.getItem('jmy-mobile-supabase-session')||'{}');if(saved.expiresAt>Date.now())accessToken=saved.token}catch{}}
  if(accessToken){$('#sign-in-card').hidden=true;$('#intake-form').hidden=false}
}
$('#sign-in').onclick=()=>{const authorize=new URL(`${SUPABASE_URL}/auth/v1/authorize`);authorize.searchParams.set('provider','github');authorize.searchParams.set('redirect_to',RETURN_URL);location.href=authorize};
$('#intake-form').addEventListener('submit',async event=>{
  event.preventDefault();const form=event.currentTarget,button=$('#submit-intake'),message=$('#form-message');button.disabled=true;show(message,'Encrypting this intake on your phone…');
  try{
    const fields=Object.fromEntries(new FormData(form).entries());const payload={organization:fields.organization.trim(),firstName:fields.firstName.trim(),lastName:fields.lastName.trim(),email:fields.email.trim(),phone:fields.phone.trim(),address:fields.address.trim(),projectType:fields.projectType.trim(),dueDate:fields.dueDate,quantity:fields.quantity?Number(fields.quantity):null,colors:fields.colors.trim(),sizes:fields.sizes.trim(),measurements:fields.measurements.trim(),notes:fields.notes.trim(),capturedAt:new Date().toISOString()};
    const encrypted_payload=await encryptIntake(payload,$('#encryption-password').value),response=await fetch(`${SUPABASE_URL}/rest/v1/mobile_intakes`,{method:'POST',headers:{apikey:PUBLISHABLE_KEY,Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({encrypted_payload})});
    if(!response.ok){const detail=await response.json().catch(()=>({}));throw new Error(detail.message||'The encrypted intake could not be saved. Install the Mobile Intake migration first.')}
    form.reset();show(message,'Saved securely. The encrypted intake is ready to import at the office.');
  }catch(error){show(message,error.message||'The intake could not be saved.',true)}finally{button.disabled=false}
});
acceptSession().catch(error=>show($('#auth-message'),error.message,true));
