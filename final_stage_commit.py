import subprocess, os
subprocess.run(["git", "add", "-A"])
print("===STAGED===")
r = subprocess.run(["git", "status", "--short"], capture_output=True, text=True)
print(r.stdout)
# Commit
r2 = subprocess.run(["git", "commit", "-m", "Unstage .env.backup; clean temp verification file; final state"], capture_output=True, text=True)
print("===COMMIT===", r2.returncode)
print(r2.stdout, r2.stderr)
# Clean temp verification file
os.remove("final_verification_report.py")
print("cleaned temp file")
