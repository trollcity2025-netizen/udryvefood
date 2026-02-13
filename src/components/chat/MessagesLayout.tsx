'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Search, User, MessageSquare, Truck, Store, Phone } from 'lucide-react';
import ChatWindow from './ChatWindow';

interface Conversation {
  id: string; // Order ID
  otherUserId: string;
  otherUserName: string;
  otherUserRole: 'driver' | 'customer' | 'restaurant';
  lastMessage?: string;
  status: string; // Order status
}

interface MessagesLayoutProps {
  role: 'driver' | 'restaurant' | 'customer';
}

export default function MessagesLayout({ role }: MessagesLayoutProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<Conversation | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    fetchConversations();
  }, [role]);

  const fetchConversations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    // Fetch active orders based on role
    let query = supabase.from('orders').select(`
      id,
      status,
      customer_id,
      driver_id,
      restaurant_id,
      customer:customer_profiles!customer_id(full_name),
      driver:driver_profiles!driver_id(full_name),
      restaurant:restaurant_profiles!restaurant_id(restaurant_name)
    `).order('created_at', { ascending: false });

    if (role === 'driver') {
      query = query.eq('driver_id', user.id).neq('status', 'completed').neq('status', 'cancelled');
    } else if (role === 'restaurant') {
      query = query.eq('restaurant_id', user.id).neq('status', 'completed').neq('status', 'cancelled');
    } else {
      query = query.eq('customer_id', user.id).neq('status', 'completed').neq('status', 'cancelled');
    }

    const { data: orders, error } = await query;

    if (error) {
        console.error('Error fetching conversations:', error);
        setLoading(false);
        return;
    }

    const convs: Conversation[] = [];

    orders?.forEach((order: any) => {
      // Determine who we are chatting with based on our role
      // Simplified: Driver chats with Customer. Restaurant chats with Driver (if assigned) or Customer. Customer chats with Driver.
      
      if (role === 'driver') {
        // Driver chats with Customer
        convs.push({
          id: order.id,
          otherUserId: order.customer_id,
          otherUserName: order.customer?.full_name || 'Customer',
          otherUserRole: 'customer',
          status: order.status
        });
      } else if (role === 'restaurant') {
        // Restaurant chats with Driver (if assigned)
        if (order.driver_id) {
            convs.push({
                id: order.id,
                otherUserId: order.driver_id,
                otherUserName: order.driver?.full_name || 'Driver',
                otherUserRole: 'driver',
                status: order.status
            });
        }
        // Could also chat with customer, but let's keep it simple for now (1 chat per order)
      } else if (role === 'customer') {
        // Customer chats with Driver (if assigned)
        if (order.driver_id) {
             convs.push({
                id: order.id,
                otherUserId: order.driver_id,
                otherUserName: order.driver?.full_name || 'Driver',
                otherUserRole: 'driver',
                status: order.status
            });
        }
      }
    });

    setConversations(convs);
    setLoading(false);
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading conversations...</div>;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-white overflow-hidden">
      {/* Sidebar */}
      <div className={`w-full md:w-80 border-r border-slate-200 flex flex-col h-full ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-200">
            <h1 className="text-xl font-bold text-slate-900 mb-4">Messages</h1>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input 
                    type="text" 
                    placeholder="Search orders..." 
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-sm">
                    No active conversations found.
                </div>
            ) : (
                conversations.map((chat) => (
                    <div 
                        key={chat.id}
                        onClick={() => setSelectedChat(chat)}
                        className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${selectedChat?.id === chat.id ? 'bg-orange-50' : ''}`}
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className="font-semibold text-slate-900">{chat.otherUserName}</span>
                            <span className="text-xs text-slate-500 capitalize">{chat.otherUserRole}</span>
                        </div>
                        <p className="text-xs text-slate-500">Order #{chat.id.slice(0, 8)} • {chat.status}</p>
                    </div>
                ))
            )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col h-full bg-slate-50 ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
        {selectedChat && currentUserId ? (
            <div className="flex flex-col h-full">
                {/* Mobile Header for Chat */}
                <div className="md:hidden p-4 bg-white border-b border-slate-200 flex items-center">
                    <button onClick={() => setSelectedChat(null)} className="mr-3 text-slate-500">
                        &larr; Back
                    </button>
                    <span className="font-bold">{selectedChat.otherUserName}</span>
                </div>
                
                <ChatWindow 
                    currentUserId={currentUserId}
                    otherUserId={selectedChat.otherUserId}
                    orderId={selectedChat.id}
                    title={selectedChat.otherUserName}
                />
            </div>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <MessageSquare size={48} className="mb-4 opacity-50" />
                <p>Select a conversation to start chatting</p>
            </div>
        )}
      </div>
    </div>
  );
}
