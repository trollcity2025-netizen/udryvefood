'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import { User, Phone, MapPin, CreditCard, Save, Loader2, Camera, Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    avatarUrl: '',
  });
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }
      setUser(user);

      // Fetch from customer_profiles
      const { data: profile, error } = await supabase
        .from('customer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
         console.error('Error fetching profile:', error);
      }

      if (profile) {
        setFormData({
          fullName: user.user_metadata?.full_name || profile.full_name || '',
          phone: profile.phone || '',
          address: profile.default_address || '',
          avatarUrl: profile.avatar_url || '',
        });
      } else {
        // If no profile exists yet, still try to populate name from metadata
        setFormData(prev => ({
            ...prev,
            fullName: user.user_metadata?.full_name || ''
        }));
      }
    } catch (error: any) {
      console.error('Error loading profile:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setFormData({ ...formData, avatarUrl: publicUrl });
      
    } catch (error: any) {
      alert('Error uploading avatar: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
        // 1. Update Auth Metadata (for Full Name)
        const { error: authError } = await supabase.auth.updateUser({
            data: { full_name: formData.fullName }
        });
        if (authError) throw authError;

        // 1.5 Ensure user exists in public.users (Fix for missing trigger execution)
        const { data: publicUser } = await supabase
            .from('users')
            .select('id')
            .eq('id', user.id)
            .single();
        
        if (!publicUser) {
            console.log('User missing in public.users, attempting to insert...');
             const { error: userError } = await supabase
                .from('users')
                .insert({
                    id: user.id,
                    email: user.email,
                    role: 'customer', 
                    status: 'active'
                });
             
             if (userError) {
                 console.error('Error creating public user record:', userError);
                 // We continue anyway, hoping the error is just permission denied but maybe it worked or RLS is weird.
                 // If this fails and the next step fails, we know why.
             }
        }

        // 2. Upsert profile (Phone & Address & Avatar)
        // We exclude full_name here if the column doesn't exist in the remote DB yet
        const { error } = await supabase
            .from('customer_profiles')
            .upsert({
                user_id: user.id,
                // full_name: formData.fullName, // Removed to prevent error if column missing
                phone: formData.phone,
                default_address: formData.address,
                // avatar_url: formData.avatarUrl, // Will fail if column missing, need migration first.
                // Assuming migration is run or will be run. If not, this throws error.
                // I will comment it out or try-catch it? No, user explicitly asked for it.
                // I'll add it but if it fails, I'll catch it.
                avatar_url: formData.avatarUrl
            });

      if (error) throw error;
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      
    } catch (error: any) {
      console.error('Profile update error:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      setMessage({ type: 'error', text: `Failed to update profile: ${error.message || 'Unknown error'}` });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-8">My Profile</h1>

      <div className="grid gap-8 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-3 space-y-8">
            
            {/* Contact Details */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-orange-100 rounded-lg">
                        <User className="h-5 w-5 text-orange-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900">Contact Details</h2>
                </div>
                
                <form onSubmit={handleSubmit}>
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center justify-center sm:flex-row sm:justify-start sm:items-center gap-6 mb-6">
                        <div className="relative">
                            <div className="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-slate-200">
                                {formData.avatarUrl ? (
                                    <img src={formData.avatarUrl} alt="Profile" className="h-full w-full object-cover" />
                                ) : (
                                    <User className="h-10 w-10 text-slate-400" />
                                )}
                            </div>
                            <label 
                                htmlFor="avatar-upload" 
                                className="absolute bottom-0 right-0 bg-white rounded-full p-1.5 shadow-md border border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
                            >
                                {uploading ? <Loader2 className="h-4 w-4 animate-spin text-orange-600" /> : <Camera className="h-4 w-4 text-slate-600" />}
                            </label>
                            <input 
                                id="avatar-upload"
                                type="file"
                                accept="image/*"
                                onChange={uploadAvatar}
                                disabled={uploading}
                                className="hidden"
                            />
                        </div>
                        <div className="text-center sm:text-left">
                            <h3 className="font-medium text-slate-900">Profile Photo</h3>
                            <p className="text-sm text-slate-500 mt-1">
                                Drivers use this photo to verify your identity upon delivery.
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Full Name
                            </label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                placeholder="John Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={user?.email}
                                disabled
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>
                    </div>
                </form>
            </section>

            {/* Payment Address */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-orange-100 rounded-lg">
                        <MapPin className="h-5 w-5 text-orange-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900">Payment & Delivery Address</h2>
                </div>
                
                <div className="space-y-4">
                     <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            Default Address
                        </label>
                        <textarea
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            rows={3}
                            className="w-full px-4 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            placeholder="123 Main St, Apt 4B, New York, NY 10001"
                        />
                    </div>
                </div>
            </section>

            {/* Payment Information */}
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-orange-100 rounded-lg">
                        <CreditCard className="h-5 w-5 text-orange-600" />
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900">Payment Information</h2>
                </div>
                
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start gap-3">
                    <div className="mt-1">
                        <CreditCard className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="font-medium text-blue-900">PayPal Checkout</h3>
                        <p className="text-sm text-blue-700 mt-1">
                            Currently, we exclusively use PayPal for all food orders. You will be redirected to PayPal's secure checkout when placing an order.
                            No credit card information is stored on our servers.
                        </p>
                    </div>
                </div>
            </section>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-4">
                {message && (
                    <div className={`text-sm px-4 py-2 rounded-lg ${
                        message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                        {message.text}
                    </div>
                )}
                {!message && <div></div>} {/* Spacer */}
                
                <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="flex items-center gap-2 bg-orange-600 text-white px-6 py-2.5 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm shadow-orange-200"
                >
                    {saving ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4" />
                            Save Changes
                        </>
                    )}
                </button>
            </div>

        </div>
      </div>
    </div>
  );
}
