import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  TrendingUp, 
  Calendar, 
  FileText, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Vote,
  Target,
  ChevronRight,
  BookOpen,
  ArrowRight,
  ShieldAlert,
  Users,
  Network
} from 'lucide-react';
import { collection, addDoc, getDocs, updateDoc, doc, deleteDoc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { PagePermissions } from '../services/permissionsService';
import { OrgChart } from './OrgChart';

interface Goal {
  id: string;
  title: string;
  category: string;
  targetDate: string;
  progress: number; // 0 to 100
  status: 'Not Started' | 'In Progress' | 'Completed' | 'On Hold';
  priority: 'High' | 'Medium' | 'Low';
}

interface Meeting {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  agenda: string;
  minutes?: string;
  resolutions?: string[];
  status: 'Scheduled' | 'Completed' | 'Cancelled';
}

export const GovernancePage: React.FC<{ 
  isAdmin: boolean; 
  userRole?: string; 
  pagePermissions?: PagePermissions[];
}> = ({ 
  isAdmin, 
  userRole = 'Council Secretary', 
  pagePermissions 
}) => {
  const currentRole = isAdmin ? 'Administrator' : userRole;

    const [activeTab, setActiveTab] = useState<'goals' | 'meetings' | 'hierarchy'>('hierarchy');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states - Goals
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState('Annual Plan');
  const [newGoalPriority, setNewGoalPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [newGoalTargetDate, setNewGoalTargetDate] = useState('');

  // Form states - Meetings
  const [isAddMeetingOpen, setIsAddMeetingOpen] = useState(false);
  const [newMeetingTitle, setNewMeetingTitle] = useState('');
  const [newMeetingDate, setNewMeetingDate] = useState('');
  const [newMeetingTime, setNewMeetingTime] = useState('');
  const [newMeetingLocation, setNewMeetingLocation] = useState('');
  const [newMeetingAgenda, setNewMeetingAgenda] = useState('');

  // Edit states for minutes/resolutions
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [meetingMinutes, setMeetingMinutes] = useState('');
  const [meetingResolution, setMeetingResolution] = useState('');
  const [meetingResolutionsList, setMeetingResolutionsList] = useState<string[]>([]);

  // Real-time synchronization
  useEffect(() => {
    const qGoals = query(collection(db, 'governance_goals'));
    const unsubGoals = onSnapshot(qGoals, (snapshot) => {
      const gList: Goal[] = [];
      snapshot.forEach(doc => {
        gList.push({ id: doc.id, ...doc.data() } as Goal);
      });
      // Sort: High priority first
      setGoals(gList.sort((a,b) => b.progress - a.progress));
      setLoading(false);
    });

    return () => {
      unsubGoals();
    };
  }, []);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    const goalData = {
      title: newGoalTitle.trim(),
      category: newGoalCategory,
      priority: newGoalPriority,
      targetDate: newGoalTargetDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      progress: 0,
      status: 'Not Started'
    };

    try {
      await addDoc(collection(db, 'governance_goals'), goalData);
      setIsAddGoalOpen(false);
      setNewGoalTitle('');
    } catch (err) { console.error("Error", err); alert("Action failed."); }
  };

  const handleUpdateProgress = async (goalId: string, nextProgress: number) => {
    const val = Math.max(0, Math.min(100, nextProgress));
    let nextStatus: Goal['status'] = 'In Progress';
    if (val === 100) nextStatus = 'Completed';
    else if (val === 0) nextStatus = 'Not Started';

    try {
      await updateDoc(doc(db, 'governance_goals', goalId), {
        progress: val,
        status: nextStatus
      });
    } catch (err) { console.error("Error", err); alert("Action failed."); }
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeetingTitle.trim() || !newMeetingDate) return;

    const mData = {
      title: newMeetingTitle.trim(),
      date: newMeetingDate,
      time: newMeetingTime || '20:00',
      location: newMeetingLocation || 'HQ Room 1',
      agenda: newMeetingAgenda.trim() || 'General Council Matters',
      status: 'Scheduled',
      resolutions: []
    };

    try {
      await addDoc(collection(db, 'governance_meetings'), mData);
      setIsAddMeetingOpen(false);
      setNewMeetingTitle('');
      setNewMeetingAgenda('');
    } catch (err) { console.error("Error", err); alert("Action failed."); }
  };

  const handleOpenMinutesEditor = (meeting: Meeting) => {
    setEditingMeeting(meeting);
    setMeetingMinutes(meeting.minutes || '');
    setMeetingResolutionsList(meeting.resolutions || []);
    setMeetingResolution('');
  };

  const handleAddResolution = () => {
    if (!meetingResolution.trim()) return;
    setMeetingResolutionsList(prev => [...prev, meetingResolution.trim()]);
    setMeetingResolution('');
  };

  const handleSaveMinutes = async () => {
    if (!editingMeeting) return;
    const updates = {
      minutes: meetingMinutes,
      resolutions: meetingResolutionsList,
      status: 'Completed' as const
    };

    try {
      await updateDoc(doc(db, 'governance_meetings', editingMeeting.id), updates);
      setEditingMeeting(null);
    } catch (err) { console.error("Error", err); alert("Action failed."); }
  };

  const currentRolesList = [
    'Council Secretary',
    'Council Member',
    'Treasurer',
    'Quartermaster',
    'Normal Rover Member',
    'Administrator'
  ];

  const roleLower = (currentRole || '').toLowerCase();
  const isAdvisor = roleLower.includes('advisor') || 
                    roleLower.includes('administrator') || 
                    roleLower.includes('ziyad');

  const hasRolePermission = pagePermissions?.some(p => 
    p.memberId && p.memberId.toLowerCase() === roleLower && p.grantedPages?.includes('governance')
  );

  const actualHasAccess = isAdvisor || hasRolePermission;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner with Role Swapping Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-[#1e40af]" />
            <h1 className="text-xl font-bold text-[#0f1e36]">Governance & Executive Council</h1>
          </div>
          <p className="text-xs text-slate-500">Monitor priority strategic plans and run official council sessions.</p>
        </div>

        
      </div>

      {/* Role Access Security Guard */}
      {!actualHasAccess ? (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-2xl mx-auto space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-bold text-red-950">Unauthorized Executive Space</h3>
            <p className="text-xs text-red-700 leading-relaxed max-w-md mx-auto">
              This module contains confidential executive decisions, minutes, and strategic goals. Access is restricted to Council Members, Secretaries, and Leadership.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Main Action Tabs */}
          <div className="flex border-b border-slate-200 gap-1.5 bg-slate-100/55 p-1 rounded-xl max-w-xl">
            <button
              onClick={() => setActiveTab('hierarchy')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'hierarchy'
                  ? 'bg-white text-[#1e40af] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Network className="w-4 h-4" />
              Reporting Organogram
            </button>
            <button
              onClick={() => setActiveTab('goals')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'goals'
                  ? 'bg-white text-[#1e40af] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Target className="w-4 h-4" />
              Strategic Goals
            </button>
            <button
              onClick={() => setActiveTab('meetings')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'meetings'
                  ? 'bg-white text-[#1e40af] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4" />
              Meeting Manager
            </button>
          </div>

          {/* Reporting Organogram Tab */}
          {activeTab === 'hierarchy' && (
            <OrgChart isAdmin={isAdmin} />
          )}

          {/* Goal Tracker Tab */}
          {activeTab === 'goals' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Annual Strategic Roadmap</h2>
                  <p className="text-xs text-slate-500">Monitor annual plans, milestones, and strategic progression goals.</p>
                </div>
                <button
                  onClick={() => setIsAddGoalOpen(true)}
                  className="bg-[#1e40af] hover:bg-[#1e3a8a] text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" /> Add Strategic Goal
                </button>
              </div>

              {/* Goal Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {goals.map((goal) => (
                  <div key={goal.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          goal.category === 'Annual Plan' 
                            ? 'bg-blue-50 text-blue-700 border border-blue-100'
                            : goal.category === 'Priority Goal'
                            ? 'bg-purple-50 text-purple-700 border border-purple-100'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          {goal.category}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          goal.priority === 'High' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {goal.priority} Priority
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 leading-snug">{goal.title}</h3>
                    </div>

                    <div className="space-y-3">
                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-500">Milestone Progression</span>
                          <span className="text-[#1e40af]">{goal.progress}%</span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-500 to-[#1e40af] rounded-full transition-all duration-300" style={{ width: `${goal.progress}%` }} />
                        </div>
                      </div>

                      {/* Updates controls */}
                      <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100">
                        <span className="text-[10px] font-semibold text-slate-400">Target: {goal.targetDate}</span>
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => handleUpdateProgress(goal.id, goal.progress - 10)}
                            className="w-6 h-6 rounded bg-slate-50 border border-slate-200 flex items-center justify-center text-xs font-bold hover:bg-slate-100"
                          >
                            -
                          </button>
                          <button 
                            onClick={() => handleUpdateProgress(goal.id, goal.progress + 10)}
                            className="w-6 h-6 rounded bg-slate-50 border border-slate-200 flex items-center justify-center text-xs font-bold hover:bg-slate-100"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Meeting Tab */}
          {activeTab === 'meetings' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Council & Committee Sessions</h2>
                  <p className="text-xs text-slate-500">Track scheduled agenda distributions, recorded resolutions, and minutes.</p>
                </div>
                <button
                  onClick={() => setIsAddMeetingOpen(true)}
                  className="bg-[#1e40af] hover:bg-[#1e3a8a] text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" /> Schedule Council Meeting
                </button>
              </div>

              {/* Meeting List */}
              <div className="space-y-4">
                {meetings.map((meeting) => (
                  <div key={meeting.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-start md:justify-between gap-6 hover:shadow-sm transition-all">
                    <div className="space-y-4 flex-1">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shrink-0">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-bold text-slate-900">{meeting.title}</h3>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                              meeting.status === 'Scheduled' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            }`}>
                              {meeting.status}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{meeting.date} @ {meeting.time} • Room: {meeting.location}</p>
                        </div>
                      </div>

                      <div className="space-y-2 bg-slate-50 rounded-xl p-3 border border-slate-100 text-xs text-slate-700">
                        <strong className="text-slate-800 text-[11px] uppercase tracking-wider block">1. Session Agenda:</strong>
                        <p className="whitespace-pre-line leading-relaxed font-medium">{meeting.agenda}</p>
                      </div>

                      {meeting.minutes && (
                        <div className="space-y-2 bg-emerald-50/40 rounded-xl p-3 border border-emerald-100 text-xs text-slate-700">
                          <strong className="text-emerald-950 text-[11px] uppercase tracking-wider block">2. Official Session Minutes:</strong>
                          <p className="leading-relaxed font-medium">{meeting.minutes}</p>
                        </div>
                      )}

                      {meeting.resolutions && meeting.resolutions.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Decision Resolutions:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {meeting.resolutions.map((res, i) => (
                              <span key={i} className="bg-purple-50 text-purple-700 border border-purple-200 rounded-lg px-2.5 py-1 text-xs font-bold flex items-center gap-1.5">
                                <Vote className="w-3.5 h-3.5 text-purple-600" /> {res}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="shrink-0 flex gap-2">
                      <button
                        onClick={() => handleOpenMinutesEditor(meeting)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5 text-slate-500" /> Record Minutes & Vote
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

      {/* Goal Add Modal */}
      {isAddGoalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-6">
            <h2 className="text-base font-bold text-slate-900">Add Strategic Goal</h2>
            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Goal Title</label>
                <input
                  type="text"
                  required
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="e.g. Host Arabiyya Rover Moot 2026"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#1e40af]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newGoalCategory}
                    onChange={(e) => setNewGoalCategory(e.target.value)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none"
                  >
                    <option value="Annual Plan">Annual Plan</option>
                    <option value="Priority Goal">Priority Goal</option>
                    <option value="Strategic Initiative">Strategic Initiative</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newGoalPriority}
                    onChange={(e) => setNewGoalPriority(e.target.value as any)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Target Date</label>
                <input
                  type="date"
                  value={newGoalTargetDate}
                  onChange={(e) => setNewGoalTargetDate(e.target.value)}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#1e40af]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddGoalOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1e40af] text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-[#1e3a8a]"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Meeting Add Modal */}
      {isAddMeetingOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-6">
            <h2 className="text-base font-bold text-slate-900">Schedule Council Meeting</h2>
            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Meeting Title</label>
                <input
                  type="text"
                  required
                  value={newMeetingTitle}
                  onChange={(e) => setNewMeetingTitle(e.target.value)}
                  placeholder="e.g. 5th Regular Executive Council Session"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#1e40af]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newMeetingDate}
                    onChange={(e) => setNewMeetingDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#1e40af]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={newMeetingTime}
                    onChange={(e) => setNewMeetingTime(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#1e40af]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Location</label>
                <input
                  type="text"
                  value={newMeetingLocation}
                  onChange={(e) => setNewMeetingLocation(e.target.value)}
                  placeholder="e.g. Headquarters / Google Meet"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Proposed Agenda (one per line)</label>
                <textarea
                  value={newMeetingAgenda}
                  onChange={(e) => setNewMeetingAgenda(e.target.value)}
                  rows={4}
                  placeholder="e.g. 1. Budget reconciliation.&#10;2. Activity reports."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-[#1e40af]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddMeetingOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#1e40af] text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-[#1e3a8a]"
                >
                  Circulate Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Minutes & Voting Editor Modal */}
      {editingMeeting && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Record Session Minutes & Decisions</h2>
              <p className="text-xs text-slate-500">Meeting: {editingMeeting.title}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Official Minutes Summary</label>
                <textarea
                  value={meetingMinutes}
                  onChange={(e) => setMeetingMinutes(e.target.value)}
                  rows={4}
                  placeholder="Detailed logs of decisions, attendee comments, and session progression."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Decisions / Approved Resolutions</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={meetingResolution}
                    onChange={(e) => setMeetingResolution(e.target.value)}
                    placeholder="e.g. Passed budget amendment of 1200 MVR"
                    className="flex-1 px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddResolution}
                    className="px-3 py-2 bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer"
                  >
                    Add Vote
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {meetingResolutionsList.map((res, i) => (
                    <span key={i} className="bg-slate-100 text-slate-800 border border-slate-200 rounded-lg px-2 py-0.5 text-xs flex items-center gap-1.5 font-semibold">
                      {res}
                      <button 
                        type="button" 
                        onClick={() => setMeetingResolutionsList(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingMeeting(null)}
                  className="px-3.5 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSaveMinutes}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-emerald-700"
                >
                  Save & Conclude Session
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
};
