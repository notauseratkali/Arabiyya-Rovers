import os

with open('src/components/MembersPage.tsx', 'r') as f:
    code = f.read()

target = """                </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">"""

replacement = """                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">"""

code = code.replace(target, replacement)

with open('src/components/MembersPage.tsx', 'w') as f:
    f.write(code)
