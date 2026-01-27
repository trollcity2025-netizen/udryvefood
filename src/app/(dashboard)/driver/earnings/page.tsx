'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { DollarSign, Calendar, TrendingUp, Wallet, ArrowRight, AlertCircle } from 'lucide-react';
import { format, startOfWeek, isSameWeek } from 'date-fns';

export default function DriverEarningsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [balance, setBalance] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    thisWeek: 0,
    today: 0
  });
  const [loading, setLoading] = useState(true);
  const [isCashoutModalOpen, setIsCashoutModalOpen] = useState(false);
  const [cashoutAmount, setCashoutAmount] = useState('');
  const [cashoutStep, setCashoutStep] = useState(1);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [payoutFrozen, setPayoutFrozen] = useState(false);
  const [holdTotal, setHoldTotal] = useState(0);

  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('driver_profiles')
        .select('current_balance, payout_frozen')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setBalance(profile.current_balance || 0);
        setPayoutFrozen(!!profile.payout_frozen);
      }

      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          id,
          created_at,
          total_amount,
          driver_payout,
          restaurant_profiles:restaurant_id (restaurant_name)
        `)
        .eq('driver_id', user.id)
        .eq('status', 'delivered')
        .order('created_at', { ascending: false });

      const formattedOrders = (ordersData || []).map(order => ({
        ...order,
        // Fallback to 20% if driver_payout is 0 (old orders)
        earnings: order.driver_payout > 0 ? order.driver_payout : (order.total_amount * 0.20)
      }));
      setOrders(formattedOrders);

      const { data: holdOrders } = await supabase
        .from('orders')
        .select('driver_payout')
        .eq('driver_id', user.id)
        .eq('payout_hold', true);

      if (holdOrders) {
        const totalHold = holdOrders.reduce(
          (acc, curr) => acc + (curr.driver_payout || 0),
          0
        );
        setHoldTotal(totalHold);
      }

      const { data: payoutsData } = await supabase
        .from('payouts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
        
      setPayouts(payoutsData || []);

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday start

      const total = formattedOrders.reduce((acc, curr) => acc + curr.earnings, 0);
      const todaySum = formattedOrders
        .filter(e => new Date(e.created_at) >= today)
        .reduce((acc, curr) => acc + curr.earnings, 0);
      const weekSum = formattedOrders
        .filter(e => new Date(e.created_at) >= weekStart)
        .reduce((acc, curr) => acc + curr.earnings, 0);

      setStats({
        total,
        thisWeek: weekSum,
        today: todaySum
      });

    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getFreePayoutAvailable = () => {
    const now = new Date();
    // Count instant payouts this week (Monday start)
    const thisWeekPayouts = payouts.filter(p => 
      p.payout_type === 'instant' && 
      isSameWeek(new Date(p.created_at), now, { weekStartsOn: 1 })
    );
    // If user has 0 instant payouts this week, they have 1 free.
    // Wait, the rule is "1 free instant cash-out".
    // If they already did one, is it free?
    // We should check if they used their free slot. 
    // The RPC logic checks: `fee = 0`.
    // So we count how many `fee = 0` instant payouts occurred this week.
    const freeUsed = thisWeekPayouts.some(p => p.fee === 0);
    return !freeUsed;
  };

  const handleCashOut = async () => {
    if (payoutFrozen) {
      setError('Payouts are currently frozen for your account.');
      return;
    }
    setError(null);
    setProcessing(true);
    try {
      const amount = parseFloat(cashoutAmount);
      if (isNaN(amount) || amount <= 0) throw new Error('Invalid amount');
      if (amount > balance) throw new Error('Insufficient balance');

      const { data, error } = await supabase.rpc('request_driver_payout', {
        p_amount: amount,
        p_is_instant: true
      });

      if (error) throw error;

      setSuccess(`Successfully cashed out $${amount.toFixed(2)}!`);
      setIsCashoutModalOpen(false);
      setCashoutAmount('');
      setCashoutStep(1);
      fetchData(); // Refresh data
      
      // Clear success message after 3s
      setTimeout(() => setSuccess(null), 3000);

    } catch (err: any) {
      setError(err.message || 'Failed to cash out');
    } finally {
      setProcessing(false);
    }
  };

  const isFree = getFreePayoutAvailable();
  const fee = isFree ? 0 : 2.00;
  const amountNum = parseFloat(cashoutAmount) || 0;
  const maxCashout = isFree ? balance : Math.max(0, balance - 2.0);

  if (loading) return <div className="p-8 text-center">Loading earnings...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Wallet & Earnings</h1>
        <div className="text-sm text-slate-500">
          {format(new Date(), 'EEEE, MMMM d, yyyy')}
        </div>
      </div>

      {payoutFrozen && (
        <div className="mb-6 bg-red-50 border border-red-100 rounded-lg p-4 text-sm text-red-800 flex items-center">
          <AlertCircle className="w-4 h-4 mr-2" />
          <span>Your payouts are currently frozen. Please contact support for more information.</span>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-emerald-50 text-emerald-700 p-4 rounded-lg flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            {success}
        </div>
      )}

      {/* Main Balance Card */}
      <div className="bg-slate-900 rounded-2xl p-8 text-white mb-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <p className="text-slate-400 font-medium mb-1">Available Balance</p>
            <h2 className="text-5xl font-bold mb-2">${balance.toFixed(2)}</h2>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Wallet className="w-4 h-4" />
              <span>Auto-payouts every Monday</span>
            </div>
            {holdTotal > 0 && (
              <div className="mt-3 flex items-center text-xs text-amber-300 bg-amber-500/10 px-3 py-2 rounded-full">
                <AlertCircle className="w-3 h-3 mr-1" />
                <span>Earnings on hold: ${holdTotal.toFixed(2)} under review</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsCashoutModalOpen(true)}
            disabled={balance < 10 || payoutFrozen}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            Cash Out Now
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        {balance < 10 && (
            <div className="mt-4 text-xs text-slate-400 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Minimum $10.00 required for instant cash-out
            </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-slate-500 font-medium">Total Earned</h3>
                <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
                    <DollarSign className="w-5 h-5" />
                </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">${stats.total.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-slate-500 font-medium">This Week</h3>
                <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                    <Calendar className="w-5 h-5" />
                </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">${stats.thisWeek.toFixed(2)}</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-start mb-2">
                <h3 className="text-slate-500 font-medium">Today</h3>
                <div className="bg-orange-50 p-2 rounded-lg text-orange-600">
                    <TrendingUp className="w-5 h-5" />
                </div>
            </div>
            <p className="text-3xl font-bold text-slate-900">${stats.today.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Earnings (Orders) */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-900">Recent Deliveries</h2>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-sm sticky top-0">
                        <tr>
                            <th className="px-6 py-3 font-medium">Date</th>
                            <th className="px-6 py-3 font-medium">Restaurant</th>
                            <th className="px-6 py-3 font-medium text-right">Earned</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                                    No completed deliveries yet.
                                </td>
                            </tr>
                        ) : (
                            orders.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition">
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {format(new Date(item.created_at), 'MMM d, h:mm a')}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-900">
                                        {item.restaurant_profiles?.restaurant_name}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-emerald-600 text-right">
                                        +${item.earnings.toFixed(2)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Payout History */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-900">Payout History</h2>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-500 text-sm sticky top-0">
                        <tr>
                            <th className="px-6 py-3 font-medium">Date</th>
                            <th className="px-6 py-3 font-medium">Type</th>
                            <th className="px-6 py-3 font-medium text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {payouts.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                                    No payouts yet.
                                </td>
                            </tr>
                        ) : (
                            payouts.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50 transition">
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {format(new Date(item.created_at), 'MMM d, h:mm a')}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-900 capitalize">
                                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                            item.payout_type === 'instant' ? 'bg-purple-50 text-purple-700' : 'bg-blue-50 text-blue-700'
                                        }`}>
                                            {item.payout_type}
                                        </span>
                                        {item.fee > 0 && <span className="text-xs text-slate-400 ml-2">(-${item.fee})</span>}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-900 text-right">
                                        ${item.amount.toFixed(2)}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      {/* Cashout Modal */}
      {isCashoutModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                <div className="p-6 border-b border-slate-100">
                    <h3 className="text-xl font-bold text-slate-900">Instant Cash Out</h3>
                    <p className="text-slate-500 text-sm mt-1">Transfer funds to your linked account</p>
                </div>
                
                <div className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
                            {error}
                        </div>
                    )}

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex justify-between mb-1">
                            <span className="text-slate-500 text-sm">Available Balance</span>
                            <span className="text-slate-900 font-bold">${balance.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500 text-sm">Max Instant Transfer</span>
                            <span className="text-emerald-600 font-bold">${maxCashout.toFixed(2)}</span>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Amount to Cash Out</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input 
                                type="number" 
                                value={cashoutAmount}
                                onChange={(e) => setCashoutAmount(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-bold text-lg"
                                placeholder="0.00"
                                max={maxCashout}
                            />
                            <button 
                                onClick={() => setCashoutAmount(maxCashout.toString())}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600 hover:text-emerald-700 uppercase"
                            >
                                Max
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500">Transfer Fee</span>
                            <span className={`font-medium ${isFree ? 'text-emerald-600' : 'text-slate-900'}`}>
                                {isFree ? 'FREE' : '$2.00'}
                            </span>
                        </div>
                        {isFree && (
                            <div className="text-xs text-emerald-600 text-right">
                                This instant cash-out will be free
                            </div>
                        )}
                        {!isFree && (
                            <div className="text-xs text-slate-400 text-right">
                                Free instant cash-out already used this week
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-6 bg-slate-50 flex gap-3">
                    <button 
                        onClick={() => setIsCashoutModalOpen(false)}
                        className="flex-1 py-3 px-4 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                        disabled={processing}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={handleCashOut}
                        disabled={processing || !cashoutAmount || parseFloat(cashoutAmount) <= 0 || parseFloat(cashoutAmount) > maxCashout}
                        className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-emerald-500 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:shadow-none flex justify-center items-center gap-2"
                    >
                        {processing ? 'Processing...' : 'Confirm Cash Out'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
}
