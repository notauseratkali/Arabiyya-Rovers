import { collection, doc, setDoc, getDocs, deleteDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export interface CouncilRole {
  id: string;
  roleName: string;
  assignedRoverName?: string;
  crew?: string;
  description?: string;
}

const COUNCIL_ROLES_COLLECTION = 'council_roles';

export const EXECUTIVE_COUNCIL_ROLES: CouncilRole[] = [
  { id: 'cr_advisor', roleName: 'Rover Advisor', assignedRoverName: 'Ahmed Ziyad', crew: 'Council Advisory', description: 'Top supervisory role overseeing ARC Rover Forum and Council strategy' },
  { id: 'cr_chair', roleName: 'Chairperson', assignedRoverName: '', crew: 'Executive Council', description: 'Executive head responsible for meetings and strategic direction' },
  { id: 'cr_vchair', roleName: 'Vice Chairperson', assignedRoverName: '', crew: 'Executive Council', description: 'Assisting Chairperson and presiding over operations' },
  { id: 'cr_sec', roleName: 'Council Secretary', assignedRoverName: 'Mariyam Shazra', crew: 'Delta Crew', description: 'Official documentation, minutes, and council records' },
  { id: 'cr_tres', roleName: 'Council Treasurer', assignedRoverName: 'Hussain Rameez', crew: 'Bravo Crew', description: 'Financial accounts, budgets, and expenditure approvals' },
  { id: 'cr_qm', roleName: 'Council Quartermaster', assignedRoverName: 'Ibrahim Nashidh', crew: 'Alpha Crew', description: 'Gear inventory, camping equipment, and logistics' },
  { id: 'cr_prog', roleName: 'Progress Coordinator', assignedRoverName: '', crew: 'Alpha Crew', description: 'Badge advancement matrix and training scheme tracking' },
  { id: 'cr_event', roleName: 'Event Coordinator', assignedRoverName: '', crew: 'Delta Crew', description: 'Troop expeditions, camps, and community service projects' },
  { id: 'cr_media', roleName: 'Media Coordinator', assignedRoverName: '', crew: 'Beta Crew', description: 'Social media, publications, branding, and press releases' },
  { id: 'cr_policy', roleName: 'Policy Committee Member', assignedRoverName: '', crew: 'Executive Council', description: 'Constitutional policies and governance regulations' },
  { id: 'cr_pr', roleName: 'Media & PR Committee Member', assignedRoverName: '', crew: 'Executive Council', description: 'PR strategy and outreach standards' },
  { id: 'cr_adv_chair', roleName: 'Advisor to Chairperson', assignedRoverName: '', crew: 'Council Advisory', description: 'Direct strategic and procedural counsel to the Chairperson' },
];

export const NON_COUNCIL_ROLES: string[] = [
  'Rover Scout',
  'Explorer Scout',
  'Senior Rover Scout',
  'Rover Citizen',
  'Crew Leader',
  'Assistant Crew Leader',
  'Initiate',
  'Crew Member'
];

const DEFAULT_COUNCIL_ROLES: CouncilRole[] = EXECUTIVE_COUNCIL_ROLES;

export function subscribeToCouncilRoles(onUpdate: (roles: CouncilRole[]) => void) {
  try {
    const colRef = collection(db, COUNCIL_ROLES_COLLECTION);
    return onSnapshot(colRef, (snapshot) => {
      const list: CouncilRole[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          roleName: data.roleName || '',
          assignedRoverName: data.assignedRoverName || '',
          crew: data.crew || '',
          description: data.description || ''
        });
      });
      if (list.length === 0) {
        onUpdate(DEFAULT_COUNCIL_ROLES);
      } else {
        onUpdate(list);
      }
    }, (err) => {
      console.error("Firebase sync error for council roles:", err);
      onUpdate(DEFAULT_COUNCIL_ROLES);
    });
  } catch (e) {
    console.error("Subscription error for council roles:", e);
    return () => {};
  }
}

export async function saveCouncilRole(role: CouncilRole) {
  try {
    const ref = doc(db, COUNCIL_ROLES_COLLECTION, role.id || ('cr_' + Date.now().toString()));
    await setDoc(ref, {
      roleName: role.roleName,
      assignedRoverName: role.assignedRoverName || '',
      crew: role.crew || '',
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    console.error('Failed to save council role to Firestore:', err);
  }
}

export async function deleteCouncilRole(id: string) {
  try {
    await deleteDoc(doc(db, COUNCIL_ROLES_COLLECTION, id));
  } catch (err) {
    console.error('Failed to delete council role from Firestore:', err);
  }
}
