# Freifunk Meet

Freifunk Meet is a mobile app for video meetings on
[meet.ffmuc.net](https://meet.ffmuc.net). It works on Android and iOS.

## Features

- Join a meeting with a room name or with a link.
  All meet.ffmuc.net links work: room links, host links, speaker links and
  manage links.
- Reserve a room. A reserved room has its own links that stay. It has three
  access levels: host, speaker and viewer. You do not need an account.
- Keep your rooms in "My rooms": join as host, share links, extend, make new
  links, delete.
- Get a reminder 3 days and 1 day before a room expires.
- See your recent meetings.
- English and German. Light and dark mode.

The app keeps only the host key, the room name and the expiry date of your
rooms. It keeps them in the secure storage of the device (Keychain or
Keystore). The app does not keep meeting tokens.

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

## Documentation

- [Links that open the app](docs/app-links.md)
- [Reminders](docs/reminders.md)
- [Dependencies that are not free software](docs/non-free.md)

## Icons

The icons come from `assets/logo.svg`. To make the icons again, run
`npm run icons`. This needs `rsvg-convert` and ImageMagick.

## License

Apache License 2.0. See [LICENSE](LICENSE).
