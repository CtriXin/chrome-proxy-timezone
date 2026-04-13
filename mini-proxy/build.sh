#!/bin/bash
set -e

VERSION="v1.18.10"
DIST_DIR="dist"
mkdir -p "$DIST_DIR"

echo "Building Atlas Proxy Mini ..."

# ------------------ macOS ARM64 ------------------
echo "[1/2] Downloading mihomo for darwin/arm64..."
curl -sL "https://github.com/MetaCubeX/mihomo/releases/download/$VERSION/mihomo-darwin-arm64-$VERSION.gz" -o /tmp/mihomo-darwin.gz
gunzip -c /tmp/mihomo-darwin.gz > mihomo-core
chmod +x mihomo-core

# hide other platform embed files to workaround Go 1.20 bug
mv core_windows.go core_windows.go.bak
mv core_linux.go core_linux.go.bak

echo "[1/2] Building darwin/arm64..."
GOOS=darwin GOARCH=arm64 go build -ldflags="-s -w" -o "$DIST_DIR/atlas-mini-darwin-arm64" .

# restore
mv core_windows.go.bak core_windows.go
mv core_linux.go.bak core_linux.go
rm -f mihomo-core /tmp/mihomo-darwin.gz

# ------------------ Windows AMD64 ------------------
echo "[2/2] Downloading mihomo for windows/amd64..."
curl -sL "https://github.com/MetaCubeX/mihomo/releases/download/$VERSION/mihomo-windows-amd64-$VERSION.zip" -o /tmp/mihomo-windows.zip
unzip -o /tmp/mihomo-windows.zip -d /tmp/mihomo-win
cp /tmp/mihomo-win/mihomo-windows-amd64.exe mihomo-core.exe
chmod +x mihomo-core.exe

mv core_darwin.go core_darwin.go.bak
mv core_linux.go core_linux.go.bak

echo "[2/2] Building windows/amd64..."
GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o "$DIST_DIR/atlas-mini-windows-amd64.exe" .

# restore
mv core_darwin.go.bak core_darwin.go
mv core_linux.go.bak core_linux.go
rm -rf mihomo-core.exe /tmp/mihomo-windows.zip /tmp/mihomo-win

echo "Done. Binaries in $DIST_DIR/"
ls -lh "$DIST_DIR/"
