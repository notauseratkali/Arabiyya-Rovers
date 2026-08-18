import os

with open('src/components/Sidebar.tsx', 'r') as f:
    code = f.read()

target = "import { NavSection } from '../types';"
replacement = "import { NavSection } from '../types';\nimport { getAuth, signOut } from 'firebase/auth';\nimport app from '../firebase';\n\nconst auth = getAuth(app);"
code = code.replace(target, replacement)

target2 = """            {isAdmin ? 'Switch to Member View' : 'Switch to Admin Mode'}
          </button>
        </div>"""

replacement2 = """            {isAdmin ? 'Switch to Member View' : 'Switch to Admin Mode'}
          </button>
          <button
            type="button"
            onClick={() => signOut(auth)}
            className="w-full py-1.5 px-3 rounded-lg text-xs font-bold transition-all border bg-slate-800 border-slate-700 text-white hover:bg-slate-900"
          >
            Sign Out
          </button>
        </div>"""

code = code.replace(target2, replacement2)

with open('src/components/Sidebar.tsx', 'w') as f:
    f.write(code)
