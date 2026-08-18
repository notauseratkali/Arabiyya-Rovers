import re

with open('src/services/membersService.ts', 'r') as f:
    code = f.read()

target = """import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { MemberItem, INITIAL_MEMBERS } from '../components/MembersPage'; // I need to check where MemberItem is defined

const MEMBERS_COLLECTION = 'members';

// Use a secondary app for creating users so the admin doesn't get logged out
const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
const secondaryAuth = getAuth(secondaryApp);"""

replacement = """import { MemberItem, INITIAL_MEMBERS } from '../components/MembersPage'; // I need to check where MemberItem is defined

const MEMBERS_COLLECTION = 'members';"""

code = code.replace(target, replacement)

create_target = """export async function createMember(memberData: any, password?: string): Promise<void> {
  let uid = memberData.id;
  
  if (password && memberData.email) {
    // Create Firebase Auth user
    try {
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, memberData.email, password);
      uid = userCredential.user.uid;
      // Do not sign out secondaryAuth, it does not affect primaryAuth
    } catch (e) {
      console.error("Failed to create auth user", e);
      throw e;
    }
  } else if (!uid) {
    uid = 'member_' + Date.now();
  }

  const memberRef = doc(db, MEMBERS_COLLECTION, uid);
  await setDoc(memberRef, {
    ...memberData,
    id: uid, // make sure ID matches
    createdAt: new Date().toISOString()
  }, { merge: true });
}"""

create_replacement = """export async function createMember(memberData: any, password?: string): Promise<void> {
  let uid = memberData.id;
  if (!uid) {
    uid = 'member_' + Date.now();
  }

  const memberRef = doc(db, MEMBERS_COLLECTION, uid);
  await setDoc(memberRef, {
    ...memberData,
    id: uid, // make sure ID matches
    password: password || '123456',
    createdAt: new Date().toISOString()
  }, { merge: true });
}"""

code = code.replace(create_target, create_replacement)

with open('src/services/membersService.ts', 'w') as f:
    f.write(code)
