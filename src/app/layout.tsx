import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Alegreya } from 'next/font/google';

export const metadata: Metadata = {
  title: 'Frô',
  description: 'Identifique plantas, analise sua saúde e obtenha dicas de cuidados com a Frô.',
};

const alegreya = Alegreya({
  subsets: ['latin'],
  variable: '--font-body',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${alegreya.variable}`}>
      <body className="font-body antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
