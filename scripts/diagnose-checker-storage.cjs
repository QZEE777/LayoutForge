// Read-only diagnosis. Never prints credential values or PDF contents.
const fs = require('node:fs');
const { createClient } = require('@supabase/supabase-js');
const { S3Client, HeadObjectCommand } = require('@aws-sdk/client-s3');
const env = require('dotenv').parse(fs.readFileSync(process.argv[2]));
async function main() {
  const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await db.from('print_ready_checks')
    .select('id,file_key,status,retry_count,print_options').order('created_at', { ascending:false }).limit(8);
  if (error) throw new Error(error.message);
  const s3 = new S3Client({region:'auto',endpoint:env.R2_ENDPOINT,
    credentials:{accessKeyId:env.R2_ACCESS_KEY_ID,secretAccessKey:env.R2_SECRET_ACCESS_KEY},
    requestChecksumCalculation:'WHEN_REQUIRED',responseChecksumValidation:'WHEN_REQUIRED',maxAttempts:1});
  for(const row of data) {
    try {
      const head = await s3.send(new HeadObjectCommand({Bucket:env.R2_BUCKET_NAME,Key:row.file_key}),
        {abortSignal:AbortSignal.timeout(10000)});
      console.log(JSON.stringify({checkId:row.id,status:row.status,retries:row.retry_count,
        hasOptions:row.print_options!=null,storage:'present',bytes:head.ContentLength}));
    } catch(e) {
      console.log(JSON.stringify({checkId:row.id,status:row.status,storage:e.name,httpStatus:e.$metadata?.httpStatusCode}));
    }
  }
}
main().catch(e=>{console.error(e.name+': '+e.message);process.exitCode=1;});
