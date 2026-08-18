import React, { useState, useEffect } from 'react';
import { 
  createMember, 
  deleteMember, 
  updateMember, 
  subscribeToMembers,
  createLeader,
  deleteLeader,
  updateLeader,
  subscribeToLeaders,
  CrewItem,
  subscribeToCrews,
  createCrew,
  deleteCrew,
  updateCrew
} from '../services/membersService';
import { 
  Users, 
  Search, 
  Shield, 
  Mail, 
  Phone, 
  Award, 
  Filter,
  UserPlus,
  KeyRound,
  Lock,
  CheckCircle2,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
  MapPin,
  MoreVertical,
  Plus,
  Boxes,
  ShieldCheck,
  Compass,
  CreditCard,
  Eye,
  Calendar,
  Heart,
  MessageSquare,
  Send
} from 'lucide-react';
import { sendWelcomeMessageForMember } from '../services/chatService';

export interface MemberItem {
  id: string;
  name: string;
  username?: string;
  idCard?: string;
  password?: string;
  dateOfBirth: string;
  gender?: string;
  section?: string;
  investitureDate?: string;
  bloodType?: string;
  email: string;
  phone: string;
  mobile?: string;
  permanentAddress?: string;
  currentAddress?: string;
  telegram?: string;
  whatsapp?: string;
  instagram?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  role: string;
  crew: string;
  badgeRank: string;
  status: 'Active' | 'On Leave' | 'Training';
  joinedDate: string;
  location?: string;
  lastActive?: string;
  lastSeen?: string;
  lastLogin?: string;
  welcomedToChat?: boolean;
  hasLoggedInBefore?: boolean;
  welcomedAt?: string;
}

export interface LeadershipItem {
  id: string;
  name: string;
  username?: string;
  title: string;
  email: string;
  phone: string;
  loginAccess: string;
  status: 'Active' | 'On Leave';
  lastActive?: string;
  lastSeen?: string;
  lastLogin?: string;
}

export const INITIAL_MEMBERS: MemberItem[] = [
  {
    id: 'm1',
    name: 'Ibrahim Nashidh',
    username: '@ibrahim',
    idCard: 'A111111',
    password: '123456',
    role: 'Council Quartermaster',
    crew: 'Alpha Crew',
    email: 'ibrahim.nashidh@arabiyyarover.org',
    phone: '+960 992-4411',
    badgeRank: 'Explorer',
    status: 'Active',
    joinedDate: '2023-05-20',
    dateOfBirth: '2004-05-20',
    location: 'Alpha Crew HQ, Malé'
  },
  {
    id: 'm2',
    name: 'Mariyam Shazra',
    username: '@shazra',
    idCard: 'A222222',
    password: '123456',
    role: 'Council Secretary',
    crew: 'Delta Crew',
    email: 'shazra.m@arabiyyarover.org',
    phone: '+960 765-3321',
    badgeRank: 'Rover Citizen',
    status: 'Active',
    joinedDate: '2023-08-01',
    dateOfBirth: '2005-08-01',
    location: 'Delta Base, Hulhumalé'
  },
  {
    id: 'm3',
    name: 'Hussain Rameez',
    username: '@rameez',
    idCard: 'A333333',
    password: '123456',
    role: 'Rover Scout',
    crew: 'Bravo Crew',
    email: 'hussain.rameez@arabiyyarover.org',
    phone: '+960 981-6789',
    badgeRank: 'Initiate',
    status: 'Training',
    joinedDate: '2024-02-12',
    dateOfBirth: '2010-02-12',
    location: 'Bravo HQ, Malé'
  }
];

export const INITIAL_LEADERSHIP: LeadershipItem[] = [
  {
    id: 'l1',
    name: 'Ahmed Ziyad',
    username: '@ziyad',
    title: 'Senior Rover Advisor',
    email: 'ahmed.ziyad@arabiyyarover.org',
    phone: '+960 791-2345',
    loginAccess: 'Advisor Full Admin',
    status: 'Active'
  },
  {
    id: 'l2',
    name: 'Aishath Leen Mohamed',
    username: '@leen',
    title: 'Assistant Rover Leader',
    email: 'leen.mohamed@arabiyyarover.org',
    phone: '+960 778-9812',
    loginAccess: 'Leader Portal Access',
    status: 'Active'
  }
];

