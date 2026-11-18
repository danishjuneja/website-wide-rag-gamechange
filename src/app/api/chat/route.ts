import { NextResponse } from 'next/server';
import { answerQuestion } from '../../../rag/chat';
import { validateHistory } from '../../../rag/core';

export const runtime = 'nodejs';
export async function POST(request: Request) {
  if (Number(request.headers.get('content-length') || 0) > 70000) return NextResponse.json({error:'Message is too large.'},{status:413});
  try {
    const raw=await request.text();
    if(raw.length>70000) return NextResponse.json({error:'Message is too large.'},{status:413});
    const body=JSON.parse(raw);
    const history=validateHistory(body.messages);
    if (!history.length || history.at(-1)?.role !== 'user') return NextResponse.json({error:'Enter a question.'},{status:400});
    return NextResponse.json(await answerQuestion(history));
  } catch { return NextResponse.json({error:'The service is unavailable or the request is invalid. Please try again.'},{status:503}); }
}
