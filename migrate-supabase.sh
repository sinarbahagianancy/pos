#!/bin/bash

# ============================================================
# Supabase Cross-Region Migration Script
# ============================================================
# Usage:
#   chmod +x migrate-supabase.sh
#   ./migrate-supabase.sh
#
# Requirements:
#   - PostgreSQL client (psql, pg_dump) installed
#   - Network access to both Supabase databases
# ============================================================

set -e

# ============================================================
# CONFIGURATION — Edit these values
# ============================================================

# Old (source) database
OLD_DB_HOST="aws-1-ap-northeast-2.pooler.supabase.com"
OLD_DB_PORT="6543"
OLD_DB_NAME="postgres"
OLD_DB_USER="postgres.tstgmviwdvxrtcypvnvh"
OLD_DB_PASSWORD="NancySinarBahagia!"

# New (destination) database
NEW_DB_HOST="aws-1-ap-southeast-1.pooler.supabase.com"
NEW_DB_PORT="6543"
NEW_DB_NAME="postgres"
NEW_DB_USER="postgres.dxuktojrjepcloxhlehl"
NEW_DB_PASSWORD="NancySinarBahagia!"

# Backup file
BACKUP_FILE="supabase_backup_$(date +%Y%m%d_%H%M%S).sql"

# ============================================================
# DERIVED CONNECTION STRINGS
# ============================================================

OLD_DB_URL="postgresql://${OLD_DB_USER}:${OLD_DB_PASSWORD}@${OLD_DB_HOST}:${OLD_DB_PORT}/${OLD_DB_NAME}"
NEW_DB_URL="postgresql://${NEW_DB_USER}:${NEW_DB_PASSWORD}@${NEW_DB_HOST}:${NEW_DB_PORT}/${NEW_DB_NAME}"

# ============================================================
# FUNCTIONS
# ============================================================

log() {
  echo -e "\033[1;34m[MIGRATE]\033[0m $1"
}

error() {
  echo -e "\033[1;31m[ERROR]\033[0m $1" >&2
  exit 1
}

success() {
  echo -e "\033[1;32m[SUCCESS]\033[0m $1"
}

# ============================================================
# PREFLIGHT CHECKS
# ============================================================

log "Running preflight checks..."

# Check for required commands
if ! command -v pg_dump &> /dev/null; then
  error "pg_dump not found. Install PostgreSQL client:
  - macOS: brew install libpq && brew link libpq
  - Ubuntu: sudo apt-get install postgresql-client
  - Docker: docker run --rm postgres:16 pg_dump --version"
fi

if ! command -v psql &> /dev/null; then
  error "psql not found. Install PostgreSQL client."
fi

# Check configuration
if [[ "$NEW_DB_HOST" == *"your-new-region"* ]]; then
  error "Please configure the NEW_DB_* variables in this script before running."
fi

# ============================================================
# STEP 1: Dump old database
# ============================================================

log "Step 1/3: Dumping old database from ${OLD_DB_HOST}..."

pg_dump "$OLD_DB_URL" \
  --inserts \
  --no-owner \
  --no-privileges \
  --no-comments \
  --verbose \
  -f "$BACKUP_FILE" 2>&1 | tail -5

if [ ! -f "$BACKUP_FILE" ] || [ ! -s "$BACKUP_FILE" ]; then
  error "Backup file is empty or was not created. Check your connection details."
fi

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
BACKUP_LINES=$(wc -l < "$BACKUP_FILE")
success "Backup created: ${BACKUP_FILE} (${BACKUP_SIZE}, ${BACKUP_LINES} lines)"

# ============================================================
# STEP 2: Restore to new database
# ============================================================

log "Step 2/3: Restoring to new database at ${NEW_DB_HOST}..."
log "This may take a while for large databases..."

# Use ON_ERROR_STOP=0 to continue past non-critical errors (like "already exists")
# but log them for review
RESTORE_LOG="restore_errors_$(date +%Y%m%d_%H%M%S).log"

psql "$NEW_DB_URL" \
  -v ON_ERROR_STOP=0 \
  --echo-errors \
  -f "$BACKUP_FILE" \
  2>&1 | tee "$RESTORE_LOG" | grep -E "(ERROR|FATAL)" || true

ERROR_COUNT=$(grep -c "ERROR" "$RESTORE_LOG" 2>/dev/null || echo "0")
if [ "$ERROR_COUNT" -gt 0 ]; then
  log "⚠  There were ${ERROR_COUNT} errors during restore. Check ${RESTORE_LOG} for details."
  log "   Common safe errors: 'already exists', 'duplicate key'"
else
  success "Restore completed with no errors."
fi

# ============================================================
# STEP 3: Verify migration
# ============================================================

log "Step 3/3: Verifying migration..."

echo ""
echo "Table row counts comparison:"
echo "============================================"
printf "%-30s %-12s %-12s\n" "TABLE" "OLD" "NEW"
echo "--------------------------------------------"

# Get tables from old DB
TABLES=$(psql "$OLD_DB_URL" -t -c "
  SELECT tablename FROM pg_tables
  WHERE schemaname = 'public'
  ORDER BY tablename;
")

while IFS= read -r table; do
  table=$(echo "$table" | xargs)  # trim whitespace
  [ -z "$table" ] && continue

  OLD_COUNT=$(psql "$OLD_DB_URL" -t -c "SELECT COUNT(*) FROM public.\"$table\";" | xargs)
  NEW_COUNT=$(psql "$NEW_DB_URL" -t -c "SELECT COUNT(*) FROM public.\"$table\";" 2>/dev/null | xargs || echo "ERR")

  if [ "$OLD_COUNT" == "$NEW_COUNT" ]; then
    STATUS="✓"
  else
    STATUS="✗"
  fi

  printf "%-30s %-12s %-12s %s\n" "$table" "$OLD_COUNT" "$NEW_COUNT" "$STATUS"
done <<< "$TABLES"

echo "============================================"
echo ""

# ============================================================
# SUMMARY
# ============================================================

success "Migration complete!"
echo ""
echo "Next steps:"
echo "  1. Verify your application works with the new database"
echo "  2. Update your .env with new connection strings:"
echo "     DATABASE_URL=\"${NEW_DB_URL}\""
echo "  3. Migrate Storage buckets separately (if applicable)"
echo "  4. Redeploy Edge Functions to the new project"
echo "  5. Update Supabase URL and keys in your application"
echo ""
echo "Backup saved to: ${BACKUP_FILE}"
echo "Restore log:     ${RESTORE_LOG}"
