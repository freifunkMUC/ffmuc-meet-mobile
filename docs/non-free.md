# Dependencies that are not free software

The app uses the Jitsi Meet React Native SDK (`@jitsi/react-native-sdk`).
The SDK needs some packages that are not free software or that use Google
services. The app does not use Firebase. The app also turns off third-party requests
in meetings (`disableThirdPartyRequests`).

| Package | Used for | Note |
|---|---|---|
| `@react-native-google-signin/google-signin` | Sign-in for YouTube live streams | Adds Google Play services (`play-services-auth`). Used only when you start a YouTube live stream. |
| `@giphy/react-native-sdk` | GIFs in the chat | The app turns Giphy off. |
| `com.dropbox.core:dropbox-core-sdk` | Recording to Dropbox | Used only when the server turns on Dropbox. |
| `@amplitude/analytics-react-native` | Analytics | The app turns analytics off. |

These parts make the app not compatible with the main F-Droid repository.
To make an F-Droid build, the SDK must be built without these packages.
This is not done yet.

The code of this app and the reserve client do not use these packages.
