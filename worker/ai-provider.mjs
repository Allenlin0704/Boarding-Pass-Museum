export const CLOUDFLARE_AI_MODEL='@cf/google/gemma-4-26b-a4b-it';

export function aiProviderForRequest(request,trustedCountry){
  const country=String(trustedCountry||request?.cf?.country||'').trim().toUpperCase();
  return {id:'cloudflare',name:'Cloudflare Workers AI',country:country||null,model:CLOUDFLARE_AI_MODEL};
}

export function aiProviderConfigured(provider,env){
  return typeof env?.AI?.run==='function';
}

export async function runAI(env,input){
  if(!aiProviderConfigured(null,env))throw new Error('AI binding unavailable');
  return env.AI.run(CLOUDFLARE_AI_MODEL,input,{rejectIfBusy:true});
}

export function aiText(result){
  const value=result?.response??result?.choices?.[0]?.message?.content;
  if(typeof value==='string')return value;
  if(Array.isArray(value))return value.map(part=>typeof part?.text==='string'?part.text:'').join('');
  return '';
}

export function aiFailureStatus(error){
  const detail=[error?.message,error?.code,error?.status,error?.cause?.message,error?.cause?.code,error].filter(value=>value!==undefined&&value!==null).join(' ');
  return /3036|3040|\b429\b|capacity temporarily exceeded|daily.*allocation|free allocation|quota/i.test(detail)?429:503;
}
