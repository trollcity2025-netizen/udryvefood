import { Search } from 'lucide-react';

export default function HelpPage() {
  const faqs = [
    { question: 'How do I track my order?', answer: 'You can track your order in real-time from the "Orders" tab in your dashboard.' },
    { question: 'What payment methods do you accept?', answer: 'We accept all major credit cards, PayPal, and Apple Pay.' },
    { question: 'How do I become a driver?', answer: 'Click on "Become a Driver" in the navigation menu to start your application.' },
    { question: 'Can I cancel my order?', answer: 'You can cancel your order within 5 minutes of placing it for a full refund.' },
  ];

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold mb-6">How can we help?</h1>
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
            <input 
              type="text" 
              placeholder="Search for articles..." 
              className="w-full pl-12 pr-4 py-4 rounded-full text-slate-900 focus:outline-none focus:ring-4 focus:ring-blue-400 shadow-lg"
            />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl font-bold text-slate-900 mb-8">Frequently Asked Questions</h2>
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-slate-50 p-6 rounded-xl">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">{faq.question}</h3>
              <p className="text-slate-600">{faq.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
