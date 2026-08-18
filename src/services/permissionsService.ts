import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase';

export interface PagePermissions {
  memberId: string;
  memberName: string;
  grantedPages: string[]; // e.g. ['governance', 'finance', 'progress', 'events', 'media', 'records']
}

const PERMISSIONS_COLLECTION = 'page_permissions';

/**
 * Subscribes to page permissions inside Firestore.
 */
export function subscribeToPermissions(
  onUpdate: (perms: PagePermissions[]) => void,
  onError?: (error: Error) => void
) {
  try {
    const colRef = collection(db, PERMISSIONS_COLLECTION);
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: PagePermissions[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            memberId: docSnap.id,
            memberName: data.memberName || 'Unknown Member',
            grantedPages: Array.isArray(data.grantedPages) ? data.grantedPages : []
          });
        });
        onUpdate(list);
      },
      (error) => {
        console.warn('Firestore subscription notice for permissions:', error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.error('Permissions initialization failed:', err);
    return () => {};
  }
}

/**
 * Update access permission for a single member and page.
 */
export async function updatePageAccess(
  memberId: string,
  memberName: string,
  pageId: string,
  hasAccess: boolean
): Promise<void> {
  try {
    const docRef = doc(db, PERMISSIONS_COLLECTION, memberId);
    const snap = await getDoc(docRef);
    let currentPages: string[] = [];

    if (snap.exists()) {
      currentPages = snap.data().grantedPages || [];
    }

    if (hasAccess) {
      if (!currentPages.includes(pageId)) {
        currentPages.push(pageId);
      }
    } else {
      currentPages = currentPages.filter(p => p !== pageId);
    }

    await setDoc(docRef, {
      memberName,
      grantedPages: currentPages,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error('Failed to update page access:', err);
    throw err;
  }
}
