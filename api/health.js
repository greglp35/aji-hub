module.exports=async function handler(req,res){
 const required=['SESSION_SECRET','AIRTABLE_BASE_ID','AIRTABLE_USERS_TABLE_ID','AIRTABLE_ROLES_TABLE_ID','AIRTABLE_AUDIT_TABLE_ID','AIRTABLE_SETTINGS_TABLE_ID','AIRTABLE_STATE_TABLE_ID'];
 const missing=required.filter(k=>!process.env[k]);const tokenConfigured=Boolean(process.env.AIRTABLE_TOKEN);
 res.status(200).json({ok:true,service:'aji-collab-cloud',configured:missing.length===0&&tokenConfigured,missing,airtableTokenConfigured:tokenConfigured});
}
