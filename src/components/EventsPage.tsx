import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  MapPin, 
  Plus, 
  DollarSign, 
  ClipboardCheck, 
  Users, 
  ArrowRight, 
  ShieldAlert, 
  Compass, 
  CheckCircle2, 
  Truck, 
  Send,
  FileSpreadsheet
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

interface EventItem {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  type: 'Social' | 'Recreational' | 'Ceremonial' | 'Camp' | 'Other';
  description: string;
  budgetRequested?: number;
  budgetApproved?: boolean;
  equipmentRequired?: string[];
  status: 'Planning' | 'Approved' | 'Completed';
  reportSubmitted?: boolean;
}

export const EventsPage: React.FC<{ 
  isAdmin: boolean; 
  userRole?: string; 
  pagePermissions?: PagePermissions[];
}> = ({ 
  isAdmin, 
  userRole = 'Quartermaster', 
  pagePermissions 
}) => {
  const currentRole = isAdmin ? 'Administrator' : userRole;

  // Active simulated role for testing
  const [simulatedRole, setSimulatedRole] = useState<string>(currentRole);

  const [activeTab, setActiveTab] = useState<'calendar' | 'planning' | 'reports'>('calendar');
  
  // States
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States - Planning Submission
  const [isPlanOpen, setIsPlanOpen] = useState(false);
  const [eTitle, setETitle] = useState('');
  const [eDate, setEDate] = useState('');
  const [eTime, setETime] = useState('');
  const [eLoc, setELoc] = useState('');
  const [eType, setEType] = useState<EventItem['type']>('Recreational');
  const [eDesc, setEDesc] = useState('');
  const [eBudget, setEBudget] = useState('');
  const [eEquip, setEEquip] = useState<string[]>([]);
  const [newEquip, setNewEquip] = useState('');

  // Form States - Evaluation Report
  const [reportingEvent, setReportingEvent] = useState<EventItem | null>(null);
  const [repEval, setRepEval] = useState('');
  const [repCount, setRepCount] = useState('');
  const [repList, setRepList] = useState('');

  useEffect(() => {
    const qEvents = query(collection(db, 'events_calendar'), orderBy('date', 'asc'));
    const unsubEvents = onSnapshot(qEvents, (snapshot) => {
      const evs: EventItem[] = [];
      snapshot.forEach(doc => {
        evs.push({ id: doc.id, ...doc.data() } as EventItem);
      });
      setEvents(evs);
      setLoading(false);
    }, (error) => {
      console.warn('Fallback calendar state:', error);
      setEvents([
        { id: '1', title: 'Annual Crew Leader Training Weekend', date: '2026-08-22', time: '08:00', location: 'Fihalhohi Basecamp', type: 'Camp', description: 'Intensive pioneering, crew leadership, and crisis navigation drills.', budgetRequested: 2500, budgetApproved: true, equipmentRequired: ['Tents (x4)', 'Spliced rope coils', 'First-aid box (large)'], status: 'Approved' },
        { id: '2', title: 'Rover Squire Investiture Ceremony', date: '2026-08-29', time: '18:00', location: 'Council HQ Hall', type: 'Ceremonial', description: 'Investiture of newly selected squires into Abu Bakr Crew.', budgetRequested: 800, budgetApproved: true, equipmentRequired: ['Investiture scarves', 'Portal banner', 'Refreshments kit'], status: 'Planning' },
        { id: '3', title: 'Youth Climate Action Action Outing', date: '2026-08-05', time: '14:30', location: 'Hulhumale Phase 2 Beach', type: 'Social', description: 'Coastal cleanup and community awareness pamphlet distribution.', budgetRequested: 500, budgetApproved: true, status: 'Completed', reportSubmitted: true }
      ]);
      setLoading(false);
    });

    return () => unsubEvents();
  }, []);

  const handleAddEquip = () => {
    if (!newEquip.trim()) return;
    if (eEquip.includes(newEquip.trim())) return;
    setEEquip(prev => [...prev, newEquip.trim()]);
    setNewEquip('');
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eTitle.trim() || !eDate) return;

    const eventData = {
      title: eTitle.trim(),
      date: eDate,
      time: eTime || '09:00',
      location: eLoc.trim() || 'Council Hall',
      type: eType,
      description: eDesc.trim(),
      budgetRequested: eBudget ? parseFloat(eBudget) : 0,
      budgetApproved: false,
      equipmentRequired: eEquip,
      status: 'Planning',
      reportSubmitted: false
    };

    try {
      await addDoc(collection(db, 'events_calendar'), eventData);
      
      // Also automatically submit a budget request log to the finance system if budget requested > 0
      if (eventData.budgetRequested > 0) {
        await addDoc(collection(db, 'finance_transactions'), {
          type: 'Outward',
          category: 'Logistics',
          description: `PENDING APPROVAL: Budget request for event "${eventData.title}"`,
          amount: eventData.budgetRequested,
          date: eventData.date,
          attachmentName: 'automatic_event_budget_request.pdf',
          attachmentData: 'data:text/plain;base64,QXV0b21hdGljIGV2ZW50IGJ1ZGdldCByZXF1ZXN0',
          loggedBy: 'Event Coordinator Link'
        });
      }

      setIsPlanOpen(false);
      setETitle('');
      setEEquip([]);
    } catch (err) {
      setEvents(prev => [...prev, { id: Date.now().toString(), ...eventData } as EventItem]);
      setIsPlanOpen(false);
      setETitle('');
      setEEquip([]);
    }
  };

  const handleApproveBudget = async (id: string) => {
    try {
      await updateDoc(doc(db, 'events_calendar', id), {
        budgetApproved: true,
        status: 'Approved'
      });
    } catch (err) {
      setEvents(prev => prev.map(e => e.id === id ? { ...e, budgetApproved: true, status: 'Approved' } : e));
    }
  };

  const handleCreateReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingEvent || !repEval.trim()) return;

    try {
      // 1. Mark event as completed and reported
      await updateDoc(doc(db, 'events_calendar', reportingEvent.id), {
        status: 'Completed',
        reportSubmitted: true
      });

      // 2. Post report document directly to the records_archive
      await addDoc(collection(db, 'records_documents'), {
        title: `Post-Event Report: ${reportingEvent.title}`,
        category: 'Official Reports',
        uploadedBy: 'Event Coordinator Link',
        date: new Date().toISOString().split('T')[0],
        fileName: `${reportingEvent.title.toLowerCase().replace(/ /g, '_')}_report.pdf`,
        contentSummary: `Evaluation: ${repEval}\nAttendees Count: ${repCount}\nAttendees List: ${repList}`
      });

      setReportingEvent(null);
      setRepEval('');
      setRepCount('');
      setRepList('');
    } catch (err) {
      setEvents(prev => prev.map(ev => ev.id === reportingEvent.id ? { ...ev, status: 'Completed', reportSubmitted: true } : ev));
      setReportingEvent(null);
    }
  };

  const simulatedRolesList = [
    'Quartermaster',
    'Event Coordinator',
    'Treasurer',
    'Normal Rover Member',
    'Administrator'
  ];

  const isAdvisor = simulatedRole.toLowerCase().includes('advisor') || 
                    simulatedRole.toLowerCase().includes('administrator') || 
                    simulatedRole.toLowerCase().includes('ziyad');

  const hasRolePermission = pagePermissions?.some(p => 
    p.memberId.toLowerCase() === simulatedRole.toLowerCase() && p.grantedPages.includes('events')
  ) || (!pagePermissions?.some(p => p.memberId.toLowerCase() === simulatedRole.toLowerCase()) && 
        DEFAULT_ROLE_PERMISSIONS[simulatedRole]?.includes('events'));

  const actualHasAccess = isAdvisor || hasRolePermission;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Compass className="w-6 h-6 text-emerald-600" />
            <h1 className="text-xl font-bold text-[#0f1e36]">Events, Planning & Logistics</h1>
          </div>
          <p className="text-xs text-slate-500">Plan monthly social & recreational events, manage equipment lists, and submit budget requests.</p>
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
        <div className="bg-[#eafaf1] border border-emerald-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-emerald-950">Read-Only Schedule Tracker</h4>
              <p className="text-[11px] text-emerald-800 leading-relaxed max-w-xl">
                As a normal member, you can review the master event calendar and equipment inventories. Adding proposals and allocating gear is restricted to council members.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setSimulatedRole('Event Coordinator')}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold transition-colors cursor-pointer shrink-0"
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
              Master Schedule
            </button>
            <button
              onClick={() => setActiveTab('planning')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'planning'
                  ? 'bg-white text-[#1e40af] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Truck className="w-4 h-4" />
              Logistics Workflow
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'reports'
                  ? 'bg-white text-[#1e40af] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ClipboardCheck className="w-4 h-4" />
              Post-Event Reports
            </button>
          </div>

          {/* Master Calendar Tab */}
          {activeTab === 'calendar' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Interactive Master Calendar</h2>
                  <p className="text-xs text-slate-500">Central roadmap displaying social, recreational, and ceremonial programs.</p>
                </div>
                {actualHasAccess && (
                  <button
                    onClick={() => setIsPlanOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" /> Propose New Event Plan
                  </button>
                )}
              </div>

              {/* Calendar Grid/List */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map((e) => (
                  <div key={e.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:shadow-sm transition-all">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          e.type === 'Camp' ? 'bg-orange-50 text-orange-700' : 'bg-blue-50 text-blue-700'
                        }`}>
                          {e.type}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          e.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {e.status}
                        </span>
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 leading-snug">{e.title}</h3>
                      <p className="text-xs text-slate-500 font-medium line-clamp-2">{e.description}</p>
                    </div>

                    <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>{e.date} @ {e.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate">{e.location}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Logistics Workflow Tab */}
          {activeTab === 'planning' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Event Proposals & Equipment Control</h2>
                  <p className="text-xs text-slate-500">Track logistics requisitions and authorize event budgets.</p>
                </div>
              </div>

              {/* Proposal Table List */}
              <div className="space-y-4">
                {events.filter(e => e.status !== 'Completed').map((e) => (
                  <div key={e.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 hover:shadow-sm">
                    <div className="space-y-4 flex-1">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">{e.title}</h3>
                          <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">{e.status}</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">Proposed Date: {e.date} • Base: {e.location}</p>
                      </div>

                      {e.equipmentRequired && e.equipmentRequired.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Logistics Gear List:</span>
                          <div className="flex flex-wrap gap-1.5">
                            {e.equipmentRequired.map((item, idx) => (
                              <span key={idx} className="bg-slate-100 text-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold inline-flex items-center gap-1">
                                <Truck className="w-3.5 h-3.5 text-slate-400" /> {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {e.budgetRequested && e.budgetRequested > 0 ? (
                        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100 max-w-md">
                          <div className="space-y-0.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Capital Requested:</span>
                            <span className="text-sm font-black text-[#1e40af]">{e.budgetRequested.toLocaleString()} MVR</span>
                          </div>

                          {e.budgetApproved ? (
                            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1">
                              <CheckCircle2 className="w-4 h-4" /> Allocated
                            </span>
                          ) : (
                            actualHasAccess ? (
                              <button
                                onClick={() => handleApproveBudget(e.id)}
                                className="px-3 py-1.5 bg-[#1e40af] text-white hover:bg-[#1e3a8a] text-xs font-bold rounded-xl cursor-pointer"
                              >
                                Approve Request
                              </button>
                            ) : (
                              <span className="bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1">
                                Pending Council Approval
                              </span>
                            )
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Post-Event Evaluations */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Post-Event Evaluation Hub</h2>
                  <p className="text-xs text-slate-500">Coordinate and file official event summaries directly to the Records Archive.</p>
                </div>
              </div>

              {/* Event evaluation candidates list */}
              <div className="space-y-4">
                {events.filter(e => e.status === 'Approved' || e.status === 'Completed').map((e) => (
                  <div key={e.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex justify-between gap-6 items-center">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{e.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Completed program: {e.date} @ {e.location}</p>
                    </div>

                    <div className="shrink-0">
                      {e.reportSubmitted ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold px-2.5 py-1 rounded-xl flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Report Filed
                        </span>
                      ) : (
                        <button
                          onClick={() => setReportingEvent(e)}
                          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Send className="w-3.5 h-3.5" /> Submit Evaluation
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>

      {/* Plan New Event Modal */}
      {isPlanOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-6">
            <h2 className="text-base font-bold text-slate-900">Propose New Event Plan</h2>
            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  value={eTitle}
                  onChange={(e) => setETitle(e.target.value)}
                  placeholder="e.g. Q3 Pioneer Survival Expedition"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={eDate}
                    onChange={(e) => setEDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={eTime}
                    onChange={(e) => setETime(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Location / Base</label>
                  <input
                    type="text"
                    required
                    value={eLoc}
                    onChange={(e) => setELoc(e.target.value)}
                    placeholder="e.g. Villingili North-West Beach"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Event Type</label>
                  <select
                    value={eType}
                    onChange={(e) => setEType(e.target.value as any)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none"
                  >
                    <option value="Recreational">Recreational</option>
                    <option value="Social">Social Impact</option>
                    <option value="Ceremonial">Ceremonial</option>
                    <option value="Camp">Outdoor Camp</option>
                    <option value="Other">Other Event</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Program Description</label>
                <textarea
                  required
                  value={eDesc}
                  onChange={(e) => setEDesc(e.target.value)}
                  rows={2}
                  placeholder="Outline activities, targeted badge syllabus alignment..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none"
                />
              </div>

              {/* Linked budget request */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Budget Request Allocation (Treasurer Approval Sync)
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="number"
                    value={eBudget}
                    onChange={(e) => setEBudget(e.target.value)}
                    placeholder="e.g. 1500 (Leave blank if 0)"
                    className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Equipment list */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Logistics Requisition (Gear/Equipment)</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newEquip}
                    onChange={(e) => setNewEquip(e.target.value)}
                    placeholder="e.g. Pioneering spar logs (x15)"
                    className="flex-1 px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddEquip}
                    className="px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {eEquip.map((item, idx) => (
                    <span key={idx} className="bg-slate-100 text-slate-700 border border-slate-200 rounded-lg px-2.5 py-0.5 text-xs font-semibold flex items-center gap-1">
                      {item}
                      <button type="button" onClick={() => setEEquip(prev => prev.filter((_, i) => i !== idx))} className="text-red-500 font-bold ml-1">✕</button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPlanOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-emerald-750"
                >
                  Circulate Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Post-Event Evaluation Report Submission Modal */}
      {reportingEvent && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Post-Event Evaluation</h2>
              <p className="text-xs text-slate-400">Filing report for: {reportingEvent.title}</p>
            </div>

            <form onSubmit={handleCreateReport} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Performance Evaluation</label>
                <textarea
                  required
                  value={repEval}
                  onChange={(e) => setRepEval(e.target.value)}
                  rows={4}
                  placeholder="Detail highlights, logistics errors, feedback from examiners, and participant outcomes..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Participants Count</label>
                  <input
                    type="number"
                    required
                    value={repCount}
                    onChange={(e) => setRepCount(e.target.value)}
                    placeholder="e.g. 18"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">List of Attendees</label>
                  <input
                    type="text"
                    required
                    value={repList}
                    onChange={(e) => setRepList(e.target.value)}
                    placeholder="e.g. Zeeshan, Ibrahim, Sana..."
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReportingEvent(null)}
                  className="px-3.5 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-emerald-700"
                >
                  File & Close Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
