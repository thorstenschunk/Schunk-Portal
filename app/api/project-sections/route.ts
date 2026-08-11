import { NextRequest,NextResponse } from 'next/server';
import { audit,errorResponse,requireUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { requireSiteMembership } from '@/lib/entity-access';
export const dynamic='force-dynamic';
export async function GET(req:NextRequest){try{const u=await requireUser(req,'sites.read');const site=req.nextUrl.searchParams.get('site_id');if(!site)return NextResponse.json({error:'Baustelle fehlt.'},{status:400});await requireSiteMembership(u,site);const {data,error}=await supabaseAdmin().from('project_sections').select('*').eq('construction_site_id',site).eq('archived',false).order('sort_order').order('name');if(error)throw error;return NextResponse.json(data||[])}catch(e){return errorResponse(e)}}
export async function POST(req:NextRequest){try{const u=await requireUser(req,'sites.manage');const b=await req.json();if(!b.site_id||!String(b.name||'').trim())return NextResponse.json({error:'Baustelle und Bezeichnung erforderlich.'},{status:400});const db=supabaseAdmin();const {data,error}=await db.from('project_sections').insert({construction_site_id:b.site_id,name:String(b.name).trim(),sort_order:Number(b.sort_order||0),created_by:u.id}).select().single();if(error)throw error;await audit(u.id,'create','project_section',data.id,{site:b.site_id});return NextResponse.json(data)}catch(e){return errorResponse(e)}}
export async function PATCH(req:NextRequest){try{const u=await requireUser(req,'sites.manage');const b=await req.json();const values:any={updated_at:new Date().toISOString()};for(const k of ['name','sort_order','archived'])if(k in b)values[k]=b[k];const {data,error}=await supabaseAdmin().from('project_sections').update(values).eq('id',b.id).select().single();if(error)throw error;await audit(u.id,'update','project_section',b.id,values);return NextResponse.json(data)}catch(e){return errorResponse(e)}}

export async function DELETE(req:NextRequest){try{
  const u=await requireUser(req,'sites.manage');
  const id=req.nextUrl.searchParams.get('id');
  if(!id)return NextResponse.json({error:'ID fehlt.'},{status:400});
  const db=supabaseAdmin();
  const {data:section,error:se}=await db.from('project_sections').select('*').eq('id',id).single();
  if(se||!section)throw se||new Error('Unterkategorie nicht gefunden.');
  const [r,t,m,f,i,pt]=await Promise.all([
    db.from('work_reports').select('id',{count:'exact',head:true}).eq('section_id',id),
    db.from('time_entries').select('id',{count:'exact',head:true}).eq('section_id',id),
    db.from('work_report_materials').select('id',{count:'exact',head:true}).eq('section_id',id),
    db.from('files').select('id',{count:'exact',head:true}).eq('section_id',id),
    db.from('project_items').select('id',{count:'exact',head:true}).eq('section_id',id),
    db.from('project_tasks').select('id',{count:'exact',head:true}).eq('section_id',id)
  ]);
  for(const x of [r,t,m,f,i,pt])if(x.error)throw x.error;
  const used=[r,t,m,f,i,pt].some((x:any)=>(x.count||0)>0);
  if(used){
    const {error}=await db.from('project_sections').update({archived:true,updated_at:new Date().toISOString()}).eq('id',id);
    if(error)throw error;
    await audit(u.id,'archive','project_section',id,{reason:'Unterkategorie enthält bereits Fachdaten.'});
    return NextResponse.json({ok:true,action:'archived'});
  }
  const {error}=await db.from('project_sections').delete().eq('id',id);
  if(error)throw error;
  await audit(u.id,'delete','project_section',id);
  return NextResponse.json({ok:true,action:'deleted'});
}catch(e){return errorResponse(e)}}
