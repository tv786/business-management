# Firebase Setup Guide for Business Management System

## Prerequisites
- Google account
- Access to Firebase Console (https://console.firebase.google.com/)

## Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Create a project" or "Add project"
3. Enter project name: `business-management-system` (or your preferred name)
4. Choose whether to enable Google Analytics (recommended for user insights)
5. Select your Google Analytics account if enabled
6. Click "Create project"

## Step 2: Configure Authentication

1. In your Firebase project console, click "Authentication" in the left sidebar
2. Click "Get started" if this is your first time
3. Go to "Sign-in method" tab
4. Enable the following sign-in providers:
   - **Email/Password**: Click on it, toggle "Enable", then "Save"
   - **Google** (optional but recommended): Click on it, toggle "Enable", add your project's public-facing name and support email, then "Save"

## Step 3: Configure Firestore Database

1. In your Firebase project console, click "Firestore Database" in the left sidebar
2. Click "Create database"
3. Choose "Start in test mode" (we'll configure security rules later)
4. Select a location closest to your users (e.g., us-central1)
5. Click "Done"

## Step 4: Configure Security Rules

1. In Firestore Database, go to "Rules" tab
2. Replace the default rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // User data collections (vendors, transactions, projects, settings)
    match /users/{userId}/{collection=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Click "Publish"

## Step 5: Get Firebase Configuration

1. In your Firebase project console, click the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (</>) to add a web app
5. Enter app nickname: `business-management-webapp`
6. Check "Also set up Firebase Hosting" (optional but recommended)
7. Click "Register app"
8. Copy the Firebase configuration object (looks like this):

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com", 
  messagingSenderId: "123456789",
  appId: "your-app-id"
};
```

## Step 6: Configure the Web App

1. Create a file called `js/firebase-config.js` in your project
2. Add your Firebase configuration:

```javascript
// Replace with your actual Firebase config
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com", 
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

export { firebaseConfig };
```

## Step 7: Optional - Set up Firebase Hosting

1. In Firebase console, go to "Hosting" in the left sidebar
2. Click "Get started"
3. Follow the setup instructions to deploy your app to Firebase Hosting
4. Your app will be available at `https://your-project-id.web.app`

## Security Considerations

1. **Never commit your Firebase config to public repositories** - the config contains sensitive keys
2. **Use environment variables** or secure configuration management in production
3. **Regularly review your Firestore security rules** to ensure data protection
4. **Enable App Check** in production for additional security
5. **Monitor usage** in Firebase console to detect unusual activity

## Data Structure

The app will store data in Firestore with this structure:
```
users/
  {userId}/
    profile/
      companyName: string
      businessType: string
      settings: object
    vendors/
      {vendorId}: vendor object
    transactions/
      {transactionId}: transaction object  
    projects/
      {projectId}: project object
```

## Troubleshooting

- **"Firebase not defined" error**: Make sure Firebase scripts are loaded before your app scripts
- **"Permission denied" error**: Check your Firestore security rules and ensure user is authenticated
- **"Network error"**: Check if Firebase services are properly configured and your internet connection
- **"Auth domain not configured"**: Ensure your domain is added to Firebase Authentication settings

## Support
- Firebase Documentation: https://firebase.google.com/docs
- Firebase Console: https://console.firebase.google.com/
- Stack Overflow: Tag your questions with `firebase` and `javascript`