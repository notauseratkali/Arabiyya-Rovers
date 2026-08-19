import React, { useState, useEffect } from 'react';
import { Shield, Save, RefreshCcw, UserCog, Clock, Globe, Download, Award, MessageSquare, Send, Sparkles, Check, RotateCcw, Upload, Image as ImageIcon, Trash2, Lock, Unlock, Key } from 'lucide-react';
import { RoverLogo } from './RoverLogo';
import { db } from '../firebase';
import { collection, getDocs, doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { DEFAULT_WELCOME_MESSAGE_DRAFT, sendChatMessage } from '../services/chatService';
import { getCachedBrandAssets, subscribeToBrandAssets, updateBrandAsset, processPngFile, BrandAssets } from '../services/brandService';
import { subscribeToPermissions, updatePageAccess, PagePermissions } from '../services/permissionsService';
import { subscribeToCouncilRoles, saveCouncilRole, deleteCouncilRole, CouncilRole } from '../services/councilRolesService';

export interface PortalSettings {
  explorerToRoverAge: number;
  roverToLeaderAge: number;
  portalName: string;
  portalTagline: string;
  welcomeMessageEnabled?: boolean;
  welcomeMessageDraft?: string;
}

export const SettingsPage: React.FC<{ isAdmin: boolean }> = ({ isAdmin }) => {
  const [settings, setSettings] = useState<PortalSettings>({
    explorerToRoverAge: 18,
    roverToLeaderAge: 26,
    portalName: 'Koshaaru Portal',
    portalTagline: 'Arabiyya Beyond Limits',
    welcomeMessageEnabled: true,
    welcomeMessageDraft: DEFAULT_WELCOME_MESSAGE_DRAFT
  });
  const [brandAssets, setBrandAssets] = useState<BrandAssets>(() => getCachedBrandAssets());
  const [uploadingVariant, setUploadingVariant] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [testSentSuccess, setTestSentSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [permissionsList, setPermissionsList] = useState<PagePermissions[]>([]);
  const [membersList, setMembersList] = useState<{ id: string; name: string; role: string; crew: string }[]>([]);
  const [councilRoles, setCouncilRoles] = useState<CouncilRole[]>([]);
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleNameInput, setRoleNameInput] = useState('');
  const [assignedRoverInput, setAssignedRoverInput] = useState('');

  useEffect(() => {
    const unsub = subscribeToBrandAssets((assets) => {
      setBrandAssets(assets);
    });

    const unsubPerms = subscribeToPermissions((perms) => {
      setPermissionsList(perms);
    });

    const unsubCouncil = subscribeToCouncilRoles((roles) => {
      setCouncilRoles(roles);
    });

    const fetchMembers = async () => {
      try {
        const snap = await getDocs(collection(db, 'members'));
        const mArr: { id: string; name: string; role: string; crew: string }[] = [];
        snap.forEach(d => {
          const data = d.data();
          mArr.push({ id: d.id, name: data.name || 'Member', role: data.role || 'Rover', crew: data.crew || 'Alpha Crew' });
        });
        if (mArr.length === 0) {
          mArr.push(
            { id: 'm1', name: 'Zeeshan Ahmed', role: 'Rover', crew: 'Abu Bakr Crew' },
            { id: 'm2', name: 'Sana Ahmed', role: 'Rover Squire', crew: 'Ali Crew' },
            { id: 'm3', name: 'Ibrahim Manik', role: 'Rover', crew: 'Abu Bakr Crew' }
          );
        }
        setMembersList(mArr);
      } catch (e) {
        setMembersList([
          { id: 'm1', name: 'Zeeshan Ahmed', role: 'Rover', crew: 'Abu Bakr Crew' },
          { id: 'm2', name: 'Sana Ahmed', role: 'Rover Squire', crew: 'Ali Crew' },
          { id: 'm3', name: 'Ibrahim Manik', role: 'Rover', crew: 'Abu Bakr Crew' }
        ]);
      }
    };
    fetchMembers();

    return () => {
      unsub();
      unsubPerms();
      unsubCouncil();
    };
  }, []);

  const PAGES_CONFIG = [
    { id: 'governance', name: 'Governance', desc: 'Resolutions & Motions' },
    { id: 'finance', name: 'Finance' , desc: 'Treasury & Budgets'},
    { id: 'progress', name: 'Progress & Training', desc: 'Badges & Squire Orientation' },
    { id: 'events', name: 'Events & Logistics', desc: 'Expeditions & Calendar' },
    { id: 'media', name: 'Media & Assets', desc: 'Photos & Gear Inventory' },
    { id: 'records', name: 'Records Archive', desc: 'Official Documents & Logs' },
  ];

  const handleOpenAddRole = () => {
    setEditingRoleId(null);
    setRoleNameInput('');
    setAssignedRoverInput('');
    setIsAddRoleModalOpen(true);
  };

  const handleEditRole = (role: CouncilRole) => {
    setEditingRoleId(role.id);
    setRoleNameInput(role.roleName);
    if (role.assignedRoverName) {
      const match = membersList.find(m => m.name === role.assignedRoverName);
      if (match) {
        setAssignedRoverInput(`${match.name} (${match.crew})`);
      } else {
        setAssignedRoverInput(role.assignedRoverName + (role.crew ? ` (${role.crew})` : ''));
      }
    } else {
      setAssignedRoverInput('');
    }
    setIsAddRoleModalOpen(true);
  };

  const handleSaveRoleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleNameInput.trim()) return;

    let roverName = '';
    let crewName = '';
    if (assignedRoverInput) {
      const parts = assignedRoverInput.split(' (');
      roverName = parts[0];
      crewName = parts[1] ? parts[1].replace(')', '') : '';
    }

    try {
      await saveCouncilRole({
        id: editingRoleId || ('cr_' + Date.now().toString()),
        roleName: roleNameInput.trim(),
        assignedRoverName: roverName,
        crew: crewName
      });
      setIsAddRoleModalOpen(false);
      setRoleNameInput('');
      setAssignedRoverInput('');
    } catch (err) {
      alert('Failed to save Council Member Role.');
    }
  };

  const handleDeleteRoleSubmit = async (id: string, roleName: string) => {
    if (!confirm(`Are you sure you want to delete the council role "${roleName}"?`)) return;
    try {
      await deleteCouncilRole(id);
      alert('Council role deleted successfully.');
    } catch (err) {
      alert('Failed to delete role.');
    }
  };

  const handleTogglePageAccess = async (memberId: string, memberName: string, pageId: string, currentAccess: boolean) => {
    try {
      await updatePageAccess(memberId, memberName, pageId, !currentAccess);
    } catch (e) {
      alert('Failed to update page access permission.');
    }
  };

  const handleGrantAllCouncil = async () => {
    try {
      for (const m of membersList) {
        const isCouncilOrLeader = m.role?.toLowerCase().includes('council') || 
                                  m.role?.toLowerCase().includes('secretary') || 
                                  m.role?.toLowerCase().includes('treasurer') || 
                                  m.role?.toLowerCase().includes('quartermaster') || 
                                  m.role?.toLowerCase().includes('advisor') || 
                                  m.role?.toLowerCase().includes('chairperson') || 
                                  m.role?.toLowerCase().includes('admin') || 
                                  m.role?.toLowerCase().includes('leader');
        if (isCouncilOrLeader) {
          const docRef = doc(db, 'page_permissions', m.id);
          await setDoc(docRef, {
            memberName: m.name,
            grantedPages: ['governance', 'finance', 'progress', 'events', 'media', 'records'],
            updatedAt: new Date().toISOString()
          }, { merge: true });
        }
      }
      alert('All council and leader member roles have been granted full portal page permissions successfully.');
    } catch (e) {
      alert('Failed to grant council permissions.');
    }
  };

  const handleLogoUpload = async (variant: 'colorLogoPng' | 'whiteLogoPng' | 'blackLogoPng', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes('png') && !file.name?.toLowerCase().endsWith('.png')) {
      alert('Only PNG image files (.png) are supported for logo uploads.');
      e.target.value = '';
      return;
    }

    setUploadingVariant(variant);
    try {
      const pngDataUrl = await processPngFile(file);
      await updateBrandAsset(variant, pngDataUrl);
      alert('Official PNG logo uploaded and updated successfully across portal & favicon!');
    } catch (err: any) {
      console.error('Logo upload error:', err);
      alert(err.message || 'Failed to process and upload PNG logo.');
    } finally {
      setUploadingVariant(null);
      e.target.value = '';
    }
  };

  const handleResetLogo = async (variant: 'colorLogoPng' | 'whiteLogoPng' | 'blackLogoPng') => {
    if (!confirm('Are you sure you want to remove the custom PNG and revert to the default vector emblem?')) return;
    try {
      await updateBrandAsset(variant, null);
      alert('Logo reverted to default vector emblem.');
    } catch (err) {
      console.error('Failed to reset logo:', err);
      alert('Failed to reset logo.');
    }
  };

  useEffect(() => {
    const docRef = doc(db, 'system', 'portal_settings');
    const unsub = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettings({
          explorerToRoverAge: data.explorerToRoverAge ?? 18,
          roverToLeaderAge: data.roverToLeaderAge ?? 26,
          portalName: data.portalName || 'Koshaaru Portal',
          portalTagline: data.portalTagline || 'Arabiyya Beyond Limits',
          welcomeMessageEnabled: data.welcomeMessageEnabled ?? true,
          welcomeMessageDraft: data.welcomeMessageDraft || DEFAULT_WELCOME_MESSAGE_DRAFT
        });
      }
      setLoading(false);
    }, (err) => {
      console.error('Error fetching settings:', err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await setDoc(doc(db, 'system', 'portal_settings'), settings, { merge: true });
      // Also update local storage for App.tsx to pickup immediately if needed
      localStorage.setItem('koshaaru_portal_name_v1', settings.portalName);
      localStorage.setItem('koshaaru_portal_tagline_v1', settings.portalTagline);
      alert('Settings & Welcome Message Draft saved successfully!');
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleInsertToken = (token: string) => {
    const current = settings.welcomeMessageDraft || '';
    setSettings({
      ...settings,
      welcomeMessageDraft: current + ' ' + token
    });
  };

  const handleResetDraft = () => {
    setSettings({
      ...settings,
      welcomeMessageDraft: DEFAULT_WELCOME_MESSAGE_DRAFT
    });
  };

  const handleSendTestWelcomeMessage = async () => {
    setTestSending(true);
    setTestSentSuccess(false);
    try {
      const sampleMember = {
        name: 'Ahmed Shiyan (Test Member)',
        username: '@shiyan',
        crew: 'Alpha Crew',
        role: 'Rover Scout',
        badgeRank: 'Explorer'
      };

      const template = settings.welcomeMessageDraft || DEFAULT_WELCOME_MESSAGE_DRAFT;
      const formatted = template
        .replace(/{name}/g, sampleMember.name)
        .replace(/{username}/g, sampleMember.username)
        .replace(/{crew}/g, sampleMember.crew)
        .replace(/{role}/g, sampleMember.role)
        .replace(/{section}/g, sampleMember.role)
        .replace(/{badgeRank}/g, sampleMember.badgeRank)
        .replace(/{idCard}/g, 'A123456');

      await sendChatMessage({
        senderId: 'admin_nazih',
        senderName: 'Administrator',
        senderRole: 'Administrator',
        senderCrew: 'Council HQ',
        senderBadge: 'Administrator',
        text: `[Sample Test] ${formatted}`,
        type: 'text',
        createdAt: new Date().toISOString()
      });

      setTestSentSuccess(true);
      setTimeout(() => setTestSentSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to send test welcome message:', err);
      alert('Failed to send test welcome message to chat.');
    } finally {
      setTestSending(false);
    }
  };

  const previewText = (settings.welcomeMessageDraft || DEFAULT_WELCOME_MESSAGE_DRAFT)
    .replace(/{name}/g, 'Ahmed Shiyan')
    .replace(/{username}/g, '@shiyan')
    .replace(/{crew}/g, 'Alpha Crew')
    .replace(/{role}/g, 'Rover Scout')
    .replace(/{section}/g, 'Rover Scout')
    .replace(/{badgeRank}/g, 'Explorer')
    .replace(/{idCard}/g, 'A123456');

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f1e36]">Portal Settings</h1>
          <p className="text-sm text-slate-500 mt-1">Configure global portal behavior and branding</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !isAdmin}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#1e40af] hover:bg-[#1e3a8a] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Branding Settings */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <Globe className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-slate-800">Branding & Identity</h2>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Portal Name</label>
              <input
                type="text"
                value={settings.portalName}
                onChange={(e) => setSettings({ ...settings, portalName: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Portal Tagline</label>
              <input
                type="text"
                value={settings.portalTagline}
                onChange={(e) => setSettings({ ...settings, portalTagline: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm font-medium"
              />
            </div>
          </div>
        </div>

        {/* Age Threshold Settings */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600" />
            <h2 className="font-bold text-slate-800">Age Transitions</h2>
          </div>
          <div className="p-6 space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Explorer to Rover Age</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={settings.explorerToRoverAge}
                  onChange={(e) => setSettings({ ...settings, explorerToRoverAge: parseInt(e.target.value) || 18 })}
                  className="w-24 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm font-bold text-center"
                />
                <span className="text-sm text-slate-500 font-medium">years old</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wider">Rover to Leaders Age</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={settings.roverToLeaderAge}
                  onChange={(e) => setSettings({ ...settings, roverToLeaderAge: parseInt(e.target.value) || 26 })}
                  className="w-24 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm font-bold text-center"
                />
                <span className="text-sm text-slate-500 font-medium">years old</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Automated First-Login Welcome Message Configuration */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-800">New Member First-Login Welcome Message</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-100 text-purple-700">
                  Automated Chat Broadcast
                </span>
              </div>
              <p className="text-xs text-slate-500">
                When a new member is added and logs in for the first time, the Administrator automatically welcomes them in Members Chat.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.welcomeMessageEnabled}
                onChange={(e) => setSettings({ ...settings, welcomeMessageEnabled: e.target.checked })}
                disabled={!isAdmin}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#800020]"></div>
              <span className="ml-2 text-xs font-bold text-slate-700">
                {settings.welcomeMessageEnabled ? 'Active' : 'Disabled'}
              </span>
            </label>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Draft text input & tag chips */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Administrator Welcome Message Draft
              </label>
              <button
                type="button"
                onClick={handleResetDraft}
                disabled={!isAdmin}
                className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-medium transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Default Template</span>
              </button>
            </div>

            <textarea
              rows={4}
              value={settings.welcomeMessageDraft}
              onChange={(e) => setSettings({ ...settings, welcomeMessageDraft: e.target.value })}
              disabled={!isAdmin}
              placeholder="Enter welcome message template..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all text-sm font-medium text-slate-800"
            />

            {/* Dynamic Token Badges */}
            <div>
              <div className="text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Click a placeholder to insert dynamic member token into draft:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { tag: '{name}', label: "Member Name (e.g. Ahmed Shiyan)" },
                  { tag: '{username}', label: "Username (e.g. @shiyan)" },
                  { tag: '{crew}', label: "Assigned Crew (e.g. Alpha Crew)" },
                  { tag: '{role}', label: "Member Role (e.g. Rover Scout)" },
                  { tag: '{badgeRank}', label: "Badge Rank (e.g. Explorer)" },
                  { tag: '{idCard}', label: "ID Card (e.g. A123456)" }
                ].map((token) => (
                  <button
                    key={token.tag}
                    type="button"
                    onClick={() => handleInsertToken(token.tag)}
                    disabled={!isAdmin}
                    title={token.label}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors"
                  >
                    {token.tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Chat Message Preview */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>Live Chat Preview</span>
                <span className="text-[10px] text-slate-400 font-normal normal-case">(How it appears in Members Chat)</span>
              </span>
              <button
                type="button"
                onClick={handleSendTestWelcomeMessage}
                disabled={testSending || !isAdmin}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#0f1e36] text-white hover:bg-slate-800 transition-all shadow-xs disabled:opacity-50"
              >
                {testSending ? (
                  <RefreshCcw className="w-3.5 h-3.5 animate-spin" />
                ) : testSentSuccess ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{testSentSuccess ? 'Test Sent to Chat!' : 'Send Test Welcome to Chat'}</span>
              </button>
            </div>

            {/* Simulated Chat Bubble */}
            <div className="bg-[#eef2f6] p-4 rounded-xl border border-slate-200/80">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#800020] to-[#1e40af] text-white flex items-center justify-center font-bold text-xs shrink-0 border border-white/40 shadow-xs">
                  NN
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-bold text-[#0f1e36]">Administrator</span>
                    <span className="text-[10px] text-slate-400">Just now</span>
                  </div>
                  <div className="bg-white p-3 rounded-2xl rounded-tl-xs shadow-xs border border-slate-200/90 text-sm text-slate-800 leading-relaxed break-words whitespace-pre-wrap">
                    {previewText}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-800">Arabiyya Rovers (ASG ROVERS) Official Logos</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                  PNG Upload Supported
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Arabiyya Rovers is part of Arabiyya Scout Group (11th Male' Scout Group). Official emblems used across the portal & browser favicon.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg self-start sm:self-auto">
            Active Site Emblems
          </span>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Color Logo */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col items-center text-center space-y-4">
            <div className="relative group">
              <div className="w-28 h-28 bg-white rounded-2xl shadow-sm border border-slate-200 p-2.5 flex items-center justify-center overflow-hidden">
                <RoverLogo variant="color" className="w-24 h-24" forceSvg={!brandAssets.colorLogoPng} />
              </div>
              {brandAssets.colorLogoPng && (
                <span className="absolute -top-2 -right-2 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                  Custom PNG
                </span>
              )}
            </div>

            <div>
              <div className="text-xs font-bold text-slate-800">Full Color Emblem</div>
              <div className="text-[10px] text-slate-500">Primary site logo & favicon (.png only)</div>
            </div>

            <div className="w-full space-y-2">
              <label className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-[#0f1e36] text-white hover:bg-slate-800 transition-all shadow-xs cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingVariant === 'colorLogoPng' ? 'Uploading...' : brandAssets.colorLogoPng ? 'Change PNG Logo' : 'Upload PNG Logo'}</span>
                <input
                  type="file"
                  accept="image/png,.png"
                  onChange={(e) => handleLogoUpload('colorLogoPng', e)}
                  disabled={!isAdmin || uploadingVariant !== null}
                  className="sr-only"
                />
              </label>

              {brandAssets.colorLogoPng && (
                <button
                  type="button"
                  onClick={() => handleResetLogo('colorLogoPng')}
                  disabled={!isAdmin}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Revert to Default SVG</span>
                </button>
              )}

              <a
                href="/rover-logo-color.svg"
                download="asg-rovers-color.svg"
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
              >
                <Download className="w-3 h-3" /> Download Default SVG
              </a>
            </div>
          </div>

          {/* White Logo (Dark Background) */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-[#0f1e36] flex flex-col items-center text-center space-y-4">
            <div className="relative group">
              <div className="w-28 h-28 bg-slate-900/90 rounded-2xl shadow-inner border border-slate-700 p-2.5 flex items-center justify-center overflow-hidden">
                <RoverLogo variant="white" className="w-24 h-24" forceSvg={!brandAssets.whiteLogoPng} />
              </div>
              {brandAssets.whiteLogoPng && (
                <span className="absolute -top-2 -right-2 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                  Custom PNG
                </span>
              )}
            </div>

            <div>
              <div className="text-xs font-bold text-white">White Monochromatic</div>
              <div className="text-[10px] text-slate-300">For dark backgrounds (.png only)</div>
            </div>

            <div className="w-full space-y-2">
              <label className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-white text-slate-900 hover:bg-slate-100 transition-all shadow-xs cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-[#800020]" />
                <span>{uploadingVariant === 'whiteLogoPng' ? 'Uploading...' : brandAssets.whiteLogoPng ? 'Change PNG Logo' : 'Upload PNG Logo'}</span>
                <input
                  type="file"
                  accept="image/png,.png"
                  onChange={(e) => handleLogoUpload('whiteLogoPng', e)}
                  disabled={!isAdmin || uploadingVariant !== null}
                  className="sr-only"
                />
              </label>

              {brandAssets.whiteLogoPng && (
                <button
                  type="button"
                  onClick={() => handleResetLogo('whiteLogoPng')}
                  disabled={!isAdmin}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-950/60 border border-rose-800 text-rose-300 hover:bg-rose-900/60 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Revert to Default SVG</span>
                </button>
              )}

              <a
                href="/rover-logo-white.svg"
                download="asg-rovers-white.svg"
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 border border-slate-700 hover:bg-slate-700 text-white transition-colors"
              >
                <Download className="w-3 h-3" /> Download Default SVG
              </a>
            </div>
          </div>

          {/* Black Logo */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 flex flex-col items-center text-center space-y-4">
            <div className="relative group">
              <div className="w-28 h-28 bg-white rounded-2xl shadow-sm border border-slate-200 p-2.5 flex items-center justify-center overflow-hidden">
                <RoverLogo variant="black" className="w-24 h-24" forceSvg={!brandAssets.blackLogoPng} />
              </div>
              {brandAssets.blackLogoPng && (
                <span className="absolute -top-2 -right-2 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                  Custom PNG
                </span>
              )}
            </div>

            <div>
              <div className="text-xs font-bold text-slate-800">Black Monochromatic</div>
              <div className="text-[10px] text-slate-500">For print documents (.png only)</div>
            </div>

            <div className="w-full space-y-2">
              <label className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-[#0f1e36] text-white hover:bg-slate-800 transition-all shadow-xs cursor-pointer">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploadingVariant === 'blackLogoPng' ? 'Uploading...' : brandAssets.blackLogoPng ? 'Change PNG Logo' : 'Upload PNG Logo'}</span>
                <input
                  type="file"
                  accept="image/png,.png"
                  onChange={(e) => handleLogoUpload('blackLogoPng', e)}
                  disabled={!isAdmin || uploadingVariant !== null}
                  className="sr-only"
                />
              </label>

              {brandAssets.blackLogoPng && (
                <button
                  type="button"
                  onClick={() => handleResetLogo('blackLogoPng')}
                  disabled={!isAdmin}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Revert to Default SVG</span>
                </button>
              )}

              <a
                href="/rover-logo-black.svg"
                download="asg-rovers-black.svg"
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
              >
                <Download className="w-3 h-3" /> Download Default SVG
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Security & Access */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
          <Shield className="w-5 h-5 text-emerald-600" />
          <h2 className="font-bold text-slate-800">Security & Access Control</h2>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800">Admin Mode Access</h3>
              <p className="text-xs text-slate-500">Only authorized members can switch to administrative view.</p>
            </div>
            <div className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold uppercase tracking-wider">
              System Active
            </div>
          </div>
        </div>
      </div>

      {/* Council Member Roles Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center shrink-0">
              <UserCog className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-800">Council Member Roles</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-100 text-purple-800">
                  Made by Advisor or Admin
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Define and manage specialized Council Member Roles. These roles determine portal page accessibility for members holding them.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenAddRole}
            disabled={!isAdmin}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
          >
            + Create Council Role
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {councilRoles.map(role => (
            <div key={role.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h4 className="font-bold text-[#0f1e36] text-sm">{role.roleName}</h4>
                  {role.assignedRoverName ? (
                    <div className="text-xs font-semibold text-purple-700 flex items-center gap-1 mt-0.5">
                      <span>{role.assignedRoverName}</span>
                      {role.crew && <span className="text-slate-400 font-normal">({role.crew})</span>}
                    </div>
                  ) : (
                    <div className="text-[11px] text-amber-600 italic mt-0.5">Unassigned Seat</div>
                  )}
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEditRole(role)}
                      className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRoleSubmit(role.id, role.roleName)}
                      className="px-2.5 py-1 text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add / Edit Council Role Modal */}
      {isAddRoleModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <h3 className="font-bold text-slate-800 text-base">
              {editingRoleId ? 'Edit Council Member Role' : 'Create Council Member Role'}
            </h3>
            <p className="text-xs text-slate-500">
              Only Administrators and Rover Advisors can create or configure Council Member Roles.
            </p>

            <form onSubmit={handleSaveRoleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role Title</label>
                <input
                  type="text"
                  required
                  list="organogram-role-presets"
                  value={roleNameInput}
                  onChange={(e) => setRoleNameInput(e.target.value)}
                  placeholder="e.g. Council Secretary"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
                <datalist id="organogram-role-presets">
                  <option value="Rover Advisor" />
                  <option value="Chairperson" />
                  <option value="Vice Chairperson" />
                  <option value="Council Secretary" />
                  <option value="Council Treasurer" />
                  <option value="Council Quartermaster" />
                  <option value="Progress Coordinator" />
                  <option value="Event Coordinator" />
                  <option value="Media Coordinator" />
                  <option value="Policy Committee Member" />
                  <option value="Media & PR Committee Member" />
                  <option value="Advisor to Chairperson" />
                </datalist>
                <div className="flex flex-wrap gap-1 mt-2">
                  {['Chairperson', 'Vice Chairperson', 'Council Secretary', 'Council Treasurer', 'Council Quartermaster', 'Progress Coordinator', 'Event Coordinator', 'Media Coordinator'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setRoleNameInput(p)}
                      className="px-2 py-0.5 rounded-md bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-[10px] font-medium transition-colors cursor-pointer"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assign Rover Scout Member (Optional)</label>
                <select
                  value={assignedRoverInput}
                  onChange={(e) => setAssignedRoverInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-slate-800 font-medium"
                >
                  <option value="">-- No Member Assigned (Unassigned) --</option>
                  {membersList.map((m) => {
                    const val = `${m.name} (${m.crew})`;
                    return (
                      <option key={m.id} value={val}>
                        {m.name} - {m.crew}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddRoleModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors shadow-xs"
                >
                  Save Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions & Page Access Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-slate-800">Page Permissions & Dashboard Access</h2>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                  Admin / Advisor / Chairperson
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Manage which council roles have access to view specific portal pages in their dashboard. Access is granted by Admin, Rover Advisor, or Chairperson.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={handleGrantAllCouncil}
              disabled={!isAdmin}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              Grant All Role Access
            </button>
            <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
              {councilRoles.length} Roles Managed
            </span>
          </div>
        </div>

        <div className="p-6 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-700">
                <th className="p-3 font-bold uppercase tracking-wider w-48">Council Member Role</th>
                {PAGES_CONFIG.map(page => (
                  <th key={page.id} className="p-3 font-bold text-center uppercase tracking-wider">
                    <div>{page.name}</div>
                    <div className="text-[10px] text-slate-400 font-normal normal-case">{page.desc}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {councilRoles.map(role => {
                const rolePerms = permissionsList.find(p => p.memberId === role.id || p.memberName?.toLowerCase() === role.roleName?.toLowerCase());
                const grantedPages = rolePerms ? rolePerms.grantedPages : ['governance', 'finance', 'progress', 'events', 'media', 'records'];

                return (
                  <tr key={role.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-3 align-middle">
                      <div className="font-bold text-[#0f1e36]">{role.roleName}</div>
                      <div className="text-[11px] text-slate-500">{role.description || 'Council Role'}</div>
                    </td>
                    {PAGES_CONFIG.map(page => {
                      const hasAccess = grantedPages.includes(page.id);
                      return (
                        <td key={page.id} className="p-3 text-center align-middle">
                          <button
                            type="button"
                            onClick={() => handleTogglePageAccess(role.id, role.roleName, page.id, hasAccess)}
                            disabled={!isAdmin}
                            title={isAdmin ? 'Click to toggle access' : 'Only Admin, Advisor, or Chairperson can modify permissions'}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all cursor-pointer shadow-2xs ${
                              hasAccess 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100' 
                                : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                            }`}
                          >
                            {hasAccess ? (
                              <>
                                <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Allowed</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5 text-slate-400" />
                                <span>Restricted</span>
                              </>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!isAdmin && (
            <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-xl mt-4">
              ℹ️ Note: You are currently viewing in standard member mode. Switch to Administrator mode to grant or revoke page permissions.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
