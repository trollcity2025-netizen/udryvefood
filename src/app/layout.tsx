import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import Footer from '@/components/layout/Footer';
import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { CartProvider } from '@/context/CartContext';
import { AdminViewProvider } from '@/context/AdminViewContext';
import InstallPrompt from '@/components/pwa/InstallPrompt';
import OfflineBanner from '@/components/pwa/OfflineBanner';

import MobileNav from '@/components/layout/MobileNav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'UdryveFood',
  description: 'Food delivery platform',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon.svg',
    apple: '/icons/icon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'UdryveFood',
  },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Disable zooming for app-like feel
  viewportFit: 'cover', // Use full screen including notch areas
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} overscroll-none select-none`}>
        <OfflineBanner />
        <InstallPrompt />
        <AdminViewProvider>
          <CartProvider>
            <div className="flex h-screen overflow-hidden">
              {/* Desktop Sidebar - Hidden on mobile */}
              <div className="hidden md:block">
                 <Sidebar />
              </div>
              
              <div className="flex-1 flex flex-col h-full overflow-hidden md:ml-64">
                {/* Desktop TopBar - Hidden on mobile or simplified */}
                <div className="hidden md:block">
                   <TopBar />
                </div>

                {/* Mobile Header (Simplified TopBar) */}
                <div className="md:hidden h-14 bg-white border-b border-slate-100 flex items-center justify-center sticky top-0 z-30 px-4">
                    <span className="font-bold text-lg text-slate-900">UdryveFood</span>
                </div>
                
                {/* Main Content Area - Scrollable */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50 text-slate-900 pb-20 md:pb-0 md:mt-16 md:p-6">
                   {children}
                   <div className="md:hidden pb-safe"></div> 
                </main>
                
                {/* Desktop Footer - Hidden on mobile */}
                <div className="hidden md:block">
                  <Footer />
                </div>

                {/* Mobile Bottom Navigation */}
                <MobileNav />
              </div>
            </div>
          </CartProvider>
        </AdminViewProvider>
      </body>
    </html>
  );
}
