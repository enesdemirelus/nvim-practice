export type SectionProgress={lecture:boolean;test:number;done:boolean;bestKeys?:number};
export type Progress={version:1;sections:Record<string,SectionProgress>;reviews:Record<string,boolean>;weak:Record<string,{misses:number;attempts:number}>;last:string;dark:boolean};
export const emptyProgress:Progress={version:1,sections:{},reviews:{},weak:{},last:'modes',dark:false};
export const storageKey='nvim-course-v1';
export function readProgress():Progress {try{const data=JSON.parse(localStorage.getItem(storageKey)||'null');if(data?.version!==1)return {...emptyProgress};return {...emptyProgress,...data,sections: data.sections&&typeof data.sections==='object'?data.sections:{},reviews:data.reviews||{},weak:data.weak||{}};}catch{return {...emptyProgress};}}
export function writeProgress(p:Progress):boolean{try{localStorage.setItem(storageKey,JSON.stringify(p));return true;}catch{return false;}}
export function sectionProgress(p:Progress,id:string):SectionProgress{return p.sections[id]||{lecture:false,test:0,done:false};}
