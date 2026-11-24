// Generates an explicitly mock-only LaunchAgent; does not install or start it.
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const LABEL='jp.jwsnj.browser-automation.mock';
const runner=fileURLToPath(new URL('../common/local-runner.mjs',import.meta.url));
const xml=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
export function makePlist({node,script=runner,dir,minute=5}) {
  for(const p of [node,script,dir]) if(typeof p!=='string'||!path.isAbsolute(p)||/[\x00-\x1f]/.test(p)) throw Error('Absolute safe path required');
  if(!Number.isInteger(minute)||minute<0||minute>59)throw Error('Invalid minute');
  const args=[node,script,'tick-mock',dir].map(p=>`<string>${xml(p)}</string>`).join('');
  const logfile=xml(path.join(dir,'launchd-mock.log'));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0"><dict>\n<key>Label</key><string>${LABEL}</string>\n<key>ProgramArguments</key><array>${args}</array>\n<key>StartCalendarInterval</key><dict><key>Minute</key><integer>${minute}</integer></dict>\n<key>RunAtLoad</key><false/>\n<key>StandardOutPath</key><string>${logfile}</string>\n<key>StandardErrorPath</key><string>${logfile}</string>\n</dict></plist>\n`;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const [dir,minute='5',...extra]=process.argv.slice(2);
  try{if(extra.length||!/^\d{1,2}$/.test(minute))throw Error('Invalid arguments');process.stdout.write(makePlist({node:process.execPath,dir,minute:Number(minute)}));}catch(e){console.error(e.message);process.exitCode=2;}
}
