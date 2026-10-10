import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { messagingService } from '../../services/messagingService';
import { Conversation, ChatMessage } from '../../types/database';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';
import {
  MessageSquare,
  Send,
  Search,
  Check,
  CheckCheck,
  Clock,
  Sparkles,
  Users,
  ChevronLeft,
} from 'lucide-react';

interface MessagingViewProps {
  initialPartnerId?: string;
  initialPartnerProfile?: any;
  onNavigateToNetwork?: () => void;
}

export const MessagingView: React.FC<MessagingViewProps> = ({
  initialPartnerId,
  initialPartnerProfile,
  onNavigateToNetwork,
}) => {
  const { user } = useAuth();
  const currentUserId = user?.id || 'demo-candidate';

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadConversations();
  }, [user]);

  const loadConversations = async () => {
    setIsLoading(true);
    try {
      let convs = await messagingService.getConversations(currentUserId);

      // If initial partner is specified (e.g. clicked "Message" on Network card)
      if (initialPartnerId) {
        const target = await messagingService.getOrCreateConversation(
          currentUserId,
          initialPartnerId,
          initialPartnerProfile
        );
        if (!convs.some((c) => c.id === target.id)) {
          convs = [target, ...convs];
        }
        setActiveConversationId(target.id);
      } else if (convs.length > 0 && !activeConversationId) {
        setActiveConversationId(convs[0].id);
      }

      setConversations(convs);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!activeConversationId) return;

    let isMounted = true;
    messagingService.getMessages(activeConversationId, currentUserId).then((data) => {
      if (isMounted) {
        setMessages(data);
        messagingService.markAsRead(activeConversationId, currentUserId);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [activeConversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!activeConversationId || !messageInput.trim()) return;

    const content = messageInput.trim();
    setMessageInput('');
    setIsSending(true);

    try {
      const sent = await messagingService.sendMessage(activeConversationId, currentUserId, content);
      setMessages((prev) => [...prev, sent]);

      // Update conversations list latest preview
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeConversationId
            ? { ...c, last_message_text: content, last_message_at: new Date().toISOString() }
            : c
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  const activeConv = conversations.find((c) => c.id === activeConversationId);
  const otherParticipant = activeConv?.other_participant;

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const name = c.other_participant?.display_name?.toLowerCase() || '';
    const headline = c.other_participant?.headline?.toLowerCase() || '';
    return name.includes(searchQuery.toLowerCase()) || headline.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="max-w-5xl mx-auto h-[calc(100vh-10rem)] min-h-[500px] flex flex-col bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden shadow-xs transition-colors">
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Conversations List */}
        <aside
          className={`w-full sm:w-80 shrink-0 border-r border-slate-200/80 dark:border-slate-800 flex flex-col ${
            activeConversationId ? 'hidden sm:flex' : 'flex'
          }`}
        >
          {/* Header & Search */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Conversations</span>
              </h2>
              <span className="text-[11px] font-mono text-slate-400">{conversations.length}</span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages..."
                className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
            {isLoading ? (
              <div className="p-6 text-center text-xs text-slate-400 font-mono animate-pulse">
                Loading messages...
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-6 text-center space-y-2 text-slate-500">
                <p className="text-xs">No active conversations found.</p>
                {onNavigateToNetwork && (
                  <Button size="sm" variant="outline" onClick={onNavigateToNetwork} className="text-xs">
                    Browse Network
                  </Button>
                )}
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = conv.id === activeConversationId;
                const p = conv.other_participant;

                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConversationId(conv.id)}
                    className={`w-full text-left p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-l-2 border-indigo-600'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <Avatar
                      name={p?.display_name || 'Engineer'}
                      src={p?.avatar_path || undefined}
                      size="md"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {p?.display_name || 'Candidate Peer'}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {new Date(conv.last_message_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {conv.last_message_text || 'Started a conversation'}
                      </p>
                    </div>

                    {(conv.unread_count || 0) > 0 && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0 self-center" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Column: Chat Window */}
        <section
          className={`flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-950/40 ${
            !activeConversationId ? 'hidden sm:flex' : 'flex'
          }`}
        >
          {activeConv && otherParticipant ? (
            <>
              {/* Chat Header */}
              <div className="h-14 bg-white dark:bg-slate-900 border-b border-slate-200/80 dark:border-slate-800 px-4 flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => setActiveConversationId(null)}
                    className="sm:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <Avatar
                    name={otherParticipant.display_name}
                    src={otherParticipant.avatar_path || undefined}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {otherParticipant.display_name}
                    </h3>
                    <p className="text-[10px] text-slate-500 truncate">
                      {otherParticipant.headline || 'Software Engineer'}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono hidden sm:inline">
                  Direct Channel
                </span>
              </div>

              {/* Message History Bubble Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="py-16 text-center space-y-2 text-slate-400">
                    <Sparkles className="w-6 h-6 text-indigo-400 mx-auto" />
                    <p className="text-xs">Say hello and start this engineering discussion.</p>
                  </div>
                ) : (
                  messages.map((m) => {
                    const isMe = m.sender_id === currentUserId;

                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[78%] sm:max-w-md rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                            isMe
                              ? 'bg-slate-900 dark:bg-indigo-600 text-white rounded-br-xs'
                              : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-bl-xs shadow-xs'
                          }`}
                        >
                          {m.content}
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 px-1 font-mono">
                          <span>
                            {new Date(m.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {isMe && (
                            <span>
                              {m.read_at ? (
                                <CheckCheck className="w-3 h-3 text-cyan-500 inline" />
                              ) : (
                                <Check className="w-3 h-3 text-slate-400 inline" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Composer */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message... (Press Enter to send)"
                  className="flex-1 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <Button
                  type="submit"
                  size="sm"
                  variant="primary"
                  disabled={!messageInput.trim() || isSending}
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                >
                  Send
                </Button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 space-y-2">
              <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-700" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Select a conversation
              </h3>
              <p className="text-xs max-w-xs text-slate-500">
                Choose an engineer from the list on the left to review message history or send a direct update.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
