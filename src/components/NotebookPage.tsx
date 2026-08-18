import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Clock, 
  Pin, 
  Edit2, 
  Trash2, 
  Tag, 
  Folder, 
  User, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  BookOpen,
  ArrowUpDown,
  Compass
} from 'lucide-react';
import { NoteItem, NoteStatus, NoteCategory } from '../types';

interface NotebookPageProps {
  notes: NoteItem[];
  onCreateNote: () => void;
  onEditNote: (note: NoteItem) => void;
  onDeleteNote: (noteId: string) => void;
  onToggleStatus: (noteId: string) => void;
}

export const NotebookPage: React.FC<NotebookPageProps> = ({
  notes,
  onCreateNote,
  onEditNote,
  onDeleteNote,
  onToggleStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | NoteStatus>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'all' | NoteCategory>('all');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');
  const [noteToDelete, setNoteToDelete] = useState<NoteItem | null>(null);

  // Compute category list & stats
  const allCategories = useMemo(() => {
    const set = new Set<NoteCategory>();
    notes.forEach((n) => set.add(n.category));
    return Array.from(set);
  }, [notes]);

  // Compute all tags
  const allTags = useMemo(() => {
    const set = new Set<string>();
    notes.forEach((n) => n.tags.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [notes]);

  // Filter notes
  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      // Status filter
      if (selectedStatusFilter !== 'all' && note.status !== selectedStatusFilter) {
        return false;
      }
      // Category filter
      if (selectedCategoryFilter !== 'all' && note.category !== selectedCategoryFilter) {
        return false;
      }
      // Tag filter
      if (selectedTagFilter !== 'all' && !note.tags.includes(selectedTagFilter)) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = note.title.toLowerCase().includes(q);
        const matchesContent = note.content.toLowerCase().includes(q);
        const matchesExcerpt = note.excerpt.toLowerCase().includes(q);
        const matchesAuthor = note.author.toLowerCase().includes(q);
        const matchesTags = note.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesContent && !matchesExcerpt && !matchesAuthor && !matchesTags) {
          return false;
        }
      }
      return true;
    }).sort((a, b) => {
      // Pinned notes always first
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      // Sort by newest updated
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [notes, selectedStatusFilter, selectedCategoryFilter, selectedTagFilter, searchQuery]);

  const draftCount = notes.filter((n) => n.status === 'draft').length;
  const publishedCount = notes.filter((n) => n.status === 'published').length;

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#800020] via-[#1e40af] to-[#3b82f6]" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#0f1e36]">
              Rover's Notebook
            </h1>
            <p className="text-sm text-slate-500 max-w-xl">
              Create, draft, and organize your personal notes, meeting minutes, expedition reports, and checklists.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              id="create-new-note-btn"
              onClick={onCreateNote}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#800020] hover:bg-[#6b1426] text-white text-sm font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Personal Note</span>
            </button>
          </div>
        </div>
      </div>

      {/* Private & Confidential Notebook Notice */}
      <div className="bg-slate-50 border border-indigo-100 rounded-xl p-4 flex gap-3 shadow-xs">
        <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 text-indigo-600">
          <BookOpen className="w-4 h-4" />
        </div>
        <div className="space-y-1">
          <h3 className="text-xs font-bold text-[#0f1e36] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse" />
            Personal & Strictly Private Notebook
          </h3>
          <p className="text-[11px] text-slate-500 leading-normal font-medium">
            Your personal, confidential notebook. Notes saved here are strictly private to your account and cannot be viewed or accessed by other crew members or administrators.
          </p>
        </div>
      </div>

      {/* Quick Status Pill Bar (WordPress Style: All / Published / Drafts) */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            id="filter-all-notes"
            onClick={() => setSelectedStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedStatusFilter === 'all'
                ? 'bg-[#0f1e36] text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All Notes ({notes.length})
          </button>
          <button
            id="filter-published-notes"
            onClick={() => setSelectedStatusFilter('published')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedStatusFilter === 'published'
                ? 'bg-emerald-700 text-white'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Published ({publishedCount})
          </button>
          <button
            id="filter-draft-notes"
            onClick={() => setSelectedStatusFilter('draft')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              selectedStatusFilter === 'draft'
                ? 'bg-amber-700 text-white'
                : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Drafts ({draftCount})
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="search-notes-input"
            type="text"
            placeholder="Search notes, tags, author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-[#0f1e36] placeholder-slate-400 focus:outline-none focus:border-[#1e40af]"
          />
        </div>
      </div>

      {/* Filter Row: Category & Tag dropdowns */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Filter className="w-3.5 h-3.5" />
          <span>Filter by:</span>
        </div>

        <select
          id="category-filter-select"
          value={selectedCategoryFilter}
          onChange={(e) => setSelectedCategoryFilter(e.target.value as any)}
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-[#1e40af]"
        >
          <option value="all">All Categories</option>
          {allCategories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {allTags.length > 0 && (
          <select
            id="tag-filter-select"
            value={selectedTagFilter}
            onChange={(e) => setSelectedTagFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-[#800020]"
          >
            <option value="all">All Tags</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                #{tag}
              </option>
            ))}
          </select>
        )}

        {(selectedStatusFilter !== 'all' || selectedCategoryFilter !== 'all' || selectedTagFilter !== 'all' || searchQuery) && (
          <button
            onClick={() => {
              setSelectedStatusFilter('all');
              setSelectedCategoryFilter('all');
              setSelectedTagFilter('all');
              setSearchQuery('');
            }}
            className="text-xs font-semibold text-[#800020] hover:underline ml-auto"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Notes List / Grid (WordPress Draft / Post Table & Card hybrid) */}
      {filteredNotes.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#0f1e36]">No Notes Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {searchQuery || selectedCategoryFilter !== 'all' || selectedStatusFilter !== 'all'
              ? 'No notes match your active filter criteria.'
              : "Your Rover's Notebook is currently empty. Start drafting your first note."}
          </p>
          <button
            onClick={onCreateNote}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#800020] hover:bg-[#6b1426] text-white text-xs font-bold rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create First Note
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotes.map((note) => {
            const isDraft = note.status === 'draft';
            const formattedDate = new Intl.DateTimeFormat('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            }).format(new Date(note.updatedAt));

            return (
              <div
                key={note.id}
                id={`note-card-${note.id}`}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs hover:border-slate-300 transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left content */}
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Status badge */}
                      <span
                        className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                          isDraft
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        }`}
                      >
                        {isDraft ? 'Draft' : 'Published'}
                      </span>

                      {/* Category */}
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {note.category}
                      </span>

                      {/* Pinned */}
                      {note.pinned && (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#800020]/10 text-[#800020] border border-[#800020]/20 flex items-center gap-1">
                          <Pin className="w-3 h-3" /> Pinned
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h2 
                      onClick={() => onEditNote(note)}
                      className="text-base sm:text-lg font-bold text-[#0f1e36] group-hover:text-[#1e40af] cursor-pointer transition-colors"
                    >
                      {note.title}
                    </h2>

                    {/* Excerpt */}
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {note.excerpt}
                    </p>

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                      <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{note.author}</span>
                        <span className="text-slate-300">({note.authorRole})</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Updated: {formattedDate}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    {note.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {note.tags.map((t, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-50 text-slate-600 border border-slate-200"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions Column (WordPress Style quick actions) */}
                  <div className="flex items-center gap-2 self-end md:self-start shrink-0">
                    <button
                      id={`edit-note-btn-${note.id}`}
                      onClick={() => onEditNote(note)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#0f1e36] text-xs font-bold rounded-lg border border-slate-200 transition-colors"
                      title="Edit Note / Draft"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-600" />
                      <span>Edit</span>
                    </button>

                    <button
                      id={`toggle-status-btn-${note.id}`}
                      onClick={() => onToggleStatus(note.id)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                        isDraft
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                      }`}
                      title={isDraft ? 'Publish note' : 'Revert to draft'}
                    >
                      {isDraft ? 'Publish' : 'Draft'}
                    </button>

                    <button
                      id={`delete-note-btn-${note.id}`}
                      onClick={() => setNoteToDelete(note)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Delete note"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {noteToDelete && (
        <div 
          id="delete-confirmation-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#0f1e36]">
                  Delete Rover Note?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Are you sure you want to delete <span className="font-semibold text-slate-900">"{noteToDelete.title}"</span>? This will permanently remove this record from your notebook and Cloud Firestore.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                id="cancel-delete-btn"
                type="button"
                onClick={() => setNoteToDelete(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="confirm-delete-btn"
                type="button"
                onClick={() => {
                  if (noteToDelete) {
                    onDeleteNote(noteToDelete.id);
                    setNoteToDelete(null);
                  }
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
