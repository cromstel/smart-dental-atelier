with open(".env") as f:
    for line in f:
        s = line.strip()
        if s.startswith("ADMIN_"):
            print(".env admin:", s)
        if s.startswith("DATABASE_URL"):
            v = s.split("=", 1)[1]
            masked = v[:30] + "... (redacted)"
            print(".env db:", masked)

import subprocess
print("===COMMIT===")
r = subprocess.run(["git", "log", "--oneline", "-3"], capture_output=True, text=True)
print(r.stdout)
print("===TRACKED .env*===")
r2 = subprocess.run(["git", "ls-files"], capture_output=True, text=True)
env_tracked = [l for l in r2.stdout.split("\n") if ".env" in l and l]
print(env_tracked)
print("===DOCS===")
r3 = subprocess.run(["git", "ls-files", "docs/"], capture_output=True, text=True)
print("docs tracked:", repr(r3.stdout.strip()) or "(none - untracked)")
print("===TREE===")
r4 = subprocess.run(["git", "status", "--short"], capture_output=True, text=True)
print(r4.stdout or "(clean)")
