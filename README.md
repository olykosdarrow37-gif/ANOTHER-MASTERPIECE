# VALIRYAN FREEHOLD – PC app (Windows)

1. Create a new GitHub repository and upload **everything in this folder**
   (make sure the hidden `.github` folder is included).
2. Open **Actions → Build Windows App → Run workflow** (also runs on every push to `main`).
3. After 3–5 minutes, download **valiryan-freehold-windows** from the run's *Artifacts*.
4. Unzip it: `Valiryan-Freehold-Setup-1.0.0.exe` (installer) and
   `Valiryan-Freehold-Portable-1.0.0.exe` (no install).

Windows SmartScreen may warn because the app isn't code-signed: **More info → Run anyway**.

The interface lives in `www/index.html`. Edit it, push, and a new build is made.
