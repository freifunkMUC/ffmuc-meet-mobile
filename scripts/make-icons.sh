#!/bin/sh
# Make the app icons from assets/logo.svg.
# Needs rsvg-convert and ImageMagick.
set -eu
cd "$(dirname "$0")/.."
src=assets/logo.svg
res=android/app/src/main/res
tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

for pair in mdpi:48 hdpi:72 xhdpi:96 xxhdpi:144 xxxhdpi:192; do
  d=${pair%%:*}
  s=${pair##*:}
  inner=$((s * 84 / 100))
  rsvg-convert -w "$inner" -h "$inner" "$src" -o "$tmp/logo.png"
  magick -size "${s}x${s}" xc:none -fill white -draw "circle $((s / 2)),$((s / 2)) $((s / 2)),1" \
    "$tmp/logo.png" -gravity center -composite "$res/mipmap-$d/ic_launcher_round.png"
  magick -size "${s}x${s}" xc:none -fill white -draw "roundrectangle 1,1 $((s - 2)),$((s - 2)) $((s / 6)),$((s / 6))" \
    "$tmp/logo.png" -gravity center -composite "$res/mipmap-$d/ic_launcher.png"
done

rsvg-convert -w 860 -h 860 "$src" -o "$tmp/logo.png"
magick -size 1024x1024 xc:white "$tmp/logo.png" -gravity center -composite -alpha off \
  ios/FreifunkMeet/Images.xcassets/AppIcon.appiconset/AppIcon-1024.png

rsvg-convert -w 256 -h 256 "$src" -o assets/logo.png
