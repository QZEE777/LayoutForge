const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (mod,file) => mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'), {
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,esModuleInterop:true}
}).outputText,file);
const {assertCompletePreflightReport:validate}=require('../src/lib/preflightReportValidation.ts');
const {enrichCheckerReport}=require('../src/lib/kdpReportEnhance.ts');
const {parseCheckerPrintOptions}=require('../src/lib/checkerPrintOptions.ts');
const {inspectPdfBufferForChecker}=require('../src/lib/kdpPdfInspect.ts');
const {PDFDocument}=require('pdf-lib');
const good=()=>({status:'PASS',errors:[],warnings:[],summary:{total_pages:24,rules_checked:26,error_count:0,warning_count:0},readiness_score:97});
test('missing, empty, failed and contradictory engine reports cannot become successful reports',()=>{
  for(const r of [null,{}, {...good(),summary:undefined}, {...good(),status:'failed'},
    {...good(),summary:{...good().summary,rules_checked:0}},
    {...good(),summary:{...good().summary,error_count:1}},
    {...good(),readiness_score:NaN}, {...good(),readiness_score:101},
    {...good(),page_issues:[{}]}])assert.throws(()=>validate(r));
  assert.doesNotThrow(()=>validate(good()));
});
test('genuine zero engine scores survive validation and enrichment',()=>{
  const issue={page:1,rule_id:'GUTTER_MARGIN',severity:'ERROR',message:'Text inside gutter.'};
  const engine={...good(),status:'FAIL',errors:[issue],readiness_score:0,approval_likelihood:0,
    summary:{...good().summary,error_count:1}};
  validate(engine);
  const report=enrichCheckerReport({issues:[issue.message],pageCount:24,trimMatchKDP:true,trimDetected:'6x9',trimWidthIn:6,trimHeightIn:9},'test.pdf',engine,0,0);
  assert.equal(report.readinessScore100,0);
  assert.equal(report.kdpPassProbability,0);
  assert.equal(report.kdpReady,false);
});
test('print options reject missing or invalid choices and strip unrelated fields',()=>{
  for(const value of [undefined,{}, {bookType:'paperback',bleedMode:'maybe',colorMode:'bw'},
    {bookType:['paperback'],bleedMode:'bleed',colorMode:'color'}])assert.throws(()=>parseCheckerPrintOptions(value));
  assert.deepEqual(parseCheckerPrintOptions({bookType:'hardcover',bleedMode:'bleed',colorMode:'color',paperType:'premium-color',private:'secret'}),
    {bookType:'hardcover',bleedMode:'bleed',colorMode:'color',paperType:'premium-color'});
});
test('hardcover page advisory follows the selected format, not shared trim dimensions',()=>{
  const base={issues:[],pageCount:24,trimMatchKDP:true,trimDetected:'6×9',trimWidthIn:6,trimHeightIn:9};
  const paperback=enrichCheckerReport({...base,printOptions:{bookType:'paperback',bleedMode:'no-bleed',colorMode:'bw',paperType:'white'}},'test.pdf');
  assert.equal(paperback.advisoryNotices.some(n=>n.rule_id==='HARDCOVER_PAGE_MIN'),false);
  const hardcover=enrichCheckerReport({...base,printOptions:{bookType:'hardcover',bleedMode:'no-bleed',colorMode:'bw',paperType:'white'}},'test.pdf');
  assert.equal(hardcover.advisoryNotices.some(n=>n.rule_id==='HARDCOVER_PAGE_MIN'),true);
});
test('real PDF fixture: 6.125 by 9.25 bleed page is a 6 by 9 trim',async()=>{
  const pdf=await PDFDocument.create();pdf.addPage([441,666]);
  const buffer=Buffer.from(await pdf.save());
  const bleed=await inspectPdfBufferForChecker(buffer,true);
  assert.equal(bleed.trimWidthIn,6); assert.equal(bleed.trimHeightIn,9);assert.equal(bleed.trimMatchKDP,true);
  const noBleed=await inspectPdfBufferForChecker(buffer,false);
  assert.equal(noBleed.trimWidthIn,6.13);assert.equal(noBleed.trimMatchKDP,false);
});
test('hardcover catalog recognizes 8.25 by 11 and rejects 8.5 by 11',async()=>{
  for(const [width,expected] of [[8.25,true],[8.5,false]]) {
    const pdf=await PDFDocument.create();pdf.addPage([width*72,792]);
    assert.equal((await inspectPdfBufferForChecker(Buffer.from(await pdf.save()),false,true)).trimMatchKDP,expected);
  }
});