export const MembersPage: React.FC<{isAdmin?: boolean, userRole?: string}> = ({ isAdmin = true, userRole }) => {
  const [activeTab, setActiveTab] = useState<'crew' | 'leadership' | 'crews'>('crew');
  const [memberCategoryTab, setMemberCategoryTab] = useState<'all' | 'council' | 'rovers' | 'explorers' | 'leaders'>('all');

  const [portalSettings, setPortalSettings] = useState({
    explorerToRoverAge: 18,
    roverToLeaderAge: 26
  });

  const [members, setMembers] = useState<MemberItem[]>(INITIAL_MEMBERS);
  const [leaders, setLeaders] = useState<LeadershipItem[]>(INITIAL_LEADERSHIP);
  const [crews, setCrews] = useState<CrewItem[]>([]);

  const canCreateCrew = isAdmin || (userRole && (
    userRole.toLowerCase().includes('council') || 
    userRole.toLowerCase().includes('secretary') || 
    userRole.toLowerCase().includes('treasurer') || 
    userRole.toLowerCase().includes('quartermaster')
  ));

  useEffect(() => {
    const unsubMembers = subscribeToMembers(setMembers, console.error);
    const unsubLeaders = subscribeToLeaders(setLeaders, console.error);
    const unsubCrews = subscribeToCrews(setCrews, console.error);

    // Fetch portal settings for age thresholds
    const fetchSettings = async () => {
      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('../firebase');
        const docSnap = await getDoc(doc(db, 'system', 'portal_settings'));
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPortalSettings({
            explorerToRoverAge: data.explorerToRoverAge || 18,
            roverToLeaderAge: data.roverToLeaderAge || 26
          });
        }
      } catch (err) {
        console.error('Error fetching settings for age logic:', err);
      }
    };
    fetchSettings();

    return () => {
      unsubMembers();
      unsubLeaders();
      unsubCrews();
    };
  }, []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCrew, setSelectedCrew] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddLeaderModalOpen, setIsAddLeaderModalOpen] = useState(false);
  const [isAddCrewModalOpen, setIsAddCrewModalOpen] = useState(false);
  const [newCrewName, setNewCrewName] = useState('');
  const [newCrewDesc, setNewCrewDesc] = useState('');

  // Action menu and location state
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [locationMember, setLocationMember] = useState<MemberItem | null>(null);
  const [newLocationText, setNewLocationText] = useState('');

  // Close action menu when clicking outside
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.member-action-menu')) {
        setOpenActionMenuId(null);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  const calculateAge = (dob?: string) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getAutoRoleAndSection = (dob: string, assignedRole: string) => {
    let role = assignedRole;

    // Rule: if any member is assigned a council member role, Normal Rover Member automatically changes to the specified role.
    if (role === 'Normal Rover Member') {
      role = 'Rover Scout';
    }

    return { role };
  };

  const handleSendWelcomeChat = async (member: MemberItem) => {
    try {
      const ok = await sendWelcomeMessageForMember(member);
      if (ok) {
        alert(`Welcome message broadcasted to Members Chat for ${member.name}!`);
      } else {
        alert('Welcome message broadcast is currently disabled in Portal Settings.');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to send welcome message to chat.');
    }
  };

  // Edit / Delete state for Council member
  const [viewingMember, setViewingMember] = useState<MemberItem | null>(null);
  const [editingMember, setEditingMember] = useState<MemberItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editIdCard, setEditIdCard] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editCrew, setEditCrew] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editBadge, setEditBadge] = useState('');
  const [editStatus, setEditStatus] = useState<'Active' | 'On Leave' | 'Training'>('Active');
  const [editLocation, setEditLocation] = useState('');
  const [editDOB, setEditDOB] = useState('');
  const [editGender, setEditGender] = useState('Male');
  const [editSection, setEditSection] = useState('Rovers');
  const [editInvestitureDate, setEditInvestitureDate] = useState('');
  const [editBloodType, setEditBloodType] = useState('A+');
  const [editMobile, setEditMobile] = useState('');
  const [editPermanentAddress, setEditPermanentAddress] = useState('');
  const [editCurrentAddress, setEditCurrentAddress] = useState('');
  const [editTelegram, setEditTelegram] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editInstagram, setEditInstagram] = useState('');
  const [editEmergencyName, setEditEmergencyName] = useState('');
  const [editEmergencyPhone, setEditEmergencyPhone] = useState('');

  // Crew management & editing state
  const [editingCrew, setEditingCrew] = useState<CrewItem | null>(null);
  const [editCrewName, setEditCrewName] = useState('');
  const [editCrewDesc, setEditCrewDesc] = useState('');
  const [crewToDelete, setCrewToDelete] = useState<CrewItem | null>(null);

  // Authorization for managing and deleting crews:
  // User request: "If its to be deleted, it needs to be deleted by Council members, or rover advusor, or leader or admin"
  const canManageCrews = isAdmin || Boolean(
    userRole && (
      userRole.toLowerCase().includes('council') ||
      userRole.toLowerCase().includes('advisor') ||
      userRole.toLowerCase().includes('leader') ||
      userRole.toLowerCase().includes('admin') ||
      userRole.toLowerCase().includes('secretary') ||
      userRole.toLowerCase().includes('treasurer') ||
      userRole.toLowerCase().includes('quartermaster')
    )
  );

  const getTopCornerAddress = () => {
    try {
      return localStorage.getItem('koshaaru_user_address_v1') || 'M. Koshaaru, Handhuvaree Hingun, Kaafu / Malé Region, Malé, Maldives';
    } catch {
      return 'M. Koshaaru, Handhuvaree Hingun, Kaafu / Malé Region, Malé, Maldives';
    }
  };

  const handleOpenAddModal = () => {
    const topCorner = getTopCornerAddress();
    setNewCurrentAddress(topCorner);
    setIsAddModalOpen(true);
  };

  // Confirmation modal states (avoid window.confirm/alert which fail in iframes)
  const [memberToDelete, setMemberToDelete] = useState<MemberItem | null>(null);
  const [memberToResetPwd, setMemberToResetPwd] = useState<MemberItem | null>(null);
  const [leaderToDelete, setLeaderToDelete] = useState<LeadershipItem | null>(null);

  // New member form state
  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newIdCard, setNewIdCard] = useState('');
  const [newRole, setNewRole] = useState('Normal Rover Member');
  const [newCrew, setNewCrew] = useState('Alpha Crew');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newBadge, setNewBadge] = useState('Initiate');
  const [newStatus, setNewStatus] = useState<'Active' | 'On Leave' | 'Training'>('Active');
  const [newPassword, setNewPassword] = useState('123456');
  const [newLocation, setNewLocation] = useState('Malé Crew HQ');
  const [newDOB, setNewDOB] = useState('2006-01-01');
  const [newGender, setNewGender] = useState('Male');
  const [newSection, setNewSection] = useState('Rovers');
  const [newInvestitureDate, setNewInvestitureDate] = useState('');
  const [newBloodType, setNewBloodType] = useState('A+');
  const [newMobile, setNewMobile] = useState('');
  const [newPermanentAddress, setNewPermanentAddress] = useState('');
  const [newCurrentAddress, setNewCurrentAddress] = useState('');
  const [newTelegram, setNewTelegram] = useState('');
  const [newWhatsapp, setNewWhatsapp] = useState('');
  const [newInstagram, setNewInstagram] = useState('');
  const [newEmergencyName, setNewEmergencyName] = useState('');
  const [newEmergencyPhone, setNewEmergencyPhone] = useState('');

  // New leader form state
  const [ldrName, setLdrName] = useState('');
  const [ldrUsername, setLdrUsername] = useState('');
  const [ldrTitle, setLdrTitle] = useState('Assistant Rover Leader');
  const [ldrEmail, setLdrEmail] = useState('');
  const [ldrPhone, setLdrPhone] = useState('');
  const [ldrAccess, setLdrAccess] = useState('Leader Portal Access');

  const handleOpenLocationModal = (member: MemberItem) => {
    setLocationMember(member);
    setNewLocationText(member.location || 'Malé Crew HQ');
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationMember || !newLocationText.trim()) return;

    try {
      await updateMember(locationMember.id, {
        location: newLocationText.trim()
      });
      setLocationMember(null);
    } catch (err) {
      console.error('Failed to update member location:', err);
    }
  };

  const handleSaveNewMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    // generate default username if none is supplied
    const fallbackUsername = '@' + newName.toLowerCase().replace(/[^a-z0-9_]/g, '');
    const userVal = newUsername.trim() ? (newUsername.trim().startsWith('@') ? newUsername.trim() : `@${newUsername.trim()}`) : fallbackUsername;

    const { role: autoRole } = getAutoRoleAndSection(newDOB, newRole.trim());
    const primaryPhone = newMobile.trim() || newPhone.trim() || '+960 700-0000';

    const newItem: any = {
      id: 'm_' + Date.now(),
      name: newName.trim(),
      username: userVal,
      idCard: newIdCard.trim().toUpperCase(),
      role: autoRole,
      crew: newCrew,
      email: newEmail.trim() || 'member@arabiyyarover.org',
      phone: primaryPhone,
      mobile: newMobile.trim() || primaryPhone,
      badgeRank: newBadge,
      status: newStatus,
      joinedDate: new Date().toISOString().split('T')[0],
      dateOfBirth: newDOB,
      gender: newGender,
      section: newSection,
      investitureDate: newInvestitureDate,
      bloodType: newBloodType,
      permanentAddress: newPermanentAddress,
      currentAddress: newCurrentAddress,
      telegram: newTelegram,
      whatsapp: newWhatsapp,
      instagram: newInstagram,
      emergencyContactName: newEmergencyName,
      emergencyContactNumber: newEmergencyPhone,
      location: newCurrentAddress.trim() || newLocation.trim() || 'Malé Crew HQ'
    };

    try {
      await createMember(newItem, newPassword);
      setNewName('');
      setNewUsername('');
      setNewIdCard('');
      setNewEmail('');
      setNewPhone('');
      setNewMobile('');
      setNewPermanentAddress('');
      setNewTelegram('');
      setNewWhatsapp('');
      setNewInstagram('');
      setNewEmergencyName('');
      setNewEmergencyPhone('');
      setNewPassword('123456');
      setNewLocation('Malé Crew HQ');
      setIsAddModalOpen(false);
    } catch (err) {
      console.error('Failed to create member:', err);
    }
  };

  const handleOpenEditMember = (member: MemberItem) => {
    setEditingMember(member);
    setEditName(member.name);
    setEditUsername(member.username || '@' + member.name.toLowerCase().replace(/[^a-z0-9_]/g, ''));
    setEditIdCard(member.idCard || '');
    setEditRole(member.role);
    setEditCrew(member.crew);
    setEditEmail(member.email);
    setEditPhone(member.phone);
    setEditBadge(member.badgeRank);
    setEditStatus(member.status);
    setEditLocation(member.location || 'Malé Crew HQ');
    setEditDOB(member.dateOfBirth || '2006-01-01');
    setEditGender(member.gender || 'Male');
    setEditSection(member.section || 'Rovers');
    setEditInvestitureDate(member.investitureDate || '');
    setEditBloodType(member.bloodType || 'A+');
    setEditMobile(member.mobile || member.phone || '');
    setEditPermanentAddress(member.permanentAddress || '');
    setEditCurrentAddress(member.currentAddress || member.location || '');
    setEditTelegram(member.telegram || '');
    setEditWhatsapp(member.whatsapp || '');
    setEditInstagram(member.instagram || '');
    setEditEmergencyName(member.emergencyContactName || '');
    setEditEmergencyPhone(member.emergencyContactNumber || '');
  };

  const handleSaveEditedMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember || !editName.trim()) return;

    const userVal = editUsername.trim() ? (editUsername.trim().startsWith('@') ? editUsername.trim() : `@${editUsername.trim()}`) : ('@' + editName.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''));

    const { role: autoRole } = getAutoRoleAndSection(editDOB, editRole.trim());
    const primaryPhone = editMobile.trim() || editPhone.trim() || '+960 700-0000';

    try {
      await updateMember(editingMember.id, {
        name: editName.trim(),
        username: userVal,
        idCard: editIdCard.trim().toUpperCase(),
        role: autoRole,
        crew: editCrew,
        email: editEmail.trim(),
        phone: primaryPhone,
        mobile: editMobile.trim() || primaryPhone,
        badgeRank: editBadge.trim(),
        status: editStatus,
        location: editCurrentAddress.trim() || editLocation.trim() || 'Malé Crew HQ',
        dateOfBirth: editDOB,
        gender: editGender,
        section: editSection,
        investitureDate: editInvestitureDate,
        bloodType: editBloodType,
        permanentAddress: editPermanentAddress,
        currentAddress: editCurrentAddress,
        telegram: editTelegram,
        whatsapp: editWhatsapp,
        instagram: editInstagram,
        emergencyContactName: editEmergencyName,
        emergencyContactNumber: editEmergencyPhone
      });
      setEditingMember(null);
    } catch (err) {
      console.error('Failed to update member:', err);
    }
  };

  const handleConfirmDeleteMember = async () => {
    if (!memberToDelete) return;
    try {
      await deleteMember(memberToDelete.id);
      setMemberToDelete(null);
    } catch (e) {
      console.error('Failed to delete member:', e);
    }
  };

  const handleConfirmResetPassword = async () => {
    if (!memberToResetPwd) return;
    try {
      await updateMember(memberToResetPwd.id, { password: '123456' });
      setMemberToResetPwd(null);
    } catch (e) {
      console.error('Failed to reset password:', e);
    }
  };

  const handleConfirmDeleteLeader = async () => {
    if (!leaderToDelete) return;
    try {
      await deleteLeader(leaderToDelete.id);
      setLeaderToDelete(null);
    } catch (e) {
      console.error('Failed to delete leader:', e);
    }
  };

  const handleOpenEditCrew = (crew: CrewItem) => {
    setEditingCrew(crew);
    setEditCrewName(crew.name);
    setEditCrewDesc(crew.description || '');
  };

  const handleSaveEditedCrew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCrew || !editCrewName.trim()) return;

    try {
      await updateCrew(editingCrew.id, {
        name: editCrewName.trim(),
        description: editCrewDesc.trim()
      });
      setEditingCrew(null);
    } catch (err) {
      console.error('Failed to update crew:', err);
    }
  };

  const handleConfirmDeleteCrew = async () => {
    if (!crewToDelete || !canManageCrews) return;
    try {
      await deleteCrew(crewToDelete.id);
      setCrewToDelete(null);
    } catch (err) {
      console.error('Failed to delete crew:', err);
    }
  };

  const handleSaveNewLeader = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ldrName.trim()) return;

    const fallbackUsername = '@' + ldrName.toLowerCase().replace(/[^a-z0-9_]/g, '');
    const userVal = ldrUsername.trim() ? (ldrUsername.trim().startsWith('@') ? ldrUsername.trim() : `@${ldrUsername.trim()}`) : fallbackUsername;

    const newLeader: LeadershipItem = {
      id: 'l_' + Date.now(),
      name: ldrName.trim(),
      username: userVal,
      title: ldrTitle.trim(),
      email: ldrEmail.trim() || 'leader@arabiyyarover.org',
      phone: ldrPhone.trim() || '+960 700-0000',
      loginAccess: ldrAccess,
      status: 'Active'
    };

    try {
      await createLeader(newLeader);
      setLdrName('');
      setLdrUsername('');
      setLdrEmail('');
      setLdrPhone('');
      setIsAddLeaderModalOpen(false);
    } catch (e) {
      console.error('Failed to save leader:', e);
    }
  };

  const handleSaveNewCrew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCrewName.trim()) return;

    try {
      await createCrew({
        name: newCrewName.trim(),
        description: newCrewDesc.trim()
      });
      setIsAddCrewModalOpen(false);
      setNewCrewName('');
      setNewCrewDesc('');
    } catch (err) {
      console.error('Failed to create crew:', err);
    }
  };

  const handleDeleteCrew = async (crewId: string) => {
    try {
      await deleteCrew(crewId);
    } catch (err) {
      console.error('Failed to delete crew:', err);
    }
  };

  const filteredMembers = members.filter(m => {
    const isCouncil = m.role.toLowerCase().includes('council') || m.role.toLowerCase().includes('secretary') || m.role.toLowerCase().includes('treasurer') || m.role.toLowerCase().includes('quartermaster');
    const isRover = !isCouncil && (m.section ? m.section === 'Rovers' : m.role.toLowerCase().includes('rover'));
    const isExplorer = !isCouncil && (m.section ? m.section === 'Explorers' : m.role.toLowerCase().includes('explorer'));
    const isLeader = !isCouncil && (m.section ? m.section === 'Leaders' : m.role.toLowerCase().includes('leader'));

    if (memberCategoryTab === 'council' && !isCouncil) return false;
    if (memberCategoryTab === 'rovers' && !isRover) return false;
    if (memberCategoryTab === 'explorers' && !isExplorer) return false;
    if (memberCategoryTab === 'leaders' && !isLeader) return false;

    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCrew = selectedCrew === 'All' || m.crew === selectedCrew;
    const matchesStatus = selectedStatus === 'All' || m.status === selectedStatus;
    return matchesSearch && matchesCrew && matchesStatus;
  });

  const filteredLeaders = leaders.filter(l =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const councilCount = members.filter(m => m.role.toLowerCase().includes('council') || m.role.toLowerCase().includes('secretary') || m.role.toLowerCase().includes('treasurer') || m.role.toLowerCase().includes('quartermaster')).length;
  const roversCount = members.filter(m => {
    const isC = m.role.toLowerCase().includes('council') || m.role.toLowerCase().includes('secretary') || m.role.toLowerCase().includes('treasurer') || m.role.toLowerCase().includes('quartermaster');
    return !isC && (m.section ? m.section === 'Rovers' : m.role.toLowerCase().includes('rover'));
  }).length;
  const explorersCount = members.filter(m => {
    const isC = m.role.toLowerCase().includes('council') || m.role.toLowerCase().includes('secretary') || m.role.toLowerCase().includes('treasurer') || m.role.toLowerCase().includes('quartermaster');
    return !isC && (m.section ? m.section === 'Explorers' : m.role.toLowerCase().includes('explorer'));
  }).length;
  const leadersInMembersCount = members.filter(m => {
    const isC = m.role.toLowerCase().includes('council') || m.role.toLowerCase().includes('secretary') || m.role.toLowerCase().includes('treasurer') || m.role.toLowerCase().includes('quartermaster');
    return !isC && (m.section ? m.section === 'Leaders' : m.role.toLowerCase().includes('leader'));
  }).length;

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 sm:px-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold bg-[#800020]/10 text-[#800020] border border-[#800020]/20 mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Arabiyya Leaders and Rovers Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0f1e36]">
            Arabiyya Leaders and Rovers Directory
          </h1>
          
        </div>

        <div className="flex items-center gap-2.5">
          {activeTab === 'crew' ? (
            <div className="flex gap-2">
              {canCreateCrew && (
                <button
                  onClick={() => setIsAddCrewModalOpen(true)}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                >
                  <Users className="w-4 h-4" />
                  Create Crew
                </button>
              )}
              <button
                onClick={handleOpenAddModal}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#800020] hover:bg-[#6b1426] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                Add Member
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAddLeaderModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#1e40af] hover:bg-[#1e3a8a] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              <KeyRound className="w-4 h-4" />
              Add Advisor / Leader Login
            </button>
          )}
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('crew')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'crew'
              ? 'border-[#800020] text-[#800020]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          Crew Network ({members.length})
        </button>
        <button
          onClick={() => setActiveTab('leadership')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'leadership'
              ? 'border-[#1e40af] text-[#1e40af]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          Advisors & Leaders Login Directory ({leaders.length})
        </button>
        <button
          onClick={() => setActiveTab('crews')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'crews'
              ? 'border-emerald-600 text-emerald-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Boxes className="w-4 h-4" />
          Manage Crews ({crews.length})
        </button>
      </div>

      {/* Crews Management Tab Content */}
      {activeTab === 'crews' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-400">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h2 className="text-lg font-bold text-[#0f1e36]">Crew Administration</h2>
                <p className="text-xs text-slate-500">Create, update and manage organization sub-groups</p>
              </div>
              {canManageCrews && (
                <button
                  onClick={() => setIsAddCrewModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Register New Crew
                </button>
              )}
            </div>
            
            <div className="divide-y divide-slate-100">
              {crews.map(crew => (
                <div key={crew.id} className="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-[#0f1e36]">{crew.name}</h3>
                      <p className="text-xs text-slate-500 max-w-md line-clamp-1">{crew.description || 'No description provided.'}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase">
                          {members.filter(m => m.crew === crew.name).length} Members
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {canManageCrews && (
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleOpenEditCrew(crew)}
                        className="p-2 text-slate-500 hover:text-[#1e40af] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Crew"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setCrewToDelete(crew)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Crew"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
              
              {crews.length === 0 && (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-slate-300" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-500">No Crews Found</h3>
                  <p className="text-xs text-slate-400 mt-1">Start by creating your first organizational crew.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sub-tabs for Crew Network (All, Rovers, Explorers, Council) */}
      {activeTab === 'crew' && (
        <div className="flex flex-wrap items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 w-fit">
          <button
            onClick={() => setMemberCategoryTab('all')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              memberCategoryTab === 'all'
                ? 'bg-[#0f1e36] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            All ({members.length})
          </button>
          <button
            onClick={() => setMemberCategoryTab('rovers')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              memberCategoryTab === 'rovers'
                ? 'bg-[#0f1e36] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Rovers ({roversCount})
          </button>
          <button
            onClick={() => setMemberCategoryTab('explorers')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              memberCategoryTab === 'explorers'
                ? 'bg-[#0f1e36] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Explorers ({explorersCount})
          </button>
          <button
            onClick={() => setMemberCategoryTab('leaders')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              memberCategoryTab === 'leaders'
                ? 'bg-[#0f1e36] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Leaders ({leadersInMembersCount})
          </button>
          <button
            onClick={() => setMemberCategoryTab('council')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              memberCategoryTab === 'council'
                ? 'bg-[#0f1e36] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Council ({councilCount})
          </button>
        </div>
      )}

      {/* Filters & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'crew' ? "Search crew members..." : "Search advisors & leaders..."}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-[#1e40af] focus:bg-white transition-all"
          />
        </div>

        {activeTab === 'crew' && (
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Crew:</span>
            </div>
            <select
              value={selectedCrew}
              onChange={(e) => setSelectedCrew(e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-[#1e40af]"
            >
              <option value="All">All Crews</option>
              {crews.map(c => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
              {crews.length === 0 && (
                <>
                  <option value="Alpha Crew">Alpha Crew</option>
                  <option value="Bravo Crew">Bravo Crew</option>
                  <option value="Delta Crew">Delta Crew</option>
                </>
              )}
            </select>

            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 ml-2">
              <span>Status:</span>
            </div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-[#1e40af]"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Training">Training</option>
              <option value="On Leave">On Leave</option>
            </select>
          </div>
        )}
      </div>

      {/* Tab Content: Crew Network Members */}
      {activeTab === 'crew' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => {
            const isCouncil = member.role.toLowerCase().includes('council') || member.role.toLowerCase().includes('secretary') || member.role.toLowerCase().includes('treasurer') || member.role.toLowerCase().includes('quartermaster');
            return (
              <div 
                key={member.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-[#0f1e36]">
                          {member.name}
                        </h3>
                        {isCouncil ? (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-200">
                            Council
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                            Member
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-semibold mb-1">
                        {member.username || '@' + member.name.toLowerCase().replace(/[^a-z0-9_]/g, '')}
                      </div>
                      <p className="text-xs font-medium text-[#1e40af]">
                        {member.role}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      member.status === 'Active' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : member.status === 'Training'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {member.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span>ID Card: <strong className="font-mono text-slate-900 uppercase font-semibold">{member.idCard || 'N/A'}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Mobile (Primary): <strong className="text-slate-800">{member.mobile || member.phone || 'N/A'}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-semibold text-slate-700">{member.crew}</span>
                    </div>
                    {member.section && (
                      <div className="flex items-center gap-2">
                        <Award className="w-3.5 h-3.5 text-[#800020] shrink-0" />
                        <span>Section: <strong className="text-slate-800">{member.section}</strong></span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Award className="w-3.5 h-3.5 text-[#800020] shrink-0" />
                      <span>Badge: <strong className="text-slate-800">{member.badgeRank}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{member.email}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-700 font-medium overflow-hidden">
                    <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span className="truncate max-w-[130px] font-semibold text-slate-800" title={member.location || 'Malé Crew HQ'}>
                      {member.location || 'Malé Crew HQ'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenLocationModal(member)}
                      className="text-[10px] font-bold text-[#1e40af] hover:underline bg-blue-50 hover:bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200 transition-colors shrink-0 cursor-pointer"
                      title="Update current location"
                    >
                      Update
                    </button>
                  </div>

                  {isAdmin ? (
                    <div className="relative member-action-menu">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenActionMenuId(openActionMenuId === member.id ? null : member.id);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Member options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {openActionMenuId === member.id && (
                        <div className="absolute right-0 bottom-full mb-1 z-30 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 animate-in fade-in zoom-in-95 duration-150">
                          <button
                            type="button"
                            onClick={() => {
                              setOpenActionMenuId(null);
                              setViewingMember(member);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-blue-600" />
                            View Full Info
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setOpenActionMenuId(null);
                              handleOpenEditMember(member);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <Pencil className="w-3.5 h-3.5 text-[#1e40af]" />
                            Edit Details
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setOpenActionMenuId(null);
                              handleOpenLocationModal(member);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <MapPin className="w-3.5 h-3.5 text-red-500" />
                            Update Location
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setOpenActionMenuId(null);
                              setMemberToResetPwd(member);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs text-amber-700 hover:bg-amber-50 flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                            Reset Password
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setOpenActionMenuId(null);
                              handleSendWelcomeChat(member);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs text-purple-700 hover:bg-purple-50 flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-purple-600" />
                            Send Welcome Chat
                          </button>

                          <div className="my-1 border-t border-slate-100" />

                          <button
                            type="button"
                            onClick={() => {
                              setOpenActionMenuId(null);
                              setMemberToDelete(member);
                            }}
                            className="w-full text-left px-3.5 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-600" />
                            Remove Member
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setViewingMember(member)}
                      className="text-[11px] font-semibold text-[#1e40af] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3 h-3" />
                      View Info
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredMembers.length === 0 && (
            <div className="col-span-full bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-base font-semibold text-slate-700">No members found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search query.</p>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Advisors & Leaders Login Directory */}
      {activeTab === 'leadership' && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3 text-xs text-blue-900">
            <Lock className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" />
            <div>
              <strong className="font-bold">Credentialed Access Notice:</strong> Rover Advisors and Unit Leaders maintain administrative portal login credentials but operate outside the standard Rover Crew / Crew Network roster. Deletion requires explicit confirmation.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredLeaders.map((leader) => (
              <div 
                key={leader.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-[#1e40af] font-bold">
                        <KeyRound className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-[#0f1e36]">
                          {leader.name}
                        </h3>
                        <div className="text-xs text-slate-500 font-semibold mb-0.5">
                          {leader.username || '@' + leader.name.toLowerCase().replace(/[^a-z0-9_]/g, '')}
                        </div>
                        <p className="text-xs font-medium text-[#1e40af]">
                          {leader.title}
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {leader.status}
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-2 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Access Level: <strong className="text-slate-800">{leader.loginAccess}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span className="truncate">{leader.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{leader.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Portal Login Enabled</span>
                  <button
                    onClick={() => setLeaderToDelete(leader)}
                    className="text-red-600 hover:text-red-800 font-medium transition-colors cursor-pointer"
                  >
                    Revoke Login Access
                  </button>
                </div>
              </div>
            ))}

            {filteredLeaders.length === 0 && (
              <div className="col-span-full bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-500">
                <KeyRound className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                <p className="text-base font-semibold text-slate-700">No advisors or leaders found</p>
                <p className="text-xs text-slate-400 mt-1">Try adjusting your search query.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Member Details Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div>
                <h2 className="text-lg font-bold text-[#0f1e36]">
                  Edit Member Profile & Records
                </h2>
                <p className="text-xs text-slate-500 font-medium">{editingMember.name} • {editingMember.crew}</p>
              </div>
              <button
                onClick={() => setEditingMember(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-2"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditedMember} className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Category: Personal & Identity */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Personal & Identity</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-slate-50/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">ID Card Number</label>
                    <input
                      type="text"
                      required
                      value={editIdCard}
                      onChange={(e) => setEditIdCard(e.target.value)}
                      placeholder="A000000"
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-slate-50/30 uppercase font-mono"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Username (e.g. @zeesha)</label>
                    <input
                      type="text"
                      required
                      value={editUsername}
                      onChange={(e) => setEditUsername(e.target.value)}
                      placeholder="e.g. @zeesha"
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-slate-50/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      required
                      value={editDOB}
                      onChange={(e) => setEditDOB(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-slate-50/30"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Gender</label>
                    <select
                      value={editGender}
                      onChange={(e) => setEditGender(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-slate-50/30"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Section</label>
                    <select
                      value={editSection}
                      onChange={(e) => setEditSection(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-slate-50/30"
                    >
                      <option value="Explorers">Explorers (Junior)</option>
                      <option value="Rovers">Rovers (Senior)</option>
                      <option value="Leaders">Leaders / Advisors</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Blood Type</label>
                    <select
                      value={editBloodType}
                      onChange={(e) => setEditBloodType(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-slate-50/30"
                    >
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Investiture Date</label>
                    <input
                      type="date"
                      value={editInvestitureDate}
                      onChange={(e) => setEditInvestitureDate(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-slate-50/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Badge Rank</label>
                    <input
                      type="text"
                      value={editBadge}
                      onChange={(e) => setEditBadge(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-slate-50/30"
                    />
                  </div>
                </div>
              </div>

              {/* Category: Contact & Address */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Mail className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Contact & Address</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-slate-50/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Mobile Number (Primary Phone)</label>
                    <input
                      type="text"
                      value={editMobile}
                      onChange={(e) => setEditMobile(e.target.value)}
                      placeholder="+960 7XXXXXX"
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-slate-50/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Secondary Phone / Landline (Optional)</label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+960 3XXXXXX"
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-slate-50/30"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Permanent Address</label>
                  <textarea
                    value={editPermanentAddress}
                    onChange={(e) => setEditPermanentAddress(e.target.value)}
                    placeholder="House name / Address, Road Name, District, Island, Atoll, Country"
                    rows={2}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-slate-50/30 resize-none"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-600">Current Address</label>
                    <button
                      type="button"
                      onClick={() => {
                        const topCorner = getTopCornerAddress();
                        setEditCurrentAddress(topCorner);
                        setEditLocation(topCorner);
                      }}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                      title="Insert location from top corner address selector"
                    >
                      <MapPin className="w-3 h-3" />
                      Insert Top-Corner Address
                    </button>
                  </div>
                  <textarea
                    value={editCurrentAddress}
                    onChange={(e) => {
                      setEditCurrentAddress(e.target.value);
                      setEditLocation(e.target.value);
                    }}
                    placeholder="House name / Address, Road Name, District, Island, Atoll, Country"
                    rows={2}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-slate-50/30 resize-none"
                  />
                </div>
              </div>

              {/* Category: Socials */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Compass className="w-4 h-4 text-purple-600" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Digital Socials</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Telegram</label>
                    <input
                      type="text"
                      value={editTelegram}
                      onChange={(e) => setEditTelegram(e.target.value)}
                      placeholder="@username"
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-slate-50/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Whatsapp</label>
                    <input
                      type="text"
                      value={editWhatsapp}
                      onChange={(e) => setEditWhatsapp(e.target.value)}
                      placeholder="+960 XXX"
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-slate-50/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Instagram</label>
                    <input
                      type="text"
                      value={editInstagram}
                      onChange={(e) => setEditInstagram(e.target.value)}
                      placeholder="@username"
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-slate-50/30"
                    />
                  </div>
                </div>
              </div>

              {/* Category: Emergency Contact */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Emergency Contact</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Contact Person Name</label>
                    <input
                      type="text"
                      value={editEmergencyName}
                      onChange={(e) => setEditEmergencyName(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-slate-50/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Emergency Phone Number</label>
                    <input
                      type="text"
                      value={editEmergencyPhone}
                      onChange={(e) => setEditEmergencyPhone(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-slate-50/30"
                    />
                  </div>
                </div>
              </div>

              {/* Category: Portal Status & Assignment */}
              <div className="space-y-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <ShieldCheck className="w-4 h-4 text-slate-700" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Portal Assignment & Status</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Role / Assignment</label>
                    <input
                      type="text"
                      required
                      value={editRole}
                      onChange={(e) => setEditRole(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Crew</label>
                    <select
                      value={editCrew}
                      onChange={(e) => setEditCrew(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-white"
                    >
                      {crews.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Membership Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-white font-medium"
                    >
                      <option value="Active">Active</option>
                      <option value="Training">Training</option>
                      <option value="On Leave">On Leave</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 pb-4">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 rounded-xl text-xs font-bold text-white bg-[#800020] hover:bg-[#6b1426] transition-colors shadow-lg"
                >
                  Save Member Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Full Member Profile Dossier Modal */}
      {viewingMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 p-6 bg-slate-50/50 rounded-t-2xl">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1e40af] to-[#0f1e36] text-white flex items-center justify-center font-bold text-lg shadow-md">
                  {viewingMember.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-[#0f1e36]">
                      {viewingMember.name}
                    </h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      viewingMember.status === 'Active' 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : viewingMember.status === 'Training'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {viewingMember.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {viewingMember.username || '@' + viewingMember.name.toLowerCase().replace(/[^a-z0-9_]/g, '')} • {viewingMember.role} • {viewingMember.crew}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingMember(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-2 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* ID Card Display */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-blue-900">
                      ID Card Number
                    </div>
                    <div className="text-lg font-mono font-extrabold text-blue-950 tracking-wider">
                      {viewingMember.idCard || 'NOT SET'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal & Identity Dossier */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Personal & Scout Identity</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Section</span>
                    <span className="text-xs font-bold text-slate-800">{viewingMember.section || 'Unassigned'}</span>
                  </div>
                  <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Badge Rank</span>
                    <span className="text-xs font-bold text-slate-800">{viewingMember.badgeRank || 'Scout'}</span>
                  </div>
                  <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gender</span>
                    <span className="text-xs font-bold text-slate-800">{viewingMember.gender || 'Male'}</span>
                  </div>
                  <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date of Birth (Age)</span>
                    <span className="text-xs font-bold text-slate-800">{viewingMember.dateOfBirth} ({calculateAge(viewingMember.dateOfBirth)} yrs)</span>
                  </div>
                  <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Blood Type</span>
                    <span className="text-xs font-bold text-red-600">{viewingMember.bloodType || 'A+'}</span>
                  </div>
                  <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Investiture Date</span>
                    <span className="text-xs font-bold text-slate-800">{viewingMember.investitureDate || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Contact & Addresses */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Mail className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Contact & Addresses</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3.5 bg-emerald-50/40 border border-emerald-100 rounded-xl">
                    <div className="flex items-center gap-1.5 text-emerald-700 text-[10px] font-bold uppercase tracking-wider mb-1">
                      <Phone className="w-3 h-3" />
                      Mobile Number (Primary)
                    </div>
                    <span className="text-sm font-bold text-slate-900">{viewingMember.mobile || viewingMember.phone || 'N/A'}</span>
                  </div>
                  <div className="p-3.5 bg-slate-50/70 border border-slate-100 rounded-xl">
                    <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                      <Phone className="w-3 h-3" />
                      Secondary Phone
                    </div>
                    <span className="text-sm font-semibold text-slate-800">{viewingMember.phone && viewingMember.phone !== viewingMember.mobile ? viewingMember.phone : 'None'}</span>
                  </div>
                  <div className="p-3.5 bg-slate-50/70 border border-slate-100 rounded-xl sm:col-span-2">
                    <div className="flex items-center gap-1.5 text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                      <Mail className="w-3 h-3" />
                      Email Address
                    </div>
                    <span className="text-xs font-semibold text-slate-800">{viewingMember.email}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="p-3 bg-slate-50/70 border border-slate-100 rounded-xl">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Permanent Address</span>
                    <p className="text-xs text-slate-800 font-medium">{viewingMember.permanentAddress || 'Not specified'}</p>
                  </div>
                  <div className="p-3 bg-blue-50/30 border border-blue-100 rounded-xl">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="block text-[10px] font-bold text-[#1e40af] uppercase tracking-wider">Current Address</span>
                    </div>
                    <p className="text-xs text-slate-900 font-medium">{viewingMember.currentAddress || viewingMember.location || 'Malé Crew HQ'}</p>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              {(viewingMember.emergencyContactName || viewingMember.emergencyContactNumber) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Emergency Contact</h3>
                  </div>
                  <div className="p-3.5 bg-amber-50/40 border border-amber-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="block text-[10px] font-bold text-amber-800 uppercase tracking-wider">Contact Person</span>
                      <span className="text-xs font-bold text-slate-900">{viewingMember.emergencyContactName || 'N/A'}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[10px] font-bold text-amber-800 uppercase tracking-wider">Emergency Phone</span>
                      <span className="text-xs font-bold text-slate-900">{viewingMember.emergencyContactNumber || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Digital Socials */}
              {(viewingMember.telegram || viewingMember.whatsapp || viewingMember.instagram) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Compass className="w-4 h-4 text-purple-600" />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Digital Socials</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-2.5 bg-slate-50/70 border border-slate-100 rounded-xl text-center">
                      <span className="block text-[9px] font-bold text-slate-500 uppercase">Telegram</span>
                      <span className="text-xs font-semibold text-slate-800 truncate block">{viewingMember.telegram || '—'}</span>
                    </div>
                    <div className="p-2.5 bg-slate-50/70 border border-slate-100 rounded-xl text-center">
                      <span className="block text-[9px] font-bold text-slate-500 uppercase">WhatsApp</span>
                      <span className="text-xs font-semibold text-slate-800 truncate block">{viewingMember.whatsapp || '—'}</span>
                    </div>
                    <div className="p-2.5 bg-slate-50/70 border border-slate-100 rounded-xl text-center">
                      <span className="block text-[9px] font-bold text-slate-500 uppercase">Instagram</span>
                      <span className="text-xs font-semibold text-slate-800 truncate block">{viewingMember.instagram || '—'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-b-2xl">
              <span className="text-xs text-slate-500 font-medium">Joined: {viewingMember.joinedDate || 'N/A'}</span>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={() => handleSendWelcomeChat(viewingMember)}
                      className="px-3.5 py-2 rounded-xl text-xs font-bold text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Send Welcome to Chat
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const m = viewingMember;
                        setViewingMember(null);
                        handleOpenEditMember(m);
                      }}
                      className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#1e40af] hover:bg-[#1e3a8a] transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit Member Profile
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setViewingMember(null)}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Update Member Location Modal */}
      {locationMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center text-red-600 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0f1e36]">
                    Update Location
                  </h3>
                  <p className="text-xs font-medium text-slate-500">{locationMember.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLocationMember(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveLocation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Current Member Location
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={newLocationText}
                    onChange={(e) => setNewLocationText(e.target.value)}
                    placeholder="e.g. Malé Crew HQ, Hulhumalé Scout Base..."
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af]"
                  />
                  <MapPin className="w-4 h-4 text-red-500 absolute left-3 top-3" />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setLocationMember(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1e40af] hover:bg-[#1e3a8a] transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Save Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Crew Modal */}
      {editingCrew && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-xl space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-[#0f1e36]">
                Update Crew Details
              </h2>
              <button
                onClick={() => setEditingCrew(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditedCrew} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Crew Name</label>
                <input
                  type="text"
                  required
                  value={editCrewName}
                  onChange={(e) => setEditCrewName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  value={editCrewDesc}
                  onChange={(e) => setEditCrewDesc(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af] resize-none"
                  rows={3}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingCrew(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Crew Deletion */}
      {crewToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-base font-bold text-[#0f1e36]">
                Confirm Crew Deletion
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove <strong className="text-slate-900">{crewToDelete.name}</strong>? This action is authorized for Council members, Rover Advisors, Leaders, and Admins.
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setCrewToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCrew}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-xs cursor-pointer"
              >
                Yes, Delete Crew
              </button>
            </div>
          </div>
        </div>
      )}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-base font-bold text-[#0f1e36]">
                Confirm Member Removal
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove <strong className="text-slate-900">{memberToDelete.name}</strong> ({memberToDelete.crew})? This action will permanently delete their account record from the database.
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setMemberToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteMember}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-xs cursor-pointer"
              >
                Yes, Remove Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Resetting Password */}
      {memberToResetPwd && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                <KeyRound className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="text-base font-bold text-[#0f1e36]">
                Reset Portal Password
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Reset login password for <strong className="text-slate-900">{memberToResetPwd.name}</strong> to default password (<code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-800">123456</code>)?
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setMemberToResetPwd(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmResetPassword}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-xs cursor-pointer"
              >
                Reset Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Leader Login Deletion */}
      {leaderToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-base font-bold text-[#0f1e36]">
                Confirm Login Deletion
              </h3>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to revoke portal login credentials for <strong className="text-slate-900">{leaderToDelete.name}</strong> ({leaderToDelete.title})? This action cannot be undone and will immediately disable their administrative access.
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setLeaderToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteLeader}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-xs cursor-pointer"
              >
                Yes, Revoke Login
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create New Crew Modal */}
      {isAddCrewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-xl space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-[#0f1e36]">
                Create New Crew
              </h2>
              <button
                onClick={() => setIsAddCrewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewCrew} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Crew Name</label>
                <input
                  type="text"
                  required
                  value={newCrewName}
                  onChange={(e) => setNewCrewName(e.target.value)}
                  placeholder="e.g. Echo Crew"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  value={newCrewDesc}
                  onChange={(e) => setNewCrewDesc(e.target.value)}
                  placeholder="e.g. Specialized in maritime navigation"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af] resize-none"
                  rows={3}
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddCrewModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-xs"
                >
                  Create Crew
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register New Crew Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 p-6">
              <div>
                <h2 className="text-lg font-bold text-[#0f1e36]">
                  Official Member Registration
                </h2>
                <p className="text-xs text-slate-500 font-medium">Arabiyya Rover Crew Network</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-2"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewMember} className="flex-1 overflow-y-auto p-6 space-y-8">
              {/* Category: Personal & Identity */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Shield className="w-4 h-4 text-blue-600" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Personal & Identity</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Full name as per ID"
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-slate-50/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">ID Card Number</label>
                    <input
                      type="text"
                      required
                      value={newIdCard}
                      onChange={(e) => setNewIdCard(e.target.value)}
                      placeholder="e.g. A123456"
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-slate-50/30 uppercase font-mono"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      required
                      value={newDOB}
                      onChange={(e) => setNewDOB(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-slate-50/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Gender</label>
                    <select
                      value={newGender}
                      onChange={(e) => setNewGender(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-slate-50/30"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Section</label>
                    <select
                      value={newSection}
                      onChange={(e) => setNewSection(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-slate-50/30"
                    >
                      <option value="Explorers">Explorers (Junior)</option>
                      <option value="Rovers">Rovers (Senior)</option>
                      <option value="Leaders">Leaders / Advisors</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Blood Type</label>
                    <select
                      value={newBloodType}
                      onChange={(e) => setNewBloodType(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-slate-50/30"
                    >
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Investiture Date</label>
                  <input
                    type="date"
                    value={newInvestitureDate}
                    onChange={(e) => setNewInvestitureDate(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-slate-50/30"
                  />
                </div>
              </div>

              {/* Category: Contact & Address */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Mail className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Contact & Address</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="member@arabiyyarover.org"
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-slate-50/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Mobile Number (Primary Phone)</label>
                    <input
                      type="text"
                      required
                      value={newMobile}
                      onChange={(e) => setNewMobile(e.target.value)}
                      placeholder="+960 7XXXXXX"
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-slate-50/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Secondary Phone (Optional)</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+960 3XXXXXX"
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-slate-50/30"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Permanent Address</label>
                  <textarea
                    required
                    value={newPermanentAddress}
                    onChange={(e) => setNewPermanentAddress(e.target.value)}
                    placeholder="House name / Address, Road Name, District, Island, Atoll, Country"
                    rows={2}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-slate-50/30 resize-none"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-bold text-slate-600">Current Address</label>
                    <button
                      type="button"
                      onClick={() => setNewCurrentAddress(getTopCornerAddress())}
                      className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                      title="Insert location from top corner address selector"
                    >
                      <MapPin className="w-3 h-3" />
                      Insert Top-Corner Address
                    </button>
                  </div>
                  <textarea
                    required
                    value={newCurrentAddress}
                    onChange={(e) => setNewCurrentAddress(e.target.value)}
                    placeholder="House name / Address, Road Name, District, Island, Atoll, Country"
                    rows={2}
                    className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-slate-50/30 resize-none"
                  />
                </div>
              </div>

              {/* Category: Socials */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Compass className="w-4 h-4 text-purple-600" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Digital Socials</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Telegram</label>
                    <input
                      type="text"
                      value={newTelegram}
                      onChange={(e) => setNewTelegram(e.target.value)}
                      placeholder="@username"
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-slate-50/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Whatsapp</label>
                    <input
                      type="text"
                      value={newWhatsapp}
                      onChange={(e) => setNewWhatsapp(e.target.value)}
                      placeholder="+960 XXX"
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-slate-50/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Instagram</label>
                    <input
                      type="text"
                      value={newInstagram}
                      onChange={(e) => setNewInstagram(e.target.value)}
                      placeholder="@username"
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-slate-50/30"
                    />
                  </div>
                </div>
              </div>

              {/* Category: Emergency Contact */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Emergency Contact</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Contact Person Name</label>
                    <input
                      type="text"
                      required
                      value={newEmergencyName}
                      onChange={(e) => setNewEmergencyName(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-slate-50/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Emergency Phone Number</label>
                    <input
                      type="text"
                      required
                      value={newEmergencyPhone}
                      onChange={(e) => setNewEmergencyPhone(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-slate-50/30"
                    />
                  </div>
                </div>
              </div>

              {/* Member Assignment Section */}
              <div className="space-y-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <ShieldCheck className="w-4 h-4 text-slate-700" />
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Portal Assignment</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Crew Assignment</label>
                    <select
                      value={newCrew}
                      onChange={(e) => setNewCrew(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-white"
                    >
                      {crews.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Council Role (Optional)</label>
                    <select
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#1e40af] bg-white"
                    >
                      <option value="Normal Rover Member">Normal Rover Member</option>
                      <option value="Council Member">Council Member</option>
                      <option value="Council Secretary">Council Secretary</option>
                      <option value="Council Treasurer">Council Treasurer</option>
                      <option value="Council Quartermaster">Council Quartermaster</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">Portal Login Password</label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#1e40af] bg-white font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1 italic">Note: Member will be prompted to change this on first login.</p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 pb-4">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 rounded-xl text-xs font-bold text-white bg-[#800020] hover:bg-[#6b1426] transition-colors shadow-lg"
                >
                  Confirm Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register New Leader / Advisor Modal */}
      {isAddLeaderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-xl space-y-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-[#0f1e36]">
                Add Advisor / Leader Login Credential
              </h2>
              <button
                onClick={() => setIsAddLeaderModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewLeader} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Leader / Advisor Full Name</label>
                  <input
                    type="text"
                    required
                    value={ldrName}
                    onChange={(e) => setLdrName(e.target.value)}
                    placeholder="e.g. Aminath Sana"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Username (e.g. @sana)</label>
                  <input
                    type="text"
                    value={ldrUsername}
                    onChange={(e) => setLdrUsername(e.target.value)}
                    placeholder="e.g. @sana"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Title / Designation</label>
                  <input
                    type="text"
                    value={ldrTitle}
                    onChange={(e) => setLdrTitle(e.target.value)}
                    placeholder="e.g. Senior Rover Advisor"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Access Level</label>
                  <select
                    value={ldrAccess}
                    onChange={(e) => setLdrAccess(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af] bg-white"
                  >
                    <option value="Advisor Full Admin">Advisor Full Admin</option>
                    <option value="Leader Portal Access">Leader Portal Access</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={ldrEmail}
                    onChange={(e) => setLdrEmail(e.target.value)}
                    placeholder="name@arabiyyarover.org"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={ldrPhone}
                    onChange={(e) => setLdrPhone(e.target.value)}
                    placeholder="+960 7XX-XXXX"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddLeaderModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[#1e40af] hover:bg-[#1e3a8a] transition-colors shadow-xs"
                >
                  Save Credential
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
