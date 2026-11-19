'use client';
import { useEffect, useRef, useState } from 'react';
type Message = {role:'user'|'assistant';content:string;citations?:string[]};
function AnswerText({message}:{message:Message}) {
  return <p>{message.content.split(/(\[\d+\])/g).map((part,index)=>{
    const marker=/^\[(\d+)\]$/.exec(part);
    const url=marker && message.role==='assistant' ? message.citations?.[Number(marker[1])-1] : undefined;
    if(!url || !/^https:\/\//i.test(url)) return part;
    return <a className="citation" href={url} target="_blank" rel="noopener noreferrer" aria-label={'Source '+marker![1]+' on '+new URL(url).hostname} title={url} key={index}>{part}</a>;
  })}</p>;
}
const initial='Hello! Ask me about products, eligibility or features. I’ll look for supporting information on the bank’s website.';
export default function Home() {
  const [messages,setMessages]=useState<Message[]>([{role:'assistant',content:initial}]);
  const [input,setInput]=useState(''); const [busy,setBusy]=useState(false); const [error,setError]=useState('');
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null); const generation=useRef(0);
  function reset() { generation.current++; setMessages([{role:'assistant',content:initial}]); setError(''); setBusy(false); setInput(''); }
  function refreshTimer() { if (timer.current) clearTimeout(timer.current); timer.current=setTimeout(reset,15*60*1000); }
  useEffect(()=>{refreshTimer(); return ()=>{if(timer.current) clearTimeout(timer.current)}},[]);
  async function send(value:string) {
    const text=value.trim(); if(!text || busy) return;
    refreshTimer(); setError(''); setInput('');
    const current=[...messages,{role:'user' as const,content:text}].slice(-12); setMessages(current); setBusy(true); const requestId=generation.current;
    try {
      const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:current.map(({role,content})=>({role,content}))})});
      const result=await response.json(); if(!response.ok) throw new Error(result.error || 'Please try again.');
      if(requestId===generation.current) setMessages(m=>[...m,{role:'assistant',content:result.answer,citations:result.citations}]);
    } catch(e) { if(requestId===generation.current) setError(e instanceof Error ? e.message : 'Please try again.'); }
    finally {if(requestId===generation.current) setBusy(false)}
  }
  return <><header><div className="brand"><span className="mark">E</span><span>Website information assistant<small>Independent demonstration</small></span></div><button className="new" onClick={()=>{reset();refreshTimer()}}>↺ <span>New conversation</span></button></header>
    <main><div className="intro"><span className="eyebrow">INFORMATION, MADE EASIER</span><h1>How can we help?</h1><p>Explore banking products and find the pages behind each answer.</p></div>
    <section className="chat" aria-label="Chat"><div className="chathead"><span className="avatar">✦</span><div><strong>Website assistant</strong><small>Answers from public website information</small></div><span className="online">Public sources</span></div>
    <div className="messages" aria-live="polite">{messages.map((m,i)=><div className={`row ${m.role}`} key={i}><div className="bubble"><AnswerText message={m}/></div></div>)}{busy&&<div className="row"><div className="bubble thinking">Searching for relevant information…</div></div>}</div>
    {messages.length===1&&<div className="prompts"><span>Try asking</span>{['What types of accounts are available?','What credit cards do you offer?','How can I learn about personal loans?'].map(q=><button key={q} onClick={()=>send(q)}>{q} <b>↗</b></button>)}</div>}
    {error&&<p className="error" role="alert">{error}</p>}<form onSubmit={e=>{e.preventDefault();send(input)}}><label className="sr" htmlFor="question">Your question</label><input id="question" maxLength={5000} placeholder="Ask a question…" value={input} onChange={e=>{setInput(e.target.value);refreshTimer()}} disabled={busy}/><button aria-label="Send question" disabled={busy||!input.trim()}>↑</button></form><p className="notice">Please don’t share passwords, PINs, OTPs or account details.</p></section>
    <p className="foot">This demonstration provides public information only. Check the linked sources for current terms.</p></main></>;
}
