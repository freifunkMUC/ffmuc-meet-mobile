# Links that open the app

## Custom schemes

The app opens these links on Android and iOS:

| Link | Result |
|---|---|
| `ffmuc-meet://<room>` | Join the room on meet.ffmuc.net as viewer. |
| `ffmuc-meet://reserve/h/<key>` | Join as host. |
| `ffmuc-meet://reserve/s/<key>` | Join as speaker. |
| `ffmuc-meet://<server>/<room>` | Join the room on another Jitsi server. |
| `jitsi-meet://…` | Same as `ffmuc-meet://…`. |

## HTTPS links

The app opens these links from `https://meet.ffmuc.net`:

- `/<room>`: one path segment. On Android, version 12 or later is necessary.
- `/reserve/h/<key>` and `/reserve/s/<key>`: host and speaker links.
- `/reserve/#k=<key>` and `/reserve/#m=<key>`: manage links. Android cannot
  match the part after `#`. Thus Android opens all `/reserve` links in the app.

The operating system opens these links in the app only when the server
confirms the app. The meet-reserve service sends the files below when you set
its environment variables.

| Platform | File | Server setting |
|---|---|---|
| iOS | `/.well-known/apple-app-site-association` | `RESERVE_APPLE_TEAM_ID` |
| Android | `/.well-known/assetlinks.json` | `RESERVE_ANDROID_CERT_SHA256` |

## Build configuration

### iOS

1. Set your Apple Team ID in Xcode (target FreifunkMeet, Signing and
   Capabilities), or set `DEVELOPMENT_TEAM` in the build settings.
2. The file `ios/FreifunkMeet/FreifunkMeet.entitlements` contains
   `applinks:meet.ffmuc.net`. The App ID must have the capability
   "Associated Domains".
3. Set the same Team ID on the server as `RESERVE_APPLE_TEAM_ID`.

### Android

1. Get the SHA-256 fingerprint of the release signing key:

   ```sh
   keytool -list -v -keystore release.keystore -alias <alias>
   ```

   For Google Play App Signing, use the fingerprint from the Play Console.
2. Set the fingerprint on the server as `RESERVE_ANDROID_CERT_SHA256`.
3. Check the result on a device:

   ```sh
   adb shell pm verify-app-links --re-verify net.ffmuc.meet
   adb shell pm get-app-links net.ffmuc.meet
   ```

Debug builds use the debug key. Their links are not verified unless the server
also has the debug fingerprint.
