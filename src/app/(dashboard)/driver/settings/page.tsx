'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, Save, Car, MapPin, Power } from 'lucide-react';

export default function DriverSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const supabase = createClient();
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    defaultValues: {
      vehicle_type: '',
      vehicle_plate: '',
      is_online: false
    }
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('driver_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setValue('vehicle_type', data.vehicle_type || '');
        setValue('vehicle_plate', data.vehicle_plate || '');
        setValue('is_online', data.is_online || false);
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    setSaving(true);
    setMessage(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('driver_profiles')
        .upsert({
          user_id: user.id,
          vehicle_type: data.vehicle_type,
          vehicle_plate: data.vehicle_plate,
          is_online: data.is_online,
          last_updated: new Date().toISOString()
        });

      if (error) throw error;
      setMessage({ type: 'success', text: 'Profile saved successfully!' });
      
    } catch (error: any) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: 'Failed to save profile: ' + error.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading settings...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Driver Settings</h1>
        <p className="text-slate-500 mt-2">Manage your vehicle details and availability status.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-900">Vehicle & Status</h2>
            {message && (
                <div className={`px-4 py-2 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center border-2 border-slate-200">
                    <Car className="h-10 w-10 text-slate-400" />
                </div>
                <div className="flex-1">
                     <div className="flex items-center space-x-2 mb-4">
                         <div className="flex items-center h-5">
                            <input
                                id="is_online"
                                type="checkbox"
                                {...register('is_online')}
                                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-slate-300 rounded"
                            />
                        </div>
                        <label htmlFor="is_online" className="font-medium text-slate-700">
                            I am Online and Ready for Orders
                        </label>
                    </div>
                    <p className="text-sm text-slate-500">
                        Toggle this switch to start or stop receiving delivery requests.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Type</label>
                    <div className="relative">
                        <Car className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input 
                            {...register('vehicle_type', { required: 'Vehicle type is required' })} 
                            className="w-full pl-9 rounded-lg border-slate-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2.5 border"
                            placeholder="e.g. Toyota Camry, Honda Civic"
                        />
                    </div>
                    {errors.vehicle_type && <p className="mt-1 text-sm text-red-600">{errors.vehicle_type.message as string}</p>}
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">License Plate</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input 
                            {...register('vehicle_plate', { required: 'License plate is required' })} 
                            className="w-full pl-9 rounded-lg border-slate-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2.5 border"
                            placeholder="e.g. ABC-1234"
                        />
                    </div>
                    {errors.vehicle_plate && <p className="mt-1 text-sm text-red-600">{errors.vehicle_plate.message as string}</p>}
                </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 transition-colors"
                >
                    {saving ? (
                        <>
                            <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="-ml-1 mr-2 h-4 w-4" />
                            Save Changes
                        </>
                    )}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
}
