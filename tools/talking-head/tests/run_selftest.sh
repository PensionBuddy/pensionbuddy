#!/bin/bash
# End-to-end test of pb_edit.py on a synthetic shoot.
#
#   tests/run_selftest.sh            macOS: say + the real whisper.cpp and model (checks the install)
#   tests/run_selftest.sh --mock     no whisper model: espeak-ng or say + tests/mock_whisper.py
#
# Everything goes to $PB_SELFTEST (default ~/Downloads/pensionbuddy-edit/selftest),
# which the inventory of the real shoot skips.
set -euo pipefail
HERE="$(cd "$(dirname "$0")/.." && pwd)"
WORK_ROOT="${PB_WORK:-$HOME/Downloads/pensionbuddy-edit}"
OUT="${PB_SELFTEST:-$WORK_ROOT/selftest}"
PY="${PB_PYTHON:-$WORK_ROOT/.venv/bin/python}"
[ -x "$PY" ] || PY=python3
MOCK=0
[ "${1:-}" = "--mock" ] && MOCK=1

rm -rf "$OUT"
mkdir -p "$OUT/work"
# models and fonts from the real work folder, so the test uses what the real run will use
ln -s "$WORK_ROOT/models" "$OUT/work/models" 2>/dev/null || true
ln -s "$WORK_ROOT/fonts" "$OUT/work/fonts" 2>/dev/null || true

TTS=say
command -v say >/dev/null || TTS=espeak
FACE=()
[ -f "${PB_FACE:-}" ] && FACE=(--face "$PB_FACE")
"$PY" "$HERE/tests/make_fixture.py" --out "$OUT" --tts "$TTS" ${FACE[@]+"${FACE[@]}"}

ARGS=(--source "$OUT/source" --work "$OUT/work" --finals "$OUT/finals")
STRICT=()
if [ $MOCK = 1 ]; then
  printf '#!/bin/sh\nexec "%s" "%s" "$@"\n' "$PY" "$HERE/tests/mock_whisper.py" > "$OUT/mock-whisper"
  chmod +x "$OUT/mock-whisper"
  ARGS+=(--whisper-bin "$OUT/mock-whisper")
  [ -e "$OUT/work/models/ggml-large-v3-turbo.bin" ] || { rm -f "$OUT/work/models"; mkdir -p "$OUT/work/models"; echo mock > "$OUT/work/models/ggml-large-v3-turbo.bin"; }
  export PB_MOCK_TRUTH="$OUT/truth"
  STRICT=(--strict)
fi
"$PY" "$HERE/pb_edit.py" "${ARGS[@]}" run
"$PY" "$HERE/tests/check_selftest.py" "$OUT" ${STRICT[@]+"${STRICT[@]}"}
