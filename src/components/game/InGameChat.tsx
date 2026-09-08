import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface InGameChatMessage {
  id: string;
  senderId?: string;
  senderName: string;
  message: string;
  timestamp: number;
  isSelf: boolean;
}

export interface InGameChatProps {
  messages: InGameChatMessage[];
  onSendMessage: (message: string) => void;
  isMultiplayer?: boolean;
  className?: string;
}

const QUICK_CHATS = [
  'Good luck! 🍀',
  'Nice move! 👏',
  'Well played! 👍',
  'Good game! 🤝',
  'Thinking... 🤔',
  'Thanks! ✨',
];

export function InGameChat({
  messages,
  onSendMessage,
  isMultiplayer = false,
  className = '',
}: InGameChatProps) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const handleQuickChat = (text: string) => {
    onSendMessage(text);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex flex-col h-full bg-[#FAF7F2] rounded-2xl overflow-hidden ${className}`}>
      {/* Quick Chat Chips Carousel */}
      <div className="p-2 bg-white/70 border-b border-background-border backdrop-blur-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <div className="flex items-center gap-1 text-[10px] font-bold text-ink-subtle uppercase tracking-wider shrink-0 pl-1 pr-0.5">
            <Smile className="h-3 w-3 text-gold" />
            <span>Quick:</span>
          </div>
          {QUICK_CHATS.map((qc) => (
            <button
              key={qc}
              type="button"
              onClick={() => handleQuickChat(qc)}
              className="text-xs font-semibold px-2.5 py-1 rounded-full bg-background-elevated hover:bg-gold-light hover:text-ink text-ink-muted border border-background-border active:scale-95 transition-all shrink-0 cursor-pointer shadow-2xs"
            >
              {qc}
            </button>
          ))}
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 min-h-[160px]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-ink-subtle space-y-2">
            <div className="w-10 h-10 rounded-full bg-background-elevated flex items-center justify-center border border-background-border">
              <MessageCircle className="h-5 w-5 text-ink-subtle" />
            </div>
            <p className="text-xs font-semibold text-ink-muted">
              {isMultiplayer ? 'Chat with your opponent!' : 'In-game chat'}
            </p>
            <p className="text-[11px] text-ink-subtle max-w-[200px]">
              Tap a quick chip above or type a friendly message below.
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.isSelf ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-center gap-1 px-1 mb-0.5 text-[10px] text-ink-subtle font-medium">
                <span>{m.isSelf ? 'You' : m.senderName}</span>
                <span>•</span>
                <span>{formatTime(m.timestamp)}</span>
              </div>
              <div
                className={`max-w-[85%] px-3 py-1.5 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed break-words shadow-2xs ${
                  m.isSelf
                    ? 'bg-primary text-white rounded-tr-xs'
                    : 'bg-white text-ink border border-background-border rounded-tl-xs'
                }`}
              >
                {m.message}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <form
        onSubmit={handleSend}
        className="p-2 sm:p-2.5 bg-white border-t border-background-border flex items-center gap-1.5"
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isMultiplayer ? 'Say something nice...' : 'Quick message...'}
          maxLength={120}
          className="flex-1 bg-background-elevated border border-background-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-3 py-2 text-xs sm:text-sm text-ink outline-hidden placeholder:text-ink-subtle"
        />
        <Button
          type="submit"
          variant="primary"
          size="sm"
          disabled={!inputText.trim()}
          className="h-8.5 px-3 rounded-xl shrink-0 gap-1 font-bold"
        >
          <Send className="h-3.5 w-3.5" />
          <span className="hidden xs:inline">Send</span>
        </Button>
      </form>
    </div>
  );
}
