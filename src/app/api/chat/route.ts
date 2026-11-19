import { NextResponse } from 'next/server';
import { answerQuestion } from '../../../rag/chat';
import { validateHistory, type Message } from '../../../rag/core';
import { ProviderError, providerResponse } from '../../../rag/provider-error';

export const runtime = 'nodejs';
export const maxDuration = 300;
function respond(body:unknown,init?:ResponseInit){
  const response=NextResponse.json(body,init);
  const revision=process.env.VERCEL_GIT_COMMIT_SHA;
  if(revision && /^[0-9a-f]{40}$/i.test(revision))response.headers.set('X-App-Revision',revision.slice(0,12));
  return response;
}
export async function POST(request: Request) {
  if (Number(request.headers.get('content-length') || 0) > 70000) return respond({error:'Message is too large.'},{status:413});
  let history:Message[];
  try {
    const raw=await request.text();
    if(raw.length>70000) return respond({error:'Message is too large.'},{status:413});
    const body=JSON.parse(raw);
    history=validateHistory(body?.messages);
    if (!history.length || history.at(-1)?.role !== 'user') throw new Error('Missing user question');
  } catch {return respond({error:'Please enter a valid question.'},{status:400});}
  try {
    return respond(await answerQuestion(history));
  } catch(error) {
    const requestId=crypto.randomUUID();
    if(error instanceof ProviderError){
      console.warn('chat_provider_failure',{requestId,provider:error.provider,status:error.status,code:error.code,retryAfter:error.retryAfter});
      const result=providerResponse(error);
      return respond({...result,requestId},{status:result.status,headers:result.retryAfter?{'Retry-After':String(result.retryAfter)}:undefined});
    }
    console.error('chat_service_failure',{requestId,errorType:error instanceof Error?error.name:'unknown'});
    return respond({error:'The knowledge service is temporarily unavailable. Please try again.',requestId},{status:503});
  }
}
