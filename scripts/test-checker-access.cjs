/* Isolated route tests: real route handlers/Next responses; fake storage, database and auth.
   No env file, network, payments, email, or production state is used. */
const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const root = path.resolve(__dirname, '..');
const ts = require('typescript');
process.env.CHECKER_ACCESS_SECRET = 'local-test-only-'.repeat(4);
process.env.NEXT_PUBLIC_APP_URL = 'https://checker.example';
process.env.NODE_ENV = 'production';
require.extensions['.ts'] = (mod, file) => mod._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true }
}).outputText, file);
const resolve = Module._resolveFilename;
Module._resolveFilename = function(name, parent, ...args) {
  return resolve.call(this, name.startsWith('@/') ? path.join(root, 'src', name.slice(2)) : name, parent, ...args);
};
const load = Module._load;
const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const UPLOAD = '33333333-3333-4333-8333-333333333333';
const CHECK = '44444444-4444-4444-8444-444444444444';
const report = {
  outputType:'checker', issues:['PRIVATE manuscript issue'], chaptersDetected:0, fontUsed:'Private font', trimSize:'6x9',
  pageCount:100, trimDetected:'6x9', trimMatchKDP:true, readinessScore100:85,
  page_issues:[{page:2,rule_id:'MIN_FONT_SIZE',severity:'ERROR',message:'PRIVATE sentence',bbox:[1,2,3,4]}],
  issuesEnriched:[{humanMessage:'PRIVATE sentence',toolFixInstruction:'PRIVATE fix'}],
  hasPdfPreview:true, pdfSourceUrl:`/api/r2-file?id=${A}`, fileNameScanned:'PRIVATE book.pdf',
};
const meta = { id:A, originalName:'PRIVATE book.pdf', mimeType:'application/pdf', storedPath:'private', createdAt:1,
  sourcePdfKey:`uploads/${UPLOAD}.pdf`, payment_confirmed:true, processingReport:report,
  annotatedPdfUrl:'https://engine.invalid/file/PRIVATE-engine-id/annotated',
  annotatedPdfDownloadUrl:`https://storage.invalid/uploads/${A}/annotated-local-1.pdf?PRIVATE-signature`, annotatedPdfStatus:'ready' };
