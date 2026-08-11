import { NextRequest,NextResponse } from 'next/server';
import { errorResponse,requireUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { requireSiteMembership } from '@/lib/entity-access';
export const dynamic='force-dynamic';

export async function GET(req:NextRequest){
  try{
    const u=await requireUser(req,'sites.read');
    const site=req.nextUrl.searchParams.get('site_id');
    if(!site)return NextResponse.json({error:'Baustelle fehlt.'},{status:400});
    await requireSiteMembership(u,site);
    const db=supabaseAdmin();
    const [
      {data:sections,error:se},
      {data:reports,error:re},
      {data:times,error:te},
      {data:materials,error:me},
      {data:files,error:fe},
      {data:items,error:ie}
    ]=await Promise.all([
      db.from('project_sections').select('id,name,sort_order').eq('construction_site_id',site).eq('archived',false).order('sort_order').order('name'),
      db.from('work_reports').select('id,section_id,locked_at').eq('construction_site_id',site),
      db.from('time_entries').select('section_id,total_minutes').eq('construction_site_id',site),
      db.from('work_report_materials').select('id,section_id,work_reports!inner(construction_site_id)').eq('work_reports.construction_site_id',site),
      db.from('files').select('id,section_id').eq('entity_type','site').eq('entity_id',site).eq('upload_status','ready'),
      db.from('project_items').select('id,section_id,item_type,status').eq('construction_site_id',site)
    ]);
    if(se)throw se;if(re)throw re;if(te)throw te;if(me)throw me;if(fe)throw fe;if(ie)throw ie;
    const all=[{id:null,name:'Allgemein',sort_order:-1},...(sections||[])];
    return NextResponse.json(all.map((s:any)=>{
      const same=(v:any)=> (v??null)===(s.id??null);
      return {
        id:s.id,name:s.name,
        reports:(reports||[]).filter((x:any)=>same(x.section_id)).length,
        minutes:(times||[]).filter((x:any)=>same(x.section_id)).reduce((a:number,x:any)=>a+Number(x.total_minutes||0),0),
        materials:(materials||[]).filter((x:any)=>same(x.section_id)).length,
        files:(files||[]).filter((x:any)=>same(x.section_id)).length,
        defects:(items||[]).filter((x:any)=>same(x.section_id)&&x.item_type==='defect'&&!['Erledigt','Geklärt'].includes(x.status)).length,
        problems:(items||[]).filter((x:any)=>same(x.section_id)&&x.item_type==='problem'&&!['Erledigt','Geklärt'].includes(x.status)).length,
        todos:(items||[]).filter((x:any)=>same(x.section_id)&&x.item_type==='todo'&&!['Erledigt','Geklärt'].includes(x.status)).length,
        messages:(items||[]).filter((x:any)=>same(x.section_id)&&x.item_type==='message'&&!['Erledigt','Geklärt'].includes(x.status)).length
      };
    }));
  }catch(e){return errorResponse(e)}
}
