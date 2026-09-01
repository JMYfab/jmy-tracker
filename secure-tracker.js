const baseUrl=window.JMY_SUPABASE_URL,publicKey=window.JMY_SUPABASE_PUBLISHABLE_KEY,lookupMessage=document.querySelector('#message'),lookupResult=document.querySelector('#result');
const put=(selector,value)=>{document.querySelector(selector).textContent=value||'—'};
function showLookupMessage(text){lookupResult.hidden=true;lookupMessage.textContent=text;lookupMessage.hidden=false}
function showLookupResult(order){
 lookupMessage.hidden=true;put('#result-order-number',order.order_number);put('#result-fulfillment-date',new Date(`${order.shipping_date}T00:00:00`).toLocaleDateString());
 const badge=document.querySelector('#status-badge');badge.textContent=`Status: ${order.status}`;badge.className=`status-badge ${order.status.toLowerCase()}`;
 const row=document.querySelector('#tracking-row'),link=document.querySelector('#tracking-link'),hasTracking=Boolean(order.tracking_number&&!order.pickup_from_organization);row.hidden=!hasTracking;
 if(hasTracking){const carrier=order.shipping_carrier||'UPS',urls={UPS:`https://www.ups.com/track?loc=en_US&tracknum=${encodeURIComponent(order.tracking_number)}`,FedEx:`https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(order.tracking_number)}`,USPS:`https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(order.tracking_number)}`};link.textContent=`${carrier}: ${order.tracking_number}`;link.href=urls[carrier]||urls.UPS}else{link.removeAttribute('href');link.textContent=''}
 const label=document.querySelector('#fulfillment-label');
 if(order.pickup_from_organization){
  if(order.status==='Delivered'){label.textContent='Delivered to organization';put('#status-note','Your order has been delivered to your organization’s designated contact. They will notify you when it is ready for pickup. There may be a short delay between delivery and pickup availability. This private link automatically closes 60 days after completion.')}
  else if(order.status==='Shipped'){label.textContent='Shipped to organization';put('#status-note','Your order is on its way to your organization’s designated contact. They will notify you when it is ready for pickup.')}
  else{label.textContent='Estimated shipping date';put('#status-note','Your order will be delivered to your organization’s designated contact. They will notify you when it is ready for pickup. If the estimated shipping date changes, we will contact you with an update.')}
 }
 else if(order.status==='Delivered'){label.textContent='Delivered date';put('#status-note','Your order has been delivered. Thank you for your purchase! This private link automatically closes 60 days after completion.')}
 else if(order.status==='Shipped'){label.textContent='Shipped date';put('#status-note',hasTracking?'Your order has shipped. Select the tracking number above for the latest delivery information.':'Your order has shipped.')}
 else if(order.status==='Complete'){label.textContent='Estimated shipping date';put('#status-note','Your order is complete. This private link automatically closes 60 days after completion.')}
 else{label.textContent='Estimated shipping date';put('#status-note','This is an estimated shipping date. If it changes, we will contact you with an update.')}
 lookupResult.hidden=false
}
async function openPrivateOrderLink(){
 if(new URLSearchParams(location.hash.slice(1)).has('rewards'))return;
 const accessToken=new URLSearchParams(location.hash.slice(1)).get('access')||'';
 if(location.hash)history.replaceState(null,'',`${location.pathname}${location.search}`);
 if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(accessToken))return showLookupMessage('Use the private tracker link in your JMY Fabrication email to open your order.');
 showLookupMessage('Opening your order…');
 try{
  const response=await fetch(`${baseUrl}/rest/v1/rpc/lookup_order_by_access_token`,{method:'POST',headers:{apikey:publicKey,'Content-Type':'application/json'},body:JSON.stringify({p_access_token:accessToken})}),data=await response.json();
  if(!response.ok||!data?.length)return showLookupMessage('This private order link is not valid. Contact JMY Fabrication for a replacement link.');
  showLookupResult(data[0]);
 }catch{showLookupMessage('Unable to open the private order link. Please try again shortly or contact JMY Fabrication.')}
}
openPrivateOrderLink();
