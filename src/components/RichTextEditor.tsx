import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  Strikethrough, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify, 
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Heading3, 
  Pilcrow, 
  Quote, 
  Highlighter, 
  Palette, 
  Undo, 
  Redo, 
  Minus, 
  Table, 
  RemoveFormatting, 
  Indent, 
  Outdent,
  ChevronDown,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  X,
  Sparkles,
  Loader2
} from 'lucide-react';
import { compressImageFile, generateImageMarkup, InsertImageOptions } from '../utils/imageUtils';

interface RichTextEditorProps {
  initialContent: string;
  onChange: (htmlContent: string) => void;
  placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  initialContent,
  onChange,
  placeholder = 'Start writing your note here...',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isHighlightPickerOpen, setIsHighlightPickerOpen] = useState(false);
  const [isBlockMenuOpen, setIsBlockMenuOpen] = useState(false);
  const [activeBlock, setActiveBlock] = useState('Paragraph');

  // Image insertion modal state
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload');
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageAlt, setImageAlt] = useState<string>('');
  const [imageCaption, setImageCaption] = useState<string>('');
  const [imagePlacement, setImagePlacement] = useState<'center' | 'left' | 'right' | 'full'>('center');
  const [imageSize, setImageSize] = useState<'small' | 'medium' | 'large' | 'full'>('medium');
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [savedRange, setSavedRange] = useState<Range | null>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Toolbar active states
  const [activeStates, setActiveStates] = useState({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    alignLeft: false,
    alignCenter: false,
    alignRight: false,
    alignJustify: false,
    bulletList: false,
    orderedList: false,
  });

  // Color options tailored to the Koshaaru / Arabiyya theme
  const textColors = [
    { label: 'Maroon', color: '#800020' },
    { label: 'Dark Navy', color: '#0f1e36' },
    { label: 'Royal Blue', color: '#1e40af' },
    { label: 'Sky Blue', color: '#0284c7' },
    { label: 'Slate Gray', color: '#475569' },
    { label: 'Forest Green', color: '#16a34a' },
    { label: 'Crimson', color: '#dc2626' },
    { label: 'Charcoal Black', color: '#1e293b' },
  ];

  const highlightColors = [
    { label: 'None', color: 'transparent' },
    { label: 'Yellow', color: '#fef08a' },
    { label: 'Cyan / Light Blue', color: '#bae6fd' },
    { label: 'Light Green', color: '#bbf7d0' },
    { label: 'Light Rose', color: '#fecdd3' },
    { label: 'Light Amber', color: '#fed7aa' },
    { label: 'Light Lavender', color: '#e9d5ff' },
  ];

  // Set initial content
  useEffect(() => {
    if (editorRef.current) {
      if (editorRef.current.innerHTML !== initialContent) {
        editorRef.current.innerHTML = initialContent || '';
      }
    }
  }, []);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0 && editorRef.current) {
      const range = sel.getRangeAt(0);
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        setSavedRange(range.cloneRange());
        return;
      }
    }
    setSavedRange(null);
  };

  const restoreSelection = () => {
    if (savedRange && editorRef.current) {
      editorRef.current.focus();
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedRange);
      }
    } else if (editorRef.current) {
      editorRef.current.focus();
    }
  };

  const updateToolbarStates = useCallback(() => {
    try {
      setActiveStates({
        bold: document.queryCommandState('bold'),
        italic: document.queryCommandState('italic'),
        underline: document.queryCommandState('underline'),
        strike: document.queryCommandState('strikeThrough'),
        alignLeft: document.queryCommandState('justifyLeft'),
        alignCenter: document.queryCommandState('justifyCenter'),
        alignRight: document.queryCommandState('justifyRight'),
        alignJustify: document.queryCommandState('justifyFull'),
        bulletList: document.queryCommandState('insertUnorderedList'),
        orderedList: document.queryCommandState('insertOrderedList'),
      });

      const blockValue = document.queryCommandValue('formatBlock');
      if (blockValue === 'h1') setActiveBlock('Heading 1');
      else if (blockValue === 'h2') setActiveBlock('Heading 2');
      else if (blockValue === 'h3') setActiveBlock('Heading 3');
      else if (blockValue === 'blockquote') setActiveBlock('Quote');
      else setActiveBlock('Paragraph');
    } catch {
      // ignore querying errors
    }
  }, []);

  const handleInput = () => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      onChange(html);
      updateToolbarStates();
    }
  };

  const exec = (command: string, value: string | undefined = undefined) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, value);
    handleInput();
    updateToolbarStates();
  };

  const formatBlock = (tag: string, label: string) => {
    exec('formatBlock', tag);
    setActiveBlock(label);
    setIsBlockMenuOpen(false);
  };

  const insertTable = () => {
    const tableHTML = `
      <table style="width: 100%; border-collapse: collapse; margin: 12px 0; border: 1px solid #cbd5e1;">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-weight: bold;">Item / Rover Duty</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-weight: bold;">Assigned Member</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-weight: bold;">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Pioneer Rigging Check</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Crew Alpha</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Completed</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">First Aid Supply Audit</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Crew Bravo</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">In Progress</td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
    `;
    exec('insertHTML', tableHTML);
  };

  // Open modal with saved cursor position
  const handleOpenImageModal = () => {
    saveSelection();
    setImageError(null);
    setIsImageModalOpen(true);
  };

  // Process and upload an image file
  const handleFileChange = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setImageError('Please select a valid image file (PNG, JPG, WebP, GIF, or SVG).');
      return;
    }

    try {
      setIsProcessingImage(true);
      setImageError(null);
      const compressedDataUrl = await compressImageFile(file, 1200, 0.85);
      setImageSrc(compressedDataUrl);
      if (!imageAlt) {
        setImageAlt(file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '));
      }
    } catch (err) {
      console.error('Error compressing image:', err);
      setImageError('Failed to process the image. Please try another photo.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  // Insert configured image into editor at saved cursor position
  const handleInsertImage = () => {
    if (!imageSrc.trim()) {
      setImageError('Please choose or upload a photo first.');
      return;
    }

    const options: InsertImageOptions = {
      src: imageSrc.trim(),
      alt: imageAlt.trim() || 'Rover Note Photo',
      caption: imageCaption.trim() || undefined,
      placement: imagePlacement,
      size: imageSize,
    };

    const markup = generateImageMarkup(options);

    setIsImageModalOpen(false);
    restoreSelection();
    
    // Insert into contentEditable
    if (editorRef.current) {
      document.execCommand('insertHTML', false, markup);
      handleInput();
      updateToolbarStates();
    }

    // Reset modal states
    setImageSrc('');
    setImageAlt('');
    setImageCaption('');
    setImageError(null);
  };

  // Handle Drag and Drop of image files directly into the editor
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isDraggingOver) setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDraggingOver(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        try {
          const compressed = await compressImageFile(file, 1200, 0.85);
          const markup = generateImageMarkup({
            src: compressed,
            alt: file.name.replace(/\.[^/.]+$/, ''),
            placement: 'center',
            size: 'medium',
          });
          
          if (editorRef.current) {
            editorRef.current.focus();
            document.execCommand('insertHTML', false, markup);
            handleInput();
          }
        } catch (err) {
          console.error('Error dropping image:', err);
        }
      }
    }
  };

  // Handle direct Clipboard Paste (e.g. screenshots or copied images)
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          try {
            const compressed = await compressImageFile(file, 1200, 0.85);
            const markup = generateImageMarkup({
              src: compressed,
              alt: 'Pasted Photo',
              placement: 'center',
              size: 'medium',
            });
            document.execCommand('insertHTML', false, markup);
            handleInput();
          } catch (err) {
            console.error('Error pasting image:', err);
          }
        }
        break;
      }
    }
  };

  // Keyboard shortcut handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey) {
      if (e.key.toLowerCase() === 'b') {
        e.preventDefault();
        exec('bold');
      } else if (e.key.toLowerCase() === 'i') {
        e.preventDefault();
        exec('italic');
      } else if (e.key.toLowerCase() === 'u') {
        e.preventDefault();
        exec('underline');
      } else if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        exec('undo');
      } else if (e.key.toLowerCase() === 'y') {
        e.preventDefault();
        exec('redo');
      }
    }
  };

  return (
    <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-xs focus-within:border-[#1e40af] focus-within:ring-1 focus-within:ring-[#1e40af] transition-all relative">
      {/* Microsoft Word Style Top Ribbon Toolbar */}
      <div 
        id="word-style-toolbar"
        className="bg-slate-50 border-b border-slate-200 p-2 flex flex-wrap items-center gap-1 text-slate-700 select-none sticky top-0 z-20"
      >
        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 pr-1 border-r border-slate-200">
          <button
            id="editor-undo-btn"
            type="button"
            onClick={() => exec('undo')}
            className="p-1.5 rounded hover:bg-white hover:shadow-xs text-slate-700 hover:text-slate-900 transition-all cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            id="editor-redo-btn"
            type="button"
            onClick={() => exec('redo')}
            className="p-1.5 rounded hover:bg-white hover:shadow-xs text-slate-700 hover:text-slate-900 transition-all cursor-pointer"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>

        {/* Text Style / Block Format Dropdown */}
        <div className="relative pr-1 border-r border-slate-200">
          <button
            id="editor-block-format-btn"
            type="button"
            onClick={() => setIsBlockMenuOpen(!isBlockMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 transition-all cursor-pointer"
            title="Styles & Hierarchy"
          >
            <span>{activeBlock}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {isBlockMenuOpen && (
            <div 
              className="absolute left-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-30 space-y-0.5"
              onMouseLeave={() => setIsBlockMenuOpen(false)}
            >
              <button
                type="button"
                onClick={() => formatBlock('<p>', 'Paragraph')}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
              >
                <Pilcrow className="w-3.5 h-3.5 text-slate-400" />
                <span>Normal Text</span>
              </button>
              <button
                type="button"
                onClick={() => formatBlock('<h1>', 'Heading 1')}
                className="w-full text-left px-3 py-1.5 text-sm font-bold text-[#0f1e36] hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
              >
                <Heading1 className="w-4 h-4 text-[#800020]" />
                <span>Heading 1</span>
              </button>
              <button
                type="button"
                onClick={() => formatBlock('<h2>', 'Heading 2')}
                className="w-full text-left px-3 py-1.5 text-xs font-bold text-[#0f1e36] hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
              >
                <Heading2 className="w-3.5 h-3.5 text-[#1e40af]" />
                <span>Heading 2</span>
              </button>
              <button
                type="button"
                onClick={() => formatBlock('<h3>', 'Heading 3')}
                className="w-full text-left px-3 py-1.5 text-xs font-semibold text-slate-800 hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
              >
                <Heading3 className="w-3.5 h-3.5 text-slate-500" />
                <span>Heading 3</span>
              </button>
              <button
                type="button"
                onClick={() => formatBlock('<blockquote>', 'Quote')}
                className="w-full text-left px-3 py-1.5 text-xs italic text-slate-600 hover:bg-slate-100 flex items-center gap-2 border-t border-slate-100 cursor-pointer"
              >
                <Quote className="w-3.5 h-3.5 text-amber-600" />
                <span>Callout Quote</span>
              </button>
            </div>
          )}
        </div>

        {/* Basic Character Formatting (Bold, Italic, Underline, Strikethrough) */}
        <div className="flex items-center gap-0.5 pr-1 border-r border-slate-200">
          <button
            id="editor-bold-btn"
            type="button"
            onClick={() => exec('bold')}
            className={`p-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
              activeStates.bold
                ? 'bg-[#800020] text-white shadow-xs'
                : 'hover:bg-white hover:text-[#0f1e36] text-slate-700'
            }`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            id="editor-italic-btn"
            type="button"
            onClick={() => exec('italic')}
            className={`p-1.5 rounded text-xs italic transition-all cursor-pointer ${
              activeStates.italic
                ? 'bg-[#800020] text-white shadow-xs'
                : 'hover:bg-white hover:text-[#0f1e36] text-slate-700'
            }`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            id="editor-underline-btn"
            type="button"
            onClick={() => exec('underline')}
            className={`p-1.5 rounded text-xs underline transition-all cursor-pointer ${
              activeStates.underline
                ? 'bg-[#800020] text-white shadow-xs'
                : 'hover:bg-white hover:text-[#0f1e36] text-slate-700'
            }`}
            title="Underline (Ctrl+U)"
          >
            <Underline className="w-4 h-4" />
          </button>
          <button
            id="editor-strike-btn"
            type="button"
            onClick={() => exec('strikeThrough')}
            className={`p-1.5 rounded text-xs line-through transition-all cursor-pointer ${
              activeStates.strike
                ? 'bg-[#800020] text-white shadow-xs'
                : 'hover:bg-white hover:text-[#0f1e36] text-slate-700'
            }`}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
        </div>

        {/* Text Color & Highlight Pickers */}
        <div className="flex items-center gap-0.5 pr-1 border-r border-slate-200 relative">
          {/* Text Color */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsColorPickerOpen(!isColorPickerOpen);
                setIsHighlightPickerOpen(false);
              }}
              className="p-1.5 rounded hover:bg-white text-slate-700 flex items-center gap-0.5 cursor-pointer"
              title="Font Color"
            >
              <Palette className="w-4 h-4 text-[#800020]" />
              <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
            </button>

            {isColorPickerOpen && (
              <div 
                className="absolute left-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg p-2 z-30 space-y-1"
                onMouseLeave={() => setIsColorPickerOpen(false)}
              >
                <div className="text-[10px] font-bold uppercase text-slate-400 px-1 pb-1 border-b border-slate-100">
                  Font Colors
                </div>
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {textColors.map((tc) => (
                    <button
                      key={tc.color}
                      type="button"
                      onClick={() => {
                        exec('foreColor', tc.color);
                        setIsColorPickerOpen(false);
                      }}
                      className="w-7 h-7 rounded border border-slate-200 hover:scale-110 transition-transform shadow-xs cursor-pointer"
                      style={{ backgroundColor: tc.color }}
                      title={tc.label}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Text Highlight Color */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsHighlightPickerOpen(!isHighlightPickerOpen);
                setIsColorPickerOpen(false);
              }}
              className="p-1.5 rounded hover:bg-white text-slate-700 flex items-center gap-0.5 cursor-pointer"
              title="Text Highlight Color"
            >
              <Highlighter className="w-4 h-4 text-amber-500" />
              <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
            </button>

            {isHighlightPickerOpen && (
              <div 
                className="absolute left-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-lg p-2 z-30 space-y-1"
                onMouseLeave={() => setIsHighlightPickerOpen(false)}
              >
                <div className="text-[10px] font-bold uppercase text-slate-400 px-1 pb-1 border-b border-slate-100">
                  Highlight Color
                </div>
                <div className="grid grid-cols-4 gap-1.5 pt-1">
                  {highlightColors.map((hc) => (
                    <button
                      key={hc.color}
                      type="button"
                      onClick={() => {
                        exec('hiliteColor', hc.color);
                        setIsHighlightPickerOpen(false);
                      }}
                      className="w-7 h-7 rounded border border-slate-300 hover:scale-110 transition-transform flex items-center justify-center text-[10px] font-bold cursor-pointer"
                      style={{ backgroundColor: hc.color }}
                      title={hc.label}
                    >
                      {hc.color === 'transparent' ? '✕' : ''}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Paragraph Alignment */}
        <div className="flex items-center gap-0.5 pr-1 border-r border-slate-200">
          <button
            type="button"
            onClick={() => exec('justifyLeft')}
            className={`p-1.5 rounded transition-all cursor-pointer ${
              activeStates.alignLeft ? 'bg-slate-200 text-[#0f1e36]' : 'hover:bg-white text-slate-700'
            }`}
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => exec('justifyCenter')}
            className={`p-1.5 rounded transition-all cursor-pointer ${
              activeStates.alignCenter ? 'bg-slate-200 text-[#0f1e36]' : 'hover:bg-white text-slate-700'
            }`}
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => exec('justifyRight')}
            className={`p-1.5 rounded transition-all cursor-pointer ${
              activeStates.alignRight ? 'bg-slate-200 text-[#0f1e36]' : 'hover:bg-white text-slate-700'
            }`}
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => exec('justifyFull')}
            className={`p-1.5 rounded transition-all cursor-pointer ${
              activeStates.alignJustify ? 'bg-slate-200 text-[#0f1e36]' : 'hover:bg-white text-slate-700'
            }`}
            title="Justify"
          >
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>

        {/* Lists & Indentation */}
        <div className="flex items-center gap-0.5 pr-1 border-r border-slate-200">
          <button
            type="button"
            onClick={() => exec('insertUnorderedList')}
            className={`p-1.5 rounded transition-all cursor-pointer ${
              activeStates.bulletList ? 'bg-slate-200 text-[#0f1e36]' : 'hover:bg-white text-slate-700'
            }`}
            title="Bulleted List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => exec('insertOrderedList')}
            className={`p-1.5 rounded transition-all cursor-pointer ${
              activeStates.orderedList ? 'bg-slate-200 text-[#0f1e36]' : 'hover:bg-white text-slate-700'
            }`}
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => exec('outdent')}
            className="p-1.5 rounded hover:bg-white text-slate-700 transition-all cursor-pointer"
            title="Decrease Indent"
          >
            <Outdent className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => exec('indent')}
            className="p-1.5 rounded hover:bg-white text-slate-700 transition-all cursor-pointer"
            title="Increase Indent"
          >
            <Indent className="w-4 h-4" />
          </button>
        </div>

        {/* Media & Elements: Photo Upload & Place, Table, HR, Clear */}
        <div className="flex items-center gap-1">
          {/* PHOTO UPLOAD AND PLACEMENT BUTTON */}
          <button
            id="editor-insert-photo-btn"
            type="button"
            onClick={handleOpenImageModal}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#800020]/10 hover:bg-[#800020] text-[#800020] hover:text-white border border-[#800020]/20 text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Upload and place a photo at cursor position"
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Place Photo</span>
          </button>

          <button
            type="button"
            onClick={() => exec('insertHorizontalRule')}
            className="p-1.5 rounded hover:bg-white text-slate-700 transition-all cursor-pointer"
            title="Insert Horizontal Line"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={insertTable}
            className="p-1.5 rounded hover:bg-white text-slate-700 transition-all cursor-pointer"
            title="Insert Duty / Task Table"
          >
            <Table className="w-4 h-4 text-[#1e40af]" />
          </button>
          <button
            type="button"
            onClick={() => exec('removeFormat')}
            className="p-1.5 rounded hover:bg-white text-slate-700 transition-all cursor-pointer"
            title="Clear Formatting"
          >
            <RemoveFormatting className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Main Microsoft Word Style ContentEditable Canvas */}
      <div 
        className={`p-6 sm:p-8 min-h-[380px] bg-white cursor-text transition-colors relative ${
          isDraggingOver ? 'bg-amber-50/50 ring-2 ring-inset ring-[#800020]' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDraggingOver && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/10 pointer-events-none">
            <div className="bg-white/90 backdrop-blur-xs px-4 py-2 rounded-xl shadow-lg border border-[#800020] flex items-center gap-2 text-[#800020] font-bold text-sm">
              <Upload className="w-4 h-4 animate-bounce" />
              <span>Drop photo here to place in note</span>
            </div>
          </div>
        )}

        <div
          ref={editorRef}
          id="rich-text-content-editable"
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onPaste={handlePaste}
          onKeyDown={handleKeyDown}
          onKeyUp={() => {
            updateToolbarStates();
            saveSelection();
          }}
          onMouseUp={() => {
            updateToolbarStates();
            saveSelection();
          }}
          className="outline-none min-h-[320px] text-slate-800 leading-relaxed font-sans text-sm sm:text-base selection:bg-[#93c5fd] selection:text-[#0f1e36] prose-content"
          data-placeholder={placeholder}
        />
      </div>

      {/* PHOTO UPLOAD & CUSTOM PLACEMENT MODAL */}
      {isImageModalOpen && (
        <div 
          id="insert-photo-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#800020]/10 text-[#800020] flex items-center justify-center">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0f1e36]">
                    Upload &amp; Place Photo
                  </h3>
                  <p className="text-xs text-slate-500">
                    Insert photo with custom layout, alignment, and sizing
                  </p>
                </div>
              </div>
              <button
                id="close-photo-modal-btn"
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Source Selector Tabs: Upload File vs Web URL */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setImageTab('upload');
                  setImageError(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  imageTab === 'upload'
                    ? 'bg-white text-[#0f1e36] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload from Computer</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setImageTab('url');
                  setImageError(null);
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  imageTab === 'url'
                    ? 'bg-white text-[#0f1e36] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                <span>Image Web URL</span>
              </button>
            </div>

            {/* Error Message */}
            {imageError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {imageError}
              </div>
            )}

            {/* Tab 1: Upload from local files */}
            {imageTab === 'upload' ? (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileChange(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                  id="photo-file-input"
                />

                {!imageSrc ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        handleFileChange(e.dataTransfer.files[0]);
                      }
                    }}
                    className="border-2 border-dashed border-slate-300 hover:border-[#800020] rounded-xl p-8 text-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-[#800020]/5 space-y-2.5"
                  >
                    {isProcessingImage ? (
                      <div className="flex flex-col items-center gap-2 py-4">
                        <Loader2 className="w-8 h-8 text-[#800020] animate-spin" />
                        <span className="text-xs font-semibold text-slate-700">
                          Compressing &amp; preparing photo...
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-white shadow-xs border border-slate-200 text-[#800020] flex items-center justify-center mx-auto">
                          <Upload className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">
                            Click to browse photo or drag &amp; drop here
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Supports PNG, JPG, JPEG, WebP, GIF (auto-optimized)
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  /* Image Preview & Change */
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 flex items-center gap-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-white border border-slate-200 shrink-0 flex items-center justify-center">
                      <img 
                        src={imageSrc} 
                        alt="Preview" 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {imageAlt || 'Selected Photo'}
                      </p>
                      <p className="text-[11px] text-emerald-600 font-medium">
                        ✓ Compressed &amp; ready to place
                      </p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-semibold text-[#800020] hover:underline cursor-pointer"
                      >
                        Choose another photo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Tab 2: Web URL input */
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Image Direct URL
                  </label>
                  <input
                    id="image-url-input"
                    type="url"
                    placeholder="https://images.unsplash.com/photo-..."
                    value={imageSrc}
                    onChange={(e) => {
                      setImageSrc(e.target.value);
                      if (imageError) setImageError(null);
                    }}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af]"
                  />
                </div>
                {imageSrc && (
                  <div className="w-full h-28 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 flex items-center justify-center">
                    <img 
                      src={imageSrc} 
                      alt="URL Preview" 
                      onError={() => setImageError('Could not load image from this URL. Please verify the link.')}
                      className="max-h-full max-w-full object-contain" 
                    />
                  </div>
                )}
              </div>
            )}

            {/* Placement Layout Options */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                Placement &amp; Alignment in Note
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setImagePlacement('center')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    imagePlacement === 'center'
                      ? 'border-[#800020] bg-[#800020]/5 text-[#800020] font-bold shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 text-xs'
                  }`}
                >
                  <AlignCenter className="w-4 h-4" />
                  <span className="text-[11px]">Centered</span>
                </button>

                <button
                  type="button"
                  onClick={() => setImagePlacement('left')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    imagePlacement === 'left'
                      ? 'border-[#800020] bg-[#800020]/5 text-[#800020] font-bold shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 text-xs'
                  }`}
                >
                  <AlignLeft className="w-4 h-4" />
                  <span className="text-[11px]">Wrap Left</span>
                </button>

                <button
                  type="button"
                  onClick={() => setImagePlacement('right')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    imagePlacement === 'right'
                      ? 'border-[#800020] bg-[#800020]/5 text-[#800020] font-bold shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 text-xs'
                  }`}
                >
                  <AlignRight className="w-4 h-4" />
                  <span className="text-[11px]">Wrap Right</span>
                </button>

                <button
                  type="button"
                  onClick={() => setImagePlacement('full')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    imagePlacement === 'full'
                      ? 'border-[#800020] bg-[#800020]/5 text-[#800020] font-bold shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700 text-xs'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span className="text-[11px]">Full Banner</span>
                </button>
              </div>
            </div>

            {/* Size Options */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                  Photo Sizing
                </label>
                <span className="text-[10px] text-slate-400">
                  {imageSize === 'small' && 'Compact (280px)'}
                  {imageSize === 'medium' && 'Medium (460px)'}
                  {imageSize === 'large' && 'Wide (680px)'}
                  {imageSize === 'full' && 'Full Note Width (100%)'}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(['small', 'medium', 'large', 'full'] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setImageSize(sz)}
                    className={`py-1.5 rounded-lg border text-xs font-bold capitalize transition-all cursor-pointer ${
                      imageSize === sz
                        ? 'border-[#1e40af] bg-[#1e40af]/10 text-[#1e40af]'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Caption and Alt Text */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Photo Caption (Optional)
                </label>
                <input
                  id="photo-caption-input"
                  type="text"
                  placeholder="E.g., Arabiyya Rover rigging setup at Camp A"
                  value={imageCaption}
                  onChange={(e) => setImageCaption(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alt / Title Description
                </label>
                <input
                  id="photo-alt-input"
                  type="text"
                  placeholder="E.g., Rigging knots diagram"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af]"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
              <button
                id="cancel-photo-insert-btn"
                type="button"
                onClick={() => setIsImageModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="confirm-place-photo-btn"
                type="button"
                disabled={!imageSrc || isProcessingImage}
                onClick={handleInsertImage}
                className={`px-4 py-2 text-xs font-bold rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  imageSrc && !isProcessingImage
                    ? 'bg-[#800020] hover:bg-[#600018] text-white'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Place in Note</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Document Styling for Rich Text Content & Inserted Images */}
      <style>{`
        .prose-content:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
        }
        .prose-content h1 {
          font-size: 1.75rem;
          font-weight: 700;
          color: #0f1e36;
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          line-height: 1.25;
        }
        .prose-content h2 {
          font-size: 1.35rem;
          font-weight: 700;
          color: #0f1e36;
          margin-top: 0.875rem;
          margin-bottom: 0.375rem;
          line-height: 1.3;
        }
        .prose-content h3 {
          font-size: 1.15rem;
          font-weight: 600;
          color: #1e40af;
          margin-top: 0.75rem;
          margin-bottom: 0.25rem;
        }
        .prose-content p {
          margin-bottom: 0.625rem;
          line-height: 1.6;
        }
        .prose-content ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .prose-content ol {
          list-style-type: decimal;
          padding-left: 1.5rem;
          margin-bottom: 0.75rem;
        }
        .prose-content li {
          margin-bottom: 0.25rem;
        }
        .prose-content blockquote {
          border-left: 4px solid #800020;
          padding-left: 1rem;
          margin: 0.75rem 0;
          font-style: italic;
          color: #475569;
          background-color: #f8fafc;
          padding-top: 0.375rem;
          padding-bottom: 0.375rem;
          border-radius: 0 0.375rem 0.375rem 0;
        }
        .prose-content hr {
          border: 0;
          border-top: 1px solid #e2e8f0;
          margin: 1.25rem 0;
          clear: both;
        }
        .prose-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
          clear: both;
        }
        .prose-content th, .prose-content td {
          border: 1px solid #cbd5e1;
          padding: 0.5rem 0.75rem;
        }
        .prose-content figure {
          user-select: none;
        }
        .prose-content figure:hover img {
          outline: 2px solid #800020;
          outline-offset: 2px;
        }
        .prose-content .note-img-left {
          float: left;
          margin: 8px 20px 14px 0;
        }
        .prose-content .note-img-right {
          float: right;
          margin: 8px 0 14px 20px;
        }
        .prose-content .note-img-center {
          display: block;
          margin: 18px auto;
          clear: both;
        }
        .prose-content .note-img-full {
          display: block;
          margin: 20px auto;
          width: 100%;
          clear: both;
        }
      `}</style>
    </div>
  );
};
