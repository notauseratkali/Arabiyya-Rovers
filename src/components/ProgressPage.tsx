import React, { useState, useEffect } from 'react';
import { 
  Award, 
  BookOpen, 
  Clock, 
  Plus, 
  CheckSquare, 
  Users, 
  Calendar, 
  ShieldAlert, 
  Activity, 
  CheckCircle,
  TrendingUp,
  MapPin
} from 'lucide-react';
import { collection, addDoc, getDocs, onSnapshot, query, orderBy, updateDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { PagePermissions } from '../services/permissionsService';

interface MemberProgress {
  id: string;
  name: string;
  role: 'Rover' | 'Rover Squire';
  crew: string;
  completedBadges: string[];
  trainingSessions: string[];
  serviceHours: number;
}

interface TrainingSession {
  id: string;
  title: string;
  date: string;
  time: string;
  instructor: string;
  targetAudience: 'New Members' | 'Experienced Members' | 'All';
  location: string;
  status: 'Upcoming' | 'Completed';
}

interface ServiceProject {
  id: string;
  title: string;
  date: string;
  participants: string[];
  hoursPerParticipant: number;
  description: string;
}

export const ProgressPage: React.FC<{ 
  isAdmin: boolean; 
  userRole?: string; 
  pagePermissions?: PagePermissions[];
}> = ({ 
  isAdmin, 
  userRole = 'Progress Coordinator', 
  pagePermissions 
}) => {
  const currentRole = isAdmin ? 'Administrator' : userRole;

    const [activeTab, setActiveTab] = useState<'matrix' | 'trainings' | 'service'>('matrix');
  
  // States
  const [memberMatrix, setMemberMatrix] = useState<MemberProgress[]>([]);
  const [trainings, setTrainings] = useState<TrainingSession[]>([]);
  const [serviceLogs, setServiceLogs] = useState<ServiceProject[]>([]);
  const [loading, setLoading] = useState(true);

  // Form States - Training
  const [isAddTrainingOpen, setIsAddTrainingOpen] = useState(false);
  const [tTitle, setTTitle] = useState('');
  const [tDate, setTDate] = useState('');
  const [tTime, setTTime] = useState('');
  const [tInstructor, setTInstructor] = useState('');
  const [tAudience, setTAudience] = useState<'New Members' | 'Experienced Members' | 'All'>('All');
  const [tLoc, setTLoc] = useState('');

  // Form States - Service Logging
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false);
  const [sTitle, setSTitle] = useState('');
  const [sDate, setSDate] = useState('');
  const [sHours, setSHours] = useState('');
  const [sDesc, setSDesc] = useState('');
  const [sParticipants, setSParticipants] = useState<string[]>([]);
  const [newParticipant, setNewParticipant] = useState('');

  // Badge list config
  const BADGES_POOL = ['Rover Badge', 'Squire Onboarding', 'Pioneering', 'First Aid Certificate', 'Citizenship Award', 'Expedition Milestone'];

  useEffect(() => {
    const qMatrix = query(collection(db, 'progress_matrix'));
    const unsubMatrix = onSnapshot(qMatrix, (snapshot) => {
      const ms: MemberProgress[] = [];
      snapshot.forEach(doc => {
        ms.push({ id: doc.id, ...doc.data() } as MemberProgress);
      });
      setMemberMatrix(ms);
      setLoading(false);
    }, (error) => {
      console.error("Firebase sync error", error);
      setMemberMatrix([
        { id: '1', name: 'Zeeshan Ahmed', role: 'Rover', crew: 'Abu Bakr Crew', completedBadges: ['Rover Badge', 'First Aid Certificate', 'Citizenship Award'], trainingSessions: ['Standard Pioneer Rigging'], serviceHours: 24 },
        { id: '2', name: 'Sana Ahmed', role: 'Rover Squire', crew: 'Ali Crew', completedBadges: ['Squire Onboarding'], trainingSessions: ['Introductory Rover Orientation'], serviceHours: 8 },
        { id: '3', name: 'Ibrahim Manik', role: 'Rover', crew: 'Abu Bakr Crew', completedBadges: ['Rover Badge', 'Pioneering', 'Expedition Milestone'], trainingSessions: ['Standard Pioneer Rigging'], serviceHours: 32 }
      ]);
      setLoading(false);
    });

    const qT = query(collection(db, 'progress_trainings'), orderBy('date', 'asc'));
    const unsubT = onSnapshot(qT, (snapshot) => {
      const ts: TrainingSession[] = [];
      snapshot.forEach(doc => {
        ts.push({ id: doc.id, ...doc.data() } as TrainingSession);
      });
      setTrainings(ts);
    }, (error) => {
      console.error("Firebase sync error", error);
      setTrainings([
        { id: '1', title: 'Standard Pioneer Rigging & Ropes', date: '2026-08-20', time: '16:00', instructor: 'Advisor Ibrahim', targetAudience: 'Experienced Members', location: 'HQ Outdoors', status: 'Upcoming' },
        { id: '2', title: 'Introductory Rover Orientation & Squire Welcome', date: '2026-08-28', time: '19:30', instructor: 'Ahmed Nazih Nafiz', targetAudience: 'New Members', location: 'Hall B', status: 'Upcoming' }
      ]);
    });

    const qS = query(collection(db, 'progress_service'));
    const unsubS = onSnapshot(qS, (snapshot) => {
      const ss: ServiceProject[] = [];
      snapshot.forEach(doc => {
        ss.push({ id: doc.id, ...doc.data() } as ServiceProject);
      });
      setServiceLogs(ss);
    }, (error) => {
      console.error("Firebase sync error", error);
      setServiceLogs([
        { id: '1', title: 'Henveiru Beach Clean-up Campaign', date: '2026-08-10', participants: ['Zeeshan Ahmed', 'Ibrahim Manik'], hoursPerParticipant: 4, description: 'Collected 12 bags of microplastics and discarded fishing nets from public beach line.' },
        { id: '2', title: 'National Blood Donation Aid Mobilization', date: '2026-08-02', participants: ['Sana Ahmed', 'Zeeshan Ahmed'], hoursPerParticipant: 6, description: 'Assisted Thalassemia Center with registration queues and refreshments coordination.' }
      ]);
    });

    return () => {
      unsubMatrix();
      unsubT();
      unsubS();
    };
  }, []);

  const handleCreateTraining = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tTitle.trim() || !tDate) return;

    const tData = {
      title: tTitle.trim(),
      date: tDate,
      time: tTime || '16:00',
      instructor: tInstructor.trim() || 'Council Instructor',
      targetAudience: tAudience,
      location: tLoc.trim() || 'Council Room',
      status: 'Upcoming'
    };

    try {
      await addDoc(collection(db, 'progress_trainings'), tData);
      setIsAddTrainingOpen(false);
      setTTitle('');
    } catch (err) { console.error("Error", err); alert("Action failed."); }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sTitle.trim() || !sHours || sParticipants.length === 0) {
      alert('⚠️ Please provide a project title, service hours, and add at least one participant.');
      return;
    }

    const sData = {
      title: sTitle.trim(),
      date: sDate || new Date().toISOString().split('T')[0],
      participants: sParticipants,
      hoursPerParticipant: parseFloat(sHours),
      description: sDesc.trim()
    };

    try {
      await addDoc(collection(db, 'progress_service'), sData);
      
      // Update individual participant hours in the matrix
      for (const pName of sParticipants) {
        const match = memberMatrix.find(m => m.name?.toLowerCase() === pName?.toLowerCase());
        if (match) {
          await updateDoc(doc(db, 'progress_matrix', match.id), {
            serviceHours: match.serviceHours + parseFloat(sHours)
          });
        }
      }

      setIsAddServiceOpen(false);
      setSTitle('');
      setSParticipants([]);
    } catch (err) { console.error("Error", err); alert("Action failed."); }
  };

  const handleToggleBadge = async (mId: string, badgeName: string) => {
    const member = memberMatrix.find(m => m.id === mId);
    if (!member) return;

    const isCompleted = member.completedBadges.includes(badgeName);
    const updatedBadges = isCompleted 
      ? member.completedBadges.filter(b => b !== badgeName)
      : [...member.completedBadges, badgeName];

    try {
      await updateDoc(doc(db, 'progress_matrix', mId), {
        completedBadges: updatedBadges
      });
    } catch (err) { console.error("Error", err); alert("Action failed."); }
  };

  const handleAddParticipant = () => {
    if (!newParticipant.trim()) return;
    if (sParticipants.includes(newParticipant.trim())) return;
    setSParticipants(prev => [...prev, newParticipant.trim()]);
    setNewParticipant('');
  };

  const currentRolesList = [
    'Progress Coordinator',
    'Council Secretary',
    'Normal Rover Member',
    'Administrator'
  ];

  const roleLower = (currentRole || '').toLowerCase();
  const isAdvisor = roleLower.includes('advisor') || 
                    roleLower.includes('administrator') || 
                    roleLower.includes('ziyad');

  const hasRolePermission = pagePermissions?.some(p => 
    p.memberId && p.memberId.toLowerCase() === roleLower && p.grantedPages?.includes('progress')
  );

  const actualHasAccess = isAdvisor || hasRolePermission;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Award className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl font-bold text-[#0f1e36]">Progress & Onboarding Training</h1>
          </div>
          <p className="text-xs text-slate-500">Track Rover syllabus badges, schedule squire orientation sessions, and log community service.</p>
        </div>

        
      </div>

      {/* Role Access Info Banner for Normal Members */}
      {!actualHasAccess && (
        <div className="bg-[#eef2ff] border border-indigo-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-indigo-950">Read-Only Progress View</h4>
              <p className="text-[11px] text-indigo-800 leading-relaxed max-w-xl">
                As a normal member, you can review upcoming training courses and community service projects. Your syllabus badge matrix is in read-only format.
              </p>
            </div>
          </div>
        </div>
      )}


          {/* Tabs */}
          <div className="flex border-b border-slate-200 gap-1.5 bg-slate-100/55 p-1 rounded-xl max-w-lg">
            <button
              onClick={() => setActiveTab('matrix')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'matrix'
                  ? 'bg-white text-[#1e40af] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Activity className="w-4 h-4" />
              Syllabus Matrix
            </button>
            <button
              onClick={() => setActiveTab('trainings')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'trainings'
                  ? 'bg-white text-[#1e40af] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Training Scheduler
            </button>
            <button
              onClick={() => setActiveTab('service')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'service'
                  ? 'bg-white text-[#1e40af] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Clock className="w-4 h-4" />
              Service Logger
            </button>
          </div>

          {/* Matrix View */}
          {activeTab === 'matrix' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Rover & Squire Progression Matrix</h2>
                  <p className="text-xs text-slate-500">Track and award official badges and review individual service milestones.</p>
                </div>
              </div>

              {/* Progress Table */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="p-4">Name / Crew</th>
                      <th className="p-4">Rank Role</th>
                      <th className="p-4">Merit Badges Earned</th>
                      <th className="p-4">Logged Service</th>
                      <th className="p-4 text-center">Badges Achievement Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {memberMatrix.map((m) => {
                      const badgeRate = Math.round((m.completedBadges.length / BADGES_POOL.length) * 100);

                      return (
                        <tr key={m.id} className="hover:bg-slate-50/55 transition-colors">
                          <td className="p-4">
                            <div className="font-bold text-slate-900">{m.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{m.crew}</div>
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                              m.role === 'Rover' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {m.role}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {BADGES_POOL.map((badge) => {
                                const isEarned = m.completedBadges.includes(badge);
                                return (
                                  <button
                                    key={badge}
                                    onClick={() => actualHasAccess && handleToggleBadge(m.id, badge)}
                                    title={actualHasAccess ? `Click to toggle ${badge}` : `${badge} (${isEarned ? 'Earned' : 'Not earned'})`}
                                    className={`px-2 py-1 rounded text-[10px] font-semibold border transition-all ${
                                      actualHasAccess ? 'cursor-pointer hover:bg-slate-100' : 'cursor-default'
                                    } ${
                                      isEarned 
                                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                                        : 'bg-slate-50 text-slate-400 border-slate-200'
                                    }`}
                                  >
                                    {badge} {isEarned ? '✓' : '+'}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                          <td className="p-4 font-bold text-slate-700">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-indigo-600" /> {m.serviceHours} Hours
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <div className="inline-flex items-center gap-2">
                              <span className="font-black text-slate-900">{badgeRate}%</span>
                              <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-600" style={{ width: `${badgeRate}%` }} />
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Trainings View */}
          {activeTab === 'trainings' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Training & Onboarding Calendar</h2>
                  <p className="text-xs text-slate-500">Plan and schedule educational modules for new recruits and advanced candidates.</p>
                </div>
              {actualHasAccess && (
                <button
                  onClick={() => setIsAddTrainingOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" /> Schedule Training Session
                </button>
              )}
              </div>

              {/* Trainings grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {trainings.map((t) => (
                  <div key={t.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex justify-between gap-6">
                    <div className="space-y-4 flex-1">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md uppercase tracking-wider">{t.targetAudience}</span>
                        <h3 className="text-sm font-bold text-slate-900 mt-2">{t.title}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">By Lead: {t.instructor}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 pt-3 border-t border-slate-50">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-indigo-600" />
                          <span>{t.date} @ {t.time}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-indigo-600" />
                          <span className="truncate">{t.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px] uppercase tracking-wider px-2.5 py-0.5 rounded-lg">
                        {t.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Service Log Tab */}
          {activeTab === 'service' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">Community Service Logs</h2>
                  <p className="text-xs text-slate-500">Log service campaigns, record participating members, and accumulate total hours.</p>
                </div>
              {actualHasAccess && (
                <button
                  onClick={() => setIsAddServiceOpen(true)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" /> Log Service Project
                </button>
              )}
              </div>

              {/* Service list */}
              <div className="space-y-4">
                {serviceLogs.map((s) => (
                  <div key={s.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900">{s.title}</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Logged: {s.date} • {s.hoursPerParticipant} Hours per participant</p>
                      </div>
                      <span className="bg-purple-50 text-purple-700 border border-purple-100 font-bold text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider">
                        Community Impact
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-medium">{s.description}</p>

                    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-50">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mr-1.5 self-center">Participants:</span>
                      {s.participants.map((p, i) => (
                        <span key={i} className="bg-slate-100 text-slate-800 rounded-lg px-2.5 py-0.5 text-xs font-semibold">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
  

      {/* Schedule Training Modal */}
      {isAddTrainingOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-6">
            <h2 className="text-base font-bold text-slate-900">Schedule Training Session</h2>
            <form onSubmit={handleCreateTraining} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Session Title</label>
                <input
                  type="text"
                  required
                  value={tTitle}
                  onChange={(e) => setTTitle(e.target.value)}
                  placeholder="e.g. Map Reading & Orienteering Mastery"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={tDate}
                    onChange={(e) => setTDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Time</label>
                  <input
                    type="time"
                    required
                    value={tTime}
                    onChange={(e) => setTTime(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Instructor / Lead</label>
                  <input
                    type="text"
                    required
                    value={tInstructor}
                    onChange={(e) => setTInstructor(e.target.value)}
                    placeholder="e.g. Advisor Manik"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Target Audience</label>
                  <select
                    value={tAudience}
                    onChange={(e) => setTAudience(e.target.value as any)}
                    className="w-full px-2.5 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none"
                  >
                    <option value="All">All Members</option>
                    <option value="New Members">New recruits / Squires</option>
                    <option value="Experienced Members">Experienced Rovers</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Location / Classroom</label>
                <input
                  type="text"
                  required
                  value={tLoc}
                  onChange={(e) => setTLoc(e.target.value)}
                  placeholder="e.g. Headquarters Garden Area"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddTrainingOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-indigo-700"
                >
                  Schedule Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Service Project Modal */}
      {isAddServiceOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-6">
            <h2 className="text-base font-bold text-slate-900">Log Community Service Project</h2>
            <form onSubmit={handleCreateService} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Project Name / Activity</label>
                <input
                  type="text"
                  required
                  value={sTitle}
                  onChange={(e) => setSTitle(e.target.value)}
                  placeholder="e.g. Island Tree Planting Outing"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={sDate}
                    onChange={(e) => setSDate(e.target.value)}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Hours per Participant</label>
                  <input
                    type="number"
                    required
                    value={sHours}
                    onChange={(e) => setSHours(e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Impact Description</label>
                <textarea
                  required
                  value={sDesc}
                  onChange={(e) => setSDesc(e.target.value)}
                  rows={3}
                  placeholder="Summarize the scope and environmental or social impact..."
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none"
                />
              </div>

              {/* Participant add list */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Add Participating Members</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newParticipant}
                    onChange={(e) => setNewParticipant(e.target.value)}
                    placeholder="e.g. Zeeshan Ahmed"
                    className="flex-1 px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddParticipant}
                    className="px-3 py-2 bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1 pt-2">
                  {sParticipants.map((p, i) => (
                    <span key={i} className="bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md px-2 py-0.5 text-xs font-bold flex items-center gap-1">
                      {p}
                      <button 
                        type="button" 
                        onClick={() => setSParticipants(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-red-500 font-bold ml-1"
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
                  onClick={() => setIsAddServiceOpen(false)}
                  className="px-3.5 py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-indigo-700"
                >
                  Log Impact Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
