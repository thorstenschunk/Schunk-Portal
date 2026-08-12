import { NextRequest,NextResponse } from 'next/server';
import { PDFDocument,StandardFonts,rgb } from 'pdf-lib';
import { ApiError,errorResponse,requireUser } from '@/lib/api-auth';
import { supabaseAdmin } from '@/lib/supabase-server';
import { requireMeasurementAccess } from '@/lib/entity-access';
export const runtime='nodejs';
function safe(v:any){return String(v??'—').replace(/[^\x20-\x7EäöüÄÖÜß]/g,' ')}
export async function GET(req:NextRequest){try{
  const u=await requireUser(req,'sites.read');const id=req.nextUrl.searchParams.get('id');if(!id)throw new ApiError(400,'ID fehlt.');await requireMeasurementAccess(u,id);const db=supabaseAdmin();
  const {data:m,error}=await db.from('measurements').select('*,section:project_sections(name),construction_sites(project_no,title,street,postal_code,city),measurement_items(*)').eq('id',id).single();if(error)throw error;
  const pdf=await PDFDocument.create();let page=pdf.addPage([595.28,841.89]);const regular=await pdf.embedFont(StandardFonts.Helvetica),bold=await pdf.embedFont(StandardFonts.HelveticaBold);const black=rgb(.07,.08,.09),gray=rgb(.42,.45,.48),red=rgb(.86,.08,.12);let y=790;
  page.drawText('DESIGN TISCHLEREI SCHUNK',{x:38,y,size:11,font:bold,color:black});page.drawText('AUFMASS',{x:430,y,size:15,font:bold,color:red});y-=34;
  page.drawText(safe(m.title),{x:38,y,size:18,font:bold,color:black});y-=18;page.drawText(`${safe(m.construction_sites?.project_no)} · ${safe(m.construction_sites?.title)} · ${safe(m.section?.name||'Allgemein')}`,{x:38,y,size:8,font:regular,color:gray});y-=25;
  const heads=['Pos.','Bezeichnung','Anz.','L mm','B mm','H mm','Umfang mm','Fläche m²'];const xs=[38,72,245,285,330,375,420,495];heads.forEach((h,i)=>page.drawText(h,{x:xs[i],y,size:6.5,font:bold,color:gray}));y-=12;
  for(const it of (m.measurement_items||[]).sort((a:any,b:any)=>a.position_no-b.position_no)){if(y<70){page=pdf.addPage([595.28,841.89]);y=790;heads.forEach((h,i)=>page.drawText(h,{x:xs[i],y,size:6.5,font:bold,color:gray}));y-=12}const vals=[it.position_no,safe(it.label),it.quantity??'',it.length_mm??'',it.width_mm??'',it.height_mm??'',it.perimeter_mm?Number(it.perimeter_mm).toFixed(0):'',it.area_m2?Number(it.area_m2).toFixed(3):''];vals.forEach((v,i)=>page.drawText(String(v).slice(0,i===1?28:12),{x:xs[i],y,size:7.2,font:regular,color:black}));y-=15}
  y-=12;page.drawText(`Typ: ${safe(m.measurement_type)}`,{x:38,y,size:8,font:bold,color:black});y-=13;if(m.notes)page.drawText(safe(m.notes).slice(0,100),{x:38,y,size:7,font:regular,color:gray});
  const bytes=await pdf.save();return new NextResponse(Buffer.from(bytes),{headers:{'Content-Type':'application/pdf','Content-Disposition':`attachment; filename="Aufmass_${safe(m.title).replace(/[^a-zA-Z0-9_-]/g,'_')}.pdf"`}});
}catch(e){return errorResponse(e)}}
