import os

with open('src/components/Dashboard.tsx', 'r') as f:
    code = f.read()

target = """                </div>
              </div>
            )}
          </div>
          {!isAdmin && ("""

replacement = """                </div>
              </div>
            )}
          {!isAdmin && ("""

# Actually wait! The form doesn't have the Cancel button yet because my previous replacement failed!
# Let's fix the form to have the Cancel button AND remove the extra div at the same time.

target_with_button = """                <div className="flex justify-end pt-1">
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
          {!isAdmin && ("""

replacement_with_button = """                <div className="flex justify-end pt-1">
                  <button
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
          {!isAdmin && ("""

code = code.replace(target_with_button, replacement_with_button)

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(code)
