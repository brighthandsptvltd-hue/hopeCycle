import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';

interface DonorMessagesProps {
  initialRecipientId?: string;
}

const DonorMessages: React.FC<DonorMessagesProps> = ({ initialRecipientId }) => {
  // Layout & State
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null); // selected partner
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initial Fetch: Load Conversations and setup subscriptions
  useEffect(() => {
    const init = async () => {
      await fetchConversations(true);
    };
    init();
    fetchUnread(); // Call fetchUnread on initial load

    // Setup real-time subscription for new messages in active chat
    const activeChatChannel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        // If message belongs to active chat, append it
        const newMsg = payload.new;
        if (activeChat && (newMsg.sender_id === activeChat.user_id || newMsg.receiver_id === activeChat.user_id)) {
          setMessages(prev => [...prev, newMsg]);
          scrollToBottom();

          // If I am the receiver and chat is active, mark as read immediately
          if (newMsg.receiver_id === activeChat.user_id) {
            // Wait, if I am receiver, my ID is receiver_id. 
            // activeChat.user_id is the PARTNER.
            // So if newMsg.receiver_id === ME (not activeChat.user_id), then I should mark read.
          }
        }
        // Refresh conversation list to update last message/unread count
        fetchConversations();
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, () => {
        // If messages are marked read, refresh conversations to clear badges locally
        fetchConversations();
      })
      .subscribe();

    // Separate channel for sidebar badges (any message change)
    const sidebarBadgesChannel = supabase
      .channel('sidebar_badges')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchUnread();
      })
      .subscribe();

    // Also listen for local "messagesRead" events from the chat page
    const handleLocalRead = () => fetchUnread();
    window.addEventListener('messagesRead', handleLocalRead);

    return () => {
      supabase.removeChannel(activeChatChannel);
      supabase.removeChannel(sidebarBadgesChannel);
      window.removeEventListener('messagesRead', handleLocalRead);
    };
  }, [activeChat]); // Keep activeChat dependency for the active chat message logic

  // Helper to fetch unread counts (or refresh conversations which includes unread counts)
  const fetchUnread = () => {
    fetchConversations(); // Assuming fetchConversations already updates unread counts
  };

  const fetchConversations = async (shouldSelectInitial = false) => {
    try {
      const { data, error } = await supabase.rpc('get_conversations');
      if (error) throw error;

      let chatList = data || [];

      // If we have an initial ID, check if it's in the list
      if (shouldSelectInitial && initialRecipientId) {
        const existing = chatList.find((c: any) => c.user_id === initialRecipientId);
        if (existing) {
          setActiveChat(existing);
        } else {
          // New conversation - fetch profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', initialRecipientId)
            .single();

          if (profile) {
            const newChat = {
              user_id: profile.id,
              organization_name: profile.organization_name,
              full_name: profile.full_name,
              unread_count: 0,
              last_message: null,
              last_message_time: null
            };
            chatList = [newChat, ...chatList];
            setActiveChat(newChat);
          }
        }
      }

      setConversations(chatList);
      setLoadingChats(false);
      if (shouldSelectInitial && initialRecipientId) {
        setMobileShowChat(true);
      }
    } catch (err) {
      console.error('Error fetching chats:', err);
    }
  };

  // Load messages when active chat changes
  useEffect(() => {
    if (!activeChat) return;
    const fetchMessages = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${activeChat.user_id}),and(sender_id.eq.${activeChat.user_id},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setMessages(data);
        scrollToBottom();

        // Mark as read
        const unreadIds = data.filter((m: any) => m.receiver_id === user.id && !m.is_read).map((m: any) => m.id);
        if (unreadIds.length > 0) {
          await supabase.from('messages').update({ is_read: true }).in('id', unreadIds);
          // Dispatch local event for Sidebar to update
          window.dispatchEvent(new CustomEvent('messagesRead'));

          // Manually update local conversation state to assume read, for instant UI feedback
          setConversations(prev => prev.map(c =>
            c.user_id === activeChat.user_id ? { ...c, unread_count: 0 } : c
          ));
        }
      }
    };

    fetchMessages();
  }, [activeChat]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 100);
  };

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || inputText;
    if (!textToSend.trim() || !activeChat) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user");

      if (!overrideText) setInputText(''); // optimistic clear only if manual input

      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: activeChat.user_id,
          content: textToSend,
          is_read: false
        });

      if (error) throw error;

      // Notify the receiver
      await supabase.from('notifications').insert({
        user_id: activeChat.user_id,
        type: 'message',
        title: 'New Message',
        description: `You have a new message regarding your donation conversation.`,
        link: 'donor-messages'
      });

      // Optimistic update
      const tempMsg = {
        id: Date.now(),
        sender_id: user.id,
        receiver_id: activeChat.user_id,
        content: textToSend,
        created_at: new Date().toISOString(),
        is_read: false
      };
      setMessages(prev => [...prev, tempMsg]);
      scrollToBottom();
      // fetchConversations will be triggered by subscription, but we can call it too

    } catch (err) {
      console.error('Send failed:', err);
      alert('Failed to send message'); // Use custom toast ideally
    }
  };

  const handleShareLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const link = `https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`;
        const text = `📍 My Location: ${link}`;
        setInputText(text);
      });
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  const handleRequestContact = () => {
    handleSend("Please share your contact number for further communication.");
  };

  return (
    <div className="h-[calc(100vh-140px)] md:h-[calc(100vh-160px)] max-w-7xl mx-auto rounded-3xl md:rounded-[2.5rem] overflow-hidden shadow-2xl bg-white dark:bg-brand-surface-dark border border-gray-100 dark:border-gray-800 flex animate-in fade-in duration-500 relative overflow-x-hidden">
      {/* LEFT SIDEBAR (Conversation List) */}
      <div className={`${mobileShowChat ? 'hidden' : 'flex'} md:flex w-full md:w-1/3 border-r border-gray-100 dark:border-gray-800 flex-col bg-gray-50/50 dark:bg-brand-dark/30 shrink-0`}>
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-2xl font-black text-brand-text dark:text-white">Messages</h2>
          <button className="size-10 rounded-xl bg-white dark:bg-brand-surface text-brand-muted hover:text-primary shadow-sm flex items-center justify-center transition-all">
            <span className="material-symbols-outlined">edit_square</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2">
          {loadingChats ? (
            <div className="text-center py-10 text-brand-muted text-sm font-bold">Loading chats...</div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-20 text-brand-muted/50">
              <span className="material-symbols-outlined text-4xl mb-2">chat_bubble_outline</span>
              <p className="text-xs font-bold uppercase tracking-widest">No conversations yet</p>
            </div>
          ) : (
            conversations.map(chat => (
              <div
                key={chat.user_id}
                onClick={() => {
                  setActiveChat(chat);
                  setMobileShowChat(true);
                }}
                className={`p-4 rounded-2xl cursor-pointer transition-all flex items-start gap-4 border ${activeChat?.user_id === chat.user_id
                  ? 'bg-white dark:bg-brand-surface shadow-md border-gray-100 dark:border-gray-800'
                  : 'hover:bg-gray-100 dark:hover:bg-white/5 border-transparent'
                  }`}
              >
                <div className="relative">
                  <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary-dark font-black text-lg uppercase">
                    {(chat.organization_name || chat.full_name || 'U')[0]}
                  </div>
                  {chat.unread_count > 0 && (
                    <div className="absolute -top-2 -right-2 size-5 bg-emerald-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm border border-white dark:border-brand-dark">
                      {chat.unread_count}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className={`font-bold text-sm truncate ${activeChat?.user_id === chat.user_id ? 'text-primary' : 'text-brand-text dark:text-white'}`}>
                      {chat.organization_name || chat.full_name}
                    </h3>
                    {chat.last_message_time && (
                      <span className="text-[10px] text-brand-muted font-bold">
                        {new Date(chat.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs truncate ${chat.unread_count > 0 ? 'font-bold text-brand-text dark:text-white' : 'text-brand-muted'}`}>
                    {chat.last_message || 'No messages yet'}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT CHAT AREA */}
      <div className={`${mobileShowChat ? 'flex' : 'hidden'} md:flex w-full md:flex-1 flex-col bg-white dark:bg-brand-surface-dark relative`}>
        {!activeChat ? (
          <div className="flex-1 flex flex-col items-center justify-center text-brand-muted/30">
            <span className="material-symbols-outlined text-8xl mb-4">forum</span>
            <p className="text-lg font-black uppercase tracking-widest text-brand-muted/50">Select a conversation</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-white/80 dark:bg-brand-surface-dark/90 backdrop-blur-sm sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setMobileShowChat(false)}
                  className="md:hidden p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"
                >
                  <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary-dark font-black text-sm uppercase">
                  {(activeChat.organization_name || activeChat.full_name || 'U')[0]}
                </div>
                <div>
                  <h3 className="font-bold text-brand-text dark:text-white text-lg">
                    {activeChat.organization_name || activeChat.full_name}
                  </h3>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleRequestContact}
                  className="size-10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 flex items-center justify-center text-brand-muted transition-all"
                  title="Request Contact Info"
                >
                  <span className="material-symbols-outlined">call</span>
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="size-10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 flex items-center justify-center text-brand-muted transition-all"
                  >
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-brand-surface-dark rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 z-50 overflow-hidden">
                      <button className="w-full text-left px-4 py-3 text-sm font-bold hover:bg-gray-50 dark:hover:bg-brand-dark flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">block</span> Block User
                      </button>
                      <button className="w-full text-left px-4 py-3 text-sm font-bold hover:bg-gray-50 dark:hover:bg-brand-dark text-red-500 flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">delete</span> Clear Chat
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-50 dark:bg-brand-dark/20"
              style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.03) 1px, transparent 0)', backgroundSize: '24px 24px' }}
            >
              {messages.map((msg, idx) => {
                const isMe = msg.sender_id !== activeChat.user_id;
                return (
                  <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-4 rounded-2xl shadow-sm text-sm ${isMe
                      ? 'bg-primary text-primary-deep rounded-tr-none'
                      : 'bg-white dark:bg-brand-surface rounded-tl-none border border-gray-100 dark:border-gray-800'
                      }`}>
                      <p className="whitespace-pre-wrap leading-relaxed font-medium break-words overflow-wrap-anywhere">
                        {msg.content}
                      </p>
                      <span className={`text-[10px] mt-1 block font-bold opacity-60 ${isMe ? 'text-primary-deep/70' : 'text-brand-muted'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-brand-surface-dark border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-end gap-3 bg-gray-50 dark:bg-brand-dark p-2 rounded-[1.5rem] border border-gray-100 dark:border-gray-800">
                <button
                  onClick={handleShareLocation}
                  className="p-3 text-brand-muted hover:text-primary hover:bg-white dark:hover:bg-white/5 rounded-full transition-all"
                  title="Share Location"
                >
                  <span className="material-symbols-outlined text-xl">location_on</span>
                </button>
                <textarea
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder="Type a message..."
                  rows={1}
                  className="flex-1 bg-transparent border-none focus:ring-0 p-3 text-sm font-medium resize-none max-h-32"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!inputText.trim()}
                  className="p-3 bg-primary text-primary-deep rounded-full shadow-lg hover:bg-primary-dark transition-all disabled:opacity-50 disabled:shadow-none flex items-center justify-center active:scale-95"
                >
                  <span className="material-symbols-outlined text-xl font-bold">send</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DonorMessages;