import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  MapPin, 
  Paperclip, 
  Smile, 
  Mic, 
  Search, 
  Users, 
  MoreVertical, 
  Reply, 
  X, 
  Compass, 
  CheckCheck, 
  Image as ImageIcon, 
  Volume2, 
  Info, 
  Sparkles,
  ShieldCheck,
  BadgeCheck,
  UserCheck,
  ShieldAlert,
  Flag,
  AlertTriangle,
  ClipboardList
} from 'lucide-react';
import { 
  ChatMessage, 
  subscribeToChatMessages, 
  sendChatMessage, 
  toggleMessageReaction, 
  deleteChatMessage,
  clearChatHistory,
  editChatMessage,
  reportChatMessage,
  subscribeToReports,
  updateReportStatus,
  MessageReport
} from '../services/chatService';
import { subscribeToMembers, subscribeToLeaders } from '../services/membersService';
import { RoverLogo } from './RoverLogo';
import { MemberItem, LeadershipItem } from './MembersPage';

interface ChatPageProps {
  isAdmin?: boolean;
  currentUser?: any;
}

export const ChatPage: React.FC<ChatPageProps> = ({ isAdmin = false, currentUser }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [leaders, setLeaders] = useState<LeadershipItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Active Posting Identity (defaults to logged in user or Portal Administrator)
  const [activeSenderId, setActiveSenderId] = useState<string>(currentUser?.id || (isAdmin ? 'admin_nazih' : 'm1'));
  const [activeSenderName, setActiveSenderName] = useState<string>(currentUser?.name || (isAdmin ? 'Administrator' : 'Mohamed Naiz'));
  const [activeSenderRole, setActiveSenderRole] = useState<string>(currentUser?.role || (isAdmin ? 'Administrator' : 'Crew Leader'));
  const [activeSenderCrew, setActiveSenderCrew] = useState<string>(currentUser?.crew || (isAdmin ? 'Administration' : 'Alpha Crew'));
  const [activeSenderBadge, setActiveSenderBadge] = useState<string>(currentUser?.badgeRank || (isAdmin ? 'Portal Administrator' : 'Explorer'));

  useEffect(() => {
    if (currentUser) {
      setActiveSenderId(currentUser.id);
      setActiveSenderName(currentUser.name);
      setActiveSenderRole(currentUser.role || (isAdmin ? 'Administrator' : 'Rover Scout'));
      setActiveSenderCrew(currentUser.crew || 'Alpha Crew');
      setActiveSenderBadge(currentUser.badgeRank || (isAdmin ? 'Portal Administrator' : 'Rover Scout'));
    } else if (isAdmin) {
      setActiveSenderId('admin_nazih');
      setActiveSenderName('Administrator');
      setActiveSenderRole('Administrator');
      setActiveSenderCrew('Administration');
      setActiveSenderBadge('Portal Administrator');
    }
  }, [isAdmin, currentUser]);

  // Input & Reply state
  const [inputText, setInputText] = useState('');
  const [replyToMessage, setReplyToMessage] = useState<ChatMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  // Tag suggestions state
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState('');
  const [reactionMsgId, setReactionMsgId] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editInputText, setEditInputText] = useState('');
  
  const [reportingMessage, setReportingMessage] = useState<ChatMessage | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [reports, setReports] = useState<MessageReport[]>([]);
  const [showReportsView, setShowReportsView] = useState(false);

  // Attachment Modal States
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [customLocationText, setCustomLocationText] = useState('Malé Crew HQ');
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageUrlText, setImageUrlText] = useState('');
  const [imageCaptionText, setImageCaptionText] = useState('');

  // Voice Note Simulation State
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to Firestore Chat Messages
  useEffect(() => {
    const unsubscribe = subscribeToChatMessages(
      (msgs) => {
        setMessages(msgs);
        setLoading(false);
      },
      (err) => {
        console.error('Failed to load chat messages:', err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isAdmin || leaders.some(l => l.id === activeSenderId)) {
      const unsubscribe = subscribeToReports(
        (reps) => setReports(reps),
        (err) => console.error('Failed to load reports:', err)
      );
      return () => unsubscribe();
    }
  }, [isAdmin, leaders, activeSenderId]);

  // Subscribe to Members & Leaders
  useEffect(() => {
    const unsubMembers = subscribeToMembers(
      (mList) => setMembers(mList),
      (err) => console.error(err)
    );
    const unsubLeaders = subscribeToLeaders(
      (lList) => setLeaders(lList),
      (err) => console.error(err)
    );
    return () => {
      unsubMembers();
      unsubLeaders();
    };
  }, []);

  // Auto scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Voice Recording timer simulation
  useEffect(() => {
    let timer: any;
    if (isRecordingVoice) {
      timer = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecordingVoice]);

  // Monitor inputText for tagging trigger
  useEffect(() => {
    const lastWord = inputText.split(/\s+/).pop();
    if (lastWord && lastWord.startsWith('@')) {
      setShowTagSuggestions(true);
      setTagSearchQuery(lastWord.slice(1));
    } else {
      setShowTagSuggestions(false);
    }
  }, [inputText]);

  // Quick switch active posting identity
  const handleSelectPoster = (person: { id: string; name: string; role: string; crew?: string; badgeRank?: string }) => {
    setActiveSenderId(person.id);
    setActiveSenderName(person.name);
    setActiveSenderRole(person.role);
    setActiveSenderCrew(person.crew || 'Council');
    setActiveSenderBadge(person.badgeRank || 'Rover');
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const newMsgText = inputText.trim();
    setInputText('');

    try {
      await sendChatMessage({
        senderId: activeSenderId,
        senderName: activeSenderName,
        senderRole: activeSenderRole,
        senderCrew: activeSenderCrew,
        senderBadge: activeSenderBadge,
        text: newMsgText,
        type: 'text',
        replyTo: replyToMessage ? {
          id: replyToMessage.id,
          senderName: replyToMessage.senderName,
          text: replyToMessage.text
        } : undefined
      });
      setReplyToMessage(null);
      setShowEmojiPicker(false);
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleSendLocation = async (locName: string) => {
    try {
      await sendChatMessage({
        senderId: activeSenderId,
        senderName: activeSenderName,
        senderRole: activeSenderRole,
        senderCrew: activeSenderCrew,
        senderBadge: activeSenderBadge,
        text: `📍 Shared Location: ${locName}`,
        type: 'location',
        locationName: locName
      });
      setLocationModalOpen(false);
      setShowAttachmentMenu(false);
    } catch (err) {
      console.error('Failed to send location message:', err);
    }
  };

  const handleSendImage = async () => {
    if (!imageUrlText.trim()) return;
    try {
      await sendChatMessage({
        senderId: activeSenderId,
        senderName: activeSenderName,
        senderRole: activeSenderRole,
        senderCrew: activeSenderCrew,
        senderBadge: activeSenderBadge,
        text: imageCaptionText.trim() || 'Shared an expedition photo',
        type: 'image',
        mediaUrl: imageUrlText.trim()
      });
      setImageModalOpen(false);
      setImageUrlText('');
      setImageCaptionText('');
      setShowAttachmentMenu(false);
    } catch (err) {
      console.error('Failed to send image message:', err);
    }
  };

  const handleSendVoiceNote = async () => {
    const durationStr = `0:${recordingSeconds < 10 ? '0' : ''}${recordingSeconds}`;
    setIsRecordingVoice(false);
    try {
      await sendChatMessage({
        senderId: activeSenderId,
        senderName: activeSenderName,
        senderRole: activeSenderRole,
        senderCrew: activeSenderCrew,
        senderBadge: activeSenderBadge,
        text: 'Voice Note Update',
        type: 'voice',
        mediaUrl: durationStr
      });
    } catch (err) {
      console.error('Failed to send voice note:', err);
    }
  };

  const handleToggleReaction = async (msgId: string, emoji: string, currentReactions: Record<string, string[]> = {}) => {
    try {
      await toggleMessageReaction(msgId, emoji, activeSenderId, currentReactions);
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
    }
  };

  const handlePurgeMessage = async (msgId: string) => {
    try {
      await deleteChatMessage(msgId, true);
    } catch (err) {
      console.error('Failed to purge message:', err);
    }
  };

  const handleEditMessage = async (msgId: string, newText: string) => {
    try {
      await editChatMessage(msgId, newText);
      setEditingMessageId(null);
      setEditInputText('');
    } catch (err) {
      console.error('Failed to edit message:', err);
    }
  };

  const handleReportMessage = async () => {
    if (!reportingMessage) return;
    try {
      await reportChatMessage({
        reporterId: activeSenderId,
        reporterName: allPeople.find(p => p.id === activeSenderId)?.name || 'Unknown',
        messageId: reportingMessage.id,
        messageText: reportingMessage.text,
        reason: reportReason
      });
      setReportingMessage(null);
      setReportReason('');
      alert('Message reported successfully.');
    } catch (err) {
      console.error('Failed to report message:', err);
    }
  };

  const handleUpdateReportStatus = async (reportId: string, status: MessageReport['status']) => {
    try {
      await updateReportStatus(reportId, status);
    } catch (err) {
      console.error('Failed to update report status:', err);
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    try {
      // Administrator can fully delete.
      await deleteChatMessage(msgId, isAdmin);
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  // Filter messages by search query
  const filteredMessages = messages.filter((m) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.text.toLowerCase().includes(q) ||
      m.senderName.toLowerCase().includes(q) ||
      (m.locationName && m.locationName.toLowerCase().includes(q))
    );
  });

  // Assign distinct sender colors for group chat WhatsApp style
  const getSenderColor = (senderName: string) => {
    const colors = [
      'text-[#1e40af]', // Blue
      'text-[#800020]', // Burgundy
      'text-[#047857]', // Emerald
      'text-[#b45309]', // Amber
      'text-[#6d28d9]', // Purple
      'text-[#be123c]'  // Rose
    ];
    let hash = 0;
    for (let i = 0; i < senderName.length; i++) {
      hash = senderName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '10:00 AM';
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
    } catch {
      return '';
    }
  };

  // Calculate live presence and last seen indicators based on authentication/activity timestamps
  const getPresenceInfo = (lastActive?: string, lastLogin?: string, isSelf?: boolean) => {
    if (isSelf) {
      return {
        isOnline: true,
        statusText: 'Online',
        timeText: 'Active now',
        color: 'bg-emerald-500',
        textColor: 'text-emerald-600',
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
      };
    }

    const timestamp = lastActive || lastLogin;
    if (!timestamp) {
      return {
        isOnline: false,
        statusText: 'Offline',
        timeText: 'Offline',
        color: 'bg-slate-300',
        textColor: 'text-slate-400',
        badgeClass: 'bg-slate-50 text-slate-500 border-slate-200'
      };
    }

    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) {
        return {
          isOnline: false,
          statusText: 'Offline',
          timeText: 'Offline',
          color: 'bg-slate-300',
          textColor: 'text-slate-400',
          badgeClass: 'bg-slate-50 text-slate-500 border-slate-200'
        };
      }

      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      // Active within the last 4 minutes -> Online
      if (diffMins < 4) {
        return {
          isOnline: true,
          statusText: 'Online',
          timeText: 'Active now',
          color: 'bg-emerald-500',
          textColor: 'text-emerald-600',
          badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200'
        };
      } else if (diffMins < 60) {
        return {
          isOnline: false,
          statusText: `${diffMins}m ago`,
          timeText: `Last seen ${diffMins}m ago`,
          color: 'bg-amber-400',
          textColor: 'text-amber-700',
          badgeClass: 'bg-amber-50 text-amber-700 border-amber-200'
        };
      } else if (diffHours < 24) {
        return {
          isOnline: false,
          statusText: `${diffHours}h ago`,
          timeText: `Last seen ${diffHours}h ago`,
          color: 'bg-slate-400',
          textColor: 'text-slate-600',
          badgeClass: 'bg-slate-50 text-slate-600 border-slate-200'
        };
      } else if (diffDays < 7) {
        return {
          isOnline: false,
          statusText: `${diffDays}d ago`,
          timeText: `Last seen ${diffDays}d ago`,
          color: 'bg-slate-300',
          textColor: 'text-slate-500',
          badgeClass: 'bg-slate-50 text-slate-500 border-slate-200'
        };
      } else {
        return {
          isOnline: false,
          statusText: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
          timeText: `Last seen ${date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
          color: 'bg-slate-300',
          textColor: 'text-slate-500',
          badgeClass: 'bg-slate-50 text-slate-500 border-slate-200'
        };
      }
    } catch {
      return {
        isOnline: false,
        statusText: 'Offline',
        timeText: 'Offline',
        color: 'bg-slate-300',
        textColor: 'text-slate-400',
        badgeClass: 'bg-slate-50 text-slate-500 border-slate-200'
      };
    }
  };

  const allPeople = [
    ...members.map(m => ({
      id: m.id,
      name: m.name || 'Member',
      role: m.role || 'Rover Scout',
      crew: m.crew || 'General Crew',
      badgeRank: m.badgeRank || 'Scout',
      location: m.location || m.currentAddress || 'Malé Crew HQ',
      lastActive: (m as any).lastActive,
      lastLogin: (m as any).lastLogin,
      status: m.status
    })),
    ...leaders.map(l => ({
      id: l.id,
      name: l.name || 'Leader',
      role: l.title || 'Council Leader',
      crew: 'Council',
      badgeRank: 'Wood Badge',
      location: 'Council HQ',
      lastActive: (l as any).lastActive,
      lastLogin: (l as any).lastLogin,
      status: 'Active'
    }))
  ].filter((p, index, self) => 
    p.id && Boolean(p.name) && self.findIndex(s => s.id === p.id) === index
  );

  const onlineMembersCount = allPeople.filter(p => 
    getPresenceInfo(p.lastActive, p.lastLogin, p.id === activeSenderId).isOnline
  ).length;

  const taggablePeople = [
    ...members.map(m => ({
      id: m.id,
      name: m.name || 'Member',
      username: m.username || `@${(m.name || 'member').toLowerCase().replace(/[^a-z0-9_]/g, '')}`,
      role: m.role || 'Rover Scout'
    })),
    ...leaders.map(l => ({
      id: l.id,
      name: l.name || 'Leader',
      username: l.username || `@${(l.name || 'leader').toLowerCase().replace(/[^a-z0-9_]/g, '')}`,
      role: l.title || 'Council Leader'
    })),
    {
      id: 'admin_nazih',
      name: 'Administrator',
      username: '@administrator',
      role: 'Portal Administrator'
    }
  ].filter((p, index, self) => 
    p.id && self.findIndex(s => s.id === p.id) === index
  );

  const filteredTagSuggestions = taggablePeople.filter(person => 
    person.username.toLowerCase().includes(`@${tagSearchQuery.toLowerCase()}`) ||
    person.name.toLowerCase().includes(tagSearchQuery.toLowerCase())
  );

  const handleSelectTag = (username: string) => {
    const words = inputText.split(/\s+/);
    if (words.length > 0) {
      words[words.length - 1] = username;
      setInputText(words.join(' ') + ' ');
    } else {
      setInputText(username + ' ');
    }
    setShowTagSuggestions(false);
  };

  const renderMessageText = (text: string) => {
    if (!text) return null;
    
    const parts = text.split(/(\s+)/);
    return parts.map((part, index) => {
      const match = part.match(/^(@\w+)(.*)$/);
      if (match) {
        const usernameTag = match[1].toLowerCase();
        const trailing = match[2];
        
        const exists = taggablePeople.some(p => p.username.toLowerCase() === usernameTag) ||
                       usernameTag === '@administrator' ||
                       usernameTag === '@admin';
                       
        if (exists) {
          return (
            <React.Fragment key={index}>
              <span className="px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-200 text-[11px] inline-block select-all cursor-default">
                {match[1]}
              </span>
              {trailing}
            </React.Fragment>
          );
        }
      }
      return part;
    });
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-slate-100 overflow-hidden">
      {/* WhatsApp Main Outer Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex overflow-hidden shadow-xl border-x border-slate-200 bg-white">
        
        {/* MAIN CHAT AREA */}
        <div className="flex-1 flex flex-col h-full bg-white relative min-w-0">
          
          {/* WHATSAPP TOP HEADER BAR */}
          <div className="bg-[#0f1e36] text-white px-4 py-3 flex items-center justify-between shadow-md z-20 shrink-0">
            <div className="flex items-center gap-3 min-w-0 cursor-pointer" onClick={() => setShowGroupInfo(!showGroupInfo)}>
              <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center text-white shrink-0 border border-white/30 shadow-xs">
                <RoverLogo variant="color" className="w-8 h-8" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold truncate text-white">
                    Arabiyya Rovers
                  </h2>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-medium border border-emerald-500/30 shrink-0 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    {onlineMembersCount} Online • {allPeople.length} Members
                  </span>
                </div>
                <p className="text-xs text-slate-300 truncate font-normal">
                  {allPeople.filter(p => getPresenceInfo(p.lastActive, p.lastLogin, p.id === activeSenderId).isOnline).map(p => p.name.split(' ')[0]).slice(0, 4).join(', ') || allPeople.slice(0, 3).map(p => p.name.split(' ')[0]).join(', ')} {onlineMembersCount > 0 ? 'online' : 'in crew'}
                </p>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {isAdmin && (
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm('Are you sure you want to clear all chat history? This cannot be undone.')) {
                      try {
                        await clearChatHistory();
                      } catch (err) {
                        console.error('Failed to clear chat history:', err);
                      }
                    }
                  }}
                  className="p-2 rounded-lg text-slate-300 hover:text-red-400 hover:bg-white/10 transition-colors cursor-pointer"
                  title="Clear Chat History"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              {/* View Reports Button */}
              {(isAdmin || leaders.some(l => l.id === activeSenderId)) && (
                <button
                  type="button"
                  onClick={() => setShowReportsView(!showReportsView)}
                  className={`p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer ${showReportsView ? 'bg-white/20 text-white' : ''}`}
                  title="View Reports"
                >
                  <div className="relative">
                    <ClipboardList className="w-4 h-4" />
                    {reports.filter(r => r.status === 'pending').length > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full font-bold">
                        {reports.filter(r => r.status === 'pending').length}
                      </span>
                    )}
                  </div>
                </button>
              )}

              {/* Search Toggle Button */}
              <button
                type="button"
                onClick={() => setShowSearch(!showSearch)}
                className={`p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer ${showSearch ? 'bg-white/20 text-white' : ''}`}
                title="Search messages"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Group Info Sidebar Toggle */}
              <button
                type="button"
                onClick={() => setShowGroupInfo(!showGroupInfo)}
                className={`p-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer ${showGroupInfo ? 'bg-white/20 text-white' : ''}`}
                title="Group Info"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* REPORT MESSAGE MODAL OVERLAY */}
          {reportingMessage && (
            <div className="absolute inset-0 z-[60] bg-black/40 flex items-center justify-center p-4 backdrop-blur-[2px]">
              <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
                <div className="bg-red-600 text-white px-4 py-3 flex items-center justify-between">
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <Flag className="w-4 h-4" />
                    Report Message
                  </h3>
                  <button onClick={() => setReportingMessage(null)} className="hover:bg-white/10 rounded-full p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4">
                  <div className="mb-4 bg-slate-50 p-3 rounded-lg border border-slate-200 italic text-slate-600 text-xs">
                    "{reportingMessage.text}"
                  </div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Reason for reporting
                  </label>
                  <textarea
                    rows={4}
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="Describe the issue (e.g., inappropriate language, spam, safety concern)..."
                    className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all resize-none"
                  />
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={handleReportMessage}
                      disabled={!reportReason.trim()}
                      className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold text-xs hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Submit Report
                    </button>
                    <button
                      onClick={() => setReportingMessage(null)}
                      className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs hover:bg-slate-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SEARCH MESSAGES OVERLAY BAR */}
          {showSearch && (
            <div className="bg-slate-800 text-white px-4 py-2 flex items-center gap-2 border-b border-slate-700 shadow-inner z-10">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages, locations or members..."
                className="w-full bg-slate-900/60 text-xs text-white px-3 py-1.5 rounded-lg outline-none border border-slate-700 focus:border-blue-400"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white text-xs">
                  Clear
                </button>
              )}
              <button type="button" onClick={() => setShowSearch(false)} className="text-slate-400 hover:text-white text-xs p-1">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* WHATSAPP CHAT MESSAGES CONTAINER */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-white relative">
            
            {showReportsView ? (
              /* REPORTS VIEW */
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Reported Messages
                  </h3>
                  <button onClick={() => setShowReportsView(false)} className="text-xs text-blue-600 font-semibold">
                    Back to Chat
                  </button>
                </div>

                {reports.length === 0 ? (
                  <div className="text-center py-20 text-slate-500 text-xs italic">
                    No reports found.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div key={report.id} className={`p-3 border rounded-lg shadow-sm ${report.status === 'pending' ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-bold text-slate-600 uppercase">
                            Report #{report.id.slice(-6)}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            report.status === 'pending' ? 'bg-amber-200 text-amber-800' :
                            report.status === 'reviewed' ? 'bg-emerald-100 text-emerald-800' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {report.status}
                          </span>
                        </div>
                        <div className="mb-2">
                          <p className="text-[10px] text-slate-500 mb-1 italic">Reported Message:</p>
                          <div className="p-2 bg-white/60 border border-slate-200 rounded text-xs text-slate-800 italic">
                            "{report.messageText}"
                          </div>
                        </div>
                        <div className="mb-3">
                          <p className="text-[10px] text-slate-500 mb-1 italic">Reason:</p>
                          <p className="text-xs text-slate-800 font-medium">{report.reason}</p>
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                          <div className="text-[9px] text-slate-500">
                            By {report.reporterName} • {formatTime(report.createdAt)}
                          </div>
                          {report.status === 'pending' && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleUpdateReportStatus(report.id, 'reviewed')}
                                className="px-2 py-1 bg-blue-600 text-white text-[10px] rounded font-bold hover:bg-blue-700"
                              >
                                Mark Reviewed
                              </button>
                              <button
                                onClick={() => handleUpdateReportStatus(report.id, 'dismissed')}
                                className="px-2 py-1 bg-slate-200 text-slate-700 text-[10px] rounded font-bold hover:bg-slate-300"
                              >
                                Dismiss
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : loading ? (
              <div className="flex justify-center py-10">
                <div className="w-7 h-7 border-3 border-[#1e40af] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No chat messages found. Type below to send the first message!
              </div>
            ) : (
              filteredMessages.map((msg, index) => {
                const isMe = msg.senderId === activeSenderId;
                const prevMsg = filteredMessages[index - 1];
                const showDate = index === 0 || (prevMsg && formatDate(msg.createdAt) !== formatDate(prevMsg.createdAt));

                return (
                  <React.Fragment key={msg.id}>
                    {showDate && (
                      <div className="flex justify-center my-4">
                        <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                          {formatDate(msg.createdAt)}
                        </span>
                      </div>
                    )}
                    <div
                      className={`flex flex-col group ${isMe ? 'items-end' : 'items-start'}`}
                    >
                    {/* Message Card Bubble */}
                    <div
                      className={`relative max-w-[85%] sm:max-w-[70%] rounded-2xl px-3.5 py-2.5 shadow-sm transition-all ${
                        isMe
                          ? 'bg-[#dcf8c6] text-slate-900 rounded-tr-none border border-emerald-200/60'
                          : 'bg-white text-slate-900 rounded-tl-none border border-slate-200/80'
                      }`}
                    >
                      {/* Sender Name & Role Header (For Incoming Messages or Group Context) */}
                      {!isMe && !msg.isDeleted && (
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={`text-xs font-bold ${getSenderColor(msg.senderName)} flex items-center gap-1`}>
                            {msg.senderId === 'admin_nazih' || msg.senderRole === 'Administrator' || msg.senderName === 'Ahmed Nazih Nafiz' || msg.senderName === 'Portal Administrator' || msg.senderName === 'Administrator' ? 'Administrator' : msg.senderName}
                            {msg.senderRole === 'Advisor' || msg.senderRole === 'Crew Leader' ? (
                              <BadgeCheck className="w-3.5 h-3.5 text-amber-500 inline" />
                            ) : null}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                            {msg.senderCrew || 'Rover'}
                          </span>
                        </div>
                      )}

                      {/* Quoted Reply Box if Replying */}
                      {msg.replyTo && messages.some(m => m.id === msg.replyTo?.id && !m.isDeleted) && (
                        <div className="mb-2 p-2 rounded-lg bg-black/5 border-l-4 border-[#1e40af] text-xs">
                          <div className="font-bold text-[#1e40af] text-[11px]">
                            {msg.replyTo.senderName === 'Ahmed Nazih Nafiz' || msg.replyTo.senderName === 'Portal Administrator' || msg.replyTo.senderName === 'Administrator' ? 'Administrator' : msg.replyTo.senderName}
                          </div>
                          <div className="text-slate-600 line-clamp-2 text-[11px]">
                            {msg.replyTo.text}
                          </div>
                        </div>
                      )}

                      {/* MESSAGE CONTENT BY TYPE */}
                      {msg.isDeleted ? (
                        <p className="text-xs text-slate-400 italic leading-relaxed flex items-center gap-1.5 py-0.5">
                          <span>Message deleted.</span>
                        </p>
                      ) : msg.type === 'location' ? (
                        <div className="space-y-2 my-1">
                          <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-slate-800">
                            <div className="w-8 h-8 rounded-lg bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                              <MapPin className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900">Current Crew Location</div>
                              <div className="text-xs font-semibold text-red-700 truncate">{msg.locationName}</div>
                            </div>
                          </div>
                          <p className="text-xs text-slate-800 leading-relaxed font-normal">{renderMessageText(msg.text)}</p>
                        </div>
                      ) : msg.type === 'image' ? (
                        <div className="space-y-1.5 my-1">
                          {msg.mediaUrl && (
                            <img
                              src={msg.mediaUrl}
                              alt="Expedition Attachment"
                              className="w-full max-h-60 object-cover rounded-xl border border-slate-200 shadow-xs"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          )}
                          <p className="text-xs text-slate-800 leading-relaxed">{renderMessageText(msg.text)}</p>
                        </div>
                      ) : msg.type === 'voice' ? (
                        <div className="flex items-center gap-3 py-1 my-0.5">
                          <button
                            type="button"
                            className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0 hover:bg-emerald-700 transition-colors shadow-xs"
                          >
                            <Volume2 className="w-4 h-4" />
                          </button>
                          <div className="flex-1 space-y-1">
                            <div className="h-2 bg-slate-300/80 rounded-full w-full overflow-hidden">
                              <div className="h-full bg-emerald-600 w-3/4 rounded-full" />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                              <span>Voice Update</span>
                              <span>{msg.mediaUrl || '0:14'}</span>
                            </div>
                          </div>
                        </div>
                      ) : editingMessageId === msg.id ? (
                        <div className="flex flex-col gap-1 w-full">
                          <input
                            value={editInputText}
                            onChange={(e) => setEditInputText(e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg text-xs"
                          />
                          <div className="flex gap-2">
                            <button onClick={() => handleEditMessage(msg.id, editInputText)} className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Save</button>
                            <button onClick={() => setEditingMessageId(null)} className="text-xs bg-slate-200 px-2 py-1 rounded">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        /* Standard Text Message */
                        <div className="flex flex-col gap-0.5">
                          <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap break-words font-normal">
                            {renderMessageText(msg.text)}
                          </p>
                          {msg.editedAt && (
                            <div className="text-[9px] text-slate-400 italic">
                              edited
                              {(isAdmin || leaders.some(l => l.id === activeSenderId)) && msg.editHistory && (
                                <div className="mt-1 bg-slate-50 p-1 rounded">
                                  {msg.editHistory.map((h, i) => (
                                    <div key={i} className="text-[9px] text-slate-500">
                                      {h.text} ({formatTime(h.editedAt)})
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* MESSAGE FOOTER: TIMESTAMP, REACTIONS, TICKS */}
                      <div className="mt-1 flex items-center justify-between gap-3 text-[10px] text-slate-500 pt-0.5">
                        {/* Reaction Badges */}
                        <div className="flex items-center gap-1">
                          {!msg.isDeleted && msg.reactions && Object.entries(msg.reactions).map(([emoji, uidsUnknown]) => {
                            const uids = uidsUnknown as string[];
                            return (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleToggleReaction(msg.id, emoji, msg.reactions)}
                                className={`px-1.5 py-0.5 rounded-full text-[10px] border flex items-center gap-1 cursor-pointer transition-transform hover:scale-105 ${
                                  uids.includes(activeSenderId)
                                    ? 'bg-blue-100 border-blue-300 text-blue-900 font-bold'
                                    : 'bg-slate-100 border-slate-200 text-slate-700'
                                }`}
                              >
                                <span>{emoji}</span>
                                <span>{uids.length}</span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Timestamp & Ticks */}
                        <div className="flex items-center gap-1 ml-auto shrink-0 font-medium">
                          <span className="text-[10px] text-slate-500">{formatTime(msg.createdAt)}</span>
                          {isMe && (
                            <CheckCheck className="w-3.5 h-3.5 text-blue-600 inline" />
                          )}
                        </div>
                      </div>

                      {/* QUICK ACTION CONTROLS ON HOVER */}
                      <div className={`absolute top-1.5 ${isMe ? '-left-16' : '-right-16'} hidden group-hover:flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1 shadow-md z-10`}>
                        {!msg.isDeleted && (
                          <>
                            <button
                              type="button"
                              onClick={() => setReplyToMessage(msg)}
                              className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-blue-600"
                              title="Reply"
                            >
                              <Reply className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleReaction(msg.id, '👍', msg.reactions)}
                              className="p-1 hover:bg-slate-100 rounded text-slate-600"
                              title="React 👍"
                            >
                              👍
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleReaction(msg.id, '❤️', msg.reactions)}
                              className="p-1 hover:bg-slate-100 rounded text-slate-600"
                              title="React ❤️"
                            >
                              ❤️
                            </button>
                            <button
                              type="button"
                              onClick={() => setReactionMsgId(msg.id)}
                              className="p-1 hover:bg-slate-100 rounded text-slate-600"
                              title="More reactions"
                            >
                              ➕
                            </button>
                            {reactionMsgId === msg.id && (
                              <div className="absolute top-10 right-0 bg-white border border-slate-200 rounded-lg p-2 shadow-xl z-20 w-48 grid grid-cols-6 gap-1">
                                {['👍', '❤️', '🔥', '👏', '😊', '📍', '⛺', '⚜️', '💪', '🙌', '🎉', '✅', '😂', '😯', '😢', '😡', '💀', '👀'].map((emoji) => (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => {
                                      handleToggleReaction(msg.id, emoji, msg.reactions);
                                      setReactionMsgId(null);
                                    }}
                                    className="p-1 hover:bg-slate-200 rounded transition-transform active:scale-125 text-lg"
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                            {(isAdmin || isMe) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingMessageId(msg.id);
                                  setEditInputText(msg.text);
                                }}
                                className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-blue-600"
                                title="Edit"
                              >
                                ✏️
                              </button>
                            )}
                            {!isMe && !msg.isDeleted && (
                              <button
                                type="button"
                                onClick={() => setReportingMessage(msg)}
                                className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-red-600"
                                title="Report"
                              >
                                <Flag className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {(isAdmin || isMe) && (
                              <button
                                type="button"
                                onClick={() => handleDeleteMessage(msg.id)}
                                className="p-1 hover:bg-red-50 rounded text-red-500"
                                title="Delete (Safe)"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        )}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => handlePurgeMessage(msg.id)}
                            className="p-1 hover:bg-red-100 rounded text-red-700"
                            title="Purge (Delete Without Trace)"
                          >
                            <ShieldAlert className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                    </div>
                  </div>
                </React.Fragment>
                );
              })
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* QUOTED REPLY BAR OVERLAY ABOVE INPUT */}
          {replyToMessage && (
            <div className="bg-slate-200/90 border-t border-slate-300 px-4 py-2 flex items-center justify-between text-xs animate-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2 min-w-0">
                <Reply className="w-4 h-4 text-[#1e40af] shrink-0" />
                <div className="min-w-0">
                  <span className="font-bold text-[#1e40af]">Replying to {replyToMessage.senderName}:</span>
                  <p className="text-slate-600 truncate">{replyToMessage.text}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReplyToMessage(null)}
                className="p-1 text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* TAG SUGGESTIONS POPUP OVERLAY */}
          {showTagSuggestions && filteredTagSuggestions.length > 0 && (
            <div className="bg-white border-t border-slate-200 shadow-lg max-h-48 overflow-y-auto animate-in slide-in-from-bottom-2 z-30">
              <div className="px-3.5 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Mention crew member...
              </div>
              <div className="divide-y divide-slate-100">
                {filteredTagSuggestions.map((person) => (
                  <button
                    key={person.id}
                    type="button"
                    onClick={() => handleSelectTag(person.username)}
                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-800 block">
                        {person.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-semibold">
                        {person.role}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#1e40af] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                      {person.username}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* QUICK EMOJI BAR IF OPEN */}
          {showEmojiPicker && (
            <div className="bg-slate-100 border-t border-slate-200 px-4 py-2 flex items-center gap-2 overflow-x-auto text-lg">
              {['👍', '❤️', '🔥', '👏', '😊', '📍', '⛺', '⚜️', '💪', '🙌', '🎉', '✅'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    setInputText((prev) => prev + emoji);
                  }}
                  className="p-1.5 hover:bg-slate-200 rounded-lg transition-transform active:scale-125 cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          {/* ATTACHMENT MENU POPUP */}
          {showAttachmentMenu && (
            <div className="bg-white border-t border-slate-200 p-3 shadow-lg flex items-center justify-around text-xs animate-in slide-in-from-bottom-2">
              <button
                type="button"
                onClick={() => {
                  setLocationModalOpen(true);
                  setShowAttachmentMenu(false);
                }}
                className="flex flex-col items-center gap-1.5 text-slate-700 hover:text-red-600 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <span className="font-semibold text-[11px]">Share Location</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setImageModalOpen(true);
                  setShowAttachmentMenu(false);
                }}
                className="flex flex-col items-center gap-1.5 text-slate-700 hover:text-blue-600 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <span className="font-semibold text-[11px]">Expedition Photo</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleSendLocation(activeSenderCrew + ' HQ');
                  setShowAttachmentMenu(false);
                }}
                className="flex flex-col items-center gap-1.5 text-slate-700 hover:text-emerald-600 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Compass className="w-5 h-5" />
                </div>
                <span className="font-semibold text-[11px]">Crew Base Update</span>
              </button>
            </div>
          )}

          {/* VOICE RECORDING BAR IF ACTIVE */}
          {isRecordingVoice ? (
            <div className="bg-red-50 border-t border-red-200 px-4 py-3 flex items-center justify-between z-20">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-600 animate-ping" />
                <span className="text-xs font-bold text-red-700">Recording Voice Update...</span>
                <span className="text-xs font-mono text-red-900 font-bold">0:{recordingSeconds < 10 ? '0' : ''}{recordingSeconds}</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsRecordingVoice(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendVoiceNote}
                  className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Send Voice Note
                </button>
              </div>
            </div>
          ) : (
            /* WHATSAPP BOTTOM INPUT BAR */
            <form onSubmit={handleSendMessage} className="bg-[#f0f2f5] px-3 py-2.5 flex items-center gap-2 border-t border-slate-300 z-20">
              {/* Emoji Toggle */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
                title="Emojis"
              >
                <Smile className="w-5 h-5" />
              </button>

              {/* Attachment Toggle */}
              <button
                type="button"
                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-full transition-colors cursor-pointer"
                title="Attach location or photo"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {/* Main Message Text Input */}
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Message as ${activeSenderName}...`}
                className="flex-1 bg-white text-sm text-slate-900 px-4 py-2.5 rounded-full outline-none border border-slate-300 focus:border-[#1e40af] shadow-2xs"
              />

              {/* Location Quick Button */}
              <button
                type="button"
                onClick={() => setLocationModalOpen(true)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                title="Quick Share Location"
              >
                <MapPin className="w-5 h-5" />
              </button>

              {/* Send or Voice Note Button */}
              {inputText.trim() ? (
                <button
                  type="submit"
                  className="w-10 h-10 rounded-full bg-[#1e40af] hover:bg-[#1e3a8a] text-white flex items-center justify-center shrink-0 shadow-md transition-transform active:scale-95 cursor-pointer"
                  title="Send message"
                >
                  <Send className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsRecordingVoice(true)}
                  className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-md transition-transform active:scale-95 cursor-pointer"
                  title="Record voice note"
                >
                  <Mic className="w-4 h-4" />
                </button>
              )}
            </form>
          )}

        </div>

        {/* RIGHT GROUP INFO SIDEBAR (WHATSAPP DRAWERS STYLE) */}
        {showGroupInfo && (
          <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full z-30 animate-in slide-in-from-right duration-200 shrink-0">
            {/* Header */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0f1e36] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#1e40af]" />
                Group Info
              </h3>
              <button
                type="button"
                onClick={() => setShowGroupInfo(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Crew Profile Card */}
            <div className="p-5 text-center border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-white text-[#800020] flex items-center justify-center p-2 shadow-md mb-3 border border-slate-200">
                <RoverLogo variant="color" className="w-16 h-16" />
              </div>
              <h4 className="text-base font-bold text-[#0f1e36]">Arabiyya Rovers</h4>
              <p className="text-xs text-slate-500 font-medium">Arabiyya Beyond Limits • All Members</p>
              <div className="mt-3 flex justify-center gap-1.5 text-[11px] flex-wrap">
                <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-200 font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {onlineMembersCount} Online Now
                </span>
                <span className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg border border-blue-200 font-semibold">
                  {allPeople.length} Members
                </span>
                <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg border border-amber-200 font-semibold">
                  {leaders.length} Leadership
                </span>
              </div>
            </div>

            {/* Group Members List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                <span>Crew Roster & Presence</span>
                <span className="text-[10px] text-emerald-600 font-medium lowercase">
                  {onlineMembersCount} active
                </span>
              </div>

              {allPeople.map((person) => {
                const isSelf = activeSenderId === person.id;
                const presence = getPresenceInfo(person.lastActive, person.lastLogin, isSelf);

                return (
                  <div
                    key={person.id}
                    onClick={() => handleSelectPoster(person)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      activeSenderId === person.id
                        ? 'bg-blue-50/90 border-blue-300 text-[#1e40af] shadow-xs'
                        : 'bg-white border-slate-200/90 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 w-full">
                      {/* Avatar with live presence indicator dot */}
                      <div className="relative shrink-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#1e40af] to-[#0f1e36] text-white flex items-center justify-center text-xs font-bold shadow-xs">
                          {person.name.charAt(0)}
                        </div>
                        <span 
                          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full ring-2 ring-white ${presence.color} ${
                            presence.isOnline ? 'animate-pulse' : ''
                          }`}
                          title={presence.timeText}
                        />
                      </div>

                      {/* Name, Role & Presence tag */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1">
                            {person.name}
                            {isSelf && (
                              <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.2 rounded font-normal shrink-0">You</span>
                            )}
                          </div>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border shrink-0 flex items-center gap-1 ${presence.badgeClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${presence.color} ${presence.isOnline ? 'animate-pulse' : ''}`} />
                            {presence.statusText}
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-500 truncate flex items-center justify-between gap-1 mt-0.5">
                          <span className="truncate">{person.role} • {person.crew}</span>
                          <span className="text-[9px] text-slate-400 font-normal shrink-0 hidden sm:inline">
                            {presence.timeText}
                          </span>
                        </div>

                        {person.location && (
                          <div className="text-[10px] text-red-600 font-medium truncate flex items-center gap-0.5 mt-0.5">
                            <MapPin className="w-2.5 h-2.5 shrink-0" /> {person.location}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* SHARE LOCATION MODAL */}
      {locationModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 text-red-600">
                <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#0f1e36]">Share Current Location</h3>
              </div>
              <button type="button" onClick={() => setLocationModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Location Name
              </label>
              <input
                type="text"
                value={customLocationText}
                onChange={(e) => setCustomLocationText(e.target.value)}
                placeholder="e.g. Alpha Crew HQ, Hulhumalé Base, Villingili Camp..."
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
                Quick Location Presets
              </label>
              <div className="flex flex-wrap gap-1.5">
                {['Alpha Crew HQ, Malé', 'Hulhumalé Scout Base', 'Villingili Expedition Camp', 'Arabiyya Den', 'On Field Duty'].map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setCustomLocationText(loc)}
                    className="px-2.5 py-1 rounded-lg text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer"
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setLocationModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSendLocation(customLocationText)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 flex items-center gap-1.5"
              >
                <MapPin className="w-3.5 h-3.5" /> Share to Chat
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHARE EXPEDITION PHOTO MODAL */}
      {imageModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5 text-blue-600">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#0f1e36]">Share Photo</h3>
              </div>
              <button type="button" onClick={() => setImageModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Image URL
              </label>
              <input
                type="url"
                value={imageUrlText}
                onChange={(e) => setImageUrlText(e.target.value)}
                placeholder="https://images.unsplash.com/photo-..."
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Photo Caption
              </label>
              <input
                type="text"
                value={imageCaptionText}
                onChange={(e) => setImageCaptionText(e.target.value)}
                placeholder="e.g. Pioneering bridge construction in Hulhumalé..."
                className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af]"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setImageModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendImage}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#1e40af] hover:bg-[#1e3a8a] flex items-center gap-1.5"
              >
                <ImageIcon className="w-3.5 h-3.5" /> Share Photo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
