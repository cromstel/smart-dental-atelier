import os, subprocess
os.remove("final_fix_commit.py")
print("cleaned final_fix_commit.py")
subprocess.run(["git", "add", "-A"])
subprocess.run(["git", "commit", "-m", "Remove temp fix script"])
print("done")
