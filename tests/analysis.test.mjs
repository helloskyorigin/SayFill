import test from "node:test";import assert from "node:assert/strict";import {isoDate,evidenceStatus,safeOutput} from "../lib/analysis.mjs";
test("invalid calendar dates rejected",()=>{assert.equal(isoDate("2026-02-30"),null);assert.equal(isoDate("2026-10-27"),"2026-10-27");});
test("unverifiable files marked review",()=>assert.equal(evidenceStatus("Original quote",""),"review"));
test("text quotes need exact contiguous match",()=>{assert.equal(evidenceStatus("submit documents","Please submit  documents."),"matched");assert.equal(evidenceStatus("scholarship granted","Please submit documents."),"review");});
test("missing year is not invented",()=>{const x=safeOutput({deadline:"Oct 27",items:[]},"");assert.equal(x.deadline,null);});
