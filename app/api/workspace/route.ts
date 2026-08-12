import { NextRequest,NextResponse } from 'next/server';
import { ApiError,errorResponse,requireUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic='force-dynamic';

async function siteScope(u:any){
  const db=supabaseAdmin();
  if(u.roles.some((r:string)=>['admin','office','foreman'].includes(r)))return null;
  const {data,error}=await db.from('construction_members').select('construction_site_id').eq('user_id',u.id);
  if(error)throw error;
  return (data||[]).map((x:any)=>x.construction_site_id);
}
function scoped(q:any,ids:string[]|null,column='construction_site_id'){
  if(ids===null)return q;
  if(!ids.length)return null;
  return q.in(column,ids);
}

export async function GET(req:NextRequest){
  try{
    const u=await requireUser(req,'sites.read');
    const type=req.nextUrl.searchParams.get('type')||'messages';
    const db=supabaseAdmin();
    const ids=await siteScope(u);

    if(type==='messages'||type==='issues'){
      let q=db.from('project_items').select('*,construction_sites(id,project_no,title,city),section:project_sections(id,name),assignee:profiles!project_items_assigned_to_fkey(id,full_name),author:profiles!project_items_created_by_fkey(id,full_name)').order('created_at',{ascending:false});
      q=q.in('item_type',type==='messages'?['message']:['defect','problem']);
      const sq=scoped(q,ids);if(!sq)return NextResponse.json([]);
      const {data,error}=await sq;if(error)throw error;return NextResponse.json(data||[]);
    }

    if(type==='tasks'){
      let q1=db.from('project_items').select('*,construction_sites(id,project_no,title),section:project_sections(id,name),assignee:profiles!project_items_assigned_to_fkey(id,full_name)').eq('item_type','todo').order('created_at',{ascending:false});
      let q2=db.from('project_tasks').select('*,construction_sites(id,project_no,title),section:project_sections(id,name),assignee:profiles!project_tasks_assigned_to_fkey(id,full_name)').order('created_at',{ascending:false});
      const s1=scoped(q1,ids),s2=scoped(q2,ids);
      const [a,b]=await Promise.all([s1?s1:Promise.resolve({data:[],error:null}),s2?s2:Promise.resolve({data:[],error:null})]);
      if(a.error)throw a.error;if(b.error)throw b.error;
      return NextResponse.json([...(a.data||[]).map((x:any)=>({...x,source:'project_item'})),...(b.data||[]).map((x:any)=>({...x,source:'project_task'}))].sort((x:any,y:any)=>String(y.created_at).localeCompare(String(x.created_at))));
    }

    if(type==='sections'){
      let q=db.from('project_sections').select('*,construction_sites(id,project_no,title,city)').eq('archived',false).order('construction_site_id').order('sort_order').order('name');
      const sq=scoped(q,ids);if(!sq)return NextResponse.json([]);
      const {data,error}=await sq;if(error)throw error;return NextResponse.json(data||[]);
    }

    if(type==='documents'){
      // Kein FK auf entity_id vorhanden: Fallback ohne Relation, Baustellen werden separat ergänzt.
      const {data:files,error}=await db.from('files').select('*').eq('entity_type','site').eq('upload_status','ready').order('created_at',{ascending:false});
      if(error)throw error;
      let rows=files||[];
      if(ids!==null)rows=rows.filter((f:any)=>ids.includes(f.entity_id));
      if(!u.roles.includes('admin')){
        const office=u.roles.some((r:string)=>['office','foreman'].includes(r));
        rows=rows.filter((f:any)=>f.visibility==='site_members'||(f.visibility==='office'&&office)||(f.visibility==='selected'&&Array.isArray(f.visible_to)&&f.visible_to.includes(u.id)));
      }
      const siteIds=[...new Set(rows.map((x:any)=>x.entity_id))];
      const {data:sites,error:se}=siteIds.length?await db.from('construction_sites').select('id,project_no,title').in('id',siteIds):{data:[],error:null} as any;
      if(se)throw se;const sm=new Map((sites||[]).map((s:any)=>[s.id,s]));
      return NextResponse.json(rows.map((f:any)=>({...f,construction_sites:sm.get(f.entity_id)||null})));
    }

    if(type==='materials'){
      let q=db.from('work_report_materials').select('id,quantity,unit,description,section_id,work_reports!inner(id,report_no,work_date,construction_site_id,construction_sites(id,project_no,title)),section:project_sections(id,name)').order('id',{ascending:false}).limit(500);
      if(ids!==null){if(!ids.length)return NextResponse.json([]);q=q.in('work_reports.construction_site_id',ids)}
      const {data,error}=await q;if(error)throw error;return NextResponse.json(data||[]);
    }

    if(type==='stats'){
      const result:any={};const requested=req.nextUrl.searchParams.get('user_id')||'';const target=requested&&requested!=='all'?requested:null;
      if(target&&!u.roles.includes('admin')&&!u.permissions.includes('time.all'))throw new ApiError(403,'Keine Berechtigung für Mitarbeiterauswertung.');
      let iq=db.from('project_items').select('id,item_type,status,priority,construction_site_id,assigned_to,created_by');
      const si=scoped(iq,ids);const {data:allItems,error:ie}=si?await si:{data:[],error:null} as any;if(ie)throw ie;
      const items=target?(allItems||[]).filter((x:any)=>x.assigned_to===target||x.created_by===target):(allItems||[]);
      result.defects=items.filter((x:any)=>x.item_type==='defect').length;result.openDefects=items.filter((x:any)=>x.item_type==='defect'&&!['Erledigt','Geklärt'].includes(x.status)).length;
      result.problems=items.filter((x:any)=>x.item_type==='problem').length;result.openProblems=items.filter((x:any)=>x.item_type==='problem'&&!['Erledigt','Geklärt'].includes(x.status)).length;
      result.todos=items.filter((x:any)=>x.item_type==='todo').length;result.openTodos=items.filter((x:any)=>x.item_type==='todo'&&!['Erledigt','Geklärt'].includes(x.status)).length;
      result.projectMessages=items.filter((x:any)=>x.item_type==='message').length;result.urgent=items.filter((x:any)=>x.priority==='Dringend'&&!['Erledigt','Geklärt'].includes(x.status)).length;
      let reports:any[]=[];
      if(target){const {data:members,error:me}=await db.from('work_report_members').select('report_id').eq('user_id',target);if(me)throw me;const rids=[...new Set((members||[]).map((x:any)=>x.report_id))];if(rids.length){let rq=db.from('work_reports').select('id,locked_at,construction_site_id').in('id',rids);const sr=scoped(rq,ids);const rr=sr?await sr:{data:[],error:null} as any;if(rr.error)throw rr.error;reports=rr.data||[]}}
      else{let rq=db.from('work_reports').select('id,locked_at,construction_site_id');const sr=scoped(rq,ids);const rr=sr?await sr:{data:[],error:null} as any;if(rr.error)throw rr.error;reports=rr.data||[]}
      result.reports=reports.length;result.openReports=reports.filter((x:any)=>!x.locked_at).length;
      let tq=db.from('time_entries').select('total_minutes,construction_site_id,user_id');if(target)tq=tq.eq('user_id',target);const st=scoped(tq,ids);const {data:times,error:te}=st?await st:{data:[],error:null} as any;if(te)throw te;result.minutes=(times||[]).reduce((a:number,x:any)=>a+Number(x.total_minutes||0),0);
      let taskQ=db.from('project_tasks').select('id,status,assigned_to,construction_site_id');if(target)taskQ=taskQ.eq('assigned_to',target);const sq=scoped(taskQ,ids);const {data:tasks,error:tke}=sq?await sq:{data:[],error:null} as any;if(tke)throw tke;result.tasks=(tasks||[]).length;result.openTasks=(tasks||[]).filter((x:any)=>x.status!=='Erledigt').length;
      if(target){const {data:im,error:ime}=await db.from('internal_messages').select('id,status').or(`sender_id.eq.${target},recipient_id.eq.${target}`);if(ime)throw ime;result.messages=(im||[]).length;result.openMessages=(im||[]).filter((x:any)=>x.status!=='Geklärt').length}else{let imq=db.from('internal_messages').select('id,status');if(!u.roles.includes('admin'))imq=imq.or(`sender_id.eq.${u.id},recipient_id.eq.${u.id}`);const {data:im,error:ime}=await imq;if(ime)throw ime;result.messages=(im||[]).length;result.openMessages=(im||[]).filter((x:any)=>x.status!=='Geklärt').length}
      return NextResponse.json(result);
    }

    throw new ApiError(400,'Unbekannter Arbeitsbereich.');
  }catch(e){return errorResponse(e)}
}
