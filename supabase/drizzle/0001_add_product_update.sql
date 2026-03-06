-- Add 'Product Update' to audit_action enum
ALTER TYPE "public"."audit_action" ADD VALUE IF NOT EXISTS 'Product Update';
