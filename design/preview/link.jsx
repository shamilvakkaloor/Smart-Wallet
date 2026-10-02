import {go} from './navigation';
export default function Link({href,children,onClick,...props}){return <a href={href} {...props} onClick={e=>{onClick?.(e);if(href.startsWith('/')&&!href.startsWith('/api')){e.preventDefault();go(href)}}}>{children}</a>}
