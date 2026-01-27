import { Mail, Phone, MapPin } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Contact Us</h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto">
            We're here to help. Get in touch with us for any questions or support.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div>
             <h2 className="text-2xl font-bold text-slate-900 mb-8">Get in Touch</h2>
             <div className="space-y-6">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <Mail className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                        <h3 className="text-lg font-medium text-slate-900">Email</h3>
                        <p className="mt-1 text-slate-500">kain.towns@maicorp.online</p>
                    </div>
                </div>
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <Phone className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                        <h3 className="text-lg font-medium text-slate-900">Phone</h3>
                        <p className="mt-1 text-slate-500">720-990-6781</p>
                    </div>
                </div>
                 <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <MapPin className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-4">
                        <h3 className="text-lg font-medium text-slate-900">Headquarters</h3>
                        <p className="mt-1 text-slate-500">Denver, Co</p>
                    </div>
                </div>
             </div>
          </div>

          {/* Contact Form */}
          <div className="bg-slate-50 p-8 rounded-2xl">
             <form className="space-y-6">
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-700">Name</label>
                    <input type="text" id="name" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2" />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-700">Email</label>
                    <input type="email" id="email" className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2" />
                </div>
                <div>
                    <label htmlFor="message" className="block text-sm font-medium text-slate-700">Message</label>
                    <textarea id="message" rows={4} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"></textarea>
                </div>
                <button type="button" className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Send Message</button>
             </form>
          </div>
        </div>
      </div>
    </div>
  );
}
