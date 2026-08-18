import re

with open('src/components/MembersPage.tsx', 'r') as f:
    code = f.read()

# Add a Reset Password handler
target_reset = """  const handleDelete = async (memberId: string) => {
    if (window.confirm('Are you sure you want to completely remove this member?')) {
      try {
        await deleteMember(memberId);
      } catch (err) {
        alert('Failed to delete member.');
      }
    }
  };"""

replacement_reset = """  const handleDelete = async (memberId: string) => {
    if (window.confirm('Are you sure you want to completely remove this member?')) {
      try {
        await deleteMember(memberId);
      } catch (err) {
        alert('Failed to delete member.');
      }
    }
  };

  const handleResetPassword = async (memberId: string) => {
    if (window.confirm('Are you sure you want to reset this member\\'s password to 123456?')) {
      try {
        await updateMember(memberId, { password: '123456' });
        alert('Password has been reset to 123456.');
      } catch (err) {
        alert('Failed to reset password.');
      }
    }
  };"""

code = code.replace(target_reset, replacement_reset)

# Update UI to show Reset Password button
target_button = """                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(member.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Remove Member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}"""

replacement_button = """                  {isAdmin && (
                    <>
                      <button
                        onClick={() => handleResetPassword(member.id)}
                        className="px-2 py-1 text-[10px] font-bold text-slate-500 hover:text-[#1e40af] hover:bg-[#1e40af]/10 rounded border border-slate-200 hover:border-[#1e40af]/20 transition-colors"
                        title="Reset Password to 123456"
                      >
                        Reset PWD
                      </button>
                      <button
                        onClick={() => handleDelete(member.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Remove Member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}"""

code = code.replace(target_button, replacement_button)

# Also ensure new members get initial password 123456
target_password = """const [newPassword, setNewPassword] = useState('');"""
replacement_password = """const [newPassword, setNewPassword] = useState('123456');"""
code = code.replace(target_password, replacement_password)

target_password_field = """<input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Set an initial password"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af]"
                  />"""

replacement_password_field = """<input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Initial password"
                    className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:border-[#1e40af]"
                  />"""
code = code.replace(target_password_field, replacement_password_field)

with open('src/components/MembersPage.tsx', 'w') as f:
    f.write(code)
