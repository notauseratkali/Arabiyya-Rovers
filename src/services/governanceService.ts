import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  deleteDoc, 
  onSnapshot, 
  query,
  writeBatch 
} from 'firebase/firestore';
import { db } from '../firebase';

export interface AssignedPerson {
  id: string;
  name: string;
  username?: string;
  role?: string;
  crew?: string;
  email?: string;
  phone?: string;
  type: 'member' | 'leader';
}

export interface OrgNode {
  id: string;
  title: string;
  category: 'supervisory' | 'forum' | 'council' | 'chairperson' | 'executive' | 'committee' | 'advisory';
  bgClass: string;
  borderClass: string;
  textClass: string;
  badgeClass: string;
  reportsTo?: string[];
  supervises?: string[];
  coordinatesWith?: string[];
  description: string;
  wing: 'ARC Rover Wing' | 'Committees & Advisory';
  electionMethod?: string;
  assignedPeople?: AssignedPerson[];
  order?: number;
  isCustom?: boolean;
}

export const COLOR_THEMES: Record<string, { label: string; bgClass: string; borderClass: string; textClass: string; badgeClass: string; previewBg: string }> = {
  blue_exec: {
    label: 'Navy Executive (Chair / Council)',
    bgClass: 'bg-blue-600 text-white shadow-md hover:bg-blue-700',
    borderClass: 'border-blue-700',
    textClass: 'text-white',
    badgeClass: 'bg-blue-800 text-blue-100 border-blue-500',
    previewBg: 'bg-blue-600'
  },
  sky_coord: {
    label: 'Sky Blue (Executive Coordinators)',
    bgClass: 'bg-sky-600 text-white shadow-sm hover:bg-sky-700',
    borderClass: 'border-sky-700',
    textClass: 'text-white',
    badgeClass: 'bg-sky-800 text-sky-100 border-sky-500',
    previewBg: 'bg-sky-600'
  },
  purple_comm: {
    label: 'Purple (Committees & Standards)',
    bgClass: 'bg-purple-600 text-white shadow-sm hover:bg-purple-700',
    borderClass: 'border-purple-700',
    textClass: 'text-white',
    badgeClass: 'bg-purple-800 text-purple-100 border-purple-500',
    previewBg: 'bg-purple-600'
  },
  slate_adv: {
    label: 'Slate Grey (Advisory & Counsel)',
    bgClass: 'bg-slate-600 text-white shadow-sm hover:bg-slate-700',
    borderClass: 'border-slate-700',
    textClass: 'text-white',
    badgeClass: 'bg-slate-800 text-slate-100 border-slate-500',
    previewBg: 'bg-slate-600'
  },
  rose_sup: {
    label: 'Rose Red (Supervisory & Oversight)',
    bgClass: 'bg-rose-500 text-white shadow-md hover:bg-rose-600',
    borderClass: 'border-rose-600',
    textClass: 'text-white',
    badgeClass: 'bg-rose-700 text-white border-rose-400',
    previewBg: 'bg-rose-500'
  },
  emerald_ops: {
    label: 'Emerald Green (Field & Operations)',
    bgClass: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700',
    borderClass: 'border-emerald-700',
    textClass: 'text-white',
    badgeClass: 'bg-emerald-800 text-emerald-100 border-emerald-500',
    previewBg: 'bg-emerald-600'
  },
  amber_strat: {
    label: 'Amber Gold (Strategy & Training)',
    bgClass: 'bg-amber-600 text-white shadow-sm hover:bg-amber-700',
    borderClass: 'border-amber-700',
    textClass: 'text-white',
    badgeClass: 'bg-amber-800 text-amber-100 border-amber-500',
    previewBg: 'bg-amber-600'
  }
};

