import os

with open('src/firebase.ts', 'r') as f:
    code = f.read()

target = "import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';"
replacement = "import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';\nimport { getAuth } from 'firebase/auth';"
code = code.replace(target, replacement)

code += "\nexport const auth = getAuth(app);\n"

with open('src/firebase.ts', 'w') as f:
    f.write(code)
