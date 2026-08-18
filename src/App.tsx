/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { NotebookPage } from './components/NotebookPage';
import { MembersPage } from './components/MembersPage';
import { ChatPage } from './components/ChatPage';
import { AnnouncementsPage } from './components/AnnouncementsPage';
import { NoteEditor } from './components/NoteEditor';
import { GovernancePage } from './components/GovernancePage';
import { FinancePage } from './components/FinancePage';
import { ProgressPage } from './components/ProgressPage';
import { EventsPage } from './components/EventsPage';
import { MediaPage } from './components/MediaPage';
import { RecordsPage } from './components/RecordsPage';
import { SettingsPage } from './components/SettingsPage';
import { AccessRestricted } from './components/AccessRestricted';
import { NotificationListener } from './components/NotificationListener';
import { subscribeToPermissions, PagePermissions } from './services/permissionsService';
import { NavSection, NoteItem } from './types';
import { INITIAL_NOTES } from './data/initialNotes';
import { 
  subscribeToNotes, 
  saveNoteToFirestore, 
  deleteNoteFromFirestore, 
  toggleNoteStatusInFirestore 
} from './services/notesService';
import { updateMemberPresence } from './services/membersService';

import { Login } from './components/Login';
import { ChangePassword } from './components/ChangePassword';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import app from './firebase';

const auth = getAuth(app);

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  'Council Secretary': ['governance', 'events', 'media', 'records'],
  'Council Treasurer': ['finance'],
  'Council Quartermaster': ['progress', 'records'],
  'Secretary': ['governance', 'events', 'media', 'records'],
  'Treasurer': ['finance'],
  'Quartermaster': ['progress', 'records'],
};

const STORAGE_KEY = 'koshaaru_portal_rover_notes_v1';

