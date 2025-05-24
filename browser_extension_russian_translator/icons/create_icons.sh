#!/bin/bash

# This script helps users create placeholder icons for the browser extension
# It requires ImageMagick to be installed (brew install imagemagick on Mac)

# Create a simple icon with the text "RU" for Russian
for size in 16 48 128; do
  convert -size ${size}x${size} xc:none -fill '#3498db' -draw "roundrectangle 0,0 ${size},${size} 5,5" \
    -fill white -gravity center -font Arial -pointsize $((size/2)) -annotate 0 "RU" icon${size}.png
  echo "Created icon${size}.png"
done

echo "Icons created successfully! If you want to use your own icons, replace these files with your own."
echo "For best results, use PNG files with transparent backgrounds." 