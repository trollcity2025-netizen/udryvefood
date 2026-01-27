'use client';

import { useForm } from 'react-hook-form';
import { createClient } from '@/utils/supabase/client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload } from 'lucide-react';

export default function DriverApplicationForm() {
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
        .from('driver_applications')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setExistingApp(data);
        reset({
          ...data,
          // Clear file inputs as they can't be preset
          id_front: undefined,
          id_back: undefined,
          profile_photo: undefined
        });
      }
    }
    loadApplication();
  }, [supabase, reset]);

  const uploadFile = async (file: File, path: string, bucket: string) => {
    const { data, error } = await supabase.storage
      .from(bucket)
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

      // Upload files only if new ones are selected
      let idFrontPath = existingApp?.id_front_url;
      if (data.id_front?.[0]) {
        idFrontPath = await uploadFile(data.id_front[0], `${user.id}/id_front_${Date.now()}`, 'driver-documents');
      }

      let idBackPath = existingApp?.id_back_url;
      if (data.id_back?.[0]) {
        idBackPath = await uploadFile(data.id_back[0], `${user.id}/id_back_${Date.now()}`, 'driver-documents');
      }

      let profilePhotoPath = existingApp?.profile_photo_url;
      if (data.profile_photo?.[0]) {
        profilePhotoPath = await uploadFile(data.profile_photo[0], `${user.id}/profile_${Date.now()}`, 'avatars');
      }

      const applicationData = {
        user_id: user.id,
        legal_name: data.legal_name,
        phone: data.phone,
        email: data.email,
        dob: data.dob,
        address: data.address,
        driver_license_number: data.driver_license_number,
        driver_license_expiration: data.driver_license_expiration,
        license_state: data.license_state,
        vehicle_make: data.vehicle_make,
        vehicle_model: data.vehicle_model,
        vehicle_year: data.vehicle_year,
        vehicle_color: data.vehicle_color,
        vehicle_plate: data.vehicle_plate,
        insurance_provider: data.insurance_provider,
        insurance_policy_number: data.insurance_policy_number,
        insurance_expiration: data.insurance_expiration,
        background_check_consent: data.background_check_consent,
        id_front_url: idFrontPath,
        id_back_url: idBackPath,
        profile_photo_url: profilePhotoPath,
        payout_email: data.payout_email,
        emergency_contact_name: data.emergency_contact_name,
        emergency_contact_phone: data.emergency_contact_phone,
        status: 'submitted',
        submitted_at: new Date().toISOString()
      };

      if (existingApp) {
        const { error } = await supabase
          .from('driver_applications')
          .update(applicationData)
          .eq('id', existingApp.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('driver_applications')
          .insert(applicationData);
        if (error) throw error;
      }

      // Update user status
      const { error: userError } = await supabase
        .from('users')
        .update({ status: 'submitted' })
        .eq('id', user.id);

      if (userError) throw userError;

      alert('Application submitted successfully!');
      router.push('/customer/orders');
      router.refresh();

    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'An error occurred during submission.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white p-6 rounded-lg shadow-sm">
      {/* Personal Info */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
            <span className="bg-orange-100 text-orange-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
            Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Legal Name</label>
                <input {...register('legal_name', { required: true })} className="w-full rounded-lg border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500" placeholder="John Doe" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                <input type="date" {...register('dob', { required: true })} className="w-full rounded-lg border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                <input {...register('phone', { required: true })} className="w-full rounded-lg border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500" placeholder="(555) 123-4567" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contact Email</label>
                <input type="email" {...register('email', { required: true })} className="w-full rounded-lg border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500" placeholder="john@example.com" />
            </div>
             <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                <input {...register('address', { required: true })} className="w-full rounded-lg border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500" placeholder="123 Main St, City, State, ZIP" />
            </div>
        </div>
      </div>

      {/* Driver License */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
            <span className="bg-orange-100 text-orange-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
            Driver's License
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">License Number</label>
                <input {...register('driver_license_number', { required: true })} className="w-full rounded-lg border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500" />
            </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">State</label>
                <input {...register('license_state', { required: true })} className="w-full rounded-lg border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500" />
            </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Expiration Date</label>
                <input type="date" {...register('driver_license_expiration', { required: true })} className="w-full rounded-lg border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500" />
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center hover:border-orange-500 transition-colors relative bg-slate-50">
                <Upload className="h-8 w-8 text-slate-400 mb-2" />
                <label className="block text-sm font-medium text-slate-700 mb-1">Front of License</label>
                <p className="text-xs text-slate-500 mb-4">Upload a clear photo</p>
                <input type="file" accept="image/*" {...register('id_front', { required: !existingApp?.id_front_url })} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                {existingApp?.id_front_url && <div className="absolute bottom-2 right-2 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">✓ Uploaded</div>}
            </div>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 flex flex-col items-center justify-center hover:border-orange-500 transition-colors relative bg-slate-50">
                <Upload className="h-8 w-8 text-slate-400 mb-2" />
                <label className="block text-sm font-medium text-slate-700 mb-1">Back of License</label>
                <p className="text-xs text-slate-500 mb-4">Upload a clear photo</p>
                <input type="file" accept="image/*" {...register('id_back', { required: !existingApp?.id_back_url })} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                {existingApp?.id_back_url && <div className="absolute bottom-2 right-2 bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">✓ Uploaded</div>}
            </div>
        </div>
      </div>

      {/* Vehicle Info */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
            <span className="bg-orange-100 text-orange-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
            Vehicle Information
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Make</label>
                <input {...register('vehicle_make', { required: true })} className="w-full rounded-lg border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500" placeholder="e.g. Toyota" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Model</label>
                <input {...register('vehicle_model', { required: true })} className="w-full rounded-lg border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500" placeholder="e.g. Camry" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Year</label>
                <input {...register('vehicle_year', { required: true })} className="w-full rounded-lg border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500" placeholder="e.g. 2020" />
            </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                <input {...register('vehicle_color', { required: true })} className="w-full rounded-lg border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500" />
            </div>
             <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">License Plate</label>
                <input {...register('vehicle_plate', { required: true })} className="w-full rounded-lg border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500" />
            </div>
        </div>
      </div>

      {/* Insurance */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
            <span className="bg-orange-100 text-orange-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">4</span>
            Insurance
        </h3>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Provider</label>
                <input {...register('insurance_provider', { required: true })} className="w-full rounded-lg border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Policy Number</label>
                <input {...register('insurance_policy_number', { required: true })} className="w-full rounded-lg border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Expiration</label>
                <input type="date" {...register('insurance_expiration', { required: true })} className="w-full rounded-lg border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500" />
            </div>
        </div>
      </div>

       {/* Payout */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
            <span className="bg-orange-100 text-orange-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">5</span>
            Payout Details
        </h3>
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">PayPal Email</label>
            <input type="email" {...register('payout_email', { required: true })} className="w-full rounded-lg border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500" />
            <p className="text-xs text-slate-500 mt-1">This is where your earnings will be sent.</p>
        </div>
      </div>

       {/* Emergency Contact */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
            <span className="bg-orange-100 text-orange-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">6</span>
            Emergency Contact
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input {...register('emergency_contact_name', { required: true })} className="w-full rounded-lg border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500" />
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                <input {...register('emergency_contact_phone', { required: true })} className="w-full rounded-lg border-slate-300 shadow-sm focus:border-orange-500 focus:ring-orange-500" />
            </div>
        </div>
      </div>

       {/* Profile Photo */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
            <span className="bg-orange-100 text-orange-600 w-8 h-8 rounded-full flex items-center justify-center text-sm">7</span>
            Profile Photo
        </h3>
        <div className="flex items-center gap-6">
             <div className="h-24 w-24 rounded-full bg-slate-100 border-2 border-slate-200 overflow-hidden flex-shrink-0">
                {existingApp?.profile_photo_url ? (
                    <img 
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${existingApp.profile_photo_url}`} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Upload size={24} />
                    </div>
                )}
             </div>
             <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">Upload Photo</label>
                <input type="file" accept="image/*" {...register('profile_photo', { required: !existingApp?.profile_photo_url })} className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 transition-colors" />
                <p className="text-xs text-slate-500 mt-2">Please upload a clear headshot. No sunglasses or hats.</p>
            </div>
        </div>
      </div>

       {/* Consent */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
         <div className="flex items-start bg-slate-50 p-4 rounded-lg">
            <div className="flex items-center h-5">
              <input id="consent" type="checkbox" {...register('background_check_consent', { required: true })} className="focus:ring-orange-500 h-4 w-4 text-orange-600 border-slate-300 rounded" />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="consent" className="font-medium text-slate-900">Background Check Consent</label>
              <p className="text-slate-500 mt-1">I hereby consent to a background check as part of my application to drive with UdryveFood. I understand that my application status is subject to the results of this check.</p>
            </div>
         </div>
      </div>

      {/* Errors */}
      {uploadError && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg text-sm">
              {uploadError}
          </div>
      )}

      {/* Submit */}
      <div className="pt-6 flex justify-end">
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
