export function isoDate(input) {
  if (typeof input !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(input)) return null;
  const date=new Date(input+"T00:00:00.000Z");
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0,10)!==input ? null : input;
}
export function evidenceStatus(quote, sourceText) {
  if (!quote || typeof quote!=="string") return "missing";
  if (!sourceText) return "review";
  const normalized=s=>s.replace(/\s+/g," ").trim().toLowerCase();
  return normalized(sourceText).includes(normalized(quote)) ? "matched" : "review";
}
export function safeOutput(raw,sourceText="") {
  const str=(v,limit=500)=>typeof v==="string"?v.slice(0,limit):"";
  const arr=(v,limit=12)=>Array.isArray(v)?v.slice(0,limit):[];
  const quote=str(raw.deadlineEvidence,600);
  return {documentTitle:str(raw.documentTitle,200)||"Untitled notice",summary:str(raw.summary,1000),documentLanguage:str(raw.documentLanguage,100)||"Unknown",issuer:raw.issuer==null?null:str(raw.issuer,200),deadline:isoDate(raw.deadline),deadlineEvidence:quote,deadlineEvidenceStatus:evidenceStatus(quote,sourceText),items:arr(raw.items).map(v=>({title:str(v?.title,200)||"Review requirement",description:str(v?.description,700),evidence:str(v?.evidence,600),dueDate:isoDate(v?.dueDate),required:v?.required===true,priority:["high","medium","low"].includes(v?.priority)?v.priority:"medium",evidenceStatus:evidenceStatus(str(v?.evidence,600),sourceText)})),missingInformation:arr(raw.missingInformation).map(v=>str(v,250)),cautions:arr(raw.cautions).map(v=>str(v,250))};
}
