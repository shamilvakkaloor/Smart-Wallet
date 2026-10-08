// @vitest-environment jsdom
import {afterEach,expect,it,vi} from 'vitest';
import {cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
const refresh=vi.hoisted(()=>vi.fn());
vi.mock('next/navigation',()=>({useRouter:()=>({refresh})}));
import {EntryTable,type EntryRow} from '../components/entry-table';
import {RestoreEntryButton} from '../components/restore-entry-button';
const entries=['a','b'].map(id=>({id,reference:`IMP-${id}`,description:'Lunch',category:'Food',type:'EXPENSE',status:id==='b'?'VOIDED':'ACTIVE',date:'2026-10-01',updatedAt:'2026-10-01T00:00:00.000Z',amount:10,code:'OMR'})) as EntryRow[];
afterEach(()=>{cleanup();vi.unstubAllGlobals();vi.restoreAllMocks();refresh.mockReset()});
it('shows no selection or deletion controls in the journal and links to recovery',()=>{render(<EntryTable entries={entries}/>);expect(screen.queryByRole('checkbox')).toBeNull();expect(screen.queryByRole('button',{name:/delete/i})).toBeNull();expect(screen.getByRole('link',{name:'Review & restore'}).getAttribute('href')).toBe('/entries/b')});
it('requires confirmation and submits the viewed version to restore',async()=>{const fetch=vi.fn().mockResolvedValue({ok:true,json:async()=>({status:'ACTIVE'})});vi.stubGlobal('fetch',fetch);vi.spyOn(window,'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);render(<RestoreEntryButton id="b" reference="IMP-b" updatedAt={entries[1].updatedAt}/>);fireEvent.click(screen.getByRole('button'));expect(fetch).not.toHaveBeenCalled();fireEvent.click(screen.getByRole('button'));await waitFor(()=>expect(refresh).toHaveBeenCalled());expect(fetch.mock.calls[0][0]).toBe('/api/entries/b/restore');expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({updatedAt:entries[1].updatedAt})});
it('displays server errors without reporting success',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:false,json:async()=>({error:'Entry changed. Refresh.'})}));vi.spyOn(window,'confirm').mockReturnValue(true);render(<RestoreEntryButton id="b" reference="IMP-b" updatedAt={entries[1].updatedAt}/>);fireEvent.click(screen.getByRole('button'));await waitFor(()=>expect(screen.getByRole('alert').textContent).toContain('Entry changed'));expect(refresh).not.toHaveBeenCalled()});
