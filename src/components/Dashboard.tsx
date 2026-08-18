import React, { useState } from 'react';
import { 
  Compass, 
  FileText, 
  Settings, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  Check, 
  Award,
  Users,
  Pencil,
  X,
  Lock,
  Unlock,
  ShieldAlert
} from 'lucide-react';
import { NoteItem, NavSection } from '../types';
import { RoverLogo } from './RoverLogo';
import { subscribeToPermissions, updatePageAccess, PagePermissions } from '../services/permissionsService';

export interface CouncilRoleAssignment {
  id: string;
  roleName: string;
  assignedRoverName: string;
  crew: string;
}

const INITIAL_COUNCIL_ROLES: CouncilRoleAssignment[] = [
  { id: 'cr1', roleName: 'Council Secretary', assignedRoverName: 'Mariyam Shazra', crew: 'Delta Crew' },
  { id: 'cr2', roleName: 'Council Treasurer', assignedRoverName: 'Hussain Rameez', crew: 'Bravo Crew' },
  { id: 'cr3', roleName: 'Council Quartermaster', assignedRoverName: 'Ibrahim Nashidh', crew: 'Alpha Crew' },
];

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  'Council Secretary': ['governance', 'events', 'media', 'records'],
  'Council Treasurer': ['finance'],
  'Council Quartermaster': ['progress', 'records'],
  'Secretary': ['governance', 'events', 'media', 'records'],
  'Treasurer': ['finance'],
  'Quartermaster': ['progress', 'records'],
};

import { subscribeToMembers } from '../services/membersService';
import { MemberItem } from '../components/MembersPage';

const INITIAL_ROVER_MEMBERS_LIST = [
  'Ibrahim Nashidh (Alpha Crew)',
  'Mariyam Shazra (Delta Crew)',
  'Hussain Rameez (Bravo Crew)',
  'Fathimath Rayana (Delta Crew)',
  'Mohamed Zayan (Alpha Crew)',
  'Aishath Naha (Bravo Crew)',
  'Aminath Zeesha (Alpha Crew)'
];

interface DashboardProps {
  currentSection: NavSection;
  portalName: string;
  portalTagline: string;
  notes: NoteItem[];
  onUpdatePortalName: (name: string) => void;
  onUpdatePortalTagline: (tagline: string) => void;
  onNavigateTo: (section: NavSection) => void;
  isAdmin: boolean;
  currentUser?: any;
}

