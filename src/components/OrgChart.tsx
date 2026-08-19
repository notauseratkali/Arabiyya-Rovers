import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  ChevronRight, 
  ArrowDown, 
  ArrowRight, 
  Info, 
  Search, 
  ShieldCheck, 
  Network, 
  Layers, 
  UserCheck, 
  X, 
  ExternalLink, 
  Crown, 
  Mail, 
  Phone,
  Plus,
  Edit3,
  Trash2,
  UserPlus,
  UserMinus,
  Check,
  RotateCcw,
  Sparkles,
  Users,
  Settings2,
  AlertTriangle
} from 'lucide-react';
import { subscribeToMembers, subscribeToLeaders } from '../services/membersService';
import { 
  OrgNode, 
  AssignedPerson,
  COLOR_THEMES, 
  INITIAL_ORG_NODES,
  subscribeToGovernanceNodes, 
  saveGovernanceNode, 
  deleteGovernanceNode, 
  assignPersonToNode, 
  removePersonFromNode, 
  resetGovernanceNodesToDefault 
} from '../services/governanceService';

const OrgPeopleContext = createContext<{ members: any[]; leaders: any[]; nodesMap: Record<string, OrgNode> }>({ 
  members: [], 
  leaders: [],
  nodesMap: {}
});

interface OrgChartProps {
  isAdmin?: boolean;
  currentUser?: any;
}

