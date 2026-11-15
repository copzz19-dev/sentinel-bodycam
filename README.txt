SENTINEL BODYCAM — MOBILE WEB APP

WHAT IT DOES
- Uses the phone's camera and microphone after you tap ENABLE CAMERA.
- Records only after you tap START RECORDING.
- Adds overlay.png to the top-right corner of saved recordings, sized for portrait phone or landscape video.
- Saves video blobs in this browser's local IndexedDB storage.
- Lets you play, export, and delete saved recordings.
- Can be added to the iPhone Home Screen.

IMPORTANT LIMITATIONS
- This is an independent bodycam-style camera app, not an official Axon product.
- It is not an evidence-management system. Export/backup important videos.
- Camera access requires HTTPS (or localhost during development).
- iOS Safari support for MediaRecorder formats varies by iOS version. Test a short recording first.
- Keep Safari open and the phone awake during recording; iOS may pause/stop web apps in the background.
- Videos are stored in Safari's site storage. Clearing website data, storage pressure, or browser changes can remove them.
- Recording laws and consent requirements vary. Use responsibly and visibly.

DEPLOY FROM WINDOWS (EASIEST: GITHUB PAGES)
1. Extract this ZIP.
2. Sign in/create a GitHub account.
3. Create a new repository named sentinel-bodycam. For a private personal app, note that GitHub Pages availability for private repositories depends on your GitHub plan; a public repository exposes the app source. Do not put private information in the source.
4. Upload all files from this folder to the repository root.
5. Open repository Settings > Pages.
6. Under Build and deployment, choose Deploy from a branch, select main and /(root), then Save.
7. Wait for GitHub Pages to publish the HTTPS website.
8. On your iPhone, open the published HTTPS URL in Safari.
9. Tap Share > Add to Home Screen > Add.

PRIVACY
This app does not include analytics, accounts, cloud upload, or a server-side recording store. Camera and microphone permission are requested by the browser when you tap ENABLE CAMERA. Local recordings remain in this browser's storage unless you export them.
