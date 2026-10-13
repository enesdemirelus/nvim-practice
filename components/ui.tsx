import {tokenize} from '@/lib/engine';
export function Icon({name,className=''}:{name:string;className?:string}){return <span className={`material-symbols-rounded ${className}`} aria-hidden="true">{name}</span>}
export function Keys({value}:{value:string}){return <span className="keys" aria-label={value}>{tokenize(value).map((k,i)=><kbd key={i}>{({'<Esc>':'esc','<CR>':'↵','<C-r>':'ctrl r','<C-s>':'ctrl s','<D-s>':'⌘ s','<M-s>':'alt s','<Tab>':'tab','<C-Space>':'ctrl space',' ':'space'} as Record<string,string>)[k]||k}</kbd>)}</span>}
export function ProgressBar({value,label}:{value:number;label:string}){return <div className="progress-track" role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}><span style={{width:`${value}%`}}/></div>}
