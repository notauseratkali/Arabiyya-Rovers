import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase';
import { AnnouncementItem } from '../types';

const ANNOUNCEMENTS_COLLECTION = 'announcements';

export const INITIAL_ANNOUNCEMENTS: AnnouncementItem[] = [
  {
    id: 'ann_1',
    title: 'Arabiyya Rover Crew Annual General Meeting 2026',
    content: 'The Annual General Meeting of Arabiyya Rover Crew is scheduled for this Saturday at the Crew HQ, Arabiyya School Hall. All Rovers and Leaders are requested to be present in full uniform by 16:00. Agenda includes quarterly report presentation, crew leader assignments, and upcoming expedition planning.',
    category: 'Council Notice',
    priority: 'high',
    authorName: 'Ahmed Nazih Nafiz',
    authorRole: 'Administrator',
    createdAt: '2026-08-15 10:00',
    pinned: true,
    eventDate: '2026-08-22 16:00',
    location: 'Arabiyya School Main Hall, Malé'
  },
  {
    id: 'ann_2',
    title: 'Haa Dhaalu Kulhudhuffushi Survival & Leadership Training',
    content: 'Registration is now open for the 5-day Survival & Wilderness Leadership Camp in Haa Dhaalu Atoll. Open to all active Explorers and Rover Scouts. Please submit your registration form via the Crew Leader before Wednesday.',
    category: 'Training',
    priority: 'normal',
    authorName: 'Mohamed Naiz',
    authorRole: 'Crew Leader',
    createdAt: '2026-08-12 14:30',
    pinned: false,
    eventDate: '2026-09-05 08:00',
    location: 'Kulhudhuffushi City, Haa Dhaalu Atoll'
  },
  {
    id: 'ann_3',
    title: 'Urgent Weather Advisory: Southern Atolls Sea Swells',
    content: 'National Meteorological Centre has issued a yellow alert for strong winds and heavy sea swells affecting Kaafu to Seenu Atoll. All sea-based crew exercises and inter-atoll ferry activities are suspended until further notice.',
    category: 'Urgent',
    priority: 'urgent',
    authorName: 'Aishath Zaya',
    authorRole: 'Rover Advisor',
    createdAt: '2026-08-17 09:15',
    pinned: true,
    location: 'Central & Southern Atolls'
  }
];

export function subscribeToAnnouncements(
  onUpdate: (items: AnnouncementItem[]) => void,
  onError?: (error: Error) => void
) {
  try {
    const colRef = collection(db, ANNOUNCEMENTS_COLLECTION);
    const q = query(colRef, orderBy('createdAt', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const hasBeenSeeded = localStorage.getItem('koshaaru_announcements_seeded_v1') === 'true';

        if (snapshot.empty && !hasBeenSeeded) {
          localStorage.setItem('koshaaru_announcements_seeded_v1', 'true');
          // Seed initial announcements once
          INITIAL_ANNOUNCEMENTS.forEach(async (item) => {
            try {
              await setDoc(doc(db, ANNOUNCEMENTS_COLLECTION, item.id), item);
            } catch (err) {
              console.error('Failed to seed announcement:', err);
            }
          });
          onUpdate(INITIAL_ANNOUNCEMENTS);
        } else {
          if (snapshot.empty) {
            onUpdate([]);
          } else {
            const list: AnnouncementItem[] = [];
            snapshot.forEach((docSnap) => {
              list.push(docSnap.data() as AnnouncementItem);
            });
            onUpdate(list);
          }
        }
      },
      (error) => {
        console.warn('Firestore Snapshot error on announcements, fallback to local', error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.error('Failed to initialize announcements subscription:', err);
    return () => {};
  }
}

export async function createAnnouncementInFirestore(item: AnnouncementItem) {
  try {
    const docRef = doc(db, ANNOUNCEMENTS_COLLECTION, item.id);
    await setDoc(docRef, item);
  } catch (err) {
    console.error('Failed to save announcement to Firestore:', err);
    throw err;
  }
}

export async function deleteAnnouncementFromFirestore(id: string) {
  try {
    const docRef = doc(db, ANNOUNCEMENTS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (err) {
    console.error('Failed to delete announcement from Firestore:', err);
    throw err;
  }
}

export async function togglePinAnnouncementInFirestore(id: string, currentPinnedState: boolean) {
  try {
    const docRef = doc(db, ANNOUNCEMENTS_COLLECTION, id);
    await updateDoc(docRef, { pinned: !currentPinnedState });
  } catch (err) {
    console.error('Failed to toggle pin state for announcement:', err);
    throw err;
  }
}
