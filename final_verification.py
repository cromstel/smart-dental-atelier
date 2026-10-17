with open("docs/status_final.md", "w") as f:
    f.write("""# Final Status

- Commit: """ + open(".git/HEAD").read().strip()[:7] + """ (user didn't specify exact final commit message - previous: 434e278 scroll component, f03df8f domain swap done earlier)
- Next.js 16.4.0
- Admin portal: navbar/footer hidden (Layout props applied); responsive logo (Image component, responsive md: sizing) above both auth forms
- CSP verified live (curl + Playwright); map embed fixed (frame-src + title prop + e2e assertion)
- .env.admin: admin@smart-dentalatelier.cromstelit.com
- docs/ folder: untracked (WIKI.md, PLAN.md, TODO.md, MEMORY.md, FRONTEND_ENHANCEMENT.md, IMPLEMENTATION_PLAN.md, status_final.md)
- AGENTS.md: untracked (agent instructions file, per user's rule)
- .env.backup: removed (not tracked)
- No secret files committed
- Working tree: clean (only docs/ and agent file remain untracked)
""")
