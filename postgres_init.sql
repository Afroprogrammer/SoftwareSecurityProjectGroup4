-- Create a restricted application user
CREATE USER app_user WITH PASSWORD 'RestrictedAppPass123!';

-- Grant connect privileges
GRANT CONNECT ON DATABASE secure_app TO app_user;

\c secure_app

-- Restrict schema access
-- Restrict schema access
GRANT USAGE, CREATE ON SCHEMA public TO app_user;

-- Grant strictly DML operations initially. 
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;

-- Ensure future tables auto-inherit DML constraints
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;

-- ==========================================
-- TRUST DISTINCTION: READ ONLY AUDITING ASSIGNMENT
-- ==========================================
CREATE USER read_only_user WITH PASSWORD 'ReadOnlyPass123!';
GRANT CONNECT ON DATABASE secure_app TO read_only_user;
GRANT USAGE ON SCHEMA public TO read_only_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO read_only_user;

-- When the Python app_user creates new tables (like 'users' or 'feedback'), 
-- guarantee that read_only_user is instantly granted SELECT rights to audit them!
ALTER DEFAULT PRIVILEGES FOR ROLE app_user IN SCHEMA public GRANT SELECT ON TABLES TO read_only_user;

-- Grant sequence usages for UUIDs / Auto-incrementing IDs
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO app_user;

-- ==========================================
-- STORED PROCEDURE ABSTRACTION MATRIX
-- ==========================================
-- Creates the abstraction layer as the superuser (admin). 
-- This allows SECURITY DEFINER to legally insert into tables even when app_user is blocked natively!
CREATE OR REPLACE FUNCTION sp_insert_audit_log(
    p_user_id INTEGER,
    p_action VARCHAR,
    p_ip_address VARCHAR,
    p_details VARCHAR,
    p_previous_hash VARCHAR,
    p_hash VARCHAR
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO audit_logs (user_id, action, ip_address, details, previous_hash, hash)
    VALUES (p_user_id, p_action, p_ip_address, p_details, p_previous_hash, p_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to the application legally
GRANT EXECUTE ON FUNCTION sp_insert_audit_log(INTEGER, VARCHAR, VARCHAR, VARCHAR, VARCHAR, VARCHAR) TO app_user;
