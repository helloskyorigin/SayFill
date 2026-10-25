import test from "node:test";import assert from "node:assert/strict";
import {makeGroqRequest,fileSignatureMatches,MAX_UPLOAD_BYTES,DEFAULT_GROQ_MODEL} from "../lib/groq.mjs";
test("text analysis is Groq chat JSON",()=>{const p=makeGroqRequest({text:"Bring school ID by 28 October 2026"});assert.equal(p.model,DEFAULT_GROQ_MODEL);assert.equal(p.response_format.type,"json_object");assert.match(p.messages[1].content,/school ID/);});
test("vision uses image_url, not Gemini inlineData",()=>{const p=makeGroqRequest({text:"",image:"AQID",mime:"image/png"});assert.equal(p.messages[1].content[1].image_url.url,"data:image/png;base64,AQID");});
test("invalid binary signatures are rejected",()=>{assert.ok(fileSignatureMatches(Buffer.from("%PDF-1.4 xyz"),"application/pdf"));assert.ok(!fileSignatureMatches(Buffer.from("%PDF-1.4 xyz"),"image/png"));assert.equal(MAX_UPLOAD_BYTES,3145728);});
