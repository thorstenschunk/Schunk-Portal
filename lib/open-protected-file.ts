'use client';
import {apiFetch} from '@/lib/api-client';

export async function openProtectedFile(fileId:string,accessToken:string,extraQuery=''){
  const popup=typeof window!=='undefined'?window.open('about:blank','_blank'):null;
  if(popup){
    try{
      popup.document.write('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Datei wird geöffnet…</title></head><body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif;padding:24px">Datei wird geöffnet…</body></html>');
      popup.document.close();
    }catch{}
  }
  try{
    const x=await apiFetch<{url:string}>(`/api/files/url?id=${encodeURIComponent(fileId)}${extraQuery}`,accessToken);
    if(!x?.url)throw new Error('Datei-URL fehlt.');
    if(popup&&!popup.closed)popup.location.replace(x.url);
    else window.location.assign(x.url);
  }catch(e){
    if(popup&&!popup.closed)popup.close();
    throw e;
  }
}

export function openKnownFileUrl(url:string){
  if(!url)return;
  const popup=window.open(url,'_blank');
  if(!popup)window.location.assign(url);
}