export const OrgChart: React.FC<OrgChartProps> = ({ isAdmin = true, currentUser }) => {
  const [members, setMembers] = useState<any[]>([]);
  const [leaders, setLeaders] = useState<any[]>([]);
  const [nodesMap, setNodesMap] = useState<Record<string, OrgNode>>(INITIAL_ORG_NODES);
  const [selectedNode, setSelectedNode] = useState<OrgNode | null>(null);
  const [selectedWingFilter, setSelectedWingFilter] = useState<'All' | 'ARC Rover Wing' | 'Committees & Advisory'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'visual' | 'list'>('visual');

  // Modals state
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<OrgNode | null>(null);
  const [nodeToDelete, setNodeToDelete] = useState<OrgNode | null>(null);
  const [assigningNode, setAssigningNode] = useState<OrgNode | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Form State for Add / Edit
  const [formTitle, setFormTitle] = useState('');
  const [formWing, setFormWing] = useState<'ARC Rover Wing' | 'Committees & Advisory'>('ARC Rover Wing');
  const [formCategory, setFormCategory] = useState<OrgNode['category']>('executive');
  const [formDescription, setFormDescription] = useState('');
  const [formElectionMethod, setFormElectionMethod] = useState('Council Elected');
  const [formColorTheme, setFormColorTheme] = useState<string>('blue_exec');
  const [formReportsTo, setFormReportsTo] = useState<string[]>([]);
  const [formSupervises, setFormSupervises] = useState<string[]>([]);
  const [formCoordinatesWith, setFormCoordinatesWith] = useState<string[]>([]);

  // Assign Member Picker state
  const [selectedPersonToAssign, setSelectedPersonToAssign] = useState<string>('');

  useEffect(() => {
    const unsubMembers = subscribeToMembers(setMembers, console.error);
    const unsubLeaders = subscribeToLeaders(setLeaders, console.error);
    const unsubGovernance = subscribeToGovernanceNodes(
      (nodes) => {
        setNodesMap(nodes);
        // Keep selectedNode in sync if open
        if (selectedNode && nodes[selectedNode.id]) {
          setSelectedNode(nodes[selectedNode.id]);
        }
      },
      console.error
    );

    return () => {
      unsubMembers();
      unsubLeaders();
      unsubGovernance();
    };
  }, [selectedNode]);

  const showToast = (msg: string) => {
    setActionSuccessMsg(msg);
    setTimeout(() => {
      setActionSuccessMsg(null);
    }, 4000);
  };

  const getAssignedPeopleForNode = (node: OrgNode): AssignedPerson[] => {
    // 1. Explicitly assigned people from node record
    if (node.assignedPeople && node.assignedPeople.length > 0) {
      return node.assignedPeople;
    }

    // 2. Dynamic directory matching fallback
    const matched: AssignedPerson[] = [];
    const nodeId = node.id;

    // Match leaders
    leaders.forEach(l => {
      const title = (l.title || '').toLowerCase();
      let isMatch = false;
      
      if (nodeId === 'rover_advisor' && (title.includes('rover advisor') || (title.includes('advisor') && !title.includes('chairperson')))) {
        isMatch = true;
      } else if (nodeId === 'chairperson' && (title === 'chairperson' || title === 'chair')) {
        isMatch = true;
      } else if (nodeId === 'vice_chairperson' && (title.includes('vice chairperson') || title.includes('vice chair'))) {
        isMatch = true;
      } else if (nodeId === 'advisor_to_chairperson' && title.includes('advisor to chairperson')) {
        isMatch = true;
      }

      if (isMatch) {
        matched.push({
          id: l.id || 'ldr_' + l.name,
          name: l.name,
          username: l.username,
          role: l.title || 'Leader',
          email: l.email || '',
          phone: l.phone || '',
          type: 'leader'
        });
      }
    });

    // Match members
    members.forEach(m => {
      const role = (m.role || '').toLowerCase();
      let isMatch = false;

      if (nodeId === 'chairperson' && (role === 'chairperson' || role === 'chair')) {
        isMatch = true;
      } else if (nodeId === 'vice_chairperson' && (role.includes('vice chairperson') || role.includes('vice chair'))) {
        isMatch = true;
      } else if (nodeId === 'secretary' && (role === 'secretary' || role === 'council secretary' || role === 'arc secretary' || role === 'honorary secretary')) {
        isMatch = true;
      } else if (nodeId === 'treasurer' && (role === 'treasurer' || role === 'council treasurer' || role === 'arc treasurer')) {
        isMatch = true;
      } else if (nodeId === 'quartermaster' && (role.includes('quartermaster') || role.includes('gear'))) {
        isMatch = true;
      } else if (nodeId === 'progress_coordinator' && role.includes('progress coordinator')) {
        isMatch = true;
      } else if (nodeId === 'event_coordinator' && role.includes('event coordinator')) {
        isMatch = true;
      } else if (nodeId === 'media_coordinator' && role.includes('media coordinator')) {
        isMatch = true;
      } else if (nodeId === 'policy_committee' && role.includes('policy')) {
        isMatch = true;
      } else if (nodeId === 'media_pr_committee' && (role.includes('media & pr') || role.includes('media and pr') || role.includes('pr committee'))) {
        isMatch = true;
      } else if (nodeId === 'advisor_to_chairperson' && role.includes('advisor to chairperson')) {
        isMatch = true;
      } else if (m.role && m.role.toLowerCase() === node.title.toLowerCase()) {
        isMatch = true;
      }

      if (isMatch) {
        matched.push({
          id: m.id || 'mbr_' + m.name,
          name: m.name,
          username: m.username,
          role: m.role || 'Member',
          crew: m.crew || 'Alpha Crew',
          email: m.email || '',
          phone: m.phone || '',
          type: 'member'
        });
      }
    });

    return matched;
  };

  // Open Create Modal
  const handleOpenAddModal = () => {
    setFormTitle('');
    setFormWing('ARC Rover Wing');
    setFormCategory('executive');
    setFormDescription('');
    setFormElectionMethod('Council Elected');
    setFormColorTheme('sky_coord');
    setFormReportsTo(['chairperson', 'vice_chairperson']);
    setFormSupervises([]);
    setFormCoordinatesWith([]);
    setIsAddRoleModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (node: OrgNode) => {
    setEditingNode(node);
    setFormTitle(node.title);
    setFormWing(node.wing);
    setFormCategory(node.category);
    setFormDescription(node.description || '');
    setFormElectionMethod(node.electionMethod || 'Council Elected');
    
    // Find matching theme
    const matchedTheme = Object.keys(COLOR_THEMES).find(k => COLOR_THEMES[k].bgClass === node.bgClass) || 'blue_exec';
    setFormColorTheme(matchedTheme);
    
    setFormReportsTo(node.reportsTo || []);
    setFormSupervises(node.supervises || []);
    setFormCoordinatesWith(node.coordinatesWith || []);
  };

  // Save New or Edited Role
  const handleSaveRoleForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const theme = COLOR_THEMES[formColorTheme] || COLOR_THEMES.blue_exec;
    const isEditing = Boolean(editingNode);
    const nodeId = isEditing && editingNode ? editingNode.id : 'role_' + formTitle.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString().slice(-4);

    const nodeData: OrgNode = {
      id: nodeId,
      title: formTitle.trim(),
      wing: formWing,
      category: formCategory,
      description: formDescription.trim() || 'Official position within ARC Rover Governance & Council structure.',
      electionMethod: formElectionMethod.trim() || 'Appointed',
      bgClass: theme.bgClass,
      borderClass: theme.borderClass,
      textClass: theme.textClass,
      badgeClass: theme.badgeClass,
      reportsTo: formReportsTo,
      supervises: formSupervises,
      coordinatesWith: formCoordinatesWith,
      assignedPeople: isEditing && editingNode?.assignedPeople ? editingNode.assignedPeople : [],
      isCustom: true
    };

    await saveGovernanceNode(nodeData);
    setIsAddRoleModalOpen(false);
    setEditingNode(null);
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode(nodeData);
    }
    showToast(`Role "${formTitle}" successfully ${isEditing ? 'updated' : 'created'}!`);
  };

  // Delete Role
  const handleConfirmDeleteRole = async () => {
    if (!nodeToDelete) return;
    const deletedTitle = nodeToDelete.title;
    await deleteGovernanceNode(nodeToDelete.id);
    if (selectedNode?.id === nodeToDelete.id) {
      setSelectedNode(null);
    }
    setNodeToDelete(null);
    showToast(`Role "${deletedTitle}" removed from governance tree.`);
  };

  // Handle Assigning Member
  const handleAssignPersonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningNode || !selectedPersonToAssign) return;

    let personObj: AssignedPerson | null = null;
    
    // Check members
    const foundMember = members.find(m => m.id === selectedPersonToAssign);
    if (foundMember) {
      personObj = {
        id: foundMember.id,
        name: foundMember.name,
        username: foundMember.username,
        role: assigningNode.title,
        crew: foundMember.crew,
        email: foundMember.email,
        phone: foundMember.phone,
        type: 'member'
      };
    } else {
      const foundLeader = leaders.find(l => l.id === selectedPersonToAssign);
      if (foundLeader) {
        personObj = {
          id: foundLeader.id,
          name: foundLeader.name,
          username: foundLeader.username,
          role: assigningNode.title,
          email: foundLeader.email,
          phone: foundLeader.phone,
          type: 'leader'
        };
      }
    }

    if (personObj) {
      await assignPersonToNode(assigningNode.id, personObj);
      showToast(`${personObj.name} assigned to "${assigningNode.title}"!`);
      setSelectedPersonToAssign('');
    }
  };

  // Remove person from role
  const handleRemovePerson = async (nodeId: string, personId: string, personName: string) => {
    await removePersonFromNode(nodeId, personId);
    showToast(`${personName} removed from role.`);
  };

  // Handle Reset to Defaults
  const handleResetToDefaults = async () => {
    await resetGovernanceNodesToDefault();
    setIsResetConfirmOpen(false);
    setSelectedNode(null);
    showToast('Governance organogram reset to official charter baseline.');
  };

  const allNodeKeys = Object.keys(nodesMap);
  const filteredNodeKeys = allNodeKeys.filter((key) => {
    const node = nodesMap[key];
    if (!node) return false;
    const matchesWing = selectedWingFilter === 'All' || node.wing === selectedWingFilter;
    const matchesQuery = !searchQuery.trim() || 
      node.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesWing && matchesQuery;
  });

  // Group nodes for visual hierarchy
  const supervisoryNodes = Object.values(nodesMap).filter(n => n.category === 'supervisory');
  const forumNodes = Object.values(nodesMap).filter(n => n.category === 'forum');
  const councilNodes = Object.values(nodesMap).filter(n => n.category === 'council');
  const chairNodes = Object.values(nodesMap).filter(n => n.category === 'chairperson');
  const committeeNodes = Object.values(nodesMap).filter(n => n.category === 'committee' || n.category === 'advisory');
  const executiveNodes = Object.values(nodesMap).filter(n => n.category === 'executive' && n.id !== 'vice_chairperson');
  const otherCustomNodes = Object.values(nodesMap).filter(n => 
    !['supervisory', 'forum', 'council', 'chairperson', 'committee', 'advisory', 'executive'].includes(n.category)
  );

  return (
    <OrgPeopleContext.Provider value={{ members, leaders, nodesMap }}>
      <div className="space-y-6">
        {/* Toast Notification */}
        {actionSuccessMsg && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#0f1e36] text-white px-4 py-3 rounded-xl shadow-2xl border border-blue-500/30 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <Check className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold">{actionSuccessMsg}</span>
          </div>
        )}

        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 text-white shadow-sm border border-slate-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  Governance & Executive Council
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {Object.keys(nodesMap).length} Active Roles
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                <Network className="w-5 h-5 text-blue-400" />
                Governance & Executive Council Structure
              </h2>
              <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                Configure role descriptions, create and manage council positions, assign or change appointed rover members, and maintain reporting lines.
              </p>
            </div>

            {/* Top Action Bar */}
            <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
              {isAdmin && (
                <>
                  <button
                    onClick={handleOpenAddModal}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Create New Role
                  </button>
                  <button
                    onClick={() => setIsResetConfirmOpen(true)}
                    title="Reset to official charter defaults"
                    className="p-2 rounded-xl text-xs font-bold transition-all bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/80 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </>
              )}

              <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/80">
                <button
                  onClick={() => setViewMode('visual')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'visual'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Network className="w-3.5 h-3.5" />
                  Graph
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  Directory List
                </button>
              </div>
            </div>
          </div>

          {/* Quick Filter & Search Bar */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search positions, roles, descriptions or committees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-800/90 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>

            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-slate-400 text-[11px] font-semibold mr-1">Wing:</span>
              {(['All', 'ARC Rover Wing', 'Committees & Advisory'] as const).map((wing) => (
                <button
                  key={wing}
                  onClick={() => setSelectedWingFilter(wing)}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all text-[11px] cursor-pointer ${
                    selectedWingFilter === wing
                      ? 'bg-blue-500 text-white shadow-2xs font-bold'
                      : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 hover:text-white'
                  }`}
                >
                  {wing}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="font-bold text-slate-800 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-blue-600" />
            Roles & Command Tiers:
          </div>
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span>
              <span className="text-slate-700">Supervisory / Advisor</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-800"></span>
              <span className="text-slate-700">Assemblies & Councils</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-blue-600"></span>
              <span className="text-slate-700">Executive Leadership</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-sky-600"></span>
              <span className="text-slate-700">Executive Coordinators</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-purple-600"></span>
              <span className="text-slate-700">Committees & PR</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-slate-600"></span>
              <span className="text-slate-700">Advisory Counsel</span>
            </div>
          </div>
        </div>

        {/* Interactive Graph View */}
        {viewMode === 'visual' ? (
          <div className="space-y-8 bg-slate-50/70 p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-inner overflow-x-auto">
            {/* Top Tier: Supervisory (Rover Advisor) */}
            {supervisoryNodes.length > 0 && (
              <div className="space-y-3">
                <div className="text-center text-[10px] font-extrabold text-rose-600 uppercase tracking-widest">
                  Supervisory & Executive Oversight
                </div>
                <div className="flex flex-wrap justify-center gap-4">
                  {supervisoryNodes.map(node => (
                    <NodeCard 
                      key={node.id} 
                      node={node} 
                      assignedPeople={getAssignedPeopleForNode(node)}
                      onClick={() => setSelectedNode(node)} 
                      onEdit={() => handleOpenEditModal(node)}
                      onAssign={() => setAssigningNode(node)}
                      isAdmin={isAdmin}
                    />
                  ))}
                </div>

                {/* Connecting Line down */}
                <div className="flex justify-center">
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 mb-1">
                      Supervises & Advises
                    </span>
                    <div className="w-0.5 h-5 bg-rose-400"></div>
                    <ArrowDown className="w-4 h-4 text-rose-500 -mt-1" />
                  </div>
                </div>
              </div>
            )}

            {/* Level 2: Assembly & Council */}
            {(forumNodes.length > 0 || councilNodes.length > 0) && (
              <div className="space-y-3">
                <div className="text-center text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
                  Representative Assemblies & Governing Bodies
                </div>
                <div className="flex flex-wrap items-center justify-center gap-6">
                  {forumNodes.map(node => (
                    <NodeCard 
                      key={node.id} 
                      node={node} 
                      assignedPeople={getAssignedPeopleForNode(node)}
                      onClick={() => setSelectedNode(node)} 
                      onEdit={() => handleOpenEditModal(node)}
                      onAssign={() => setAssigningNode(node)}
                      isAdmin={isAdmin}
                    />
                  ))}

                  {forumNodes.length > 0 && councilNodes.length > 0 && (
                    <div className="hidden md:flex items-center gap-1">
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                        elects
                      </span>
                      <div className="w-8 h-0.5 bg-blue-400"></div>
                      <ArrowRight className="w-4 h-4 text-blue-600 -ml-1" />
                    </div>
                  )}

                  {councilNodes.map(node => (
                    <NodeCard 
                      key={node.id} 
                      node={node} 
                      assignedPeople={getAssignedPeopleForNode(node)}
                      onClick={() => setSelectedNode(node)} 
                      onEdit={() => handleOpenEditModal(node)}
                      onAssign={() => setAssigningNode(node)}
                      isAdmin={isAdmin}
                    />
                  ))}
                </div>

                {/* Connecting Line down to Chairperson */}
                <div className="flex justify-center">
                  <div className="flex flex-col items-center">
                    <div className="w-0.5 h-6 bg-blue-500"></div>
                    <ArrowDown className="w-4 h-4 text-blue-600 -mt-1" />
                  </div>
                </div>
              </div>
            )}

            {/* Level 3: Chairperson + Committees */}
            {chairNodes.length > 0 && (
              <div className="space-y-4">
                <div className="text-center text-[10px] font-extrabold text-blue-600 uppercase tracking-widest">
                  Executive Command & Committees
                </div>
                <div className="flex flex-col items-center gap-4">
                  {chairNodes.map(node => (
                    <NodeCard 
                      key={node.id} 
                      node={node} 
                      assignedPeople={getAssignedPeopleForNode(node)}
                      onClick={() => setSelectedNode(node)} 
                      onEdit={() => handleOpenEditModal(node)}
                      onAssign={() => setAssigningNode(node)}
                      isAdmin={isAdmin}
                      highlight 
                    />
                  ))}

                  {/* Committees attached to Chairperson */}
                  {committeeNodes.length > 0 && (
                    <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
                      {committeeNodes.map(node => (
                        <NodeCard 
                          key={node.id} 
                          node={node} 
                          assignedPeople={getAssignedPeopleForNode(node)}
                          onClick={() => setSelectedNode(node)} 
                          onEdit={() => handleOpenEditModal(node)}
                          onAssign={() => setAssigningNode(node)}
                          isAdmin={isAdmin}
                          compact 
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Connecting Line down to Officers */}
                <div className="flex justify-center pt-2">
                  <div className="flex flex-col items-center">
                    <div className="w-0.5 h-6 bg-sky-500"></div>
                    <ArrowDown className="w-4 h-4 text-sky-600 -mt-1" />
                  </div>
                </div>
              </div>
            )}

            {/* Level 4: Executive Officers & Coordinators */}
            {executiveNodes.length > 0 && (
              <div className="space-y-3">
                <div className="text-center text-[10px] font-extrabold text-sky-700 uppercase tracking-widest">
                  Executive Officers & Coordinators
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3.5">
                  {executiveNodes.map(node => (
                    <NodeCard 
                      key={node.id} 
                      node={node} 
                      assignedPeople={getAssignedPeopleForNode(node)}
                      onClick={() => setSelectedNode(node)} 
                      onEdit={() => handleOpenEditModal(node)}
                      onAssign={() => setAssigningNode(node)}
                      isAdmin={isAdmin}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Custom Extra Roles */}
            {otherCustomNodes.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="text-center text-[10px] font-extrabold text-slate-600 uppercase tracking-widest">
                  Specialized & Appointed Roles
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3.5">
                  {otherCustomNodes.map(node => (
                    <NodeCard 
                      key={node.id} 
                      node={node} 
                      assignedPeople={getAssignedPeopleForNode(node)}
                      onClick={() => setSelectedNode(node)} 
                      onEdit={() => handleOpenEditModal(node)}
                      onAssign={() => setAssigningNode(node)}
                      isAdmin={isAdmin}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Directory List View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNodeKeys.map((key) => {
              const node = nodesMap[key];
              if (!node) return null;
              const assigned = getAssignedPeopleForNode(node);
              return (
                <div
                  key={node.id}
                  className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-blue-400 hover:shadow-md transition-all space-y-3.5 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${node.badgeClass}`}>
                        {node.wing}
                      </span>
                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenEditModal(node);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit Role Configuration"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setAssigningNode(node);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors"
                            title="Manage Assigned Personnel"
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNodeToDelete(node);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Role"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm">{node.title}</h4>
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{node.description}</p>
                  </div>

                  <div className="py-2 px-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-2 text-xs">
                    <span className="text-slate-500 font-semibold flex items-center gap-1.5 text-[11px]">
                      <UserCheck className="w-3.5 h-3.5 text-blue-600" /> Assigned:
                    </span>
                    <span className="font-bold text-slate-800 truncate text-[11px]">
                      {assigned.length > 0 
                        ? `${assigned[0].name}${assigned.length > 1 ? ` (+${assigned.length - 1})` : ''}`
                        : <span className="text-amber-600 italic">Vacant</span>
                      }
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-100 text-[11px] font-medium text-slate-500 flex items-center justify-between">
                    <span className="truncate max-w-[60%]">Election: {node.electionMethod || 'N/A'}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedNode(node)}
                      className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      Inspect <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Node Detail Inspector Modal */}
        {selectedNode && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${selectedNode.badgeClass}`}>
                      {selectedNode.wing}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-600 capitalize">
                      {selectedNode.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    {selectedNode.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedNode(null)}
                  className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">Role Description</h5>
                  <p className="text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    {selectedNode.description}
                  </p>
                </div>

                {/* Assigned Personnel Section with Management Controls */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                      Assigned Personnel ({getAssignedPeopleForNode(selectedNode).length})
                    </h5>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setAssigningNode(selectedNode);
                        }}
                        className="text-blue-600 hover:text-blue-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <UserPlus className="w-3.5 h-3.5" /> + Assign / Change
                      </button>
                    )}
                  </div>

                  {getAssignedPeopleForNode(selectedNode).length > 0 ? (
                    <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                      {getAssignedPeopleForNode(selectedNode).map((person) => (
                        <div key={person.id} className="bg-blue-50/60 border border-blue-100 p-3 rounded-xl space-y-1.5 flex items-center justify-between">
                          <div className="min-w-0 space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-xs flex items-center gap-1 truncate">
                                <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" /> {person.name}
                              </span>
                              {person.crew && <span className="text-[10px] text-slate-500 font-normal">({person.crew})</span>}
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-600">
                              {person.email && <span>{person.email}</span>}
                              {person.phone && <span>{person.phone}</span>}
                            </div>
                          </div>

                          {isAdmin && (
                            <button
                              type="button"
                              onClick={() => handleRemovePerson(selectedNode.id, person.id, person.name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
                              title="Remove person from role"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border border-dashed border-slate-200 p-3 rounded-xl text-center text-slate-400 italic">
                      Currently Vacant. No personnel assigned to this role.
                    </div>
                  )}
                </div>

                {selectedNode.electionMethod && (
                  <div>
                    <h5 className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-1">Appointment / Election Method</h5>
                    <div className="font-semibold text-slate-800 bg-blue-50/60 border border-blue-100 p-2.5 rounded-xl text-blue-900">
                      {selectedNode.electionMethod}
                    </div>
                  </div>
                )}

                {/* Reporting Lines */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {selectedNode.reportsTo && selectedNode.reportsTo.length > 0 && (
                    <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200/80 space-y-1">
                      <span className="font-bold text-amber-900 text-[10px] uppercase tracking-wider flex items-center gap-1">
                        <ArrowRight className="w-3 h-3 text-amber-700" /> Reports To:
                      </span>
                      <ul className="list-disc list-inside text-amber-950 font-semibold text-xs">
                        {selectedNode.reportsTo.map((id) => (
                          <li key={id}>{nodesMap[id]?.title || id}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedNode.supervises && selectedNode.supervises.length > 0 && (
                    <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-1">
                      <span className="font-bold text-emerald-900 text-[10px] uppercase tracking-wider flex items-center gap-1">
                        <ArrowDown className="w-3 h-3 text-emerald-700" /> Supervises:
                      </span>
                      <ul className="list-disc list-inside text-emerald-950 font-semibold text-xs">
                        {selectedNode.supervises.map((id) => (
                          <li key={id}>{nodesMap[id]?.title || id}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedNode.coordinatesWith && selectedNode.coordinatesWith.length > 0 && (
                    <div className="p-3 bg-sky-50/60 rounded-xl border border-sky-200/80 space-y-1 sm:col-span-2">
                      <span className="font-bold text-sky-900 text-[10px] uppercase tracking-wider flex items-center gap-1">
                        <Network className="w-3 h-3 text-sky-700" /> Coordinates With:
                      </span>
                      <ul className="list-disc list-inside text-sky-950 font-semibold text-xs">
                        {selectedNode.coordinatesWith.map((id) => (
                          <li key={id}>{nodesMap[id]?.title || id}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons in Inspector */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {isAdmin ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleOpenEditModal(selectedNode);
                      }}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Role
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNodeToDelete(selectedNode);
                      }}
                      className="px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                ) : <div />}

                <button
                  onClick={() => setSelectedNode(null)}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add or Edit Governance Role */}
        {(isAddRoleModalOpen || editingNode) && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 my-8">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                    <Settings2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      {editingNode ? 'Edit Governance Role' : 'Create New Governance Role'}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Configure title, responsibilities, reporting lines, and visual theme.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddRoleModalOpen(false);
                    setEditingNode(null);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveRoleForm} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role Title *</label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Safety & Welfare Officer / Quartermaster"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Wing *</label>
                    <select
                      value={formWing}
                      onChange={(e) => setFormWing(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                    >
                      <option value="ARC Rover Wing">ARC Rover Wing</option>
                      <option value="Committees & Advisory">Committees & Advisory</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Governance Category *</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 capitalize"
                    >
                      <option value="executive">Executive Officer / Coordinator</option>
                      <option value="chairperson">Chairperson / Presiding</option>
                      <option value="committee">Specialized Committee</option>
                      <option value="advisory">Advisory & Counsel</option>
                      <option value="supervisory">Supervisory Head</option>
                      <option value="council">Council Body</option>
                      <option value="forum">General Forum</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Role Description & Mandate</label>
                  <textarea
                    rows={3}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Describe the duties, responsibilities, and operational scope of this position..."
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Appointment / Election Method</label>
                    <input
                      type="text"
                      value={formElectionMethod}
                      onChange={(e) => setFormElectionMethod(e.target.value)}
                      placeholder="e.g. Council Elected / Appointed"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Color Theme & Card Style</label>
                    <select
                      value={formColorTheme}
                      onChange={(e) => setFormColorTheme(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800"
                    >
                      {Object.keys(COLOR_THEMES).map(k => (
                        <option key={k} value={k}>
                          {COLOR_THEMES[k].label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Reporting Links: Multi-selects */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <h4 className="font-bold text-slate-800 text-[11px]">Reporting & Supervisory Hierarchy</h4>
                  
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1 text-[11px]">Reports To (Parent Nodes)</label>
                    <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200 max-h-24 overflow-y-auto">
                      {allNodeKeys.filter(k => !editingNode || k !== editingNode.id).map(k => {
                        const nodeItem = nodesMap[k];
                        const isChecked = formReportsTo.includes(k);
                        return (
                          <label key={k} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 ${
                            isChecked ? 'bg-blue-600 text-white shadow-2xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}>
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormReportsTo([...formReportsTo, k]);
                                } else {
                                  setFormReportsTo(formReportsTo.filter(id => id !== k));
                                }
                              }}
                            />
                            {nodeItem?.title || k}
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1 text-[11px]">Supervises (Subordinate Nodes)</label>
                    <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200 max-h-24 overflow-y-auto">
                      {allNodeKeys.filter(k => !editingNode || k !== editingNode.id).map(k => {
                        const nodeItem = nodesMap[k];
                        const isChecked = formSupervises.includes(k);
                        return (
                          <label key={k} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1 ${
                            isChecked ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                          }`}>
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormSupervises([...formSupervises, k]);
                                } else {
                                  setFormSupervises(formSupervises.filter(id => id !== k));
                                }
                              }}
                            />
                            {nodeItem?.title || k}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddRoleModalOpen(false);
                      setEditingNode(null);
                    }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                  >
                    {editingNode ? 'Save Changes' : 'Create Role'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Assign / Manage Personnel */}
        {assigningNode && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                    <UserPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Assign Members
                    </h3>
                    <p className="text-xs text-slate-500 font-semibold text-blue-600">
                      {assigningNode.title}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAssigningNode(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Currently Assigned List */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">Currently Assigned:</label>
                {getAssignedPeopleForNode(assigningNode).length > 0 ? (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {getAssignedPeopleForNode(assigningNode).map(person => (
                      <div key={person.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Crown className="w-3.5 h-3.5 text-amber-500" />
                          <span className="font-bold text-slate-800">{person.name}</span>
                          {person.crew && <span className="text-[10px] text-slate-400">({person.crew})</span>}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePerson(assigningNode.id, person.id, person.name)}
                          className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 italic text-center">
                    No active members assigned. Position is currently vacant.
                  </div>
                )}
              </div>

              {/* Assign New Person Form */}
              <form onSubmit={handleAssignPersonSubmit} className="space-y-3 pt-3 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Select Rover Member / Leader:</label>
                  <select
                    value={selectedPersonToAssign}
                    onChange={(e) => setSelectedPersonToAssign(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                  >
                    <option value="">-- Choose Member or Leader to Assign --</option>
                    <optgroup label="Rover Members">
                      {members.map(m => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.crew || 'Alpha Crew'}) - {m.role || 'Rover'}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Adult Leaders & Advisors">
                      {leaders.map(l => (
                        <option key={l.id} value={l.id}>
                          {l.name} ({l.title || 'Leader'})
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setAssigningNode(null)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Done
                  </button>
                  <button
                    type="submit"
                    disabled={!selectedPersonToAssign}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Assign Member
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Confirm Delete Role */}
        {nodeToDelete && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-100 text-center">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base">Delete Governance Role?</h3>
                <p className="text-xs text-slate-600">
                  Are you sure you want to remove <strong>"{nodeToDelete.title}"</strong> from the governance organogram?
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNodeToDelete(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteRole}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Yes, Delete Role
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Confirm Reset Organogram to Defaults */}
        {isResetConfirmOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-100 text-center">
              <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-slate-900 text-base">Reset to Official Charter?</h3>
                <p className="text-xs text-slate-600">
                  This will restore all default organogram nodes and positions according to the official ARC Rover Council charter.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsResetConfirmOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleResetToDefaults}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs transition-colors cursor-pointer"
                >
                  Reset Structure
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </OrgPeopleContext.Provider>
  );
};

interface NodeCardProps {
  node: OrgNode;
  assignedPeople: AssignedPerson[];
  onClick: () => void;
  onEdit: () => void;
  onAssign: () => void;
  isAdmin?: boolean;
  compact?: boolean;
  highlight?: boolean;
}

const NodeCard: React.FC<NodeCardProps> = ({ 
  node, 
  assignedPeople,
  onClick, 
  onEdit,
  onAssign,
  isAdmin = false,
  compact = false, 
  highlight = false 
}) => {
  const hasPeople = assignedPeople.length > 0;

  return (
    <div
      onClick={onClick}
      className={`group relative rounded-2xl transition-all cursor-pointer text-center font-bold border flex flex-col justify-between items-center ${node.bgClass} ${node.borderClass} ${
        compact 
          ? 'px-3 py-2 text-[11px] min-w-[130px] min-h-[56px]' 
          : highlight 
            ? 'px-5 py-3.5 text-xs sm:text-sm min-w-[200px] min-h-[82px] ring-4 ring-blue-500/20 scale-105 shadow-md' 
            : 'px-4 py-3 text-xs min-w-[170px] min-h-[70px] shadow-xs'
      }`}
    >
      {/* Quick Edit button on hover for Admins */}
      {isAdmin && (
        <div 
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 bg-black/40 hover:bg-black/70 p-1 rounded-md text-white transition-opacity"
          title="Quick Edit Role"
        >
          <Edit3 className="w-3 h-3" />
        </div>
      )}

      <div className="w-full">
        <div className="truncate w-full font-bold">{node.title}</div>
        {!compact && (
          <div className="text-[10px] opacity-85 font-normal truncate w-full mt-0.5">
            {node.wing}
          </div>
        )}
      </div>

      <div className={`w-full flex items-center justify-center gap-1 text-[10px] mt-1.5 ${compact ? 'text-[9px]' : ''}`}>
        {hasPeople ? (
          <div className="bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded-md truncate max-w-full font-semibold flex items-center gap-1">
            <UserCheck className="w-3 h-3 shrink-0" />
            <span className="truncate">{assignedPeople[0].name}</span>
            {assignedPeople.length > 1 && (
              <span className="shrink-0 text-[8px] bg-white/30 px-1 rounded-sm">+{assignedPeople.length - 1}</span>
            )}
          </div>
        ) : (
          <span 
            onClick={(e) => {
              if (isAdmin) {
                e.stopPropagation();
                onAssign();
              }
            }}
            className={`opacity-60 hover:opacity-100 font-normal italic px-1.5 py-0.5 rounded ${isAdmin ? 'hover:bg-white/20' : ''}`}
          >
            {isAdmin ? '+ Assign Member' : 'Vacant'}
          </span>
        )}
      </div>
    </div>
  );
};
