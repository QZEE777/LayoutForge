const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const ts = require('typescript');
const Module = require('node:module');
const path = require('node:path');
const file = path.resolve(__dirname,'../src/lib/checkerStorageError.ts');
const mod = new Module(file,module);
mod._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,file);
const {classifyCheckerStorageError: classify,validateCheckerStorageConfig:validate}=mod.exports;
test('reject wrong access-key type before consuming customer jobs',()=>{
  const env={R2_ENDPOINT:'https://test.r2.cloudflarestorage.com',R2_BUCKET_NAME:'test',R2_ACCESS_KEY_ID:'a'.repeat(32),R2_SECRET_ACCESS_KEY:'b'.repeat(64)};
  assert.doesNotThrow(()=>validate(env));
  assert.throws(()=>validate({...env,R2_ACCESS_KEY_ID:'a'.repeat(64)}),/32-character/);
  assert.throws(()=>validate({...env,R2_BUCKET_NAME:''}),/R2_BUCKET_NAME/);
});
test('missing objects and credentials fail immediately instead of endlessly retrying',()=>{
  for(const name of ['NoSuchKey','AccessDenied','SignatureDoesNotMatch','CredentialsProviderError'])
    assert.equal(classify({name,$metadata:{httpStatusCode:403}}).retryable,false);
});
test('temporary network and service failures can retry',()=>{
  for(const code of ['ECONNRESET','ETIMEDOUT','EAI_AGAIN']) assert.equal(classify({code}).retryable,true);
  for(const httpStatusCode of [429,500,503]) assert.equal(classify({$metadata:{httpStatusCode}}).retryable,true);
});
test('unknown errors fail closed and customer message omits secrets',()=>{
  const cause=new Error('https://storage.invalid/private.pdf?secret=redacted');
  const error=classify(cause);
  assert.equal(error.retryable,false);
  assert.equal(error.cause,cause);
  assert.doesNotMatch(error.message,/private|secret=|storage.invalid/);
  assert.equal(classify(error),error);
});
