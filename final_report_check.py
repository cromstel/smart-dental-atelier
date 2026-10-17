import subprocess, os
with open(".env") as f:
    for line in f:
        s = line.strip()
        if s.startswith("ADMIN_EMAIL="):
            print("Admin email (.env):", s)
        if s.startswith("NEXT_PUBLIC_SITE_URL="):
            print("Site URL:", s)
with open("package.json") as f:
    import json
    pkg = json.load(f)
    print("Next.js version:", pkg["dependencies"]["next"])
print("===COMMIT===")
r = subprocess.run(["git", "log", "--oneline", "-1"], capture_output=True, text=True)
print(r.stdout)
print("===WORKING TREE===")
r2 = subprocess.run(["git", "status", "--short"], capture_output=True, text=True)
lines = [l for l in r2.stdout.split() if l.strip()]
print("Uncommitted files:", lines if lines else "(none - clean tree)")
print("===DOCS TRACKING===")
r3 = subprocess.run(["git", "ls-files", "docs/"], capture_output=True, text=True)
count = len([l for l in r3.stdout.split() if l])
print("Tracked docs files:", count, "(rule: docs untracked)")
print("===AGENTS FILE===")
print("AGENTS.md present (agent instruction):", os.path.isfile("AGENTS.md"))
print("===SCROLL-TO-TOP===")
print("Component: components/layout/ScrollToTop.js exists:", os.path.isfile("components/layout/ScrollToTop.js"))
print("Layout uses it:", open("components/layout/Layout.js").read().count("ScrollToTop"))
