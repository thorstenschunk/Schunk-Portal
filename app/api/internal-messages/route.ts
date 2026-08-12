import { NextRequest,NextResponse } from 'next/server';
import { ApiError,audit,errorResponse,requireUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-server';
export const dynamic='force-dynamic';

async function primaryAdminId(){
  const db=supabaseAdmin();
  const {data:role,error:re}=await db.from('roles').select('id').eq('code','admin').single();if(re||!role)throw re||new ApiError(500,'Administratorrolle fehlt.');
  const {data:urs,error:ue}=await db.from('user_roles').select('user_id').eq('role_id',role.id);if(ue)throw ue;
  const ids=(urs||[]).map((x:any)=>x.user_id);if(!ids.length)throw new ApiError(500,'Kein Administrator hinterlegt.');
  const {data:profiles,error:pe}=await db.from('profiles').select('id').in('id',ids).eq('active',true).eq('archived',false).limit(1);if(pe)throw pe;
  if(!profiles?.length)throw new ApiError(500,'Kein aktiver Administrator gefunden.');
  return profiles[0].id;
}

export async function GET(req:NextRequest){try{
  const u=await requireUser(req);const db=supabaseAdmin();const id=req.nextUrl.searchParams.get('id');
  if(id){
    const {data,error}=await db.from('internal_messages').select('*,sender:profiles!internal_messages_sender_id_fkey(id,full_name),recipient:profiles!internal_messages_recipient_id_fkey(id,full_name),internal_message_replies(*,sender:profiles!internal_message_replies_sender_id_fkey(id,full_name))').eq('id',id).single();
    if(error||!data)throw error||new ApiError(404,'Nachricht nicht gefunden.');
    if(data.sender_id!==u.id&&data.recipient_id!==u.id&&!u.roles.includes('admin'))throw new ApiError(403,'Keine Berechtigung.');
    if(data.last_sender_id!==u.id&&!data.read_at)await db.from('internal_messages').update({read_at:new Date().toISOString()}).eq('id',id);
    return NextResponse.json(data);
  }
  let q=db.from('internal_messages').select('*,sender:profiles!internal_messages_sender_id_fkey(id,full_name),recipient:profiles!internal_messages_recipient_id_fkey(id,full_name)').order('created_at',{ascending:false});
  if(!u.roles.includes('admin'))q=q.or(`sender_id.eq.${u.id},recipient_id.eq.${u.id}`);
  const {data,error}=await q;if(error)throw error;
  return NextResponse.json(data||[]);
}catch(e){return errorResponse(e)}}

export async function POST(req:NextRequest){try{
  const u=await requireUser(req);const b=await req.json();const db=supabaseAdmin();
  if(!String(b.subject||'').trim()||!String(b.body||'').trim())throw new ApiError(400,'Betreff und Nachricht sind erforderlich.');
  let recipientId:string;
  if(u.roles.includes('admin')){
    if(!b.recipient_id)throw new ApiError(400,'Bitte einen Mitarbeiter auswählen.');
    const {data:target,error}=await db.from('profiles').select('id,active,archived').eq('id',b.recipient_id).single();if(error||!target)throw error||new ApiError(404,'Mitarbeiter nicht gefunden.');if(!target.active||target.archived)throw new ApiError(400,'Mitarbeiter ist nicht aktiv.');
    recipientId=b.recipient_id;
  }else recipientId=await primaryAdminId();
  if(recipientId===u.id)throw new ApiError(400,'Nachricht kann nicht an sich selbst gesendet werden.');
  const {data,error}=await db.from('internal_messages').insert({sender_id:u.id,recipient_id:recipientId,last_sender_id:u.id,subject:String(b.subject).trim(),body:String(b.body).trim()}).select().single();if(error)throw error;
  await audit(u.id,'send','internal_message',data.id,{recipient_id:recipientId});return NextResponse.json(data);
}catch(e){return errorResponse(e)}}

export async function PATCH(req:NextRequest){try{
  const u=await requireUser(req);const b=await req.json();const db=supabaseAdmin();
  const {data:m,error:me}=await db.from('internal_messages').select('*').eq('id',b.id).single();if(me||!m)throw me||new ApiError(404,'Nachricht nicht gefunden.');
  if(m.sender_id!==u.id&&m.recipient_id!==u.id&&!u.roles.includes('admin'))throw new ApiError(403,'Keine Berechtigung.');
  if(b.action==='reply'){
    if(!String(b.body||'').trim())throw new ApiError(400,'Antwort fehlt.');
    const {data,error}=await db.from('internal_message_replies').insert({message_id:m.id,sender_id:u.id,body:String(b.body).trim()}).select().single();if(error)throw error;
    await db.from('internal_messages').update({read_at:null,status:'Offen',last_sender_id:u.id}).eq('id',m.id);
    return NextResponse.json(data);
  }
  if(b.action==='resolve'){
    const {data,error}=await db.from('internal_messages').update({status:'Geklärt'}).eq('id',m.id).select().single();if(error)throw error;return NextResponse.json(data);
  }
  throw new ApiError(400,'Unbekannte Aktion.');
}catch(e){return errorResponse(e)}}
