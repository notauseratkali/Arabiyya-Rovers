import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { NoteItem } from '../types';
import { INITIAL_NOTES } from '../data/initialNotes';

const getNotesCollection = (userId: string) => collection(db, 'users', userId || 'm1', 'personal_notes');
const getNoteDoc = (userId: string, noteId: string) => doc(db, 'users', userId || 'm1', 'personal_notes', noteId);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
    },
    operationType,
    path
  };
  console.warn('Firestore Warning/Notice: ', JSON.stringify(errInfo));
  return errInfo;
}

/**
 * Subscribes to real-time updates for personal notes from Firestore per user.
 * If the user's personal notes collection is empty, seeds with INITIAL_NOTES.
 */
export function subscribeToNotes(
  userId: string,
  onUpdate: (notes: NoteItem[]) => void,
  onError: (error: Error) => void
) {
  const activeUser = userId || 'm1';
  const userSeededKey = `koshaaru_has_seeded_personal_notes_${activeUser}`;
  const notesQuery = query(getNotesCollection(activeUser), orderBy('updatedAt', 'desc'));

  const unsubscribe = onSnapshot(
    notesQuery,
    { includeMetadataChanges: true },
    async (snapshot) => {
      if (snapshot.empty) {
        const hasSeeded = typeof window !== 'undefined' ? localStorage.getItem(userSeededKey) : null;
        if (!hasSeeded && !snapshot.metadata.fromCache) {
          try {
            if (typeof window !== 'undefined') {
              localStorage.setItem(userSeededKey, 'true');
            }
            await seedInitialNotes(activeUser);
          } catch (e) {
            console.warn('Notice seeding initial personal notes into Firestore:', e);
          }
          return;
        }
        // Collection is empty
        onUpdate([]);
        return;
      }

      if (typeof window !== 'undefined' && !localStorage.getItem(userSeededKey)) {
        localStorage.setItem(userSeededKey, 'true');
      }

      const notes: NoteItem[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title || '',
          slug: data.slug || '',
          excerpt: data.excerpt || '',
          content: data.content || '',
          status: data.status || 'draft',
          category: data.category || 'General',
          tags: Array.isArray(data.tags) ? data.tags : [],
          author: data.author || 'Me',
          authorRole: data.authorRole || 'Personal Note',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          coverColor: data.coverColor || '#800020',
          pinned: Boolean(data.pinned),
        } as NoteItem;
      });

      onUpdate(notes);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, `users/${activeUser}/personal_notes`);
      onError(err);
    }
  );

  return unsubscribe;
}

/**
 * Save or update a personal note in Firestore.
 */
export async function saveNoteToFirestore(userId: string, note: NoteItem): Promise<void> {
  const activeUser = userId || 'm1';
  const notePath = `users/${activeUser}/personal_notes/${note.id}`;
  try {
    const noteRef = getNoteDoc(activeUser, note.id);
    const data = {
      title: note.title,
      slug: note.slug || '',
      excerpt: note.excerpt,
      content: note.content,
      status: note.status,
      category: note.category,
      tags: note.tags,
      author: note.author,
      authorRole: note.authorRole,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt || new Date().toISOString(),
      coverColor: note.coverColor || '#800020',
      pinned: Boolean(note.pinned),
    };

    await setDoc(noteRef, data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, notePath);
    throw error;
  }
}

/**
 * Delete a personal note from Firestore.
 */
export async function deleteNoteFromFirestore(userId: string, noteId: string): Promise<void> {
  const activeUser = userId || 'm1';
  const notePath = `users/${activeUser}/personal_notes/${noteId}`;
  try {
    const noteRef = getNoteDoc(activeUser, noteId);
    await deleteDoc(noteRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, notePath);
    throw error;
  }
}

/**
 * Update the status of a personal note.
 */
export async function toggleNoteStatusInFirestore(userId: string, noteId: string, currentStatus: string): Promise<void> {
  const activeUser = userId || 'm1';
  const notePath = `users/${activeUser}/personal_notes/${noteId}`;
  try {
    const nextStatus = currentStatus === 'draft' ? 'published' : 'draft';
    const noteRef = getNoteDoc(activeUser, noteId);
    await updateDoc(noteRef, {
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, notePath);
    throw error;
  }
}

/**
 * Seeds initial personal notes for a specific user.
 */
export async function seedInitialNotes(userId: string): Promise<void> {
  const activeUser = userId || 'm1';
  try {
    const batch = writeBatch(db);
    for (const note of INITIAL_NOTES) {
      const docRef = getNoteDoc(activeUser, note.id);
      batch.set(docRef, {
        title: note.title,
        slug: note.slug || '',
        excerpt: note.excerpt,
        content: note.content,
        status: note.status,
        category: note.category,
        tags: note.tags,
        author: note.author,
        authorRole: note.authorRole,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
        coverColor: note.coverColor || '#800020',
        pinned: Boolean(note.pinned),
      });
    }
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${activeUser}/personal_notes`);
  }
}
