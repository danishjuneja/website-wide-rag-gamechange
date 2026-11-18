export function requiresAccountAction(text:string):boolean {
 const action=/\b(transfer|send|move|pay|withdraw|block|cancel|close|check|show)\b/i.test(text);
 const target=/\b(my|me|mine|myself)\b/i.test(text);
 const banking=/\b(money|funds|account|balance|card|payment|loan)\b/i.test(text);
 const informational=/^\s*(how|what|where|when|why|can i|is it possible)\b/i.test(text);
 if (/^\s*(?:please\s+)?(?:show|tell) me\b/i.test(text) && !/\b(?:my|mine|for my account)\b/i.test(text)) return false;
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
  const predictions = parts.filter(part =>
    /\b(?:guarantee|predict|promise)\b/i.test(part) &&
    /\b(?:my|me|i)\b/i.test(part) &&
    /\b(?:returns?|profit|gains?|earnings?|yield)\b/i.test(part) &&
    !/\b(?:contract|terms|policy|document|prospectus)\b/i.test(part));
  if (!personal.length && !predictions.length) return null;
  const notices = [];
  if (personal.length) notices.push('Your individual approval terms, including your personal credit limit, cannot be determined from public product information.');
  if (predictions.length) notices.push('I cannot predict or guarantee your personal investment return. Historical performance does not establish your future return.');
  return { publicQuestion: parts.filter(part=>!personal.includes(part) && !predictions.includes(part)).join(' and '), notice: notices.join(' ') };
}
