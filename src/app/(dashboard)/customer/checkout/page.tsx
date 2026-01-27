'use client';

import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import Link from 'next/link';
import AddressAutocomplete from '@/components/common/AddressAutocomplete';

export default function CheckoutPage() {
  const { items, total: foodSubtotal, clearCart } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, getValues, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      address: '',
      tips: '0'
    }
  });

  const tipAmountStr = watch('tips');
  const tipAmount = parseFloat(tipAmountStr || '0');

  // Calculate fees
  const deliveryFee = foodSubtotal * 0.05;
  const serviceFee = foodSubtotal * 0.10; // 10% Service Fee
  const tax = foodSubtotal * 0.08; // 8% Tax
  
  const grandTotal = foodSubtotal + deliveryFee + serviceFee + tax + tipAmount;

  // Driver Bonus Logic
  const getDriverBonus = () => {
    const today = new Date().getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const isWeekend = today === 0 || today === 5 || today === 6; // Fri, Sat, Sun
    return isWeekend ? 1.00 : 0.50;
  };

  const handlePaymentSuccess = async (paypalOrderId: string) => {
    setLoading(true);
    try {
      const address = getValues('address');
      const response = await fetch('/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          items,
          address,
          tipAmount,
          paypalOrderId
        })
      });

      const json = await response.json();
      if (!response.ok) {
        throw new Error(json.error || 'Failed to place order');
      }

      clearCart();
      router.push(`/customer/orders/${json.orderId}`);
      
    } catch (err: any) {
      console.error(err);
      alert('Error placing order: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (items.length === 0) {
      router.push('/customer/cart');
    }
  }, [items, router]);

  if (items.length === 0) {
     return null;
  }

  const initialOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'AeIpeTmYOtXWW96k11Z6fpUzoQos7FrMJBDCGtl_M6Z9fQ8tyEO8e2gJLNiWQFLN3B4wx1Ty20hNC8EB',
    currency: 'USD',
    intent: 'capture'
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Checkout</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <div>
              <h3 className="text-lg font-medium text-slate-900 mb-4">Order Summary</h3>
              <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 shadow-sm">
                  <ul className="space-y-4 mb-4">
                      {items.map((item, idx) => (
                          <li key={`${item.id}-${idx}`} className="flex flex-col text-slate-700">
                              <div className="flex justify-between">
                                  <span>{item.quantity}x {item.name}</span>
                                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                              {item.notes && (
                                  <span className="text-xs text-orange-600 italic ml-4 mt-1">
                                      Note: {item.notes}
                                  </span>
                              )}
                          </li>
                      ))}
                  </ul>
                  
                  <div className="space-y-2 border-t border-slate-200 pt-4 text-sm text-slate-600">
                      <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span>${foodSubtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                          <span>Delivery Fee (5%)</span>
                          <span>${deliveryFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                          <span>Service Fee (10%)</span>
                          <span>${serviceFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                          <span>Tax (8%)</span>
                          <span>${tax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center pt-2">
                          <span>Tip</span>
                          <div className="flex items-center">
                              <span className="mr-1">$</span>
                              <input 
                                type="number" 
                                min="0" 
                                step="0.50"
                                {...register('tips')}
                                className="w-20 p-1 text-right text-sm border border-slate-300 rounded"
                              />
                          </div>
                      </div>
                  </div>

                  <div className="border-t border-slate-200 mt-4 pt-4 flex justify-between font-bold text-slate-900 text-lg">
                      <span>Total</span>
                      <span>${grandTotal.toFixed(2)}</span>
                  </div>
                  <div className="mt-4 text-sm text-right">
                    <Link href="/customer/cart" className="text-orange-600 hover:text-orange-700 font-medium transition-colors">
                      Edit Cart
                    </Link>
                  </div>
              </div>
          </div>

          {/* Payment & Delivery Form */}
          <div>
              <h3 className="text-lg font-medium text-slate-900 mb-4">Delivery Details</h3>
              <div className="space-y-6">
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Delivery Address</label>
                      <div className="mt-1">
                         <AddressAutocomplete 
                           onSelect={(addr, lat, lng) => {
                             setValue('address', addr, { shouldValidate: true });
                           }}
                           onInputChange={() => {
                             setValue('address', '', { shouldValidate: true });
                           }}
                           defaultValue={getValues('address')}
                         />
                       </div>
                      <input 
                        type="hidden" 
                        {...register('address', { required: 'Please select a delivery address from the suggestions' })} 
                      />
                      {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message as string}</p>}
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                      <p className="text-sm text-blue-800 font-medium">Payment Method: PayPal</p>
                      <p className="text-xs text-blue-600 mt-1">Secure payment via PayPal.</p>
                  </div>

                  <PayPalScriptProvider options={initialOptions}>
                    <PayPalButtons 
                        style={{ layout: "vertical", shape: "rect", borderRadius: 8 }} 
                        createOrder={(data, actions) => {
                            return actions.order.create({
                                intent: "CAPTURE",
                                purchase_units: [
                                    {
                                        amount: {
                                            currency_code: "USD",
                                            value: grandTotal.toFixed(2),
                                        },
                                    },
                                ],
                            });
                        }}
                        onApprove={async (data, actions) => {
                            if (actions.order) {
                                await actions.order.capture();
                                await handlePaymentSuccess(data.orderID);
                            }
                        }}
                        onClick={(data, actions) => {
                            const address = getValues('address');
                            if (!address) {
                                alert("Please enter a delivery address first.");
                                return actions.reject();
                            }
                            return actions.resolve();
                        }}
                    />
                  </PayPalScriptProvider>
              </div>
          </div>
      </div>
    </div>
  );
}
