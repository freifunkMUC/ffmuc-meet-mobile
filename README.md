# Freifunk Meet

Freifunk Meet is a mobile app for video meetings on [meet.ffmuc.net](https://meet.ffmuc.net).
It works on Android and iOS.

The app uses React Native and the Jitsi Meet React Native SDK.

## Build

You need:

- Node.js 22 or later
- For Android: JDK 17 and the Android SDK
- For iOS: macOS, Xcode and CocoaPods

Install the dependencies:

```sh
npm ci
```

Start the Android app:

```sh
npm run android
```

Start the iOS app:

```sh
cd ios && pod install && cd ..
npm run ios
```

## Check

```sh
npm run lint
npm run typecheck
npm test
```

## Icons

The icons come from `assets/logo.svg`. To make the icons again, run `npm run icons`.
This needs `rsvg-convert` and ImageMagick.

## License

Apache License 2.0. See [LICENSE](LICENSE).