export const Dashboard: React.FC<DashboardProps> = ({
  currentSection,
  portalName,
  portalTagline,
  notes,
  onUpdatePortalName,
  onUpdatePortalTagline,
  onNavigateTo,
  isAdmin,
  currentUser,
}) => {
  const [tempPortalName, setTempPortalName] = useState<string>(portalName);
  const [tempPortalTagline, setTempPortalTagline] = useState<string>(portalTagline);
  
  // Members and Permissions for Access Control
  const [allMembers, setAllMembers] = useState<MemberItem[]>([]);
  const [pagePermissionsList, setPagePermissionsList] = useState<PagePermissions[]>([]);

  // Council roles state
  const [roverMembersList, setRoverMembersList] = useState<string[]>(INITIAL_ROVER_MEMBERS_LIST);
  React.useEffect(() => {
    const unsub = subscribeToMembers((members: MemberItem[]) => {
      setAllMembers(members || []);
      if (members && members.length > 0) {
        const list = members.map(m => `${m.name} (${m.crew})`);
        setRoverMembersList(list.length > 0 ? list : INITIAL_ROVER_MEMBERS_LIST);
      }
    }, console.error);
    return () => unsub();
  }, []);

  React.useEffect(() => {
    const unsub = subscribeToPermissions((perms) => {
      setPagePermissionsList(perms || []);
    }, console.error);
    return () => unsub();
  }, []);

  const [councilRoles, setCouncilRoles] = useState<CouncilRoleAssignment[]>(() => {
    try {
      const saved = localStorage.getItem('koshaaru_portal_council_roles_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load council roles', e);
    }
    return INITIAL_COUNCIL_ROLES;
  });

  const [newRoleName, setNewRoleName] = useState('');
  const [newSelectedRover, setNewSelectedRover] = useState('');

  // Edit role modal state
  const [editingRole, setEditingRole] = useState<CouncilRoleAssignment | null>(null);
  const [editRoleName, setEditRoleName] = useState('');
  const [editSelectedRover, setEditSelectedRover] = useState('');
  const [isAddingRole, setIsAddingRole] = useState(false);

  const [combinedSavedSuccess, setCombinedSavedSuccess] = useState<boolean>(false);

  React.useEffect(() => {
    setTempPortalName(portalName);
  }, [portalName]);

  React.useEffect(() => {
    setTempPortalTagline(portalTagline);
  }, [portalTagline]);

  const handleAddCouncilRole = () => {
    if (!newRoleName.trim()) return;
    let roverName = '';
    let crewName = '';

    if (newSelectedRover) {
      const parts = newSelectedRover.split(' (');
      roverName = parts[0];
      crewName = parts[1] ? parts[1].replace(')', '') : '';
    }

    const newItem: CouncilRoleAssignment = {
      id: 'cr_' + Date.now(),
      roleName: newRoleName.trim(),
      assignedRoverName: roverName,
      crew: crewName
    };

    const updated = [...councilRoles, newItem];
    setCouncilRoles(updated);
    try {
      localStorage.setItem('koshaaru_portal_council_roles_v2', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save council roles:', e);
    }
    setNewRoleName('');
    setNewSelectedRover('');
    setIsAddingRole(false);
  };

  const handleOpenEditModal = (role: CouncilRoleAssignment) => {
    setEditingRole(role);
    setEditRoleName(role.roleName);
    if (role.assignedRoverName) {
      // Find matching select option
      const match = roverMembersList.find(r => r.startsWith(role.assignedRoverName));
      setEditSelectedRover(match || '');
    } else {
      setEditSelectedRover('');
    }
  };

  const handleSaveEditedRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRole || !editRoleName.trim()) return;

    let roverName = '';
    let crewName = '';

    if (editSelectedRover) {
      const parts = editSelectedRover.split(' (');
      roverName = parts[0];
      crewName = parts[1] ? parts[1].replace(')', '') : '';
    }

    const updated = councilRoles.map(r => {
      if (r.id === editingRole.id) {
        return {
          ...r,
          roleName: editRoleName.trim(),
          assignedRoverName: roverName,
          crew: crewName
        };
      }
      return r;
    });

    setCouncilRoles(updated);
    try {
      localStorage.setItem('koshaaru_portal_council_roles_v2', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save updated council roles:', e);
    }
    setEditingRole(null);
  };

  // Delete role confirmation modal state
  const [roleToDelete, setRoleToDelete] = useState<CouncilRoleAssignment | null>(null);

  const handleRemoveCouncilRole = (id: string) => {
    const updated = councilRoles.filter(r => r.id !== id);
    setCouncilRoles(updated);
    try {
      localStorage.setItem('koshaaru_portal_council_roles_v2', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save council roles:', e);
    }
    setRoleToDelete(null);
  };

  const handleSaveAllSettings = () => {
    if (tempPortalName.trim()) {
      onUpdatePortalName(tempPortalName.trim());
    }
    if (tempPortalTagline.trim()) {
      onUpdatePortalTagline(tempPortalTagline.trim());
    }
    try {
      localStorage.setItem('koshaaru_portal_council_roles_v2', JSON.stringify(councilRoles));
    } catch (e) {
      console.error('Failed to save council roles:', e);
    }

    setCombinedSavedSuccess(true);
    setTimeout(() => setCombinedSavedSuccess(false), 3500);
  };

  if (currentSection === 'settings') {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold bg-[#800020]/10 text-[#800020] border border-[#800020]/20 mb-2">
                <Settings className="w-3.5 h-3.5" />
                <span>Portal Configuration</span>
              </div>
              <h1 className="text-2xl font-bold text-[#0f1e36]">
                Portal Settings
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Customize general portal settings.
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <h3 className="text-sm font-bold text-[#0f1e36]">
                Portal Name
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Change the main title of this portal. Changes apply instantly across the sidebar, header, and dashboard.
              </p>
            </div>
            <div className="pt-1">
              <input
                id="portal-name-input"
                type="text"
                value={tempPortalName}
                disabled={!isAdmin}
                onChange={(e) => setTempPortalName(e.target.value)}
                placeholder="Enter portal name..."
                className={`w-full text-sm px-4 py-2.5 rounded-xl border transition-all ${
                  isAdmin 
                    ? 'bg-white border-slate-300 text-slate-900 focus:outline-none focus:border-[#1e40af] focus:ring-1 focus:ring-[#1e40af]' 
                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-[#0f1e36]">
                Portal Tagline / Subtitle
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Change the subtitle or tagline displayed below the portal title and in the sidebar.
              </p>
            </div>
            <div className="pt-1">
              <input
                id="portal-tagline-input"
                type="text"
                value={tempPortalTagline}
                disabled={!isAdmin}
                onChange={(e) => setTempPortalTagline(e.target.value)}
                placeholder="Enter portal tagline..."
                className={`w-full text-sm px-4 py-2.5 rounded-xl border transition-all ${
                  isAdmin 
                    ? 'bg-white border-slate-300 text-slate-900 focus:outline-none focus:border-[#1e40af] focus:ring-1 focus:ring-[#1e40af]' 
                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              />
            </div>
          </div>

          <div className="pt-6 flex justify-end items-center border-t border-slate-100">
            {combinedSavedSuccess && (
              <div className="mr-4 text-emerald-600 text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
                <Check className="w-4 h-4" />
                Settings Saved!
              </div>
            )}
            <button
              id="save-all-settings-btn"
              type="button"
              disabled={!isAdmin}
              onClick={handleSaveAllSettings}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isAdmin
                  ? 'bg-[#800020] hover:bg-[#6b1426] text-white shadow-xs' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              Save Portal Settings
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <h2 className="text-xl font-bold text-[#0f1e36] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#800020]" />
                Roles of Council
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Create specific council member roles (e.g. Council Secretary, Treasurer) and assign rover members to each role.
              </p>
            </div>
            {isAdmin && !isAddingRole && (
              <button
                type="button"
                onClick={() => setIsAddingRole(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0f1e36] hover:bg-[#172d4d] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Assign New Council Role
              </button>
            )}
          </div>

          <div className="space-y-2.5">
            {councilRoles.map((role) => (
              <div 
                key={role.id}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#800020]/10 text-[#800020] font-bold text-xs flex items-center justify-center shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#0f1e36]">
                      {role.roleName}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 flex-wrap">
                      <span>Assigned Rover:</span>
                      {role.assignedRoverName ? (
                        <>
                          <strong className="text-slate-800">{role.assignedRoverName}</strong>
                          {role.crew && <span className="text-slate-400">({role.crew})</span>}
                        </>
                      ) : (
                        <span className="inline-flex items-center text-amber-600 font-bold bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded text-[9px]">
                          Unassigned (Assign Later)
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(role)}
                      className="p-1.5 text-slate-400 hover:text-[#1e40af] rounded-lg hover:bg-white transition-colors cursor-pointer"
                      title="Edit Role Assignment"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRoleToDelete(role)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-white transition-colors cursor-pointer"
                      title="Remove Role Assignment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Delete Role Confirmation Modal */}
          {roleToDelete && (
            <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center gap-3 text-red-600">
                  <div className="p-2 rounded-full bg-red-100">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-[#0f1e36]">Remove Role?</h3>
                </div>
                <p className="text-sm text-slate-600">
                  Are you sure you want to remove the role <strong>{roleToDelete.roleName}</strong>? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    onClick={() => setRoleToDelete(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRemoveCouncilRole(roleToDelete.id)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 cursor-pointer"
                  >
                    Yes, Remove
                  </button>
                </div>
              </div>
            </div>
          )}

          {isAdmin && isAddingRole && (
            <div className="bg-slate-50/70 border border-dashed border-slate-300 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
              <h4 className="text-xs font-bold text-slate-700">Assign New Council Role</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Role Title</label>
                  <input
                    type="text"
                    value={newRoleName}
                    onChange={(e) => setNewRoleName(e.target.value)}
                    placeholder="e.g. Gear Master / Event Coordinator"
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Select Rover Member</label>
                  <select
                    value={newSelectedRover}
                    onChange={(e) => setNewSelectedRover(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af]"
                  >
                    <option value="">-- No Member Assigned (Assign Later) --</option>
                    {roverMembersList.map((rover, idx) => (
                      <option key={idx} value={rover}>{rover}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingRole(false)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 mr-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!newRoleName.trim()}
                  onClick={handleAddCouncilRole}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    newRoleName.trim()
                      ? 'bg-[#0f1e36] hover:bg-[#172d4d] text-white shadow-xs'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create & Assign Role
                </button>
              </div>
            </div>
          )}

          {!isAdmin && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-3 rounded-xl font-medium mt-4">
              Note: You are currently in <strong>Member View</strong>. Switch to <strong>Admin Mode</strong> in the top-right to edit portal parameters and assign council roles.
            </p>
          )}
        </div>

        {/* PAGE ACCESS PERMISSIONS CONTROL CARD */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[#0f1e36] flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#800020]" />
              Page Access Control Manager
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              This can be assigned to council member roles, made in Roles of Council.
            </p>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-xl">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-3 font-semibold text-slate-700">Council Role</th>
                  <th className="p-3 font-semibold text-slate-700 text-center">Governance</th>
                  <th className="p-3 font-semibold text-slate-700 text-center">Finance</th>
                  <th className="p-3 font-semibold text-slate-700 text-center">Progress</th>
                  <th className="p-3 font-semibold text-slate-700 text-center">Events</th>
                  <th className="p-3 font-semibold text-slate-700 text-center">Media</th>
                  <th className="p-3 font-semibold text-slate-700 text-center">Records</th>
                </tr>
              </thead>
              <tbody>
                {councilRoles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-slate-400 font-medium">
                      No council roles found. Add some in the Roles of Council section above.
                    </td>
                  </tr>
                ) : (
                  councilRoles.map((role) => {
                    const isMemAdvisor = role.roleName.toLowerCase().includes('advisor');
                    const rolePerm = pagePermissionsList.find(p => p.memberId.toLowerCase() === role.roleName.toLowerCase());
                    const grantedPages = rolePerm 
                      ? rolePerm.grantedPages 
                      : (DEFAULT_ROLE_PERMISSIONS[role.roleName] || []);

                    return (
                      <tr key={role.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 shrink-0">
                          <div className="font-semibold text-slate-900">{role.roleName}</div>
                          <div className="text-[10px] text-slate-500">
                            {role.assignedRoverName ? (
                              <span className="text-emerald-600 font-medium">Assigned: {role.assignedRoverName}</span>
                            ) : (
                              <span className="text-slate-400">Unassigned (Assign Later)</span>
                            )}
                          </div>
                        </td>
                        {['governance', 'finance', 'progress', 'events', 'media', 'records'].map((pageId) => {
                          const hasAccess = isMemAdvisor || grantedPages.includes(pageId);
                          return (
                            <td key={pageId} className="p-3 text-center">
                              {isMemAdvisor ? (
                                <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full text-[9px]" title="Advisor - Unlimited Access">
                                  <Unlock className="w-2.5 h-2.5" />
                                  Full Access
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const nextAccess = !hasAccess;
                                      await updatePageAccess(role.roleName, role.roleName, pageId, nextAccess);
                                    } catch (err) {
                                      console.error('Failed to update page access:', err);
                                    }
                                  }}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-bold cursor-pointer transition-all ${
                                    hasAccess
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100/70'
                                      : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100/70'
                                  }`}
                                >
                                  {hasAccess ? (
                                    <>
                                      <Unlock className="w-3 h-3 text-emerald-600" />
                                      <span>Allowed</span>
                                    </>
                                  ) : (
                                    <>
                                      <Lock className="w-3 h-3 text-slate-400" />
                                      <span>Locked</span>
                                    </>
                                  )}
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {editingRole && (
          <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-[#0f1e36]">
                  Edit Council Role Assignment
                </h3>
                <button
                  onClick={() => setEditingRole(null)}
                  className="text-slate-400 hover:text-slate-600 font-bold cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSaveEditedRole} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role Title</label>
                  <input
                    type="text"
                    required
                    value={editRoleName}
                    onChange={(e) => setEditRoleName(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Rover Member</label>
                  <select
                    value={editSelectedRover}
                    onChange={(e) => setEditSelectedRover(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af] bg-white"
                  >
                    <option value="">-- No Member Assigned (Assign Later) --</option>
                    {roverMembersList.map((rover, idx) => (
                      <option key={idx} value={rover}>{rover}</option>
                    ))}
                  </select>
                </div>
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingRole(null)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#800020] hover:bg-[#6b1426] transition-colors shadow-xs cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Top Banner Card */}
      <div 
        id="portal-welcome-card"
        className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-xs relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#800020] via-[#1e40af] to-[#3b82f6]" />

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 text-[#0f1e36] border border-slate-200 shadow-2xs">
              <RoverLogo variant="color" className="w-4 h-4" />
              <span>Arabiyya Rover Network (ASG ROVERS)</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-[#0f1e36] tracking-tight">
              {portalName}
            </h1>

            <p className="text-sm text-slate-600 max-w-xl">
              {portalTagline}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              id="quick-notebook-btn"
              onClick={() => onNavigateTo('notebook')}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#800020] hover:bg-[#6b1426] text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              <FileText className="w-4 h-4" />
              Open Notebook
            </button>
            {isAdmin && (
              <button
                id="quick-settings-btn"
                onClick={() => onNavigateTo('settings')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
