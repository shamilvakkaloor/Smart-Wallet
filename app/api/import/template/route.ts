import { auth } from '@/lib/auth';
import { apiError } from '@/lib/api-error';
import { makeImportWorkbook } from '@/lib/import-workbook';
import { loadImportOptions } from '@/services/import-service';
export const runtime='nodejs';
export async function GET(){
 if(!(await auth())?.user)return Response.json({error:'Unauthorized'},{status:401});
 try{const book=await makeImportWorkbook(await loadImportOptions());const buffer=await book.xlsx.writeBuffer();return new Response(new Uint8Array(buffer),{headers:{'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','Content-Disposition':'attachment; filename="smart-wallet-import.xlsx"','Cache-Control':'no-store'}})}
 catch(e){return Response.json({error:apiError(e)},{status:400})}
}
