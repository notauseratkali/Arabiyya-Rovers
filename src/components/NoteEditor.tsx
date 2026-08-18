import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  Edit3, 
  FileCheck, 
  Tag, 
  Folder, 
  User, 
  Pin,
  AlertCircle,
  Layers,
  Sparkles,
  FileText,
  Clock,
  Trash2
} from 'lucide-react';
import { NoteItem, NoteCategory, NoteStatus } from '../types';
import { RichTextEditor } from './RichTextEditor';

interface NoteEditorProps {
  note: NoteItem | null;
  onSave: (savedNote: NoteItem) => void;
  onCancel: () => void;
  onDelete?: (noteId: string) => void;
}

const CATEGORIES: NoteCategory[] = [
  'General',
  'Crew Meeting',
  'Expedition & Hike',
  'Training & Badges',
  'Crew Project',
  'Field Log',
  'Announcement'
];

export const NoteEditor: React.FC<NoteEditorProps> = ({ note, onSave, onCancel, onDelete }) => {
  const isEditing = Boolean(note?.id);

  const [title, setTitle] = useState(note?.title || '');
  const [excerpt, setExcerpt] = useState(note?.excerpt || '');
  const [content, setContent] = useState(note?.content || '');
  const [status, setStatus] = useState<NoteStatus>(note?.status || 'draft');
  const [category, setCategory] = useState<NoteCategory>(note?.category || 'General');
  const [tagsInput, setTagsInput] = useState(note?.tags ? note.tags.join(', ') : '');
  const [author, setAuthor] = useState(note?.author || 'Rover Scout');
  const [authorRole, setAuthorRole] = useState(note?.authorRole || 'Rover Crew Member');
  const [pinned, setPinned] = useState(Boolean(note?.pinned));
  const [coverColor, setCoverColor] = useState(note?.coverColor || '#800020');
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Helper to extract clean plain text from HTML
  const getPlainText = (htmlString: string) => {
    if (typeof document === 'undefined') return htmlString;
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = htmlString;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  const plainText = getPlainText(content);
  const wordCount = plainText.trim() ? plainText.trim().split(/\s+/).length : 0;
  const charCount = plainText.length;
  const readTimeMinutes = Math.max(1, Math.ceil(wordCount / 180));

  const handleSave = (targetStatus?: NoteStatus) => {
    if (!title.trim()) {
      setFeedback('Please enter a note title before saving.');
      return;
    }

    const finalStatus = targetStatus || status;
    const cleanTags = tagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    // Auto-generate clean excerpt from content if empty
    let cleanExcerpt = excerpt.trim();
    if (!cleanExcerpt) {
      const plain = getPlainText(content).trim();
      cleanExcerpt = plain.length > 140 ? plain.slice(0, 140) + '...' : plain;
    }

    const updatedNote: NoteItem = {
      id: note?.id || `note-${Date.now()}`,
      title: title.trim(),
      slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      excerpt: cleanExcerpt || 'No summary provided.',
      content: content.trim() || '<p>Start writing notes here...</p>',
      status: finalStatus,
      category,
      tags: cleanTags.length > 0 ? cleanTags : ['General'],
      author: author.trim() || 'Rover Scout',
      authorRole: authorRole.trim() || 'Rover Crew Member',
      createdAt: note?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      coverColor,
      pinned,
    };

    onSave(updatedNote);
  };

  return (
    <div className="max-w-6xl mx-auto py-4 sm:py-6 px-4 sm:px-6">
      {/* Top action header bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 mb-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            id="back-to-notes-list-btn"
            onClick={onCancel}
            className="p-2 rounded-lg text-slate-600 hover:text-[#0f1e36] hover:bg-slate-100 transition-colors"
            title="Back to Notebook"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Rover's Notebook Editor
              </span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                status === 'draft' 
                  ? 'bg-amber-100 text-amber-800 border border-amber-300' 
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              }`}>
                {status === 'draft' ? 'Draft' : 'Published'}
              </span>
            </div>
            <h1 className="text-lg font-bold text-[#0f1e36] truncate max-w-md">
              {title ? title : 'Untitled Rover Note'}
            </h1>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              id="switch-to-editor-tab"
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'editor'
                  ? 'bg-white text-[#0f1e36] shadow-xs'
                  : 'text-slate-600 hover:text-[#0f1e36]'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Word Editor
            </button>
            <button
              id="switch-to-preview-tab"
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                activeTab === 'preview'
                  ? 'bg-white text-[#0f1e36] shadow-xs'
                  : 'text-slate-600 hover:text-[#0f1e36]'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Reading View
            </button>
          </div>

          {isEditing && onDelete && (
            <button
              id="editor-delete-note-btn"
              type="button"
              onClick={() => setIsConfirmingDelete(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-lg border border-rose-200 transition-colors cursor-pointer"
              title="Delete this note"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Delete</span>
            </button>
          )}

          <button
            id="save-draft-btn"
            onClick={() => handleSave('draft')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-[#0f1e36] text-xs font-bold rounded-lg border border-slate-300 transition-colors"
          >
            <Save className="w-4 h-4 text-slate-600" />
            Save Draft
          </button>

          <button
            id="publish-note-btn"
            onClick={() => handleSave('published')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#800020] hover:bg-[#6b1426] text-white text-xs font-bold rounded-lg shadow-xs transition-colors"
          >
            <FileCheck className="w-4 h-4" />
            {status === 'published' ? 'Update Note' : 'Publish to Crew'}
          </button>
        </div>
      </div>

      {feedback && (
        <div className="mb-4 p-3.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Main Grid: Document Body (Left) + Settings Sidebar (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Visual Editor / Reading View */}
        <div className="lg:col-span-8 space-y-5">
          {activeTab === 'editor' ? (
            <div className="space-y-4">
              {/* Note Title Input Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Note Document Title
                </label>
                <input
                  id="note-title-input"
                  type="text"
                  placeholder="E.g., Arabiyya Rover Network Expedition & Logistics Guide"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (feedback) setFeedback(null);
                  }}
                  className="w-full text-xl sm:text-2xl font-bold text-[#0f1e36] placeholder-slate-400 border-0 border-b border-slate-200 pb-2 focus:outline-none focus:border-[#800020] transition-colors"
                />
              </div>

              {/* Microsoft Word Style Visual WYSIWYG Editor */}
              <div>
                <RichTextEditor
                  initialContent={content}
                  onChange={(newHtml) => setContent(newHtml)}
                  placeholder="Type your notes here... Use the ribbon toolbar above to bold, italicize, underline, format headings, and add lists without typing symbols."
                />
              </div>

              {/* Excerpt / Summary Field */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Brief Summary / Excerpt
                  </label>
                  <span className="text-[10px] text-slate-400">Used for cards &amp; dashboard feeds</span>
                </div>
                <textarea
                  id="note-excerpt-input"
                  rows={2}
                  placeholder="Leave blank to automatically extract from the document text..."
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  className="w-full text-xs text-slate-700 p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#1e40af]"
                />
              </div>

              {/* Document Statistics Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
                <div className="flex items-center gap-5">
                  <span className="font-semibold text-slate-800">{wordCount} <span className="font-normal text-slate-500">words</span></span>
                  <span className="font-semibold text-slate-800">{charCount} <span className="font-normal text-slate-500">characters</span></span>
                  <span className="text-slate-500">~{readTimeMinutes} min read</span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-[#1e40af] font-medium">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Microsoft Word Visual Formatting Mode</span>
                </div>
              </div>
            </div>
          ) : (
            /* Live Reading Preview Tab */
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs space-y-6">
              <div className="border-b border-slate-200 pb-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-[#1e40af]/10 text-[#1e40af] border border-[#1e40af]/20">
                    {category}
                  </span>
                  {pinned && (
                    <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-[#800020]/10 text-[#800020] border border-[#800020]/20 flex items-center gap-1">
                      <Pin className="w-3 h-3" /> Pinned
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#0f1e36]">
                  {title || 'Untitled Rover Note'}
                </h1>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-3">
                  <span className="font-semibold text-slate-700">{author}</span>
                  <span>•</span>
                  <span>{authorRole}</span>
                  <span>•</span>
                  <span>Updated just now</span>
                </div>
              </div>

              {excerpt && (
                <div className="p-3.5 bg-slate-50 border-l-4 border-[#800020] text-slate-700 text-sm italic rounded-r-md">
                  {excerpt}
                </div>
              )}

              {/* Formatted Content View rendered from HTML */}
              <div 
                className="prose-preview text-slate-800 space-y-3 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: content || '<p class="text-slate-400 italic">No content written yet.</p>' }}
              />

              {tagsInput && (
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-slate-400 mr-1" />
                  {tagsInput.split(',').map((t, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                      #{t.trim()}
                    </span>
                  ))}
                </div>
              )}

              <style>{`
                .prose-preview h1 { font-size: 1.65rem; font-weight: 700; color: #0f1e36; margin-top: 1rem; margin-bottom: 0.5rem; }
                .prose-preview h2 { font-size: 1.3rem; font-weight: 700; color: #0f1e36; margin-top: 0.875rem; margin-bottom: 0.375rem; }
                .prose-preview h3 { font-size: 1.1rem; font-weight: 600; color: #1e40af; margin-top: 0.75rem; margin-bottom: 0.25rem; }
                .prose-preview p { margin-bottom: 0.625rem; line-height: 1.6; }
                .prose-preview ul { list-style-type: disc; padding-left: 1.5rem; margin-bottom: 0.75rem; }
                .prose-preview ol { list-style-type: decimal; padding-left: 1.5rem; margin-bottom: 0.75rem; }
                .prose-preview li { margin-bottom: 0.25rem; }
                .prose-preview blockquote { border-left: 4px solid #800020; padding: 0.5rem 1rem; font-style: italic; color: #475569; background-color: #f8fafc; border-radius: 0 0.375rem 0.375rem 0; margin: 0.75rem 0; }
                .prose-preview hr { border: 0; border-top: 1px solid #e2e8f0; margin: 1.25rem 0; clear: both; }
                .prose-preview table { width: 100%; border-collapse: collapse; margin: 1rem 0; clear: both; }
                .prose-preview th, .prose-preview td { border: 1px solid #cbd5e1; padding: 0.5rem 0.75rem; }
                .prose-preview figure { margin: 12px 0; }
                .prose-preview .note-img-left { float: left; margin: 8px 20px 14px 0; }
                .prose-preview .note-img-right { float: right; margin: 8px 0 14px 20px; }
                .prose-preview .note-img-center { display: block; margin: 18px auto; clear: both; }
                .prose-preview .note-img-full { display: block; margin: 20px auto; width: 100%; clear: both; }
              `}</style>
            </div>
          )}
        </div>

        {/* Right column: Document Meta Settings Panel */}
        <div className="lg:col-span-4 space-y-5">
          {/* Status & Visibility Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0f1e36] flex items-center gap-2 border-b border-slate-100 pb-2">
              <Layers className="w-4 h-4 text-[#800020]" />
              Publish Status &amp; Settings
            </h2>

            {/* Note Status Radio */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600">Document Status</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('draft')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all text-center ${
                    status === 'draft'
                      ? 'bg-amber-50 border-amber-400 text-amber-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  📝 Draft
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('published')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all text-center ${
                    status === 'published'
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  🚀 Published
                </button>
              </div>
            </div>

            {/* Pinned to Top */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Pin className="w-4 h-4 text-slate-500" />
                <span className="text-xs font-semibold text-slate-700">Pin to Top of Notebook</span>
              </div>
              <input
                id="pin-note-checkbox"
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="w-4 h-4 text-[#800020] rounded border-slate-300 focus:ring-[#800020]"
              />
            </div>
          </div>

          {/* Category Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0f1e36] flex items-center gap-2 border-b border-slate-100 pb-2">
              <Folder className="w-4 h-4 text-[#1e40af]" />
              Category
            </h2>

            <select
              id="note-category-select"
              value={category}
              onChange={(e) => setCategory(e.target.value as NoteCategory)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-[#0f1e36] focus:outline-none focus:border-[#1e40af]"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Tags Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0f1e36] flex items-center gap-2 border-b border-slate-100 pb-2">
              <Tag className="w-4 h-4 text-[#800020]" />
              Rover Tags
            </h2>
            <div>
              <input
                id="note-tags-input"
                type="text"
                placeholder="E.g. Expedition, Minutes, Badge, FirstAid"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:outline-none focus:border-[#800020]"
              />
              <p className="text-[10px] text-slate-400 mt-1">Separate tags with commas.</p>
            </div>
          </div>

          {/* Author Details Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#0f1e36] flex items-center gap-2 border-b border-slate-100 pb-2">
              <User className="w-4 h-4 text-[#0f1e36]" />
              Author &amp; Rover Role
            </h2>
            <div className="space-y-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Author Name</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-[#0f1e36]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-0.5">Crew Role</label>
                <input
                  type="text"
                  value={authorRole}
                  onChange={(e) => setAuthorRole(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:outline-none focus:border-[#0f1e36]"
                />
              </div>
            </div>
          </div>

          {/* Accent Color selection */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
              Accent Color
            </label>
            <div className="flex items-center gap-3">
              {[
                { color: '#800020', name: 'Maroon' },
                { color: '#0f1e36', name: 'Dark Blue' },
                { color: '#1e40af', name: 'Blue' },
                { color: '#0284c7', name: 'Sky' },
              ].map((c) => (
                <button
                  key={c.color}
                  type="button"
                  onClick={() => setCoverColor(c.color)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    coverColor === c.color ? 'scale-110 border-slate-900 ring-2 ring-slate-400' : 'border-white'
                  }`}
                  style={{ backgroundColor: c.color }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Danger Zone: Delete Option in Sidebar */}
          {isEditing && onDelete && note?.id && (
            <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-5 shadow-xs space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-rose-800">
                Danger Zone
              </label>
              <p className="text-xs text-rose-700 leading-relaxed">
                Permanently delete this note and remove its record from your notebook and Cloud Firestore.
              </p>
              <button
                id="sidebar-delete-note-btn"
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-white hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                Delete This Note
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isConfirmingDelete && note?.id && onDelete && (
        <div 
          id="editor-delete-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-[#0f1e36]">
                  Delete Note?
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Are you sure you want to delete <span className="font-semibold text-slate-900">"{title || 'this note'}"</span>? This will permanently remove this record from your notebook and Cloud Firestore.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                id="cancel-editor-delete-btn"
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="confirm-editor-delete-btn"
                type="button"
                onClick={() => {
                  onDelete(note.id);
                  setIsConfirmingDelete(false);
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
