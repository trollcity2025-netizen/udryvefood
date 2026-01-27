import { TrendingUp, Users, Globe } from 'lucide-react';

export default function InvestmentPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="bg-emerald-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">Investor Relations</h1>
          <p className="text-xl text-emerald-100 max-w-2xl mx-auto">
            Partner with UdryveFood to capture the growing on-demand delivery market.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="p-8 bg-slate-50 rounded-2xl text-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Market Growth</h3>
            <p className="text-slate-600">Expanding into new territories with 200% YoY growth.</p>
          </div>
          <div className="p-8 bg-slate-50 rounded-2xl text-center">
             <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">User Base</h3>
            <p className="text-slate-600">Over 5 million active users and growing daily.</p>
          </div>
          <div className="p-8 bg-slate-50 rounded-2xl text-center">
             <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Globe className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Global Scale</h3>
            <p className="text-slate-600">Operating in 50+ major cities across the country.</p>
          </div>
        </div>

        <div className="text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Contact Investor Relations</h2>
            <a href="mailto:kain.towns@maicorp.online" className="text-blue-600 font-medium hover:underline text-lg">kain.towns@maicorp.online</a>
        </div>
      </div>
    </div>
  );
}
