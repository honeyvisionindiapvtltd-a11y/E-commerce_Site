# HoneyVision - Web + Android + iOS Production Setup Guide

## Overview

HoneyVision is now a complete multi-platform e-commerce application built with:
- **Frontend**: React + Vite (responsive web)
- **Mobile**: Capacitor (Android + iOS native wrappers)
- **Backend**: Node.js + Express + MongoDB

All three platforms share the same backend API and business logic.

## Project Structure

```
HoneyVision/
├── frontend/                  # React/Vite web app + Capacitor config
│   ├── src/
│   │   ├── services/         # Native integration services
│   │   │   ├── nativePlatform.ts      # Platform detection
│   │   │   ├── androidBackButton.ts   # Android back button handling
│   │   │   ├── appLifecycle.ts        # App state management
│   │   │   ├── cameraAndUpload.ts     # Camera/file uploads
│   │   │   ├── deepLinks.ts           # Deep link routing
│   │   │   ├── geolocation.ts         # GPS tracking
│   │   │   ├── networkStatus.ts       # Network monitoring
│   │   │   ├── pushNotifications.ts   # FCM/APNs
│   │   │   └── nativeInit.ts          # Initialization
│   │   └── ...
│   ├── public/
│   ├── dist/                 # Build output
│   ├── .env.production       # Production API URL
│   ├── package.json
│   ├── vite.config.js
│   └── capacitor.config.ts   # Capacitor configuration
├── android/                  # Android native project
│   ├── app/
│   │   ├── build.gradle      # Dependencies
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml
│   │   │   └── res/
│   │   └── ...
│   ├── build.gradle
│   ├── settings.gradle
│   └── gradle.properties
├── ios/                      # iOS native project
│   ├── Podfile               # CocoaPods dependencies
│   ├── App/
│   │   └── App/Info.plist    # iOS configuration
│   └── ...
└── backend/                  # Node.js + Express + MongoDB
    ├── index.js
    ├── package.json
    └── ...
```

## Installation & Setup

### Prerequisites

- Node.js 16+ and npm
- Java Development Kit (JDK 11+) for Android
- Xcode 14+ for iOS (macOS only)
- Android Studio for building Android projects
- CocoaPods for iOS dependencies

### 1. Install Dependencies

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 2. Environment Configuration

Create `.env` files based on `.env.example`:

**Backend (.env)**
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://honeyvision.in
RAZORPAY_KEY_ID=...
RAZORPAY_KEY_SECRET=...
FIREBASE_PROJECT_ID=...
TWILIO_ACCOUNT_SID=...
```

**Frontend (.env.production)**
```
VITE_API_URL=https://api.honeyvision.in/api
```

### 3. Build Web Application

```bash
cd frontend
npm run build
```

Output: `frontend/dist/` (ready to deploy to web server)

## Platform-Specific Instructions

### Web Application

#### Development
```bash
cd frontend
npm run dev
```
Runs on http://localhost:5173

#### Production Build
```bash
cd frontend
npm run build
```

Deploy the `dist/` folder to your web server (Netlify, Vercel, AWS S3, etc.)

### Android Application

#### Prerequisites
- Android Studio
- Android SDK (API 34 recommended)
- Android NDK (for native modules)
- A Google Play Developer Account

#### Build Steps

**1. Sync Capacitor with Android**
```bash
cd frontend
npm run cap:sync:android
```

**2. Open in Android Studio**
```bash
npm run cap:open:android
```

**3. Configure Signing**
- Go to: Build → Generate Signed Bundle/APK
- Create or select signing key
- Build for Release

**4. Create Release Bundle (.aab)**
```
Build → Generate Signed Bundle/APK
→ Select "Android App Bundle"
→ Configure with your signing key
→ Generate
```

Output: `android/app/release/app-release.aab`

**5. Upload to Google Play Console**
- Create new app in Play Console
- Package name: `in.honeyvision.app`
- Upload AAB bundle
- Complete app store listing
- Fill app content questionnaire
- Complete data safety form
- Submit for review

#### Release Configuration

Edit `android/app/build.gradle` and update:
```gradle
defaultConfig {
    versionCode 1      // Increment for each release
    versionName "1.0.0" // Follow semantic versioning
}
```

#### Testing Before Release

**Internal Testing (Local)**
```bash
npm run cap:build:android
# Or build from Android Studio directly
```

**Google Play Internal Testing Track**
1. Build AAB
2. Upload to Play Console → Internal Testing track
3. Add test devices
4. Test thoroughly
5. Promote to closed testing or production

### iOS Application

#### Prerequisites (macOS Only)
- Xcode 14+
- Apple Developer Account
- CocoaPods

#### Build Steps

**1. Sync Capacitor with iOS**
```bash
cd frontend
npm run cap:sync:ios
```

**2. Install CocoaPods Dependencies**
```bash
cd ios
pod install
```

**3. Open in Xcode**
```bash
npm run cap:open:ios
```
Or manually open `ios/App/App.xcworkspace` in Xcode

**4. Configure Signing**
- Select "App" target
- Signing & Capabilities
- Select team/developer account
- Configure Bundle ID: `in.honeyvision.app`

**5. Archive for Release**
```
Product → Archive
→ Distribute App
→ App Store Connect
```

**6. Submit to App Store**
- Xcode automatically uploads to TestFlight
- Review in App Store Connect
- Complete required information
- Submit for App Review

#### Testing Before Release

**Simulator Testing**
```bash
Xcode → Product → Scheme → Edit Scheme
→ Run → Build Configuration: Release
→ Product → Run
```

**Device Testing**
- Connect real device
- Select device from target
- Build and run

**TestFlight Beta Testing**
- Build uploaded automatically to TestFlight
- Add beta testers
- Gather feedback
- Iterate as needed

## Feature Configuration

### Push Notifications

**Android (Firebase Cloud Messaging)**
1. Create Firebase project
2. Add Android app
3. Download `google-services.json`
4. Place in `android/app/`

**iOS (APNs + Firebase)**
1. Configure in Firebase Console
2. Upload APNs certificate
3. Configure in Xcode capabilities

### Deep Links

**Android**
- Configured in `AndroidManifest.xml`
- Supports: `https://honeyvision.in/product/:id`
- Custom scheme: `honeyvision://`

