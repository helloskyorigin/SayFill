import {NextRequest,NextResponse} from "next/server";
import {AnalysisSchema} from "@/lib/types";
import {safeOutput} from "@/lib/analysis.mjs";
import {makeGroqRequest,fileSignatureMatches,MAX_UPLOAD_BYTES,GROQ_ENDPOINT,DEFAULT_GROQ_MODEL} from "@/lib/groq.mjs";
export const runtime="nodejs";
export const maxDuration=60;
const ALLOWED=new Set(["application/pdf","image/png","image/jpeg","image/webp"]);
const RATE=new Map<string,{time:number;count:number}>();
const fail=(error:string,status=400)=>NextResponse.json({error},{status,headers:{"Cache-Control":"no-store"}});
async function pdfText(bytes:Buffer) {
 const {PDFParse}=await import("pdf-parse");
 const parser=new PDFParse({data:new Uint8Array(bytes)});
 try{const out=await parser.getText({first:1,last:10});return String(out.text||"").trim().slice(0,18000);}
 finally{await parser.destroy();}
}
export async function POST(req:NextRequest) {
 try {
  const key=process.env.GROQ_API_KEY;
  if(!key||key.startsWith("replace_"))return fail("Groq API key not configured. Add GROQ_API_KEY in Vercel environment settings.",503);
  if(Number(req.headers.get("content-length")||0)>MAX_UPLOAD_BYTES+200000)return fail("Maximum uploaded file size is 3 MB.",413);
  const ip=(req.headers.get("x-real-ip")||req.headers.get("x-forwarded-for")||"unknown").split(",")[0].trim(),now=Date.now(),prev=RATE.get(ip);
  if(prev&&now-prev.time<60000&&prev.count>=4)return fail("Too many scans. Please retry in a minute.",429);
  RATE.set(ip,prev&&now-prev.time<60000?{time:prev.time,count:prev.count+1}:{time:now,count:1});
  if(RATE.size>2500)for(const [k,v] of RATE)if(now-v.time>120000)RATE.delete(k);
  const form=await req.formData(),input=form.get("text"),file=form.get("file");
  if(input!==null&&typeof input!=="string")return fail("Invalid text input.",400);
  if(file!==null&&!(file instanceof File))return fail("Invalid document upload.",400);
  let text=typeof input==="string"?input.trim():"";
  if(file&&text)return fail("Submit a file or pasted text, not both.");
  if(text.length>18000)return fail("Maximum pasted text is 18,000 characters.",413);
  if(!file&&text.length<35)return fail("Upload a notice or paste at least 35 characters.");
  let image:string|undefined,mime:string|undefined;
  if(file){
    mime=file.type==="image/jpg"?"image/jpeg":file.type;
    if(!ALLOWED.has(mime))return fail("Only PDF, JPG, PNG and WEBP files are supported.",415);
    if(!file.size||file.size>MAX_UPLOAD_BYTES)return fail("Maximum file size is 3 MB.",413);
    const bytes=Buffer.from(await file.arrayBuffer());
    if(!fileSignatureMatches(bytes,mime))return fail("The uploaded file does not match its declared type.",415);
    if(mime==="application/pdf"){
      try{text=await pdfText(bytes);}catch{return fail("PDF unreadable. Please upload a selectable-text PDF or a clear JPG/PNG screenshot.",422);}
      if(text.length<35)return fail("This PDF has no selectable text. Upload a screenshot instead.",422);
    } else image=bytes.toString("base64");
  }
  const model=process.env.GROQ_MODEL||DEFAULT_GROQ_MODEL;
  const payload=makeGroqRequest({text,image,mime,model});
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),42000);
  let response:Response;
  try{response=await fetch(GROQ_ENDPOINT,{method:"POST",headers:{"Content-Type":"application/json","Authorization":"Bearer "+key},body:JSON.stringify(payload),cache:"no-store",signal:controller.signal});}
  catch(e){return fail(e instanceof Error&&e.name==="AbortError"?"AI timed out. Try a smaller notice.":"Groq AI service unavailable.",504);}
  finally{clearTimeout(timer);}
  if(!response.ok){
    if(response.status===429)return fail("Groq rate limit reached. Retry shortly.",429);
    if(response.status===401||response.status===403)return fail("Groq key or model access invalid.",503);
    return fail("Groq analysis failed. Please try again.",502);
  }
  let payloadOut:{choices?:Array<{message?:{content?:string|null}}>}={};
  try{payloadOut=await response.json();}catch{return fail("AI response was not readable.",502);}
  const rawText=payloadOut.choices?.[0]?.message?.content;
  if(!rawText||rawText.length>40000)return fail("AI could not understand the notice.",422);
  let raw:unknown;
  try{raw=JSON.parse(rawText);}catch{return fail("AI returned incomplete JSON. Please retry.",502);}
  if(!raw||typeof raw!=="object"||Array.isArray(raw))return fail("AI returned invalid structured data.",502);
  const result=AnalysisSchema.safeParse(safeOutput(raw as Record<string,unknown>,text));
  if(!result.success)return fail("AI analysis failed validation. Please retry.",502);
  return NextResponse.json({analysis:result.data},{headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"}});
 }catch(e){
  if(e instanceof TypeError||e instanceof SyntaxError)return fail("Invalid document submission.",400);
  return fail("Unable to analyze this notice. Please retry.",500);
 }
}
