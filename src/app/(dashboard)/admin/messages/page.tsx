'use client';

import { createClient } from '@/utils/supabase/client';
import { useEffect, useState } from 'react';
import ChatWindow from '@/components/chat/ChatWindow';

interface Conversation {
  userId: string;
  email: string;
  role: string;
  lastMessage: string;
  lastMessageTime: string;
}

export default function AdminMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentAdminId(user.id);

    // This is a complex query to get "last message per user". 
    // For simplicity in this demo, we'll fetch all messages involving the admin and group them client-side.
    // In production, use a dedicated View or SQL function.
    
    const { data: messages } = await supabase
        .from('messages')
        .select(`
            *,
            sender:sender_id(email, role),
            receiver:receiver_id(email, role)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

    if (!messages) return;

    const convMap = new Map<string, Conversation>();

    messages.forEach((msg: any) => {
        const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        const otherEmail = msg.sender_id === user.id ? msg.receiver.email : msg.sender.email;
        // The sender relation might be null if we didn't join properly or if RLS hides it.
        // Assuming we can see basic user info. 
        // Actually, our public.users table has email/role, so we need to join that.
        // The above select syntax assumes foreign key relation to auth.users or public.users.
        // Our messages table references public.users.
        
        // Let's rely on the public.users data joined.
        const otherUser = msg.sender_id === user.id ? msg.receiver : msg.sender;
        
        if (!convMap.has(otherId)) {
            convMap.set(otherId, {
                userId: otherId,
                email: otherUser?.email || 'Unknown',
                role: otherUser?.role || 'user',
                lastMessage: msg.content,
                lastMessageTime: msg.created_at
            });
        }
    });

    setConversations(Array.from(convMap.values()));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 h-[calc(100vh-4rem)]">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Messages</h1>
      
      <div className="flex h-[600px] bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
        {/* Sidebar List */}
        <div className="w-1/3 border-r border-slate-200 overflow-y-auto">
            {conversations.length === 0 ? (
                <div className="p-4 text-slate-500">No conversations yet.</div>
            ) : (
                conversations.map(conv => (
                    <div 
                        key={conv.userId}
                        onClick={() => setSelectedUser(conv.userId)}
                        className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50/60 ${selectedUser === conv.userId ? 'bg-slate-50 border-l-4 border-l-slate-900' : ''}`}
                    >
                        <div className="flex justify-between items-baseline">
                            <span className="font-medium text-slate-900 truncate w-2/3">{conv.email}</span>
                            <span className="text-xs text-slate-400">{new Date(conv.lastMessageTime).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                             <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{conv.role}</span>
                        </div>
                        <p className="text-sm text-slate-500 mt-1 truncate">{conv.lastMessage}</p>
                    </div>
                ))
            )}
        </div>

        {/* Chat Area */}
        <div className="w-2/3 flex flex-col">
            {selectedUser && currentAdminId ? (
                <div className="flex-1 p-4">
                     <ChatWindow 
                        currentUserId={currentAdminId}
                        otherUserId={selectedUser}
                        title={`Chat with ${conversations.find(c => c.userId === selectedUser)?.email}`}
                     />
                </div>
            ) : (
                <div className="flex-1 flex items-center justify-center text-slate-400">
                    Select a conversation to start chatting
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
