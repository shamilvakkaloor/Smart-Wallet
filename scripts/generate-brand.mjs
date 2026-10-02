import fs from 'node:fs/promises';
import sharp from 'sharp';
const svg = await fs.readFile('public/icons/wallet.svg','utf8');
for (const size of [32,48,24,180,192,512,1024]) await sharp(Buffer.from(svg)).resize(size,size).png().toFile(`public/icons/${size===32?'favicon-32':`wallet-${size}`}.png`);
const mask = svg.replace('rx="112"','rx="0"');
await sharp(Buffer.from(mask)).resize(512,512).png().toFile('public/icons/wallet-maskable-512.png');
const paths = svg.slice(svg.indexOf(' <path'));
for (const [name,color] of [['white','#ffffff'],['dark','#0f172a']]) {
 const mono = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="90 90 340 310">${paths.replaceAll('#fff',color).replaceAll('#064e3b',color).replace(/<circle[^>]+\/>/, '<circle cx="351" cy="243" r="8" fill="none"/>')}`;
 await fs.writeFile(`public/icons/wallet-mono-${name}.svg`,mono);
}
const lockup = `<svg xmlns="http://www.w3.org/2000/svg" width="660" height="144" viewBox="0 0 660 144"><image href="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}" width="112" height="112" x="16" y="16"/><text x="153" y="74" font-family="Segoe UI,Arial,sans-serif" font-size="43" font-weight="700" fill="#0f172a">Smart <tspan fill="#047857">Wallet</tspan></text><text x="155" y="106" font-family="Segoe UI,Arial,sans-serif" font-size="12" letter-spacing="3" fill="#586d63">SW / PERSONAL FINANCE</text></svg>`;
await fs.writeFile('public/icons/wordmark.svg',lockup);
const manifest=JSON.parse(await fs.readFile('public/manifest.webmanifest','utf8'));
manifest.background_color='#f6f8f7';manifest.icons.find(x=>x.purpose==='maskable').src='/icons/wallet-maskable-512.png';
await fs.writeFile('public/manifest.webmanifest',JSON.stringify(manifest,null,2)+'\n');
