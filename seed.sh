#!/bin/bash

# This script creates seed data by directly inserting into the SQLite database

DB_FILE="./data/tasks.db"

# Create data directory if it doesn't exist
mkdir -p ./data

echo "Creating seed data..."

# Insert organizations
sqlite3 "$DB_FILE" << EOF
INSERT OR IGNORE INTO organizations (id, name, parentId, createdAt, updatedAt)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440000', 'Acme Corp', NULL, datetime('now'), datetime('now')),
  ('550e8400-e29b-41d4-a716-446655440001', 'Acme Engineering', '550e8400-e29b-41d4-a716-446655440000', datetime('now'), datetime('now'));

-- Insert users (password is bcrypt hash of 'password123')
INSERT OR IGNORE INTO users (id, email, password, organizationId, role, createdAt, updatedAt)
VALUES 
  ('650e8400-e29b-41d4-a716-446655440000', 'owner@acme.com', '\$2b\$10\$N9qo8uLOickgx2ZMRZoMye/B6xZ9u8W2f4w7nKJlM1YgBxWlH5u.e', '550e8400-e29b-41d4-a716-446655440000', 'owner', datetime('now'), datetime('now')),
  ('650e8400-e29b-41d4-a716-446655440001', 'admin@acme.com', '\$2b\$10\$N9qo8uLOickgx2ZMRZoMye/B6xZ9u8W2f4w7nKJlM1YgBxWlH5u.e', '550e8400-e29b-41d4-a716-446655440000', 'admin', datetime('now'), datetime('now')),
  ('650e8400-e29b-41d4-a716-446655440002', 'viewer@acme.com', '\$2b\$10\$N9qo8uLOickgx2ZMRZoMye/B6xZ9u8W2f4w7nKJlM1YgBxWlH5u.e', '550e8400-e29b-41d4-a716-446655440000', 'viewer', datetime('now'), datetime('now'));
EOF

echo "✓ Seed data created successfully!"
echo ""
echo "Test credentials:"
echo "  - owner@acme.com (password: password123) - Role: owner"
echo "  - admin@acme.com (password: password123) - Role: admin"
echo "  - viewer@acme.com (password: password123) - Role: viewer"
echo ""
echo "Organization ID: 550e8400-e29b-41d4-a716-446655440000"
