import { NextRequest, NextResponse } from 'next/server';
import { ApiError, audit, errorResponse, minutesBetween, quarterTime, requireUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { requireSiteMembership } from '@/lib/entity-access';
export const dynamic='force-dynamic';

function rangeFrom(req:NextRequest){
  const period=req.nextUrl.searchParams.get('period')||'month';
  const ref=req.nextUrl.searchParams.get('ref')||req.nextUrl.searchParams.get('month')||new Date().toISOString().slice(0,7);
  if(period==='year'){
    const y=Number(ref.slice(0,4));return {period,ref:String(y),start:`${y}-01-01`,end:`${y}-12-31`};
  }
  if(period==='week'){
    const raw=req.nextUrl.searchParams.get('date')||ref||new Date().toISOString().slice(0,10);
    const d=new Date(`${raw.slice(0,10)}T12:00:00Z`);const day=d.getUTCDay()||7;d.setUTCDate(d.getUTCDate()-day+1);const start=d.toISOString().slice(0,10);d.setUTCDate(d.getUTCDate()+6);return {period,ref:start,start,end:d.toISOString().slice(0,10)};
  }
  const month=ref.slice(0,7);const [y,m]=month.split('-').map(Number);return {period:'month',ref:month,start:`${month}-01`,end:new Date(Date.UTC(y,m,0)).toISOString().slice(0,10)};
}
export async function GET(req:NextRequest){
  try{
    const u=await requireUser(req,'time.own'); const db=supabaseAdmin();
    const r=rangeFrom(req);const userId=req.nextUrl.searchParams.get('user_id');let target=userId||u.id;
    if(target!==u.id && !u.roles.includes('admin') && !u.permissions.includes('time.all')) throw new ApiError(403,'Keine Berechtigung für fremde Zeiten.');
    const today=new Date().toISOString().slice(0,10);const targetEnd=r.end>today?today:r.end;
    const {data,error}=await db.from('time_entries').select('*,construction_sites(project_no,title),section:project_sections(id,name)').eq('user_id',target).gte('work_date',r.start).lte('work_date',r.end).order('work_date',{ascending:false}).order('start_time',{ascending:false});
    if(error)throw error;
    const {data:profile}=await db.from('profiles').select('weekly_hours').eq('id',target).single();
    const workdays=countWeekdays(new Date(`${r.start}T00:00:00Z`),new Date(`${targetEnd}T00:00:00Z`));
    const dailyTargetMinutes=Math.round((Number(profile?.weekly_hours||40)/5)*60);
    const targetMinutes=dailyTargetMinutes*workdays;
    const actualMinutes=(data||[]).reduce((s:any,x:any)=>s+(x.total_minutes||0),0);
    const {data:abs}=await db.from('absences').select('*').eq('user_id',target).lte('start_date',r.end).gte('end_date',r.start).eq('status','Genehmigt');
    const creditedDates=new Set<string>();const absenceDaysByType:Record<string,Set<string>>={};
    for(const a of abs||[]){
      const aStart=new Date(`${a.start_date}T00:00:00Z`),aEnd=new Date(`${a.end_date}T00:00:00Z`),rangeStart=new Date(`${r.start}T00:00:00Z`),rangeEnd=new Date(`${r.end}T00:00:00Z`),creditEnd=new Date(`${targetEnd}T00:00:00Z`);
      const from=aStart>rangeStart?aStart:rangeStart,to=aEnd<rangeEnd?aEnd:rangeEnd;
      absenceDaysByType[a.absence_type]??=new Set<string>();
      for(let d=new Date(from);d<=to;d.setUTCDate(d.getUTCDate()+1)){const w=d.getUTCDay();if(w!==0&&w!==6){const ds=d.toISOString().slice(0,10);absenceDaysByType[a.absence_type].add(ds);if(d<=creditEnd)creditedDates.add(ds);}}
    }
    const absenceCreditMinutes=creditedDates.size*dailyTargetMinutes;
    const creditedActualMinutes=actualMinutes+absenceCreditMinutes;
    const absenceDays=Object.fromEntries(Object.entries(absenceDaysByType).map(([k,v])=>[k,v.size]));
    return NextResponse.json({range:r,entries:data||[],summary:{targetMinutes,actualMinutes,absenceCreditMinutes,creditedActualMinutes,overtimeMinutes:creditedActualMinutes-targetMinutes,dailyTargetMinutes,absenceDays,absences:abs||[]}});
  }catch(e){return errorResponse(e)}
}

export async function POST(req:NextRequest){
  try{
    const u=await requireUser(req,'time.own'); const b=await req.json(); const db=supabaseAdmin();
    const canCorrect=u.roles.includes('admin')||u.permissions.includes('time.correct');if(!canCorrect)throw new ApiError(403,'Mitarbeiter erfassen Arbeitszeiten ausschließlich über die Stempeluhr.');const userId=b.user_id||u.id;if(b.construction_site_id)await requireSiteMembership(u,b.construction_site_id);
    const pause=Number(b.pause_minutes||0), travel=Number(b.travel_setup_minutes||0);
    if(!quarterTime(b.start_time)||!quarterTime(b.end_time)||pause%15||travel%15) return NextResponse.json({error:'Zeiten sind ausschließlich im 15-Minuten-Raster zulässig.'},{status:400});
    const total=minutesBetween(b.start_time,b.end_time,pause); if(total<0||total%15) return NextResponse.json({error:'Ungültige Arbeitszeit.'},{status:400}); if(travel>total)return NextResponse.json({error:'Fahrt-/Rüstzeit kann nicht größer als die Gesamtzeit sein.'},{status:400});
    const {data,error}=await db.from('time_entries').insert({user_id:userId,construction_site_id:b.construction_site_id||null,section_id:b.section_id||null,work_date:b.work_date,start_time:b.start_time,end_time:b.end_time,pause_minutes:pause,travel_setup_minutes:travel,total_minutes:total,activity:b.activity||null,notes:b.notes||null,locked:!!b.locked,submitted_at:b.locked?new Date().toISOString():null,created_by:u.id}).select().single(); if(error){if((error as any).code==='23P01')throw new ApiError(409,'Für diesen Mitarbeiter existiert bereits eine überlappende Arbeitszeit.');throw error;} await audit(u.id,'create','time_entry',data.id); return NextResponse.json(data);
  }catch(e){return errorResponse(e)}
}

export async function PATCH(req:NextRequest){
  try{
    const u=await requireUser(req,'time.own'); const b=await req.json(); const db=supabaseAdmin();
    const {data:old,error:oldErr}=await db.from('time_entries').select('*').eq('id',b.id).single(); if(oldErr||!old)throw oldErr||new ApiError(404,'Zeitbuchung nicht gefunden.');
    const canCorrect=u.roles.includes('admin')||u.permissions.includes('time.correct'); if(old.locked&&!canCorrect)throw new ApiError(409,'Diese Zeitbuchung ist gesperrt und kann nicht mehr geändert werden.'); if(old.user_id!==u.id&&!canCorrect)throw new ApiError(403,'Keine Berechtigung.');
    if(b.action==='lock'){const {data,error}=await db.from('time_entries').update({locked:true,submitted_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('id',b.id).select().single();if(error)throw error;await audit(u.id,'lock','time_entry',b.id);return NextResponse.json(data)}
    if(!canCorrect)throw new ApiError(403,'Nachträgliche Korrekturen dürfen nur berechtigte Benutzer durchführen.');
    const pause=Number(b.pause_minutes??old.pause_minutes), travel=Number(b.travel_setup_minutes??old.travel_setup_minutes), start=b.start_time||old.start_time.slice(0,5), end=b.end_time||old.end_time.slice(0,5);
    if(!quarterTime(start)||!quarterTime(end)||pause%15||travel%15)throw new ApiError(400,'15-Minuten-Raster erforderlich.'); const total=minutesBetween(start,end,pause); if(total<0||travel>total)throw new ApiError(400,'Ungültige Zeiten.'); if(!String(b.reason||'').trim())throw new ApiError(400,'Korrekturgrund ist Pflicht.');
    const values={start_time:start,end_time:end,pause_minutes:pause,travel_setup_minutes:travel,total_minutes:total,activity:b.activity??old.activity,notes:b.notes??old.notes,construction_site_id:b.construction_site_id??old.construction_site_id,section_id:b.section_id??old.section_id,work_date:b.work_date??old.work_date,locked:true,updated_at:new Date().toISOString()};
    const {data,error}=await db.from('time_entries').update(values).eq('id',b.id).select().single();if(error){if((error as any).code==='23P01')throw new ApiError(409,'Die korrigierte Zeit überschneidet sich mit einer anderen Buchung.');throw error;}await db.from('time_entry_revisions').insert({time_entry_id:b.id,changed_by:u.id,reason:b.reason,before_data:old,after_data:data});await audit(u.id,'correct','time_entry',b.id,{reason:b.reason});return NextResponse.json(data);
  }catch(e){return errorResponse(e)}
}
function countWeekdays(a:Date,b:Date){let n=0;for(let d=new Date(a);d<=b;d.setUTCDate(d.getUTCDate()+1)){const w=d.getUTCDay();if(w!==0&&w!==6)n++}return n}
