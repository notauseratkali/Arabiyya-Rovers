import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query,
  orderBy,
  writeBatch,
  getDoc,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase';

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  senderCrew?: string;
  senderBadge?: string;
  text: string;
  type: 'text' | 'image' | 'location' | 'voice' | 'system';
  mediaUrl?: string;
  locationName?: string;
  replyTo?: {
    id: string;
    senderName: string;
    text: string;
  };
  reactions?: Record<string, string[]>; // e.g., { '👍': ['m1', 'm2'], '❤️': ['m3'] }
  createdAt: string;
  isDeleted?: boolean;
  editedAt?: string;
  editHistory?: { text: string; editedAt: string }[];
}

export interface MessageReport {
  id: string;
  reporterId: string;
  reporterName: string;
  messageId: string;
  messageText: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  createdAt: string;
}

const CHAT_COLLECTION = 'chat_messages';
const REPORTS_COLLECTION = 'reports';

export const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: 'msg_1',
    senderId: 'l1',
    senderName: 'Ibrahim Rasheed',
    senderRole: 'Advisor',
    senderCrew: 'Council',
    senderBadge: 'Wood Badge',
    text: 'Assalamu Alaikum Rovers & Crew Leaders! Welcome to the official Arabiyya Rovers Group Chat. Use this channel for real-time field updates, expedition notices, and crew announcements.',
    type: 'text',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    reactions: { '❤️': ['m1', 'm2'], '👍': ['m3'] }
  },
  {
    id: 'msg_2',
    senderId: 'm1',
    senderName: 'Mohamed Naiz',
    senderRole: 'Crew Leader',
    senderCrew: 'Alpha Crew',
    senderBadge: 'Explorer',
    text: 'Wa Alaikum Assalam Leader! Reminder for all crew heads: Tomorrow\'s expedition planning meeting is at 16:30.',
    type: 'text',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    reactions: { '👍': ['m2'] }
  },
  {
    id: 'msg_3',
    senderId: 'm1',
    senderName: 'Mohamed Naiz',
    senderRole: 'Crew Leader',
    senderCrew: 'Alpha Crew',
    senderBadge: 'Explorer',
    text: 'Meeting Location: Alpha Crew HQ, Malé',
    type: 'location',
    locationName: 'Alpha Crew HQ, Malé',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3.8).toISOString()
  },
  {
    id: 'msg_4',
    senderId: 'm2',
    senderName: 'Aminath Zara',
    senderRole: 'Quartermaster',
    senderCrew: 'Delta Crew',
    senderBadge: 'Rover Citizen',
    text: 'Inventory report for the camping gear is finalized! All 12 tents and field stoves are cleaned and packed.',
    type: 'text',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    reactions: { '🔥': ['m1'], '👏': ['m3'] }
  },
  {
    id: 'msg_5',
    senderId: 'm3',
    senderName: 'Ahmed Hassan',
    senderRole: 'Rover Scout',
    senderCrew: 'Bravo Crew',
    senderBadge: 'Initiate',
    text: 'Voice update regarding pioneering pole drop-offs at Hulhumalé base:',
    type: 'voice',
    mediaUrl: '0:18',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  }
];

export function subscribeToChatMessages(
  onUpdate: (messages: ChatMessage[]) => void,
  onError: (error: Error) => void
) {
  const chatQuery = query(collection(db, CHAT_COLLECTION), orderBy('createdAt', 'asc'));

  return onSnapshot(
    chatQuery,
    async (snapshot) => {
      if (snapshot.empty) {
        try {
          const settingsRef = doc(db, 'system', 'portal_settings');
          const settingsSnap = await getDoc(settingsRef);
          if (!settingsSnap.exists() || !settingsSnap.data()?.chatSeeded) {
            const batch = writeBatch(db);
            INITIAL_CHAT_MESSAGES.forEach((msg) => {
              const ref = doc(db, CHAT_COLLECTION, msg.id);
              batch.set(ref, msg);
            });
            batch.set(settingsRef, { chatSeeded: true }, { merge: true });
            await batch.commit();
            onUpdate(INITIAL_CHAT_MESSAGES);
            return;
          } else {
            onUpdate([]);
            return;
          }
        } catch (e) {
          console.error('Error seeding initial chat messages:', e);
          onUpdate(INITIAL_CHAT_MESSAGES);
          return;
        }
      }

      const messages = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as ChatMessage[];

      onUpdate(messages);
    },
    (err) => {
      console.error('Chat snapshot error:', err);
      onError(err);
    }
  );
}

