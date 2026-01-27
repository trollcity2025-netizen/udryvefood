'use client';

import { useForm } from 'react-hook-form';
import { createClient } from '@/utils/supabase/client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RestaurantApplicationForm() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [submitting, setSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [existingApp, setExistingApp] = useState<any>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function loadApplication() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('restaurant_applications')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setExistingApp(data);
        reset({
          ...data,
          business_license: undefined,
          food_handler_permit: undefined,
          logo: undefined,
          cover_photo: undefined
        });
      }
    }
    loadApplication();
  }, [supabase, reset]);

  const uploadFile = async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from('applications')
      .upload(path, file, { upsert: true });
    
    if (error) throw error;
    return data.path;
  };

  const onSubmit = async (data: any) => {
    setSubmitting(true);
    setUploadError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Upload files
      let businessLicensePath = existingApp?.business_license_url;
      if (data.business_license?.[0]) {
        businessLicensePath = await uploadFile(data.business_license[0], `${user.id}/business_license_${Date.now()}`);
      }

      let foodHandlerPath = existingApp?.food_handler_permit_url;
      if (data.food_handler_permit?.[0]) {
        foodHandlerPath = await uploadFile(data.food_handler_permit[0], `${user.id}/food_handler_${Date.now()}`);
      }

      let logoPath = existingApp?.logo_url;
      if (data.logo?.[0]) {
        logoPath = await uploadFile(data.logo[0], `${user.id}/logo_${Date.now()}`);
      }

      let coverPhotoPath = existingApp?.cover_photo_url;
      if (data.cover_photo?.[0]) {
        coverPhotoPath = await uploadFile(data.cover_photo[0], `${user.id}/cover_${Date.now()}`);
      }

      const applicationData = {
        user_id: user.id,
        restaurant_name: data.restaurant_name,
        owner_name: data.owner_name,
        phone: data.phone,
        email: data.email,
        address: data.address,
        business_license_url: businessLicensePath,
        food_handler_permit_url: foodHandlerPath,
        payout_email: data.payout_email,
        operating_hours: data.operating_hours,
        cuisine_categories: typeof data.cuisine_categories === 'string' 
          ? data.cuisine_categories.split(',').map((s: string) => s.trim()) 
          : data.cuisine_categories,
        logo_url: logoPath,
        cover_photo_url: coverPhotoPath,
        is_menu_ready: data.is_menu_ready,
        menu_notes: data.menu_notes,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      };

      if (existingApp) {
        const { error } = await supabase
          .from('restaurant_applications')
          .update(applicationData)
          .eq('id', existingApp.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('restaurant_applications')
          .insert(applicationData);
        if (error) throw error;
      }

      // Update user status
      const { error: userError } = await supabase
        .from('users')
        .update({ status: 'submitted' })
        .eq('id', user.id);

      if (userError) throw userError;

      router.push('/onboarding');
      router.refresh();

    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Business Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-900 border-b pb-2">Business Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-slate-700">Restaurant Name</label>
                <input {...register('restaurant_name', { required: true })} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700">Owner Name</label>
                <input {...register('owner_name', { required: true })} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700">Business Phone</label>
                <input {...register('phone', { required: true })} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700">Business Email</label>
                <input type="email" {...register('email', { required: true })} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2" />
            </div>
             <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700">Address</label>
                <input {...register('address', { required: true })} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2" />
            </div>
        </div>
      </div>

      {/* Operation Info */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-900 border-b pb-2">Operations</h3>
        <div className="grid grid-cols-1 gap-4">
             <div>
                <label className="block text-sm font-medium text-slate-700">Cuisine Categories (comma separated)</label>
                <input {...register('cuisine_categories', { required: true })} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2" placeholder="e.g. Italian, Pizza, Fast Food" />
            </div>
             <div>
                <label className="block text-sm font-medium text-slate-700">Operating Hours</label>
                <textarea {...register('operating_hours', { required: true })} rows={3} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2" placeholder="e.g. Mon-Fri: 9am - 9pm&#10;Sat-Sun: 10am - 10pm" />
            </div>
        </div>
      </div>

      {/* Documents */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-900 border-b pb-2">Documents & Branding</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-slate-700">Business License</label>
                <input type="file" {...register('business_license', { required: !existingApp?.business_license_url })} className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                {existingApp?.business_license_url && <p className="text-xs text-green-600 mt-1">✓ File uploaded. Upload new to replace.</p>}
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700">Food Handler Permit</label>
                <input type="file" {...register('food_handler_permit', { required: !existingApp?.food_handler_permit_url })} className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                {existingApp?.food_handler_permit_url && <p className="text-xs text-green-600 mt-1">✓ File uploaded. Upload new to replace.</p>}
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700">Restaurant Logo</label>
                <input type="file" accept="image/*" {...register('logo', { required: !existingApp?.logo_url })} className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                {existingApp?.logo_url && <p className="text-xs text-green-600 mt-1">✓ File uploaded. Upload new to replace.</p>}
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700">Cover Photo</label>
                <input type="file" accept="image/*" {...register('cover_photo', { required: !existingApp?.cover_photo_url })} className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                {existingApp?.cover_photo_url && <p className="text-xs text-green-600 mt-1">✓ File uploaded. Upload new to replace.</p>}
            </div>
        </div>
      </div>

       {/* Menu & Payout */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-slate-900 border-b pb-2">Menu & Payout</h3>
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-700">PayPal Email</label>
                <input type="email" {...register('payout_email', { required: true })} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2" />
                <p className="text-xs text-slate-500 mt-1">This is where your earnings will be sent.</p>
            </div>
             <div className="flex items-start">
                <div className="flex items-center h-5">
                    <input id="menu_ready" type="checkbox" {...register('is_menu_ready')} className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-slate-300 rounded" />
                </div>
                <div className="ml-3 text-sm">
                    <label htmlFor="menu_ready" className="font-medium text-slate-700">Menu is ready to upload?</label>
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700">Menu Notes</label>
                <textarea {...register('menu_notes')} rows={3} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2" placeholder="Describe your menu or paste a link to your current online menu..." />
            </div>
        </div>
      </div>

      {/* Errors */}
      {uploadError && (
          <div className="bg-red-50 text-red-700 p-4 rounded-md">
              {uploadError}
          </div>
      )}

      {/* Submit */}
      <div className="pt-6">
        <button
          type="submit"
          disabled={submitting}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {submitting ? 'Submitting Application...' : (existingApp ? 'Update Application' : 'Submit Application')}
        </button>
      </div>
    </form>
  );
}
