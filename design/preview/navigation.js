import { useSyncExternalStore } from 'react';
const subscribe=fn=>{window.addEventListener('popstate',fn);return ()=>window.removeEventListener('popstate',fn)};
export function usePathname(){return useSyncExternalStore(subscribe,()=>location.pathname)}
export const go=url=>{history.pushState(null,'',url);window.dispatchEvent(new PopStateEvent('popstate'))};
export function useRouter(){return {push:go,back:()=>history.back(),refresh:()=>{}}}
export function notFound(){throw new Error('Not found')}
export function redirect(url){go(url)}
