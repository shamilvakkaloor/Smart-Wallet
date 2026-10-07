import { auth } from "@/lib/auth";
import { apiError } from "@/lib/api-error";
import { parseReportFilters, reportParams } from "@/validation/reports";
import { loadReportOptions,loadReports } from "@/services/report-service";
import { reportCsv } from "@/lib/report-csv";
export async function GET(request:Request) {
  if(!(await auth())?.user)return new Response('Unauthorized',{status:401});
  try{
    const params=new URL(request.url).searchParams;
    const f=parseReportFilters(reportParams(params));const reports=await loadReports(f,await loadReportOptions());const format=params.get('format')==='entries'?'entries':'summary';
    return new Response(reportCsv(reports,format,f.view==='yearly'),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="smart-wallet-${f.view}-${format}.csv"`,'Cache-Control':'no-store'}});
  }catch(error){return Response.json({error:apiError(error)},{status:400});}
}
