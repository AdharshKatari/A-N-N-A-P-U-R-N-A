# Android test APK

[Download Annapurna 1.0.0 APK](https://expo.dev/artifacts/eas/GHf7kh2-AhCgiie5gxBSXoFIf4zfK8zoBAKNB0VvXc8.apk)

This build runs without Expo Go or a Metro development server. It connects to
`http://192.168.29.123:8001`. The phone and backend computer must be on the same Wi-Fi.

Start the backend from the `backend` folder:

```powershell
& '..\.venv\Scripts\python.exe' -m uvicorn main:app --host 0.0.0.0 --port 8001
```

Install the APK, create a profile or sign in, then scan five distinct crop samples.
Signing in from the analysis screen preserves the samples; tap **Retry Vision** afterward.
The test backend uses its local classifier when the cloud AI provider is unavailable.

The [critical shell-quote advisory](https://github.com/advisories/GHSA-pqg4-j6r4-53mv)
was patched. npm still reports 37 other dependency
advisories in this SDK's toolchain; this build is for testing, not a production security sign-off.

Build another APK from `mobile` with `npx eas-cli build --platform android --profile preview`.
If the computer's Wi-Fi address changes, update `EXPO_PUBLIC_API_URL` in `eas.json` and rebuild.

Run mobile checks from `mobile`:

```powershell
node --test tests/*.test.cjs
npm run typecheck
```
