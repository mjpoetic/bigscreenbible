# Encryption review for store submission

Reviewed October 11, 2026 against source commit `9252ffb` and the dependency/script versions below. This is a technical assessment of the current application, not an Apple approval, BIS classification ruling, or blanket certification of export eligibility in every country.

## Result and iOS configuration

The reviewed iOS application uses cryptography supplied by Apple through CryptoKit, CommonCrypto, WebKit/Web Crypto, and system HTTPS networking. No app-owned or dependency implementation of a data-encryption cipher was identified. The supported App Store Connect documentation outcome is **no non-exempt encryption**. `ios/App/App/Info.plist` now sets `ITSAppUsesNonExemptEncryption` to the Boolean `false`.

Apple says an app whose encryption is limited to the Apple operating system does not require encryption documentation in App Store Connect. Its developer guidance permits this flag to be false when the app and its linked libraries use only exempt forms. The flag does not mean the app sends unencrypted traffic.

## Evidence reviewed

| Component | Version / evidence | Cryptographic use |
| --- | --- | --- |
| App-owned iOS source | `SceneDelegate.swift` | Apple secure random bytes and CryptoKit SHA-256 create a Sign in with Apple nonce. No encryption/decryption implementation found. |
| Capacitor and Cordova bridge | Native package resolution pins Capacitor 8.4.1; matching installed iOS sources inspected | WKWebView loads the app. Native HTTP uses URLSession. AppUUID calls Apple's CommonCrypto SHA-256. The optional SSL-pinning class hook is present in Capacitor, but no implementation is installed in the declared app packages. |
| Native plugins | Haptics, Push Notifications, Status Bar from the local Swift package dependencies | OS APIs; no custom cipher implementation found in inspected source. |
| Supabase JS | Exact public UMD file loaded by `index.html`: 2.110.1 | PKCE SHA-256, secure random generation, and RS256/ES256 JWT signature verification use browser Web Crypto. No `subtle.encrypt`, `subtle.decrypt`, or embedded AES implementation found. |
| API.Bible FUM | Public `fumsV3.min.js` snapshot retrieved October 11 | Random identifier generation and SHA-256 hashing use Web Crypto. No encryption/decryption implementation found. |
| Android app source and declared dependencies | Capacitor, AndroidX, Cordova bridge, the same three Capacitor plugins | System WebView/networking and authentication; no custom cipher or extra app/plugin JAR libraries identified. This is source evidence, not verification of a signed AAB. |
| Runtime configuration | Capacitor server is `https://bigscreenbible.com`, `cleartext: false` | HTTPS encryption is provided by system networking. Backend provider/API keys and server-side signing functions are not cryptographic libraries shipped in the mobile client. |

Public JavaScript snapshot SHA-256 values, for identifying exactly what was inspected:

- Supabase 2.110.1: `739d338edbd73a3390df5f97dfc142979e79520ec20c59653a1593fb9f6e33f5`
- API.Bible FUM: `38a2fb7c9755adc98510d9a74d497f024d8542ba97983b164381bb191227cb13`

The FUM URL is not version-pinned. Recheck it when preparing the release, and revisit this assessment after adding/updating SDKs or introducing encrypted storage, secure messaging, VPN capabilities, or custom TLS/cipher implementations. The native shell loads the live website, so material cryptographic changes to that website also require review.

## How to answer store questions

Answer the exact wording presented in the console:

- **Does the app use/access encryption at all?** Yes: HTTPS and system cryptographic functions are used.
- **Does it use non-exempt encryption?** No, for the implementation reviewed here; this is the meaning of the configured false flag.
- **Does it implement proprietary/non-standard algorithms?** No implementation was found.
- **Does it implement standard encryption algorithms instead of, or in addition to, Apple's OS encryption?** The reviewed iOS cipher/networking functions are OS-provided. The app does not implement its own cipher.
- **Apple encryption-document upload:** Not expected for this OS-only implementation. If App Store Connect nevertheless asks for documents, inspect the actual selected build and wording before answering; do not invent a CCATS or approval code.
- **Google Play US export-laws declaration:** The technical review identified no custom encryption feature requiring a change before app creation. That declaration also certifies broader legal/export obligations; the Apple false flag alone does not certify it. Use the actual release and chosen territories when completing the declaration.

Do not set `ITSEncryptionExportComplianceCode`: no Apple-issued code exists or is required by this assessment. Do not choose distribution territories merely to bypass documentation requirements.

## Release-build verification still required

Before uploading the iOS archive, inspect its final app Info.plist and confirm `ITSAppUsesNonExemptEncryption` is Boolean false. Confirm the archive links only the reviewed dependency set, and that no build setting or generated plist overrides the value. This flag takes effect only in a rebuilt native app; a website deployment cannot modify an already-installed shell.

App Store Connect still determines the outcome for the uploaded build. Destination/export-party restrictions and any reporting obligations must be considered separately; an Apple documentation exemption is not an exemption from all export law. BIS distinguishes authentication, signatures, and integrity functions from cryptography for data confidentiality, but this review does not assign a blanket EAR99 classification to the entire app.

## Primary sources

- [Apple: Export compliance documentation for encryption](https://developer.apple.com/help/app-store-connect/reference/app-information/export-compliance-documentation-for-encryption)
- [Apple: Complying with Encryption Export Regulations](https://developer.apple.com/documentation/security/complying-with-encryption-export-regulations)
- [Apple: Overview of export compliance](https://developer.apple.com/help/app-store-connect/manage-app-information/overview-of-export-compliance/)
- [BIS: Cryptography for Data Confidentiality](https://media.bis.gov/learn-support/encryption-controls/cryptography-for-data-confidentiality)