export const INITIAL_ORG_NODES: Record<string, OrgNode> = {
  rover_advisor: {
    id: 'rover_advisor',
    title: 'Rover Advisor',
    category: 'supervisory',
    bgClass: 'bg-rose-500 text-white shadow-md hover:bg-rose-600',
    borderClass: 'border-rose-600',
    textClass: 'text-white',
    badgeClass: 'bg-rose-700 text-white border-rose-400',
    supervises: ['chairperson'],
    coordinatesWith: ['arc_rover_forum'],
    description: 'Top supervisory role overseeing the ARC Rover Forum and providing strategic guidance to the Chairperson and Council.',
    wing: 'ARC Rover Wing',
    electionMethod: 'Appointed Leadership',
    order: 1,
    assignedPeople: [
      { id: 'l1', name: 'Ahmed Ziyad', role: 'Rover Advisor', type: 'leader', email: 'ziyad@arabiyyarover.org', phone: '+960 777-1234' }
    ]
  },
  arc_rover_forum: {
    id: 'arc_rover_forum',
    title: 'ARC Rover Forum',
    category: 'forum',
    bgClass: 'bg-slate-800 text-white shadow-md hover:bg-slate-900',
    borderClass: 'border-slate-900',
    textClass: 'text-white',
    badgeClass: 'bg-slate-950 text-slate-200 border-slate-700',
    supervises: ['arc_council'],
    reportsTo: ['rover_advisor'],
    description: 'General assembly of Rover Scouts that elects representatives to the ARC Council.',
    wing: 'ARC Rover Wing',
    electionMethod: 'Member Assembly',
    order: 2
  },
  arc_council: {
    id: 'arc_council',
    title: 'ARC Council',
    category: 'council',
    bgClass: 'bg-blue-900 text-white shadow-md hover:bg-blue-950',
    borderClass: 'border-blue-950',
    textClass: 'text-white',
    badgeClass: 'bg-blue-950 text-blue-200 border-blue-800',
    reportsTo: ['arc_rover_forum'],
    supervises: ['chairperson'],
    description: 'Primary governing council elected by the ARC Rover Forum to manage troop operations and executive leadership.',
    wing: 'ARC Rover Wing',
    electionMethod: 'Elected by ARC Rover Forum',
    order: 3
  },
  chairperson: {
    id: 'chairperson',
    title: 'Chairperson',
    category: 'chairperson',
    bgClass: 'bg-blue-600 text-white shadow-md hover:bg-blue-700',
    borderClass: 'border-blue-700',
    textClass: 'text-white',
    badgeClass: 'bg-blue-800 text-blue-100 border-blue-500',
    reportsTo: ['rover_advisor', 'arc_council'],
    supervises: ['vice_chairperson', 'secretary', 'treasurer', 'progress_coordinator', 'event_coordinator', 'media_coordinator'],
    coordinatesWith: ['policy_committee', 'media_pr_committee', 'advisor_to_chairperson'],
    description: 'Executive head of the ARC Council responsible for leading meetings, overseeing executive officers, and setting strategic direction.',
    wing: 'ARC Rover Wing',
    electionMethod: 'Elected by Council',
    order: 4
  },
  policy_committee: {
    id: 'policy_committee',
    title: 'Policy Committee',
    category: 'committee',
    bgClass: 'bg-purple-600 text-white shadow-sm hover:bg-purple-700',
    borderClass: 'border-purple-700',
    textClass: 'text-white',
    badgeClass: 'bg-purple-800 text-purple-100 border-purple-500',
    reportsTo: ['chairperson'],
    description: 'Specialized committee formulating constitutional policies, governance guidelines, and operational regulations.',
    wing: 'Committees & Advisory',
    electionMethod: 'Council Appointed',
    order: 5
  },
  media_pr_committee: {
    id: 'media_pr_committee',
    title: 'Media & PR Committee',
    category: 'committee',
    bgClass: 'bg-purple-600 text-white shadow-sm hover:bg-purple-700',
    borderClass: 'border-purple-700',
    textClass: 'text-white',
    badgeClass: 'bg-purple-800 text-purple-100 border-purple-500',
    reportsTo: ['chairperson'],
    coordinatesWith: ['media_coordinator'],
    description: 'Committee advising and supporting public relations strategy, branding standards, and media outreach.',
    wing: 'Committees & Advisory',
    electionMethod: 'Council Appointed',
    order: 6
  },
  advisor_to_chairperson: {
    id: 'advisor_to_chairperson',
    title: 'Advisor to Chairperson',
    category: 'advisory',
    bgClass: 'bg-slate-600 text-white shadow-sm hover:bg-slate-700',
    borderClass: 'border-slate-700',
    textClass: 'text-white',
    badgeClass: 'bg-slate-800 text-slate-100 border-slate-500',
    reportsTo: ['chairperson'],
    description: 'Senior consultative advisor giving direct strategic and procedural counsel to the Chairperson.',
    wing: 'Committees & Advisory',
    electionMethod: 'Appointed',
    order: 7
  },
  vice_chairperson: {
    id: 'vice_chairperson',
    title: 'Vice Chairperson',
    category: 'chairperson',
    bgClass: 'bg-blue-500 text-white shadow-sm hover:bg-blue-600',
    borderClass: 'border-blue-600',
    textClass: 'text-white',
    badgeClass: 'bg-blue-700 text-blue-100 border-blue-400',
    reportsTo: ['chairperson'],
    description: 'Second-in-command assisting the Chairperson in executive operations and presiding over meetings in their absence.',
    wing: 'ARC Rover Wing',
    electionMethod: 'Elected',
    order: 8
  },
  secretary: {
    id: 'secretary',
    title: 'Secretary',
    category: 'executive',
    bgClass: 'bg-sky-600 text-white shadow-sm hover:bg-sky-700',
    borderClass: 'border-sky-700',
    textClass: 'text-white',
    badgeClass: 'bg-sky-800 text-sky-100 border-sky-500',
    reportsTo: ['chairperson', 'vice_chairperson'],
    description: 'Executive officer managing official documentation, meeting minutes, member records, and council correspondence.',
    wing: 'ARC Rover Wing',
    electionMethod: 'Council Elected',
    order: 9,
    assignedPeople: [
      { id: 'm3', name: 'Mariyam Shazra', role: 'Council Secretary', crew: 'Delta Crew', type: 'member', email: 'shazra.m@arabiyyarover.org', phone: '+960 790-3456' }
    ]
  },
  treasurer: {
    id: 'treasurer',
    title: 'Treasurer',
    category: 'executive',
    bgClass: 'bg-sky-600 text-white shadow-sm hover:bg-sky-700',
    borderClass: 'border-sky-700',
    textClass: 'text-white',
    badgeClass: 'bg-sky-800 text-sky-100 border-sky-500',
    reportsTo: ['chairperson', 'vice_chairperson'],
    description: 'Executive officer managing financial accounts, budgets, fundraising records, and expenditure approvals.',
    wing: 'ARC Rover Wing',
    electionMethod: 'Council Elected',
    order: 10,
    assignedPeople: [
      { id: 'm4', name: 'Hussain Rameez', role: 'Council Treasurer', crew: 'Bravo Crew', type: 'member', email: 'rameez.h@arabiyyarover.org', phone: '+960 745-6789' }
    ]
  },
  quartermaster: {
    id: 'quartermaster',
    title: 'Council Quartermaster',
    category: 'executive',
    bgClass: 'bg-sky-600 text-white shadow-sm hover:bg-sky-700',
    borderClass: 'border-sky-700',
    textClass: 'text-white',
    badgeClass: 'bg-sky-800 text-sky-100 border-sky-500',
    reportsTo: ['chairperson', 'vice_chairperson'],
    description: 'Executive officer responsible for expedition equipment, gear inventory, storage logistics, and gear maintenance.',
    wing: 'ARC Rover Wing',
    electionMethod: 'Council Elected',
    order: 11,
    assignedPeople: [
      { id: 'm2', name: 'Ibrahim Nashidh', role: 'Council Quartermaster', crew: 'Alpha Crew', type: 'member', email: 'nashidh.i@arabiyyarover.org', phone: '+960 789-2345' }
    ]
  },
  progress_coordinator: {
    id: 'progress_coordinator',
    title: 'Progress Coordinator',
    category: 'executive',
    bgClass: 'bg-sky-600 text-white shadow-sm hover:bg-sky-700',
    borderClass: 'border-sky-700',
    textClass: 'text-white',
    badgeClass: 'bg-sky-800 text-sky-100 border-sky-500',
    reportsTo: ['chairperson', 'vice_chairperson'],
    description: 'Executive officer tracking badge progress, training schemes, advancement matrix, and skill certifications.',
    wing: 'ARC Rover Wing',
    electionMethod: 'Council Elected',
    order: 12
  },
  event_coordinator: {
    id: 'event_coordinator',
    title: 'Event Coordinator',
    category: 'executive',
    bgClass: 'bg-sky-600 text-white shadow-sm hover:bg-sky-700',
    borderClass: 'border-sky-700',
    textClass: 'text-white',
    badgeClass: 'bg-sky-800 text-sky-100 border-sky-500',
    reportsTo: ['chairperson', 'vice_chairperson'],
    description: 'Executive officer planning and executing troop expeditions, camps, community service projects, and events.',
    wing: 'ARC Rover Wing',
    electionMethod: 'Council Elected',
    order: 13
  },
  media_coordinator: {
    id: 'media_coordinator',
    title: 'Media Coordinator',
    category: 'executive',
    bgClass: 'bg-sky-600 text-white shadow-sm hover:bg-sky-700',
    borderClass: 'border-sky-700',
    textClass: 'text-white',
    badgeClass: 'bg-sky-800 text-sky-100 border-sky-500',
    reportsTo: ['chairperson', 'vice_chairperson'],
    coordinatesWith: ['media_pr_committee'],
    description: 'Executive officer directing social media accounts, photography, publications, branding, and press releases.',
    wing: 'ARC Rover Wing',
    electionMethod: 'Council Elected',
    order: 14
  }
};

