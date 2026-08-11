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


    if(type==='stats'){
      const result:any={};
      let iq=db.from('project_items').select('id,item_type,status,priority,construction_site_id');
      const si=scoped(iq,ids);const {data:items,error:ie}=si?await si:{data:[],error:null} as any;if(ie)throw ie;
      result.openDefects=(items||[]).filter((x:any)=>x.item_type==='defect'&&!['Erledigt','Geklärt'].includes(x.status)).length;
      result.openProblems=(items||[]).filter((x:any)=>x.item_type==='problem'&&!['Erledigt','Geklärt'].includes(x.status)).length;
      result.openMessages=(items||[]).filter((x:any)=>x.item_type==='message'&&!['Erledigt','Geklärt'].includes(x.status)).length;
      result.urgent=(items||[]).filter((x:any)=>x.priority==='Dringend'&&!['Erledigt','Geklärt'].includes(x.status)).length;
      let rq=db.from('work_reports').select('id,locked_at,construction_site_id');const sr=scoped(rq,ids);const {data:reports,error:re}=sr?await sr:{data:[],error:null} as any;if(re)throw re;
      result.reports=(reports||[]).length;result.openReports=(reports||[]).filter((x:any)=>!x.locked_at).length;
      let tq=db.from('time_entries').select('total_minutes,construction_site_id');const st=scoped(tq,ids);const {data:times,error:te}=st?await st:{data:[],error:null} as any;if(te)throw te;
      result.minutes=(times||[]).reduce((a:number,x:any)=>a+Number(x.total_minutes||0),0);
      return NextResponse.json(result);
    }

    throw new ApiError(400,'Unbekannter Arbeitsbereich.');
  }catch(e){return errorResponse(e)}
}
