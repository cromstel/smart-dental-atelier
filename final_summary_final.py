import subprocess, os

# Confirm docs are untracked; if any docs files accidentally tracked, untrack them
r = subprocess.run(["git", "ls-files", "docs/"], capture_output=True, text=True)
tracked_docs = [l for l in r.stdout.split("\n") if l]
if tracked_docs:
    for d in tracked_docs:
        subprocess.run(["git", "rm", "--cached", d])
    print("Untracked accidentally-tracked docs:", tracked_docs)
else:
    print("Docs untracked (correct per standing rule)")

# Confirm .env.backup not tracked
r = subprocess.run(["git", "ls-files", ".env.backup"], capture_output=True, text=True)
print(".env.backup tracked:", bool(r.stdout.strip()))

print("===FINAL SUMMARY===")
print("Admin email:", end=" ")
r_env = subprocess.run(["python", "-c", "with open('.env') as f:\n for l in f:\n  s=l.strip()\n  if s.startswith('ADMIN_EMAIL='):\n   print(s)"], capture_output=True, text=True)
print(r_env.stdout)
print("Working tree (post-scroll):", end=" ")
r_stat = subprocess.run(["git", "status", "--short"], capture_output=True, text=True)
stat_lines = [l for l in r_stat.stdout.split("\n") if l.strip()]
if stat_lines:
    for s in stat_lines:
        print(s, end="; ")
else:
    print("CLEAN (only docs + agent file untracked)")
print()
print("Scroll component exists:", os.path.isfile("components/layout/ScrollToTop.js"))
print("Layout imports ScrollToTop:", open("components/layout/Layout.js").read().count("ScrollToTop"))
print("Next version:", open("package.json").readlines()[4].strip())
