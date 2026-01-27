import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import Footer from '@/components/layout/Footer';
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { CartProvider } from '@/context/CartContext';
import { AdminViewProvider } from '@/context/AdminViewContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'UdryveFood',
  description: 'Food delivery platform',
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AdminViewProvider>
          <CartProvider>
            <div className="flex">
              <Sidebar />
              <div className="flex-1 ml-64 flex flex-col min-h-screen">
                 <TopBar />
                <main className="flex-1 mt-16 bg-slate-50 text-slate-900">
                   {children}
                </main>
                <Footer />
              </div>
            </div>
          </CartProvider>
        </AdminViewProvider>
      </body>
    </html>
  );
}
