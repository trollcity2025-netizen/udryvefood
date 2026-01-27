
export default function AboutPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="bg-slate-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-4">About UdryveFood</h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            Revolutionizing food delivery with speed, reliability, and community focus.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Our Mission</h2>
            <p className="text-slate-600 mb-4 text-lg">
              At UdryveFood, we believe that great food should be accessible to everyone, everywhere. We're building a platform that empowers local restaurants and provides flexible earning opportunities for drivers.
            </p>
            <p className="text-slate-600 text-lg">
              We're not just a delivery service; we're a community partner committed to sustainability and economic growth.
            </p>
          </div>
          <div className="bg-slate-100 rounded-2xl h-80 flex items-center justify-center">
             <span className="text-slate-400 font-medium">About Image Placeholder</span>
          </div>
        </div>
      </div>
    </div>
  );
}
