'use client';

import { useState } from 'react';
import { Search, Send, User, MessageSquare } from 'lucide-react';

export default function MessagesPage() {
  const [selectedChat, setSelectedChat] = useState<number | null>(null);

  // Mock data for UI demonstration
  const chats = [
    { id: 1, name: 'Driver: John Doe', lastMessage: 'I am arriving in 5 minutes.', time: '10:30 AM', unread: true },
    { id: 2, name: 'Customer: Alice', lastMessage: 'Can I get extra napkins?', time: 'Yesterday', unread: false },
    { id: 3, name: 'Support', lastMessage: 'Your payout has been processed.', time: '2 days ago', unread: false },
  ];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-white overflow-hidden">
      {/* Sidebar */}
      <div className="w-full md:w-80 border-r border-slate-200 flex flex-col h-full">
        <div className="p-4 border-b border-slate-200">
            <h1 className="text-xl font-bold text-slate-900 mb-4">Messages</h1>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <input 
                    type="text" 
                    placeholder="Search messages..." 
                    className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
            </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
            {chats.map((chat) => (
                <div 
                    key={chat.id}
                    onClick={() => setSelectedChat(chat.id)}
                    className={`p-4 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors ${selectedChat === chat.id ? 'bg-orange-50' : ''}`}
                >
                    <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-slate-900">{chat.name}</span>
                        <span className="text-xs text-slate-500">{chat.time}</span>
                    </div>
                    <p className="text-sm text-slate-500 truncate">{chat.lastMessage}</p>
                    {chat.unread && (
                        <span className="inline-block mt-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
                            New
                        </span>
                    )}
                </div>
            ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-slate-50">
        {selectedChat ? (
            <>
                <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm">
                    <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center">
                            <User size={20} className="text-slate-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">{chats.find(c => c.id === selectedChat)?.name}</h3>
                            <span className="text-xs text-green-600 flex items-center">
                                <span className="h-2 w-2 bg-green-500 rounded-full mr-1"></span>
                                Online
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div className="flex justify-start">
                        <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm max-w-md border border-slate-200">
                            <p className="text-slate-800 text-sm">Hello, is my order ready?</p>
                            <span className="text-xs text-slate-400 mt-1 block">10:28 AM</span>
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <div className="bg-orange-600 p-3 rounded-lg rounded-tr-none shadow-sm max-w-md text-white">
                            <p className="text-sm">Yes, it's being packed right now.</p>
                            <span className="text-xs text-orange-200 mt-1 block">10:29 AM</span>
                        </div>
                    </div>
                     <div className="flex justify-start">
                        <div className="bg-white p-3 rounded-lg rounded-tl-none shadow-sm max-w-md border border-slate-200">
                            <p className="text-slate-800 text-sm">Great, thank you!</p>
                            <span className="text-xs text-slate-400 mt-1 block">10:30 AM</span>
                        </div>
                    </div>
                </div>

                <div className="p-4 bg-white border-t border-slate-200">
                    <div className="flex items-center space-x-2">
                        <input 
                            type="text" 
                            placeholder="Type a message..." 
                            className="flex-1 border border-slate-200 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 bg-slate-50"
                        />
                        <button className="p-2 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition-colors shadow-sm">
                            <Send size={20} />
                        </button>
                    </div>
                </div>
            </>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                    <MessageSquare size={32} />
                </div>
                <h3 className="text-lg font-medium text-slate-900">Your Messages</h3>
                <p>Select a conversation to start messaging</p>
            </div>
        )}
      </div>
    </div>
  );
}
