import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../../',import.meta.url));
const here=fileURLToPath(new URL('.',import.meta.url));
export default defineConfig({ root:here, publicDir:root+'public', esbuild:{jsx:'automatic'}, define:{'process.env.LOGIN_USER':JSON.stringify('Shamil')}, resolve:{alias:[{find:'@/app/actions',replacement:here+'actions.js'},{find:'@/lib/auth',replacement:here+'auth.js'},{find:'@/lib/db',replacement:here+'data.js'},{find:'@/services/balance-service',replacement:here+'data.js'},{find:'next/link',replacement:here+'link.jsx'},{find:'next/navigation',replacement:here+'navigation.js'},{find:'@',replacement:root}]}, server:{host:'127.0.0.1',port:4173,strictPort:true,fs:{allow:[root]}} });
