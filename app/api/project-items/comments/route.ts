import { NextRequest,NextResponse } from 'next/server';
import { audit,errorResponse,requireUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { requireProjectItemAccess } from '@/lib/entity-access';
export async function POST(req:NextRequest){try{const u=await requireUser(req,'sites.read');const b=await req.json();if(!b.item_id||!String(b.message||'').trim())return NextResponse.json({error:'Nachricht fehlt.'},{status:400});await requireProjectItemAccess(u,b.item_id);const {data,error}=await supabaseAdmin().from('project_item_comments').insert({item_id:b.item_id,message:String(b.message).trim(),created_by:u.id}).select().single();if(error)throw error;await audit(u.id,'comment','project_item',b.item_id);return NextResponse.json(data)}catch(e){return errorResponse(e)}}
