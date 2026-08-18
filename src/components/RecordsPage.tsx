import React, { useState, useEffect } from 'react';
import { 
  Archive, 
  Search, 
  FolderLock, 
  FileText, 
  ShieldCheck, 
  Users, 
  Plus, 
  Send, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle,
  ShieldAlert,
  Download,
  FolderOpen
} from 'lucide-react';
import { collection, addDoc, getDocs, onSnapshot, query, orderBy, updateDoc, doc } from 'firebase/firestore';
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

interface MemberRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  crew: string;
  status: 'Active' | 'Alumni' | 'Squire';
  joiningDate: string;
}

interface RecordDoc {
  id: string;
  title: string;
  category: 'Minutes' | 'Resolutions' | 'Annual Reports' | 'Official Reports' | 'Handover Vault';
  uploadedBy: string;
  date: string;
  fileName: string;
  contentSummary?: string;
  isArchived?: boolean;
}

export const RecordsPage: React.FC<{ 
  isAdmin: boolean; 
  userRole?: string; 
  pagePermissions?: PagePermissions[];
}> = ({ 
  isAdmin, 
  userRole = 'Council Secretary', 
  pagePermissions 
}) => {
  const currentRole = isAdmin ? 'Administrator' : userRole;

  // Active simulated role for testing
  const [simulatedRole, setSimulatedRole] = useState<string>(currentRole);

  const [activeTab, setActiveTab] = useState<'directory' | 'vault' | 'portal' | 'handover'>('directory');
  
  // Dynamic States
  const [membersList, setMembersList] = useState<MemberRecord[]>([]);
  const [records, setRecords] = useState<RecordDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States - Interdepartmental Submission
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);
  const [subTitle, setSubTitle] = useState('');
  const [subCat, setSubCat] = useState<RecordDoc['category']>('Official Reports');
  const [subFile, setSubFile] = useState('');
  const [subSummary, setSubSummary] = useState('');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Subscriber for member directory fallback
    const qMembers = query(collection(db, 'records_member_directory'));
    const unsubMembers = onSnapshot(qMembers, (snapshot) => {
      const ms: MemberRecord[] = [];
      snapshot.forEach(doc => {
        ms.push({ id: doc.id, ...doc.data() } as MemberRecord);
      });
      setMembersList(ms);
    }, (error) => {
      console.warn('Fallback member directory state:', error);
      setMembersList([
        { id: '1', name: 'Zeeshan Ahmed', email: 'zeeshan@koshaaru.org', phone: '+960 771-2938', crew: 'Abu Bakr Crew', status: 'Active', joiningDate: '2024-03-15' },
        { id: '2', name: 'Sana Ahmed', email: 'sana@koshaaru.org', phone: '+960 798-1102', crew: 'Ali Crew', status: 'Squire', joiningDate: '2026-06-01' },
        { id: '3', name: 'Ibrahim Manik', email: 'manik@koshaaru.org', phone: '+960 735-4422', crew: 'Abu Bakr Crew', status: 'Active', joiningDate: '2023-11-20' }
      ]);
    });

    // Subscriber for Official Documents Repository
    const qRecords = query(collection(db, 'records_documents'), orderBy('date', 'desc'));
    const unsubRecords = onSnapshot(qRecords, (snapshot) => {
      const rs: RecordDoc[] = [];
      snapshot.forEach(doc => {
        rs.push({ id: doc.id, ...doc.data() } as RecordDoc);
      });
      setRecords(rs);
      setLoading(false);
    }, (error) => {
      console.warn('Fallback official records state:', error);
      setRecords([
        { id: '1', title: '5th Regular Executive Council Session Minutes', category: 'Minutes', uploadedBy: 'Council Secretary', date: '2026-08-01', fileName: 'council_session_5_minutes.pdf', isArchived: true },
        { id: '2', title: 'Q2 Financial Audit & Reconciled Balances', category: 'Annual Reports', uploadedBy: 'Treasurer Link', date: '2026-07-30', fileName: 'q2_reconciled_ledger.xlsx', isArchived: true },
        { id: '3', title: 'Post-Event Evaluation Report: Henveiru Beach Cleanup', category: 'Official Reports', uploadedBy: 'Event Coordinator Link', date: '2026-08-10', fileName: 'henveiru_beach_cleanup_report.pdf', isArchived: false, contentSummary: 'Highly successful cleanup project. Completed with 18 participants and 24 logged service hours.' }
      ]);
      setLoading(false);
    });

    return () => {
      unsubMembers();
      unsubRecords();
    };
  }, []);

  const handleCreateSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subTitle.trim() || !subFile.trim()) return;

    const subData = {
      title: subTitle.trim(),
      category: subCat,
      uploadedBy: currentRole,
      date: new Date().toISOString().split('T')[0],
      fileName: subFile.trim().endsWith('.pdf') ? subFile.trim() : `${subFile.trim()}.pdf`,
      contentSummary: subSummary.trim(),
      isArchived: false
    };

    try {
      await addDoc(collection(db, 'records_documents'), subData);
      setIsSubmitOpen(false);
      setSubTitle('');
      setSubFile('');
      setSubSummary('');
    } catch (err) {
      setRecords(prev => [subData as RecordDoc, ...prev]);
      setIsSubmitOpen(false);
      setSubTitle('');
      setSubFile('');
      setSubSummary('');
    }
  };

  const handleArchiveDocument = async (id: string) => {
    try {
      await updateDoc(doc(db, 'records_documents', id), {
        isArchived: true
      });
    } catch (err) {
      setRecords(prev => prev.map(r => r.id === id ? { ...r, isArchived: true } : r));
    }
  };

  const filteredMembers = membersList.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.crew.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredRecords = records.filter(r => r.isArchived).filter(r =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingSubmissions = records.filter(r => !r.isArchived);

  const simulatedRolesList = [
    'Council Secretary',
    'Secretary',
    'Treasurer',
    'Normal Rover Member',
    'Administrator'
  ];

  const isAdvisor = simulatedRole.toLowerCase().includes('advisor') || 
                    simulatedRole.toLowerCase().includes('administrator') || 
                    simulatedRole.toLowerCase().includes('ziyad');

  const hasRolePermission = pagePermissions?.some(p => 
    p.memberId.toLowerCase() === simulatedRole.toLowerCase() && p.grantedPages.includes('records')
  ) || (!pagePermissions?.some(p => p.memberId.toLowerCase() === simulatedRole.toLowerCase()) && 
        DEFAULT_ROLE_PERMISSIONS[simulatedRole]?.includes('records'));

  const actualHasAccess = isAdvisor || hasRolePermission;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Archive className="w-6 h-6 text-[#1e40af]" />
            <h1 className="text-xl font-bold text-[#0f1e36]">Records Archive & Secretariat</h1>
          </div>
          <p className="text-xs text-slate-500">Access central directory logs, official meeting archives, inter-department submissions, and term handovers.</p>
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
        <div className="bg-[#edf2ff] border border-blue-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-[#1e40af] shrink-0">
              <FolderLock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-blue-950">Read-Only Secretariat Archives</h4>
              <p className="text-[11px] text-blue-800 leading-relaxed max-w-xl">
                As a normal member, you have read-only access to basic roster rosters and guidelines. Detailed resolutions, submission logs, and audit records are strictly locked.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setSimulatedRole('Council Secretary')}
            className="px-3.5 py-1.5 bg-[#1e40af] hover:bg-[#1e3a8a] text-white rounded-xl text-[11px] font-bold transition-colors cursor-pointer shrink-0"
          >
            Impersonate Secretary
          </button>
        </div>
      )}

      <>
          {/* Tabs */}
          <div className="flex border-b border-slate-200 gap-1.5 bg-slate-100/55 p-1 rounded-xl max-w-xl">
            <button
              onClick={() => setActiveTab('directory')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'directory'
                  ? 'bg-white text-[#1e40af] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4" />
              Member Directory
            </button>
            <button
              onClick={() => setActiveTab('vault')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'vault'
                  ? 'bg-white text-[#1e40af] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FolderLock className="w-4 h-4" />
              Official Repository
            </button>
            <button
              onClick={() => setActiveTab('portal')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'portal'
                  ? 'bg-white text-[#1e40af] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Send className="w-4 h-4" />
              Submission Portal
              {pendingSubmissions.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse ml-0.5" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('handover')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'handover'
                  ? 'bg-white text-[#1e40af] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Archive className="w-4 h-4" />
              Handover Vault
            </button>
          </div>

          {/* Directory Tab */}
          {activeTab === 'directory' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Central Member Directory</h2>
                  <p className="text-xs text-slate-500">Secure repository maintaining active contact details and official joining registries.</p>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search rosters, emails, crews, or ranks..."
                  className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#1e40af]"
                />
              </div>

              {/* Directory table */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="p-4">Full Name / Crew</th>
                      <th className="p-4">Contact Email</th>
                      <th className="p-4">Phone Number</th>
                      <th className="p-4">Roster Status</th>
                      <th className="p-4 text-center">Registrar Joining Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredMembers.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/55 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{m.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{m.crew}</div>
                        </td>
                        <td className="p-4 font-semibold text-slate-600">
                          {actualHasAccess ? m.email : m.email.replace(/(.{2})(.*)(@.*)/, "$1***$3")}
                        </td>
                        <td className="p-4 text-slate-700 font-medium">
                          {actualHasAccess ? m.phone : m.phone.replace(/(\d{3})(\d+)/, "$1-****")}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            m.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {m.status}
                          </span>
                        </td>
                        <td className="p-4 text-center font-bold text-slate-500">{m.joiningDate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Official Repository Tab */}
          {activeTab === 'vault' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Official Records Vault</h2>
                  <p className="text-xs text-slate-500">Archived meeting minutes, executive resolutions, and consolidated annual reports.</p>
                </div>
              </div>

              {/* Records grid/list */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="p-4">Record Title</th>
                      <th className="p-4">Type Class</th>
                      <th className="p-4">Archived Date</th>
                      <th className="p-4">Source System File</th>
                      <th className="p-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredRecords.map((doc) => (
                      <tr key={doc.id} className="hover:bg-slate-50/55 transition-colors">
                        <td className="p-4">
                          <div className="font-bold text-slate-900">{doc.title}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Author logged: {doc.uploadedBy}</div>
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100 font-bold text-[10px]">
                            {doc.category}
                          </span>
                        </td>
                        <td className="p-4 text-slate-500 font-medium">{doc.date}</td>
                        <td className="p-4 font-semibold text-[#1e40af]">
                          <span className="flex items-center gap-1.5 cursor-pointer hover:underline">
                            <FileText className="w-3.5 h-3.5" /> {doc.fileName}
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          {actualHasAccess || doc.category === 'Guidelines' ? (
                            <button
                              onClick={() => alert(`📥 Downloading verified archival PDF: ${doc.fileName}`)}
                              className="px-2 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200 inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Download className="w-3 h-3" /> Download
                            </button>
                          ) : (
                            <span className="text-slate-400 font-bold text-xs">🔒 Locked</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Submission Portal */}
          {activeTab === 'portal' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Inter-Departmental Submission Portal</h2>
                  <p className="text-xs text-slate-500">Automated ledger where Coordinators log completed evaluations, assets, and rosters directly to the Secretary.</p>
                </div>
                {actualHasAccess && (
                  <button
                    onClick={() => setIsSubmitOpen(true)}
                    className="bg-[#1e40af] hover:bg-[#1e3a8a] text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" /> Initiate Coordinator Submission
                  </button>
                )}
              </div>

              {/* Pending submissions list */}
              <div className="space-y-4">
                {pendingSubmissions.length === 0 ? (
                  <div className="text-center p-8 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-semibold text-slate-400">
                    All inter-departmental submissions successfully audited and archived.
                  </div>
                ) : (
                  pendingSubmissions.map((doc) => (
                    <div key={doc.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex justify-between gap-6 items-start">
                      <div className="space-y-3 flex-1">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900">{doc.title}</h3>
                            <span className="bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-md">Pending Audit</span>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">Submitted By: {doc.uploadedBy} • Date: {doc.date} • Attached: {doc.fileName}</p>
                        </div>

                        {doc.contentSummary && (
                          <div className="bg-slate-50 p-3.5 border border-slate-100 rounded-xl text-xs font-medium text-slate-600 whitespace-pre-line leading-relaxed">
                            {doc.contentSummary}
                          </div>
                        )}
                      </div>

                      {actualHasAccess && (
                        <div className="shrink-0">
                          <button
                            onClick={() => handleArchiveDocument(doc.id)}
                            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                          >
                            <CheckCircle2 className="w-4 h-4" /> Commit to Official Archive
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Handover Vault */}
          {activeTab === 'handover' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900">Term Handover Vault</h2>
                <p className="text-xs text-slate-500">Structured folder tree archiving complete term record books for incoming council generations.</p>
              </div>

              {/* Folder structure browser */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { term: 'Term of 2024 - 2025', files: 24, size: '84.2 MB' },
                  { term: 'Term of 2023 - 2024', files: 18, size: '61.5 MB' },
                  { term: 'Term of 2022 - 2023', files: 32, size: '102.1 MB' }
                ].map((folder) => (
                  <div key={folder.term} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-blue-300 transition-all cursor-pointer space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700">
                        <FolderOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">{folder.term}</h4>
                        <p className="text-[10px] text-slate-400 font-bold">{folder.files} Archived Assets • {folder.size}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => alert(`📂 Accessing structured handovers folders for ${folder.term}...`)}
                      className="w-full py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-lg border border-slate-200 inline-flex items-center justify-center gap-1.5"
                    >
                      Browse Folders <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>

      {/* Interdepartmental Submission Modal */}
      {isSubmitOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-6">
            <h2 className="text-base font-bold text-slate-900">Initiate Secretariat Submission</h2>
            <form onSubmit={handleCreateSubmission} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Submission Title</label>
                <input
                  type="text"
                  required
                  value={subTitle}
                  onChange={(e) => setSubTitle(e.target.value)}
                  placeholder="e.g. Q3 Media Publicity Campaign Summary"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#1e40af]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category Class</label>
                  <select
                    value={subCat}
                    onChange={(e) => setSubCat(e.target.value as any)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none"
                  >
                    <option value="Official Reports">Official Reports</option>
                    <option value="Resolutions">Resolutions & Policy</option>
                    <option value="Minutes">Session Minutes</option>
                    <option value="Annual Reports">Annual Audit Reports</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Attached PDF/Sheet Name</label>
                  <input
                    type="text"
                    required
                    value={subFile}
                    onChange={(e) => setSubFile(e.target.value)}
                    placeholder="e.g. q3_publicity_report.pdf"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Document Content Summary</label>
                <textarea
                  value={subSummary}
                  onChange={(e) => setSubSummary(e.target.value)}
                  rows={4}
                  placeholder="Provide brief details on key accomplishments, participant counts, or financial closures..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSubmitOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1e40af] text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-[#1e3a8a]"
                >
                  Post Submission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
