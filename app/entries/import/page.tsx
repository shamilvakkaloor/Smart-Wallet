import { ImportCleanup } from "@/components/import-cleanup";
import { PageHeader } from '@/components/page-header';
import { ImportExcel } from '@/components/import-excel';
export default function ImportPage(){return <><PageHeader title="Import previous transactions" description="Download your Excel template, fill it in, then preview the entries before importing."/><ImportExcel/><ImportCleanup/></>}
