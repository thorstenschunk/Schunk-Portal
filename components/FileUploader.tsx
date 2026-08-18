'use client';
import { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { apiFetch } from '@/lib/api-client';
import { getSupabaseBrowser } from '@/lib/supabase-browser';

type Props={entityType:'site'|'report'|'profile'|'project_item'|'measurement'|'task'|'internal_message'|'assignment'|'purchase_request';entityId:string;category:string;accept?:string;label?:string;title?:string;description?:string;visibility?:'admin'|'office'|'site_members'|'selected';visibleTo?:string[];sectionId?:string;reportDayId?:string|null;onUploaded?:()=>void};
export function FileUploader({entityType,entityId,category,accept,label='Datei hochladen',title,description,visibility='site_members',visibleTo=[],sectionId,reportDayId,onUploaded}:Props){const {accessToken}=useAuth();const input=useRef<HTMLInputElement>(null);const [busy,setBusy]=useState(false);const [error,setError]=useState('');
async function uploadOne(file:File){const prep=await apiFetch<{file_id:string;bucket:string;path:string;token:string}>('/api/files/upload-url',accessToken,{method:'POST',body:JSON.stringify({entity_type:entityType,entity_id:entityId,category,title:title||file.name,description:description||null,visibility,visible_to:visibleTo,section_id:sectionId||null,report_day_id:reportDayId||null,file_name:file.name,mime_type:file.type,size_bytes:file.size})});const {error:up}=await getSupabaseBrowser().storage.from(prep.bucket).uploadToSignedUrl(prep.path,prep.token,file,{contentType:file.type||undefined});if(up)throw up;await apiFetch('/api/files/complete',accessToken,{method:'POST',body:JSON.stringify({file_id:prep.file_id})})}
async function pick(files?:FileList|null){if(!files?.length)return;setBusy(true);setError('');try{for(const file of Array.from(files))await uploadOne(file);onUploaded?.()}catch(e){setError(e instanceof Error?e.message:'Upload fehlgeschlagen.')}finally{setBusy(false);if(input.current)input.current.value=''}}
return <div><input ref={input} type="file" accept={accept} multiple hidden onChange={e=>pick(e.target.files)}/><button type="button" className="btn" disabled={busy} onClick={()=>input.current?.click()}><UploadCloud size={17} style={{verticalAlign:'middle',marginRight:7}}/>{busy?'Upload…':label}</button>{error&&<div className="alert error">{error}</div>}</div>}
