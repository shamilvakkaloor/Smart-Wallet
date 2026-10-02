import {useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ThemeProvider} from '../../components/theme-provider';
import {AppShell} from '../../components/app-shell';
import Home from '../../app/page';import Entries from '../../app/entries/page';import NewEntry from '../../app/entries/new/page';import Details from '../../app/entries/[id]/page';import Edit from '../../app/entries/[id]/edit/page';import Wallets from '../../app/wallets/page';import Debt from '../../app/debt/page';import Budgets from '../../app/budgets/page';import Reports from '../../app/reports/page';import Health from '../../app/data-health/page';import Settings from '../../app/settings/page';import Login from '../../app/login/page';import Backup from '../../app/backup/page';
import {usePathname} from './navigation';import '../../app/globals.css';
const pages={'/':Home,'/entries':Entries,'/entries/new':NewEntry,'/entries/t1':Details,'/entries/t1/edit':Edit,'/wallets':Wallets,'/debt':Debt,'/budgets':Budgets,'/reports':Reports,'/data-health':Health,'/settings':Settings,'/backup':Backup,'/login':Login};
function Preview(){const path=usePathname();const [page,setPage]=useState(null);useEffect(()=>{let live=true;Promise.resolve((pages[path]??Home)({searchParams:Promise.resolve(Object.fromEntries(new URLSearchParams(location.search))),params:Promise.resolve({id:'t1'})})).then(el=>{if(live)setPage(el)}).catch(err=>{console.error(err);setPage(<pre>{String(err)}</pre>)});return()=>{live=false}},[path]);return <ThemeProvider>{path==='/login'?page:<AppShell username="Shamil">{page}</AppShell>}</ThemeProvider>}
createRoot(document.getElementById('root')).render(<Preview/>);
