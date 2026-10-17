import subprocess, os
subprocess.run(["git", "add", "-A"])
subprocess.run(["git", "commit", "-m", "Clean extra docs; confirm final state"])
print("===FINAL STATE===")
print("Commit:", subprocess.run(["git", "rev-parse", "--short", "HEAD"], capture_output=True, text=True).stdout.strip())
with open(".env") as f:
    for l in f:
        s = l.strip()
        if s.startswith("ADMIN_EMAIL="):
            print("Admin email:", s)
        if s.startswith("NEXT_PUBLIC_SITE_URL="):
            print("Site URL:", s)
print("Next version:", open("package.json").readlines()[4].strip())
print("Working tree:", subprocess.run(["git", "status", "--short"], capture_output=True, text=True).stdout or "(clean)")
print("ScrollToTop component:", os.path.isfile("components/layout/ScrollToTop.js"))
print("Layout props applied:", "hideNavbar" in open("components/layout/Layout.js").read() and "hideFooter" in open("components/layout/Layout.js").read())
print("Logo above auth forms (Image component + responsive):", "<Image" in open("components/auth/CredentialsSignIn.js").read() and 'md:h-14' in open("components/auth/CredentialsSignIn.js").read())
print("CSP map assertion in e2e:", 'map embed' in open("tests/e2e/public.spec.js").read())
print("Nonce deferred corrected (docs):", "App Router" in open("docs/TODO.md").read() and "ISR" in open("docs/TODO.md").read())
