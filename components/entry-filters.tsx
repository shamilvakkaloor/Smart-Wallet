"use client";
import { useState } from 'react';
import { MultiSelect } from '@/components/multi-select';
export function EntryFilters({type='',q='',status='active'}:{type?:string;q?:string;status?:string}){
 const [types,setTypes]=useState(type);const [states,setStates]=useState(status==='all'?'':status);
 return <form className="card mb-5 grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-[1fr_220px_200px_auto_auto]"><label className="mb-0">Search<input name="q" placeholder="Description, notes, reference…" defaultValue={q}/></label><MultiSelect label="Entry types" name="type" value={types} onChange={setTypes} options={['INCOME','EXPENSE','TRANSFER','EXCHANGE'].map(value=>({value,label:value}))}/><MultiSelect label="Entry status" name="status" value={states} onChange={setStates} options={[{value:'active',label:'Active'},{value:'deleted',label:'Voided / Deleted'}]}/><button className="btn-secondary">Filter</button><a href="/entries" className="btn-secondary">Reset</a></form>;
}
