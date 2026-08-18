import React, { useEffect, useRef, useState } from 'react';
import { subscribeToChatMessages, ChatMessage } from '../services/chatService';
import { subscribeToAnnouncements } from '../services/announcementsService';
import { notificationService } from '../services/notificationService';
import { AnnouncementItem, NavSection } from '../types';
import { MessageSquare, Bell, X, ArrowRight } from 'lucide-react';

interface InAppToast {
  id: string;
  type: 'chat' | 'announcement';
  title: string;
  body: string;
  targetSection: NavSection;
  timestamp: number;
}

interface NotificationListenerProps {
  currentUserId: string;
  onNavigate?: (section: NavSection) => void;
}

export const NotificationListener: React.FC<NotificationListenerProps> = ({ 
  currentUserId,
  onNavigate 
}) => {
  const [toasts, setToasts] = useState<InAppToast[]>([]);
  const isFirstChatLoad = useRef(true);
  const isFirstAnnounceLoad = useRef(true);
  const lastChatMessageId = useRef<string | null>(null);
  const lastAnnouncementId = useRef<string | null>(null);

  useEffect(() => {
    // Request permission on mount
    notificationService.requestPermission();
  }, []);

  const addToast = (toast: Omit<InAppToast, 'id' | 'timestamp'>) => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    const newToast: InAppToast = { ...toast, id, timestamp: Date.now() };
    
    setToasts(prev => [newToast, ...prev].slice(0, 4)); // Keep up to 4 toasts

    // Auto dismiss after 6 seconds
    setTimeout(() => {
      removeToast(id);
    }, 6000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Chat message listener
  useEffect(() => {
    if (!currentUserId) return;

    const unsubChat = subscribeToChatMessages(
      (messages) => {
        if (isFirstChatLoad.current) {
          isFirstChatLoad.current = false;
          if (messages.length > 0) {
            lastChatMessageId.current = messages[messages.length - 1].id;
          }
          return;
        }

        if (messages.length > 0) {
          const newestMsg = messages[messages.length - 1];
          if (newestMsg.id !== lastChatMessageId.current && newestMsg.senderId !== currentUserId) {
            lastChatMessageId.current = newestMsg.id;
            
            // Only notify if it's not a system message and not deleted
            if (newestMsg.type !== 'system' && !newestMsg.text.includes('deleted a message')) {
              // 1. Browser system notification
              notificationService.notify(`New message from ${newestMsg.senderName}`, {
                body: newestMsg.text,
                tag: 'chat-notification',
              });

              // 2. In-app webapp toast alert
              addToast({
                type: 'chat',
                title: `Chat from ${newestMsg.senderName}`,
                body: newestMsg.text,
                targetSection: 'chat'
              });
            }
          }
        }
      },
      (err) => console.error('NotificationListener chat error:', err)
    );

    return () => unsubChat();
  }, [currentUserId]);

  // Announcement listener
  useEffect(() => {
    const unsubAnnounce = subscribeToAnnouncements(
      (announcements) => {
        if (isFirstAnnounceLoad.current) {
          isFirstAnnounceLoad.current = false;
          if (announcements.length > 0) {
            lastAnnouncementId.current = announcements[0].id; // Announcements are sorted desc
          }
          return;
        }

        if (announcements.length > 0) {
          const newestAnn = announcements[0];
          if (newestAnn.id !== lastAnnouncementId.current) {
            lastAnnouncementId.current = newestAnn.id;
            
            // 1. Browser system notification
            notificationService.notify(`New Announcement: ${newestAnn.title}`, {
              body: newestAnn.content.slice(0, 100) + (newestAnn.content.length > 100 ? '...' : ''),
              tag: 'announcement-notification',
            });

            // 2. In-app webapp toast alert
            addToast({
              type: 'announcement',
              title: `Announcement: ${newestAnn.title}`,
              body: newestAnn.content.slice(0, 120) + (newestAnn.content.length > 120 ? '...' : ''),
              targetSection: 'announcements'
            });
          }
        }
      },
      (err) => console.error('NotificationListener announcement error:', err)
    );

    return () => unsubAnnounce();
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div 
      id="inapp-notification-stack"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-200/80 shadow-xl rounded-2xl p-4 flex items-start gap-3.5 transition-all duration-300 animate-in slide-in-from-bottom-5 hover:shadow-2xl"
          role="alert"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            toast.type === 'chat' 
              ? 'bg-blue-50 text-blue-600 border border-blue-100' 
              : 'bg-amber-50 text-amber-600 border border-amber-100'
          }`}>
            {toast.type === 'chat' ? (
              <MessageSquare className="w-5 h-5" />
            ) : (
              <Bell className="w-5 h-5" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <h4 className="text-xs font-bold text-slate-900 truncate">
                {toast.title}
              </h4>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-slate-100 transition-colors"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            
            <p className="text-[11px] text-slate-600 line-clamp-2 mt-0.5 leading-relaxed">
              {toast.body}
            </p>

            {onNavigate && (
              <button
                onClick={() => {
                  onNavigate(toast.targetSection);
                  removeToast(toast.id);
                }}
                className="mt-2 text-[11px] font-bold text-[#800020] hover:text-[#6b1426] inline-flex items-center gap-1 transition-colors"
              >
                <span>View {toast.type === 'chat' ? 'Chat' : 'Announcement'}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
