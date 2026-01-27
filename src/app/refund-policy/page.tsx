export default function RefundPolicyPage() {
  return (
    <div className="bg-white min-h-screen py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Refund Policy</h1>
        <div className="prose prose-slate max-w-none">
          <p className="text-slate-600 mb-4">Last updated: October 2025</p>
          <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">1. Order Cancellations</h3>
          <p className="text-slate-600 mb-4">
            You may cancel your order for a full refund within 5 minutes of placing it. After 5 minutes, or once the restaurant has started preparing your food, cancellations may not be eligible for a refund.
          </p>
          <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">2. Missing or Incorrect Items</h3>
          <p className="text-slate-600 mb-4">
            If you receive an order with missing or incorrect items, please report it through the app within 24 hours. We will issue a refund or credit for the affected items.
          </p>
          <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">3. Quality Issues</h3>
          <p className="text-slate-600 mb-4">
            If you are unsatisfied with the quality of your food, please contact support with photos of the issue. Refunds for quality issues are handled on a case-by-case basis.
          </p>
           <h3 className="text-xl font-bold text-slate-900 mt-8 mb-4">4. Processing Time</h3>
          <p className="text-slate-600 mb-4">
            Refunds are typically processed within 5-7 business days and returned to the original payment method.
          </p>
        </div>
      </div>
    </div>
  );
}