export default function App() {
  const [user, setUser] = useState<any | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [pagePermissions, setPagePermissions] = useState<PagePermissions[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsub = subscribeToPermissions((perms) => {
      setPagePermissions(perms || []);
    });
    return () => unsub();
  }, []);

  const [currentSection, setCurrentSection] = useState<NavSection>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('koshaaru_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('koshaaru_sidebar_collapsed', String(next));
      } catch (e) {
        console.error('Failed to save sidebar collapse state:', e);
      }
      return next;
    });
  };
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');

  const [notes, setNotes] = useState<NoteItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load notes from localStorage', e);
    }
    return INITIAL_NOTES;
  });

  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [portalName, setPortalName] = useState<string>(() => {
    try {
      return localStorage.getItem('koshaaru_portal_name_v1') || 'Koshaaru Portal';
    } catch {
      return 'Koshaaru Portal';
    }
  });

  const [portalTagline, setPortalTagline] = useState<string>(() => {
    try {
      return localStorage.getItem('koshaaru_portal_tagline_v1') || 'Arabiyya Beyond Limits';
    } catch {
      return 'Arabiyya Beyond Limits';
    }
  });

  useEffect(() => {
    const fetchBranding = async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('./firebase');
        const docRef = doc(db, 'system', 'portal_settings');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.portalName) setPortalName(data.portalName);
          if (data.portalTagline) setPortalTagline(data.portalTagline);
        }
      } catch (err) {
        console.error('Error fetching branding settings:', err);
      }
    };
    fetchBranding();
  }, []);

  const [isAdmin, setIsAdmin] = useState<boolean>(true);

  const handleUpdatePortalName = (newName: string) => {
    const trimmed = newName.trim() || 'Koshaaru Portal';
    setPortalName(trimmed);
    try {
      localStorage.setItem('koshaaru_portal_name_v1', trimmed);
    } catch (e) {
      console.error('Failed to save portal name to localStorage:', e);
    }
  };

  const handleUpdatePortalTagline = (newTagline: string) => {
    const trimmed = newTagline.trim() || 'Arabiyya Beyond Limits';
    setPortalTagline(trimmed);
    try {
      localStorage.setItem('koshaaru_portal_tagline_v1', trimmed);
    } catch (e) {
      console.error('Failed to save portal tagline to localStorage:', e);
    }
  };

  const activeUserId = isAdmin ? 'admin_nazih' : (user?.id || 'm1');

  // Real-time Firestore synchronization with local fallback per user
  useEffect(() => {
    if (!user) return; // Only subscribe if logged in

    const unsubscribe = subscribeToNotes(
      activeUserId,
      (firestoreNotes) => {
        if (firestoreNotes) {
          setNotes(firestoreNotes);
          try {
            localStorage.setItem(`${STORAGE_KEY}_${activeUserId}`, JSON.stringify(firestoreNotes));
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
  }, [user, activeUserId]);

  // Periodic active presence heartbeat for authenticated member/admin
  useEffect(() => {
    if (!user && !isAdmin) return;
    const currentMemberId = user?.id || (isAdmin ? 'admin_nazih' : null);
    if (!currentMemberId) return;

    // Trigger immediate presence refresh
    updateMemberPresence(currentMemberId);

    // Heartbeat every 45 seconds to keep online status fresh
    const heartbeatTimer = setInterval(() => {
      updateMemberPresence(currentMemberId);
    }, 45000);

    const handleUserActivity = () => {
      updateMemberPresence(currentMemberId);
    };

    window.addEventListener('focus', handleUserActivity);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateMemberPresence(currentMemberId);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(heartbeatTimer);
      window.removeEventListener('focus', handleUserActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, isAdmin]);

  const toggleSidebar = () => {
    if (window.innerWidth >= 1024) {
      toggleSidebarCollapse();
    } else {
      setIsSidebarOpen((prev) => !prev);
    }
  };

  const handleSelectSection = (section: NavSection) => {
    setIsEditorOpen(false);
    setCurrentSection(section);
  };

  const handleCreateNote = () => {
    setEditingNote(null);
    setIsEditorOpen(true);
    setCurrentSection('notebook');
  };

  const handleEditNote = (note: NoteItem) => {
    setEditingNote(note);
    setIsEditorOpen(true);
    setCurrentSection('notebook');
  };

  const handleSaveNote = async (savedNote: NoteItem) => {
    // Optimistic local UI update and local cache persistence
    setNotes((prevNotes) => {
      const existsIndex = prevNotes.findIndex((n) => n.id === savedNote.id);
      let updated: NoteItem[];
      if (existsIndex >= 0) {
        updated = [...prevNotes];
        updated[existsIndex] = savedNote;
      } else {
        updated = [savedNote, ...prevNotes];
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to persist to localStorage:', e);
      }
      return updated;
    });
    setIsEditorOpen(false);

    // Save to Firestore (queued in offline cache or synced immediately)
    try {
      await saveNoteToFirestore(activeUserId, savedNote);
      setSyncStatus('synced');
    } catch (err) {
      console.warn('Note saved to local cache; will sync when connection permits.');
      setSyncStatus('synced');
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    // Optimistic local update
    setNotes((prevNotes) => {
      const updated = prevNotes.filter((n) => n.id !== noteId);
      try {
        localStorage.setItem(`${STORAGE_KEY}_${activeUserId}`, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to persist deletion to localStorage:', e);
      }
      return updated;
    });

    if (editingNote?.id === noteId) {
      setIsEditorOpen(false);
      setEditingNote(null);
    }

    // Delete in Firestore
    try {
      await deleteNoteFromFirestore(activeUserId, noteId);
      setSyncStatus('synced');
    } catch (err) {
      console.warn('Deletion saved to local cache; will sync when connection permits.');
      setSyncStatus('synced');
    }
  };

  const handleToggleStatus = async (noteId: string) => {
    const targetNote = notes.find((n) => n.id === noteId);
    if (!targetNote) return;

    const nextStatus = targetNote.status === 'draft' ? 'published' : 'draft';

    // Optimistic update
    setNotes((prevNotes) => {
      const updated = prevNotes.map((n) => {
        if (n.id === noteId) {
          return {
            ...n,
            status: nextStatus,
            updatedAt: new Date().toISOString(),
          };
        }
        return n;
      });
      try {
        localStorage.setItem(`${STORAGE_KEY}_${activeUserId}`, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to persist status change to localStorage:', e);
      }
      return updated;
    });

    // Update in Firestore
    try {
      await toggleNoteStatusInFirestore(activeUserId, noteId, targetNote.status);
      setSyncStatus('synced');
    } catch (err) {
      console.warn('Status update queued in cache; will sync when connection permits.');
      setSyncStatus('synced');
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (e) {
      console.error(e);
    }
    setUser(null);
  };

  const toggleAdmin = () => {
    setIsAdmin((prev) => {
      const next = !prev;
      if (!next && currentSection === 'settings') {
        setCurrentSection('dashboard');
      }
      return next;
    });
  };

  const isSectionRestricted = (section: NavSection) => {
    // Admin has full access
    if (isAdmin) return false;

    // Rover Advisor has full access
    const isAdvisor = user?.role?.toLowerCase().includes('advisor') || user?.title?.toLowerCase().includes('advisor') || user?.name?.toLowerCase().includes('ziyad');
    if (isAdvisor) return false;

    // Governance page is strictly restricted for normal members (only accessible to council members, admin/advisors)
    if (section === 'governance') {
      const isCouncil = user?.role?.toLowerCase().includes('council') || user?.role?.toLowerCase().includes('secretary') || user?.role?.toLowerCase().includes('treasurer') || user?.role?.toLowerCase().includes('quartermaster') || user?.role?.toLowerCase().includes('coordinator') || user?.role?.toLowerCase().includes('leader');
      
      // Check explicit permissions
      let hasExplicitPermission = false;
      if (user?.role) {
        const rolePerm = pagePermissions.find((p) => p.memberId.toLowerCase() === user.role.toLowerCase());
        if (rolePerm) {
          if (rolePerm.grantedPages.includes('governance')) {
            hasExplicitPermission = true;
          }
        } else {
          const defaultPerms = DEFAULT_ROLE_PERMISSIONS[user.role];
          if (defaultPerms && defaultPerms.includes('governance')) {
            hasExplicitPermission = true;
          }
        }
      }

      if (hasExplicitPermission) {
        return false;
      }
      return true; // restricted!
    }

    // These pages are always accessible to normal members but show limited/different content
    if (['finance', 'progress', 'events', 'media', 'records'].includes(section)) {
      return false;
    }

    // These pages are always unrestricted
    if (['dashboard', 'chat', 'announcements', 'notebook', 'members', 'settings'].includes(section)) {
      return false;
    }

    // Check permissions
    if (user?.role) {
      const rolePerm = pagePermissions.find((p) => p.memberId.toLowerCase() === user.role.toLowerCase());
      if (rolePerm) {
        if (rolePerm.grantedPages.includes(section)) {
          return false;
        }
      } else {
        const defaultPerms = DEFAULT_ROLE_PERMISSIONS[user.role];
        if (defaultPerms && defaultPerms.includes(section)) {
          return false;
        }
      }
    }

    return true; // restricted!
  };

  const draftsCount = notes.filter((n) => n.status === 'draft').length;

  if (authLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="w-8 h-8 border-4 border-[#800020] border-t-transparent rounded-full animate-spin"></div></div>;
  }

  if (!user) {
    return (
      <Login 
        onLoginSuccess={(memberData) => {
          if (memberData) {
            setUser(memberData);
            setIsAdmin(false);
          }
        }} 
        portalName={portalName} 
        portalTagline={portalTagline} 
      />
    );
  }

  // Handle member forced password change
  if (user && user.password === '123456') {
    return <ChangePassword member={user} onComplete={(updatedMember) => setUser(updatedMember)} />;
  }


  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <NotificationListener 
        currentUserId={activeUserId} 
        onNavigate={handleSelectSection}
      />
      {/* Sidebar for navigation */}
      <Sidebar
        currentSection={currentSection}
        onSelectSection={handleSelectSection}
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={toggleSidebarCollapse}
        isAdmin={isAdmin}
        onToggleAdmin={toggleAdmin}
        notesCount={notes.length}
        draftsCount={draftsCount}
        portalName={portalName}
        portalTagline={portalTagline}
        onLogout={handleLogout}
        currentUser={user}
      />

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${
        isSidebarCollapsed ? 'lg:pl-20' : 'lg:pl-72'
      }`}>
        {/* Top Header */}
        <Header
          currentSection={currentSection}
          onToggleSidebar={toggleSidebar}
          syncStatus={syncStatus}
          portalName={portalName}
          isAdmin={isAdmin}
          currentUser={user}
        />

        {/* Dynamic Views */}
        <main className="flex-1">
          {isEditorOpen ? (
            <NoteEditor
              note={editingNote}
              onSave={handleSaveNote}
              onCancel={() => setIsEditorOpen(false)}
              onDelete={handleDeleteNote}
            />
          ) : isSectionRestricted(currentSection) ? (
            <AccessRestricted 
              sectionName={currentSection}
              onGoBack={() => setCurrentSection('dashboard')}
              memberName={user?.name || 'Unknown'}
              memberRole={user?.role || 'Rover Scout'}
            />
          ) : currentSection === 'chat' ? (
            <ChatPage isAdmin={isAdmin} currentUser={user} />
          ) : currentSection === 'announcements' ? (
            <AnnouncementsPage isAdmin={isAdmin} currentUser={user} />
          ) : currentSection === 'notebook' ? (
            <NotebookPage
              notes={notes}
              onCreateNote={handleCreateNote}
              onEditNote={handleEditNote}
              onDeleteNote={handleDeleteNote}
              onToggleStatus={handleToggleStatus}
            />
          ) : currentSection === 'members' ? (
            <MembersPage isAdmin={isAdmin} userRole={user?.role} />
          ) : currentSection === 'governance' ? (
            <GovernancePage isAdmin={isAdmin} pagePermissions={pagePermissions} />
          ) : currentSection === 'finance' ? (
            <FinancePage isAdmin={isAdmin} userRole={user?.role} pagePermissions={pagePermissions} />
          ) : currentSection === 'progress' ? (
            <ProgressPage isAdmin={isAdmin} userRole={user?.role} pagePermissions={pagePermissions} />
          ) : currentSection === 'events' ? (
            <EventsPage isAdmin={isAdmin} userRole={user?.role} pagePermissions={pagePermissions} />
          ) : currentSection === 'media' ? (
            <MediaPage isAdmin={isAdmin} userRole={user?.role} pagePermissions={pagePermissions} />
          ) : currentSection === 'records' ? (
            <RecordsPage isAdmin={isAdmin} userRole={user?.role} pagePermissions={pagePermissions} />
          ) : currentSection === 'settings' ? (
            <SettingsPage isAdmin={isAdmin} />
          ) : (
            <Dashboard
              currentSection={currentSection}
              onNavigateTo={handleSelectSection}
              notes={notes}
              onCreateNote={handleCreateNote}
              onEditNote={handleEditNote}
              portalName={portalName}
              portalTagline={portalTagline}
              onUpdatePortalName={handleUpdatePortalName}
              onUpdatePortalTagline={handleUpdatePortalTagline}
              isAdmin={isAdmin}
              currentUser={user}
              pagePermissions={pagePermissions}
            />
          )}
        </main>
      </div>
    </div>
  );
}
