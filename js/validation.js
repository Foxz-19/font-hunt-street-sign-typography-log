/** @typedef {'Serif'|'Sans-Serif'|'Script'|'Display'|'Monospace'|'Hand-Painted'|'Other'} StyleTag */
/**
 * @typedef {Object} FontEntry
 * @property {string} id
 * @property {string} nickname
 * @property {string} location
 * @property {StyleTag} styleTag
 * @property {string} moodNote
 * @property {string} dateSpotted
 * @property {number} createdAt
 */
export const STYLE_TAGS=Object.freeze(['Serif','Sans-Serif','Script','Display','Monospace','Hand-Painted','Other']);
export function isValidStyleTag(t){return typeof t==='string'&&STYLE_TAGS.includes(t)}
export function isValidIsoDate(d){
  if(typeof d!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(d))return false;
  const[y,m,day]=d.split('-').map(Number),dt=new Date(y,m-1,day);
  return dt.getFullYear()===y&&dt.getMonth()===m-1&&dt.getDate()===day;
}
export function sanitizeString(v){return typeof v==='string'?v.trim().replace(/\s+/g,' '):''}
export function validateFontEntry(r,idO){
  const e={};
  if(!r||typeof r!=='object')return{isValid:false,errors:{form:'Must be object'},sanitized:null};
  const nk=sanitizeString(r.nickname);
  if(!nk)e.nickname='Nickname is required.';else if(nk.length<2||nk.length>80)e.nickname='Must be 2-80 chars.';
  const lc=sanitizeString(r.location);
  if(!lc)e.location='Location is required.';else if(lc.length<3||lc.length>120)e.location='Must be 3-120 chars.';
  const tg=typeof r.styleTag==='string'?r.styleTag.trim():'';
  if(!isValidStyleTag(tg))e.styleTag=`Must be: ${STYLE_TAGS.join(', ')}.`;
  const md=sanitizeString(r.moodNote);
  if(!md)e.moodNote='Mood is required.';else if(md.length>100)e.moodNote='Max 100 chars.';
  const dt=typeof r.dateSpotted==='string'?r.dateSpotted.trim():'';
  if(!dt||!isValidIsoDate(dt))e.dateSpotted='Valid YYYY-MM-DD date required.';
  if(Object.keys(e).length>0)return{isValid:false,errors:e,sanitized:null};
  return{isValid:true,errors:{},sanitized:{
    id:idO||(typeof r.id==='string'&&r.id.trim())||`entry_${Date.now()}_${Math.random().toString(36).slice(2,7)}`,
    nickname:nk,location:lc,styleTag:tg,moodNote:md,dateSpotted:dt,
    createdAt:typeof r.createdAt==='number'&&!isNaN(r.createdAt)?r.createdAt:Date.now()
  }};
}
export function validateDatasetId(v){if(typeof v!=='string'||!v.trim())throw new Error('Invalid ID');return v.trim()}
export function validateDatasetTag(v){if(typeof v!=='string')throw new Error('Invalid tag');const c=v.trim();if(c==='All'||isValidStyleTag(c))return c;throw new Error('Bad tag')}
