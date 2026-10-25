import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {title:"PaperCue AI — Every notice. A clear next step.", description:"Turn complicated student notices into evidence-backed checklists and deadlines."};
export default function RootLayout({children}:{children:React.ReactNode}) {return <html lang="en"><body>{children}</body></html>;}
