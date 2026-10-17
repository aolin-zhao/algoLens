import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadContent, contentSql } from './content.mjs';
const args=process.argv.slice(2);
if (!args.length || !['--check','--local','--remote'].includes(args[0])) throw new Error('Specify --check, --local or --remote');
const optionNames=new Set(['--config','--persist-to','--env']);
const extra=args.slice(1);
for(let i=0;i<extra.length;i+=2) if(!optionNames.has(extra[i]) || !extra[i+1] || extra[i+1].startsWith('--')) throw new Error('Invalid option');
const content=loadContent();
console.log(`Validated ${content.manifest.id} v${content.manifest.version}: ${content.rows.problems.length} problems, ${content.rows.solutions.length} solutions (${content.hash.slice(0,12)})`);
if(args[0]!=='--check') {
  const temp=mkdtempSync(join(tmpdir(),'algovision-content-'));
  try {
    const file=join(temp,'content.sql');writeFileSync(file,contentSql(content));
    const config=extra.includes('--config')?[]:['--config','apps/api/wrangler.jsonc'];
    const result=spawnSync(process.execPath,[resolve('node_modules/wrangler/bin/wrangler.js'),'d1','execute','DB',args[0],...config,...extra,'--file',file,'--yes'],{stdio:'inherit'});
    if(result.error) throw result.error;
    process.exitCode=result.status ?? 1;
  } finally {rmSync(temp,{recursive:true,force:true});}
}
