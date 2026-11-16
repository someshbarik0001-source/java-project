#!/usr/bin/env bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PORT="${PORT:-8080}"

echo "=================================================="
echo "  Starting Learn X Java Backend Service"
echo "  Port: $PORT"
echo "  Java: $(java -version 2>&1 | head -n 1)"
echo "=================================================="

# Modern Java directly launches multi-file source programs without requiring Maven pre-installed
exec java "$SCRIPT_DIR/backend-java/src/main/java/com/learnx/Main.java"
