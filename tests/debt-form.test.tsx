// @vitest-environment jsdom
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,expect,it,vi} from 'vitest';
const mocks=vi.hoisted(()=>({push:vi.fn(),refresh:vi.fn()}));
vi.mock('next/navigation',()=>({useRouter:()=>mocks}));
import {DebtForm} from '../components/debt-form';
const entry={id:'d1',updatedAt:'2026-10-02T00:00:00.000Z',personId:'p1',categoryId:'loan',currencyId:'omr',accountId:'cash',action:'MONEY_GIVEN',amount:50,transactionDate:'2026-10-02',dueDate:'',description:'Loan',notes:'Original note'};
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.restoreAllMocks()});
it('prefills edits and resends the same correction after overpayment confirmation',async()=>{
const fetch=vi.fn().mockResolvedValueOnce({ok:false,json:async()=>({error:'OVERPAYMENT_CONFIRMATION_REQUIRED'})}).mockResolvedValueOnce({ok:true,json:async()=>({id:'d1'})});vi.stubGlobal('fetch',fetch);vi.spyOn(window,'confirm').mockReturnValue(true);
render(<DebtForm people={[{id:'p1',name:'Alex'}]} categories={[{id:'loan',name:'Loan'}]} currencies={[{id:'omr',code:'OMR'}]} accounts={[{id:'cash',accountName:'Cash',currencyId:'omr'}]} entry={entry}/>);
expect((screen.getByLabelText('Amount') as HTMLInputElement).value).toBe('50');fireEvent.change(screen.getByLabelText('Amount'),{target:{value:'25'}});fireEvent.click(screen.getByRole('button',{name:'Save changes'}));await waitFor(()=>expect(fetch).toHaveBeenCalledTimes(2));
const payloads=fetch.mock.calls.map(c=>JSON.parse(c[1].body));expect(payloads[0]).toMatchObject({amount:25,updatedAt:entry.updatedAt,notes:'Original note',confirmOverpayment:false});expect(payloads[1]).toEqual({...payloads[0],confirmOverpayment:true});expect(fetch.mock.calls[0][0]).toBe('/api/debt/d1');expect(fetch.mock.calls[0][1].method).toBe('PATCH');await waitFor(()=>expect(mocks.push).toHaveBeenCalledWith('/debt'));
});
