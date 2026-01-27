import Link from 'next/link';
import { createClient } from '@/utils/supabase/server';

export default async function Footer() {
  const supabase = await createClient();

  return (
    <footer className="bg-slate-900 text-white pt-12 pb-8 px-4 sm:px-6 lg:px-8 mt-auto border-t border-slate-800">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-8">
        
        {/* Company Column */}
        <div>
          <h3 className="text-sm font-semibold text-slate-400 tracking-wider uppercase mb-4">Company</h3>
          <ul className="space-y-3">
            <li><Link href="/about" className="text-slate-300 hover:text-white transition-colors">About Us</Link></li>
            <li><Link href="/investment" className="text-slate-300 hover:text-white transition-colors">Investment Opportunities</Link></li>
          </ul>
        </div>

        {/* Support Column */}
        <div>
          <h3 className="text-sm font-semibold text-slate-400 tracking-wider uppercase mb-4">Support</h3>
          <ul className="space-y-3">
            <li><Link href="/contact" className="text-slate-300 hover:text-white transition-colors">Contact Us</Link></li>
            <li><Link href="/help" className="text-slate-300 hover:text-white transition-colors">Help Center</Link></li>
            <li><Link href="/refund-policy" className="text-slate-300 hover:text-white transition-colors">Refund Policy</Link></li>
            <li><Link href="/terms" className="text-slate-300 hover:text-white transition-colors">Terms of Service</Link></li>
            <li><Link href="/privacy" className="text-slate-300 hover:text-white transition-colors">Privacy Policy</Link></li>
          </ul>
        </div>

        {/* Get the App Column */}
        <div>
          <h3 className="text-sm font-semibold text-slate-400 tracking-wider uppercase mb-4">Get the App</h3>
          <ul className="space-y-3">
            <li>
              <a href="#" className="flex items-center px-4 py-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors w-fit border border-slate-700">
                 <svg className="h-6 w-6 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M3,20.5V3.5C3,2.91,3.34,2.39,3.84,2.15L13.69,12L3.84,21.85C3.34,21.6,3,21.09,3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08,20.75,11.5,20.75,12C20.75,12.5,20.5,12.92,20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" /></svg>
                 <span>Google Play</span>
              </a>
            </li>
          </ul>
        </div>

      </div>
      <div className="mt-12 border-t border-slate-800 pt-8 text-center">
         <p className="text-slate-400 text-sm">&copy; {new Date().getFullYear()} UdryveFood. All rights reserved.</p>
      </div>
    </footer>
  );
}
