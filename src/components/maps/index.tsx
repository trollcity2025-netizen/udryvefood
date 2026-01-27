'use client';

import dynamic from 'next/dynamic';

const DriverMap = dynamic(() => import('./DriverMap'), {
  ssr: false,
  loading: () => <div className="h-[400px] w-full bg-slate-100 animate-pulse rounded-lg flex items-center justify-center text-slate-400">Loading Map...</div>
});

export default DriverMap;
