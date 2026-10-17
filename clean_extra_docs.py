import subprocess, os
for doc_file in ["final_final_check.py", "docs/status_final.md", "docs/IMPLEMENTATION_PLAN.md", 
                 "docs/FRONTEND_ENHANCEMENT.md", "docs/PLAN.md", "docs/MEMORY.md", 
                 "docs/TODO.md", "docs/WIKI.md"]:
    if os.path.isfile(doc_file):
        try:
            if doc_file.startswith("docs/"):
                # Don't delete docs folder contents per standing rule - just confirm untracked
                pass  # skip deleting docs files (standing rule: docs untracked, not deleted)
            else:
                os.remove(doc_file)
                print("cleaned", doc_file)
        except:
            pass
