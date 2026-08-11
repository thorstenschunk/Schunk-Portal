import { NextRequest,NextResponse } from 'next/server';
import { errorResponse,requireUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { requireSiteMembership } from '@/lib/entity-access';
export const dynamic='force-dynamic';

export async function GET(req:NextRequest){
  try{
    const u=await requireUser(req,'sites.read');
    const site=req.nextUrl.searchParams.get('site_id');
    const raw=req.nextUrl.searchParams.get('section_id');
    if(!site)return NextResponse.json({error:'Baustelle fehlt.'},{status:400});
    await requireSiteMembership(u,site);
    const sectionId=raw&&raw!=='general'?raw:null;
    const db=supabaseAdmin();
    const apply=(q:any)=>sectionId?q.eq('section_id',sectionId):q.is('section_id',null);
    const [reportsR,timesR,materialsR,filesR]=await Promise.all([
      apply(db.from('work_reports').select('id,report_no,work_date,work_description,locked_at').eq('construction_site_id',site)).order('work_date',{ascending:false}).limit(30),
      apply(db.from('time_entries').select('id,work_date,total_minutes,activity,profiles(full_name)').eq('construction_site_id',site)).order('work_date',{ascending:false}).limit(100),
      apply(db.from('work_report_materials').select('id,quantity,unit,description,work_reports!inner(construction_site_id,report_no,work_date)').eq('work_reports.construction_site_id',site)).limit(100),
      apply(db.from('files').select('id,title,file_name,category,mime_type,created_at,visibility').eq('entity_type','site').eq('entity_id',site).eq('upload_status','ready')).order('created_at',{ascending:false}).limit(60)
    ]);
    if(reportsR.error)throw reportsR.error;if(timesR.error)throw timesR.error;if(materialsR.error)throw materialsR.error;if(filesR.error)throw filesR.error;
    return NextResponse.json({reports:reportsR.data||[],times:timesR.data||[],materials:materialsR.data||[],files:filesR.data||[]});
  }catch(e){return errorResponse(e)}
}