export const DEFAULT_WELCOME_MESSAGE_DRAFT = 
  "Assalamu Alaikum and a warm welcome to our newest member, {name} ({username})! ⚜️ We are delighted to welcome you to {crew} as a {role}. Welcome to the Arabiyya Rover Network — Arabiyya Beyond Limits!";

export async function sendWelcomeMessageForMember(member: {
  id: string;
  name: string;
  username?: string;
  crew?: string;
  role?: string;
  badgeRank?: string;
  idCard?: string;
  [key: string]: any;
}): Promise<boolean> {
  if (!member || !member.id) return false;

  try {
    // 1. Fetch system settings for draft template and enabled status
    const settingsRef = doc(db, 'system', 'portal_settings');
    const settingsSnap = await getDoc(settingsRef);
    const settingsData = settingsSnap.exists() ? settingsSnap.data() : {};

    // Check if auto welcome message is disabled
    if (settingsData.welcomeMessageEnabled === false) {
      return false;
    }

    const draft = settingsData.welcomeMessageDraft || DEFAULT_WELCOME_MESSAGE_DRAFT;

    // 2. Interpolate dynamic token placeholders
    const formattedText = draft
      .replace(/{name}/g, member.name || 'Rover Member')
      .replace(/{username}/g, member.username || '')
      .replace(/{crew}/g, member.crew || 'General Crew')
      .replace(/{role}/g, member.role || 'Rover Scout')
      .replace(/{section}/g, member.role || 'Rover Scout')
      .replace(/{badgeRank}/g, member.badgeRank || 'Scout')
      .replace(/{idCard}/g, member.idCard || '');

    // 3. Post to chat as Administrator
    const welcomeMsgId = 'welcome_' + member.id + '_' + Date.now();
    await sendChatMessage({
      id: welcomeMsgId,
      senderId: 'admin_nazih',
      senderName: 'Administrator',
      senderRole: 'Administrator',
      senderCrew: 'Council HQ',
      senderBadge: 'Administrator',
      text: formattedText,
      type: 'text',
      createdAt: new Date().toISOString()
    });

    // 4. Update member record to mark welcomed
    const memberDocRef = doc(db, 'members', member.id);
    await setDoc(memberDocRef, {
      welcomedToChat: true,
      hasLoggedInBefore: true,
      welcomedAt: new Date().toISOString()
    }, { merge: true });

    return true;
  } catch (err) {
    console.error('Error sending auto welcome message for member:', err);
    return false;
  }
}

export async function sendChatMessage(msgData: Partial<ChatMessage>): Promise<void> {
  const msgId = msgData.id || 'msg_' + Date.now();
  const ref = doc(db, CHAT_COLLECTION, msgId);

  const fullMsg: Record<string, any> = {
    id: msgId,
    senderId: msgData.senderId || 'm1',
    senderName: msgData.senderName || 'Anonymous Rover',
    senderRole: msgData.senderRole || 'Rover Scout',
    senderCrew: msgData.senderCrew || 'Alpha Crew',
    senderBadge: msgData.senderBadge || 'Explorer',
    text: msgData.text || '',
    type: msgData.type || 'text',
    mediaUrl: msgData.mediaUrl || '',
    locationName: msgData.locationName || '',
    reactions: msgData.reactions || {},
    createdAt: msgData.createdAt || new Date().toISOString()
  };

  if (msgData.replyTo && msgData.replyTo.id) {
    fullMsg.replyTo = {
      id: msgData.replyTo.id,
      senderName: msgData.replyTo.senderName || '',
      text: msgData.replyTo.text || ''
    };
  }

  await setDoc(ref, fullMsg, { merge: true });
}

