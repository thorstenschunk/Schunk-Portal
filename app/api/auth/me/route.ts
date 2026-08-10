import { NextRequest, NextResponse } from 'next/server';
import { errorResponse, requireUser } from '@/lib/api-auth';
export const dynamic = 'force-dynamic';
export async function GET(req: NextRequest){ try { return NextResponse.json(await requireUser(req)); } catch(e){ return errorResponse(e); } }
