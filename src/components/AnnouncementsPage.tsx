import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Plus, 
  Search, 
  Pin, 
  Calendar, 
  MapPin, 
  AlertTriangle, 
  ShieldCheck, 
  Trash2, 
  X, 
  Check, 
  Filter,
  Bell,
  Clock
} from 'lucide-react';
import { AnnouncementItem, AnnouncementCategory, AnnouncementPriority } from '../types';
import { 
  subscribeToAnnouncements, 
  createAnnouncementInFirestore, 
  deleteAnnouncementFromFirestore, 
  togglePinAnnouncementInFirestore 
} from '../services/announcementsService';

interface AnnouncementsPageProps {
  isAdmin?: boolean;
  currentUser?: any;
}

export const AnnouncementsPage: React.FC<AnnouncementsPageProps> = ({ 
  isAdmin = false, 
  currentUser = null 
}) => {
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<AnnouncementItem | null>(null);
  const [deleteToast, setDeleteToast] = useState<string | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<AnnouncementCategory>('Council Notice');
  const [priority, setPriority] = useState<AnnouncementPriority>('normal');
  const [eventDate, setEventDate] = useState('');
  const [location, setLocation] = useState('');
  const [isPinned, setIsPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Determine user creation permission:
  // Allowed for: Administrator, Rover Advisor, Leaders, Council members
  const userRole = isAdmin ? 'Administrator' : (currentUser?.role || '');
  const isCouncilOrLeaderOrAdvisor = 
    isAdmin ||
    userRole.toLowerCase().includes('advisor') ||
    userRole.toLowerCase().includes('leader') ||
    userRole.toLowerCase().includes('council') ||
    userRole.toLowerCase().includes('secretary') ||
    userRole.toLowerCase().includes('treasurer') ||
    userRole.toLowerCase().includes('quartermaster');

  useEffect(() => {
    const unsub = subscribeToAnnouncements(
      (items) => {
        setAnnouncements(items);
        setLoading(false);
      },
      (err) => {
        console.error('Failed to load announcements:', err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    const authorName = isAdmin ? 'Ahmed Nazih Nafiz' : (currentUser?.name || 'Rover Member');
    const authorRole = isAdmin ? 'Administrator' : (currentUser?.role || 'Rover Scout');

    const newAnnouncement: AnnouncementItem = {
      id: `ann_${Date.now()}`,
      title: title.trim(),
      content: content.trim(),
      category,
      priority,
      authorName,
      authorRole,
      createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
      pinned: isPinned,
      eventDate: eventDate.trim() || undefined,
      location: location.trim() || undefined,
    };

    try {
      await createAnnouncementInFirestore(newAnnouncement);
      setTitle('');
      setContent('');
      setCategory('Council Notice');
      setPriority('normal');
      setEventDate('');
      setLocation('');
      setIsPinned(false);
      setIsCreateModalOpen(false);
    } catch (err) {
      console.error('Failed to create announcement:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    const target = itemToDelete;
    setItemToDelete(null);
    setAnnouncements((prev) => prev.filter((a) => a.id !== target.id));

    try {
      await deleteAnnouncementFromFirestore(target.id);
      setDeleteToast(`Announcement "${target.title}" successfully deleted.`);
      setTimeout(() => setDeleteToast(null), 4000);
    } catch (err) {
      console.error('Failed to delete announcement:', err);
    }
  };

  const handleTogglePin = async (item: AnnouncementItem) => {
    try {
      await togglePinAnnouncementInFirestore(item.id, !!item.pinned);
    } catch (err) {
      console.error('Failed to toggle pin:', err);
    }
  };

  // Filter and search
  const q = (searchQuery || '').toLowerCase();
  const filteredAnnouncements = announcements.filter((item) => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = !q ||
      Boolean(item.title && item.title.toLowerCase().includes(q)) ||
      Boolean(item.content && item.content.toLowerCase().includes(q)) ||
      Boolean(item.authorName && item.authorName.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  // Sort pinned first, then by date descending
  const sortedAnnouncements = [...filteredAnnouncements].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const categories = ['All', 'Council Notice', 'Urgent', 'Expedition', 'Training', 'General'];

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#800020] via-blue-600 to-amber-500" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold bg-[#800020]/10 text-[#800020] border border-[#800020]/20">
              <Megaphone className="w-3.5 h-3.5" />
              <span>Official Crew Bulletins</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0f1e36]">
              Announcements
            </h1>
            <p className="text-sm text-slate-600 max-w-xl">
              Stay up to date with official council notices, expedition updates, safety advisories, and upcoming crew events.
            </p>
          </div>

          {isCouncilOrLeaderOrAdvisor && (
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-bold text-white bg-[#800020] hover:bg-[#6b1426] transition-colors shadow-sm cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              Create Announcement
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#0f1e36] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bulletins..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#1e40af] focus:bg-white"
          />
        </div>
      </div>

      {/* Announcements List */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-[#800020] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-slate-500">Loading announcements...</p>
        </div>
      ) : sortedAnnouncements.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Announcements Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {searchQuery || selectedCategory !== 'All' 
              ? 'No notices match your search criteria or category filter.' 
              : 'There are currently no active announcements published for the crew.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedAnnouncements.map((item) => {
            const isUrgent = item.priority === 'urgent' || item.category === 'Urgent';
            const isHigh = item.priority === 'high';

            return (
              <div
                key={item.id}
                className={`bg-white rounded-2xl border p-6 shadow-xs transition-all relative overflow-hidden ${
                  item.pinned 
                    ? 'border-amber-300 ring-1 ring-amber-200 bg-gradient-to-b from-amber-50/20 to-white' 
                    : isUrgent
                    ? 'border-red-300 ring-1 ring-red-200 bg-red-50/10'
                    : 'border-slate-200'
                }`}
              >
                {/* Priority Accent Line */}
                {isUrgent ? (
                  <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-red-600" />
                ) : isHigh ? (
                  <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-amber-500" />
                ) : null}

                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Title & Metadata Header */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {item.pinned && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <Pin className="w-3 h-3 fill-amber-700" />
                          Pinned Notice
                        </span>
                      )}

                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                        isUrgent
                          ? 'bg-red-100 text-red-700 border-red-200'
                          : isHigh
                          ? 'bg-amber-100 text-amber-800 border-amber-200'
                          : 'bg-blue-50 text-blue-700 border-blue-200'
                      }`}>
                        {item.category}
                      </span>

                      {isUrgent && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-600 text-white animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          Emergency
                        </span>
                      )}
                    </div>

                    <h2 className="text-base sm:text-lg font-bold text-[#0f1e36]">
                      {item.title}
                    </h2>
                  </div>

                  {/* Admin / Creator Controls */}
                  {isCouncilOrLeaderOrAdvisor && (
                    <div className="flex items-center gap-1.5 shrink-0 self-start">
                      <button
                        type="button"
                        onClick={() => handleTogglePin(item)}
                        title={item.pinned ? 'Unpin Announcement' : 'Pin Announcement'}
                        className={`p-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          item.pinned 
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <Pin className={`w-3.5 h-3.5 ${item.pinned ? 'fill-amber-800' : ''}`} />
                      </button>

                      <button
                        type="button"
                        onClick={() => setItemToDelete(item)}
                        title="Delete Announcement"
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Announcement Content */}
                <div className="mt-3 text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line font-normal">
                  {item.content}
                </div>

                {/* Event Metadata Cards if specified */}
                {(item.eventDate || item.location) && (
                  <div className="mt-4 flex flex-wrap gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                    {item.eventDate && (
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <Calendar className="w-3.5 h-3.5 text-[#1e40af]" />
                        <span>Date & Time: {item.eventDate}</span>
                      </div>
                    )}
                    {item.location && (
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <MapPin className="w-3.5 h-3.5 text-red-600" />
                        <span>Location: {item.location}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Footer Author & Time */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#800020] text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                      {item.authorName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-bold text-slate-800">{item.authorName}</span>
                      <span className="text-slate-400 text-[11px] ml-1.5">({item.authorRole})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                    <Clock className="w-3 h-3" />
                    <span>{item.createdAt}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE ANNOUNCEMENT MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 border border-slate-100 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3.5">
              <div className="flex items-center gap-2 text-[#800020]">
                <Megaphone className="w-5 h-5" />
                <h3 className="text-base font-bold text-[#0f1e36]">Publish Announcement</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Notice Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Crew Leaders Meeting & Expedition Planning"
                  className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as AnnouncementCategory)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af] bg-white"
                  >
                    <option value="Council Notice">Council Notice</option>
                    <option value="Training">Training</option>
                    <option value="Expedition">Expedition</option>
                    <option value="Urgent">Urgent Alert</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as AnnouncementPriority)}
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af] bg-white"
                  >
                    <option value="normal">Normal</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent / Emergency</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Event Date / Time (Optional)</label>
                  <input
                    type="text"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    placeholder="e.g. 2026-08-25 16:00"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Location (Optional)</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Arabiyya School Hall, Malé"
                    className="w-full text-xs px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bulletin Details <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Type the full announcement message here..."
                  className="w-full text-xs p-3.5 border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af]"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pin-announcement-check"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 rounded text-[#800020] focus:ring-[#800020] border-slate-300"
                />
                <label htmlFor="pin-announcement-check" className="text-xs font-semibold text-slate-700 cursor-pointer flex items-center gap-1.5">
                  <Pin className="w-3.5 h-3.5 text-amber-600" />
                  <span>Pin this announcement to top of feed</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#800020] hover:bg-[#6b1426] transition-colors shadow-xs cursor-pointer flex items-center gap-2"
                >
                  {submitting ? 'Publishing...' : 'Publish Announcement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETION MODAL */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 border border-slate-100">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#0f1e36]">Confirm Announcement Deletion</h3>
                <p className="text-xs text-slate-500">This action will sync across Cloud and cannot be undone.</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 p-3.5 space-y-1 text-xs">
              <span className="font-bold text-slate-900 block truncate">{itemToDelete.title}</span>
              <span className="text-slate-500 text-[11px] block">Category: {itemToDelete.category} • Author: {itemToDelete.authorName}</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete this announcement? It will be immediately removed for all crew members.
            </p>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Announcement</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETION TOAST NOTIFICATION */}
      {deleteToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0f1e36] text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-3 animate-in slide-in-from-bottom-4 duration-200 text-xs">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold">{deleteToast}</span>
          <button
            type="button"
            onClick={() => setDeleteToast(null)}
            className="text-slate-400 hover:text-white p-1 ml-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
