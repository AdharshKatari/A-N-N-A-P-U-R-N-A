# Run on an iPhone with Expo Go

This project uses Expo SDK 54, supported by the App Store version of Expo Go.

1. Install Expo Go from the iPhone App Store.
2. Connect your computer and iPhone to the same Wi-Fi.
3. Sign in to Expo Go with the same account as Expo CLI (check with npx expo whoami inside mobile).
4. Run npm start from the repository root.
5. Scan the terminal QR code with the iPhone Camera app and open it in Expo Go.

The backend must also be running. If your computer Wi-Fi address changes,
update EXPO_PUBLIC_API_URL in mobile/.env to the new address on port 8001.

On another computer, install dependencies with npm ci inside mobile.
You do not need an Apple Developer account or an EAS build for this workflow.
