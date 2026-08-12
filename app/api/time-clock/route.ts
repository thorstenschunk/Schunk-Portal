import { NextRequest,NextResponse } from 'next/server';
import { ApiError,audit,errorResponse,requireUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { requireSiteMembership } from '@/lib/entity-access';

export const dynamic='force-dynamic';

function deParts(date=new Date()){
  const parts=new Intl.DateTimeFormat('de-DE',{timeZone:'Europe/Berlin',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(date);
  const get=(t:string)=>parts.find(p=>p.type===t)?.value||'';
  return {date:`${get('year')}-${get('month')}-${get('day')}`,time:`${get('hour')}:${get('minute')}`};
}
function localMinute(iso:string){
  const parts=new Intl.DateTimeFormat('de-DE',{timeZone:'Europe/Berlin',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(new Date(iso));
  const h=Number(parts.find(p=>p.type==='hour')?.value||0),m=Number(parts.find(p=>p.type==='minute')?.value||0);
  return h*60+m;
}
function overlap(a1:number,a2:number,b1:number,b2:number){return Math.max(0,Math.min(a2,b2)-Math.max(a1,b1))}
function minutes(a:string,b:string){return Math.max(0,Math.round((new Date(b).getTime()-new Date(a).getTime())/60000))}

async function currentState(userId:string){
  const db=supabaseAdmin();const today=deParts().date;
  const {data:day,error}=await db.from('time_clock_days').select('*').eq('user_id',userId).eq('work_date',today).maybeSingle();
  if(error)throw error;
  if(!day)return {day:null,current:null,segments:[]};
  const {data:segments,error:se}=await db.from('time_clock_segments').select('*,construction_sites(project_no,title),section:project_sections(id,name)').eq('clock_day_id',day.id).order('started_at');
  if(se)throw se;
  return {day,current:(segments||[]).find((x:any)=>!x.ended_at)||null,segments:segments||[]};
}

async function closeAndMaterialize(day:any,user:any){
  const db=supabaseAdmin();
  const {data:segments,error}=await db.from('time_clock_segments').select('*').eq('clock_day_id',day.id).not('ended_at','is',null).order('started_at');
  if(error)throw error;
  const segs=segments||[];
  if(!segs.length)return;

  // Exakte Systemzeiten werden auf volle Minuten abgebildet.
  const gross=segs.reduce((s:number,x:any)=>s+minutes(x.started_at,x.ended_at),0);
  const requiredBreak=gross>=330?45:(gross>0?15:0);
  let breakLeft=requiredBreak;
  const breaks=new Map<string,number>();

  // Feste Pausenblöcke werden vollständig dem Auftrag zugeordnet, der zu diesem Zeitpunkt läuft.
  const assignBlock=(minuteOfDay:number,amount:number)=>{
    const x=segs.find((z:any)=>localMinute(z.started_at)<=minuteOfDay&&localMinute(z.ended_at)>=minuteOfDay);
    if(x){breaks.set(x.id,(breaks.get(x.id)||0)+amount);breakLeft-=amount;return true}return false;
  };
  if(requiredBreak>=15)assignBlock(570,15);      // 09:30–09:45
  if(requiredBreak>=45)assignBlock(750,30);      // 12:30–13:00
  // Falls zu einem festen Pausenzeitpunkt kein Segment lief, wird der Rest in 15-Minuten-Blöcken der längsten Tätigkeit zugeordnet.
  if(breakLeft>0){
    const sorted=[...segs].sort((a:any,b:any)=>minutes(b.started_at,b.ended_at)-minutes(a.started_at,a.ended_at));
    for(const x of sorted){
      while(breakLeft>=15&&minutes(x.started_at,x.ended_at)-(breaks.get(x.id)||0)>=15){breaks.set(x.id,(breaks.get(x.id)||0)+15);breakLeft-=15}
      if(breakLeft<=0)break;
    }
  }

  // Stempeluhr ist führend: vorhandene Clock-Einträge dieses Tages neu materialisieren.
  await db.from('time_entries').delete().eq('user_id',user.id).eq('work_date',day.work_date).eq('source_kind','clock');
  const rows=segs.map((x:any)=>{
    const sp=deParts(new Date(x.started_at)),ep=deParts(new Date(x.ended_at));
    const pause=breaks.get(x.id)||0;
    const total=Math.max(0,minutes(x.started_at,x.ended_at)-pause);
    return {
      user_id:user.id,construction_site_id:x.construction_site_id||null,section_id:x.section_id||null,
      work_date:day.work_date,start_time:`${sp.time}:00`,end_time:`${ep.time}:00`,
      pause_minutes:pause,travel_setup_minutes:0,total_minutes:total,
      activity:x.activity||null,notes:'Automatisch über Stempeluhr erfasst',
      locked:true,submitted_at:new Date().toISOString(),created_by:user.id,
      source_kind:'clock',clock_segment_id:x.id
    };
  }).filter((x:any)=>x.total_minutes>=0&&x.start_time!==x.end_time);
  if(rows.length){
    const {error:ie}=await db.from('time_entries').insert(rows);
    if(ie){if((ie as any).code==='23P01')throw new ApiError(409,'Die gestempelte Arbeitszeit überschneidet sich mit einer vorhandenen Zeitbuchung. Bitte Admin prüfen lassen.');throw ie}
  }
}

export async function GET(req:NextRequest){try{
  const u=await requireUser(req,'time.own');
  return NextResponse.json(await currentState(u.id));
}catch(e){return errorResponse(e)}}

export async function POST(req:NextRequest){try{
  const u=await requireUser(req,'time.own');const b=await req.json();const db=supabaseAdmin();const now=new Date();const p=deParts(now);
  const state=await currentState(u.id);

  if(b.action==='start'){
    if(state.day?.status==='running')throw new ApiError(409,'Arbeitstag läuft bereits.');
    if(state.day?.status==='stopped')throw new ApiError(409,'Der Arbeitstag wurde bereits beendet. Eine nachträgliche Korrektur kann nur der Admin durchführen.');
    if(b.construction_site_id)await requireSiteMembership(u,b.construction_site_id);
    if(b.section_id&&b.construction_site_id){
      const {data:sec}=await db.from('project_sections').select('id').eq('id',b.section_id).eq('construction_site_id',b.construction_site_id).eq('archived',false).maybeSingle();
      if(!sec)throw new ApiError(400,'Unterkategorie gehört nicht zur Baustelle.');
    }
    const {data:day,error}=await db.from('time_clock_days').insert({user_id:u.id,work_date:p.date,started_at:now.toISOString(),status:'running'}).select().single();if(error)throw error;
    const {error:se}=await db.from('time_clock_segments').insert({clock_day_id:day.id,user_id:u.id,construction_site_id:b.construction_site_id||null,section_id:b.section_id||null,started_at:now.toISOString(),activity:b.activity||null});if(se)throw se;
    await audit(u.id,'clock_start','time_clock_day',day.id,{site:b.construction_site_id||null,section:b.section_id||null});
    return NextResponse.json(await currentState(u.id));
  }

  if(!state.day||state.day.status!=='running')throw new ApiError(409,'Es läuft kein Arbeitstag.');
  const current=state.current;if(!current)throw new ApiError(409,'Keine laufende Tätigkeit gefunden.');

  if(b.action==='switch'){
    if(b.construction_site_id)await requireSiteMembership(u,b.construction_site_id);
    if(b.section_id&&b.construction_site_id){
      const {data:sec}=await db.from('project_sections').select('id').eq('id',b.section_id).eq('construction_site_id',b.construction_site_id).eq('archived',false).maybeSingle();
      if(!sec)throw new ApiError(400,'Unterkategorie gehört nicht zur Baustelle.');
    }
    const {error:ce}=await db.from('time_clock_segments').update({ended_at:now.toISOString()}).eq('id',current.id);if(ce)throw ce;
    const {error:ne}=await db.from('time_clock_segments').insert({clock_day_id:state.day.id,user_id:u.id,construction_site_id:b.construction_site_id||null,section_id:b.section_id||null,started_at:now.toISOString(),activity:b.activity||null});if(ne)throw ne;
    await audit(u.id,'clock_switch','time_clock_day',state.day.id,{from:current.construction_site_id||null,to:b.construction_site_id||null});
    return NextResponse.json(await currentState(u.id));
  }

  if(b.action==='stop'){
    const endIso=now.toISOString();const {error:ce}=await db.from('time_clock_segments').update({ended_at:endIso}).eq('id',current.id);if(ce)throw ce;
    const {data:day,error:de}=await db.from('time_clock_days').update({stopped_at:endIso,status:'stopped'}).eq('id',state.day.id).select().single();if(de){await db.from('time_clock_segments').update({ended_at:null}).eq('id',current.id);throw de}
    try{await closeAndMaterialize(day,u)}catch(e){await db.from('time_clock_days').update({stopped_at:null,status:'running'}).eq('id',state.day.id);await db.from('time_clock_segments').update({ended_at:null}).eq('id',current.id);throw e}
    await audit(u.id,'clock_stop','time_clock_day',day.id);
    return NextResponse.json(await currentState(u.id));
  }

  throw new ApiError(400,'Unbekannte Stempeluhr-Aktion.');
}catch(e){return errorResponse(e)}}
