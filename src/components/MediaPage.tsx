import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Image as ImageIcon, 
  Video, 
  FolderOpen, 
  Plus, 
  FileCheck, 
  Clock, 
  Users, 
  Calendar, 
  CheckCircle2, 
  ShieldAlert, 
  Upload, 
  AlertCircle,
  FolderPlus,
  Send,
  Trash2
} from 'lucide-react';
import { collection, addDoc, getDocs, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { PagePermissions } from '../services/permissionsService';

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  'Council Secretary': ['governance', 'events', 'media', 'records'],
  'Council Treasurer': ['finance'],
  'Council Quartermaster': ['progress', 'records'],
  'Secretary': ['governance', 'events', 'media', 'records'],
  'Treasurer': ['finance'],
  'Quartermaster': ['progress', 'records'],
};

interface MediaPost {
  id: string;
  title: string;
  date: string;
  platform: 'Instagram' | 'Facebook' | 'Viber Community' | 'Twitter' | 'Website';
  caption: string;
  status: 'Draft' | 'Scheduled' | 'Published';
  creatorName: string;
}

interface MediaFile {
  id: string;
  name: string;
  folder: 'Photos' | 'Videos' | 'Posters' | 'Graphics';
  size: string;
  uploadedBy: string;
  date: string;
  url?: string;
  consentChecked: boolean;
}

interface MediaTask {
  id: string;
  title: string;
  assignedTo: string;
  status: 'Pending' | 'In Progress' | 'Reviewed' | 'Approved';
  dueDate: string;
  description: string;
}

