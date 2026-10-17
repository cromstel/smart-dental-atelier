import os, subprocess
os.remove("stage_scroll_final.py")
print("cleaned stage_scroll_final.py")
subprocess.run(["git", "add", "-A"])
subprocess.run(["git", "commit", "-am", "Clean up stage script (final)"])
print("done")
