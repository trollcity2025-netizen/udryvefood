'use client';

import { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Bell, Lock, Globe, Layout, Share2, CreditCard } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function AdminSettings() {
  const [loading, setLoading] = useState(false);
  const [socialLinks, setSocialLinks] = useState({
    facebook: '',
    twitter: '',
    instagram: '',
    linkedin: ''
  });
  const [paymentMethods, setPaymentMethods] = useState('');
  const supabase = createClient();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data: socialData } = await supabase.from('app_settings').select('value').eq('key', 'social_links').single();
        if (socialData?.value) setSocialLinks({ ...socialLinks, ...socialData.value });
        
        const { data: paymentData } = await supabase.from('app_settings').select('value').eq('key', 'payment_methods').single();
        if (paymentData?.value && Array.isArray(paymentData.value)) {
            setPaymentMethods(paymentData.value.join(', '));
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
        // Save Social Links
        const { error: socialError } = await supabase.from('app_settings').upsert({
            key: 'social_links',
            value: socialLinks
        });
        if (socialError) throw socialError;

        // Save Payment Methods
        const methodsArray = paymentMethods.split(',').map(s => s.trim()).filter(s => s);
        const { error: paymentError } = await supabase.from('app_settings').upsert({
            key: 'payment_methods',
            value: methodsArray
        });
        if (paymentError) throw paymentError;

        alert('Footer settings saved successfully!');
    } catch (error: any) {
        alert('Error saving settings: ' + error.message);
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Platform Settings</h1>
      
      <div className="bg-white rounded-xl shadow-sm divide-y divide-slate-200 border border-slate-200">
        
        {/* Footer Settings Section */}
        <div className="p-6">
            <h2 className="text-lg font-medium text-slate-900 mb-4 flex items-center">
                <Layout className="h-5 w-5 mr-2 text-slate-500" />
                Footer Configuration
            </h2>
            
            <div className="space-y-6">
                {/* Social Links */}
                <div>
                    <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center">
                        <Share2 className="h-4 w-4 mr-2" /> Social Media Links
                    </h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Facebook URL</label>
                            <input 
                                type="text" 
                                value={socialLinks.facebook}
                                onChange={(e) => setSocialLinks({...socialLinks, facebook: e.target.value})}
                                placeholder="https://facebook.com/..."
                                className="block w-full border border-slate-200 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Twitter URL</label>
                            <input 
                                type="text" 
                                value={socialLinks.twitter}
                                onChange={(e) => setSocialLinks({...socialLinks, twitter: e.target.value})}
                                placeholder="https://twitter.com/..."
                                className="block w-full border border-slate-200 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">Instagram URL</label>
                            <input 
                                type="text" 
                                value={socialLinks.instagram}
                                onChange={(e) => setSocialLinks({...socialLinks, instagram: e.target.value})}
                                placeholder="https://instagram.com/..."
                                className="block w-full border border-slate-200 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm" 
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1">LinkedIn URL</label>
                            <input 
                                type="text" 
                                value={socialLinks.linkedin}
                                onChange={(e) => setSocialLinks({...socialLinks, linkedin: e.target.value})}
                                placeholder="https://linkedin.com/..."
                                className="block w-full border border-slate-200 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm" 
                            />
                        </div>
                    </div>
                </div>

                {/* Payment Methods */}
                <div>
                    <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center">
                        <CreditCard className="h-4 w-4 mr-2" /> Payment Methods
                    </h3>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Accepted Methods (comma separated)</label>
                        <input 
                            type="text" 
                            value={paymentMethods}
                            onChange={(e) => setPaymentMethods(e.target.value)}
                            placeholder="Visa, Mastercard, PayPal, Apple Pay"
                            className="block w-full border border-slate-200 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-orange-500 focus:border-orange-500 sm:text-sm" 
                        />
                        <p className="mt-1 text-xs text-slate-400">Enter the names of payment methods you accept.</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Existing General Settings (Static for now) */}
        <div className="p-6">
            <h2 className="text-lg font-medium text-slate-900 mb-4 flex items-center">
                <Globe className="h-5 w-5 mr-2 text-slate-500" />
                General Settings (Read Only)
            </h2>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6 opacity-60">
                <div className="sm:col-span-3">
                    <label className="block text-sm font-medium text-slate-700">Platform Name</label>
                    <input type="text" defaultValue="UdryveFood" readOnly className="mt-1 block w-full border border-slate-200 rounded-lg shadow-sm py-2.5 px-3 bg-slate-50 sm:text-sm text-slate-900" />
                </div>
                <div className="sm:col-span-3">
                    <label className="block text-sm font-medium text-slate-700">Support Email</label>
                    <input type="email" defaultValue="support@udryvefood.com" readOnly className="mt-1 block w-full border border-slate-200 rounded-lg shadow-sm py-2.5 px-3 bg-slate-50 sm:text-sm text-slate-900" />
                </div>
            </div>
        </div>
        
        <div className="p-6 bg-slate-50/60 rounded-b-xl flex justify-end">
            <button 
                onClick={handleSave}
                disabled={loading}
                className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
                {loading ? 'Saving...' : 'Save Footer Settings'}
            </button>
        </div>
      </div>
    </div>
  );
}