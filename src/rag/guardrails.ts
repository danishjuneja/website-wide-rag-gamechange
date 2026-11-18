export function requiresAccountAction(text:string):boolean {
 const action=/\b(transfer|send|move|pay|withdraw|block|cancel|close|check|show)\b/i.test(text);
 const target=/\b(my|me|mine|myself)\b/i.test(text);
 const banking=/\b(money|funds|account|balance|card|payment|loan)\b/i.test(text);
 const informational=/^\s*(how|what|where|when|why|can i|is it possible)\b/i.test(text);
 return action&&target&&banking&&!informational;
}

export function isUnrelatedRequest(text: string): boolean {
  // Keep this early exit conservative. Travel and sports benefits can be banking questions.
  return /^(?:please )?(?:who won (?:the|yesterday.s|last night.s) (?:match|game)|what(?:.s| is) the (?:weather|score)(?: today)?|tell me a joke)[?!. ]*$/i.test(text.trim());
}

export function separatePersonalDecision(question: string) {
  const parts = question.split(/\s+(?:and|also)\s+|[;?]\s*/i).map(s => s.trim()).filter(Boolean);
  const personal = parts.filter(part =>
    /\b(I|my|me|personally)\b/i.test(part) &&
    /\b(credit limit|exact limit|approved amount|approval decision|approved rate)\b/i.test(part) &&
    /\b(exact|receive|get|my|assigned|qualify)\b/i.test(part) &&
    !/^(?:how|where) (?:can|do) I (?:view|check|find)/i.test(part));
  if (!personal.length) return null;
  return { publicQuestion: parts.filter(part=>!personal.includes(part)).join(' and '),
    notice: 'Your individual approval terms, including your personal credit limit, cannot be determined from public product information.' };
}