const GOVERNANCE_COLLECTION = 'governance_organogram';
const LOCAL_STORAGE_KEY = 'koshaaru_governance_nodes_v1';

export function getLocalGovernanceNodes(): Record<string, OrgNode> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading local governance nodes:', e);
  }
  return INITIAL_ORG_NODES;
}

export function saveLocalGovernanceNodes(nodes: Record<string, OrgNode>): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nodes));
  } catch (e) {
    console.error('Error saving local governance nodes:', e);
  }
}

export function subscribeToGovernanceNodes(
  onUpdate: (nodes: Record<string, OrgNode>) => void,
  onError?: (err: Error) => void
) {
  // Immediately feed local cache / initial nodes
  const initial = getLocalGovernanceNodes();
  onUpdate(initial);

  try {
    const colRef = collection(db, GOVERNANCE_COLLECTION);
    return onSnapshot(colRef, async (snapshot) => {
      if (snapshot.empty) {
        try {
          const settingsRef = doc(db, 'system', 'governance_settings');
          const settingsSnap = await getDoc(settingsRef);
          if (!settingsSnap.exists() || !settingsSnap.data()?.organogramSeeded) {
            // Seed initial nodes
            const batch = writeBatch(db);
            Object.values(INITIAL_ORG_NODES).forEach(node => {
              const nodeRef = doc(db, GOVERNANCE_COLLECTION, node.id);
              batch.set(nodeRef, node);
            });
            batch.set(settingsRef, { organogramSeeded: true }, { merge: true });
            await batch.commit();
            saveLocalGovernanceNodes(INITIAL_ORG_NODES);
            onUpdate(INITIAL_ORG_NODES);
            return;
          }
        } catch (seedErr) {
          console.error('Error seeding governance organogram:', seedErr);
        }
        onUpdate(INITIAL_ORG_NODES);
        return;
      }

      const nodesMap: Record<string, OrgNode> = {};
      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data() as OrgNode;
        nodesMap[docSnap.id] = {
          ...data,
          id: docSnap.id
        };
      });

      saveLocalGovernanceNodes(nodesMap);
      onUpdate(nodesMap);
    }, (err) => {
      console.error('Firestore subscription error for governance nodes:', err);
      const fallback = getLocalGovernanceNodes();
      onUpdate(fallback);
      if (onError) onError(err);
    });
  } catch (err) {
    console.error('Failed to init governance subscription:', err);
    if (onError) onError(err as Error);
    return () => {};
  }
}

