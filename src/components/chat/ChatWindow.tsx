'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Send } from 'lucide-react';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

interface ChatWindowProps {
  currentUserId: string;
  otherUserId: string;
  orderId?: string;
  title?: string;
}

export default function ChatWindow({ currentUserId, otherUserId, orderId, title = 'Chat' }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchMessages();

    // Subscribe to new messages
    const channel = supabase
      .channel('chat_room')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `order_id=eq.${orderId}`, // Filter by order if possible, or filter in callback
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (
            (newMsg.sender_id === currentUserId && newMsg.receiver_id === otherUserId) ||
            (newMsg.sender_id === otherUserId && newMsg.receiver_id === currentUserId)
          ) {
            setMessages((prev) => [...prev, newMsg]);
            scrollToBottom();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUserId, otherUserId, orderId]);

  const fetchMessages = async () => {
    setLoading(true);
    let query = supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true });

    if (orderId) {
      query = query.eq('order_id', orderId);
    } else {
        // Fetch conversation between two users (no specific order)
        query = query.or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`);
    }

    const { data, error } = await query;
    if (!error && data) {
      setMessages(data);
      scrollToBottom();
    }
    setLoading(false);
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msg = newMessage.trim();
    setNewMessage('');

    // Optimistic update
    // setMessages(prev => [...prev, { id: 'temp', sender_id: currentUserId, content: msg, created_at: new Date().toISOString() }]);

    const { error } = await supabase.from('messages').insert({
      sender_id: currentUserId,
      receiver_id: otherUserId,
      order_id: orderId,
      content: msg,
    });

    if (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message');
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-white border border-slate-200 rounded-lg shadow-sm">
      <div className="p-4 border-b border-slate-200 bg-slate-50 rounded-t-lg">
        <h3 className="font-semibold text-slate-700">{title}</h3>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {loading ? (
          <div className="text-center text-slate-500 mt-10">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-slate-400 mt-10">No messages yet. Say hello!</div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[70%] px-4 py-2 rounded-lg ${
                    isMe
                      ? 'bg-orange-600 text-white rounded-br-none'
                      : 'bg-slate-100 text-slate-800 rounded-bl-none'
                  }`}
                >
                  <p>{msg.content}</p>
                  <p className={`text-xs mt-1 ${isMe ? 'text-orange-200' : 'text-slate-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-slate-200 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border border-slate-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="bg-orange-600 text-white p-2 rounded-full hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
}
