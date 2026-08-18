import os

with open('src/App.tsx', 'r') as f:
    code = f.read()

target = """  // Real-time Firestore synchronization with local fallback
  useEffect(() => {
    const unsubscribe = subscribeToNotes(
      (firestoreNotes) => {
        if (firestoreNotes && firestoreNotes.length > 0) {
          setNotes(firestoreNotes);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(firestoreNotes));
          } catch (e) {
            console.error('Error updating localStorage cache:', e);
          }
        }
        setSyncStatus('synced');
      },
      (error) => {
        // If client is offline or backend is temporarily unavailable, gracefully fallback to local cached state
        console.info('Firestore active in cached/offline sync mode:', error?.message || error);
        setSyncStatus('synced');
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);"""

replacement = """  // Real-time Firestore synchronization with local fallback
  useEffect(() => {
    if (!user) return; // Only subscribe if logged in

    const unsubscribe = subscribeToNotes(
      (firestoreNotes) => {
        if (firestoreNotes && firestoreNotes.length > 0) {
          setNotes(firestoreNotes);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(firestoreNotes));
          } catch (e) {
            console.error('Error updating localStorage cache:', e);
          }
        }
        setSyncStatus('synced');
      },
      (error) => {
        // If client is offline or backend is temporarily unavailable, gracefully fallback to local cached state
        console.info('Firestore active in cached/offline sync mode:', error?.message || error);
        setSyncStatus('synced');
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user]);"""

code = code.replace(target, replacement)

with open('src/App.tsx', 'w') as f:
    f.write(code)
