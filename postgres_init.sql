-- Create a restricted application user
CREATE USER app_user WITH PASSWORD 'RestrictedAppPass123!';

-- Grant connect privileges
GRANT CONNECT ON DATABASE secure_app TO app_user;

\c secure_app

-- Restrict schema access
GRANT USAGE ON SCHEMA public TO app_user;

-- Grant strictly DML operations. Banning DDL explicitly!
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;

-- Ensure future tables auto-inherit DML constraints
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;

-- Grant sequence usages for UUIDs / Auto-incrementing IDs
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO app_user;
