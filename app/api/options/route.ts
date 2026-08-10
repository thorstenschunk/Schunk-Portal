import { NextRequest, NextResponse } from 'next/server';
import { ApiError, errorResponse, requireUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-server';
export const dynamic='force-dynamic';
function wide(u:any){return u.roles.some((r:string)=>['admin','office','foreman'].includes(r));}
export async function GET(req:NextRequest){
  try{
    const u=await requireUser(req);const db=supabaseAdmin();const type=req.nextUrl.searchParams.get('type');
    if(type==='employees'){
      if(!u.roles.includes('admin')&&!u.permissions.some((p:string)=>['admin.users.manage','sites.manage','calendar.manage','reports.create','time.all','time.correct','absence.manage'].includes(p))) throw new ApiError(403,'Keine Berechtigung für Mitarbeiterdaten.');
      const {data,error}=await db.from('profiles').select('id,full_name,employee_no').eq('active',true).eq('archived',false).order('full_name');if(error)throw error;return NextResponse.json(data||[])
    }
    if(type==='customers'){
      if(!u.roles.includes('admin')&&!u.permissions.includes('customers.read')) throw new ApiError(403,'Keine Berechtigung für Kundendaten.');
      const {data,error}=await db.from('customers').select('id,customer_no,name,salutation').eq('archived',false).order('name');if(error)throw error;return NextResponse.json(data||[])
    }
    if(type==='sites'){
      if(!u.roles.includes('admin')&&!u.permissions.includes('sites.read')) throw new ApiError(403,'Keine Berechtigung für Baustellen.');
      let q=db.from('construction_sites').select('id,project_no,title,status,city').eq('archived',false).order('title');
      if(!wide(u)){const {data:mem}=await db.from('construction_members').select('construction_site_id').eq('user_id',u.id);const ids=(mem||[]).map((m:any)=>m.construction_site_id);if(!ids.length)return NextResponse.json([]);q=q.in('id',ids)}
      const {data,error}=await q;if(error)throw error;return NextResponse.json(data||[])
    }
    return NextResponse.json({error:'Unbekannter Optionstyp.'},{status:400})
  }catch(e){return errorResponse(e)}
}
