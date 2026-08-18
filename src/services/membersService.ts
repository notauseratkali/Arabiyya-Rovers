import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  deleteDoc, 
  onSnapshot, 
  query,
  writeBatch,
  orderBy
} from 'firebase/firestore';
import { db } from '../firebase';
import { MemberItem, LeadershipItem, INITIAL_MEMBERS, INITIAL_LEADERSHIP } from '../components/MembersPage';

const MEMBERS_COLLECTION = 'members';
const LEADERS_COLLECTION = 'leaders';
const CREWS_COLLECTION = 'crews';

export interface CrewItem {
  id: string;
  name: string;
  description?: string;
  leaderId?: string;
  createdAt: string;
}

export const INITIAL_CREWS: CrewItem[] = [
  { id: 'c1', name: 'Alpha Crew', description: 'Primary field operations crew', createdAt: new Date().toISOString() },
  { id: 'c2', name: 'Bravo Crew', description: 'Logistics and support crew', createdAt: new Date().toISOString() },
  { id: 'c3', name: 'Delta Crew', description: 'Communications and strategy crew', createdAt: new Date().toISOString() }
];

export function subscribeToCrews(
  onUpdate: (crews: CrewItem[]) => void,
  onError: (error: Error) => void
) {
  const crewsQuery = query(collection(db, CREWS_COLLECTION), orderBy('name', 'asc'));
  
  return onSnapshot(
    crewsQuery,
    async (snapshot) => {
      if (snapshot.empty) {
        try {
          const settingsRef = doc(db, 'system', 'portal_settings');
          const settingsSnap = await getDoc(settingsRef);
          if (!settingsSnap.exists() || !settingsSnap.data()?.crewsSeeded) {
            const batch = writeBatch(db);
            INITIAL_CREWS.forEach(c => {
              const ref = doc(db, CREWS_COLLECTION, c.id);
              batch.set(ref, c);
            });
            batch.set(settingsRef, { crewsSeeded: true }, { merge: true });
            await batch.commit();
            onUpdate(INITIAL_CREWS);
            return;
          } else {
            onUpdate([]);
            return;
          }
        } catch (e) {
          console.error('Error seeding crews:', e);
          onUpdate(INITIAL_CREWS);
          return;
        }
      }

      const crews = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as CrewItem[];
      onUpdate(crews);
    },
    (err) => {
      console.error(err);
      onError(err);
    }
  );
}

export async function createCrew(crewData: Partial<CrewItem>): Promise<void> {
  const crewId = crewData.id || 'crew_' + Date.now();
  const ref = doc(db, CREWS_COLLECTION, crewId);
  await setDoc(ref, {
    ...crewData,
    id: crewId,
    createdAt: new Date().toISOString()
  }, { merge: true });
}

export async function deleteCrew(crewId: string): Promise<void> {
  const ref = doc(db, CREWS_COLLECTION, crewId);
  await deleteDoc(ref);
}

export async function updateCrew(crewId: string, data: Partial<CrewItem>): Promise<void> {
  const ref = doc(db, CREWS_COLLECTION, crewId);
  await setDoc(ref, data, { merge: true });
}

export function subscribeToMembers(
  onUpdate: (members: any[]) => void,
  onError: (error: Error) => void
) {
  const membersQuery = query(collection(db, MEMBERS_COLLECTION));
  
  return onSnapshot(
    membersQuery,
    async (snapshot) => {
      if (snapshot.empty) {
        // Check if database was already seeded before
        try {
          const settingsRef = doc(db, 'system', 'portal_settings');
          const settingsSnap = await getDoc(settingsRef);
          if (!settingsSnap.exists() || !settingsSnap.data()?.membersSeeded) {
            const batch = writeBatch(db);
            INITIAL_MEMBERS.forEach(m => {
              const ref = doc(db, MEMBERS_COLLECTION, m.id);
              batch.set(ref, { ...m, createdAt: new Date().toISOString() });
            });
            batch.set(settingsRef, { membersSeeded: true }, { merge: true });
            await batch.commit();
            onUpdate(INITIAL_MEMBERS);
            return;
          } else {
            // Previously seeded, but user deleted all members. Keep empty array.
            onUpdate([]);
            return;
          }
        } catch (e) {
          console.error('Error checking seed status:', e);
          onUpdate([]);
          return;
        }
      }

      // Mark as seeded so future deletions don't re-trigger seeding
      try {
        const settingsRef = doc(db, 'system', 'portal_settings');
        setDoc(settingsRef, { membersSeeded: true }, { merge: true }).catch(() => {});
      } catch (e) {
        // Ignore background settings update error
      }

      const members = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      onUpdate(members);
    },
    (err) => {
      console.error(err);
      onError(err);
    }
  );
}

