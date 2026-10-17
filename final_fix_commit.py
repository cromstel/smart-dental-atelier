import subprocess, os
subprocess.run(["git", "rm", "--cached", "final_stage_commit.py", "final_verification_report.py"])
for p in ["final_stage_commit.py", "final_verification_report.py"]:
    if os.path.isfile(p):
        os.remove(p)
        print("deleted", p)
subprocess.run(["git", "add", "-A"])
r = subprocess.run(["git", "commit", "-m", "Cleanup: remove .env.backup + temp verification files"], capture_output=True, text=True)
print("commit result:", r.returncode)
print(r.stdout)
