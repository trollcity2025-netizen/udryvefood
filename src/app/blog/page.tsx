export default function BlogPage() {
  const posts = [
    { title: 'The Future of Food Delivery', date: 'Oct 24, 2025', category: 'Industry' },
    { title: 'How We Support Local Restaurants', date: 'Oct 18, 2025', category: 'Community' },
    { title: 'New Features for Drivers', date: 'Oct 10, 2025', category: 'Product' },
    { title: 'Sustainability Goals for 2026', date: 'Sep 28, 2025', category: 'Environment' },
  ];

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-slate-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">UdryveFood Blog</h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto">
            News, updates, and stories from the UdryveFood team.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-8">
          {posts.map((post, index) => (
            <div key={index} className="group cursor-pointer">
              <div className="bg-slate-200 h-64 rounded-2xl mb-4 transition group-hover:opacity-90"></div>
              <div className="flex items-center text-sm text-blue-600 font-medium mb-2 space-x-2">
                <span>{post.category}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-500">{post.date}</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition">{post.title}</h3>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
