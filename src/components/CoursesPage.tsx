import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Award, 
  BookOpen, 
  CheckSquare, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  FileText, 
  Download, 
  Compass, 
  Trophy, 
  ShieldCheck, 
  Plus, 
  Search, 
  Sparkles, 
  ChevronRight, 
  ChevronDown, 
  Upload, 
  X, 
  Video, 
  Layers, 
  MessageSquare, 
  Printer, 
  Check, 
  UserCheck, 
  Eye, 
  HelpCircle, 
  FileCheck,
  Flame,
  Shield,
  Trash2,
  Edit,
  FolderPlus,
  AlertTriangle
} from 'lucide-react';
import { collection, query, getDocs, doc, setDoc, deleteDoc, updateDoc, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

// ---------------------------------------------------------------------------
// DATA INTERFACES
// ---------------------------------------------------------------------------
export interface MasterTrack {
  id: string;
  title: string;
  description: string;
  category: 'Award Scheme' | 'Leadership' | 'Outdoors' | 'Specialty' | 'Custom Scheme';
  iconName: string;
  totalBadges: number;
}

export interface BadgeStep {
  id: string;
  trackId: string;
  title: string;
  description: string;
  level: 'Bronze' | 'Silver' | 'Gold' | 'Master';
  estimatedHours: number;
  badgeColor: string;
}

export interface TaskSkill {
  id: string;
  badgeId: string;
  title: string;
  description: string;
  category: string;
  guide: {
    steps: string[];
    diagramType?: 'bowline' | 'square_lashing' | 'clove_hitch' | 'figure_eight' | 'compass';
    tips?: string;
    videoTitle?: string;
  };
  resources?: {
    title: string;
    type: 'PDF' | 'Logbook Template' | 'Consent Form' | 'Guide Sheet';
    size: string;
  }[];
}

export interface FieldLogSubmission {
  id: string;
  userId: string;
  userName: string;
  badgeId: string;
  badgeTitle: string;
  taskId?: string;
  taskTitle?: string;
  logNotes: string;
  attachmentName?: string;
  attachmentType?: 'photo' | 'diagram' | 'pdf';
  status: 'pending' | 'approved' | 'rejected';
  leaderFeedback?: string;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface QuickQuiz {
  id: string;
  badgeId: string;
  title: string;
  questions: {
    id: string;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
}

export interface TestBooking {
  id: string;
  userId: string;
  userName: string;
  badgeId: string;
  badgeTitle: string;
  assessorName: string;
  date: string;
  time: string;
  location: string;
  notes: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
}

export interface CertificateItem {
  id: string;
  userId: string;
  userName: string;
  badgeTitle: string;
  trackTitle: string;
  issuedDate: string;
  verificationCode: string;
}

interface CoursesPageProps {
  isAdmin: boolean;
  currentUser: any;
  pagePermissions: any[];
}

// ---------------------------------------------------------------------------
// DEFAULT INITIAL SEEDS
// ---------------------------------------------------------------------------
const DEFAULT_TRACKS: MasterTrack[] = [
  {
    id: 'track-1',
    title: "President's Scout Award Scheme",
    description: "The pinnacle Scouting achievement demonstrating national leadership, survival mastery, and community service.",
    category: 'Award Scheme',
    iconName: 'Trophy',
    totalBadges: 4
  },
  {
    id: 'track-2',
    title: 'Rover Pioneer & Campcraft Scheme',
    description: "Practical engineering, knotwork, rigging, and wilderness campsite management skills.",
    category: 'Outdoors',
    iconName: 'Flame',
    totalBadges: 3
  },
  {
    id: 'track-3',
    title: 'Venturer Leadership & Governance Track',
    description: "Council administration, expedition organizing, financial management, and youth mentoring.",
    category: 'Leadership',
    iconName: 'Shield',
    totalBadges: 3
  }
];

const DEFAULT_BADGES: BadgeStep[] = [
  {
    id: 'badge-101',
    trackId: 'track-1',
    title: 'First Aid & Emergency Lifesaving Badge',
    description: 'Master CPR, fracture stabilization, wilderness triage, and evacuation procedures.',
    level: 'Silver',
    estimatedHours: 12,
    badgeColor: 'emerald'
  },
  {
    id: 'badge-102',
    trackId: 'track-1',
    title: 'Navigation & Orienteering Milestone',
    description: 'Topographic map interpretation, magnetic declination adjustment, and night compass navigation.',
    level: 'Gold',
    estimatedHours: 16,
    badgeColor: 'amber'
  },
  {
    id: 'badge-201',
    trackId: 'track-2',
    title: 'Campcraft & Pioneering Step',
    description: 'Construct timber towers, splice heavy manila ropes, and execute open-fire cooking.',
    level: 'Bronze',
    estimatedHours: 10,
    badgeColor: 'blue'
  },
  {
    id: 'badge-301',
    trackId: 'track-3',
    title: 'Citizenship & Community Service Badge',
    description: 'Organize environmental cleanup campaigns and execute public service initiatives.',
    level: 'Master',
    estimatedHours: 20,
    badgeColor: 'purple'
  }
];

const DEFAULT_TASKS: TaskSkill[] = [
  {
    id: 'task-1',
    badgeId: 'badge-201',
    title: 'Tie a Rescue Bowline Knot',
    description: 'Tie a non-slip loop at the end of a rope suitable for hoisting or securing personnel.',
    category: 'Practical',
    guide: {
      steps: [
        'Form a small loop ("the rabbit hole") in the standing line.',
        'Pass the working end ("the rabbit") up through the loop from beneath.',
        'Wrap the working end around behind the standing part ("around the tree").',
        'Feed the working end back down through the loop.',
        'Pull the standing line and loop tight to set the knot.'
      ],
      diagramType: 'bowline',
      tips: 'Remember the classic phrase: "The rabbit comes out of the hole, goes around the tree, and back into the hole."',
      videoTitle: 'Video Tutorial: Master Bowline in Under 10 Seconds'
    },
    resources: [
      { title: 'Knotcraft Reference Sheet (PDF)', type: 'PDF', size: '1.2 MB' },
      { title: 'Pioneering Field Logbook Template', type: 'Logbook Template', size: '450 KB' }
    ]
  },
  {
    id: 'task-2',
    badgeId: 'badge-201',
    title: 'Construct a Timber Signal Tower',
    description: 'Assemble a 3-meter tripod signal tower using square lashings and shear lashings.',
    category: 'Practical',
    guide: {
      steps: [
        'Select 3 straight timber spars of equal length (minimum 3m).',
        'Lay spars parallel and bind top using a tight tripod lashing.',
        'Spread the tripod legs evenly in an equilateral triangle base.',
        'Attach cross-braces using square lashings at 1-meter elevation intervals.',
        'Test stability under load using safety guy-lines.'
      ],
      diagramType: 'square_lashing',
      tips: 'Ensure wooden spars are dry to prevent slipping under tension.',
      videoTitle: 'Signal Tower Assembly Guidelines'
    },
    resources: [
      { title: 'Tower Safety & Rigging Standard', type: 'PDF', size: '2.4 MB' },
      { title: 'Parental Consent & Safety Release Form', type: 'Consent Form', size: '320 KB' }
    ]
  },
  {
    id: 'task-3',
    badgeId: 'badge-102',
    title: 'Orient Topographic Map to True North',
    description: 'Align a 1:25,000 scale Ordnance Survey map using a Silva sighting compass.',
    category: 'Fieldwork',
    guide: {
      steps: [
        'Place compass flat on the map with the direction-of-travel arrow pointing toward top of map.',
        'Rotate compass housing so orienting lines align with map grid north lines.',
        'Set magnetic declination offset (e.g. +3° East).',
        'Rotate map and compass together until magnetic needle aligns with the orienting arrow.'
      ],
      diagramType: 'compass',
      tips: 'Keep away from metal objects, vehicles, or wristwatches while taking compass bearings.',
      videoTitle: 'Topographic Navigation 101'
    },
    resources: [
      { title: 'Orienteering Grid Reference Guide', type: 'Guide Sheet', size: '890 KB' }
    ]
  }
];

const DEFAULT_QUIZ: QuickQuiz = {
  id: 'quiz-102',
  badgeId: 'badge-102',
  title: 'Compass Points & Topographic Navigation Test',
  questions: [
    {
      id: 'q1',
      question: 'What is the standard magnetic declination adjustment when reading grid north on a 1:25000 map?',
      options: [
        'Add or subtract local magnetic variance relative to grid north',
        'Always add exactly 15 degrees regardless of region',
        'Ignore magnetic needle deviations on land',
        'Set compass housing to 180 degrees south'
      ],
      correctIndex: 0,
      explanation: 'Magnetic variance changes based on geographical coordinates and year, so you must adjust for local declination.'
    },
    {
      id: 'q2',
      question: 'Which knot is universally recommended for creating a secure, non-slip loop in a rescue line?',
      options: ['Granny Knot', 'Bowline Knot', 'Slip Knot', 'Reef Knot'],
      correctIndex: 1,
      explanation: 'The Bowline knot creates a fixed, secure loop that does not slip or bind under load.'
    }
  ]
};

// ---------------------------------------------------------------------------
// MAIN COMPONENT
// ---------------------------------------------------------------------------
export const CoursesPage: React.FC<CoursesPageProps> = ({ isAdmin, currentUser, pagePermissions }) => {
  // Navigation Tabs
  const [mainTab, setMainTab] = useState<'tracks' | 'progress' | 'testing' | 'trophy' | 'manager'>('tracks');

  // Firestore Sync States
  const [tracks, setTracks] = useState<MasterTrack[]>([]);
  const [badges, setBadges] = useState<BadgeStep[]>([]);
  const [tasks, setTasks] = useState<TaskSkill[]>([]);
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [fieldLogs, setFieldLogs] = useState<FieldLogSubmission[]>([]);
  const [bookings, setBookings] = useState<TestBooking[]>([]);
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);

  // Active Selections
  const [selectedTrack, setSelectedTrack] = useState<MasterTrack | null>(null);
  const [selectedBadge, setSelectedBadge] = useState<BadgeStep | null>(null);
  const [selectedTaskGuide, setSelectedTaskGuide] = useState<TaskSkill | null>(null);

  // Custom Track / Scheme Modal States
  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<MasterTrack | null>(null);
  const [trackFormTitle, setTrackFormTitle] = useState('');
  const [trackFormDesc, setTrackFormDesc] = useState('');
  const [trackFormCat, setTrackFormCat] = useState<'Award Scheme' | 'Leadership' | 'Outdoors' | 'Specialty' | 'Custom Scheme'>('Custom Scheme');

  // Custom Badge Modal States
  const [isBadgeModalOpen, setIsBadgeModalOpen] = useState(false);
  const [editingBadge, setEditingBadge] = useState<BadgeStep | null>(null);
  const [badgeFormTitle, setBadgeFormTitle] = useState('');
  const [badgeFormDesc, setBadgeFormDesc] = useState('');
  const [badgeFormLevel, setBadgeFormLevel] = useState<'Bronze' | 'Silver' | 'Gold' | 'Master'>('Silver');
  const [badgeFormHours, setBadgeFormHours] = useState('12');

  // Custom Task Modal States
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskSkill | null>(null);
  const [taskFormTitle, setTaskFormTitle] = useState('');
  const [taskFormDesc, setTaskFormDesc] = useState('');
  const [taskFormCat, setTaskFormCat] = useState('Practical');
  const [taskFormSteps, setTaskFormSteps] = useState('');
  const [taskFormTips, setTaskFormTips] = useState('');

  // Delete Confirmation Modal State
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'track' | 'badge' | 'task';
    id: string;
    title: string;
    category?: string;
    warning: string;
  } | null>(null);

  // Field Log Form State
  const [logNotes, setLogNotes] = useState('');
  const [logTaskTitle, setLogTaskTitle] = useState('General Field Report');
  const [logAttachmentName, setLogAttachmentName] = useState('');
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Quick Quiz State
  const [activeQuiz, setActiveQuiz] = useState<QuickQuiz | null>(DEFAULT_QUIZ);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);

  // Booking Form State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookBadgeTitle, setBookBadgeTitle] = useState('');
  const [bookAssessor, setBookAssessor] = useState('Scouter Ibrahim Manik');
  const [bookDate, setBookDate] = useState('2026-08-25');
  const [bookTime, setBookTime] = useState('16:00');
  const [bookLocation, setBookLocation] = useState('Council HQ Panel Room');

  // Certificate Modal State
  const [activeCert, setActiveCert] = useState<CertificateItem | null>(null);

  const userId = currentUser?.id || 'm-current-user';
  const userName = currentUser?.name || 'Rover Scout Member';

  // Role Permissions
  const currentRole = currentUser?.role || '';
  const roleLower = currentRole.toLowerCase();
  const isLeaderOrAdmin = isAdmin || 
    roleLower.includes('advisor') || 
    roleLower.includes('leader') || 
    roleLower.includes('administrator') || 
    roleLower.includes('ziyad');

  // ---------------------------------------------------------------------------
  // FIRESTORE & LOCAL STORAGE SYNC
  // ---------------------------------------------------------------------------
  useEffect(() => {
    // 0. Load cached data from localStorage first
    const cachedTracks = localStorage.getItem('portal_course_tracks');
    const cachedBadges = localStorage.getItem('portal_course_badges');
    const cachedTasks = localStorage.getItem('portal_course_tasks');
    const isInitialized = localStorage.getItem('portal_courses_initialized');

    if (cachedTracks) {
      try {
        const parsed = JSON.parse(cachedTracks);
        if (Array.isArray(parsed)) setTracks(parsed);
      } catch (e) {
        setTracks(DEFAULT_TRACKS);
      }
    } else {
      setTracks(DEFAULT_TRACKS);
    }

    if (cachedBadges) {
      try {
        const parsed = JSON.parse(cachedBadges);
        if (Array.isArray(parsed)) setBadges(parsed);
      } catch (e) {
        setBadges(DEFAULT_BADGES);
      }
    } else {
      setBadges(DEFAULT_BADGES);
    }

    if (cachedTasks) {
      try {
        const parsed = JSON.parse(cachedTasks);
        if (Array.isArray(parsed)) setTasks(parsed);
      } catch (e) {
        setTasks(DEFAULT_TASKS);
      }
    } else {
      setTasks(DEFAULT_TASKS);
    }

    // 1. Tracks onSnapshot
    const unsubTracks = onSnapshot(collection(db, 'course_tracks'), (snap) => {
      if (!snap.empty) {
        const list: MasterTrack[] = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() } as MasterTrack));
        setTracks(list);
        localStorage.setItem('portal_course_tracks', JSON.stringify(list));
        localStorage.setItem('portal_courses_initialized', 'true');
      } else if (!isInitialized && !cachedTracks) {
        setTracks(DEFAULT_TRACKS);
        localStorage.setItem('portal_course_tracks', JSON.stringify(DEFAULT_TRACKS));
        localStorage.setItem('portal_courses_initialized', 'true');
        DEFAULT_TRACKS.forEach(tr => {
          setDoc(doc(db, 'course_tracks', tr.id), tr).catch(() => {});
        });
      }
    }, (err) => {
      console.warn('Tracks listener active in offline mode:', err);
    });

    // 2. Badges onSnapshot
    const unsubBadges = onSnapshot(collection(db, 'course_badges'), (snap) => {
      if (!snap.empty) {
        const list: BadgeStep[] = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() } as BadgeStep));
        setBadges(list);
        localStorage.setItem('portal_course_badges', JSON.stringify(list));
      } else if (!isInitialized && !cachedBadges) {
        setBadges(DEFAULT_BADGES);
        localStorage.setItem('portal_course_badges', JSON.stringify(DEFAULT_BADGES));
        DEFAULT_BADGES.forEach(bg => {
          setDoc(doc(db, 'course_badges', bg.id), bg).catch(() => {});
        });
      }
    }, (err) => {
      console.warn('Badges listener active in offline mode:', err);
    });

    // 3. Tasks onSnapshot
    const unsubTasks = onSnapshot(collection(db, 'course_tasks'), (snap) => {
      if (!snap.empty) {
        const list: TaskSkill[] = [];
        snap.forEach(d => list.push({ id: d.id, ...d.data() } as TaskSkill));
        setTasks(list);
        localStorage.setItem('portal_course_tasks', JSON.stringify(list));
      } else if (!isInitialized && !cachedTasks) {
        setTasks(DEFAULT_TASKS);
        localStorage.setItem('portal_course_tasks', JSON.stringify(DEFAULT_TASKS));
        DEFAULT_TASKS.forEach(tk => {
          setDoc(doc(db, 'course_tasks', tk.id), tk).catch(() => {});
        });
      }
    }, (err) => {
      console.warn('Tasks listener active in offline mode:', err);
    });

    // 4. User Skill Progress
    const unsubProgress = onSnapshot(collection(db, 'user_skill_progress'), (snap) => {
      const completed: string[] = [];
      snap.forEach(d => {
        const data = d.data();
        if (data.userId === userId && data.completed) {
          completed.push(data.taskId);
        }
      });
      setCompletedTaskIds(completed);
    }, () => setCompletedTaskIds([]));

    // 5. Field Logs
    const unsubLogs = onSnapshot(collection(db, 'user_field_logs'), (snap) => {
      const logsList: FieldLogSubmission[] = [];
      snap.forEach(d => logsList.push({ id: d.id, ...d.data() } as FieldLogSubmission));
      setFieldLogs(logsList);
    }, () => setFieldLogs([]));

    // 6. Test Bookings
    const unsubBookings = onSnapshot(collection(db, 'test_bookings'), (snap) => {
      const bList: TestBooking[] = [];
      snap.forEach(d => bList.push({ id: d.id, ...d.data() } as TestBooking));
      setBookings(bList);
    }, () => setBookings([]));

    // 7. Certificates
    const unsubCerts = onSnapshot(collection(db, 'user_certificates'), (snap) => {
      const cList: CertificateItem[] = [];
      snap.forEach(d => cList.push({ id: d.id, ...d.data() } as CertificateItem));
      setCertificates(cList);
    }, () => setCertificates([]));

    return () => {
      unsubTracks();
      unsubBadges();
      unsubTasks();
      unsubProgress();
      unsubLogs();
      unsubBookings();
      unsubCerts();
    };
  }, [userId]);

  // Default selection initialization
  useEffect(() => {
    if (tracks.length > 0) {
      if (!selectedTrack || !tracks.some(t => t.id === selectedTrack.id)) {
        setSelectedTrack(tracks[0]);
      }
    } else {
      setSelectedTrack(null);
    }
  }, [tracks, selectedTrack]);

  useEffect(() => {
    if (selectedTrack) {
      const trackBadges = badges.filter(b => b.trackId === selectedTrack.id);
      if (trackBadges.length > 0) {
        if (!selectedBadge || !trackBadges.some(b => b.id === selectedBadge.id)) {
          setSelectedBadge(trackBadges[0]);
        }
      } else {
        setSelectedBadge(null);
      }
    } else {
      setSelectedBadge(null);
    }
  }, [selectedTrack, badges, selectedBadge]);

  // ---------------------------------------------------------------------------
  // HANDLERS - CUSTOM TRACK, BADGE & TASK MANAGEMENT
  // ---------------------------------------------------------------------------
  const handleOpenTrackModal = (trackToEdit?: MasterTrack) => {
    if (trackToEdit) {
      setEditingTrack(trackToEdit);
      setTrackFormTitle(trackToEdit.title);
      setTrackFormDesc(trackToEdit.description);
      setTrackFormCat(trackToEdit.category);
    } else {
      setEditingTrack(null);
      setTrackFormTitle('');
      setTrackFormDesc('');
      setTrackFormCat('Custom Scheme');
    }
    setIsTrackModalOpen(true);
  };

  const handleSaveTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackFormTitle.trim()) return;

    const trackId = editingTrack ? editingTrack.id : `track_${Date.now()}`;
    const trackData: MasterTrack = {
      id: trackId,
      title: trackFormTitle.trim(),
      description: trackFormDesc.trim() || 'Custom Scout Qualification Scheme',
      category: trackFormCat,
      iconName: editingTrack?.iconName || 'Award',
      totalBadges: editingTrack ? editingTrack.totalBadges : 0
    };

    // 1. Optimistic Local State & LocalStorage Update
    setTracks(prev => {
      const exists = prev.some(t => t.id === trackId);
      const updated = exists ? prev.map(t => t.id === trackId ? trackData : t) : [...prev, trackData];
      localStorage.setItem('portal_course_tracks', JSON.stringify(updated));
      localStorage.setItem('portal_courses_initialized', 'true');
      return updated;
    });

    setSelectedTrack(trackData);
    setIsTrackModalOpen(false);
    setEditingTrack(null);
    setTrackFormTitle('');
    setTrackFormDesc('');

    // 2. Sync to Cloud Firestore
    try {
      await setDoc(doc(db, 'course_tracks', trackId), trackData);
    } catch (err) {
      console.warn('Track saved locally. Cloud sync pending:', err);
    }
  };

  // Prompt Delete Handlers (Opens in-app confirmation modal)
  const handleDeleteTrack = (trackId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const targetTrack = tracks.find(t => t.id === trackId);
    const trackTitle = targetTrack?.title || 'this scheme';
    setDeleteConfirm({
      isOpen: true,
      type: 'track',
      id: trackId,
      title: trackTitle,
      category: targetTrack?.category || 'Master Scheme',
      warning: 'This will permanently delete this Master Track / Qualification Scheme, all of its course milestone badges, and all associated practical tasks.'
    });
  };

  const handleOpenBadgeModal = (badgeToEdit?: BadgeStep) => {
    if (badgeToEdit) {
      setEditingBadge(badgeToEdit);
      setBadgeFormTitle(badgeToEdit.title);
      setBadgeFormDesc(badgeToEdit.description);
      setBadgeFormLevel(badgeToEdit.level);
      setBadgeFormHours(String(badgeToEdit.estimatedHours));
    } else {
      setEditingBadge(null);
      setBadgeFormTitle('');
      setBadgeFormDesc('');
      setBadgeFormLevel('Silver');
      setBadgeFormHours('12');
    }
    setIsBadgeModalOpen(true);
  };

  const handleSaveBadge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!badgeFormTitle.trim() || !selectedTrack) return;

    const badgeId = editingBadge ? editingBadge.id : `badge_${Date.now()}`;
    const badgeData: BadgeStep = {
      id: badgeId,
      trackId: selectedTrack.id,
      title: badgeFormTitle.trim(),
      description: badgeFormDesc.trim() || 'Required milestone requirement.',
      level: badgeFormLevel,
      estimatedHours: parseInt(badgeFormHours) || 10,
      badgeColor: badgeFormLevel === 'Gold' ? 'amber' : badgeFormLevel === 'Silver' ? 'emerald' : 'blue'
    };

    // 1. Optimistic Local State & LocalStorage Update
    setBadges(prev => {
      const exists = prev.some(b => b.id === badgeId);
      const updated = exists ? prev.map(b => b.id === badgeId ? badgeData : b) : [...prev, badgeData];
      localStorage.setItem('portal_course_badges', JSON.stringify(updated));
      return updated;
    });

    setSelectedBadge(badgeData);
    setIsBadgeModalOpen(false);
    setEditingBadge(null);

    // 2. Sync to Cloud Firestore
    try {
      await setDoc(doc(db, 'course_badges', badgeId), badgeData);
    } catch (err) {
      console.warn('Badge saved locally. Cloud sync pending:', err);
    }
  };

  const handleDeleteBadge = (badgeId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const targetBadge = badges.find(b => b.id === badgeId);
    const badgeTitle = targetBadge?.title || 'this badge/course';
    setDeleteConfirm({
      isOpen: true,
      type: 'badge',
      id: badgeId,
      title: badgeTitle,
      category: targetBadge?.level ? `${targetBadge.level} Badge` : 'Milestone Badge',
      warning: 'This will permanently delete this course milestone badge and all of its associated skill checklist tasks.'
    });
  };

  const handleOpenTaskModal = (taskToEdit?: TaskSkill) => {
    if (taskToEdit) {
      setEditingTask(taskToEdit);
      setTaskFormTitle(taskToEdit.title);
      setTaskFormDesc(taskToEdit.description);
      setTaskFormCat(taskToEdit.category);
      setTaskFormSteps(taskToEdit.guide?.steps?.join('\n') || '');
      setTaskFormTips(taskToEdit.guide?.tips || '');
    } else {
      setEditingTask(null);
      setTaskFormTitle('');
      setTaskFormDesc('');
      setTaskFormCat('Practical');
      setTaskFormSteps('');
      setTaskFormTips('');
    }
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskFormTitle.trim() || !selectedBadge) return;

    const taskId = editingTask ? editingTask.id : `task_${Date.now()}`;
    const stepsArray = taskFormSteps.split('\n').map(s => s.trim()).filter(Boolean);

    const taskData: TaskSkill = {
      id: taskId,
      badgeId: selectedBadge.id,
      title: taskFormTitle.trim(),
      description: taskFormDesc.trim() || 'Practical requirement item.',
      category: taskFormCat,
      guide: {
        steps: stepsArray.length > 0 ? stepsArray : ['Follow standard Rover field manual guidelines.'],
        tips: taskFormTips.trim()
      }
    };

    // 1. Optimistic Local State & LocalStorage Update
    setTasks(prev => {
      const exists = prev.some(t => t.id === taskId);
      const updated = exists ? prev.map(t => t.id === taskId ? taskData : t) : [...prev, taskData];
      localStorage.setItem('portal_course_tasks', JSON.stringify(updated));
      return updated;
    });

    setIsTaskModalOpen(false);
    setEditingTask(null);

    // 2. Sync to Cloud Firestore
    try {
      await setDoc(doc(db, 'course_tasks', taskId), taskData);
    } catch (err) {
      console.warn('Task saved locally. Cloud sync pending:', err);
    }
  };

  const handleDeleteTask = (taskId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const targetTask = tasks.find(t => t.id === taskId);
    const taskTitle = targetTask?.title || 'this task';
    setDeleteConfirm({
      isOpen: true,
      type: 'task',
      id: taskId,
      title: taskTitle,
      category: targetTask?.category ? `${targetTask.category} Task` : 'Practical Task',
      warning: 'This will permanently delete this skill checklist requirement item.'
    });
  };

  // Execution handler called when user clicks "Confirm Delete" in the dialog
  const handleExecuteDelete = async () => {
    if (!deleteConfirm) return;
    const { type, id } = deleteConfirm;

    if (type === 'track') {
      const trackId = id;
      // 1. Update state & localStorage
      const remainingTracks = tracks.filter(t => t.id !== trackId);
      setTracks(remainingTracks);
      localStorage.setItem('portal_course_tracks', JSON.stringify(remainingTracks));
      localStorage.setItem('portal_courses_initialized', 'true');

      // Cascade delete child badges
      const childBadges = badges.filter(b => b.trackId === trackId);
      const childBadgeIds = childBadges.map(b => b.id);
      const remainingBadges = badges.filter(b => b.trackId !== trackId);
      setBadges(remainingBadges);
      localStorage.setItem('portal_course_badges', JSON.stringify(remainingBadges));

      // Cascade delete child tasks
      const remainingTasks = tasks.filter(t => !childBadgeIds.includes(t.badgeId));
      setTasks(remainingTasks);
      localStorage.setItem('portal_course_tasks', JSON.stringify(remainingTasks));

      // Update active selection
      if (selectedTrack?.id === trackId) {
        const nextTrack = remainingTracks.length > 0 ? remainingTracks[0] : null;
        setSelectedTrack(nextTrack);
        if (nextTrack) {
          const nextBadges = remainingBadges.filter(b => b.trackId === nextTrack.id);
          setSelectedBadge(nextBadges.length > 0 ? nextBadges[0] : null);
        } else {
          setSelectedBadge(null);
        }
      }

      if (editingTrack?.id === trackId) {
        setIsTrackModalOpen(false);
        setEditingTrack(null);
      }

      // 2. Sync deletion to Cloud Firestore
      try {
        await deleteDoc(doc(db, 'course_tracks', trackId));
        for (const bId of childBadgeIds) {
          await deleteDoc(doc(db, 'course_badges', bId));
        }
        for (const task of tasks.filter(t => childBadgeIds.includes(t.badgeId))) {
          await deleteDoc(doc(db, 'course_tasks', task.id));
        }
      } catch (err) {
        console.warn('Track deleted locally. Cloud deletion pending:', err);
      }
    } else if (type === 'badge') {
      const badgeId = id;
      // 1. Update state & localStorage
      const remainingBadges = badges.filter(b => b.id !== badgeId);
      setBadges(remainingBadges);
      localStorage.setItem('portal_course_badges', JSON.stringify(remainingBadges));

      const childTasks = tasks.filter(t => t.badgeId === badgeId);
      const remainingTasks = tasks.filter(t => t.badgeId !== badgeId);
      setTasks(remainingTasks);
      localStorage.setItem('portal_course_tasks', JSON.stringify(remainingTasks));

      if (selectedBadge?.id === badgeId) {
        const remainingInTrack = remainingBadges.filter(b => b.trackId === selectedTrack?.id);
        setSelectedBadge(remainingInTrack.length > 0 ? remainingInTrack[0] : null);
      }

      if (editingBadge?.id === badgeId) {
        setIsBadgeModalOpen(false);
        setEditingBadge(null);
      }

      // 2. Sync to Cloud Firestore
      try {
        await deleteDoc(doc(db, 'course_badges', badgeId));
        for (const task of childTasks) {
          await deleteDoc(doc(db, 'course_tasks', task.id));
        }
      } catch (err) {
        console.warn('Badge deleted locally. Cloud deletion pending:', err);
      }
    } else if (type === 'task') {
      const taskId = id;
      // 1. Update state & localStorage
      const remainingTasks = tasks.filter(t => t.id !== taskId);
      setTasks(remainingTasks);
      localStorage.setItem('portal_course_tasks', JSON.stringify(remainingTasks));

      if (selectedTaskGuide?.id === taskId) {
        setSelectedTaskGuide(null);
      }

      if (editingTask?.id === taskId) {
        setIsTaskModalOpen(false);
        setEditingTask(null);
      }

      // 2. Sync to Cloud Firestore
      try {
        await deleteDoc(doc(db, 'course_tasks', taskId));
      } catch (err) {
        console.warn('Task deleted locally. Cloud deletion pending:', err);
      }
    }

    setDeleteConfirm(null);
  };

  // Skill Check Toggle
  const handleToggleTask = async (taskId: string, badgeId: string) => {
    const isDone = completedTaskIds.includes(taskId);
    const docId = `${userId}_${taskId}`;

    try {
      if (isDone) {
        await deleteDoc(doc(db, 'user_skill_progress', docId));
        setCompletedTaskIds(prev => prev.filter(id => id !== taskId));
      } else {
        await setDoc(doc(db, 'user_skill_progress', docId), {
          userId,
          taskId,
          badgeId,
          completed: true,
          completedAt: new Date().toISOString()
        });
        setCompletedTaskIds(prev => [...prev, taskId]);

        // Auto Certificate Generation on completion
        const badgeTasks = tasks.filter(t => t.badgeId === badgeId);
        const newlyCompletedCount = completedTaskIds.filter(id => badgeTasks.some(bt => bt.id === id)).length + 1;
        if (badgeTasks.length > 0 && newlyCompletedCount >= badgeTasks.length) {
          const targetBadge = badges.find(b => b.id === badgeId);
          const certId = `cert_${userId}_${badgeId}`;
          await setDoc(doc(db, 'user_certificates', certId), {
            id: certId,
            userId,
            userName,
            badgeTitle: targetBadge?.title || 'Scout Skill Badge',
            trackTitle: selectedTrack?.title || 'Scout Award Scheme',
            issuedDate: new Date().toISOString().split('T')[0],
            verificationCode: `ROS-${Math.floor(100000 + Math.random() * 900000)}`
          });
        }
      }
    } catch (err) {
      console.error('Error toggling task:', err);
      if (isDone) setCompletedTaskIds(prev => prev.filter(id => id !== taskId));
      else setCompletedTaskIds(prev => [...prev, taskId]);
    }
  };

  const handleCreateFieldLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logNotes.trim()) return;

    const newLog: FieldLogSubmission = {
      id: `log_${Date.now()}`,
      userId,
      userName,
      badgeId: selectedBadge?.id || 'badge-201',
      badgeTitle: selectedBadge?.title || 'Campcraft & Pioneering Step',
      taskTitle: logTaskTitle,
      logNotes: logNotes.trim(),
      attachmentName: logAttachmentName || 'Field_Logbook_Scan.pdf',
      attachmentType: logAttachmentName?.endsWith('.png') || logAttachmentName?.endsWith('.jpg') ? 'photo' : 'pdf',
      status: 'pending',
      submittedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'user_field_logs', newLog.id), newLog);
      setIsLogModalOpen(false);
      setLogNotes('');
      setLogAttachmentName('');
      alert('✅ Field log submitted successfully!');
    } catch (err) {
      console.error('Failed to save log:', err);
      setFieldLogs(prev => [newLog, ...prev]);
      setIsLogModalOpen(false);
    }
  };

  const handleReviewLog = async (logId: string, status: 'approved' | 'rejected', feedback: string) => {
    try {
      await updateDoc(doc(db, 'user_field_logs', logId), {
        status,
        leaderFeedback: feedback,
        reviewedAt: new Date().toISOString(),
        reviewedBy: userName
      });
      alert(`Field log ${status}.`);
    } catch (err) {
      console.error('Error reviewing log:', err);
    }
  };

  const handleQuizSubmit = async () => {
    if (!activeQuiz) return;
    let score = 0;
    activeQuiz.questions.forEach((q) => {
      if (quizAnswers[q.id] === q.correctIndex) {
        score += 1;
      }
    });
    const percentage = Math.round((score / activeQuiz.questions.length) * 100);
    setQuizScore(percentage);
    setQuizSubmitted(true);

    try {
      await addDoc(collection(db, 'user_quiz_results'), {
        userId,
        userName,
        quizId: activeQuiz.id,
        score: percentage,
        passed: percentage >= 70,
        takenAt: new Date().toISOString()
      });
    } catch (err) {
      console.error('Error saving quiz result:', err);
    }
  };

  const handleBookTest = async (e: React.FormEvent) => {
    e.preventDefault();
    const newBooking: TestBooking = {
      id: `book_${Date.now()}`,
      userId,
      userName,
      badgeId: selectedBadge?.id || 'badge-102',
      badgeTitle: bookBadgeTitle || selectedBadge?.title || 'Navigation & Orienteering Milestone',
      assessorName: bookAssessor,
      date: bookDate,
      time: bookTime,
      location: bookLocation,
      notes: '',
      status: 'Scheduled'
    };

    try {
      await setDoc(doc(db, 'test_bookings', newBooking.id), newBooking);
      setIsBookingModalOpen(false);
      alert('📅 Practical assessment session booked!');
    } catch (err) {
      console.error('Error booking test:', err);
      setBookings(prev => [newBooking, ...prev]);
      setIsBookingModalOpen(false);
    }
  };

  // Calculations for Progress Tracker
  const currentBadgeTasks = selectedBadge ? tasks.filter(t => t.badgeId === selectedBadge.id) : [];
  const currentBadgeCompletedCount = currentBadgeTasks.filter(t => completedTaskIds.includes(t.id)).length;
  const badgeProgressPercent = currentBadgeTasks.length > 0 
    ? Math.round((currentBadgeCompletedCount / currentBadgeTasks.length) * 100) 
    : 0;

  const renderKnotDiagram = (type?: string) => {
    if (type === 'bowline') {
      return (
        <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-col items-center justify-center gap-2 border border-slate-800">
          <svg className="w-48 h-32 text-amber-400" viewBox="0 0 200 120" fill="none" stroke="currentColor" strokeWidth="4">
            <path d="M 30,10 L 30,110" stroke="#94a3b8" strokeDasharray="4 4" />
            <circle cx="100" cy="50" r="22" stroke="#f59e0b" strokeWidth="5" />
            <path d="M 30,90 Q 70,90 100,72 Q 130,50 120,30 Q 100,10 70,30 Q 50,50 100,50" stroke="#fbbf24" strokeWidth="5" />
            <text x="100" y="55" fill="#ffffff" fontSize="10" textAnchor="middle" fontWeight="bold">Loop</text>
          </svg>
          <span className="text-[11px] font-mono text-amber-300">Vector Knot Diagram: Bowline Loop Setup</span>
        </div>
      );
    }
    if (type === 'square_lashing') {
      return (
        <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-col items-center justify-center gap-2 border border-slate-800">
          <svg className="w-48 h-32" viewBox="0 0 200 120" fill="none" stroke="currentColor">
            <rect x="20" y="50" width="160" height="20" fill="#78350f" rx="4" />
            <rect x="90" y="10" width="20" height="100" fill="#78350f" rx="4" />
            <rect x="82" y="42" width="36" height="36" stroke="#fbbf24" strokeWidth="4" strokeDasharray="6 2" rx="2" />
            <circle cx="100" cy="60" r="12" stroke="#ef4444" strokeWidth="3" />
          </svg>
          <span className="text-[11px] font-mono text-amber-300">Vector Diagram: Square Lashing & Frapping Turns</span>
        </div>
      );
    }
    return (
      <div className="bg-slate-900 text-slate-300 p-4 rounded-xl flex items-center justify-center gap-3 border border-slate-800">
        <Compass className="w-8 h-8 text-amber-400" />
        <span className="text-xs font-semibold">Visual Technical Diagram Available in Field Guide Manual</span>
      </div>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1e40af]">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#0f1e36] tracking-tight">Scout Syllabus & Award Scheme</h1>
              <p className="text-xs font-medium text-slate-500">Custom Master Tracks, Milestones, Skill Checklists, Field Logs & Certified Verifications.</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center gap-4 shrink-0">
          <div className="text-right">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Overall Scheme Progress</div>
            <div className="text-sm font-black text-[#0f1e36]">{completedTaskIds.length} / {tasks.length} Skills Finished</div>
          </div>
          <div className="w-12 h-12 rounded-full border-4 border-blue-600 bg-white flex items-center justify-center text-xs font-black text-blue-700">
            {tasks.length > 0 ? Math.round((completedTaskIds.length / tasks.length) * 100) : 0}%
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex overflow-x-auto no-scrollbar sm:flex-wrap gap-2 border-b border-slate-200 pb-3 max-w-full">
        <button
          onClick={() => setMainTab('tracks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            mainTab === 'tracks'
              ? 'bg-[#1e40af] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          Tracks & Skill Guides
        </button>

        <button
          onClick={() => setMainTab('progress')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            mainTab === 'progress'
              ? 'bg-[#1e40af] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          My Skill Check & Field Log
        </button>

        <button
          onClick={() => setMainTab('testing')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            mainTab === 'testing'
              ? 'bg-[#1e40af] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Compass className="w-4 h-4" />
          Testing, Quizzes & Leader Review
        </button>

        <button
          onClick={() => setMainTab('trophy')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
            mainTab === 'trophy'
              ? 'bg-[#1e40af] text-white shadow-xs'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Trophy className="w-4 h-4" />
          Trophy Case & Certificates
        </button>

        {isLeaderOrAdmin && (
          <button
            onClick={() => setMainTab('manager')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              mainTab === 'manager'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Plus className="w-4 h-4" />
            Scheme & Badge Creator
          </button>
        )}
      </div>

      {/* =========================================================================
          TAB 1: TRACKS, BADGES, SKILL GUIDES & RESOURCE HUB
          ========================================================================= */}
      {mainTab === 'tracks' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Master Tracks Selection (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Award className="w-4 h-4 text-blue-600" />
                1. Select Master Track / Qualification
              </h2>

              <button
                onClick={() => handleOpenTrackModal()}
                className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                title="Create a new custom scheme"
              >
                <Plus className="w-3.5 h-3.5" />
                Custom Scheme
              </button>
            </div>

            <div className="space-y-3">
              {tracks.map((track) => {
                const isSelected = selectedTrack?.id === track.id;
                return (
                  <div
                    key={track.id}
                    onClick={() => setSelectedTrack(track)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative group ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-300 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        {track.category}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenTrackModal(track); }}
                          className="p-1 hover:bg-slate-200/80 rounded text-slate-500 transition-colors"
                          title="Edit Track"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteTrack(track.id, e)}
                          className="p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Delete Track"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-[#0f1e36]">{track.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-1">{track.description}</p>
                  </div>
                );
              })}
            </div>

            {/* Badges within Selected Track */}
            {selectedTrack && (
              <div className="pt-4 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Badges & Milestones in {selectedTrack.title}
                  </h3>

                  <button
                    onClick={() => handleOpenBadgeModal()}
                    className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Badge Step
                  </button>
                </div>

                {badges.filter(b => b.trackId === selectedTrack.id).map((badge) => {
                  const isSelected = selectedBadge?.id === badge.id;
                  return (
                    <div
                      key={badge.id}
                      onClick={() => setSelectedBadge(badge)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-300 shadow-xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white shadow-xs ${
                          badge.level === 'Gold' ? 'bg-amber-500' : badge.level === 'Silver' ? 'bg-slate-400' : 'bg-blue-600'
                        }`}>
                          {badge.level[0]}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">{badge.title}</h4>
                          <span className="text-[10px] text-slate-500">{badge.estimatedHours} Hours • {badge.level} Level</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenBadgeModal(badge); }}
                          className="p-1 hover:bg-slate-200 rounded text-slate-500"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteBadge(badge.id, e)}
                          className="p-1 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-slate-300'}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Column: Detailed Skill Guide & Practical Tasks (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {selectedBadge ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
                {/* Badge Header Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {selectedBadge.level} Milestone Badge
                    </span>
                    <h2 className="text-lg font-bold text-[#0f1e36] mt-1">{selectedBadge.title}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">{selectedBadge.description}</p>
                  </div>

                  <div className="sm:w-48 space-y-1 shrink-0">
                    <div className="flex justify-between text-[11px] font-bold text-slate-600">
                      <span>Badge Progress</span>
                      <span>{badgeProgressPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${badgeProgressPercent}%` }} />
                    </div>
                  </div>
                </div>

                {/* Practical Skill Items / Requirements */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                      Practical Tasks & Required Skill Items
                    </h3>

                    <button
                      onClick={() => handleOpenTaskModal()}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Skill Task
                    </button>
                  </div>

                  <div className="space-y-3">
                    {tasks.filter(t => t.badgeId === selectedBadge.id).map((task) => {
                      const isCompleted = completedTaskIds.includes(task.id);
                      return (
                        <div key={task.id} className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <button
                                onClick={() => handleToggleTask(task.id, selectedBadge.id)}
                                className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors cursor-pointer shrink-0 mt-0.5 ${
                                  isCompleted ? 'bg-emerald-600 text-white' : 'border-2 border-slate-300 hover:border-emerald-500'
                                }`}
                              >
                                {isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
                              </button>
                              <div>
                                <h4 className={`text-sm font-bold ${isCompleted ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                                  {task.title}
                                </h4>
                                <p className="text-xs text-slate-500 mt-0.5">{task.description}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                onClick={() => handleOpenTaskModal(task)}
                                className="p-1.5 hover:bg-slate-100 rounded text-slate-500"
                                title="Edit Task"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-1.5 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded"
                                title="Delete Task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setSelectedTaskGuide(selectedTaskGuide?.id === task.id ? null : task)}
                                className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                                {selectedTaskGuide?.id === task.id ? 'Hide Guide' : 'Skill Guide'}
                              </button>
                            </div>
                          </div>

                          {/* Skill Guide Accordion */}
                          {selectedTaskGuide?.id === task.id && (
                            <div className="mt-3 pt-3 border-t border-slate-100 space-y-4 bg-slate-50/80 p-4 rounded-xl border">
                              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                Interactive Step-by-Step Skill Guide
                              </div>

                              {renderKnotDiagram(task.guide.diagramType)}

                              <div className="space-y-1.5">
                                {task.guide.steps.map((step, idx) => (
                                  <div key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center shrink-0 text-[10px]">
                                      {idx + 1}
                                    </span>
                                    <span>{step}</span>
                                  </div>
                                ))}
                              </div>

                              {task.guide.tips && (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 font-medium">
                                  💡 <strong>Pro Tip:</strong> {task.guide.tips}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 space-y-2">
                <BookOpen className="w-12 h-12 mx-auto text-slate-300" />
                <h3 className="text-sm font-bold text-slate-700">Select a Master Track and Badge Step</h3>
                <p className="text-xs text-slate-400">Choose or create a scheme on the left to inspect its practical checklist and knot guides.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: MY SKILL CHECK & FIELD LOG SUBMISSIONS
          ========================================================================= */}
      {mainTab === 'progress' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200">
            <div>
              <h2 className="text-base font-bold text-[#0f1e36] flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                My Field Log & Logbook Uploads
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Upload camp notes, field photos, hand-drawn knot diagrams, or hike reports for Scouter verification.
              </p>
            </div>

            <button
              onClick={() => setIsLogModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Upload className="w-4 h-4" />
              Submit Field Log / Notes
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-blue-600" />
              My Skill Check List
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {tasks.map((task) => {
                const isCompleted = completedTaskIds.includes(task.id);
                const parentBadge = badges.find(b => b.id === task.badgeId);
                return (
                  <div key={task.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">{parentBadge?.title || 'Badge Task'}</div>
                      <div className={`text-xs font-bold ${isCompleted ? 'text-emerald-700' : 'text-slate-800'}`}>
                        {task.title}
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleTask(task.id, task.badgeId)}
                      className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                        isCompleted ? 'bg-emerald-600 text-white' : 'border-2 border-slate-300 hover:border-emerald-500'
                      }`}
                    >
                      {isCompleted && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Submitted Field Logs & Approval Status
            </h3>

            <div className="space-y-3">
              {fieldLogs.filter(l => l.userId === userId || isLeaderOrAdmin).map((log) => (
                <div key={log.id} className="p-4 rounded-xl border border-slate-200 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">{log.userName}</span>
                      <span className="text-[11px] text-slate-400">• {log.badgeTitle}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        log.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        log.status === 'rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {log.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-medium">{log.logNotes}</p>

                    {log.attachmentName && (
                      <div className="text-[11px] font-semibold text-blue-600 flex items-center gap-1 pt-1">
                        📎 Attachment: {log.attachmentName}
                      </div>
                    )}
                  </div>

                  {isLeaderOrAdmin && log.status === 'pending' && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          const fb = prompt('Optional feedback notes for approval:');
                          handleReviewLog(log.id, 'approved', fb || 'Verified and approved.');
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          const fb = prompt('Reason for requesting revision:');
                          handleReviewLog(log.id, 'rejected', fb || 'Requires additional notes.');
                        }}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Request Revision
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: TESTING, QUICK QUIZZES & LEADER REVIEW & BOOK A TEST
          ========================================================================= */}
      {mainTab === 'testing' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    Theoretical Knowledge Check
                  </span>
                  <h2 className="text-lg font-bold text-[#0f1e36] mt-1">{activeQuiz?.title}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Test your theoretical knowledge on navigation, knots, and safety protocols.</p>
                </div>
              </div>

              <div className="space-y-6">
                {activeQuiz?.questions.map((q, qIdx) => (
                  <div key={q.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="text-xs font-bold text-slate-900">
                      Q{qIdx + 1}: {q.question}
                    </div>

                    <div className="space-y-2">
                      {q.options.map((opt, oIdx) => {
                        const isSelected = quizAnswers[q.id] === oIdx;
                        const isCorrect = q.correctIndex === oIdx;
                        return (
                          <button
                            key={oIdx}
                            disabled={quizSubmitted}
                            onClick={() => setQuizAnswers(prev => ({ ...prev, [q.id]: oIdx }))}
                            className={`w-full text-left p-3 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                              quizSubmitted
                                ? isCorrect
                                  ? 'bg-emerald-100 border-emerald-400 text-emerald-900 font-bold'
                                  : isSelected
                                  ? 'bg-rose-100 border-rose-300 text-rose-900'
                                  : 'bg-white border-slate-200 opacity-60'
                                : isSelected
                                ? 'bg-blue-100 border-blue-400 text-blue-900 font-bold'
                                : 'bg-white border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {!quizSubmitted ? (
                  <button
                    onClick={handleQuizSubmit}
                    disabled={Object.keys(quizAnswers).length < (activeQuiz?.questions.length || 0)}
                    className="w-full py-3 bg-[#1e40af] hover:bg-blue-800 text-white text-xs font-bold rounded-xl transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    Submit Quick Quiz Answers
                  </button>
                ) : (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
                    <div className="text-sm font-black text-emerald-900">
                      Quiz Complete! Your Score: {quizScore}%
                    </div>
                    <button
                      onClick={() => {
                        setQuizSubmitted(false);
                        setQuizAnswers({});
                        setQuizScore(null);
                      }}
                      className="px-4 py-1.5 bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer hover:bg-emerald-800"
                    >
                      Retake Quiz
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h2 className="text-sm font-bold text-[#0f1e36] flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  Book a Practical Test / Panel
                </h2>

                <button
                  onClick={() => setIsBookingModalOpen(true)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Book Session
                </button>
              </div>

              <div className="space-y-3 pt-2">
                {bookings.map((b) => (
                  <div key={b.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{b.badgeTitle}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                        {b.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-600 space-y-0.5">
                      <div>👤 Assessor: <strong>{b.assessorName}</strong></div>
                      <div>📅 Date: {b.date} @ {b.time}</div>
                      <div>📍 Location: {b.location}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: REWARDS & RECOGNITION
          ========================================================================= */}
      {mainTab === 'trophy' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-lg font-bold text-[#0f1e36] flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              Rover Scout Trophy Case & Earned Badges
            </h2>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {badges.map((badge) => {
                const isEarned = certificates.some(c => c.badgeTitle === badge.title) || badgeProgressPercent === 100;
                return (
                  <div
                    key={badge.id}
                    className={`p-4 rounded-2xl border text-center space-y-2 transition-all ${
                      isEarned
                        ? 'bg-gradient-to-b from-amber-50 to-white border-amber-300 shadow-xs'
                        : 'bg-slate-50 border-slate-200 opacity-50 grayscale'
                    }`}
                  >
                    <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center text-white shadow-md font-black text-lg ${
                      badge.level === 'Gold' ? 'bg-amber-500 ring-4 ring-amber-200' :
                      badge.level === 'Silver' ? 'bg-slate-400 ring-4 ring-slate-200' :
                      'bg-blue-600 ring-4 ring-blue-200'
                    }`}>
                      <Award className="w-8 h-8" />
                    </div>

                    <div className="text-xs font-bold text-slate-900 leading-tight">{badge.title}</div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                      {isEarned ? '★ EARNED ★' : 'LOCKED'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Printer className="w-4 h-4 text-blue-600" />
              My Official Certificates
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificates.map((cert) => (
                <div key={cert.id} className="p-5 rounded-2xl border-2 border-amber-200 bg-amber-50/30 flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-amber-800">
                      <span>VERIFIED CERTIFICATE</span>
                      <span>{cert.verificationCode}</span>
                    </div>
                    <h4 className="text-base font-bold text-[#0f1e36] mt-2">{cert.badgeTitle}</h4>
                    <p className="text-xs text-slate-500">{cert.trackTitle}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Issued on: {cert.issuedDate} to {cert.userName}</p>
                  </div>

                  <button
                    onClick={() => setActiveCert(cert)}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-4 h-4" />
                    View & Print Official Certificate
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: SCHEME, COURSE & TASK MANAGER CONSOLE
          ========================================================================= */}
      {mainTab === 'manager' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-[#0f1e36] flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-600" />
                  Course, Scheme & Task Management Console
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Create, edit, or delete Master Schemes (Tracks), Badge Steps (Courses), and Skill Task requirement items.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => handleOpenTrackModal()}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add New Scheme
                </button>
                <button
                  onClick={() => handleOpenBadgeModal()}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Course / Badge
                </button>
                <button
                  onClick={() => handleOpenTaskModal()}
                  className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Skill Task
                </button>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-blue-900">Total Master Schemes / Tracks</div>
                  <div className="text-2xl font-black text-blue-950 mt-1">{tracks.length}</div>
                </div>
                <Award className="w-8 h-8 text-blue-500 opacity-80" />
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-emerald-900">Total Badge Steps / Courses</div>
                  <div className="text-2xl font-black text-emerald-950 mt-1">{badges.length}</div>
                </div>
                <BookOpen className="w-8 h-8 text-emerald-500 opacity-80" />
              </div>

              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-amber-900">Total Skill Tasks / Requirements</div>
                  <div className="text-2xl font-black text-amber-950 mt-1">{tasks.length}</div>
                </div>
                <CheckSquare className="w-8 h-8 text-amber-500 opacity-80" />
              </div>
            </div>
          </div>

          {/* Section 1: Manage Master Schemes / Tracks */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0f1e36] flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-600" />
                Master Schemes / Tracks ({tracks.length})
              </h3>
              <button
                onClick={() => handleOpenTrackModal()}
                className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                New Scheme
              </button>
            </div>

            <div className="space-y-3">
              {tracks.map((track) => {
                const trackBadgesCount = badges.filter(b => b.trackId === track.id).length;
                return (
                  <div key={track.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{track.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 uppercase">
                          {track.category}
                        </span>
                        <span className="text-xs text-slate-400">• {trackBadgesCount} Badges</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{track.description}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleOpenTrackModal(track)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={(e) => handleDeleteTrack(track.id, e)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Scheme
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Manage Badges / Courses */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0f1e36] flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                Badge Steps / Courses ({badges.length})
              </h3>
              <button
                onClick={() => handleOpenBadgeModal()}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                New Badge
              </button>
            </div>

            <div className="space-y-3">
              {badges.map((badge) => {
                const parentTrack = tracks.find(t => t.id === badge.trackId);
                const badgeTasksCount = tasks.filter(t => t.badgeId === badge.id).length;
                return (
                  <div key={badge.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{badge.title}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          badge.level === 'Gold' ? 'bg-amber-100 text-amber-800' :
                          badge.level === 'Silver' ? 'bg-slate-200 text-slate-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {badge.level}
                        </span>
                        <span className="text-xs text-slate-400">• Scheme: {parentTrack?.title || 'Unknown Scheme'}</span>
                        <span className="text-xs text-slate-400">• {badgeTasksCount} Tasks</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{badge.description}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleOpenBadgeModal(badge)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={(e) => handleDeleteBadge(badge.id, e)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Course
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 3: Manage Skill Tasks */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0f1e36] flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-amber-600" />
                Skill Tasks / Requirements ({tasks.length})
              </h3>
              <button
                onClick={() => handleOpenTaskModal()}
                className="text-xs font-bold text-amber-600 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                New Task
              </button>
            </div>

            <div className="space-y-3">
              {tasks.map((task) => {
                const parentBadge = badges.find(b => b.id === task.badgeId);
                return (
                  <div key={task.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900">{task.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                          {task.category}
                        </span>
                        <span className="text-xs text-slate-400">• Course: {parentBadge?.title || 'Unknown Badge'}</span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{task.description}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleOpenTaskModal(task)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit
                      </button>
                      <button
                        onClick={(e) => handleDeleteTask(task.id, e)}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete Task
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALS
          ========================================================================= */}

      {/* 1. Custom Master Track / Scheme Modal */}
      {isTrackModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#0f1e36]">
                {editingTrack ? 'Edit Master Track / Qualification Scheme' : 'Create Master Track / Qualification Scheme'}
              </h3>
              <button 
                id="close-track-modal-btn"
                onClick={() => setIsTrackModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTrack} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Scheme / Track Title</label>
                <input
                  id="track-title-input"
                  type="text"
                  required
                  value={trackFormTitle}
                  onChange={e => setTrackFormTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  placeholder="e.g. Master Wilderness Lifesaving Track"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Category</label>
                <select
                  id="track-category-select"
                  value={trackFormCat}
                  onChange={e => setTrackFormCat(e.target.value as any)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                >
                  <option value="Custom Scheme">Custom Scheme</option>
                  <option value="Award Scheme">Award Scheme</option>
                  <option value="Leadership">Leadership</option>
                  <option value="Outdoors">Outdoors</option>
                  <option value="Specialty">Specialty</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Scheme Overview Description</label>
                <textarea
                  id="track-desc-input"
                  rows={3}
                  value={trackFormDesc}
                  onChange={e => setTrackFormDesc(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  placeholder="Describe the primary objectives and target qualifications of this custom scheme..."
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                {editingTrack ? (
                  <button
                    id="modal-delete-track-btn"
                    type="button"
                    onClick={(e) => handleDeleteTrack(editingTrack.id, e)}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Scheme
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    id="cancel-track-modal-btn"
                    type="button"
                    onClick={() => setIsTrackModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="save-track-modal-btn"
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
                  >
                    Save Master Scheme
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Custom Badge Modal */}
      {isBadgeModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#0f1e36]">
                {editingBadge ? 'Edit Badge Step' : `Add Badge Step to ${selectedTrack?.title}`}
              </h3>
              <button 
                id="close-badge-modal-btn"
                onClick={() => setIsBadgeModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBadge} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Badge / Step Title</label>
                <input
                  id="badge-title-input"
                  type="text"
                  required
                  value={badgeFormTitle}
                  onChange={e => setBadgeFormTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  placeholder="e.g. Advanced Night Navigation Badge"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Level</label>
                  <select
                    id="badge-level-select"
                    value={badgeFormLevel}
                    onChange={e => setBadgeFormLevel(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  >
                    <option value="Bronze">Bronze</option>
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                    <option value="Master">Master</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Est. Hours</label>
                  <input
                    id="badge-hours-input"
                    type="number"
                    value={badgeFormHours}
                    onChange={e => setBadgeFormHours(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Description</label>
                <textarea
                  id="badge-desc-input"
                  rows={2}
                  value={badgeFormDesc}
                  onChange={e => setBadgeFormDesc(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                {editingBadge ? (
                  <button
                    id="modal-delete-badge-btn"
                    type="button"
                    onClick={(e) => handleDeleteBadge(editingBadge.id, e)}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Badge
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    id="cancel-badge-modal-btn"
                    type="button"
                    onClick={() => setIsBadgeModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="save-badge-modal-btn"
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
                  >
                    Save Badge Step
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Custom Task Modal */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#0f1e36]">
                {editingTask ? 'Edit Skill Task Requirement' : `Add Task Requirement to ${selectedBadge?.title}`}
              </h3>
              <button 
                id="close-task-modal-btn"
                onClick={() => setIsTaskModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Task / Skill Title</label>
                <input
                  id="task-title-input"
                  type="text"
                  required
                  value={taskFormTitle}
                  onChange={e => setTaskFormTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  placeholder="e.g. Tie a Clove Hitch under 5 seconds"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Task Category</label>
                <select
                  id="task-category-select"
                  value={taskFormCat}
                  onChange={e => setTaskFormCat(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                >
                  <option value="Practical">Practical</option>
                  <option value="Theory">Theory</option>
                  <option value="Fieldwork">Fieldwork</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Task Description</label>
                <input
                  id="task-desc-input"
                  type="text"
                  value={taskFormDesc}
                  onChange={e => setTaskFormDesc(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  placeholder="Short summary of requirement"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Step-by-Step Skill Guide Instructions (One per line)</label>
                <textarea
                  id="task-steps-input"
                  rows={3}
                  value={taskFormSteps}
                  onChange={e => setTaskFormSteps(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  placeholder={`Step 1: Wrap rope around post\nStep 2: Cross over the standing line\nStep 3: Pull tight`}
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                {editingTask ? (
                  <button
                    id="modal-delete-task-btn"
                    type="button"
                    onClick={(e) => handleDeleteTask(editingTask.id, e)}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete Task
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    id="cancel-task-modal-btn"
                    type="button"
                    onClick={() => setIsTaskModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    id="save-task-modal-btn"
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs cursor-pointer"
                  >
                    Save Task
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Field Log Modal */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#0f1e36]">Submit My Field Log Notes</h3>
              <button onClick={() => setIsLogModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFieldLog} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Task Title / Activity</label>
                <input
                  type="text"
                  value={logTaskTitle}
                  onChange={e => setLogTaskTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Logbook Notes & Reflections</label>
                <textarea
                  required
                  rows={4}
                  value={logNotes}
                  onChange={e => setLogNotes(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  placeholder="Describe practical execution, knot security testing..."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Attachment Name</label>
                <input
                  type="text"
                  value={logAttachmentName}
                  onChange={e => setLogAttachmentName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  placeholder="e.g. field_report.pdf"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                >
                  Submit Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Book Test Modal */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-[#0f1e36]">Book Practical Assessment</h3>
              <button onClick={() => setIsBookingModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBookTest} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Badge Target</label>
                <input
                  type="text"
                  value={bookBadgeTitle || selectedBadge?.title || ''}
                  onChange={e => setBookBadgeTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Date</label>
                  <input
                    type="date"
                    value={bookDate}
                    onChange={e => setBookDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Time</label>
                  <input
                    type="time"
                    value={bookTime}
                    onChange={e => setBookTime(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Assessor Scouter</label>
                <input
                  type="text"
                  value={bookAssessor}
                  onChange={e => setBookAssessor(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold"
                >
                  Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Printable Certificate Modal */}
      {activeCert && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-8 space-y-6 shadow-2xl border-4 border-amber-300 text-center relative">
            <button
              onClick={() => setActiveCert(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="space-y-2">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-500 text-white flex items-center justify-center shadow-lg font-black text-2xl">
                ★
              </div>
              <h2 className="text-2xl font-black text-[#0f1e36] tracking-tight">CERTIFICATE OF ACHIEVEMENT</h2>
              <p className="text-xs text-amber-800 uppercase tracking-widest font-bold">ROVER SCOUT SYLLABUS QUALIFICATION</p>
            </div>

            <div className="py-4 space-y-3 border-y border-amber-200">
              <p className="text-xs text-slate-500">This official award certifies that</p>
              <div className="text-xl font-black text-slate-900 underline decoration-amber-400">{activeCert.userName}</div>
              <p className="text-xs text-slate-500">has successfully completed all practical requirements and verified assessments for</p>
              <div className="text-lg font-extrabold text-blue-900">{activeCert.badgeTitle}</div>
              <div className="text-xs text-slate-500">Under the {activeCert.trackTitle}</div>
            </div>

            <div className="flex justify-between items-end text-xs text-slate-500 pt-2">
              <div>
                <div className="font-bold text-slate-800">Scout Council Assessor</div>
                <div>Authorized Seal & Signature</div>
              </div>
              <div>
                <div className="font-mono text-amber-900 font-bold">{activeCert.verificationCode}</div>
                <div>Issued: {activeCert.issuedDate}</div>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-4">
              <button
                onClick={() => window.print()}
                className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                Print Certificate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Delete Confirmation Dialog Modal */}
      {deleteConfirm && deleteConfirm.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-rose-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 shadow-xs">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-600">
                  Confirm Permanent Deletion
                </span>
                <h3 className="text-base font-bold text-slate-900 leading-snug mt-0.5 break-words">
                  {deleteConfirm.type === 'track' ? 'Delete Master Scheme' : deleteConfirm.type === 'badge' ? 'Delete Milestone Badge' : 'Delete Practical Task'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-rose-50/70 border border-rose-200/80 rounded-xl space-y-1.5">
              <div className="text-xs font-bold text-slate-900 break-words flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                <span className="truncate">{deleteConfirm.title}</span>
                {deleteConfirm.category && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-200/80 text-rose-800 font-bold shrink-0">
                    {deleteConfirm.category}
                  </span>
                )}
              </div>
              <p className="text-xs text-rose-800/90 leading-relaxed">
                {deleteConfirm.warning}
              </p>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              This action cannot be undone. Are you sure you wish to proceed?
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                Yes, Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