let userEmail = null, payments = [], paid = true, signedReads = 0, fileReads = 0, annotations = 0, writes = 0;
const mockStorage = {
  getStored: async id => id === A ? {...meta,payment_confirmed:paid} : null,
  normalizeAnnotatedPdfStatus: s => s || 'not_requested',
  readStoredFile: async () => { fileReads++; return Buffer.from('PRIVATE PDF'); },
  readOutput: async () => { fileReads++; return Buffer.from('PRIVATE PDF'); },
  updateMeta: async () => { writes++; }, updateAnnotatedState: async () => { writes++; },
};
const mockDb = { from(table) {
  let email;
  const builder={select(){return this},eq(k,v){if(k==='email')email=v;return this},or(){return this},limit(){return this},
    then(ok,fail){return Promise.resolve({data:payments.filter(p=>p.email===email),error:null}).then(ok,fail)},
    async maybeSingle(){return {data:table==='print_ready_checks'?{our_job_id:UPLOAD,result_download_id:A}:null,error:null}},
    async single(){return {data:{our_job_id:UPLOAD,result_download_id:A,status:'done'},error:null}},
  }; return builder;
}};
const mocks = {
 'storage.ts':mockStorage,
 'supabase.ts':{supabase:mockDb},
 'supabaseServer.ts':{createClient:async()=>({auth:{getUser:async()=>({data:{user:userEmail?{email:userEmail}:null},error:null})}})},
 'r2Storage.ts':{getSignedUrlForKey:async key=>{signedReads++;return `https://storage.invalid/${key}?signed`},getSignedDownloadUrl:async(id,name)=>{signedReads++;return `https://storage.invalid/uploads/${id}/${name}?signed`}},
 'annotatePdf.ts':{annotateCheckerPdf:async()=>{annotations++;return {annotatedPdfDownloadUrl:meta.annotatedPdfDownloadUrl}}},
 'postScanNurtureEmail.ts':{enqueuePostScanNurtureEmail:()=>{}},
};
Module._load = function(name,parent,...args) {
  const resolved=Module._resolveFilename(name,parent);
  const match=Object.entries(mocks).find(([file])=>resolved===path.join(root,'src','lib',file));
  return match ? match[1] : load.call(this,name,parent,...args);
};
const {NextRequest}=require('next/server');
const cap=require('../src/lib/checkerCapability.ts');
const {requireCheckerAccess}=require('../src/lib/checkerAccess.ts');
const req=(url, resource, method='GET', body)=>new NextRequest(`https://checker.example${url}`,{
  method,headers:{...(resource?{cookie:cap.checkerCookie(resource).split(';')[0]}:{}),...(body?{'Content-Type':'application/json'}:{})},
  ...(body?{body:JSON.stringify(body)}:{})
});
test.beforeEach(()=>{paid=true;userEmail=null;payments=[];signedReads=0;fileReads=0;annotations=0;writes=0});
test('capabilities reject forged, expired, different-document and wrong-purpose tokens',()=>{
  const token=cap.signCheckerCapability(A,'browser');
  assert(cap.verifyCheckerCapability(token,A,'browser'));
  assert(!cap.verifyCheckerCapability(token,B,'browser'));
  assert(!cap.verifyCheckerCapability(token,A,'email'));
  assert(!cap.verifyCheckerCapability(token+'x',A,'browser'));
  assert(!cap.verifyCheckerCapability(cap.signCheckerCapability(A,'browser',-1),A,'browser'));
  assert(!cap.verifyCheckerCapability(`${Math.floor(Date.now()/1000)+60}.${'a'.repeat(64)}`,A,'browser'));
});
test('production upload capability cookie is secure, host-only and HttpOnly',()=>{
  const cookie=cap.checkerCookie(UPLOAD);
  assert(cookie.startsWith('__Host-')); for(const flag of ['HttpOnly','Secure','SameSite=Lax','Path=/'])assert(cookie.includes(flag));
  assert(!cookie.includes('Domain='));
});
test('public ID and wrong upload cookie cannot read paid data; correct uploader can',async()=>{
  assert.equal((await requireCheckerAccess(req('/',B),A,{paid:true})).status,403);
  assert.equal((await requireCheckerAccess(req('/'),A,{paid:true})).status,403);
  assert.equal(await requireCheckerAccess(req('/',UPLOAD),A,{paid:true}),null);
  paid=false;
  assert.equal((await requireCheckerAccess(req('/',UPLOAD),A,{paid:true})).status,402);
});
test('verified purchaser can recover an old paid report; other accounts cannot',async()=>{
  userEmail='buyer@example.test';
  assert.equal((await requireCheckerAccess(req('/'),A,{paid:true})).status,403);
  payments=[{id:'payment',email:userEmail}];
  assert.equal(await requireCheckerAccess(req('/'),A,{paid:true}),null);
  userEmail='someone-else@example.test';
  assert.equal((await requireCheckerAccess(req('/'),A,{paid:true})).status,403);
});
test('unpaid/unauthorized format-report is an allowlisted preview with no private fields',async()=>{
  const {GET}=require('../src/app/api/format-report/route.ts');
  for(const owner of [undefined,UPLOAD]) {
    paid=false;
    const response=await GET(req(`/api/format-report?id=${A}`,owner));
    const data=await response.json();
    assert.equal(data.report.previewOnly,true); assert.equal(data.report.score,85);
    assert(!JSON.stringify(data).includes('PRIVATE')); assert(!data.report.page_issues); assert(!data.report.annotatedPdfUrl);
    assert.match(response.headers.get('cache-control'),/no-store/);
  }
  paid=true; const result=await (await GET(req(`/api/format-report?id=${A}`))).json();
  assert.equal(result.report.previewOnly,true);
});
test('paid owner receives full findings but no bare engine identifier or stored signed URL',async()=>{
  const {GET}=require('../src/app/api/format-report/route.ts');
  const result=await (await GET(req(`/api/format-report?id=${A}`,UPLOAD))).json();
  assert(result.report.page_issues.length); assert(!result.report.previewOnly);
  assert(!JSON.stringify(result).includes('PRIVATE-engine-id')); assert(!JSON.stringify(result).includes('PRIVATE-signature'));
  assert.equal(result.report.annotatedPdfDownloadUrl,`/api/checker-annotated-download?id=${A}`);
});
test('original PDF presigning is behind ownership AND entitlement, including check-ID alias',async()=>{
  const {GET}=require('../src/app/api/r2-file/route.ts');
  assert.equal((await GET(req(`/api/r2-file?id=${CHECK}`))).status,403); assert.equal(signedReads,0);
  paid=false; assert.equal((await GET(req(`/api/r2-file?id=${A}`,UPLOAD))).status,402); assert.equal(signedReads,0);
  paid=true; assert.equal((await GET(req(`/api/r2-file?id=${CHECK}`,UPLOAD))).status,200); assert.equal(signedReads,1);
});
test('view, output download, annotation download and annotation generation reject public IDs',async()=>{
  const view=require('../src/app/api/view-pdf/[id]/route.ts');
  const output=require('../src/app/api/download/[id]/[filename]/route.ts');
  const annotated=require('../src/app/api/checker-annotated-download/route.ts');
  const generation=require('../src/app/api/annotate-local/route.ts');
  assert.equal((await view.GET(req('/'),{params:Promise.resolve({id:A})})).status,403);
  assert.equal((await output.GET(req('/'),{params:Promise.resolve({id:A,filename:'report.pdf'})})).status,403);
  assert.equal((await annotated.GET(req(`/?id=${A}`))).status,403);
  assert.equal((await generation.POST(req('/',undefined,'POST',{downloadId:A}))).status,403);
  assert.equal(fileReads+signedReads+annotations,0);
});
test('worker annotation capability cannot authorize public manuscript reads',async()=>{
  const auth=`Bearer ${cap.signCheckerCapability(A,'annotation',300)}`;
  const internal=new NextRequest('https://checker.example/',{method:'POST',headers:{authorization:auth,'content-type':'application/json'},body:JSON.stringify({downloadId:A})});
  paid=false;
  assert.equal((await require('../src/app/api/annotate-local/route.ts').POST(internal)).status,200);
  assert.equal(annotations,1);
  assert.equal((await requireCheckerAccess(internal,A,{paid:true})).status,403);
});
test('private email exchange installs cookie, strips token, and rejects unpaid/forged links',async()=>{
  const {GET}=require('../src/app/api/checker-access/route.ts');
  const link=cap.checkerDeliveryLink(A);
  const response=await GET(new NextRequest(link));
  assert.equal(response.status,303); assert.match(response.headers.get('set-cookie'),/HttpOnly/);
  assert(!response.headers.get('location').includes('token')); assert.equal(response.headers.get('referrer-policy'),'no-referrer');
  assert.equal((await GET(req(`/?id=${A}&token=bad`))).status,403);
  paid=false; assert.equal((await GET(new NextRequest(link))).status,403);
});
test('checkout claims cannot be manufactured from a browser or email capability',()=>{
  assert(cap.verifyCheckerCapability(cap.signCheckerCapability(A,'checkout'),A,'checkout'));
  for(const purpose of ['email','browser','annotation'])assert(!cap.verifyCheckerCapability(cap.signCheckerCapability(A,purpose),A,'checkout'));
});
test('caller-supplied free tool label cannot unlock a checker report',async()=>{
  const {POST}=require('../src/app/api/verify-access/route.ts');
  for(const tool of ['pdf-compress','kdp-formatter-pdf']) {
    assert.equal((await (await POST(req('/',undefined,'POST',{downloadId:A,tool}))).json()).access,false);
  }
});
test('checkout rejects unknown reports and other users reports before contacting payments',async()=>{
  const {POST}=require('../src/app/api/create-checkout-session/route.ts');
  assert.equal((await POST(req('/',undefined,'POST',{downloadId:B,priceType:'single_use'}))).status,404);
  assert.equal((await POST(req('/',undefined,'POST',{downloadId:A,priceType:'single_use'}))).status,403);
});
test('all obsolete engine-ID transports are closed without upstream calls',async()=>{
  for(const [p,method] of [['kdp-pdf-check','POST'],['upload-proxy','POST'],['kdp-annotated-pdf','GET'],['preflight-file/[jobId]','GET']]) {
    assert.equal((await require(`../src/app/api/${p}/route.ts`)[method]()).status,410);
  }
});
