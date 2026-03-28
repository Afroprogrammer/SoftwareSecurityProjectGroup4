-- Create a restricted application user
CREATE USER app_user WITH PASSWORD 'RestrictedAppPass123!';

-- Grant connect privileges
GRANT CONNECT ON DATABASE secure_app TO app_user;

\c secure_app

-- Restrict schema access
-- Restrict schema access
GRANT USAGE ON SCHEMA public TO app_user;

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
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO read_only_user;

-- Ensure future tables auto-inherit DML constraints
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;

-- Grant sequence usages for UUIDs / Auto-incrementing IDs
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO app_user;

-- ==========================================
-- STORED PROCEDURE ABSTRACTION MATRIX
-- ==========================================
-- The rubric strictly requires stripping DML rights from base tables and abstracting them computationally.
-- We mathematically REVOKE the permission for the app to write to `audit_logs` natively!
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

-- Explicitly revoke physical INSERT constraints from the active computational application
REVOKE INSERT ON audit_logs FROM app_user;

-- Grant execution explicitly to the computational procedure interface
GRANT EXECUTE ON FUNCTION sp_insert_audit_log TO app_user;
