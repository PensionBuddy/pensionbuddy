#!/bin/bash
# One-time setup on the Mac for pb_edit.py. Safe to run again: it skips what is there.
#
#   tools/talking-head/setup_mac.sh
#
# Installs (with Homebrew) ffmpeg, whisper.cpp and Python 3.12; makes a Python
# environment in the work folder; downloads the whisper model (1.6 GB), the
# YuNet face model and the fonts; then runs "pb_edit.py check".
# Homebrew itself needs the Mac password, so a person installs it in Terminal.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
WORK="${PB_WORK:-$HOME/Downloads/pensionbuddy-edit}"
mkdir -p "$WORK/models" "$WORK/fonts"

if ! command -v brew >/dev/null 2>&1; then
  for b in /opt/homebrew/bin/brew /usr/local/bin/brew; do
    if [ -x "$b" ]; then eval "$("$b" shellenv)"; fi
  done
fi
if ! command -v brew >/dev/null 2>&1; then
  echo "Homebrew is not installed. Open Terminal, paste this line, press Return, and type your Mac password when asked:"
  echo '  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
  echo "Then run this script again."
  exit 3
fi

for f in ffmpeg whisper-cpp python@3.12; do
  brew list --versions "$f" >/dev/null 2>&1 || brew install "$f"
done

PYB="$(brew --prefix python@3.12)/bin/python3.12"
if [ ! -x "$WORK/.venv/bin/python" ]; then
  "$PYB" -m venv "$WORK/.venv"
fi
"$WORK/.venv/bin/python" -m pip install --quiet --upgrade pip
"$WORK/.venv/bin/python" -m pip install --quiet numpy pillow opencv-python-headless tomli

fetch() {  # url, file, sha (sha1 or sha256; empty to skip)
  local url="$1" out="$2" sum="${3:-}"
  if [ ! -s "$out" ]; then
    echo "downloading $(basename "$out") ..."
    curl -L --fail --retry 3 -o "$out.part" "$url"
    mv "$out.part" "$out"
  fi
  if [ -n "$sum" ]; then
    local got
    if [ ${#sum} -eq 40 ]; then got=$(shasum -a 1 "$out" | cut -d' ' -f1); else got=$(shasum -a 256 "$out" | cut -d' ' -f1); fi
    if [ "$got" != "$sum" ]; then
      echo "checksum wrong for $out: removed, run again"; rm -f "$out"; exit 4
    fi
  fi
}

fetch https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-large-v3-turbo.bin \
      "$WORK/models/ggml-large-v3-turbo.bin" 4af2b29d7ec73d781377bfd1758ca957a807e941
fetch https://media.githubusercontent.com/media/opencv/opencv_zoo/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx \
      "$WORK/models/face_detection_yunet_2023mar.onnx" 8f2383e4dd3cfbb4553ea8718107fc0423210dc964f9f4280604804ed2552fa4

# Geist (the brief's font, SIL Open Font License) from its npm package
if [ ! -s "$WORK/fonts/Geist-Bold.ttf" ]; then
  tmp="$(mktemp -d)"
  curl -L --fail -o "$tmp/geist.tgz" https://registry.npmjs.org/geist/-/geist-1.7.2.tgz
  tar -xzf "$tmp/geist.tgz" -C "$tmp"
  cp "$tmp/package/dist/fonts/geist-sans/Geist-Bold.ttf" "$WORK/fonts/"
  cp "$tmp/package/LICENSE.txt" "$WORK/fonts/Geist-LICENSE.txt" 2>/dev/null || true
  rm -rf "$tmp"
fi
# Figtree (the site's and the logo's font), in case the brief switches to it
fetch 'https://raw.githubusercontent.com/google/fonts/main/ofl/figtree/Figtree%5Bwght%5D.ttf' "$WORK/fonts/Figtree-Variable.ttf"

"$WORK/.venv/bin/python" "$HERE/pb_edit.py" --work "$WORK" check || true
echo
echo "Set up. Python for the runbook: $WORK/.venv/bin/python"
