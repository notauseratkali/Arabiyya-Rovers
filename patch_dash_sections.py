import os
import re

with open('src/components/Dashboard.tsx', 'r') as f:
    code = f.read()

# 1. Add `isAddingRole` state
state_target = "  const [editSelectedRover, setEditSelectedRover] = useState('');"
state_replacement = "  const [editSelectedRover, setEditSelectedRover] = useState('');\n  const [isAddingRole, setIsAddingRole] = useState(false);"
code = code.replace(state_target, state_replacement)

# 2. Add handleAddCouncilRole update to reset isAddingRole
add_role_target = """    setNewRoleName('');
  };"""
add_role_replacement = """    setNewRoleName('');
    setIsAddingRole(false);
  };"""
code = code.replace(add_role_target, add_role_replacement)

# 3. Replace the layout for settings
# Find the start of settings section
layout_target = """  if (currentSection === 'settings') {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold bg-[#800020]/10 text-[#800020] border border-[#800020]/20 mb-2">
                <Settings className="w-3.5 h-3.5" />
                <span>Portal Configuration</span>
              </div>
              <h1 className="text-2xl font-bold text-[#0f1e36]">
                Portal Settings
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Customize general portal settings and assign Rover Council roles.
              </p>
            </div>
            
          </div>

          {/* Portal Name Section */}"""

layout_replacement = """  if (currentSection === 'settings') {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-semibold bg-[#800020]/10 text-[#800020] border border-[#800020]/20 mb-2">
                <Settings className="w-3.5 h-3.5" />
                <span>Portal Configuration</span>
              </div>
              <h1 className="text-2xl font-bold text-[#0f1e36]">
                Portal Settings
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Customize general portal settings.
              </p>
            </div>
          </div>

          {/* Portal Name Section */}"""

code = code.replace(layout_target, layout_replacement)

# End of Save All Settings button div is:
#             </button>
#           </div>
#         </div>
# 
#         {/* Edit Council Role Modal */}

# But wait, there's the roles section in between!
code = code.replace("""          {/* Roles of Members / Council Roles Section */}
          <div className="space-y-4 pt-6 border-t border-slate-100">
            <div>
              <h3 className="text-base font-bold text-[#0f1e36] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#800020]" />
                Roles of Members (Rover Council)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Create specific council member roles (e.g. Council Secretary, Treasurer) and assign rover members to each role. You can edit or remove them anytime.
              </p>
            </div>

            {/* List of current council roles */}
            <div className="space-y-2.5">""", """          <div className="pt-6 flex justify-end">
            <button
              id="save-all-settings-btn"
              type="button"
              disabled={!isAdmin}
              onClick={handleSaveAllSettings}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isAdmin
                  ? 'bg-[#800020] hover:bg-[#6b1426] text-white shadow-xs' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              Save All Settings
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <h2 className="text-xl font-bold text-[#0f1e36] flex items-center gap-2">
                <Users className="w-5 h-5 text-[#800020]" />
                Roles of Council
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Create specific council member roles (e.g. Council Secretary, Treasurer) and assign rover members to each role.
              </p>
            </div>
            {isAdmin && !isAddingRole && (
              <button
                type="button"
                onClick={() => setIsAddingRole(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#0f1e36] hover:bg-[#172d4d] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Assign New Council Role
              </button>
            )}
          </div>

          <div className="space-y-2.5">""")

code = code.replace("""            {/* Add new council role form */}
            {isAdmin && (
              <div className="bg-slate-50/70 border border-dashed border-slate-300 rounded-xl p-4 space-y-3">""", """            {/* Add new council role form */}
            {isAdmin && isAddingRole && (
              <div className="bg-slate-50/70 border border-dashed border-slate-300 rounded-xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2">""")

# Replace the create & assign button to also include cancel
code = code.replace("""                  <button
                    type="button"
                    disabled={!newRoleName.trim()}
                    onClick={handleAddCouncilRole}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      newRoleName.trim()
                        ? 'bg-[#0f1e36] hover:bg-[#172d4d] text-white shadow-xs'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create & Assign Role
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="pt-6 flex justify-end border-t border-slate-100">
            {combinedSavedSuccess && (
              <div className="mr-4 text-emerald-600 text-xs font-bold flex items-center gap-1.5 animate-in fade-in">
                <Check className="w-4 h-4" />
                Settings Saved!
              </div>
            )}
            <button
              id="save-all-settings-btn"
              type="button"
              disabled={!isAdmin}
              onClick={handleSaveAllSettings}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                isAdmin
                  ? 'bg-[#800020] hover:bg-[#6b1426] text-white shadow-xs' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              Save All Settings
            </button>
          </div>
        </div>""", """                  <button
                    type="button"
                    onClick={() => setIsAddingRole(false)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 mr-2 rounded-xl text-xs font-bold bg-slate-200 hover:bg-slate-300 text-slate-700 transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!newRoleName.trim()}
                    onClick={handleAddCouncilRole}
                    className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      newRoleName.trim()
                        ? 'bg-[#0f1e36] hover:bg-[#172d4d] text-white shadow-xs'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Create & Assign Role
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>""")

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(code)
