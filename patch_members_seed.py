import os
import re

with open('src/services/membersService.ts', 'r') as f:
    code = f.read()

# I don't have INITIAL_MEMBERS in membersService.ts. So let's just make MembersPage do the seeding if empty? Or skip it since user asked to store in firebase.
# Let's seed in membersService.ts

target = "import { MemberItem } from '../components/MembersPage';"
replacement = "import { MemberItem, INITIAL_MEMBERS } from '../components/MembersPage';"
code = code.replace(target, replacement)

target2 = """    (snapshot) => {
      const members = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      onUpdate(members);
    },"""

replacement2 = """    (snapshot) => {
      if (snapshot.empty) {
        // Seed
        const batch = writeBatch(db);
        INITIAL_MEMBERS.forEach(m => {
          const ref = doc(db, MEMBERS_COLLECTION, m.id);
          batch.set(ref, { ...m, createdAt: new Date().toISOString() });
        });
        batch.commit().catch(console.error);
        onUpdate(INITIAL_MEMBERS);
        return;
      }
      const members = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      onUpdate(members);
    },"""

code = code.replace(target2, replacement2)

with open('src/services/membersService.ts', 'w') as f:
    f.write(code)

with open('src/components/MembersPage.tsx', 'r') as f:
    code = f.read()

# Add export to INITIAL_MEMBERS
code = code.replace("const INITIAL_MEMBERS: MemberItem[] = [", "export const INITIAL_MEMBERS: MemberItem[] = [")

with open('src/components/MembersPage.tsx', 'w') as f:
    f.write(code)