export async function toggleMessageReaction(
  messageId: string, 
  emoji: string, 
  userId: string, 
  currentReactions: Record<string, string[]> = {}
): Promise<void> {
  const ref = doc(db, CHAT_COLLECTION, messageId);
  
  const updatedReactions = { ...currentReactions };
  const userList = updatedReactions[emoji] || [];
  
  if (userList.includes(userId)) {
    // Remove reaction
    updatedReactions[emoji] = userList.filter((id) => id !== userId);
    if (updatedReactions[emoji].length === 0) {
      delete updatedReactions[emoji];
    }
  } else {
    // Add reaction
    updatedReactions[emoji] = [...userList, userId];
  }

  await setDoc(ref, { reactions: updatedReactions }, { merge: true });
}

export async function editChatMessage(messageId: string, newText: string): Promise<void> {
  try {
    const ref = doc(db, CHAT_COLLECTION, messageId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      const currentText = data.text;
      const editHistory = data.editHistory || [];
      const newEditHistory = [...editHistory, { text: currentText, editedAt: data.editedAt || data.createdAt }];

      await setDoc(ref, {
        text: newText,
        editedAt: new Date().toISOString(),
        editHistory: newEditHistory
      }, { merge: true });
    }
  } catch (err) {
    console.error('Failed to edit chat message:', err);
    throw err;
  }
}

export async function deleteChatMessage(messageId: string, isDeletingAsAdmin?: boolean): Promise<void> {
  try {
    const ref = doc(db, CHAT_COLLECTION, messageId);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      const rawName = data.senderName || 'A member';
      
      // If the message is deleted by an admin, delete it fully
      if (isDeletingAsAdmin) {
        console.log('DEBUG: Fully deleting message by admin', messageId);
        await deleteDoc(ref);
        return;
      }

      // Otherwise, perform safe delete with marker
      const name = rawName;
      console.log('DEBUG: Safe deleting message (marker)', messageId);
      await setDoc(ref, {
        text: `${name} deleted a message.`,
        isDeleted: true,
        type: 'text',
        mediaUrl: '',
        locationName: '',
        replyTo: null,
        reactions: {}
      }, { merge: true });
    } else {
      await deleteDoc(ref);
    }
  } catch (err) {
    console.error('Failed to perform safe delete on chat message:', err);
    throw err;
  }
}

export async function clearChatHistory(): Promise<void> {
  try {
    const snapshot = await getDocs(collection(db, CHAT_COLLECTION));
    const batch = writeBatch(db);
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });
    await batch.commit();
  } catch (err) {
    console.error('Failed to clear chat history:', err);
    throw err;
  }
}

export async function reportChatMessage(reportData: Partial<MessageReport>): Promise<void> {
  const reportId = 'rep_' + Date.now();
  const ref = doc(db, REPORTS_COLLECTION, reportId);

  const fullReport: MessageReport = {
    id: reportId,
    reporterId: reportData.reporterId || '',
    reporterName: reportData.reporterName || 'Anonymous',
    messageId: reportData.messageId || '',
    messageText: reportData.messageText || '',
    reason: reportData.reason || 'No reason provided',
    status: 'pending',
    createdAt: new Date().toISOString()
  };

  await setDoc(ref, fullReport);
}

export function subscribeToReports(
  onUpdate: (reports: MessageReport[]) => void,
  onError: (error: Error) => void
) {
  const reportsQuery = query(collection(db, REPORTS_COLLECTION), orderBy('createdAt', 'desc'));

  return onSnapshot(
    reportsQuery,
    (snapshot) => {
      const reports = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as MessageReport[];
      onUpdate(reports);
    },
    (err) => {
      console.error('Reports snapshot error:', err);
      onError(err);
    }
  );
}

export async function updateReportStatus(reportId: string, status: MessageReport['status']): Promise<void> {
  const ref = doc(db, REPORTS_COLLECTION, reportId);
  await setDoc(ref, { status }, { merge: true });
}