export const MediaPage: React.FC<{ 
  isAdmin: boolean; 
  userRole?: string; 
  pagePermissions?: PagePermissions[];
}> = ({ 
  isAdmin, 
  userRole = 'Media Coordinator', 
  pagePermissions 
}) => {
  const currentRole = isAdmin ? 'Administrator' : userRole;

  // Active simulated role for testing
  const [simulatedRole, setSimulatedRole] = useState<string>(currentRole);

  const [activeTab, setActiveTab] = useState<'calendar' | 'archive' | 'sync'>('calendar');
  
  // Dynamic States
  const [posts, setPosts] = useState<MediaPost[]>([]);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [tasks, setTasks] = useState<MediaTask[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States - Media Post
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [pTitle, setPTitle] = useState('');
  const [pDate, setPDate] = useState('');
  const [pPlatform, setPPlatform] = useState<MediaPost['platform']>('Instagram');
  const [pCaption, setPCaption] = useState('');

  // Form States - File Upload
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [fName, setFName] = useState('');
  const [fFolder, setFFolder] = useState<MediaFile['folder']>('Photos');
  const [fConsent, setFConsent] = useState(false); // Mandatory consent check

  // Form States - Task
  const [isTaskOpen, setIsTaskOpen] = useState(false);
  const [tTitle, setTTitle] = useState('');
  const [tAssigned, setTAssigned] = useState('');
  const [tDue, setTDue] = useState('');
  const [tDesc, setTDesc] = useState('');

  useEffect(() => {
    const qPosts = query(collection(db, 'media_posts'), orderBy('date', 'desc'));
    const unsubPosts = onSnapshot(qPosts, (snapshot) => {
      const ps: MediaPost[] = [];
      snapshot.forEach(doc => {
        ps.push({ id: doc.id, ...doc.data() } as MediaPost);
      });
      setPosts(ps);
    }, (error) => {
      console.warn('Fallback media posts:', error);
      setPosts([
        { id: '1', title: 'National Day Rover Salute Announcement', date: '2026-08-19', platform: 'Instagram', caption: 'Honoring our nation and our duties as scouts. Prepared and motivated.', status: 'Scheduled', creatorName: 'ASG Media Link' },
        { id: '2', title: 'Pioneering Camp Highlight Reels', date: '2026-08-15', platform: 'Instagram', caption: 'Witness the rigor, the knots, and the heights. #ArabiyyaRovers', status: 'Published', creatorName: 'ASG Media Link' }
      ]);
    });

    const qFiles = query(collection(db, 'media_archive'));
    const unsubFiles = onSnapshot(qFiles, (snapshot) => {
      const fs: MediaFile[] = [];
      snapshot.forEach(doc => {
        fs.push({ id: doc.id, ...doc.data() } as MediaFile);
      });
      setFiles(fs);
      setLoading(false);
    }, (error) => {
      console.warn('Fallback media archive files:', error);
      setFiles([
        { id: '1', name: 'Jamboree_Camp_Kickoff.jpg', folder: 'Photos', size: '4.8 MB', uploadedBy: 'Sana Ahmed', date: '2026-08-12', consentChecked: true },
        { id: '2', name: 'Investiture_Rollup_Banner_Final.pdf', folder: 'Posters', size: '12.4 MB', uploadedBy: 'Ibrahim Manik', date: '2026-08-10', consentChecked: true },
        { id: '3', name: 'Syllabus_Explanation_Teaser.mp4', folder: 'Videos', size: '45.1 MB', uploadedBy: 'Zeeshan Ahmed', date: '2026-08-01', consentChecked: true }
      ]);
      setLoading(false);
    });

    const qTasks = query(collection(db, 'media_tasks'));
    const unsubTasks = onSnapshot(qTasks, (snapshot) => {
      const ts: MediaTask[] = [];
      snapshot.forEach(doc => {
        ts.push({ id: doc.id, ...doc.data() } as MediaTask);
      });
      setTasks(ts);
    }, (error) => {
      console.warn('Fallback media tasks:', error);
      setTasks([
        { id: '1', title: 'Design graphic poster for the Squire Induction Ceremony', assignedTo: 'ASG Creative Officer', status: 'In Progress', dueDate: '2026-08-25', description: 'Create high-res SVG roll-up layout and social media promotional formats.' },
        { id: '2', title: 'Write Viber Community blast caption for beach cleanup logistics', assignedTo: 'Zeeshan Ahmed', status: 'Approved', dueDate: '2026-08-19', description: 'Draft brief guidelines, gear checklist, and assembly map directions.' }
      ]);
    });

    return () => {
      unsubPosts();
      unsubFiles();
      unsubTasks();
    };
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pTitle.trim() || !pDate) return;

    const postData = {
      title: pTitle.trim(),
      date: pDate,
      platform: pPlatform,
      caption: pCaption.trim(),
      status: 'Scheduled',
      creatorName: currentRole
    };

    try {
      await addDoc(collection(db, 'media_posts'), postData);
      setIsPostOpen(false);
      setPTitle('');
      setPCaption('');
    } catch (err) {
      setPosts(prev => [postData as MediaPost, ...prev]);
      setIsPostOpen(false);
      setPTitle('');
      setPCaption('');
    }
  };

  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fName.trim()) return;

    // MANDATORY PRIVACY CHECKLIST ENFORCEMENT
    if (!fConsent) {
      alert('⚠️ Mandatory Consent Required: You must verify that all participants depicted in this photograph or video have granted official media release consent.');
      return;
    }

    const fileData = {
      name: fName.trim().endsWith('.jpg') || fName.trim().endsWith('.png') || fName.trim().endsWith('.pdf') || fName.trim().endsWith('.mp4') ? fName.trim() : `${fName.trim()}.jpg`,
      folder: fFolder,
      size: `${(Math.random() * 8 + 1).toFixed(1)} MB`,
      uploadedBy: currentRole,
      date: new Date().toISOString().split('T')[0],
      consentChecked: true
    };

    try {
      await addDoc(collection(db, 'media_archive'), fileData);
      setIsUploadOpen(false);
      setFName('');
      setFConsent(false);
    } catch (err) {
      setFiles(prev => [...prev, { id: Date.now().toString(), ...fileData } as MediaFile]);
      setIsUploadOpen(false);
      setFName('');
      setFConsent(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tTitle.trim() || !tAssigned) return;

    const taskData = {
      title: tTitle.trim(),
      assignedTo: tAssigned.trim(),
      status: 'Pending',
      dueDate: tDue || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      description: tDesc.trim()
    };

    try {
      await addDoc(collection(db, 'media_tasks'), taskData);
      setIsTaskOpen(false);
      setTTitle('');
      setTDesc('');
    } catch (err) {
      setTasks(prev => [...prev, { id: Date.now().toString(), ...taskData } as MediaTask]);
      setIsTaskOpen(false);
      setTTitle('');
      setTDesc('');
    }
  };

  const handleUpdateTaskStatus = async (id: string, next: MediaTask['status']) => {
    try {
      await updateDoc(doc(db, 'media_tasks', id), { status: next });
    } catch (err) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: next } : t));
    }
  };

  const simulatedRolesList = [
    'Media Coordinator',
    'ASG Media Team',
    'Normal Rover Member',
    'Administrator'
  ];

  const isAdvisor = simulatedRole.toLowerCase().includes('advisor') || 
                    simulatedRole.toLowerCase().includes('administrator') || 
                    simulatedRole.toLowerCase().includes('ziyad');

  const hasRolePermission = pagePermissions?.some(p => 
    p.memberId.toLowerCase() === simulatedRole.toLowerCase() && p.grantedPages.includes('media')
  ) || (!pagePermissions?.some(p => p.memberId.toLowerCase() === simulatedRole.toLowerCase()) && 
        DEFAULT_ROLE_PERMISSIONS[simulatedRole]?.includes('media'));

  const actualHasAccess = isAdvisor || hasRolePermission;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Camera className="w-6 h-6 text-rose-500" />
            <h1 className="text-xl font-bold text-[#0f1e36]">Media, Publicity & Social Assets</h1>
          </div>
          <p className="text-xs text-slate-500">Plan social publicity schedules, organize digital assets with compliance verification, and coordinate with ASG.</p>
        </div>

        {/* Simulator Selector */}
        <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 shrink-0">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Simulate Role:</span>
          <select
            value={simulatedRole}
            onChange={(e) => setSimulatedRole(e.target.value)}
            className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-slate-800 focus:outline-none"
          >
            {simulatedRolesList.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Role Access Info Banner for Normal Members */}
      {!actualHasAccess && (
        <div className="bg-[#fff0f6] border border-rose-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-rose-950">Read-Only Campaigns Vault</h4>
              <p className="text-[11px] text-rose-800 leading-relaxed max-w-xl">
                As a normal member, you can review published campaigns, social schedules, and media files. Scheduling announcements, uploading resources, and delegating assignments is restricted to the media team.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setSimulatedRole('Media Coordinator')}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] font-bold transition-colors cursor-pointer shrink-0"
          >
            Impersonate Coordinator
          </button>
        </div>
      )}

      <>
          {/* Tabs */}
          <div className="flex border-b border-slate-200 gap-1.5 bg-slate-100/55 p-1 rounded-xl max-w-lg">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'calendar'
                  ? 'bg-white text-[#1e40af] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Content Schedule
            </button>
            <button
              onClick={() => setActiveTab('archive')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'archive'
                  ? 'bg-white text-[#1e40af] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FolderOpen className="w-4 h-4" />
              Media Vault
            </button>
            <button
              onClick={() => setActiveTab('sync')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'sync'
                  ? 'bg-white text-[#1e40af] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4" />
              ASG Media Sync
            </button>
          </div>

          {/* Tab 1: Content Calendar */}
          {activeTab === 'calendar' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Campaigns & Social Calendar</h2>
                  <p className="text-xs text-slate-500">Plan and schedule publicity announcements, caption releases, and campaign timelines.</p>
                </div>
                {actualHasAccess && (
                  <button
                    onClick={() => setIsPostOpen(true)}
                    className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" /> Schedule Publicity Post
                  </button>
                )}
              </div>

              {/* Posts Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {posts.map((p) => (
                  <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md uppercase tracking-wider">{p.platform}</span>
                        <span className="bg-amber-50 text-amber-700 text-[10px] font-bold uppercase px-2 py-0.5 rounded-md">{p.status}</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">{p.title}</h3>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs text-slate-700 italic leading-relaxed">
                        "{p.caption}"
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-50 text-[11px] font-semibold text-slate-400">
                      <span>Launch Date: {p.date}</span>
                      <span>By: {p.creatorName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 2: Media Vault */}
          {activeTab === 'archive' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Digital Media Archive</h2>
                  <p className="text-xs text-slate-500">Store and organize high-resolution photos, posters, and graphic designs.</p>
                </div>
                {actualHasAccess && (
                  <button
                    onClick={() => setIsUploadOpen(true)}
                    className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Upload className="w-4 h-4" /> Upload Certified Media
                  </button>
                )}
              </div>

              {/* Folder structure and grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {['Photos', 'Videos', 'Posters', 'Graphics'].map((f) => {
                  const folderCount = files.filter(file => file.folder === f).length;
                  return (
                    <div key={f} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs hover:border-rose-300 transition-colors cursor-pointer flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-500">
                        <FolderOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{f} Folder</h4>
                        <p className="text-[10px] text-slate-400 font-semibold">{folderCount} files saved</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Files Table List */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="p-4">File Name</th>
                      <th className="p-4">Category Folder</th>
                      <th className="p-4">Size / Date</th>
                      <th className="p-4">Consent Release Compliance</th>
                      <th className="p-4 text-center">Owner</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {files.map((file) => (
                      <tr key={file.id} className="hover:bg-slate-50/55 transition-colors">
                        <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-rose-500 shrink-0" />
                          <span>{file.name}</span>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
                            {file.folder}
                          </span>
                        </td>
                        <td className="p-4 font-medium text-slate-500">
                          {file.size} • {file.date}
                        </td>
                        <td className="p-4">
                          {file.consentChecked ? (
                            <span className="text-emerald-700 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> Signed Consent Compliance Verified
                            </span>
                          ) : (
                            <span className="text-red-500 font-bold flex items-center gap-1">
                              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" /> Missing Forms
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-center text-slate-400 font-bold">{file.uploadedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: ASG Media Sync */}
          {activeTab === 'sync' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">ASG Media Coordination Desk</h2>
                  <p className="text-xs text-slate-500">Manage design, writing, and photography pipelines with ASG Media Team Specialists.</p>
                </div>
                {actualHasAccess && (
                  <button
                    onClick={() => setIsTaskOpen(true)}
                    className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" /> Delegate Creative Assignment
                  </button>
                )}
              </div>

              {/* Task pipeline board */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tasks.map((task) => (
                  <div key={task.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex justify-between gap-6 hover:shadow-sm">
                    <div className="space-y-4 flex-1">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">{task.title}</h3>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                            task.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {task.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">Assigned Specialist: {task.assignedTo} • Due: {task.dueDate}</p>
                      </div>

                      <p className="text-xs text-slate-600 font-medium leading-relaxed">{task.description}</p>
                    </div>

                    <div className="shrink-0 flex flex-col gap-1.5 justify-center">
                      <button
                        onClick={() => handleUpdateTaskStatus(task.id, 'In Progress')}
                        className="px-2 py-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 font-bold text-[9px] rounded uppercase cursor-pointer"
                      >
                        Start
                      </button>
                      <button
                        onClick={() => handleUpdateTaskStatus(task.id, 'Approved')}
                        className="px-2 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[9px] rounded uppercase cursor-pointer"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>

      {/* Schedule Post Modal */}
      {isPostOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-6">
            <h2 className="text-base font-bold text-slate-900">Schedule Publicity Post</h2>
            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Campaign Title / Context</label>
                <input
                  type="text"
                  required
                  value={pTitle}
                  onChange={(e) => setPTitle(e.target.value)}
                  placeholder="e.g. Squire Induction Teaser Grid"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Release Date</label>
                  <input
                    type="date"
                    required
                    value={pDate}
                    onChange={(e) => setPDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Platform Channel</label>
                  <select
                    value={pPlatform}
                    onChange={(e) => setPPlatform(e.target.value as any)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none"
                  >
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Viber Community">Viber Community</option>
                    <option value="Twitter">Twitter</option>
                    <option value="Website">Portal Announcements</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Proposed Caption</label>
                <textarea
                  required
                  value={pCaption}
                  onChange={(e) => setPCaption(e.target.value)}
                  rows={4}
                  placeholder="Draft caption, hashtags, and links..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPostOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-rose-700"
                >
                  Schedule Publicity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Certified Media Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-6">
            <h2 className="text-base font-bold text-slate-900">Upload Digital Asset</h2>
            <form onSubmit={handleUploadFile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Asset File Name</label>
                <input
                  type="text"
                  required
                  value={fName}
                  onChange={(e) => setFName(e.target.value)}
                  placeholder="e.g. scout_jamboree_group_photo.jpg"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Folder Location</label>
                <select
                  value={fFolder}
                  onChange={(e) => setFFolder(e.target.value as any)}
                  className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none"
                >
                  <option value="Photos">Photos Folder</option>
                  <option value="Videos">Videos Folder</option>
                  <option value="Posters">Posters & Banners Folder</option>
                  <option value="Graphics">Graphics & Vectors Folder</option>
                </select>
              </div>

              {/* MANDATORY CONSENT CHECKLIST CHECKBOX */}
              <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <input
                    type="checkbox"
                    id="consent-box"
                    checked={fConsent}
                    onChange={(e) => setFConsent(e.target.checked)}
                    className="mt-0.5 w-4.5 h-4.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                  />
                  <label htmlFor="consent-box" className="text-xs font-bold text-rose-950 leading-normal select-none cursor-pointer">
                    Mandatory Consent & Privacy Checklist Enforced
                  </label>
                </div>
                <p className="text-[10px] text-rose-700 leading-normal font-medium">
                  By checking this box, you verify that written photo/video release consent forms have been signed by all depicting participants and guardians prior to storing this asset in the council digital archives.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-rose-700"
                >
                  Commit Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delegate Creative Task Modal */}
      {isTaskOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-6">
            <h2 className="text-base font-bold text-slate-900">Delegate Creative Assignment</h2>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Task Assignment Title</label>
                <input
                  type="text"
                  required
                  value={tTitle}
                  onChange={(e) => setTTitle(e.target.value)}
                  placeholder="e.g. Design vector graphic badge certificates"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned specialist</label>
                  <input
                    type="text"
                    required
                    value={tAssigned}
                    onChange={(e) => setTAssigned(e.target.value)}
                    placeholder="e.g. ASG Illustrator"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    required
                    value={tDue}
                    onChange={(e) => setTDue(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Design requirements details</label>
                <textarea
                  value={tDesc}
                  onChange={(e) => setTDesc(e.target.value)}
                  rows={3}
                  placeholder="Specify sizes, typography pairing guidelines, or brand colors to follow..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTaskOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-rose-700"
                >
                  Delegate Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
