const API='https://api.airtable.com/v0';
const BATCH=10;

function env(name){const value=process.env[name];if(!value)throw new Error(`Configuration serveur manquante: ${name}`);return value}
function config(){return {
 token:env('AIRTABLE_TOKEN'),baseId:env('AIRTABLE_BASE_ID'),
 users:env('AIRTABLE_USERS_TABLE_ID'),roles:env('AIRTABLE_ROLES_TABLE_ID'),audit:env('AIRTABLE_AUDIT_TABLE_ID'),settings:env('AIRTABLE_SETTINGS_TABLE_ID'),state:env('AIRTABLE_STATE_TABLE_ID')
}}
function tableUrl(tableId){const c=config();return `${API}/${c.baseId}/${tableId}`}
async function request(tableId,{method='GET',params={},body}={}){
 const c=config();const url=new URL(tableUrl(tableId));for(const [k,v] of Object.entries(params)){if(v!==undefined&&v!==null&&v!=='')url.searchParams.set(k,String(v))}
 const r=await fetch(url,{method,headers:{Authorization:`Bearer ${c.token}`,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
 const text=await r.text();let data={};try{data=text?JSON.parse(text):{}}catch{data={raw:text}}
 if(!r.ok){const msg=data?.error?.message||data?.error?.type||data?.message||`${r.status} ${r.statusText}`;const e=new Error(`Airtable: ${msg}`);e.status=r.status;throw e}
 return data
}
function formulaEscape(value){return String(value).replace(/\\/g,'\\\\').replace(/'/g,"\\'")}
function eqFormula(field,value){return `{${field}}='${formulaEscape(value)}'`}
async function listAll(tableId,{filterByFormula,sort,maxRecords}={}){
 const out=[];let offset='';do{const params={pageSize:100};if(filterByFormula)params.filterByFormula=filterByFormula;if(offset)params.offset=offset;if(sort)params['sort[0][field]']=sort.field,params['sort[0][direction]']=sort.direction||'asc';const data=await request(tableId,{params});out.push(...(data.records||[]));offset=data.offset||'';if(maxRecords&&out.length>=maxRecords)break}while(offset);return maxRecords?out.slice(0,maxRecords):out
}
async function findOne(tableId,field,value){const rows=await listAll(tableId,{filterByFormula:eqFormula(field,value),maxRecords:1});return rows[0]||null}
async function createRecords(tableId,records){const all=[];for(let i=0;i<records.length;i+=BATCH){const data=await request(tableId,{method:'POST',body:{records:records.slice(i,i+BATCH).map(fields=>({fields}))}});all.push(...(data.records||[]))}return all}
async function updateRecord(tableId,id,fields){return request(tableId,{method:'PATCH',body:{records:[{id,fields}]}})}
async function deleteRecords(tableId,ids){for(let i=0;i<ids.length;i+=BATCH){const url=new URL(tableUrl(tableId));for(const id of ids.slice(i,i+BATCH))url.searchParams.append('records[]',id);const c=config();const r=await fetch(url,{method:'DELETE',headers:{Authorization:`Bearer ${c.token}`}});if(!r.ok)throw new Error(`Airtable suppression: ${r.status}`)}}
async function getSetting(key){const c=config(),row=await findOne(c.settings,'Key',key);if(!row)return null;return {recordId:row.id,key:row.fields?.Key||key,value:row.fields?.['Value JSON']??''}}
async function upsertSetting(key,value){const c=config(),existing=await findOne(c.settings,'Key',key),fields={Key:key,'Value JSON':String(value)};if(existing){await updateRecord(c.settings,existing.id,fields);return existing.id}const created=await createRecords(c.settings,[fields]);return created[0]?.id||''}
module.exports={config,request,listAll,findOne,createRecords,updateRecord,deleteRecords,getSetting,upsertSetting,eqFormula};
