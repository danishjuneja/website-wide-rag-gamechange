import './style.css';
import type { ReactNode } from 'react';
export const metadata = {title:'Website information assistant',description:'A source-linked banking information demo'};
export default function Layout({children}:{children:ReactNode}) { return <html lang="en"><body>{children}</body></html>; }