**iOS**
- Configured in `Info.plist` and `Associated Domains`
- Supports Universal Links
- Custom scheme: `honeyvision://`

### Camera & Gallery Access

Permissions handled in:
- Android: `AndroidManifest.xml`
- iOS: `Info.plist`
- Runtime: Capacitor Camera plugin

### Location Services

Permissions handled in:
- Android: `AndroidManifest.xml`
- iOS: `Info.plist`
- Runtime: Capacitor Geolocation plugin

## API Configuration

### Development
```
Frontend: http://localhost:5173
Backend:  http://localhost:5000
API:      http://localhost:5000/api
```

### Production
```
Frontend: https://honeyvision.in
Backend:  https://api.honeyvision.in
API:      https://api.honeyvision.in/api
```

Update `VITE_API_URL` in `.env.production` before building.

## Security Checklist

- [ ] JWT secrets not in frontend
- [ ] API keys not committed
- [ ] HTTPS enforced in production
- [ ] CORS properly configured
- [ ] No mock data in production
- [ ] Real database connected
- [ ] Environment variables configured
- [ ] SSL certificates valid
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints

## Testing Checklist

### Web
- [ ] Home page loads
- [ ] Products display correctly
- [ ] Search works
- [ ] Cart functionality
- [ ] Checkout flow
- [ ] Payment integration
- [ ] Order tracking
- [ ] User authentication
- [ ] Admin dashboard

### Android
- [ ] App installs
- [ ] Launch without crashes
- [ ] Back button works correctly
- [ ] All features from web work
- [ ] Push notifications received
- [ ] Deep links open app
- [ ] Camera access works
- [ ] Location access works
- [ ] Offline mode handled gracefully
- [ ] App resume/pause works

### iOS
- [ ] App installs
- [ ] Launch without crashes
- [ ] All features from web work
- [ ] Push notifications received
- [ ] Deep links work
- [ ] Camera access works
- [ ] Location access works
- [ ] Offline mode handled gracefully
- [ ] Safe areas respected
- [ ] App lifecycle handled

## Troubleshooting

### Common Issues

**1. Gradle Build Fails**
```bash
cd android
./gradlew clean
./gradlew build
```

**2. CocoaPods Errors (iOS)**
```bash
cd ios
rm -rf Pods
pod install
```

**3. Capacitor Sync Issues**
```bash
npm run cap:sync:android
npm run cap:sync:ios
```

**4. API Connection Issues**
- Check `VITE_API_URL` is set correctly
- Ensure backend is running and accessible
- Check firewall/network settings
- Verify CORS configuration

**5. Push Notifications Not Working**
- Verify Firebase project credentials
- Check device tokens are being registered
- Ensure permissions are granted
- Check notification server configuration

## Versioning

Current versions:
- App Version: 1.0.0
- Android Version Code: 1
- iOS Build Number: 1

For future releases:
- Web: Update frontend package.json
- Android: Increment versionCode and versionName
- iOS: Increment build number and version

## Deployment

### Web Deployment

```bash
cd frontend
npm run build
# Deploy dist/ folder to:
# - Netlify: Link to GitHub repo
# - Vercel: Link to GitHub repo
# - AWS S3: Upload dist/ contents
# - Traditional server: Copy dist/ via FTP/SSH
```

### Android Deployment

1. Build AAB
2. Upload to Google Play Console
3. Complete store listing
4. Submit for review
5. Publish when approved

### iOS Deployment

1. Archive in Xcode
2. Upload via TestFlight or App Store
3. Configure app information
4. Add screenshots
5. Submit for App Review
6. Publish when approved

## Monitoring & Analytics

Configure in your services:
- Firebase Analytics
- Sentry for error tracking
- Custom analytics for app usage
- Backend server logs

## Support & Documentation

- [Capacitor Documentation](https://capacitorjs.com)
- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
- [Google Play Console Help](https://support.google.com/googleplay/android-developer)
- [App Store Connect Help](https://help.apple.com/app-store-connect)

## Final Notes

- This is a production-ready setup
- All three platforms share the same backend
- No duplicate code across platforms
- Existing web app remains fully functional
- Native features are optional enhancements
- Follow security best practices
- Test thoroughly before production release
