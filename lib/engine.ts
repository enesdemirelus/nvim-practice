/** A bounded Neovim training model. Custom maps are sourced from the attached config. */
export type Mode = 'normal' | 'insert' | 'visual' | 'visual-line' | 'command';
export type Pos = { row: number; col: number };
export type Panel = 'files' | 'grep' | 'buffers' | 'help' | 'hover' | 'references' | 'rename' | 'actions' | 'workspace' | 'document' | 'completion' | null;
export type Snapshot = { files: Record<string,string>; file: string; cursor: Pos };
export type EditorState = Snapshot & {
  mode: Mode; pending: string; lastKeyAt: number; anchor: Pos | null; history: Snapshot[]; future: Snapshot[];
  panel: Panel; query: string; selected: number; tree: boolean; treeFocus: boolean; hidden: boolean; clean: boolean;
  command: string; message: string; keys: number; log: string[]; events: string[]; saved: boolean; insertStart: Snapshot | null;
};
export const project: Record<string,string> = {
  'src/app.ts': 'import { greet } from "./greet";\n\nconst name = "Ada";\nconst message = greet(name);\nconsole.log(message);',
  'src/greet.ts': 'export function greet(name: string) {\n    return `Hello, ${name}`;\n}',
  'scripts/report.py': 'def summarize(items):\n    total = len(items)\n    return total\n\nprint(summarize([1, 2, 3]))',
  'lua/settings.lua': 'local settings = {}\nsettings.theme = "frappe"\nsettings.tabstop = 4\nreturn settings',
  '.env.example': 'APP_NAME=practice',
};
export const customMaps: Record<string, { label: string; source: string; context: string }> = {
  '\\e': {label:'Toggle explorer',source:'config/keymaps.lua',context:'Normal'},
  '\\o': {label:'Focus explorer',source:'config/keymaps.lua',context:'Normal'},
  H: {label:'Previous buffer',source:'config/keymaps.lua',context:'Normal · editing buffer'},
  L: {label:'Next buffer',source:'config/keymaps.lua',context:'Normal · editing buffer'},
  '\\bd': {label:'Close buffer',source:'config/keymaps.lua',context:'Normal'},
  '\\ff': {label:'Find files',source:'config/keymaps.lua',context:'Normal'},
  '\\fg': {label:'Live grep',source:'config/keymaps.lua',context:'Normal'},
  '\\fb': {label:'Find open buffers',source:'config/keymaps.lua',context:'Normal'},
  '\\fh': {label:'Find help tags',source:'config/keymaps.lua',context:'Normal'},
  K: {label:'Hover documentation',source:'config/lsp.lua · LspAttach',context:'Normal · attached LSP'},
  gd: {label:'Go to definition',source:'config/lsp.lua · LspAttach',context:'Normal · attached LSP'},
  gr: {label:'Find references',source:'config/lsp.lua · LspAttach',context:'Normal · attached LSP'},
  '\\rn': {label:'Rename symbol',source:'config/lsp.lua · LspAttach',context:'Normal · attached LSP'},
  '\\ca': {label:'Code actions',source:'config/lsp.lua · LspAttach',context:'Normal / Visual · attached LSP'},
  '\\xx': {label:'Toggle Trouble',source:'config/lsp.lua + confirmed working behavior',context:'Normal'},
  '\\xw': {label:'Workspace diagnostics',source:'config/lsp.lua + confirmed working behavior',context:'Normal'},
  '\\xd': {label:'Document diagnostics',source:'config/lsp.lua + confirmed working behavior',context:'Normal'},
  gcc: {label:'Toggle line comment',source:':map · Comment.nvim',context:'Normal'},
  gc: {label:'Comment selection / motion',source:':map · Comment.nvim',context:'Visual / Normal'},
  ys: {label:'Add surround with motion',source:':map · nvim-surround',context:'Normal'},
  cs: {label:'Change surrounding pair',source:':map · nvim-surround',context:'Normal'},
  ds: {label:'Delete surrounding pair',source:':map · nvim-surround',context:'Normal'},
  '<C-s>': {label:'Format + save',source:'config/keymaps.lua',context:'Normal / Insert / Visual'},
  '<D-s>': {label:'Format + save',source:'config/keymaps.lua',context:'Normal / Insert / Visual'},
  '<M-s>': {label:'Format + save',source:'config/keymaps.lua',context:'Normal / Insert / Visual'},
  '<Tab>': {label:'Accept completion, otherwise snippet/fallback',source:'config/lsp.lua · cmp.setup',context:'Insert'},
  '<C-Space>': {label:'Open completion',source:'config/lsp.lua · cmp.setup',context:'Insert'},
  ']d': {label:'Next diagnostic',source:':map · Neovim default',context:'Normal'},
  '[d': {label:'Previous diagnostic',source:':map · Neovim default',context:'Normal'},
};
export function createEditor(text = project['src/app.ts'], file = 'src/app.ts', cursor: Pos = {row:0,col:0}): EditorState {
 return { files:{...project,[file]:text},file,cursor:{...cursor},mode:'normal',pending:'',lastKeyAt:0,anchor:null,history:[],future:[],panel:null,query:'',selected:0,tree:false,treeFocus:false,hidden:false,clean:false,command:'',message:'Click here, then use your keyboard',keys:0,log:[],events:[],saved:false,insertStart:null };
}
export const lines = (s: EditorState) => s.files[s.file].split('\n');
export const snapshot = (s: EditorState): Snapshot => ({ files:{...s.files},file:s.file,cursor:{...s.cursor} });
function checkpoint(s:EditorState) { s.history.push(snapshot(s)); s.future=[]; s.saved=false; }
function clamp(s:EditorState) { const l=lines(s);s.cursor.row=Math.max(0,Math.min(l.length-1,s.cursor.row));s.cursor.col=Math.max(0,Math.min(s.cursor.col,Math.max(0,l[s.cursor.row].length-(s.mode==='insert'?0:1)))); }
function setLines(s:EditorState,l:string[]) {s.files[s.file]=(l.length?l:['']).join('\n');clamp(s);}
function offset(s:EditorState,p=s.cursor) {return lines(s).slice(0,p.row).reduce((n,l)=>n+l.length+1,0)+p.col;}
function position(s:EditorState,n:number):Pos {const t=s.files[s.file];n=Math.max(0,Math.min(n,t.length));const a=t.slice(0,n).split('\n');return {row:a.length-1,col:a.at(-1)!.length};}
function replace(s:EditorState,start:number,end:number,value:string) {const t=s.files[s.file];s.files[s.file]=t.slice(0,start)+value+t.slice(end);s.cursor=position(s,start+value.length);clamp(s);}
function beginInsert(s:EditorState,alreadySaved=false) { if(!alreadySaved) checkpoint(s);s.mode='insert';s.insertStart=snapshot(s); }
function record(s:EditorState,event:string) {s.events.push(event);s.message=event;}
export function visibleFiles(s:EditorState) { return Object.keys(s.files).filter(f=>(!s.hidden||!f.startsWith('.'))&&(!s.clean||f===s.file)); }
export function panelItems(s:EditorState):string[] {
 const q=s.query.toLowerCase();
 if(s.panel==='grep') return Object.entries(s.files).flatMap(([f,t])=>t.split('\n').flatMap((l,i)=>l.toLowerCase().includes(q)?[`${f}:${i+1}  ${l.trim()}`]:[]));
 if(s.panel==='help') return ['help: motion','help: text-objects','help: usr_03','help: telescope','help: nvim-tree'].filter(f=>f.includes(q));
 if(s.panel==='references') return ['src/app.ts:1  import { greet }','src/app.ts:4  greet(name)','src/greet.ts:1  function greet'];
 if(s.panel==='actions') return ['Remove unused declaration','Add missing import'];
 if(s.panel==='completion') return ['console','const','continue'];
 return Object.keys(s.files).filter(f=> {let n=0;for(const c of f.toLowerCase()) if(c===q[n]) n++;return n===q.length;});
}
function open(s:EditorState,p:Panel) {s.panel=p;s.query='';s.selected=0;record(s,`open:${p}`);}
function navigate(s:EditorState,file:string,row=0) {if(s.files[file]!==undefined){s.file=file;s.cursor={row,col:0};s.panel=null;s.treeFocus=false;clamp(s);record(s,`file:${file}`);}}
function motion(s:EditorState,m:string,count:number):Pos {
 let p={...s.cursor};const l=lines(s),t=s.files[s.file];let n=offset(s),classify=(c:string)=>/\w/.test(c)?1:/\s/.test(c)?0:2;
 switch(m){
 case 'h':p.col-=count;break;case 'l':p.col+=count;break;case 'j':p.row+=count;break;case 'k':p.row-=count;break;
 case '0':p.col=0;break;case '^':p.col=l[p.row].search(/\S/);break;case '$':p.col=l[p.row].length-1;break;
 case 'gg':p={row:count-1,col:0};break;case 'G':p={row:count===1?l.length-1:count-1,col:0};break;
 case 'w':case 'b':case 'e':
  for(let c=0;c<count;c++) {
   if(m==='w'){const kind=classify(t[n]||' ');while(n<t.length&&classify(t[n])===kind)n++;while(n<t.length&&/\s/.test(t[n]))n++;}
   if(m==='b'){n=Math.max(0,n-1);while(n>0&&/\s/.test(t[n]))n--;const kind=classify(t[n]||' ');while(n>0&&classify(t[n-1])===kind)n--;}
   if(m==='e'){n=Math.min(t.length-1,n+1);while(n<t.length-1&&/\s/.test(t[n]))n++;const kind=classify(t[n]||' ');while(n<t.length-1&&classify(t[n+1])===kind)n++;}
  } p=position(s,n);break;
 }
 p.row=Math.max(0,Math.min(l.length-1,p.row));p.col=Math.max(0,Math.min(Math.max(0,l[p.row].length-1),p.col));return p;
}
function objectRange(s:EditorState,obj:string):[number,number]|null {
 const t=s.files[s.file],n=offset(s),inner=obj[0]==='i',ch=obj[1];
 if(ch==='w'){let a=n,b=n;const kind=(c:string)=>/\w/.test(c)?1:/\s/.test(c)?0:2,k=kind(t[n]||' ');while(a>0&&kind(t[a-1])===k)a--;while(b<t.length&&kind(t[b])===k)b++;if(!inner){const e=b;while(b<t.length&&/[ \t]/.test(t[b]))b++;if(b===e)while(a>0&&/[ \t]/.test(t[a-1]))a--;}return[a,b];}
 const pairs:Record<string,[string,string]>={'"':['"','"'],"'": ["'","'"],'(':['(',')'],')':['(',')'],'[':['[',']'],']':['[',']'],'{':['{','}'],'}':['{','}']};
 const pair=pairs[ch];if(!pair)return null;let a=-1,b=-1;
 if(pair[0]===pair[1]){const start=t.lastIndexOf('\n',n-1)+1,end=t.indexOf('\n',n);const positions=[];for(let i=start;i<(end<0?t.length:end);i++)if(t[i]===pair[0]&&t[i-1]!=='\\')positions.push(i);for(let i=0;i<positions.length;i+=2)if(positions[i+1]!==undefined&&positions[i]<=n&&n<=positions[i+1]){a=positions[i];b=positions[i+1];break;}}
 else {let depth=0;for(let i=n;i>=0;i--){if(t[i]===pair[1]&&i!==n)depth++;if(t[i]===pair[0]){if(depth===0){a=i;break;}depth--;}}if(a>=0){depth=0;for(let i=a;i<t.length;i++){if(t[i]===pair[0])depth++;if(t[i]===pair[1]&&--depth===0){b=i;break;}}}}
 return a>=0&&b>a?[a+(inner?1:0),b+(inner?0:1)]:null;
}
function comment(s:EditorState,a:number,b:number){checkpoint(s);const l=lines(s),prefix=s.file.endsWith('.py')?'#':s.file.endsWith('.lua')?'--':'//';const all=l.slice(a,b+1).every(x=>!x.trim()||x.trimStart().startsWith(prefix));for(let i=a;i<=b;i++){if(!l[i].trim())continue;const indent=l[i].match(/^\s*/)![0];const body=l[i].trimStart();l[i]=indent+(all?body.slice(prefix.length).replace(/^ /,''):prefix+' '+body);}setLines(s,l);s.mode='normal';s.anchor=null;record(s,'comment');}
const pairFor=(k:string):[string,string]=>({')':['(',')'],']':['[',']'],'}':['{','}'],'(':['( ', ' )'],'[':['[ ',' ]'],'{':['{ ',' }']}[k] as [string,string]||[k,k]);
export function expirePending(s:EditorState,now:number):EditorState {if(s.pending&&now-s.lastKeyAt>=1000)return {...s,pending:'',message:'Sequence timed out after 1000 ms. Start again.'};return s;}
export function press(initial:EditorState,key:string,now=Date.now()):EditorState {
 let s:EditorState={...expirePending(initial,now),files:{...initial.files},cursor:{...initial.cursor},history:[...initial.history],future:[...initial.future],events:[...initial.events],log:[...initial.log,key].slice(-24),keys:initial.keys+1,lastKeyAt:now,message:''};
 if(['<C-s>','<D-s>','<M-s>'].includes(key)){const l=lines(s);s.files[s.file]=l.map(x=>x.trimEnd()).join('\n');s.saved=true;record(s,'format-save');s.message='Formatted + saved · mock formatter';return s;}
 if(key==='<Esc>'){if(s.panel){s.panel=null;s.query='';return s;}if(s.mode==='insert')s.cursor.col=Math.max(0,s.cursor.col-1);s.mode='normal';s.anchor=null;s.pending='';s.command='';s.insertStart=null;clamp(s);return s;}
 if(s.panel&&!['document','workspace','hover'].includes(s.panel)){
  if(key==='<C-n>'||key==='<Down>'){s.selected=Math.min(panelItems(s).length-1,s.selected+1);return s;}
  if(key==='<C-p>'||key==='<Up>'){s.selected=Math.max(0,s.selected-1);return s;}
  if(key==='<CR>'||(s.panel==='completion'&&key==='<Tab>')){
   if(s.panel==='rename'){const range=objectRange(s,'iw');if(range&&s.query){checkpoint(s);const old=s.files[s.file].slice(...range);const escaped=old.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');for(const f in s.files)s.files[f]=s.files[f].replace(new RegExp(`\\b${escaped}\\b`,'g'),()=>s.query);record(s,'rename');}s.panel=null;return s;}
   const selected=panelItems(s)[s.selected];if(!selected){s.message='No results';return s;}
   if(s.panel==='completion'){replace(s,offset(s),offset(s),selected);s.panel=null;record(s,'completion');return s;}
   if(s.panel==='actions'){checkpoint(s);const l=lines(s);l.splice(s.cursor.row,1);setLines(s,l);s.panel=null;record(s,'code-action');return s;}
   if(s.panel==='help'){s.message=selected+' — use motions to navigate text; Escape closes help.';s.panel='hover';return s;}
   const match=selected.match(/^([^:]+):(\d+)/);navigate(s,match?match[1]:selected,match?Number(match[2])-1:0);return s;
  }
  if(key==='<BS>')s.query=s.query.slice(0,-1);else if(key.length===1)s.query+=key;s.selected=0;return s;
 }
 if(s.mode==='insert'){
  if(key==='<C-Space>'){open(s,'completion');return s;}
  const l=lines(s),p=s.cursor,n=offset(s);
  if(key==='<BS>'){if(n>0){const t=s.files[s.file];const pairs:Record<string,string>={'(':')','[':']','{':'}','"':'"',"'":"'"};replace(s,n-1,n+(pairs[t[n-1]]===t[n]?1:0),'');}return s;}
  if(key==='<CR>'){const indent=l[p.row].match(/^\s*/)![0];replace(s,n,n,'\n'+indent);return s;}
  if(key==='<Tab>'){replace(s,n,n,' '.repeat(4-p.col%4));return s;}
  if(key.length===1){const pairs:Record<string,string>={'(':')','[':']','{':'}','"':'"',"'":"'"};if(')]}\"\''.includes(key)&&s.files[s.file][n]===key)s.cursor.col++;else if(pairs[key]){replace(s,n,n,key+pairs[key]);s.cursor.col--;}else replace(s,n,n,key);}
  return s;
 }
 if(s.mode==='command') {if(key==='<CR>'){if(s.command==='w'){s.saved=true;record(s,'write');s.message='Written · :w does not format';}else s.message=`:${s.command} is outside this course`;s.mode='normal';s.command='';}else if(key==='<BS>')s.command=s.command.slice(0,-1);else if(key.length===1)s.command+=key;return s;}
 // Buffer-local tree mappings take precedence over global H/L.
 if(s.treeFocus&&!s.pending&&key!=='\\') {const fs=visibleFiles(s);if(key==='H'){s.hidden=!s.hidden;record(s,'tree:hidden');}else if(key==='L'){s.clean=!s.clean;record(s,'tree:clean');}else if(key==='j')s.selected=Math.min(fs.length-1,s.selected+1);else if(key==='k')s.selected=Math.max(0,s.selected-1);else if(key==='<CR>'&&fs[s.selected])navigate(s,fs[s.selected]);else s.message='Explorer has focus. H hides dotfiles; L filters Git-clean files.';return s;}
 const seq=s.pending+key;const maps:Record<string,()=>void>={
  '\\e':()=>{s.tree=!s.tree;s.treeFocus=s.tree;s.selected=0;record(s,'tree:toggle');},'\\o':()=>{s.tree=true;s.treeFocus=true;s.selected=0;record(s,'tree:focus');},
  '\\ff':()=>open(s,'files'),'\\fg':()=>open(s,'grep'),'\\fb':()=>open(s,'buffers'),'\\fh':()=>open(s,'help'),
  '\\xx':()=>{s.panel=s.panel==='workspace'||s.panel==='document'?null:'workspace';record(s,'trouble:toggle');},'\\xw':()=>{s.panel=s.panel==='workspace'?null:'workspace';record(s,'trouble:workspace');},'\\xd':()=>{s.panel=s.panel==='document'?null:'document';record(s,'trouble:document');},
  '\\rn':()=>open(s,'rename'),'\\ca':()=>open(s,'actions'),K:()=>open(s,'hover'),gd:()=>{navigate(s,'src/greet.ts');record(s,'definition');},gr:()=>open(s,'references'),
  ']d':()=>{s.cursor.row=Math.min(lines(s).length-1,s.cursor.row+1);record(s,'diagnostic:next');},'[d':()=>{s.cursor.row=Math.max(0,s.cursor.row-1);record(s,'diagnostic:previous');},
  '\\bd':()=>{const fs=Object.keys(s.files);if(fs.length>1){delete s.files[s.file];navigate(s,fs.find(f=>f!==s.file)!);}record(s,'buffer:close');},
  H:()=>{const f=Object.keys(s.files);navigate(s,f[(f.indexOf(s.file)-1+f.length)%f.length]);record(s,'buffer:previous');},L:()=>{const f=Object.keys(s.files);navigate(s,f[(f.indexOf(s.file)+1)%f.length]);record(s,'buffer:next');},
 };
 if(maps[seq]&&(s.mode==='normal'||seq==='\\ca')){maps[seq]();s.pending='';return s;}
 if(Object.keys(maps).some(k=>k.startsWith(seq))){s.pending=seq;return s;}
 if(seq.startsWith('\\')){s.pending='';s.message='No course mapping for '+seq;return s;}
 if(s.mode.startsWith('visual')){
  if(seq==='gc'){comment(s,Math.min(s.anchor!.row,s.cursor.row),Math.max(s.anchor!.row,s.cursor.row));s.pending='';return s;}
  if(seq==='g'||seq==='i'||seq==='a'){s.pending=seq;return s;}
  if(/^[ia][w"'()[\]{}]$/.test(seq)){const r=objectRange(s,seq);if(r){s.anchor=position(s,r[0]);s.cursor=position(s,r[1]-1);}s.pending='';return s;}
  if(key==='d'||key==='c'){checkpoint(s);if(s.mode==='visual-line'){const l=lines(s);const start=Math.min(s.anchor!.row,s.cursor.row);l.splice(start,Math.abs(s.anchor!.row-s.cursor.row)+1,...(key==='c'?['']:[]));s.cursor={row:start,col:0};setLines(s,l);}else{const a=offset(s,s.anchor!);replace(s,Math.min(a,offset(s)),Math.max(a,offset(s))+1,'');}s.mode=key==='c'?'insert':'normal';s.anchor=null;s.pending='';return s;}
 }
 if(key==='u'&&!s.pending){const previous=s.history.pop();if(previous){s.future.push(snapshot(s));Object.assign(s,previous);s.files={...previous.files};s.cursor={...previous.cursor};}return s;}
 if(key==='<C-r>'){const next=s.future.pop();if(next){s.history.push(snapshot(s));Object.assign(s,next);s.files={...next.files};s.cursor={...next.cursor};}return s;}
 if(/^[1-9]\d*$/.test(seq)||(/^[dcy]\d+$/.test(seq))){s.pending=seq;return s;}
 const countMatch=seq.match(/^(\d*)(.*)$/)!;const count=Number(countMatch[1]||1),cmd=countMatch[2];
 if(['g','d','c','y','di','da','ci','ca','yi','ya','gc','ys','ysi','ysa','cs','ds'].includes(cmd)||/^cs.$/.test(cmd)||/^ys[ia][w"'()[\]{}]$/.test(cmd)){s.pending=seq;return s;}
 if(cmd==='gcc'){comment(s,s.cursor.row,Math.min(lines(s).length-1,s.cursor.row+count-1));s.pending='';return s;}
 if(/^gc[jk]$/.test(cmd)){comment(s,Math.max(0,s.cursor.row-(cmd[2]==='k'?count:0)),Math.min(lines(s).length-1,s.cursor.row+(cmd[2]==='j'?count:0)));s.pending='';return s;}
 if(/^ys[ia][w"'()[\]{}].$/.test(cmd)||/^cs..$/.test(cmd)||/^ds.$/.test(cmd)){
  const adding=cmd.startsWith('ys'),changing=cmd.startsWith('cs');const range=objectRange(s,adding?cmd.slice(2,4):'a'+cmd[2]);if(range){checkpoint(s);const t=s.files[s.file],content=t.slice(range[0]+(adding?0:1),range[1]-(adding?0:1));const pair=pairFor(cmd.at(-1)!);replace(s,range[0],range[1],adding||changing?pair[0]+content+pair[1]:content);s.cursor=position(s,range[0]);record(s,'surround');}s.pending='';return s;
 }
 const op=cmd.match(/^([dc])(\d*)([ia][w"'()[\]{}]|[dchwbejk$0^]|gg|G)$/);
 if(op){const operator=op[1],total=count*Number(op[2]||1),m=op[3];let range:[number,number]|null=null;checkpoint(s);
  if(m===operator||m==='j'||m==='k'){const l=lines(s);const start=m==='k'?Math.max(0,s.cursor.row-total):s.cursor.row;const amount=m===operator?total:total+1;l.splice(start,amount,...(operator==='c'?['']:[]));s.cursor={row:start,col:0};setLines(s,l);}
  else {if(/^[ia]/.test(m))range=objectRange(s,m);else {const start=offset(s),target=offset(s,motion(s,m,total));range=[Math.min(start,target),Math.max(start,target)+(['e','$'].includes(m)?1:0)];if(operator==='c'&&m==='w'){const r=objectRange(s,'iw');if(r)range=[start,r[1]];}}if(range){const a=range[0];replace(s,a,range[1],'');s.cursor=position(s,a);}}
  if(operator==='c'){s.mode='insert';s.insertStart=snapshot(s);}s.pending='';clamp(s);return s;
 }
 if(['h','j','k','l','w','b','e','0','^','$','gg','G'].includes(cmd)){s.cursor=motion(s,cmd,count);s.pending='';return s;}
 s.pending='';
 if(s.mode==='normal'){
  if(['i','a','I','A','o','O'].includes(cmd)){checkpoint(s);if(cmd==='a')s.cursor.col=Math.min(lines(s)[s.cursor.row].length,s.cursor.col+1);if(cmd==='I')s.cursor.col=Math.max(0,lines(s)[s.cursor.row].search(/\S/));if(cmd==='A')s.cursor.col=lines(s)[s.cursor.row].length;if(cmd==='o'||cmd==='O'){const l=lines(s),indent=l[s.cursor.row].match(/^\s*/)![0];const row=s.cursor.row+(cmd==='o'?1:0);l.splice(row,0,indent);s.mode='insert';s.cursor={row,col:indent.length};setLines(s,l);}beginInsert(s,true);return s;}
  if(cmd==='v'||cmd==='V'){s.mode=cmd==='v'?'visual':'visual-line';s.anchor={...s.cursor};return s;}
  if(cmd==='x'){checkpoint(s);const n=offset(s);replace(s,n,Math.min(n+count,n+lines(s)[s.cursor.row].length-s.cursor.col),'');s.cursor=position(s,n);clamp(s);return s;}
  if(cmd===':'){s.mode='command';s.command='';return s;}
 }
 s.message='Outside this lesson engine: '+seq;return s;
}
export function tokenize(sequence:string) {return sequence.match(/<[^>]+>|[\s\S]/g)||[];}
export function run(s:EditorState,sequence:string) {return tokenize(sequence).reduce((state,k,i)=>press(state,k,100+i*30),s);}
export function browserKey(e:{key:string;ctrlKey:boolean;metaKey:boolean;altKey:boolean;shiftKey:boolean}) {
 const special:Record<string,string>={Escape:'<Esc>',Enter:'<CR>',Backspace:'<BS>',Tab:e.shiftKey?'<S-Tab>':'<Tab>',ArrowDown:'<Down>',ArrowUp:'<Up>',ArrowLeft:'h',ArrowRight:'l'};
 if(e.ctrlKey)return e.key===' '?' <C-Space>'.trim():`<C-${e.key.toLowerCase()}>`;
 if(e.metaKey)return `<D-${e.key.toLowerCase()}>`;if(e.altKey)return `<M-${e.key.toLowerCase()}>`;return special[e.key]||e.key;
}
