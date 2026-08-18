import re

with open('src/components/MembersPage.tsx', 'r') as f:
    code = f.read()

# Add idCard to interface
target_interface = """export interface MemberItem {
  id: string;
  name: string;
  role: string;
  patrol: string;
  email: string;
  phone: string;
  badgeRank: string;
  status: 'Active' | 'Training' | 'On Leave';
  joinedDate: string;
}"""

replacement_interface = """export interface MemberItem {
  id: string;
  name: string;
  idCard?: string;
  role: string;
  patrol: string;
  email: string;
  phone: string;
  badgeRank: string;
  status: 'Active' | 'Training' | 'On Leave';
  joinedDate: string;
}"""

code = code.replace(target_interface, replacement_interface)

# Add newIdCard state
target_state = """  const [newName, setNewName] = useState('');"""
replacement_state = """  const [newName, setNewName] = useState('');
  const [newIdCard, setNewIdCard] = useState('');"""
code = code.replace(target_state, replacement_state)

# Add idCard to createMember
target_create = """      const newMember = {
        id: 'member_' + Date.now(),
        name: newName,
        role: newRole,
        patrol: newPatrol,
        email: newEmail,
        phone: newPhone,
        badgeRank: newBadge,
        status: newStatus as any,
        joinedDate: new Date().toISOString().split('T')[0]
      };"""

replacement_create = """      const newMember = {
        id: 'member_' + Date.now(),
        name: newName,
        idCard: newIdCard.toUpperCase(),
        role: newRole,
        patrol: newPatrol,
        email: newEmail,
        phone: newPhone,
        badgeRank: newBadge,
        status: newStatus as any,
        joinedDate: new Date().toISOString().split('T')[0]
      };"""

code = code.replace(target_create, replacement_create)

# Clear newIdCard
target_clear = """      setNewName('');"""
replacement_clear = """      setNewName('');
      setNewIdCard('');"""
code = code.replace(target_clear, replacement_clear)

# Add input to UI
target_input = """              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Ali Shafiu"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af]"
                />
              </div>"""

replacement_input = """              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Ali Shafiu"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">ID Card Number</label>
                <input
                  type="text"
                  required
                  value={newIdCard}
                  onChange={(e) => setNewIdCard(e.target.value)}
                  placeholder="e.g. A123456"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af] uppercase"
                />
              </div>"""

code = code.replace(target_input, replacement_input)

# Replace the member cell rendering
target_cell = """                      <div>
                        <div className="font-bold text-slate-800">{member.name}</div>
                        <div className="text-xs text-slate-500">{member.email}</div>
                      </div>"""

replacement_cell = """                      <div>
                        <div className="font-bold text-slate-800">{member.name}</div>
                        <div className="text-xs text-slate-500">{member.idCard ? `ID: ${member.idCard}` : member.email}</div>
                      </div>"""

code = code.replace(target_cell, replacement_cell)

with open('src/components/MembersPage.tsx', 'w') as f:
    f.write(code)
