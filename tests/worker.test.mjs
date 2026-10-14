import test from "node:test";
import assert from "node:assert/strict";
import { webcrypto } from "node:crypto";
import worker from "../backend/worker.js";

// Pure API tests: Workers AI is mocked, so no AI usage or costs occur.
if (!globalThis.crypto) globalThis.crypto = webcrypto;
const origin = "https://moritzfrohnapfel-tech.github.io";
const access = "this-is-only-a-test-password-not-for-production-123";
const sample = {kind:"Disposition",date:"",site:"Teststadt",person:"Max Mustermann",resources:"2 × LKW",time:"07:30",material:"",pickup:"",destination:"",action:"LKW bringen",detail:"Max braucht zwei LKW in Teststadt",warnings:[]};
const mockAI = { run: async (model, args) => {
  assert.equal(model, "@cf/meta/llama-3.1-8b-instruct");
  assert.equal(args.response_format.type, "json_schema");
  return {response:{entries:[sample]}};
}};
const env = { AI:mockAI, DISPO_ACCESS_TOKEN:access };
function request(path, method="GET", auth="", payload) {
  return new Request("https://dispo.example"+path,{
    method,
    headers:{
      Origin:origin,
      ...(auth?{Authorization:"Bearer "+auth}:{}),
      ...(payload?{"Content-Type":"application/json"}:{})
    },
    ...(payload?{body:JSON.stringify(payload)}:{})
  });
}
test("health without secrets reports not ready",async()=>{
  const res=await worker.fetch(request("/health"),{AI:mockAI});
  assert.equal(res.status,200);
  assert.equal((await res.json()).ready,false);
});
test("health with AI binding and secret reports ready",async()=>{
  const res=await worker.fetch(request("/health"),env);
  const data=await res.json();
  assert.equal(data.ready,true);
  assert.equal(data.engine,"Cloudflare Workers AI");
});
test("preflight is allowed for GitHub Pages",async()=>{
  const res=await worker.fetch(request("/api/analyze","OPTIONS"),env);
  assert.equal(res.status,204);
  assert.equal(res.headers.get("Access-Control-Allow-Origin"),origin);
});
test("other origins are blocked",async()=>{
  const res=await worker.fetch(new Request("https://dispo.example/health",{headers:{Origin:"https://elsewhere.example"}}),env);
  assert.equal(res.status,403);
});
test("wrong authorization is rejected before inference",async()=>{
  const res=await worker.fetch(request("/api/analyze","POST","incorrect",{text:"Zwei LKW nach Teststadt",today:"2026-10-14"}),env);
  assert.equal(res.status,401);
});
test("structured Workers AI results become review cards",async()=>{
  const res=await worker.fetch(request("/api/analyze","POST",access,{text:"Zwei LKW nach Teststadt",today:"2026-10-14"}),env);
  assert.equal(res.status,200);
  const data=await res.json();
  assert.equal(data.source,"ai");
  assert.equal(data.entries[0].site,"Teststadt");
  assert.ok(data.entries[0].warnings.includes("Datum nicht genannt"));
});
test("string JSON model responses are supported",async()=>{
  const res=await worker.fetch(request("/api/analyze","POST",access,{text:"Zwei LKW",today:"2026-10-14"}),{...env,AI:{run:async()=>({response:JSON.stringify({entries:[sample]})})}});
  assert.equal(res.status,200);
  assert.equal((await res.json()).entries.length,1);
});
test("exhausted free quota gives meaningful error",async()=>{
  const res=await worker.fetch(request("/api/analyze","POST",access,{text:"Zwei LKW",today:"2026-10-14"}),{...env,AI:{run:async()=>{throw Error("429 quota exceeded")}}});
  assert.equal(res.status,503);
  assert.match((await res.json()).error,/Kontingent/);
});
