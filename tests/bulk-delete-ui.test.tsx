// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
vi.mock('next/navigation',()=>({useRouter:()=>({refresh:vi.fn()})}));
import {EntryTable,type EntryRow} from '../components/entry-table';
const entries=['a','b','c'].map(id=>({id,reference:`IMP-${id}`,description:'Lunch',category:'Food',type:'EXPENSE',status:id==='c'?'VOIDED':'ACTIVE',date:'2026-10-01',updatedAt:'2026-10-01T00:00:00.000Z',amount:10,code:'OMR'})) as EntryRow[];
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.restoreAllMocks()});
it('selects only visible active rows, honors cancel and sends versions after confirmation',async()=>{const fetch=vi.fn().mockResolvedValue({ok:true,json:async()=>({deleted:2})});vi.stubGlobal('fetch',fetch);vi.spyOn(window,'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);render(<EntryTable entries={entries}/>);fireEvent.click(screen.getByRole('checkbox',{name:'Select all active entries shown'}));expect(screen.queryByRole('checkbox',{name:'Select IMP-c'})).toBeNull();fireEvent.click(screen.getByRole('button',{name:'Delete selected'}));expect(fetch).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button',{name:'Delete selected'}));await waitFor(()=>expect(screen.getByRole('status')).toBeTruthy());expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({items:entries.slice(0,2).map(({id,updatedAt})=>({id,updatedAt}))});expect(screen.queryByRole('checkbox',{name:'Select IMP-a'})).toBeNull()});
