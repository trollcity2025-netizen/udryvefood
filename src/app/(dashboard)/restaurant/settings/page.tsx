'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, Save, Upload, MapPin, Phone, Info, Utensils } from 'lucide-react';

export default function RestaurantSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const supabase = createClient();
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      restaurant_name: '',
      description: '',
      cuisine_type: '',
      address: '',
      phone_number: '',
      is_open: true
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
        .from('restaurant_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setValue('restaurant_name', data.restaurant_name || '');
        setValue('description', data.description || '');
        setValue('cuisine_type', data.cuisine_type || '');
        setValue('address', data.address || '');
        setValue('phone_number', data.phone_number || '');
        setValue('is_open', data.is_open);
        setImageUrl(data.image_url);
      }
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      setMessage({ type: 'error', text: 'Failed to load profile' });
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }
      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `restaurant-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      setImageUrl(data.publicUrl);
    } catch (error: any) {
        console.error('Error uploading image:', error);
        alert('Error uploading image');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: any) => {
    setSaving(true);
    setMessage(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { error } = await supabase
        .from('restaurant_profiles')
        .upsert({
          user_id: user.id,
          restaurant_name: data.restaurant_name,
          description: data.description,
          cuisine_type: data.cuisine_type,
          address: data.address,
          phone_number: data.phone_number,
          image_url: imageUrl,
          is_open: data.is_open
        });

      if (error) throw error;
      setMessage({ type: 'success', text: 'Profile saved successfully!' });
      
      // Update user metadata if name changed
      if (data.restaurant_name !== user.user_metadata.restaurantName) {
          await supabase.auth.updateUser({
              data: { restaurantName: data.restaurant_name }
          });
      }

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
        <h1 className="text-3xl font-bold text-slate-900">Restaurant Settings</h1>
        <p className="text-slate-500 mt-2">Manage your restaurant profile, contact info, and availability.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-900">General Information</h2>
            {message && (
                <div className={`px-4 py-2 rounded-lg text-sm font-medium ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                    {message.text}
                </div>
            )}
        </div>
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-8">
            {/* Image Upload */}
            <div className="flex flex-col sm:flex-row gap-6 items-start">
                <div className="relative group">
                    <div className="h-32 w-32 rounded-xl bg-slate-100 border-2 border-slate-200 overflow-hidden flex items-center justify-center">
                        {imageUrl ? (
                            <img src={imageUrl} alt="Restaurant" className="h-full w-full object-cover" />
                        ) : (
                            <Utensils className="h-10 w-10 text-slate-400" />
                        )}
                    </div>
                    <label className="absolute bottom-2 right-2 p-2 bg-white rounded-full shadow-md cursor-pointer hover:bg-slate-50 transition-colors border border-slate-200">
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin text-orange-600" /> : <Upload className="h-4 w-4 text-slate-600" />}
                        <input type="file" accept="image/*" onChange={uploadImage} disabled={uploading} className="hidden" />
                    </label>
                </div>
                <div className="flex-1">
                    <h3 className="font-medium text-slate-900">Restaurant Image</h3>
                    <p className="text-sm text-slate-500 mt-1 mb-4">
                        Upload a logo or a photo of your restaurant. This will be displayed to customers on the marketplace.
                    </p>
                    <div className="flex items-center space-x-2">
                         <div className="flex items-center h-5">
                            <input
                                id="is_open"
                                type="checkbox"
                                {...register('is_open')}
                                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-slate-300 rounded"
                            />
                        </div>
                        <label htmlFor="is_open" className="font-medium text-slate-700">
                            Currently Open for Orders
                        </label>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Restaurant Name</label>
                    <input 
                        {...register('restaurant_name', { required: 'Name is required' })} 
                        className="w-full rounded-lg border-slate-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2.5 border"
                        placeholder="e.g. Burger King"
                    />
                    {errors.restaurant_name && <p className="mt-1 text-sm text-red-600">{errors.restaurant_name.message as string}</p>}
                </div>

                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea 
                        {...register('description')} 
                        rows={3}
                        className="w-full rounded-lg border-slate-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2.5 border"
                        placeholder="Tell customers about your food..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cuisine Type</label>
                    <div className="relative">
                        <Utensils className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input 
                            {...register('cuisine_type')} 
                            className="w-full pl-9 rounded-lg border-slate-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2.5 border"
                            placeholder="e.g. Italian, Fast Food"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input 
                            {...register('phone_number')} 
                            className="w-full pl-9 rounded-lg border-slate-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2.5 border"
                            placeholder="(555) 123-4567"
                        />
                    </div>
                </div>

                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input 
                            {...register('address', { required: 'Address is required' })} 
                            className="w-full pl-9 rounded-lg border-slate-200 shadow-sm focus:border-orange-500 focus:ring-orange-500 sm:text-sm p-2.5 border"
                            placeholder="123 Main St, City, State"
                        />
                    </div>
                    {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address.message as string}</p>}
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
