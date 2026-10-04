import {beforeEach,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({auth:vi.fn(),update:vi.fn(),void:vi.fn(),options:vi.fn(),reports:vi.fn()}));
vi.mock('@/lib/auth',()=>({auth:mocks.auth}));vi.mock('next/cache',()=>({revalidatePath:vi.fn()}));
vi.mock('@/services/debt-service',()=>({updateDebtEntry:mocks.update,voidDebtEntry:mocks.void}));
vi.mock('@/services/report-service',()=>({loadReportOptions:mocks.options,loadReports:mocks.reports}));
import {PATCH,DELETE} from '../app/api/debt/[id]/route';
import {GET} from '../app/api/reports/export/route';
const context={params:Promise.resolve({id:'debt'})};
const request=()=>new Request('http://localhost/api/debt/debt',{method:'PATCH',body:JSON.stringify({amount:50})});
beforeEach(()=>vi.resetAllMocks());
it('protects debt edits and financial exports from unauthenticated requests',async()=>{expect((await PATCH(request(),context)).status).toBe(401);expect((await GET(new Request('http://localhost/api/reports/export'))).status).toBe(401);expect(mocks.update).not.toHaveBeenCalled();expect(mocks.reports).not.toHaveBeenCalled()});
it('edits the existing debt ID and returns conflicts as errors',async()=>{mocks.auth.mockResolvedValue({user:{name:'test'}});mocks.update.mockResolvedValue({id:'debt'});expect((await PATCH(request(),context)).status).toBe(200);expect(mocks.update).toHaveBeenCalledWith('debt',{amount:50});mocks.update.mockRejectedValue(new Error('Reload before editing'));expect((await PATCH(request(),context)).status).toBe(400)});
it('exports all filtered rows with private cache settings',async()=>{mocks.auth.mockResolvedValue({user:{name:'test'}});mocks.options.mockResolvedValue({});mocks.reports.mockResolvedValue([]);const res=await GET(new Request('http://localhost/api/reports/export?view=yearly&year=2026&accountType=BANK&grouping=subcategory'));expect(res.status).toBe(200);expect(res.headers.get('cache-control')).toContain('no-store');expect(mocks.reports.mock.calls[0][0]).toMatchObject({view:'yearly',year:2026,accountType:'BANK',grouping:'subcategory'});expect(await res.text()).toContain('Jan')});

it('protects void requests and forwards the version for authenticated requests',async()=>{expect((await DELETE(request(),context)).status).toBe(401);expect(mocks.void).not.toHaveBeenCalled();mocks.auth.mockResolvedValue({user:{name:'test'}});expect((await DELETE(request(),context)).status).toBe(200);expect(mocks.void).toHaveBeenCalledWith('debt',{amount:50})});
