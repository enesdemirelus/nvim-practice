import type {Metadata} from 'next';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import '@fontsource/roboto-mono/400.css';
import 'material-symbols/rounded.css';
import './globals.css';
export const metadata:Metadata={title:'nvim classroom · Your config, one edit at a time',description:'A hands-on Neovim course built around your exact mappings, plugins, and Catppuccin Frappé setup.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><a href="#main" className="skip-link">Skip to content</a>{children}</body></html>}
