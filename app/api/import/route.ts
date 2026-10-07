import { auth } from '@/lib/auth';
import { apiError } from '@/lib/api-error';
import { IMPORT_BYTES } from '@/lib/import-workbook';
import { prepareImport, importToken, verifyImportToken, commitImport } from '@/services/import-service';
import { revalidatePath } from 'next/cache';
export const runtime='nodejs';
export const maxDuration=60;
async function boundedForm(request:Request){
 const reader=request.body?.getReader();if(!reader)throw new Error('Choose an Excel file.');const chunks:Uint8Array[]=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>IMPORT_BYTES+65536){await reader.cancel();throw new Error('Upload an .xlsx file smaller than 2 MB.')}chunks.push(value)}}finally{reader.releaseLock()}
 return new Response(Buffer.concat(chunks),{headers:{'Content-Type':request.headers.get('Content-Type')??''}}).formData();
}
export async function POST(request:Request){
 if(!(await auth())?.user)return Response.json({error:'Unauthorized'},{status:401});
 try{
  const form=await boundedForm(request);const file=form.get('file');if(!(file instanceof File)||!file.name.toLowerCase().endsWith('.xlsx')||file.size>IMPORT_BYTES)throw new Error('Choose an .xlsx file smaller than 2 MB.');
  const {rows,errors,existing}=await prepareImport(Buffer.from(await file.arrayBuffer()));
  if(errors.length)return Response.json({errors,error:'Correct the listed rows and upload again. Nothing was imported.'},{status:400});
  const mode=form.get('mode');if(mode==='commit'){
   verifyImportToken(String(form.get('token')??''),rows);const result=await commitImport(rows);revalidatePath('/','layout');return Response.json(result,{headers:{'Cache-Control':'no-store'}});
  }
  if(mode!=='preview')throw new Error('Preview the file before importing.');
  return Response.json({token:importToken(rows),rows:rows.map(r=>({row:r.row,type:r.data.type,date:r.data.transactionDate,description:r.data.description,account:r.account,category:r.category,amount:'sourceAmount' in r.data?r.data.sourceAmount:r.data.amount,notes:r.data.notes,details:r.summary,skipped:existing.has(r.reference)})),count:rows.filter(r=>!existing.has(r.reference)).length,skipped:existing.size},{headers:{'Cache-Control':'no-store'}});
 }catch(e){return Response.json({error:apiError(e)},{status:400})}
}
