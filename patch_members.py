import os
import re

with open('src/components/MembersPage.tsx', 'r') as f:
    code = f.read()

# Add import for createMember
imports = "import { createMember, deleteMember, subscribeToMembers } from '../services/membersService';"
if "membersService" not in code:
    code = code.replace("import { MemberItem } from '../types';", "import { MemberItem } from '../types';\n" + imports)
    # Also I need to define the type if it doesn't exist? Oh wait, MemberItem is defined in MembersPage.tsx itself!
    # Wait, the import was removed in previous steps, let's just add the import at the top of MembersPage.tsx.
    code = code.replace("import {", imports + "\nimport {", 1)


# Update the state of MembersPage
code = code.replace("  const [members, setMembers] = useState<MemberItem[]>(() => {\n    try {\n      const saved = localStorage.getItem('koshaaru_portal_members_v5');\n      if (saved) return JSON.parse(saved);\n    } catch (e) {\n      console.error('Failed to load members from localStorage', e);\n    }\n    return INITIAL_MEMBERS;\n  });", "  const [members, setMembers] = useState<MemberItem[]>(INITIAL_MEMBERS);\n\n  useEffect(() => {\n    const unsub = subscribeToMembers(setMembers, console.error);\n    return () => unsub();\n  }, []);\n")

# Add Password state
code = code.replace("  const [newStatus, setNewStatus] = useState<'Active' | 'Training' | 'On Leave'>('Training');", "  const [newStatus, setNewStatus] = useState<'Active' | 'Training' | 'On Leave'>('Training');\n  const [newPassword, setNewPassword] = useState('');")

# Add Password input to the form
password_input = """                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+960 7XX-XXXX"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Portal Login Password</label>
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Set an initial password"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af]"
                  />
                </div>"""

code = code.replace("""                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="+960 7XX-XXXX"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af]"
                  />
                </div>
              </div>""", password_input)

# Update handleSaveNewMember
code = code.replace("""  const handleSaveNewMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    const newItem: MemberItem = {
      id: 'm_' + Date.now(),
      name: newName.trim(),
      role: newRole,
      patrol: newPatrol,
      email: newEmail.trim(),
      phone: newPhone.trim(),
      badgeRank: newBadge.trim(),
      status: newStatus,
      joinedDate: new Date().toISOString().split('T')[0]
    };

    const updated = [newItem, ...members];
    setMembers(updated);
    try {
      localStorage.setItem('koshaaru_portal_members_v5', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }""", """  const handleSaveNewMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) return;

    const newItem: MemberItem = {
      id: 'm_' + Date.now(),
      name: newName.trim(),
      role: newRole,
      patrol: newPatrol,
      email: newEmail.trim(),
      phone: newPhone.trim(),
      badgeRank: newBadge.trim(),
      status: newStatus,
      joinedDate: new Date().toISOString().split('T')[0]
    };

    try {
      await createMember(newItem, newPassword);
      setNewPassword('');
    } catch (e) {
      console.error('Failed to create member:', e);
      alert('Failed to create member: ' + e);
      return;
    }""")

# Update handleDeleteMember
code = code.replace("""  const handleDeleteMember = (id: string) => {
    const updated = members.filter(m => m.id !== id);
    setMembers(updated);
    try {
      localStorage.setItem('koshaaru_portal_members_v5', JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  };""", """  const handleDeleteMember = async (id: string) => {
    try {
      await deleteMember(id);
    } catch (e) {
      console.error('Failed to delete member:', e);
    }
  };""")

with open('src/components/MembersPage.tsx', 'w') as f:
    f.write(code)
