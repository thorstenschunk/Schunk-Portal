import { NextRequest, NextResponse } from 'next/server';
import { errorResponse, requireUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-server';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){
  try{
    const user=await requireUser(req,'dashboard.read'); const db=supabaseAdmin();
    const isWide=user.roles.some(r=>['admin','office','foreman'].includes(r));
    let siteIds:string[]=[];
    if(!isWide){const {data:members,error:me}=await db.from('construction_members').select('construction_site_id').eq('user_id',user.id);if(me)throw me;siteIds=(members||[]).map((m:any)=>m.construction_site_id)}
    let sites:any[]=[];let siteCount=0;
    if(isWide){const {data,count,error}=await db.from('construction_sites').select('id,title,project_no,status,city,priority',{count:'exact'}).eq('archived',false).eq('status','Aktiv').order('updated_at',{ascending:false}).limit(6);if(error)throw error;sites=data||[];siteCount=count||0}
    else if(siteIds.length){const {data,count,error}=await db.from('construction_sites').select('id,title,project_no,status,city,priority',{count:'exact'}).eq('archived',false).eq('status','Aktiv').in('id',siteIds).order('updated_at',{ascending:false}).limit(6);if(error)throw error;sites=data||[];siteCount=count||0}
    const today=new Date().toISOString().slice(0,10);let timesQ=db.from('time_entries').select('total_minutes').eq('work_date',today);if(!isWide)timesQ=timesQ.eq('user_id',user.id);const {data:times,error:te}=await timesQ;if(te)throw te;
    let openReports=0;
    if(isWide){const {count,error}=await db.from('work_reports').select('id',{count:'exact',head:true}).is('locked_at',null);if(error)throw error;openReports=count||0}
    else{const {data:mr,error:mrErr}=await db.from('work_report_members').select('report_id').eq('user_id',user.id);if(mrErr)throw mrErr;const ids=Array.from(new Set((mr||[]).map((x:any)=>x.report_id)));if(ids.length){const {count,error}=await db.from('work_reports').select('id',{count:'exact',head:true}).is('locked_at',null).in('id',ids);if(error)throw error;openReports=count||0}}
    let taskQ=db.from('project_tasks').select('id',{count:'exact',head:true}).neq('status','Erledigt');if(!isWide)taskQ=taskQ.eq('assigned_to',user.id);const {count:openTasks,error:taskErr}=await taskQ;if(taskErr)throw taskErr;
    let itemQuery=db.from('project_items').select('id,item_type,title,priority,status,construction_site_id,created_at,construction_sites(title,project_no)').in('item_type',['defect','problem']).neq('status','Erledigt').neq('status','Geklärt').order('created_at',{ascending:false}).limit(12);if(!isWide&&siteIds.length)itemQuery=itemQuery.in('construction_site_id',siteIds);const {data:items,error:itemErr}=await itemQuery;if(itemErr)throw itemErr;const urgent=(items||[]).filter((x:any)=>x.priority==='Dringend');let msgQ=db.from('internal_messages').select('id,subject,body,status,sender_id,recipient_id,created_at').neq('status','Geklärt').order('created_at',{ascending:false}).limit(12);if(!user.roles.includes('admin'))msgQ=msgQ.or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`);const {data:messages,error:msgErr}=await msgQ;if(msgErr)throw msgErr;return NextResponse.json({sites,urgent,messages:messages||[],stats:{sites:siteCount,todayMinutes:(times||[]).reduce((s:any,x:any)=>s+(x.total_minutes||0),0),openReports,openTasks:openTasks||0,urgent:urgent.length,messages:(messages||[]).length}});
  }catch(e){return errorResponse(e)}
}