export async function saveGovernanceNode(node: OrgNode): Promise<void> {
  const nodeId = node.id || 'role_' + Date.now().toString();
  const nodeWithId: OrgNode = {
    ...node,
    id: nodeId
  };

  // Update local cache immediately
  const local = getLocalGovernanceNodes();
  local[nodeId] = nodeWithId;
  saveLocalGovernanceNodes(local);

  try {
    const nodeRef = doc(db, GOVERNANCE_COLLECTION, nodeId);
    await setDoc(nodeRef, nodeWithId, { merge: true });
  } catch (err) {
    console.error('Failed to save governance node to Firestore:', err);
  }
}

export async function deleteGovernanceNode(nodeId: string): Promise<void> {
  // Update local cache
  const local = getLocalGovernanceNodes();
  delete local[nodeId];
  saveLocalGovernanceNodes(local);

  try {
    const nodeRef = doc(db, GOVERNANCE_COLLECTION, nodeId);
    await deleteDoc(nodeRef);
  } catch (err) {
    console.error('Failed to delete governance node from Firestore:', err);
  }
}

export async function assignPersonToNode(nodeId: string, person: AssignedPerson): Promise<void> {
  const local = getLocalGovernanceNodes();
  const targetNode = local[nodeId];
  if (!targetNode) return;

  const currentPeople = targetNode.assignedPeople || [];
  // Avoid duplicate ID
  const filtered = currentPeople.filter(p => p.id !== person.id);
  const updatedPeople = [...filtered, person];

  const updatedNode: OrgNode = {
    ...targetNode,
    assignedPeople: updatedPeople
  };

  await saveGovernanceNode(updatedNode);
}

export async function removePersonFromNode(nodeId: string, personId: string): Promise<void> {
  const local = getLocalGovernanceNodes();
  const targetNode = local[nodeId];
  if (!targetNode) return;

  const currentPeople = targetNode.assignedPeople || [];
  const updatedPeople = currentPeople.filter(p => p.id !== personId);

  const updatedNode: OrgNode = {
    ...targetNode,
    assignedPeople: updatedPeople
  };

  await saveGovernanceNode(updatedNode);
}

export async function resetGovernanceNodesToDefault(): Promise<void> {
  saveLocalGovernanceNodes(INITIAL_ORG_NODES);

  try {
    const batch = writeBatch(db);
    // Delete all current docs
    const snapshot = await collection(db, GOVERNANCE_COLLECTION);
    // Overwrite initial
    Object.values(INITIAL_ORG_NODES).forEach(node => {
      const ref = doc(db, GOVERNANCE_COLLECTION, node.id);
      batch.set(ref, node);
    });
    await batch.commit();
  } catch (err) {
    console.error('Failed to reset governance nodes to default in Firestore:', err);
  }
}
