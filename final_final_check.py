print("===FINAL CONFIRMATION (post-scroll-to-top + admin review)===")
import subprocess, os
print("Commit:", subprocess.run(["git", "rev-parse", "--short", "HEAD"], capture_output=True, text=True).stdout.strip())
print("Next version:", open("package.json").readlines()[17].strip())
with open(".env") as f:
    for line in f:
        s = line.strip()
        if s.startswith("ADMIN_EMAIL="):
            print("Admin email (.env):", s)
print("Working tree (only untracked docs + agent file):")
r = subprocess.run(["git", "status", "--short"], capture_output=True, text=True)
lines = [l for l in r.stdout.split("\n") if l.strip()]
for line in lines:
    print("  ", line)
if not lines:
    print("  (clean)")
print("Docs tracked (should be 0):")
r2 = subprocess.run(["git", "ls-files", "docs/"], capture_output=True, text=True)
count = len([l for l in r2.stdout.split("\n") if l])
print("  ", count, "tracked doc files")
print("Agent file (AGENTS.md) untracked:", not os.path.isfile("AGENTS.md") or (subprocess.run(["git", "ls-files", "AGENTS.md"], capture_output=True, text=True).stdout == ""))
print("===END===")
