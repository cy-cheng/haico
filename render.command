#!/bin/bash
set -euo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
cd -- "$(dirname -- "$0")"
log_path="$PWD/render.log"
if [ "${HAICO_RENDER_LOGGING:-}" != "1" ]; then
  export HAICO_RENDER_LOGGING=1
  if bash "$0" "$@" 2>&1 | tee "$log_path"; then
    exit 0
  else
    exit $?
  fi
fi
stage="Preparing compiler"

on_error() {
  printf '\nRender failed during: %s\nFull log: %s\n' "$stage" "$log_path"
  if [ -t 0 ]; then
    read -r -p "Press Enter to close..." reply
  fi
}
trap on_error ERR

version="0.14.2"
case "$(uname -m)" in
  arm64)
    target="aarch64-apple-darwin"
    checksum="470aa49a2298d20b65c119a10e4ff8808550453e0cb4d85625b89caf0cedf048"
    ;;
  x86_64)
    target="x86_64-apple-darwin"
    checksum="4e91d8e1e33ab164f949c5762e01ee3faa585c8615a2a6bd5e3677fa8506b249"
    ;;
  *) printf 'Unsupported CPU architecture.\n' >&2; on_error; exit 1 ;;
esac

compiler="$PWD/.tools/typst-$version-$target/typst"
if [ ! -x "$compiler" ]; then
  stage="Downloading official Typst $version"
  mkdir -p .tools
  temp_dir="$(mktemp -d "$PWD/.tools/download.XXXXXX")"
  trap 'rm -rf -- "$temp_dir"' EXIT
  archive="$temp_dir/typst.tar.xz"
  printf 'Downloading official Typst %s for %s...\n' "$version" "$target"
  curl --fail --location --show-error --connect-timeout 20 --max-time 300 \
    --retry 2 --output "$archive" \
    "https://github.com/typst/typst/releases/download/v$version/typst-$target.tar.xz"
  stage="Verifying and extracting Typst"
  printf '%s  %s\n' "$checksum" "$archive" | shasum -a 256 -c -
  tar -xJf "$archive" -C "$temp_dir"
  "$temp_dir/typst-$target/typst" --version
  mv "$temp_dir/typst-$target" "$(dirname -- "$compiler")"
fi

stage="Compiling slides.typ"
"$compiler" compile --font-path fonts slides.typ slides.pdf
printf '\nCreated: %s/slides.pdf\n' "$PWD"
stage="Opening slides.pdf"
open slides.pdf
