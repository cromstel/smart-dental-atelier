import os, subprocess
if os.path.isfile("check_untracked_final.py"):
    os.remove("check_untracked_final.py")
    print("cleaned temp script")
r = subprocess.run(["git", "status", "--short"], capture_output=True, text=True)
print("===BEFORE STAGE===")
print(r.stdout)
# Stage only the scroll component + layout changes (exclude AGENTS.md, docs files)
# We use git add with specific paths
for path in ["components/layout/ScrollToTop.js", "components/layout/Layout.js"]:
    if os.path.isfile(path):
        subprocess.run(["git", "add", path])
        print("staged:", path)
# Also stage any other non-temp, non-doc, non-agent changes if present
# The .env is not changed (only admin email in working tree which is correct)
# Don't stage docs/ or AGENTS.md
subprocess.run(["git", "commit", "-m", "Add scroll-to-top component (responsive, accessible, SVG icon) to Layout"])
print("===COMMIT===")
r2 = subprocess.run(["git", "log", "--oneline", "-1"], capture_output=True, text=True)
print(r2.stdout)
r3 = subprocess.run(["git", "status", "--short"], capture_output=True, text=True)
print("===AFTER===", r3.stdout or "(clean - only docs + agent file remain untracked)")
