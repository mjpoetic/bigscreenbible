# Android push notification setup

The app now supports Android notification permission, token registration/renewal, reminder and friend notification delivery, and trusted notification tap destinations. Firebase setup and production deployment are required before it can deliver notifications.

## 1. Find or create the Firebase project

Open https://console.firebase.google.com/ using the Google account that will own Big Screen Bible. Look for an existing Big Screen Bible project; otherwise create one. Google Analytics is optional for push notifications.

In Project settings → General → Your apps, add an Android app with the exact package name **com.bigscreenbible.app**. Download its **google-services.json** and save it at **android/app/google-services.json**. This is Android client configuration, not the server service account key. SHA fingerprints are not required for FCM alone.

The client config is ignored by Git and must also be supplied to any release build machine. Release builds fail explicitly if it is missing or targets a different package. Debug builds remain available for UI work without Firebase configuration.

## 2. Configure server delivery

In the same Firebase project, ensure Firebase Cloud Messaging API (HTTP v1) is enabled. Under Project settings → Service accounts, generate a private service account key with permission to send FCM messages in that project.

In the existing Big Screen Bible Supabase project, open Edge Functions → Secrets. Add **FCM_SERVICE_ACCOUNT_JSON**, with the complete service account JSON as its value. This is a private server credential: keep it outside the app and repository. Do not paste it into chat. Do not substitute google-services.json for it.

Apply **supabase/update-android-push.sql** using the SQL editor. It extends the existing subscription table without changing its access policies; tokens remain server-only. Then deploy both **push-subscriptions** and **send-push-notifications**, including their shared modules. Keep the existing scheduler and authentication configuration. The subscription endpoint's GET response should report **androidEnabled: true**, alongside the existing Apple/web readiness fields.

The app loads https://bigscreenbible.com by default. Publish the updated web assets as well as deploying the backend: syncing Android assets alone does not update the live page.

## 3. Build and verify before Google Play

Run `npm run cap:sync`, then build a signed release Android App Bundle in Android Studio using the production upload key. Configure the release version name and an unused, increasing version code for the Play listing. The current Android version code is still 1; select it based on the actual Play Console history rather than guessing.

On a physical Android device with Google Play services:

- Fresh install: enabling notifications requests permission on Android 13+; denying it gives Android Settings instructions. Android 12 and earlier do not show this runtime dialog.
- Grant permission and enable notifications; confirm the app reports that they are connected.
- Verify scheduled morning/evening reminders and signed-in friend/challenge notifications with the app in foreground, background, and closed normally. A force-stopped app may not receive messages until reopened.
- Tap a notification from background and cold start; confirm the correct passage, friend request, or challenge opens.
- Restart the app; confirm registration renews without another permission prompt or duplicate subscriptions.
- Disable notifications and sign out/switch accounts; confirm preferences and account linking follow the intended behavior.
- Revoke permission in Android Settings, reopen, and re-enable through Settings; verify recovery.
- Check the notification icon, sound, and the “Bible reminders and friend activity” channel in Android Settings.

Review the Play Console Data safety disclosure and privacy policy for the actual Firebase messaging token/device data use. Push support alone does not establish that the entire app is ready for Play review.

## Local checks

`npm run test:push` and `npm run test:native-push` cover browser/Apple compatibility, Android permission and registration behavior, OAuth signing, FCM payloads, and expired-token handling. Only an FCM **UNREGISTERED** error deletes a subscription; configuration, authorization, quota, and payload errors retain it.

Sources: [Firebase Android setup](https://firebase.google.com/docs/cloud-messaging/android/get-started), [FCM HTTP v1 authorization](https://firebase.google.com/docs/cloud-messaging/send/v1-api), [Supabase function secrets](https://supabase.com/docs/guides/functions/secrets).
