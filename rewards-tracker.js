const rewardsToken=new URLSearchParams(location.hash.slice(1)).get('rewards')||'',rewardsView=new URLSearchParams(location.search).get('view')==='rewards';

if(rewardsToken||rewardsView){
  const message=document.querySelector('#message'),orderResult=document.querySelector('#result'),rewardsResult=document.querySelector('#rewards-result');
  const money=value=>Number(value||0).toLocaleString('en-US',{style:'currency',currency:'USD'});
  const dateText=value=>value?new Date(`${value}T00:00:00`).toLocaleDateString():'Not recorded';
  if(rewardsToken)history.replaceState(null,'',`${location.pathname}?view=rewards`);
  document.title='Your Rewards | JMY';
  document.querySelector('.tracker-card > .eyebrow').textContent='JMY Rewards';
  document.querySelector('#page-title').textContent='Your private rewards page';
  document.querySelector('.tracker-card > .intro').textContent='View your current rewards balance and rewards-use history.';
  orderResult.hidden=true;rewardsResult.hidden=true;message.textContent=rewardsToken?'Opening your rewards tally…':'This rewards link is incomplete. Open the full private link from your JMY Fabrication email.';message.hidden=false;
  if(rewardsToken)(async()=>{
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(rewardsToken))throw new Error('invalid');
    const response=await fetch(`${window.JMY_SUPABASE_URL}/rest/v1/rpc/lookup_reward_account_by_access_token`,{method:'POST',headers:{apikey:window.JMY_SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json'},body:JSON.stringify({p_access_token:rewardsToken})}),rows=await response.json();
    if(!response.ok||!rows?.length)throw new Error('not-found');
    const tally=rows[0];
    document.querySelector('#rewards-organization').textContent=tally.organization;
    document.querySelector('#rewards-store-earned').textContent=money(tally.store_earned);
    document.querySelector('#rewards-lifetime-pieces').textContent=`${Number(tally.lifetime_pieces||0).toLocaleString()} all-time webstore pieces`;
    document.querySelector('#rewards-referral-earned').textContent=money(tally.referral_earned);
    document.querySelector('#rewards-referral-pieces').textContent=`${Number(tally.referral_pieces||0).toLocaleString()} referred pieces`;
    document.querySelector('#rewards-used').textContent=money(tally.rewards_used);
    document.querySelector('#rewards-available').textContent=money(tally.available_balance);
    const history=document.querySelector('#rewards-transactions'),transactions=Array.isArray(tally.transactions)?tally.transactions:[];history.replaceChildren();
    if(!transactions.length){const empty=document.createElement('p');empty.className='rewards-empty';empty.textContent='No rewards-use transactions have been recorded.';history.append(empty)}
    else transactions.forEach(transaction=>{const row=document.createElement('div');row.className='rewards-transaction';const date=document.createElement('span'),reason=document.createElement('span'),amount=document.createElement('strong');date.textContent=dateText(transaction.date);reason.textContent=transaction.reason||'Rewards used';amount.textContent=money(transaction.amount);row.append(date,reason,amount);history.append(row)});
    document.querySelector('#rewards-updated').textContent=`Last updated ${new Date(tally.updated_at).toLocaleString()}. Contact JMY Fabrication if you have any questions about this tally.`;
    message.hidden=true;rewardsResult.hidden=false;
  })().catch(()=>{rewardsResult.hidden=true;message.textContent='This private rewards link is not valid or is no longer active. Contact JMY Fabrication for a replacement link.';message.hidden=false});
}