export async function createMember(memberData: any, password?: string): Promise<void> {
  let uid = memberData.id;
  if (!uid) {
    uid = 'member_' + Date.now();
  }

  const memberRef = doc(db, MEMBERS_COLLECTION, uid);
  await setDoc(memberRef, {
    ...memberData,
    id: uid, // make sure ID matches
    password: password || '123456',
    hasLoggedInBefore: false,
    welcomedToChat: false,
    createdAt: new Date().toISOString()
  }, { merge: true });
}

export async function deleteMember(memberId: string): Promise<void> {
  const memberRef = doc(db, MEMBERS_COLLECTION, memberId);
  await deleteDoc(memberRef);
}

export async function updateMember(memberId: string, data: Partial<MemberItem>): Promise<void> {
  const memberRef = doc(db, MEMBERS_COLLECTION, memberId);
  await setDoc(memberRef, data, { merge: true });
}

export async function updateMemberPresence(memberId: string): Promise<void> {
  if (!memberId) return;
  try {
    const memberRef = doc(db, MEMBERS_COLLECTION, memberId);
    const nowIso = new Date().toISOString();
    await setDoc(memberRef, {
      lastActive: nowIso,
      lastSeen: nowIso
    }, { merge: true });
  } catch (err) {
    // Ignore presence errors in background
  }
}

export function subscribeToLeaders(
  onUpdate: (leaders: any[]) => void,
  onError: (error: Error) => void
) {
  const leadersQuery = query(collection(db, LEADERS_COLLECTION));
  
  return onSnapshot(
    leadersQuery,
    async (snapshot) => {
      if (snapshot.empty) {
        try {
          const settingsRef = doc(db, 'system', 'portal_settings');
          const settingsSnap = await getDoc(settingsRef);
          if (!settingsSnap.exists() || !settingsSnap.data()?.leadersSeeded) {
            const batch = writeBatch(db);
            INITIAL_LEADERSHIP.forEach(l => {
              const ref = doc(db, LEADERS_COLLECTION, l.id);
              batch.set(ref, { ...l, createdAt: new Date().toISOString() });
            });
            batch.set(settingsRef, { leadersSeeded: true }, { merge: true });
            await batch.commit();
            onUpdate(INITIAL_LEADERSHIP);
            return;
          } else {
            onUpdate([]);
            return;
          }
        } catch (e) {
          console.error('Error checking leaders seed status:', e);
          onUpdate([]);
          return;
        }
      }

      try {
        const settingsRef = doc(db, 'system', 'portal_settings');
        setDoc(settingsRef, { leadersSeeded: true }, { merge: true }).catch(() => {});
      } catch (e) {}

      const leaders = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      onUpdate(leaders);
    },
    (err) => {
      console.error(err);
      onError(err);
    }
  );
}

export async function createLeader(leaderData: any): Promise<void> {
  let uid = leaderData.id || 'l_' + Date.now();
  const ref = doc(db, LEADERS_COLLECTION, uid);
  await setDoc(ref, {
    ...leaderData,
    id: uid,
    createdAt: new Date().toISOString()
  }, { merge: true });
}

export async function updateLeader(leaderId: string, data: Partial<LeadershipItem>): Promise<void> {
  const ref = doc(db, LEADERS_COLLECTION, leaderId);
  await setDoc(ref, data, { merge: true });
}

export async function deleteLeader(leaderId: string): Promise<void> {
  const ref = doc(db, LEADERS_COLLECTION, leaderId);
  await deleteDoc(ref);
}

