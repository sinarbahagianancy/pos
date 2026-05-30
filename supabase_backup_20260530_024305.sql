--
-- PostgreSQL database dump
--

\restrict nD1wMMZOdJPwSwrz1Fg7RBqSQibq9CqHJMgMqzYGKEruU5cKlZMu6WfewWCTA1i

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.9 (Debian 17.9-0+deb13u1)

-- Started on 2026-05-30 02:43:05 WIB

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 21 (class 2615 OID 16494)
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- TOC entry 39 (class 2615 OID 23198)
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA drizzle;


--
-- TOC entry 13 (class 2615 OID 16388)
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA extensions;


--
-- TOC entry 19 (class 2615 OID 16574)
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql;


--
-- TOC entry 18 (class 2615 OID 16563)
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql_public;


--
-- TOC entry 11 (class 2615 OID 16386)
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgbouncer;


--
-- TOC entry 12 (class 2615 OID 16555)
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA realtime;


--
-- TOC entry 22 (class 2615 OID 16542)
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA storage;


--
-- TOC entry 16 (class 2615 OID 16603)
-- Name: vault; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA vault;


--
-- TOC entry 2 (class 3079 OID 16389)
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- TOC entry 4 (class 3079 OID 16443)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- TOC entry 5 (class 3079 OID 16604)
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- TOC entry 3 (class 3079 OID 16432)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- TOC entry 1161 (class 1247 OID 16738)
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


--
-- TOC entry 1185 (class 1247 OID 16879)
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


--
-- TOC entry 1158 (class 1247 OID 16732)
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


--
-- TOC entry 1155 (class 1247 OID 16727)
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


--
-- TOC entry 1203 (class 1247 OID 16982)
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


--
-- TOC entry 1215 (class 1247 OID 17055)
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


--
-- TOC entry 1197 (class 1247 OID 16960)
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


--
-- TOC entry 1206 (class 1247 OID 16992)
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


--
-- TOC entry 1191 (class 1247 OID 16921)
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


--
-- TOC entry 1272 (class 1247 OID 22977)
-- Name: audit_action; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.audit_action AS ENUM (
    'Stock Addition',
    'Sales Deduction',
    'Manual Correction',
    'General',
    'Settings Update',
    'Product Update',
    'Stock Deduction',
    'Sale Created',
    'Login',
    'Logout',
    'Product Deleted',
    'Product Restored',
    'Product Hidden',
    'Customer Created',
    'Customer Updated',
    'Customer Deleted',
    'Supplier Created',
    'Supplier Updated',
    'Supplier Deleted',
    'Staff Created',
    'Staff Updated',
    'Staff Deleted',
    'Warranty Created',
    'Warranty Updated'
);


--
-- TOC entry 1275 (class 1247 OID 22988)
-- Name: claim_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.claim_status AS ENUM (
    'Received',
    'Sent to HQ',
    'Repairing',
    'Ready for Pickup',
    'Completed'
);


--
-- TOC entry 1278 (class 1247 OID 23000)
-- Name: condition_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.condition_type AS ENUM (
    'New',
    'Used'
);


--
-- TOC entry 1281 (class 1247 OID 23006)
-- Name: currency_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.currency_type AS ENUM (
    'IDR',
    'USD'
);


--
-- TOC entry 1284 (class 1247 OID 23012)
-- Name: mount_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.mount_type AS ENUM (
    'E-mount',
    'RF-mount',
    'X-mount',
    'L-mount',
    'Z-mount',
    'M-mount'
);


--
-- TOC entry 1287 (class 1247 OID 23026)
-- Name: payment_method; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_method AS ENUM (
    'Cash',
    'Debit',
    'QRIS',
    'Credit',
    'Utang',
    'Transfer'
);


--
-- TOC entry 1290 (class 1247 OID 23036)
-- Name: product_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.product_category AS ENUM (
    'Body',
    'Lens',
    'Accessory'
);


--
-- TOC entry 1293 (class 1247 OID 23044)
-- Name: sn_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sn_status AS ENUM (
    'In Stock',
    'Sold',
    'Claimed',
    'Damaged'
);


--
-- TOC entry 1296 (class 1247 OID 23052)
-- Name: warranty_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.warranty_type AS ENUM (
    'Official Sony Indonesia',
    'Official Canon Indonesia',
    'Official Fujifilm Indonesia',
    'Distributor',
    'Store Warranty',
    'Toko',
    'No Warranty'
);


--
-- TOC entry 1260 (class 1247 OID 17312)
-- Name: action; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


--
-- TOC entry 1251 (class 1247 OID 17273)
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


--
-- TOC entry 1254 (class 1247 OID 17287)
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


--
-- TOC entry 1266 (class 1247 OID 17354)
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


--
-- TOC entry 1263 (class 1247 OID 17325)
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


--
-- TOC entry 1236 (class 1247 OID 17200)
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: -
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


--
-- TOC entry 438 (class 1255 OID 16540)
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


--
-- TOC entry 497 (class 1255 OID 16709)
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


--
-- TOC entry 409 (class 1255 OID 16539)
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


--
-- TOC entry 421 (class 1255 OID 16538)
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


--
-- TOC entry 435 (class 1255 OID 16547)
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


--
-- TOC entry 488 (class 1255 OID 16568)
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


--
-- TOC entry 403 (class 1255 OID 16549)
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


--
-- TOC entry 504 (class 1255 OID 16559)
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- TOC entry 498 (class 1255 OID 16560)
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- TOC entry 484 (class 1255 OID 16570)
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


--
-- TOC entry 492 (class 1255 OID 51101)
-- Name: graphql(text, text, jsonb, jsonb); Type: FUNCTION; Schema: graphql_public; Owner: -
--

CREATE FUNCTION graphql_public.graphql("operationName" text DEFAULT NULL::text, query text DEFAULT NULL::text, variables jsonb DEFAULT NULL::jsonb, extensions jsonb DEFAULT NULL::jsonb) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;


--
-- TOC entry 440 (class 1255 OID 16387)
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: -
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $_$;


--
-- TOC entry 425 (class 1255 OID 17347)
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_
        -- Filter by action early - only get subscriptions interested in this action
        -- action_filter column can be: '*' (all), 'INSERT', 'UPDATE', or 'DELETE'
        and (subs.action_filter = '*' or subs.action_filter = action::text);

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


--
-- TOC entry 503 (class 1255 OID 17426)
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


--
-- TOC entry 477 (class 1255 OID 17359)
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


--
-- TOC entry 417 (class 1255 OID 17309)
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
declare
  res jsonb;
begin
  if type_::text = 'bytea' then
    return to_jsonb(val);
  end if;
  execute format('select to_jsonb(%L::'|| type_::text || ')', val) into res;
  return res;
end
$$;


--
-- TOC entry 441 (class 1255 OID 17304)
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


--
-- TOC entry 465 (class 1255 OID 17355)
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


--
-- TOC entry 423 (class 1255 OID 44624)
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS TABLE(wal jsonb, is_rls_enabled boolean, subscription_ids uuid[], errors text[], slot_changes_count bigint)
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
  WITH pub AS (
    SELECT
      concat_ws(
        ',',
        CASE WHEN bool_or(pubinsert) THEN 'insert' ELSE NULL END,
        CASE WHEN bool_or(pubupdate) THEN 'update' ELSE NULL END,
        CASE WHEN bool_or(pubdelete) THEN 'delete' ELSE NULL END
      ) AS w2j_actions,
      coalesce(
        string_agg(
          realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
          ','
        ) filter (WHERE ppt.tablename IS NOT NULL AND ppt.tablename NOT LIKE '% %'),
        ''
      ) AS w2j_add_tables
    FROM pg_publication pp
    LEFT JOIN pg_publication_tables ppt ON pp.pubname = ppt.pubname
    WHERE pp.pubname = publication
    GROUP BY pp.pubname
    LIMIT 1
  ),
  -- MATERIALIZED ensures pg_logical_slot_get_changes is called exactly once
  w2j AS MATERIALIZED (
    SELECT x.*, pub.w2j_add_tables
    FROM pub,
         pg_logical_slot_get_changes(
           slot_name, null, max_changes,
           'include-pk', 'true',
           'include-transaction', 'false',
           'include-timestamp', 'true',
           'include-type-oids', 'true',
           'format-version', '2',
           'actions', pub.w2j_actions,
           'add-tables', pub.w2j_add_tables
         ) x
  ),
  -- Count raw slot entries before apply_rls/subscription filter
  slot_count AS (
    SELECT count(*)::bigint AS cnt
    FROM w2j
    WHERE w2j.w2j_add_tables <> ''
  ),
  -- Apply RLS and filter as before
  rls_filtered AS (
    SELECT xyz.wal, xyz.is_rls_enabled, xyz.subscription_ids, xyz.errors
    FROM w2j,
         realtime.apply_rls(
           wal := w2j.data::jsonb,
           max_record_bytes := max_record_bytes
         ) xyz(wal, is_rls_enabled, subscription_ids, errors)
    WHERE w2j.w2j_add_tables <> ''
      AND xyz.subscription_ids[1] IS NOT NULL
  )
  -- Real rows with slot count attached
  SELECT rf.wal, rf.is_rls_enabled, rf.subscription_ids, rf.errors, sc.cnt
  FROM rls_filtered rf, slot_count sc

  UNION ALL

  -- Sentinel row: always returned when no real rows exist so Elixir can
  -- always read slot_changes_count. Identified by wal IS NULL.
  SELECT null, null, null, null, sc.cnt
  FROM slot_count sc
  WHERE NOT EXISTS (SELECT 1 FROM rls_filtered)
$$;


--
-- TOC entry 482 (class 1255 OID 17303)
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


--
-- TOC entry 476 (class 1255 OID 17425)
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    -- Generate a new UUID for the id
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


--
-- TOC entry 455 (class 1255 OID 17301)
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


--
-- TOC entry 450 (class 1255 OID 17336)
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


--
-- TOC entry 456 (class 1255 OID 17419)
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


--
-- TOC entry 416 (class 1255 OID 44626)
-- Name: allow_any_operation(text[]); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.allow_any_operation(expected_operations text[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT CASE
      WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
      ELSE raw_operation
    END AS current_operation
    FROM current_operation
  )
  SELECT EXISTS (
    SELECT 1
    FROM normalized n
    CROSS JOIN LATERAL unnest(expected_operations) AS expected_operation
    WHERE expected_operation IS NOT NULL
      AND expected_operation <> ''
      AND n.current_operation = CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END
  );
$$;


--
-- TOC entry 474 (class 1255 OID 44625)
-- Name: allow_only_operation(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.allow_only_operation(expected_operation text) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT
      CASE
        WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
        ELSE raw_operation
      END AS current_operation,
      CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END AS requested_operation
    FROM current_operation
  )
  SELECT CASE
    WHEN requested_operation IS NULL OR requested_operation = '' THEN FALSE
    ELSE COALESCE(current_operation = requested_operation, FALSE)
  END
  FROM normalized;
$$;


--
-- TOC entry 469 (class 1255 OID 17141)
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


--
-- TOC entry 500 (class 1255 OID 17197)
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


--
-- TOC entry 402 (class 1255 OID 17116)
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Get the last path segment (the actual filename)
    SELECT _parts[array_length(_parts, 1)] INTO _filename;
    -- Extract extension: reverse, split on '.', then reverse again
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


--
-- TOC entry 462 (class 1255 OID 17115)
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


--
-- TOC entry 481 (class 1255 OID 17114)
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


--
-- TOC entry 448 (class 1255 OID 17254)
-- Name: get_common_prefix(text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT CASE
    WHEN position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(p_key, length(p_prefix) + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)))
    ELSE NULL
END;
$$;


--
-- TOC entry 419 (class 1255 OID 17128)
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint)::bigint as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


--
-- TOC entry 424 (class 1255 OID 17180)
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


--
-- TOC entry 443 (class 1255 OID 17255)
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;

    -- Configuration
    v_is_asc BOOLEAN;
    v_prefix TEXT;
    v_start TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix, 1) = delimiter_param THEN
        v_upper_bound := left(v_prefix, -1) || chr(ascii(delimiter_param) + 1);
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'AND o.name COLLATE "C" < $3 ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" >= $2 ' ||
                'ORDER BY o.name COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'AND o.name COLLATE "C" >= $3 ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND o.name COLLATE "C" < $2 ' ||
                'ORDER BY o.name COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor: find the last item in range
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_next_seek FROM storage.objects o
                WHERE o.bucket_id = _bucket_id
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Cursor provided: determine if it refers to a folder or leaf
        IF EXISTS (
            SELECT 1 FROM storage.objects o
            WHERE o.bucket_id = _bucket_id
              AND o.name COLLATE "C" LIKE v_start || delimiter_param || '%'
            LIMIT 1
        ) THEN
            -- Cursor refers to a folder
            IF v_is_asc THEN
                v_next_seek := v_start || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_start || delimiter_param;
            END IF;
        ELSE
            -- Cursor refers to a leaf object
            IF v_is_asc THEN
                v_next_seek := v_start || delimiter_param;
            ELSE
                v_next_seek := v_start;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= max_keys;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek AND o.name COLLATE "C" < v_upper_bound
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" >= v_next_seek
                ORDER BY o.name COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                ORDER BY o.name COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := rtrim(v_common_prefix, delimiter_param);
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1) || chr(ascii(delimiter_param) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := v_current.name;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                RETURN NEXT;
                v_count := v_count + 1;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := v_current.name || delimiter_param;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


--
-- TOC entry 451 (class 1255 OID 17196)
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


--
-- TOC entry 408 (class 1255 OID 17261)
-- Name: protect_delete(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.protect_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$$;


--
-- TOC entry 467 (class 1255 OID 17130)
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;
    v_delimiter CONSTANT TEXT := '/';

    -- Configuration
    v_limit INT;
    v_prefix TEXT;
    v_prefix_lower TEXT;
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_count INT := 0;
    v_skipped INT := 0;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);

    -- Validate sort column
    CASE lower(coalesce(sortcolumn, 'name'))
        WHEN 'name' THEN v_order_by := 'name';
        WHEN 'updated_at' THEN v_order_by := 'updated_at';
        WHEN 'created_at' THEN v_order_by := 'created_at';
        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';
        ELSE v_order_by := 'name';
    END CASE;

    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;

    -- ========================================================================
    -- NON-NAME SORTING: Use path_tokens approach (unchanged)
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT path_tokens[$1] AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $2 || '%%'
                  AND bucket_id = $3
                  AND array_length(objects.path_tokens, 1) <> $1
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata FROM folders)
            UNION ALL
            (SELECT path_tokens[$1] AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata
             FROM storage.objects
             WHERE objects.name ILIKE $2 || '%%'
               AND bucket_id = $3
               AND array_length(objects.path_tokens, 1) = $1
             ORDER BY %I %s)
            LIMIT $4 OFFSET $5
            $sql$, v_sort_order, v_order_by, v_sort_order
        ) USING levels, v_prefix, bucketname, v_limit, offsets;
        RETURN;
    END IF;

    -- ========================================================================
    -- NAME SORTING: Hybrid skip-scan with batch optimization
    -- ========================================================================

    -- Calculate upper bound for prefix filtering
    IF v_prefix_lower = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);
    ELSE
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'AND lower(o.name) COLLATE "C" < $3 ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" >= $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'AND lower(o.name) COLLATE "C" >= $3 ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata ' ||
                'FROM storage.objects o WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 ' ||
                'ORDER BY lower(o.name) COLLATE "C" DESC LIMIT $4';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC: find the last item in range first (static SQL)
        IF v_upper_bound IS NOT NULL THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower AND lower(o.name) COLLATE "C" < v_upper_bound
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSIF v_prefix_lower <> '' THEN
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_prefix_lower
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        ELSE
            SELECT o.name INTO v_peek_name FROM storage.objects o
            WHERE o.bucket_id = bucketname
            ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
        END IF;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        IF v_is_asc THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSE
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSIF v_prefix_lower <> '' THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := split_part(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter), v_delimiter, levels);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it
                    v_next_seek := lower(v_current.name);
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := split_part(v_current.name, v_delimiter, levels);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Advance seek past this file
                IF v_is_asc THEN
                    v_next_seek := lower(v_current.name) || v_delimiter;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;
    END LOOP;
END;
$_$;


--
-- TOC entry 447 (class 1255 OID 17259)
-- Name: search_by_timestamp(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
BEGIN
    v_prefix := coalesce(p_prefix, '');

    IF p_sort_order = 'asc' THEN
        v_cursor_op := '>';
    ELSE
        v_cursor_op := '<';
    END IF;

    v_query := format($sql$
        WITH raw_objects AS (
            SELECT
                o.name AS obj_name,
                o.id AS obj_id,
                o.updated_at AS obj_updated_at,
                o.created_at AS obj_created_at,
                o.last_accessed_at AS obj_last_accessed_at,
                o.metadata AS obj_metadata,
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $1 || '%%'
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                rtrim(common_prefix, '/') AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
                TRUE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NOT NULL
            GROUP BY common_prefix
        ),
        leaf_objects AS (
            SELECT
                obj_name AS name,
                obj_id AS id,
                obj_updated_at AS updated_at,
                obj_created_at AS created_at,
                obj_last_accessed_at AS last_accessed_at,
                obj_metadata AS metadata,
                FALSE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NULL
        ),
        combined AS (
            SELECT * FROM aggregated_prefixes
            UNION ALL
            SELECT * FROM leaf_objects
        ),
        filtered AS (
            SELECT *
            FROM combined
            WHERE (
                $5 = ''
                OR ROW(
                    date_trunc('milliseconds', %I),
                    name COLLATE "C"
                ) %s ROW(
                    COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz),
                    $5
                )
            )
        )
        SELECT
            split_part(name, '/', $3) AS key,
            name,
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s
        LIMIT $4
    $sql$,
        p_sort_column,
        v_cursor_op,
        p_sort_column,
        p_sort_order,
        p_sort_order
    );

    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after;
END;
$_$;


--
-- TOC entry 452 (class 1255 OID 17258)
-- Name: search_v2(text, text, integer, integer, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_sort_col text;
    v_sort_ord text;
    v_limit int;
BEGIN
    -- Cap limit to maximum of 1500 records
    v_limit := LEAST(coalesce(limits, 100), 1500);

    -- Validate and normalize sort_order
    v_sort_ord := lower(coalesce(sort_order, 'asc'));
    IF v_sort_ord NOT IN ('asc', 'desc') THEN
        v_sort_ord := 'asc';
    END IF;

    -- Validate and normalize sort_column
    v_sort_col := lower(coalesce(sort_column, 'name'));
    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN
        v_sort_col := 'name';
    END IF;

    -- Route to appropriate implementation
    IF v_sort_col = 'name' THEN
        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))
        RETURN QUERY
        SELECT
            split_part(l.name, '/', levels) AS key,
            l.name AS name,
            l.id,
            l.updated_at,
            l.created_at,
            l.last_accessed_at,
            l.metadata
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            start_after,
            '',
            v_sort_ord
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after
        );
    END IF;
END;
$$;


--
-- TOC entry 457 (class 1255 OID 17131)
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 352 (class 1259 OID 16525)
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


--
-- TOC entry 397 (class 1259 OID 26526)
-- Name: custom_oauth_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.custom_oauth_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_type text NOT NULL,
    identifier text NOT NULL,
    name text NOT NULL,
    client_id text NOT NULL,
    client_secret text NOT NULL,
    acceptable_client_ids text[] DEFAULT '{}'::text[] NOT NULL,
    scopes text[] DEFAULT '{}'::text[] NOT NULL,
    pkce_enabled boolean DEFAULT true NOT NULL,
    attribute_mapping jsonb DEFAULT '{}'::jsonb NOT NULL,
    authorization_params jsonb DEFAULT '{}'::jsonb NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    email_optional boolean DEFAULT false NOT NULL,
    issuer text,
    discovery_url text,
    skip_nonce_check boolean DEFAULT false NOT NULL,
    cached_discovery jsonb,
    discovery_cached_at timestamp with time zone,
    authorization_url text,
    token_url text,
    userinfo_url text,
    jwks_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT custom_oauth_providers_authorization_url_https CHECK (((authorization_url IS NULL) OR (authorization_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_authorization_url_length CHECK (((authorization_url IS NULL) OR (char_length(authorization_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_client_id_length CHECK (((char_length(client_id) >= 1) AND (char_length(client_id) <= 512))),
    CONSTRAINT custom_oauth_providers_discovery_url_length CHECK (((discovery_url IS NULL) OR (char_length(discovery_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_identifier_format CHECK ((identifier ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::text)),
    CONSTRAINT custom_oauth_providers_issuer_length CHECK (((issuer IS NULL) OR ((char_length(issuer) >= 1) AND (char_length(issuer) <= 2048)))),
    CONSTRAINT custom_oauth_providers_jwks_uri_https CHECK (((jwks_uri IS NULL) OR (jwks_uri ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_jwks_uri_length CHECK (((jwks_uri IS NULL) OR (char_length(jwks_uri) <= 2048))),
    CONSTRAINT custom_oauth_providers_name_length CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100))),
    CONSTRAINT custom_oauth_providers_oauth2_requires_endpoints CHECK (((provider_type <> 'oauth2'::text) OR ((authorization_url IS NOT NULL) AND (token_url IS NOT NULL) AND (userinfo_url IS NOT NULL)))),
    CONSTRAINT custom_oauth_providers_oidc_discovery_url_https CHECK (((provider_type <> 'oidc'::text) OR (discovery_url IS NULL) OR (discovery_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_issuer_https CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NULL) OR (issuer ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_requires_issuer CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NOT NULL))),
    CONSTRAINT custom_oauth_providers_provider_type_check CHECK ((provider_type = ANY (ARRAY['oauth2'::text, 'oidc'::text]))),
    CONSTRAINT custom_oauth_providers_token_url_https CHECK (((token_url IS NULL) OR (token_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_token_url_length CHECK (((token_url IS NULL) OR (char_length(token_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_userinfo_url_https CHECK (((userinfo_url IS NULL) OR (userinfo_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_userinfo_url_length CHECK (((userinfo_url IS NULL) OR (char_length(userinfo_url) <= 2048)))
);


--
-- TOC entry 365 (class 1259 OID 16883)
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text,
    code_challenge_method auth.code_challenge_method,
    code_challenge text,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone,
    invite_token text,
    referrer text,
    oauth_client_state_id uuid,
    linking_target_id uuid,
    email_optional boolean DEFAULT false NOT NULL
);


--
-- TOC entry 356 (class 1259 OID 16681)
-- Name: identities; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- TOC entry 351 (class 1259 OID 16518)
-- Name: instances; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- TOC entry 360 (class 1259 OID 16770)
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


--
-- TOC entry 359 (class 1259 OID 16758)
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


--
-- TOC entry 358 (class 1259 OID 16745)
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


--
-- TOC entry 368 (class 1259 OID 16995)
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    nonce text,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


--
-- TOC entry 370 (class 1259 OID 17068)
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


--
-- TOC entry 367 (class 1259 OID 16965)
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    token_endpoint_auth_method text NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048)),
    CONSTRAINT oauth_clients_token_endpoint_auth_method_check CHECK ((token_endpoint_auth_method = ANY (ARRAY['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text])))
);


--
-- TOC entry 369 (class 1259 OID 17028)
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


--
-- TOC entry 366 (class 1259 OID 16933)
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


--
-- TOC entry 350 (class 1259 OID 16507)
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


--
-- TOC entry 349 (class 1259 OID 16506)
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: -
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4369 (class 0 OID 0)
-- Dependencies: 349
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: -
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- TOC entry 363 (class 1259 OID 16812)
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


--
-- TOC entry 364 (class 1259 OID 16830)
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


--
-- TOC entry 353 (class 1259 OID 16533)
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- TOC entry 357 (class 1259 OID 16711)
-- Name: sessions; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    CONSTRAINT sessions_scopes_length CHECK ((char_length(scopes) <= 4096))
);


--
-- TOC entry 362 (class 1259 OID 16797)
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


--
-- TOC entry 361 (class 1259 OID 16788)
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


--
-- TOC entry 348 (class 1259 OID 16495)
-- Name: users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


--
-- TOC entry 400 (class 1259 OID 36827)
-- Name: webauthn_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.webauthn_challenges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    challenge_type text NOT NULL,
    session_data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    CONSTRAINT webauthn_challenges_challenge_type_check CHECK ((challenge_type = ANY (ARRAY['signup'::text, 'registration'::text, 'authentication'::text])))
);


--
-- TOC entry 399 (class 1259 OID 36804)
-- Name: webauthn_credentials; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.webauthn_credentials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    credential_id bytea NOT NULL,
    public_key bytea NOT NULL,
    attestation_type text DEFAULT ''::text NOT NULL,
    aaguid uuid,
    sign_count bigint DEFAULT 0 NOT NULL,
    transports jsonb DEFAULT '[]'::jsonb NOT NULL,
    backup_eligible boolean DEFAULT false NOT NULL,
    backed_up boolean DEFAULT false NOT NULL,
    friendly_name text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone
);


--
-- TOC entry 396 (class 1259 OID 23200)
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: -
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


--
-- TOC entry 395 (class 1259 OID 23199)
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: -
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4370 (class 0 OID 0)
-- Dependencies: 395
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: -
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- TOC entry 386 (class 1259 OID 23063)
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    staff_name text NOT NULL,
    action public.audit_action NOT NULL,
    details text NOT NULL,
    related_id text,
    "timestamp" timestamp with time zone DEFAULT now()
);


--
-- TOC entry 387 (class 1259 OID 23071)
-- Name: customers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customers (
    id text NOT NULL,
    name text NOT NULL,
    phone text,
    email text,
    address text,
    npwp text,
    loyalty_points integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    deleted boolean DEFAULT false
);


--
-- TOC entry 401 (class 1259 OID 51058)
-- Name: migrations_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.migrations_log (
    key text NOT NULL,
    ran_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 388 (class 1259 OID 23081)
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id text NOT NULL,
    brand text NOT NULL,
    model text NOT NULL,
    category public.product_category NOT NULL,
    mount public.mount_type,
    condition public.condition_type NOT NULL,
    price numeric(15,2) NOT NULL,
    cogs numeric(15,2) NOT NULL,
    warranty_months integer DEFAULT 12 NOT NULL,
    warranty_type public.warranty_type NOT NULL,
    stock integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    hidden integer DEFAULT 0,
    deleted boolean DEFAULT false,
    has_serial_number boolean DEFAULT false,
    supplier text,
    date_restocked timestamp without time zone,
    tax_enabled boolean DEFAULT true,
    notes text,
    invoice_number text
);


--
-- TOC entry 389 (class 1259 OID 23092)
-- Name: sale_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sale_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sale_id text NOT NULL,
    product_id text NOT NULL,
    model text NOT NULL,
    sn text NOT NULL,
    price numeric(15,2) NOT NULL,
    cogs numeric(15,2) NOT NULL,
    warranty_expiry timestamp without time zone NOT NULL,
    brand text
);


--
-- TOC entry 390 (class 1259 OID 23100)
-- Name: sales; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales (
    id text NOT NULL,
    customer_id text NOT NULL,
    customer_name text NOT NULL,
    subtotal numeric(15,2) NOT NULL,
    tax numeric(15,2) NOT NULL,
    total numeric(15,2) NOT NULL,
    payment_method public.payment_method NOT NULL,
    staff_name text NOT NULL,
    "timestamp" timestamp with time zone DEFAULT now(),
    tax_enabled boolean DEFAULT true,
    notes text,
    due_date timestamp with time zone,
    is_paid boolean DEFAULT false,
    paid_at timestamp with time zone,
    amount_paid numeric(15,2) DEFAULT 0,
    installments text DEFAULT '[]'::text,
    invoice_number text
);


--
-- TOC entry 391 (class 1259 OID 23108)
-- Name: serial_numbers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.serial_numbers (
    sn text NOT NULL,
    product_id text NOT NULL,
    status public.sn_status DEFAULT 'In Stock'::public.sn_status NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- TOC entry 392 (class 1259 OID 23117)
-- Name: staff_members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staff_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    role text DEFAULT 'Staff'::text,
    auth_user_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    password_hash text
);


--
-- TOC entry 393 (class 1259 OID 23130)
-- Name: store_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store_config (
    id integer DEFAULT 1 NOT NULL,
    store_name text NOT NULL,
    address text NOT NULL,
    ppn_rate numeric(5,2) DEFAULT 11.00 NOT NULL,
    currency public.currency_type DEFAULT 'IDR'::public.currency_type NOT NULL,
    updated_at timestamp with time zone DEFAULT now(),
    monthly_target numeric(15,0) DEFAULT 500000000
);


--
-- TOC entry 398 (class 1259 OID 34520)
-- Name: suppliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suppliers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    phone text,
    address text,
    deleted boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);


--
-- TOC entry 394 (class 1259 OID 23141)
-- Name: warranty_claims; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.warranty_claims (
    id text NOT NULL,
    sn text NOT NULL,
    product_model text NOT NULL,
    customer_name text NOT NULL,
    customer_phone text,
    issue text NOT NULL,
    status public.claim_status DEFAULT 'Received'::public.claim_status NOT NULL,
    received_date timestamp with time zone DEFAULT now(),
    last_updated timestamp with time zone DEFAULT now(),
    created_at timestamp with time zone DEFAULT now()
);


--
-- TOC entry 385 (class 1259 OID 17429)
-- Name: messages; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);


--
-- TOC entry 379 (class 1259 OID 17267)
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


--
-- TOC entry 382 (class 1259 OID 17289)
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    action_filter text DEFAULT '*'::text,
    CONSTRAINT subscription_action_filter_check CHECK ((action_filter = ANY (ARRAY['*'::text, 'INSERT'::text, 'UPDATE'::text, 'DELETE'::text])))
);


--
-- TOC entry 381 (class 1259 OID 17288)
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: -
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 372 (class 1259 OID 17086)
-- Name: buckets; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


--
-- TOC entry 376 (class 1259 OID 17206)
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- TOC entry 377 (class 1259 OID 17219)
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 371 (class 1259 OID 17078)
-- Name: migrations; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 373 (class 1259 OID 17096)
-- Name: objects; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb
);


--
-- TOC entry 374 (class 1259 OID 17145)
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb,
    metadata jsonb
);


--
-- TOC entry 375 (class 1259 OID 17159)
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 378 (class 1259 OID 17229)
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- TOC entry 3744 (class 2604 OID 16510)
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- TOC entry 3833 (class 2604 OID 23203)
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: -
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- TOC entry 4320 (class 0 OID 16525)
-- Dependencies: 352
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- TOC entry 4359 (class 0 OID 26526)
-- Dependencies: 397
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- TOC entry 4331 (class 0 OID 16883)
-- Dependencies: 365
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- TOC entry 4322 (class 0 OID 16681)
-- Dependencies: 356
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- TOC entry 4319 (class 0 OID 16518)
-- Dependencies: 351
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- TOC entry 4326 (class 0 OID 16770)
-- Dependencies: 360
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- TOC entry 4325 (class 0 OID 16758)
-- Dependencies: 359
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- TOC entry 4324 (class 0 OID 16745)
-- Dependencies: 358
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- TOC entry 4334 (class 0 OID 16995)
-- Dependencies: 368
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- TOC entry 4336 (class 0 OID 17068)
-- Dependencies: 370
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- TOC entry 4333 (class 0 OID 16965)
-- Dependencies: 367
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- TOC entry 4335 (class 0 OID 17028)
-- Dependencies: 369
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- TOC entry 4332 (class 0 OID 16933)
-- Dependencies: 366
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- TOC entry 4318 (class 0 OID 16507)
-- Dependencies: 350
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- TOC entry 4329 (class 0 OID 16812)
-- Dependencies: 363
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- TOC entry 4330 (class 0 OID 16830)
-- Dependencies: 364
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- TOC entry 4321 (class 0 OID 16533)
-- Dependencies: 353
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: -
--

INSERT INTO auth.schema_migrations VALUES ('20171026211738');
INSERT INTO auth.schema_migrations VALUES ('20171026211808');
INSERT INTO auth.schema_migrations VALUES ('20171026211834');
INSERT INTO auth.schema_migrations VALUES ('20180103212743');
INSERT INTO auth.schema_migrations VALUES ('20180108183307');
INSERT INTO auth.schema_migrations VALUES ('20180119214651');
INSERT INTO auth.schema_migrations VALUES ('20180125194653');
INSERT INTO auth.schema_migrations VALUES ('00');
INSERT INTO auth.schema_migrations VALUES ('20210710035447');
INSERT INTO auth.schema_migrations VALUES ('20210722035447');
INSERT INTO auth.schema_migrations VALUES ('20210730183235');
INSERT INTO auth.schema_migrations VALUES ('20210909172000');
INSERT INTO auth.schema_migrations VALUES ('20210927181326');
INSERT INTO auth.schema_migrations VALUES ('20211122151130');
INSERT INTO auth.schema_migrations VALUES ('20211124214934');
INSERT INTO auth.schema_migrations VALUES ('20211202183645');
INSERT INTO auth.schema_migrations VALUES ('20220114185221');
INSERT INTO auth.schema_migrations VALUES ('20220114185340');
INSERT INTO auth.schema_migrations VALUES ('20220224000811');
INSERT INTO auth.schema_migrations VALUES ('20220323170000');
INSERT INTO auth.schema_migrations VALUES ('20220429102000');
INSERT INTO auth.schema_migrations VALUES ('20220531120530');
INSERT INTO auth.schema_migrations VALUES ('20220614074223');
INSERT INTO auth.schema_migrations VALUES ('20220811173540');
INSERT INTO auth.schema_migrations VALUES ('20221003041349');
INSERT INTO auth.schema_migrations VALUES ('20221003041400');
INSERT INTO auth.schema_migrations VALUES ('20221011041400');
INSERT INTO auth.schema_migrations VALUES ('20221020193600');
INSERT INTO auth.schema_migrations VALUES ('20221021073300');
INSERT INTO auth.schema_migrations VALUES ('20221021082433');
INSERT INTO auth.schema_migrations VALUES ('20221027105023');
INSERT INTO auth.schema_migrations VALUES ('20221114143122');
INSERT INTO auth.schema_migrations VALUES ('20221114143410');
INSERT INTO auth.schema_migrations VALUES ('20221125140132');
INSERT INTO auth.schema_migrations VALUES ('20221208132122');
INSERT INTO auth.schema_migrations VALUES ('20221215195500');
INSERT INTO auth.schema_migrations VALUES ('20221215195800');
INSERT INTO auth.schema_migrations VALUES ('20221215195900');
INSERT INTO auth.schema_migrations VALUES ('20230116124310');
INSERT INTO auth.schema_migrations VALUES ('20230116124412');
INSERT INTO auth.schema_migrations VALUES ('20230131181311');
INSERT INTO auth.schema_migrations VALUES ('20230322519590');
INSERT INTO auth.schema_migrations VALUES ('20230402418590');
INSERT INTO auth.schema_migrations VALUES ('20230411005111');
INSERT INTO auth.schema_migrations VALUES ('20230508135423');
INSERT INTO auth.schema_migrations VALUES ('20230523124323');
INSERT INTO auth.schema_migrations VALUES ('20230818113222');
INSERT INTO auth.schema_migrations VALUES ('20230914180801');
INSERT INTO auth.schema_migrations VALUES ('20231027141322');
INSERT INTO auth.schema_migrations VALUES ('20231114161723');
INSERT INTO auth.schema_migrations VALUES ('20231117164230');
INSERT INTO auth.schema_migrations VALUES ('20240115144230');
INSERT INTO auth.schema_migrations VALUES ('20240214120130');
INSERT INTO auth.schema_migrations VALUES ('20240306115329');
INSERT INTO auth.schema_migrations VALUES ('20240314092811');
INSERT INTO auth.schema_migrations VALUES ('20240427152123');
INSERT INTO auth.schema_migrations VALUES ('20240612123726');
INSERT INTO auth.schema_migrations VALUES ('20240729123726');
INSERT INTO auth.schema_migrations VALUES ('20240802193726');
INSERT INTO auth.schema_migrations VALUES ('20240806073726');
INSERT INTO auth.schema_migrations VALUES ('20241009103726');
INSERT INTO auth.schema_migrations VALUES ('20250717082212');
INSERT INTO auth.schema_migrations VALUES ('20250731150234');
INSERT INTO auth.schema_migrations VALUES ('20250804100000');
INSERT INTO auth.schema_migrations VALUES ('20250901200500');
INSERT INTO auth.schema_migrations VALUES ('20250903112500');
INSERT INTO auth.schema_migrations VALUES ('20250904133000');
INSERT INTO auth.schema_migrations VALUES ('20250925093508');
INSERT INTO auth.schema_migrations VALUES ('20251007112900');
INSERT INTO auth.schema_migrations VALUES ('20251104100000');
INSERT INTO auth.schema_migrations VALUES ('20251111201300');
INSERT INTO auth.schema_migrations VALUES ('20251201000000');
INSERT INTO auth.schema_migrations VALUES ('20260115000000');
INSERT INTO auth.schema_migrations VALUES ('20260121000000');
INSERT INTO auth.schema_migrations VALUES ('20260219120000');
INSERT INTO auth.schema_migrations VALUES ('20260302000000');


--
-- TOC entry 4323 (class 0 OID 16711)
-- Dependencies: 357
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- TOC entry 4328 (class 0 OID 16797)
-- Dependencies: 362
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- TOC entry 4327 (class 0 OID 16788)
-- Dependencies: 361
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- TOC entry 4316 (class 0 OID 16495)
-- Dependencies: 348
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- TOC entry 4362 (class 0 OID 36827)
-- Dependencies: 400
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- TOC entry 4361 (class 0 OID 36804)
-- Dependencies: 399
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: -
--



--
-- TOC entry 4358 (class 0 OID 23200)
-- Dependencies: 396
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: -
--



--
-- TOC entry 4348 (class 0 OID 23063)
-- Dependencies: 386
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.audit_logs VALUES ('LOG-1774620525959-907', 'System', 'Stock Addition', 'Created product Test Test with 1 units from supplier PT. DATACRIP', 'BRC-1774620525678', '2026-03-27 14:08:45.598761+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774621508998-631', 'Budi', 'Stock Addition', 'Created product Test Test 2 with 3 units from supplier PT. DATACRIP', 'BRC-1774621508778', '2026-03-27 14:25:08.952215+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774621534685-943', 'Budi', 'Manual Correction', 'Manual adjust Test Test 2: 3 -> 1. Reason: Penyesuaian Stok', 'BRC-1774621508778', '2026-03-27 14:25:34.339533+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774627143823-488', 'Budi', 'Stock Addition', 'Manual adjust Test Test 2: 1 -> 4. Reason: Penyesuaian Stok', 'BRC-1774621508778', '2026-03-27 15:59:03.781052+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774627152680-327', 'Budi', 'Product Update', 'Updated Test Test 2: model: Test 2 -> Test 123, price: 20000.00 -> 20000, cogs: 0.00 -> 0', 'BRC-1774621508778', '2026-03-27 15:59:12.635828+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774627204911-t41q1z', 'Budi', 'Sales Deduction', 'Sold 1 unit of Test 123 (tanpa SN) to Andy', 'BRC-1774621508778', '2026-03-27 16:00:04.859973+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774627205218-q9j33i', 'Budi', 'Sale Created', 'Sale INV-1774627204156 - 1 item(s), Total: 20000, Customer: Andy', 'INV-1774627204156', '2026-03-27 16:00:05.167425+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774629244615-wmo34p', 'Nancy', 'Sales Deduction', 'Sold 1 unit of Test 123 (tanpa SN) to Andy', 'BRC-1774621508778', '2026-03-27 16:34:04.582466+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774629244891-fcryn3', 'Nancy', 'Sale Created', 'Sale INV-1774629243501 - 1 item(s), Total: 22200, Customer: Andy', 'INV-1774629243501', '2026-03-27 16:34:04.842438+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774632135197-zmjqp8', 'Nancy', 'General', 'Marked sale INV-1774629243501 as paid. Loyalty points awarded: 22', 'INV-1774629243501', '2026-03-27 17:22:15.151084+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774635185698-780', 'Nancy', 'Stock Addition', 'Created product Tes 234 with 8 units from supplier PT. DENKA PRATAMA INDONESIA', 'BRC-1774635185353', '2026-03-27 18:13:05.640934+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774636777147-r4qgtv', 'Nancy', 'Sales Deduction', 'Sold 1 unit of 234 (tanpa SN) to Andy', 'BRC-1774635185353', '2026-03-27 18:39:37.088533+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774636777814-60630h', 'Nancy', 'Sales Deduction', 'Sold 1 unit of Test 123 (tanpa SN) to Andy', 'BRC-1774621508778', '2026-03-27 18:39:37.75722+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774636778030-9qt44g', 'Nancy', 'Sale Created', 'Sale INV-1774636776483 - 2 item(s), Total: 72150, Customer: Andy', 'INV-1774636776483', '2026-03-27 18:39:37.971572+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774637254258-kadit6', 'Nancy', 'Sales Deduction', 'Sold 1 unit of 234 (tanpa SN) to Andy', 'BRC-1774635185353', '2026-03-27 18:47:34.203896+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774637254484-gn1b5m', 'Nancy', 'Sale Created', 'Sale INV-1774637253482 - 1 item(s), Total: 49950, Customer: Andy', 'INV-1774637253482', '2026-03-27 18:47:34.429251+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774666485169-764', 'Nancy', 'Product Update', 'Updated Tes 234: price: 45000.00 -> 45000, cogs: 0.00 -> 0', 'BRC-1774635185353', '2026-03-28 02:54:45.123784+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774666499704-615', 'Nancy', 'Product Update', 'Updated Tes 234: price: 45000.00 -> 45000, cogs: 0.00 -> 0', 'BRC-1774635185353', '2026-03-28 02:54:59.650031+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774666736702-844', 'Nancy', 'Product Update', 'Updated Tes 234: price: 45000.00 -> 45000, cogs: 0.00 -> 0', 'BRC-1774635185353', '2026-03-28 02:58:56.648792+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774666746863-9', 'Nancy', 'Product Update', 'Updated Tes 234: model: 234 -> 2345, price: 45000.00 -> 45000, cogs: 0.00 -> 0', 'BRC-1774635185353', '2026-03-28 02:59:06.809453+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774666870102-621', 'Nancy', 'Product Update', 'Updated Tes 2345: price: 45000.00 -> 45000, cogs: 0.00 -> 0', 'BRC-1774635185353', '2026-03-28 03:01:10.049187+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774667010573-460', 'Nancy', 'Product Update', 'Updated Tes 2345: price: 45000.00 -> 45000, cogs: 0.00 -> 0', 'BRC-1774635185353', '2026-03-28 03:03:30.518324+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774667858289-4y6kxu', 'Nancy', 'Sales Deduction', 'Sold 1 unit of 2345 (tanpa SN) to ANIS CHA', 'BRC-1774635185353', '2026-03-28 03:17:38.371199+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774667858660-5j3z25', 'Nancy', 'Sale Created', 'Sale INV-1774667856873 - 1 item(s), Total: 49950, Customer: ANIS CHA', 'INV-1774667856873', '2026-03-28 03:17:38.740417+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774667911953-ef4mqx', 'Nancy', 'General', 'Marked sale INV-1774667856873 as paid. Loyalty points awarded: 49', 'INV-1774667856873', '2026-03-28 03:18:32.033313+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774668022156-673', 'Nancy', 'Product Update', 'Updated Tes 2345: price: 45000.00 -> 45000, cogs: 0.00 -> 0', 'BRC-1774635185353', '2026-03-28 03:20:22.108033+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774668142955-193', 'Nancy', 'Product Update', 'Updated Tes 2345: price: 45000.00 -> 45000, cogs: 0.00 -> 0', 'BRC-1774635185353', '2026-03-28 03:22:22.899073+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774668694201-n5i9nj', 'Nancy', 'Sales Deduction', 'Sold 1 unit of 2345 (tanpa SN) to Andy', 'BRC-1774635185353', '2026-03-28 03:31:34.151339+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774668694446-9h358c', 'Nancy', 'Sale Created', 'Sale INV-1774668693466 - 1 item(s), Total: 45000, Customer: Andy', 'INV-1774668693466', '2026-03-28 03:31:34.394715+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774668823701-308', 'Nancy', 'Product Update', 'Updated Tes 2345: price: 45000.00 -> 45000, cogs: 0.00 -> 0', 'BRC-1774635185353', '2026-03-28 03:33:43.649594+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774669068520-677', 'Nancy', 'Product Update', 'Updated Tes 2345: price: 45000.00 -> 45000, cogs: 0.00 -> 0, taxEnabled: true -> false', 'BRC-1774635185353', '2026-03-28 03:37:48.469051+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774669102287-673', 'Nancy', 'Stock Addition', 'Created product Tes 9873 with 1 units from supplier PT. FUJIFILM INDONESIA', 'BRC-1774669102013', '2026-03-28 03:38:22.238768+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774669113296-356', 'Nancy', 'Product Update', 'Updated Tes 9873: price: 20000.00 -> 20000, cogs: 0.00 -> 0, taxEnabled: true -> false', 'BRC-1774669102013', '2026-03-28 03:38:33.245808+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774669119565-752', 'Nancy', 'Product Update', 'Updated Tes 9873: price: 20000.00 -> 20000, cogs: 0.00 -> 0, taxEnabled: false -> true', 'BRC-1774669102013', '2026-03-28 03:38:39.511213+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774669125379-91', 'Nancy', 'Product Update', 'Updated Tes 9873: price: 20000.00 -> 20000, cogs: 0.00 -> 0', 'BRC-1774669102013', '2026-03-28 03:38:45.327116+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774669952359-332', 'Nancy', 'Product Update', 'Updated Tes 9873: price: 20000.00 -> 20000, cogs: 0.00 -> 0, taxEnabled: true -> false', 'BRC-1774669102013', '2026-03-28 03:52:32.30388+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774669960957-734', 'Nancy', 'Product Update', 'Updated Tes 9873: price: 20000.00 -> 20000, cogs: 0.00 -> 0, taxEnabled: false -> true', 'BRC-1774669102013', '2026-03-28 03:52:40.897163+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774669961551-kogv4t', 'Nancy', 'Sales Deduction', 'Sold 1 unit of ACTION CAM (SN: 9LTZP1700C8ZTR) to Budi Handoko', 'BRC-1773722064202', '2026-03-28 03:52:41.634757+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774669961893-jcgzmy', 'Nancy', 'Sale Created', 'Sale INV-1774669959810 - 1 item(s), Total: 6382500, Customer: Budi Handoko', 'INV-1774669959810', '2026-03-28 03:52:41.980961+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774670152401-387', 'Nancy', 'Product Update', 'Updated Tes 9873: price: 20000.00 -> 20000, cogs: 0.00 -> 0, taxEnabled: true -> false', 'BRC-1774669102013', '2026-03-28 03:55:52.340708+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774670186890-368', 'Nancy', 'Product Update', 'Updated Tes 9873: price: 20000.00 -> 20000, cogs: 0.00 -> 0, taxEnabled: false -> true', 'BRC-1774669102013', '2026-03-28 03:56:26.826791+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774670544032-319', 'Nancy', 'Product Update', 'Updated Tes 9873: price: 20000.00 -> 20000, cogs: 0.00 -> 0, taxEnabled: true -> false', 'BRC-1774669102013', '2026-03-28 04:02:23.968689+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774670551558-849', 'Nancy', 'Product Update', 'Updated Tes 9873: price: 20000.00 -> 20000, cogs: 0.00 -> 0, taxEnabled: false -> true', 'BRC-1774669102013', '2026-03-28 04:02:31.491728+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774671313295-365', 'Nancy', 'Product Update', 'Updated Tes 9873: price: 20000.00 -> 20000, cogs: 0.00 -> 0, taxEnabled: true -> false', 'BRC-1774669102013', '2026-03-28 04:15:13.227406+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774671320912-684', 'Nancy', 'Product Update', 'Updated Tes 9873: price: 20000.00 -> 20000, cogs: 0.00 -> 0, taxEnabled: false -> true', 'BRC-1774669102013', '2026-03-28 04:15:20.844668+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774671468318-5', 'Nancy', 'Product Update', 'Updated Tes 2345: price: 45000.00 -> 45000, cogs: 0.00 -> 0, taxEnabled: false -> true', 'BRC-1774635185353', '2026-03-28 04:17:48.252383+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774671623846-643', 'Nancy', 'Product Update', 'Updated Tes 9873: price: 20000.00 -> 20000, cogs: 0.00 -> 0, taxEnabled: true -> false', 'BRC-1774669102013', '2026-03-28 04:20:23.778315+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774671631374-748', 'Nancy', 'Product Update', 'Updated Tes 9873: price: 20000.00 -> 20000, cogs: 0.00 -> 0, taxEnabled: false -> true', 'BRC-1774669102013', '2026-03-28 04:20:31.304765+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774671791125-463', 'Nancy', 'Product Update', 'Updated Tes 9873: price: 20000.00 -> 20000, cogs: 0.00 -> 0, taxEnabled: true -> false', 'BRC-1774669102013', '2026-03-28 04:23:11.054493+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774671800612-294', 'Nancy', 'Product Update', 'Updated Tes 9873: price: 20000.00 -> 20000, cogs: 0.00 -> 0, taxEnabled: false -> true', 'BRC-1774669102013', '2026-03-28 04:23:20.540537+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774671820825-870', 'Nancy', 'Product Update', 'Updated Tes 9873: price: 20000.00 -> 20000, cogs: 0.00 -> 0', 'BRC-1774669102013', '2026-03-28 04:23:40.756592+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774671838566-16', 'Nancy', 'Product Update', 'Updated Tes 9873: price: 20000.00 -> 20000, cogs: 0.00 -> 0', 'BRC-1774669102013', '2026-03-28 04:23:58.494123+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774672115207-547', 'Nancy', 'Product Update', 'Updated Tes 9873: price: 20000.00 -> 20000, cogs: 0.00 -> 0, taxEnabled: true -> false', 'BRC-1774669102013', '2026-03-28 04:28:35.145069+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774672121368-432', 'Nancy', 'Product Update', 'Updated Tes 9873: price: 20000.00 -> 20000, cogs: 0.00 -> 0, taxEnabled: false -> true', 'BRC-1774669102013', '2026-03-28 04:28:41.303827+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774672341410-789', 'Nancy', 'Product Update', 'Updated Tes 9873: price: 20000.00 -> 20000, cogs: 0.00 -> 0, taxEnabled: true -> false', 'BRC-1774669102013', '2026-03-28 04:32:21.354671+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774672350433-34', 'Nancy', 'Product Update', 'Updated Tes 9873: price: 20000.00 -> 20000, cogs: 0.00 -> 0, taxEnabled: false -> true', 'BRC-1774669102013', '2026-03-28 04:32:30.370138+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774672595479-76', 'Nancy', 'Product Update', 'Updated Tes 9873: price: 20000.00 -> 20000, cogs: 0.00 -> 0, taxEnabled: true -> false', 'BRC-1774669102013', '2026-03-28 04:36:35.418991+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774672604517-828', 'Nancy', 'Product Update', 'Updated Tes 9873: price: 20000.00 -> 20000, cogs: 0.00 -> 0, taxEnabled: false -> true', 'BRC-1774669102013', '2026-03-28 04:36:44.457+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774672808159-544', 'Nancy', 'Product Update', 'Updated Tes 9873: price: 20000.00 -> 20000, cogs: 0.00 -> 0, taxEnabled: true -> false', 'BRC-1774669102013', '2026-03-28 04:40:08.09917+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774672817264-511', 'Nancy', 'Product Update', 'Updated Tes 9873: price: 20000.00 -> 20000, cogs: 0.00 -> 0, taxEnabled: false -> true', 'BRC-1774669102013', '2026-03-28 04:40:17.206083+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774672986211-654', 'Nancy', 'Product Update', 'Updated Tes 9873: price: 20000.00 -> 20000, cogs: 0.00 -> 0, taxEnabled: true -> false', 'BRC-1774669102013', '2026-03-28 04:43:06.152071+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774672995315-483', 'Nancy', 'Product Update', 'Updated Tes 9873: price: 20000.00 -> 20000, cogs: 0.00 -> 0, taxEnabled: false -> true', 'BRC-1774669102013', '2026-03-28 04:43:15.256171+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774673024035-877', 'Nancy', 'Stock Addition', 'Created product Test 0920 with 5 units from supplier PT. DATACRIP', 'BRC-1774673023768', '2026-03-28 04:43:43.97516+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774673635381-807', 'Nancy', 'Stock Addition', 'Created product Test 5584 with 6 units from supplier PT. DATACRIP', 'BRC-1774673635107', '2026-03-28 04:53:55.323608+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774673647372-788', 'Nancy', 'Product Update', 'Updated Test 5584: price: 34500.00 -> 34500, cogs: 0.00 -> 0, taxEnabled: false -> true', 'BRC-1774673635107', '2026-03-28 04:54:07.315786+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774679629536-908', 'Nancy', 'Stock Addition', 'Created product Test 6234 with 4 units from supplier PT. DATACRIP', 'BRC-1774679629123', '2026-03-28 06:33:49.630683+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774681738863-948', 'Nancy', 'Stock Addition', 'Created product godox test with 1 units from supplier PT. DATACRIP', 'BRC-1774681738193', '2026-03-28 07:08:58.955081+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774840576508-516', 'Sifa', 'Stock Addition', 'Created product CANON EF 70-200 F2.8L IS III USM LENSA with 1 serial numbers from supplier CV. CAMZONE ', 'BRC-1774840575626', '2026-03-30 03:16:16.588613+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774848945680-810', 'Nancy', 'Stock Addition', 'Manual adjust Test Test 123: 1 -> 2. Reason: Barang Retur Customer. Supplier: PT. DATACRIP. Date: 2026-03-30', 'BRC-1774621508778', '2026-03-30 05:35:45.767525+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774848952975-851', 'Nancy', 'Stock Addition', 'Manual adjust Tes 9873: 1 -> 3. Reason: Restok Barang Baru. Supplier: PT. FUJIFILM INDONESIA. Date: 2026-03-30', 'BRC-1774669102013', '2026-03-30 05:35:53.064479+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774848962081-304', 'Nancy', 'Manual Correction', 'Manual adjust Tes 9873: 3 -> 2. Reason: Koreksi Error', 'BRC-1774669102013', '2026-03-30 05:36:02.16859+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774848972560-681', 'Nancy', 'Product Update', 'Updated Tes 9873: model: 9873 -> 9873s, price: 20000.00 -> 20000, cogs: 0.00 -> 50000', 'BRC-1774669102013', '2026-03-30 05:36:12.647674+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774849002008-256', 'Nancy', 'Product Update', 'Updated Test Test 123: price: 20000.00 -> 20000, cogs: 0.00 -> 50000', 'BRC-1774621508778', '2026-03-30 05:36:42.097581+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774849017160-4', 'Nancy', 'Product Update', 'Updated Tes 2345: model: 2345 -> 23452, category: Body -> Lens, condition: New -> Used, price: 45000.00 -> 45000, cogs: 0.00 -> 0, warrantyMonths: 7 -> 4, warrantyType: Store Warranty -> Toko, taxEnabled: true -> false', 'BRC-1774635185353', '2026-03-30 05:36:57.246969+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774849039066-193', 'Nancy', 'Product Update', 'Updated Tes 2345: model: 2345 -> 23452, category: Body -> Lens, price: 45000.00 -> 45000, cogs: 0.00 -> 0, warrantyMonths: 7 -> 4, warrantyType: Store Warranty -> Distributor, taxEnabled: true -> false', 'BRC-1774635185353', '2026-03-30 05:37:19.155989+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774849052570-814', 'Nancy', 'Product Update', 'Updated Test Test 123: price: 20000.00 -> 20000, cogs: 50000.00 -> 50000, warrantyMonths: 12 -> 125, warrantyType: Official Sony Indonesia -> No Warranty', 'BRC-1774621508778', '2026-03-30 05:37:32.65733+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774849190492-696', 'Nancy', 'Stock Addition', 'Created product test sdads with 2 serial numbers from supplier PT. FUJIFILM INDONESIA', 'BRC-1774849189478', '2026-03-30 05:39:50.589364+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774849221068-8', 'Nancy', 'Product Update', 'Updated test sdads: brand: test -> FUJIFILM, model: sdads -> INSTAX, category: Accessory -> Body, price: 50209122.00 -> 0, cogs: 0.00 -> 0', 'BRC-1774849189478', '2026-03-30 05:40:21.162295+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774849239831-943', 'System', 'Manual Correction', 'Marked serial number saadadasd as Damaged for FUJIFILM INSTAX, reason: Barang Rusak', 'BRC-1774849189478', '2026-03-30 05:40:39.928244+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774849241608-978', 'System', 'Manual Correction', 'Marked serial number ssadsdsa as Damaged for FUJIFILM INSTAX, reason: Barang Rusak', 'BRC-1774849189478', '2026-03-30 05:40:41.700417+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774849245839-636', 'Nancy', 'Manual Correction', 'Manual adjust Sony  5532: 3 -> 3. Reason: SN Status Changed', 'BRC-1772075407390', '2026-03-30 05:40:45.935427+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774849247232-149', 'Nancy', 'Manual Correction', 'Manual adjust Sony  1358: 1 -> 1. Reason: SN Status Changed', 'BRC-1772017462526', '2026-03-30 05:40:47.324272+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774849248612-747', 'Nancy', 'Manual Correction', 'Manual adjust Fujifilm Test: 1 -> 1. Reason: SN Status Changed', 'BRC-1773385731477', '2026-03-30 05:40:48.709287+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774849250038-137', 'Nancy', 'Manual Correction', 'Manual adjust DJI MINI 3 PRO (DJI RC) (GL) DRONE: 2 -> 2. Reason: SN Status Changed', 'BRC-1773721384653', '2026-03-30 05:40:50.128177+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774849251416-157', 'Nancy', 'Manual Correction', 'Manual adjust DJI OSMO NANO (128GB) ACTION CAM: 1 -> 1. Reason: SN Status Changed', 'BRC-1773722064202', '2026-03-30 05:40:51.510613+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774849252836-588', 'Nancy', 'Manual Correction', 'Manual adjust DJI MINI 5 PRO FLY MORE COMBO PLUS (DJI RC2) DRONE: 1 -> 1. Reason: SN Status Changed', 'BRC-1773722244587', '2026-03-30 05:40:52.926984+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774849254210-82', 'Nancy', 'Manual Correction', 'Manual adjust CANON EF 70-200 F2.8L IS III USM LENSA: 1 -> 1. Reason: SN Status Changed', 'BRC-1774840575626', '2026-03-30 05:40:54.300244+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774849263146-963', 'System', 'Stock Addition', 'Added 2 serial number(s) to FUJIFILM INSTAX from supplier PT. FUJIFILM INDONESIA on 2026-03-30, reason: Restok Barang Baru. SN: 92026927, 92026929', 'BRC-1774849189478', '2026-03-30 05:41:03.242675+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774849266106-82', 'Nancy', 'Manual Correction', 'Manual adjust Sony  5532: 3 -> 3. Reason: SN Status Changed', 'BRC-1772075407390', '2026-03-30 05:41:06.195941+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774849267513-345', 'Nancy', 'Manual Correction', 'Manual adjust Sony  1358: 1 -> 1. Reason: SN Status Changed', 'BRC-1772017462526', '2026-03-30 05:41:07.609188+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774849268900-673', 'Nancy', 'Manual Correction', 'Manual adjust Fujifilm Test: 1 -> 1. Reason: SN Status Changed', 'BRC-1773385731477', '2026-03-30 05:41:08.993642+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774849270287-223', 'Nancy', 'Manual Correction', 'Manual adjust DJI MINI 3 PRO (DJI RC) (GL) DRONE: 2 -> 2. Reason: SN Status Changed', 'BRC-1773721384653', '2026-03-30 05:41:10.384192+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774885409687-55', 'Nancy', 'Stock Addition', 'Created product Test 1234 with 1 serial numbers from supplier IDOLA MILLENIUM', 'BRC-1774885409032', '2026-03-30 15:43:28.954748+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774885459595-492', 'System', 'Manual Correction', 'Marked serial number 82193041 as Damaged for Test 1234, reason: Not specified', 'BRC-1774885409032', '2026-03-30 15:44:18.849115+00');
INSERT INTO public.audit_logs VALUES ('LOG-1774885876773-931', 'System', 'Stock Addition', 'Added 1 serial number(s) to Test 1234 from supplier CV. CAMZONE  on 2026-03-30, reason: Restok Barang Baru. SN: 89213912', 'BRC-1774885409032', '2026-03-30 15:51:16.025204+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776413993712-ez3fd9', 'Mami', 'Sales Deduction', 'Sold 1 unit of Test (SN: 4547410562333) to Andy', 'BRC-1773385731477', '2026-04-17 08:19:53.314121+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776413994571-xxoasp', 'Mami', 'Sale Created', 'Sale INV-1776413990271 - 1 item(s), Total: 8325000, Customer: Andy', 'INV-1776413990271', '2026-04-17 08:19:54.171527+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776419265209-0qw2he', 'Mami', 'Sales Deduction', 'Sold 1 unit of test (tanpa SN) to Andy', 'BRC-1774681738193', '2026-04-17 09:47:44.793888+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776419266058-fd5x32', 'Mami', 'Sale Created', 'Sale INV-1776419262172 - 1 item(s), Total: 5550000, Customer: Andy', 'INV-1776419262172', '2026-04-17 09:47:45.642365+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776428951254-b1j14n', 'Mami', 'General', 'Installment of 150000 recorded for sale INV-1776419262172. Total paid: 150000/5550000', 'INV-1776419262172', '2026-04-17 12:29:10.699547+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776428982001-1uyjwf', 'Mami', 'General', 'Installment of 2500000 recorded for sale INV-1776419262172. Total paid: 2650000/5550000', 'INV-1776419262172', '2026-04-17 12:29:41.461854+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776430207103-eoz0ly', 'Mami', 'General', 'Installment of 1550000 recorded for sale INV-1776419262172. Total paid: 4200000/5550000', 'INV-1776419262172', '2026-04-17 12:50:06.556331+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776430874769-0h91a0', 'Mami', 'General', 'Installment of 1500000 recorded for sale INV-1776419262172. Total paid: 5700000/5550000 (FULLY PAID)', 'INV-1776419262172', '2026-04-17 13:01:14.202573+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776432205733-b4s2c0', 'Mami', 'General', 'Installment of 1250000 recorded for sale INV-1776413990271. Total paid: 1250000/8325000', 'INV-1776413990271', '2026-04-17 13:23:25.162854+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776447069236-7rndba', 'Nancy', 'Sales Deduction', 'Sold 1 unit of ACTION CAM (SN: 9LTZNCJ00CADHN) to ANIS CHA', 'BRC-1773722064202', '2026-04-17 17:31:09.312333+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776447069608-c72ehv', 'Nancy', 'Sale Created', 'Sale INV-1776447067165 - 1 item(s), Total: 5750000, Customer: ANIS CHA', 'INV-1776447067165', '2026-04-17 17:31:09.684283+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776447173823-361', 'System', 'Stock Addition', 'Added 2 serial number(s) to DJI OSMO POCKET 3 CREATOR COMBO ACTION CAM from supplier IDOLA MILLENIUM on 2026-04-17, reason: Restok Barang Baru. SN: 231313123123123, 231313123123123www', 'BRC-1773722333794', '2026-04-17 17:32:53.895709+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776447198654-zf6wzl', 'Nancy', 'Sales Deduction', 'Sold 1 unit of ACTION CAM (SN: 231313123123123) to ANDREAS TJ', 'BRC-1773722333794', '2026-04-17 17:33:18.726282+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776447199003-8fa2qd', 'Nancy', 'Sale Created', 'Sale INV-1776447196612 - 1 item(s), Total: 8250000, Customer: ANDREAS TJ', 'INV-1776447196612', '2026-04-17 17:33:19.076572+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776447258358-847', 'Nancy', 'Stock Addition', 'Created product Testing Godox Test with 3 serial numbers from supplier CV. CAMZONE ', 'BRC-1776447256318', '2026-04-17 17:34:18.436194+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776447313118-527', 'Nancy', 'General', 'Updated customer: name = $1, phone = $2, email = $3, address = $4, npwp = $5', 'CUST-1775927954455', '2026-04-17 17:35:13.191176+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776447324944-491', 'Nancy', 'General', 'Updated customer: name = $1', 'CUST-1775927954455', '2026-04-17 17:35:25.022071+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776447331884-612', 'Nancy', 'General', 'Deleted customer: apakoki', 'CUST-1775927954455', '2026-04-17 17:35:31.959425+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776447351332-s2hahf', 'Nancy', 'General', 'Installment of 2123122 recorded for sale INV-1774669959810. Total paid: 2123122/6382500', 'INV-1774669959810', '2026-04-17 17:35:51.409517+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776447434567-fl3kd6', 'Nancy', 'Sales Deduction', 'Sold 1 unit of Godox Test (SN: adasadsdsadsadasdasd) to CHARISSA PUTRI', 'BRC-1776447256318', '2026-04-17 17:37:14.646699+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776447434928-aklmwu', 'Nancy', 'Sale Created', 'Sale INV-1776447432526 - 1 item(s), Total: 1000000, Customer: CHARISSA PUTRI', 'INV-1776447432526', '2026-04-17 17:37:15.002044+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776447497482-dbodgc', 'Nancy', 'Sales Deduction', 'Sold 1 unit of Godox Test (SN: asdadsdasdasdsa) to CHARISSA PUTRI', 'BRC-1776447256318', '2026-04-17 17:38:17.554611+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776447497836-wpy51d', 'Nancy', 'Sale Created', 'Sale INV-1776447495366 - 1 item(s), Total: 5521322312, Customer: CHARISSA PUTRI', 'INV-1776447495366', '2026-04-17 17:38:17.9078+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776448222537-544', 'Nancy', 'Stock Addition', 'Created product asdas ddadss with 3 serial numbers from supplier PT. FUJIFILM INDONESIA', 'BRC-1776448220392', '2026-04-17 17:50:22.61616+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776452188910-360', 'Mami', 'Stock Addition', 'Created product Item With INV Number with 5 units from supplier IDOLA MILLENIUM', 'BRC-1776452187590', '2026-04-17 18:56:27.602535+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776453286464-324', 'Mami', 'Stock Addition', 'Manual adjust Item With INV Number: 5 -> 6. Reason: Restok Barang Baru. Supplier: IDOLA MILLENIUM. Date: 2026-04-17. Invoice: INV/123/ABC', 'BRC-1776452187590', '2026-04-17 19:14:45.16686+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776453729096-p2n4k7', 'Mami', 'Sales Deduction', 'Sold 1 unit of INV Number (tanpa SN) to Andy', 'BRC-1776452187590', '2026-04-17 19:22:07.788109+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776453730030-u4un2b', 'Mami', 'Sale Created', 'Sale INV-1776453725912 - 1 item(s), Total: 166500, Customer: Andy', 'INV-1776453725912', '2026-04-17 19:22:08.730271+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776454561147-pgblsh', 'Mami', 'Sales Deduction', 'Sold 1 unit of INV Number (tanpa SN) to Andy', 'BRC-1776452187590', '2026-04-17 19:35:59.850771+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776454562103-x8k8gc', 'Mami', 'Sale Created', 'Sale INV-1776454558187 - 1 item(s), Total: 166500, Customer: Andy', 'INV-1776454558187', '2026-04-17 19:36:00.801059+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776454612430-csgw0q', 'Mami', 'Sales Deduction', 'Sold 1 unit of INV Number (tanpa SN) to Andy', 'BRC-1776452187590', '2026-04-17 19:36:51.13333+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776454613389-od1jec', 'Mami', 'Sale Created', 'Sale INV-1776454609525 - 1 item(s), Total: 166500, Customer: Andy', 'INV-1776454609525', '2026-04-17 19:36:52.08928+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776456031097-yv1xtx', 'Mami', 'Sales Deduction', 'Sold 1 unit of INV Number (tanpa SN) to Andy', 'BRC-1776452187590', '2026-04-17 20:00:29.794054+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776456032063-efqozc', 'Mami', 'Sale Created', 'Sale INV-1776456027750 - 1 item(s), Total: 166500, Customer: Andy', 'INV-1776456027750', '2026-04-17 20:00:30.748073+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776458033256-201', 'System', 'Manual Correction', 'Marked serial number asdadasdasdsadsa as Damaged for Testing Godox Test, reason: Not specified', 'BRC-1776447256318', '2026-04-17 20:33:51.937064+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776458563143-34', 'Mami', 'General', 'Updated customer: name: Tess -> Tess BBB, phone: 0898131031 -> 089, email: - -> -, address: Jalan -> Jalan Jla, npwp: 21.232.323.2123.2432 -> 21.23', 'CUST-1776458534420', '2026-04-17 20:42:43.219669+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776458580266-682', 'Mami', 'General', 'Deleted customer: Tess BBB', 'CUST-1776458534420', '2026-04-17 20:43:00.342434+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776460164509-5632', 'Mami', 'Logout', 'Staff Mami logged out', NULL, '2026-04-17 21:09:23.184415+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776460170749-2048', 'Mami', 'Login', 'Staff Mami logged in', NULL, '2026-04-17 21:09:29.4344+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776460333971-2045', 'Mami', 'Logout', 'Staff Mami logged out', NULL, '2026-04-17 21:12:14.051818+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776460343206-2875', 'Mami', 'Login', 'Staff Mami logged in', NULL, '2026-04-17 21:12:23.293308+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776477013061-8555', 'Nancy', 'Login', 'Staff Nancy logged in', NULL, '2026-04-18 01:50:13.155203+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776477057362-221', 'Nancy', 'Product Update', 'Updated Item With INV Number: price: Rp 150.000 -> Rp 150.000, cogs: Rp 100.000 -> Rp 1.000.003, taxEnabled: false -> true', 'BRC-1776452187590', '2026-04-18 01:50:57.457866+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776477096995-p6pjvo', 'Nancy', 'Sales Deduction', 'Sold 1 unit of Godox Test (tanpa SN) to ANDREAS TJ', 'BRC-1776447256318', '2026-04-18 01:51:37.085276+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776477097348-9e1xoe', 'Nancy', 'Sale Created', 'Sale INV-1776477095675 - 1 item(s), Total: Rp 1.110.000, Customer: ANDREAS TJ', 'INV-1776477095675', '2026-04-18 01:51:37.469627+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776477144887-hx450y', 'Nancy', 'General', 'Installment of Rp 1.680.887 recorded for sale INV-1774669959810. Total paid: Rp 3.804.009/Rp 6.382.500', 'INV-1774669959810', '2026-04-18 01:52:24.976965+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776481872856-8256', 'Nancy', 'Logout', 'Staff Nancy logged out', NULL, '2026-04-18 03:11:13.84451+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776481873946-8535', 'Nancy', 'Logout', 'Staff Nancy logged out', NULL, '2026-04-18 03:11:14.931698+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776481897817-1585', 'Nancy', 'Login', 'Staff Nancy logged in', NULL, '2026-04-18 03:11:37.894598+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776482053407-342', 'Nancy', 'Product Update', 'Updated Item With INV Number: brand: Item With -> Item Withvg, price: Rp 150.000 -> Rp 150.000, cogs: Rp 1.000.003 -> Rp 1.000.003', 'BRC-1776452187590', '2026-04-18 03:14:13.485978+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776482054981-165', 'Nancy', 'Product Update', 'Updated Item Withvg INV Number: price: Rp 150.000 -> Rp 150.000, cogs: Rp 1.000.003 -> Rp 1.000.003', 'BRC-1776452187590', '2026-04-18 03:14:15.060292+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776482072750-110', 'Nancy', 'Stock Addition', 'Manual adjust Item Withvg INV Number: 2 -> 4. Price: Rp 150.000, COGS: Rp 1.000.003. Reason: Penyesuaian Stok. Supplier: CV. CAMZONE . Date: 2026-04-18', 'BRC-1776452187590', '2026-04-18 03:14:32.833382+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776482292748-k2t1lg', 'Nancy', 'General', 'Installment of Rp 578.491 recorded for sale INV-1774669959810. Total paid: Rp 4.382.500/Rp 6.382.500', 'INV-1774669959810', '2026-04-18 03:18:12.852989+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776482316892-4h744u', 'Nancy', 'General', 'Installment of Rp 100.000 recorded for sale INV-1774669959810. Total paid: Rp 4.482.500/Rp 6.382.500', 'INV-1774669959810', '2026-04-18 03:18:36.971868+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776482420021-zmh9ex', 'Nancy', 'General', 'Installment of Rp 1.075.000 recorded for sale INV-1776413990271. Total paid: Rp 2.325.000/Rp 8.325.000', 'INV-1776413990271', '2026-04-18 03:20:20.137771+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776482553296-8699', 'Mami', 'Login', 'Staff Mami logged in', NULL, '2026-04-18 03:22:31.821699+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776482629946-8349', 'Nancy', 'Login', 'Staff Nancy logged in', NULL, '2026-04-18 03:23:50.023808+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776482712717-6196', 'Nancy', 'Login', 'Staff Nancy logged in', NULL, '2026-04-18 03:25:12.797052+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776482897083-8763', 'Nancy', 'Login', 'Staff Nancy logged in', NULL, '2026-04-18 03:28:17.165864+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776483217132-udx6iu', 'Sifa', 'Sales Deduction', 'Sold 1 unit of LENSA (SN: 216065000059) to ANDREAS TJ', 'BRC-1774840575626', '2026-04-18 03:33:37.210242+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776483217501-jksp8h', 'Sifa', 'Sale Created', 'Sale INV-1776483215457 - 1 item(s), Total: Rp 40.000.000, Customer: ANDREAS TJ', 'INV-1776483215457', '2026-04-18 03:33:37.614081+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776483315380-0x9089', 'Nancy', 'Sales Deduction', 'Sold 1 unit of INSTAX (SN: 92026927) to ANDREAS TJ', 'BRC-1774849189478', '2026-04-18 03:35:15.459568+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776483315740-qxvi0l', 'Nancy', 'Sale Created', 'Sale INV-1776483313668 - 1 item(s), Total: Rp 3.330.000, Customer: ANDREAS TJ', 'INV-1776483313668', '2026-04-18 03:35:15.852063+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776483942300-207', 'Nancy', 'General', 'Deleted customer: Sosoksd', 'CUST-1776483926934', '2026-04-18 03:45:42.388224+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776483978025-817', 'Nancy', 'General', 'Deleted customer: .sla.s', 'CUST-1776483971706', '2026-04-18 03:46:18.114251+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776484090366-529', 'Nancy', 'General', 'Deleted customer: PT. Bangun', 'CUST-1776484072450', '2026-04-18 03:48:10.453045+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776484182827-4967', 'Nancy', 'Login', 'Staff Nancy logged in', NULL, '2026-04-18 03:49:42.913562+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776484376444-632', 'System', 'Stock Addition', 'Added 1 serial number(s) to Testing Godox Test from supplier IDOLA MILLENIUM on 2026-04-18, invoice: Test, reason: Restok Barang Baru. SN: Abcde', 'BRC-1776447256318', '2026-04-18 03:52:56.536612+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776484510930-510', 'Nancy', 'Stock Addition', 'Created product Instax Aja with 1 serial numbers, price: Rp 28.282, cogs: Rp 282.882, from supplier IDOLA MILLENIUM', 'BRC-1776484508644', '2026-04-18 03:55:11.019905+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776484671845-635', 'Nancy', 'Stock Addition', 'Created product Tes tes Tes with 1 units, price: Rp 44, cogs: Rp 55, from supplier PT. DATACRIP', 'BRC-1776484670895', '2026-04-18 03:57:51.937871+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776484766067-m2m3zt', 'Sifa', 'General', 'Installment of Rp 300.000 recorded for sale INV-1774669959810. Total paid: Rp 4.782.500/Rp 6.382.500', 'INV-1774669959810', '2026-04-18 03:59:26.190904+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776486083012-844', 'System', 'Stock Addition', 'Added 1 serial number(s) to Instax Aja from supplier CV. CAMZONE  on 2026-04-18, invoice: 2026, reason: Restok Barang Baru. SN: ABC', 'BRC-1776484508644', '2026-04-18 04:21:23.097307+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776486369456-5882', 'Nancy', 'Logout', 'Staff Nancy logged out', NULL, '2026-04-18 04:26:10.040434+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776486370198-471', 'Nancy', 'Logout', 'Staff Nancy logged out', NULL, '2026-04-18 04:26:10.944458+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776486380126-4652', 'Sifa', 'Login', 'Staff Sifa logged in', NULL, '2026-04-18 04:26:20.210148+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776486929998-192', 'Nancy', 'Manual Correction', 'Manual adjust Item Withvg INV Number: 4 -> 0. Price: Rp 150.000, COGS: Rp 1.000.003. Reason: Penyesuaian Stok', 'BRC-1776452187590', '2026-04-18 04:35:30.077711+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776535275387-5056', 'Nancy', 'Logout', 'Staff Nancy logged out', NULL, '2026-04-18 18:01:15.474646+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776535297527-5867', 'Nancy', 'Login', 'Staff Nancy logged in', NULL, '2026-04-18 18:01:37.608894+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776563749981-29', 'Nancy', 'General', 'Deleted customer: Ab cd', 'CUST-1776487390497', '2026-04-19 01:55:50.069339+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776563754922-649', 'Nancy', 'General', 'Deleted customer: Ab cd', 'CUST-1776487388237', '2026-04-19 01:55:55.007052+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776563809200-351', 'Nancy', 'General', 'Deleted customer: Joko', 'CUST-1772047219640', '2026-04-19 01:56:49.290463+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776563915023-303', 'Nancy', 'Stock Addition', 'Created product adasddsa asdaas with 1 serial numbers, price: Rp 11, cogs: Rp 11, from supplier CV. CAMZONE ', 'BRC-1776563913411', '2026-04-19 01:58:35.105511+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776563980112-168', 'Nancy', 'General', 'Deleted customer: asdads', 'CUST-1776563970833', '2026-04-19 01:59:40.191171+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776564032297-553', 'Nancy', 'General', 'Deleted customer: asdads', 'CUST-1776563970738', '2026-04-19 02:00:32.381+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776564036013-35', 'Nancy', 'General', 'Deleted customer: asdads', 'CUST-1776563950420', '2026-04-19 02:00:36.097869+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776564039653-469', 'Nancy', 'General', 'Deleted customer: asdads', 'CUST-1776563967409', '2026-04-19 02:00:39.737326+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776564043293-461', 'Nancy', 'General', 'Deleted customer: asdads', 'CUST-1776563967546', '2026-04-19 02:00:43.377981+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776564046550-345', 'Nancy', 'General', 'Deleted customer: asdads', 'CUST-1776563970481', '2026-04-19 02:00:46.633362+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776564050410-358', 'Nancy', 'General', 'Deleted customer: asdads', 'CUST-1776563967845', '2026-04-19 02:00:50.49507+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776564054809-972', 'Nancy', 'General', 'Deleted customer: ashdvs', 'CUST-1776564011709', '2026-04-19 02:00:54.892868+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776564058653-602', 'Nancy', 'General', 'Deleted customer: asdads', 'CUST-1776563955087', '2026-04-19 02:00:58.738468+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776564062080-281', 'Nancy', 'General', 'Deleted customer: asdads', 'CUST-1776563967703', '2026-04-19 02:01:02.163097+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776564067286-835', 'Nancy', 'General', 'Deleted customer: asdads', 'CUST-1776563967177', '2026-04-19 02:01:07.370619+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776564084733-55', 'System', 'Stock Addition', 'Added 1 serial number(s) to adasddsa asdaas from supplier CV. CAMZONE  on 2026-04-19, invoice: asd, reason: Restok Barang Baru. SN: asdasdasd', 'BRC-1776563913411', '2026-04-19 02:01:24.812417+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776564093637-574', 'System', 'Manual Correction', 'Marked serial number asddads as Damaged for adasddsa asdaas, reason: Barang Rusak', 'BRC-1776563913411', '2026-04-19 02:01:33.722157+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776564132052-516', 'System', 'Stock Addition', 'Added 15 serial number(s) to adasddsa asdaas from supplier PT. DATACRIP on 2026-04-19, invoice: dffasdasd, reason: Penyesuaian Stok. SN: fwefwefwefwesdq, fwefwefwefwefrwdascxzzxfwefczwefwefwe12323, fwefwefwefwefwsd, fwefwefwefwe12321, fwefwefwefwef23, fwefwefwefwew11, fwefwefwefwefw, fwefwefwefwewccc, fwefwefwefwefq, fwefwefwefwesxcc, fwefwefwefwefw3w, fwefwefwefweeqew, fwefwefwefwef12az, fwefwefwefwe222, fwefwefwefwefwws22312', 'BRC-1776563913411', '2026-04-19 02:02:12.131071+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776564141374-871', 'System', 'Manual Correction', 'Marked serial number fwefwefwefwefrwdascxzzxfwefczwefwefwe12323 as Damaged for adasddsa asdaas, reason: Barang Rusak', 'BRC-1776563913411', '2026-04-19 02:02:21.457869+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776564143139-881', 'System', 'Manual Correction', 'Marked serial number fwefwefwefwesdq as Damaged for adasddsa asdaas, reason: Barang Rusak', 'BRC-1776563913411', '2026-04-19 02:02:23.218044+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776564151788-261', 'Nancy', 'Product Update', 'Updated adasddsa asdaas: price: Rp 11 -> Rp 0, cogs: Rp 11 -> Rp 0', 'BRC-1776563913411', '2026-04-19 02:02:31.867647+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776564177128-713', 'Nancy', 'Product Update', 'Updated adasddsa asdaas: price: Rp 0 -> Rp 0, cogs: Rp 0 -> Rp 2', 'BRC-1776563913411', '2026-04-19 02:02:57.205425+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776564801005-522', 'Nancy', 'Product Update', 'Updated adasddsa asdaas: price: Rp 0 -> Rp 0, cogs: Rp 2 -> Rp 2, warrantyType: Store Warranty -> Toko, taxEnabled: true -> false', 'BRC-1776563913411', '2026-04-19 02:13:21.079335+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776564821715-362', 'Nancy', 'Product Update', 'Updated adasddsa asdaas: price: Rp 0 -> Rp 0, cogs: Rp 2 -> Rp 2, warrantyType: Store Warranty -> Toko', 'BRC-1776563913411', '2026-04-19 02:13:41.789161+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776564822867-510', 'Nancy', 'Product Update', 'Updated adasddsa asdaas: price: Rp 0 -> Rp 0, cogs: Rp 2 -> Rp 2, warrantyType: Store Warranty -> Toko', 'BRC-1776563913411', '2026-04-19 02:13:42.942892+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776564825829-368', 'Nancy', 'Product Update', 'Updated adasddsa asdaas: price: Rp 0 -> Rp 0, cogs: Rp 2 -> Rp 2, warrantyType: Store Warranty -> Distributor', 'BRC-1776563913411', '2026-04-19 02:13:45.906793+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776564826902-484', 'Nancy', 'Product Update', 'Updated adasddsa asdaas: price: Rp 0 -> Rp 0, cogs: Rp 2 -> Rp 2', 'BRC-1776563913411', '2026-04-19 02:13:46.975442+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776564831861-34', 'Nancy', 'Product Update', 'Updated adasddsa asdaas: price: Rp 0 -> Rp 0, cogs: Rp 2 -> Rp 2, warrantyType: Distributor -> No Warranty', 'BRC-1776563913411', '2026-04-19 02:13:51.938631+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776564835922-982', 'Nancy', 'Product Update', 'Updated adasddsa asdaas: condition: Used -> New, price: Rp 0 -> Rp 0, cogs: Rp 2 -> Rp 2, warrantyType: Distributor -> No Warranty', 'BRC-1776563913411', '2026-04-19 02:13:55.996433+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776564859059-287', 'Nancy', 'Product Update', 'Updated adasddsa asdaas: category: Lens -> Body, condition: Used -> New, price: Rp 0 -> Rp 0, cogs: Rp 2 -> Rp 2', 'BRC-1776563913411', '2026-04-19 02:14:19.136183+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776564866589-116', 'Nancy', 'Product Update', 'Updated adasddsa asdaas: category: Body -> Accessory, condition: New -> Used, price: Rp 0 -> Rp 0, cogs: Rp 2 -> Rp 2', 'BRC-1776563913411', '2026-04-19 02:14:26.662196+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776564873679-591', 'Nancy', 'Product Update', 'Updated adasddsa asdaas: price: Rp 0 -> Rp 0, cogs: Rp 2 -> Rp 2, warrantyMonths: 12 -> 0', 'BRC-1776563913411', '2026-04-19 02:14:33.756078+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776564947676-m1cq1q', 'Nancy', 'Sales Deduction', 'Sold 1 unit of asdaas (SN: asdasdasd) to CHARISSA PUTRI', 'BRC-1776563913411', '2026-04-19 02:15:47.75525+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776564948058-7i41w1', 'Nancy', 'Sale Created', 'Sale INV-1776564945301 - 1 item(s), Total: Rp 24.677,52, Customer: CHARISSA PUTRI', 'INV-1776564945301', '2026-04-19 02:15:48.165971+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776602592237-237', 'System', 'Stock Addition', 'Added 1 serial number(s) to adasddsa asdaas from supplier CV. CAMZONE  on 2026-04-19, invoice: -, reason: Restok Barang Baru. SN: 123ABNH', 'BRC-1776563913411', '2026-04-19 12:43:12.366329+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776603999364-610', 'Mami', 'Stock Addition', 'Manual adjust godox test: 0 -> 6. Price: Rp 500.000, COGS: Rp 50.000. Reason: Barang Retur Customer. Supplier: IDOLA MILLENIUM. Date: 2026-04-19. Invoice: INV/123/BB', 'BRC-1774681738193', '2026-04-19 13:06:39.492588+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776604083771-395', 'Mami', 'General', 'Deleted customer: asdads', 'CUST-1776563948417', '2026-04-19 13:08:03.902085+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776604109391-284', 'Mami', 'General', 'Updated customer: name: ashdvs -> Testing, phone: ddsdfs -> 012910522234, email: - -> -, npwp: - -> -', 'CUST-1776564009798', '2026-04-19 13:08:29.942002+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776607405051-p2gr2w', 'Mami', 'Sales Deduction', 'Sold 1 unit of test (tanpa SN) to Andy', 'BRC-1774681738193', '2026-04-19 14:03:25.12876+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776607405421-fr0npb', 'Mami', 'Sale Created', 'Sale INV-1776607398344 - 1 item(s), Total: Rp 500.000, Customer: Andy', 'INV-1776607398344', '2026-04-19 14:03:25.528164+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776607704746-978', 'System', 'Manual Correction', 'Marked serial number fwefwefwefwefwsd as Damaged for adasddsa asdaas, reason: Barang Rusak', 'BRC-1776563913411', '2026-04-19 14:08:24.823416+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776607706777-554', 'System', 'Manual Correction', 'Marked serial number fwefwefwefwe12321 as Damaged for adasddsa asdaas, reason: Barang Rusak', 'BRC-1776563913411', '2026-04-19 14:08:26.853933+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776615952613-3061', 'Nancy', 'Login', 'Staff Nancy logged in', NULL, '2026-04-19 16:25:52.698443+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776615995902-314', 'System', 'Stock Addition', 'Added 2 serial number(s) to adasddsa asdaas from supplier IDOLA MILLENIUM on 2026-04-19, invoice: testest, reason: Penyesuaian Stok. SN: asdassa, asdassaw23', 'BRC-1776563913411', '2026-04-19 16:26:35.987453+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776616139209-9aoeu2', 'Nancy', 'Sales Deduction', 'Sold 1 unit of test (tanpa SN) to LASKAR AMARUTA ALFAJRI', 'BRC-1774681738193', '2026-04-19 16:28:59.295335+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776616140647-i4r7v6', 'Nancy', 'Sales Deduction', 'Sold 1 unit of Godox Test (SN: Abcde) to LASKAR AMARUTA ALFAJRI', 'BRC-1776447256318', '2026-04-19 16:29:00.732971+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776616142058-aorrjj', 'Nancy', 'Sales Deduction', 'Sold 1 unit of asdaas (SN: fwefwefwefwef23) to LASKAR AMARUTA ALFAJRI', 'BRC-1776563913411', '2026-04-19 16:29:02.146587+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776616143512-f52tab', 'Nancy', 'Sales Deduction', 'Sold 1 unit of asdaas (SN: fwefwefwefwefw) to LASKAR AMARUTA ALFAJRI', 'BRC-1776563913411', '2026-04-19 16:29:03.600132+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776616143873-6zz04r', 'Nancy', 'Sale Created', 'Sale INV-1776616137970 - 4 item(s), Total: Rp 214.712.213, Customer: LASKAR AMARUTA ALFAJRI', 'INV-1776616137970', '2026-04-19 16:29:03.990127+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776616221371-fozf3f', 'Nancy', 'Sales Deduction', 'Sold 1 unit of asdaas (SN: fwefwefwefwew11) to DIAS PRANOTO', 'BRC-1776563913411', '2026-04-19 16:30:21.457324+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776616222810-igwmhg', 'Nancy', 'Sales Deduction', 'Sold 1 unit of asdaas (SN: fwefwefwefwewccc) to DIAS PRANOTO', 'BRC-1776563913411', '2026-04-19 16:30:22.895428+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776616223158-6gl5bw', 'Nancy', 'Sale Created', 'Sale INV-1776616219731 - 2 item(s), Total: Rp 623.014, Customer: DIAS PRANOTO', 'INV-1776616219731', '2026-04-19 16:30:23.243571+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776616363666-953', 'System', 'Manual Correction', 'Marked serial number fwefwefwefwefq as Damaged for adasddsa asdaas, reason: Barang Hilang', 'BRC-1776563913411', '2026-04-19 16:32:43.755048+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776616365376-315', 'System', 'Manual Correction', 'Marked serial number fwefwefwefwesxcc as Damaged for adasddsa asdaas, reason: Barang Hilang', 'BRC-1776563913411', '2026-04-19 16:32:45.464086+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776616367091-771', 'System', 'Manual Correction', 'Marked serial number fwefwefwefweeqew as Damaged for adasddsa asdaas, reason: Barang Hilang', 'BRC-1776563913411', '2026-04-19 16:32:47.184688+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776616368813-934', 'System', 'Manual Correction', 'Marked serial number fwefwefwefwefw3w as Damaged for adasddsa asdaas, reason: Barang Hilang', 'BRC-1776563913411', '2026-04-19 16:32:48.90515+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776616370535-378', 'System', 'Manual Correction', 'Marked serial number fwefwefwefwef12az as Damaged for adasddsa asdaas, reason: Barang Hilang', 'BRC-1776563913411', '2026-04-19 16:32:50.627765+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776616372268-496', 'System', 'Manual Correction', 'Marked serial number fwefwefwefwefwws22312 as Damaged for adasddsa asdaas, reason: Barang Hilang', 'BRC-1776563913411', '2026-04-19 16:32:52.356535+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776616373970-55', 'System', 'Manual Correction', 'Marked serial number asdassa as Damaged for adasddsa asdaas, reason: Barang Hilang', 'BRC-1776563913411', '2026-04-19 16:32:54.058246+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776616375692-655', 'System', 'Manual Correction', 'Marked serial number asdassaw23 as Damaged for adasddsa asdaas, reason: Barang Hilang', 'BRC-1776563913411', '2026-04-19 16:32:55.784958+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776616377408-463', 'System', 'Manual Correction', 'Marked serial number 123ABNH as Damaged for adasddsa asdaas, reason: Barang Hilang', 'BRC-1776563913411', '2026-04-19 16:32:57.499523+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776616385045-38', 'System', 'Manual Correction', 'Marked serial number fwefwefwefwe222 as Damaged for adasddsa asdaas, reason: Barang Rusak', 'BRC-1776563913411', '2026-04-19 16:33:05.132892+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776616401966-373', 'System', 'Manual Correction', 'Marked serial number Ssss as Damaged for Instax Aja, reason: Barang Rusak', 'BRC-1776484508644', '2026-04-19 16:33:22.051113+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776616403687-824', 'System', 'Manual Correction', 'Marked serial number ABC as Damaged for Instax Aja, reason: Barang Rusak', 'BRC-1776484508644', '2026-04-19 16:33:23.774504+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776616448420-411', 'Nancy', 'Stock Addition', 'Created product Instax intsax ppn with 2 serial numbers, price: Rp 0, cogs: Rp 0, from supplier IDOLA MILLENIUM', 'BRC-1776616446818', '2026-04-19 16:34:08.511642+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776616469957-122', 'System', 'Stock Addition', 'Added 2 serial number(s) to Instax intsax ppn from supplier PT. DATACRIP on 2026-04-19, invoice: tesasda, reason: Restok Barang Baru. SN: sdadasd, sdadasdwqwws', 'BRC-1776616446818', '2026-04-19 16:34:30.048278+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776616551855-791', 'System', 'Manual Correction', 'Marked serial number 92026929 as Damaged for FUJIFILM INSTAX, reason: Barang Rusak', 'BRC-1774849189478', '2026-04-19 16:35:51.947208+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776616632715-431', 'System', 'Manual Correction', 'Marked serial number sdadasd as Damaged for Instax intsax ppn, reason: Penyesuaian Stok', 'BRC-1776616446818', '2026-04-19 16:37:12.803629+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776616655381-345', 'System', 'Manual Correction', 'Marked serial number ssadddsdad as Damaged for Instax intsax ppn, reason: Barang Hilang', 'BRC-1776616446818', '2026-04-19 16:37:35.469373+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777873607254-761', 'Sifa', 'Customer Created', 'Created customer: RASHEESA RATU S, phone: 082165041233', 'CUST-1777873606729', '2026-05-04 05:46:47.346618+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776616820081-638', 'System', 'Stock Addition', 'Added 3 serial number(s) to Instax intsax ppn from supplier CV. CAMZONE  on 2026-04-19, invoice: apaaainiiii, reason: Penyesuaian Stok. SN: sdsq, sdsq221323, 3422355253er', 'BRC-1776616446818', '2026-04-19 16:40:20.170691+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776616836648-85', 'System', 'Stock Addition', 'Added 2 serial number(s) to Instax intsax ppn from supplier IDOLA MILLENIUM on 2026-04-19, invoice: ddscasdcx, reason: Barang Retur Customer. SN: 324242342342343, 3242423423423435324ew', 'BRC-1776616446818', '2026-04-19 16:40:36.737481+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776617460929-498', 'Nancy', 'General', 'Deleted customer: Andy', 'CUST-1772856667104', '2026-04-19 16:51:01.01449+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776617500725-444', 'Nancy', 'General', 'Deleted customer: PT. BANGUN JAYA PEDIA', 'CUST-1776483882471', '2026-04-19 16:51:40.810858+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776617528523-596', 'Nancy', 'General', 'Deleted customer: Test', 'CUST-1776486283467', '2026-04-19 16:52:08.609128+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776617536166-8', 'Nancy', 'General', 'Deleted customer: Testing', 'CUST-1776564009798', '2026-04-19 16:52:16.244373+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776617550464-994', 'Nancy', 'General', 'Updated customer: email: - -> -, address: - -> cxz, npwp: - -> xzcc', 'CUST-1776617521286', '2026-04-19 16:52:30.550561+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776617559411-680', 'Nancy', 'General', 'Updated customer: phone: a -> adadascx, address: cxz -> cxzcczcx', 'CUST-1776617521286', '2026-04-19 16:52:39.489244+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776617564216-835', 'Nancy', 'General', 'Deleted customer: dsd', 'CUST-1776617521286', '2026-04-19 16:52:44.302301+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776617758748-992', 'Nancy', 'General', 'Updated customer: email: - -> -, address: Jalanan -> Jalananzxccxz', 'CUST-1776591901335', '2026-04-19 16:55:58.83193+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776617765519-941', 'Nancy', 'General', 'Updated customer: phone: 08912310931 -> 08912310931r23432 ', 'CUST-1776591901335', '2026-04-19 16:56:05.602475+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776617770812-722', 'Nancy', 'General', 'Deleted customer: Tes 321', 'CUST-1776591901335', '2026-04-19 16:56:10.895205+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776618027036-7ky2fn', 'Nancy', 'General', 'Installment of Rp 453.453.534 recorded for sale INV-1774669959810. Total paid: Rp 458.236.034/Rp 6.382.500 (FULLY PAID). Loyalty points awarded: 6382', 'INV-1774669959810', '2026-04-19 17:00:27.143745+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776618049038-242', 'Nancy', 'General', 'Deleted customer: tesesfs', 'CUST-1776617779315', '2026-04-19 17:00:49.116078+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776618132980-204', 'Nancy', 'General', 'Deleted customer: Budi Handoko', 'CUST-1772074658861', '2026-04-19 17:02:13.058693+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776618232312-3200', 'Nancy', 'Logout', 'Staff Nancy logged out', NULL, '2026-04-19 17:03:52.395503+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776618238117-5134', 'Sifa', 'Login', 'Staff Sifa logged in', NULL, '2026-04-19 17:03:58.193075+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776618254962-2671', 'Sifa', 'Logout', 'Staff Sifa logged out', NULL, '2026-04-19 17:04:15.0424+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776618262074-8212', 'Nancy', 'Login', 'Staff Nancy logged in', NULL, '2026-04-19 17:04:22.150178+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776618470435-153', 'System', 'Manual Correction', 'Marked serial number 324242342342343 as Damaged for Instax intsax ppn, reason: Penyesuaian Stok', 'BRC-1776616446818', '2026-04-19 17:07:50.513809+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776618517918-794', 'System', 'Stock Addition', 'Added 1 serial number(s) to FUJIFILM INSTAX from supplier  TESs E on 2026-04-19, invoice: fssdf, reason: Restok Barang Baru. SN: dfsfd', 'BRC-1774849189478', '2026-04-19 17:08:37.998648+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776618695862-3565', 'Nancy', 'Logout', 'Staff Nancy logged out', NULL, '2026-04-19 17:11:35.938694+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776618696158-902', 'Nancy', 'Logout', 'Staff Nancy logged out', NULL, '2026-04-19 17:11:36.240837+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776618703265-7273', 'Mami', 'Login', 'Staff Mami logged in', NULL, '2026-04-19 17:11:43.339854+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776619566069-156', 'System', 'Stock Addition', 'Added 2 serial number(s) to Fujifilm Test from supplier  dzyrd g on 2026-04-19, invoice: INV123, reason: Restok Barang Baru. SN: ACS, ACSVS', 'BRC-1773385731477', '2026-04-19 17:26:06.161914+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776619626111-808', 'System', 'Manual Correction', 'Marked serial number ACSVS as Damaged for Fujifilm Test, reason: Koreksi Error', 'BRC-1773385731477', '2026-04-19 17:27:06.198855+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776620673006-39', 'System', 'Stock Addition', 'Added 1 serial number(s) to Instax intsax ppn from supplier IDOLA MILLENIUM on 2026-04-19, invoice: HJ, reason: Penyesuaian Stok. SN: gyjhnhgv', 'BRC-1776616446818', '2026-04-19 17:44:33.096558+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776621511403-14', 'Mami', 'Stock Addition', 'Created product TESTINST SDASSD with 1 units, price: Rp 0, cogs: Rp 0, from supplier IDOLA MILLENIUM', 'BRC-1776621510672', '2026-04-19 17:58:31.49806+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776621521094-429', 'Mami', 'Stock Addition', 'Manual adjust TESTINST SDASSD: 1 -> 4. Price: Rp 0, COGS: Rp 0. Reason: Barang Retur Customer. Supplier: PT. DATACRIP. Date: 2026-04-19. Invoice: SADASDAA', 'BRC-1776621510672', '2026-04-19 17:58:41.189536+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776621534573-853', 'Mami', 'Product Update', 'Updated TESTINST SDASSD: price: Rp 0 -> Rp 1.242.414, cogs: Rp 0 -> Rp 214.412.421', 'BRC-1776621510672', '2026-04-19 17:58:54.668374+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776621555511-692', 'Mami', 'Manual Correction', 'Manual adjust TESTINST SDASSD: 4 -> 3. Price: Rp 1.242.414, COGS: Rp 214.412.421. Reason: Koreksi Error', 'BRC-1776621510672', '2026-04-19 17:59:15.606383+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776621564597-871', 'Mami', 'Manual Correction', 'Manual adjust TESTINST SDASSD: 3 -> 0. Price: Rp 1.242.414, COGS: Rp 214.412.421. Reason: Restok Barang Baru', 'BRC-1776621510672', '2026-04-19 17:59:24.691702+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776621617163-673', 'Mami', 'Stock Addition', 'Created product testt teetstt with 1 serial numbers, price: Rp 1, cogs: Rp 0, from supplier CV. CAMZONE ', 'BRC-1776621616110', '2026-04-19 18:00:17.257627+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776621626453-112', 'System', 'Stock Addition', 'Added 1 serial number(s) to testt teetstt from supplier CV. CAMZONE  on 2026-04-19, invoice: -, reason: Barang Retur Customer. SN: fdsfdsds', 'BRC-1776621616110', '2026-04-19 18:00:26.547633+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776621646912-72', 'System', 'Stock Addition', 'Added 2 serial number(s) to testt teetstt from supplier PT. SONY INDONESIA on 2026-04-19, invoice: -, reason: Barang Retur Customer. SN: adadsad, adadsadvvew', 'BRC-1776621616110', '2026-04-19 18:00:47.007532+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776621679852-172', 'System', 'Stock Addition', 'Added 2 serial number(s) to testt teetstt from supplier PT. DATACRIP on 2026-04-19, invoice: sdadsa, reason: Barang Retur Customer. SN: fasdsdsaas, fasdsdsaasvcv xzc', 'BRC-1776621616110', '2026-04-19 18:01:19.946982+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776650568535-wbub79', 'Mami', 'Sales Deduction', 'Sold 1 unit of test (tanpa SN) to ALDEN RAYHAN', 'BRC-1774681738193', '2026-04-20 02:02:43.784693+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776650569385-ze4yod', 'Mami', 'Sale Created', 'Sale INV-1776650564687 - 1 item(s), Total: Rp 500.000, Customer: ALDEN RAYHAN', 'INV-1776650564687', '2026-04-20 02:02:43.784693+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776656417294-1cs0rc', 'Mami', 'Sales Deduction', 'Sold 1 unit of test (tanpa SN) to CHARISSA PUTRI', 'BRC-1774681738193', '2026-04-20 03:40:12.42801+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776656418147-usk49d', 'Mami', 'Sale Created', 'Sale INV-1776656413081 - 1 item(s), Total: Rp 500.000, Customer: CHARISSA PUTRI', 'INV-1776656413081', '2026-04-20 03:40:12.42801+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776658070955-2868', 'Mami', 'Login', 'Staff Mami logged in', NULL, '2026-04-20 04:07:51.030159+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776658643574-i0v1ax', 'Mami', 'Sale Created', 'Sale INV-1776658640681 - 1 items, Total: Rp 500.000, Customer: Kskksmx', 'INV-1776658640681', '2026-04-20 04:17:23.761715+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776658643605-4mwv7m', 'Mami', 'Sales Deduction', 'Sold 1 unit of test (tanpa SN) to Kskksmx', 'BRC-1774681738193', '2026-04-20 04:17:23.761715+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776659168258-596', 'Mami', 'Customer Created', 'Created customer: Test 123, phone: 08901230193', 'CUST-1776659167730', '2026-04-20 04:26:08.340095+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776659180360-877', 'Mami', 'Customer Deleted', 'Deleted customer: Test 123', 'CUST-1776659167730', '2026-04-20 04:26:20.435843+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776740108854-ymqw14', 'Nancy', 'Sale Created', 'Sale INV-1776740105226 - 1 items, Total: Rp 1, Customer: DELFIN BAPTISTA', 'INV-1776740105226', '2026-04-21 02:55:06.566153+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776740108887-qi23j4', 'Nancy', 'Sales Deduction', 'Sold 1 unit of teetstt (SN: adadsadvvew) to DELFIN BAPTISTA', 'BRC-1776621616110', '2026-04-21 02:55:06.566153+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776740163697-442', 'Nancy', 'Stock Addition', 'Created product tes tes with 1 serial numbers, price: Rp 0, cogs: Rp 0, from supplier IDOLA MILLENIUM', 'BRC-1776740162749', '2026-04-21 02:56:03.788559+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776740181858-452', 'System', 'Stock Addition', 'Added 1 serial number(s) to tes tes from supplier IDOLA MILLENIUM on 2026-04-21, invoice: INV123, reason: Restok Barang Baru. SN: SNS12313', 'BRC-1776740162749', '2026-04-21 02:56:22.323615+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776740206894-617', 'System', 'Manual Correction', 'Marked serial number SNS12313 as Damaged for tes tes, reason: Barang Hilang (stock decremented)', 'BRC-1776740162749', '2026-04-21 02:56:46.983366+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776740371681-859', 'System', 'Manual Correction', 'Marked serial number SN1231412 as Damaged for tes tes, reason: Barang Rusak (stock decremented)', 'BRC-1776740162749', '2026-04-21 02:59:31.771489+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776740378714-908', 'System', 'Product Deleted', 'Deleted product: tes tes', 'BRC-1776740162749', '2026-04-21 02:59:38.804725+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776740395147-526', 'Nancy', 'Product Update', 'Updated testt teetstt: brand: testt -> Tes1234, model: teetstt -> Tes, category: Body -> Lens, price: Rp 1 -> Rp 10.000, cogs: Rp 0 -> Rp 0, warrantyType: No Warranty -> Toko', 'BRC-1776621616110', '2026-04-21 02:59:55.237657+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776740418966-519', 'Nancy', 'Supplier Updated', 'Updated supplier CV. CAMZONE : address: ITC FATMAWATI LT2 NO.37A -> ITC FATMAWATI LT2 NO.37A -', 'e13c1c8f-e6c2-4988-837e-374f9acbfa1f', '2026-04-21 03:00:19.05694+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776740427206-172', 'Nancy', 'Supplier Updated', 'Updated supplier CV. CAMZONE : address: ITC FATMAWATI LT2 NO.37A - -> ITC FATMAWATI LT2 NO.37A', 'e13c1c8f-e6c2-4988-837e-374f9acbfa1f', '2026-04-21 03:00:27.296738+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776740440016-545', 'Nancy', 'Supplier Created', 'Created supplier: TES123, phone: 0981209180412, address: Jl. Jalan', '0a6c89e6-004e-4cb1-bfda-367645d26aab', '2026-04-21 03:00:40.10622+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776740446920-257', 'System', 'Supplier Deleted', 'Deleted supplier: TES123', '0a6c89e6-004e-4cb1-bfda-367645d26aab', '2026-04-21 03:00:47.011049+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776740471709-861', 'Nancy', 'Customer Updated', 'Updated customer: name: sfs -> SFS, phone: s -> 09180913012, email: - -> -, npwp: dssdf -> ------', 'CUST-1776618195741', '2026-04-21 03:01:11.7978+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776740484271-731', 'Nancy', 'Customer Deleted', 'Deleted customer: SFS', 'CUST-1776618195741', '2026-04-21 03:01:24.359717+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776740496675-mjv5hq', 'Nancy', 'General', 'Marked sale INV-1776740105226 as paid. Loyalty points awarded: 0', 'INV-1776740105226', '2026-04-21 03:01:36.76814+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776740593317-46k7cv', 'Nancy', 'Sale Created', 'Sale INV-1776740590870 - 1 items, Total: Rp 10.000, Customer: DIAS PRANOTO', 'INV-1776740590870', '2026-04-21 03:03:11.120862+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776740593349-b325r6', 'Nancy', 'Sales Deduction', 'Sold 1 unit of Tes (SN: ew) to DIAS PRANOTO', 'BRC-1776621616110', '2026-04-21 03:03:11.120862+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776740654845-722', 'Nancy', 'Stock Addition', 'Created product Tes  Non SN with 10 units, price: Rp 0, cogs: Rp 0, from supplier IDOLA MILLENIUM', 'BRC-1776740653217', '2026-04-21 03:04:14.933238+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776740669611-498', 'Nancy', 'Manual Correction', 'Manual adjust Tes  Non SN: 10 -> 6. Price: Rp 0, COGS: Rp 0. Reason: Barang Retur Customer', 'BRC-1776740653217', '2026-04-21 03:04:29.699391+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776740772288-3659', 'Mami', 'Login', 'Staff Mami logged in', NULL, '2026-04-21 03:06:12.374751+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776740862136-uvvkfp', 'Mami', 'Sale Created', 'Sale INV-1776740858251 - 2 items, Total: Rp 18.635.556, Customer: EDY PRIANTO', 'INV-1776740858251', '2026-04-21 03:07:39.598871+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776740862157-4qpvh6', 'Mami', 'Sales Deduction', 'Sold 1 unit of DRONE (SN: 1581F9DEC25AG0296561) to EDY PRIANTO', 'BRC-1773722244587', '2026-04-21 03:07:39.598871+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776740862157-tlajee', 'Mami', 'Sales Deduction', 'Sold 1 unit of Non SN (tanpa SN) to EDY PRIANTO', 'BRC-1776740653217', '2026-04-21 03:07:39.598871+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776740921115-575', 'System', 'Stock Addition', 'Added 4 serial number(s) to DJI MINI 5 PRO FLY MORE COMBO PLUS (DJI RC2) DRONE from supplier CV. CAMZONE  on 2026-04-21, invoice: Tetyshxx, reason: Restok Barang Baru. SN: Sjkdjmckc, Sjkdjmckcsapzx, Sjkdjmckcwwueuuejdx, Sjkdjmckcsapzxwiwiiwed', 'BRC-1773722244587', '2026-04-21 03:08:41.576984+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776740955081-902', 'System', 'Stock Addition', 'Added 1 serial number(s) to DJI MINI 5 PRO FLY MORE COMBO PLUS (DJI RC2) DRONE from supplier CV. CAMZONE  on 2026-04-21, invoice: Jjdncnncc, reason: Penyesuaian Stok. SN: Isikekcm', 'BRC-1773722244587', '2026-04-21 03:09:15.544227+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776740995754-483', 'Mami', 'Customer Created', 'Created customer: Isisks, phone: @@7)@', 'CUST-1776740995203', '2026-04-21 03:09:55.842058+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776741015522-798', 'Mami', 'Customer Deleted', 'Deleted customer: Isisks', 'CUST-1776740995203', '2026-04-21 03:10:15.610889+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776741029995-788', 'Mami', 'Supplier Created', 'Created supplier: Sas, address: Sas', '31465e3b-678d-4c88-868b-cb25c70505db', '2026-04-21 03:10:30.084234+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776741035960-521', 'System', 'Supplier Deleted', 'Deleted supplier: Sas', '31465e3b-678d-4c88-868b-cb25c70505db', '2026-04-21 03:10:36.04955+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776741063111-27', 'System', 'Manual Correction', 'Marked serial number sdsq221323 as Damaged for Instax intsax ppn, reason: Koreksi Error (stock decremented)', 'BRC-1776616446818', '2026-04-21 03:11:03.202865+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776741065231-20', 'System', 'Manual Correction', 'Marked serial number 3242423423423435324ew as Damaged for Instax intsax ppn, reason: Koreksi Error (stock decremented)', 'BRC-1776616446818', '2026-04-21 03:11:05.321919+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776741077343-688', 'System', 'Manual Correction', 'Marked serial number gyjhnhgv as Damaged for Instax intsax ppn, reason: Penyesuaian Stok (stock decremented)', 'BRC-1776616446818', '2026-04-21 03:11:17.434219+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776741079471-992', 'System', 'Manual Correction', 'Marked serial number sdadasdwqwws as Damaged for Instax intsax ppn, reason: Penyesuaian Stok (stock decremented)', 'BRC-1776616446818', '2026-04-21 03:11:19.562528+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776741089755-471', 'System', 'Manual Correction', 'Marked serial number 3422355253er as Damaged for Instax intsax ppn, reason: Barang Hilang (stock decremented)', 'BRC-1776616446818', '2026-04-21 03:11:29.846142+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776741098589-338', 'System', 'Manual Correction', 'Marked serial number dfsfd as Damaged for FUJIFILM INSTAX, reason: Barang Rusak (stock decremented)', 'BRC-1774849189478', '2026-04-21 03:11:38.680564+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776741291918-9237', 'Mami', 'Staff Created', 'Created staff member: Rudy (role: Staff)', NULL, '2026-04-21 03:14:52.007922+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776741303665-2528', 'System', 'Staff Deleted', 'Deleted staff member: Rudy', NULL, '2026-04-21 03:15:03.755163+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776741446394-8dv4zh', 'Mami', 'Sale Created', 'Sale INV-1776741444573 - 2 items, Total: Rp 16.666.721, Customer: ALDEN RAYHAN', 'INV-1776741444573', '2026-04-21 03:17:24.850843+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776741446394-1ieiaa', 'Mami', 'Sales Deduction', 'Sold 1 unit of Non SN (tanpa SN) to ALDEN RAYHAN', 'BRC-1776740653217', '2026-04-21 03:17:24.850843+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776741446394-evmqf0', 'Mami', 'Sales Deduction', 'Sold 1 unit of Non SN (tanpa SN) to ALDEN RAYHAN', 'BRC-1776740653217', '2026-04-21 03:17:24.850843+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776741633776-qcou1u', 'Mami', 'Sale Created', 'Sale INV-1776741629791 - 2 items, Total: Rp 5.100.002, Customer: ALDEN RAYHAN', 'INV-1776741629791', '2026-04-21 03:20:31.233712+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776741633776-p1qau3', 'Mami', 'Sales Deduction', 'Sold 1 unit of Tes (SN: fdsfdsds) to ALDEN RAYHAN', 'BRC-1776621616110', '2026-04-21 03:20:31.233712+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776741633776-kegg3f', 'Mami', 'Sales Deduction', 'Sold 1 unit of test (tanpa SN) to ALDEN RAYHAN', 'BRC-1774681738193', '2026-04-21 03:20:31.233712+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776741681931-wxn6k5', 'Mami', 'General', 'Marked sale INV-1776650564687 as paid. Loyalty points awarded: 500', 'INV-1776650564687', '2026-04-21 03:21:22.02174+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776741704310-t58gs9', 'Mami', 'General', 'Installment of Rp 2 recorded for sale INV-1776741629791. Total paid: Rp 900.002/Rp 5.100.002', 'INV-1776741629791', '2026-04-21 03:21:44.398476+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776741714040-dniq9m', 'Mami', 'General', 'Marked sale INV-1776741629791 as paid. Loyalty points awarded: 5100', 'INV-1776741629791', '2026-04-21 03:21:54.127645+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776741775347-qx5oyr', 'Mami', 'Sale Created', 'Sale INV-1776741772466 - 1 items, Total: Rp 4.301.193,39, Customer: ALDEN RAYHAN', 'INV-1776741772466', '2026-04-21 03:22:53.836695+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776741775347-mq34bn', 'Mami', 'Sales Deduction', 'Sold 1 unit of Non SN (tanpa SN) to ALDEN RAYHAN', 'BRC-1776740653217', '2026-04-21 03:22:53.836695+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776741800861-5g2e7a', 'Mami', 'General', 'Installment of Rp 5.000 recorded for sale INV-1776741772466. Total paid: Rp 996.218/Rp 4.301.193,39', 'INV-1776741772466', '2026-04-21 03:23:20.972258+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776741818809-w14fmb', 'Mami', 'General', 'Marked sale INV-1776741772466 as paid. Loyalty points awarded: 4301', 'INV-1776741772466', '2026-04-21 03:23:38.899054+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776742566612-q7m6u1', 'Mami', 'Sale Created', 'Sale INV-1776742563746 - 2 items, Total: Rp 11.100, Customer: ANDREAS TJ', 'INV-1776742563746', '2026-04-21 03:36:03.993537+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776742566642-2c6bk2', 'Mami', 'Sales Deduction', 'Sold 1 unit of Non SN (tanpa SN) to ANDREAS TJ', 'BRC-1776740653217', '2026-04-21 03:36:03.993537+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776742566642-ohqogw', 'Mami', 'Sales Deduction', 'Sold 1 unit of Tes (SN: adadsad) to ANDREAS TJ', 'BRC-1776621616110', '2026-04-21 03:36:03.993537+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776742600220-0zpv4n', 'Mami', 'General', 'Installment of Rp 2.500 recorded for sale INV-1776742563746. Total paid: Rp 3.500/Rp 11.100', 'INV-1776742563746', '2026-04-21 03:36:40.330301+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776742618406-a1j60x', 'Mami', 'General', 'Installment of Rp 7.600 recorded for sale INV-1776742563746. Total paid: Rp 11.100/Rp 11.100 (FULLY PAID). Loyalty points awarded: 11', 'INV-1776742563746', '2026-04-21 03:36:58.486796+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776742766892-237', 'Mami', 'Supplier Created', 'Created supplier: tes', '4dbabf5d-528a-45ff-87e2-937be7b90307', '2026-04-21 03:39:26.973353+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776742772570-40', 'System', 'Supplier Deleted', 'Deleted supplier: tes', '4dbabf5d-528a-45ff-87e2-937be7b90307', '2026-04-21 03:39:32.650779+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776742781853-654', 'Mami', 'Customer Created', 'Created customer: tes, phone: 09180913012', 'CUST-1776742781304', '2026-04-21 03:39:41.938335+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776742787031-836', 'Mami', 'Customer Deleted', 'Deleted customer: tes', 'CUST-1776742781304', '2026-04-21 03:39:47.116087+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776742812147-743', 'Mami', 'Stock Addition', 'Created product tes ts with 1 serial numbers, price: Rp 0, cogs: Rp 15.000, from supplier IDOLA MILLENIUM', 'BRC-1776742811200', '2026-04-21 03:40:12.231817+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776742828426-867', 'System', 'Manual Correction', 'Marked serial number SSSSSS as Damaged for tes ts, reason: Barang Hilang (stock decremented)', 'BRC-1776742811200', '2026-04-21 03:40:28.511288+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776742834640-906', 'System', 'Product Deleted', 'Deleted product: tes ts', 'BRC-1776742811200', '2026-04-21 03:40:34.724389+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776742954459-83', 'Nancy', 'Manual Correction', 'Manual adjust Tes  Non SN: 1 -> 0. Price: Rp 0, COGS: Rp 0. Reason: Restok Barang Baru', 'BRC-1776740653217', '2026-04-21 03:42:34.539127+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776742959771-809', 'System', 'Product Deleted', 'Deleted product: Tes  Non SN', 'BRC-1776740653217', '2026-04-21 03:42:39.851213+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776826535261-525', 'Sifa', 'Stock Addition', 'Created product FUJIFILM  X-M5 BLACK BODY  with 3 serial numbers, price: Rp 0, cogs: Rp 0, from supplier PT. FUJIFILM INDONESIA', 'BRC-1776826533566', '2026-04-22 02:55:35.355727+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776826602802-384', 'Sifa', 'Stock Addition', 'Created product FUJINON XF 35MM F1.4 R with 1 serial numbers, price: Rp 0, cogs: Rp 0, from supplier PT. FUJIFILM INDONESIA', 'BRC-1776826601980', '2026-04-22 02:56:42.892394+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776826667171-197', 'Sifa', 'Stock Addition', 'Created product FUJINON XC 35MM F2 with 2 serial numbers, price: Rp 0, cogs: Rp 0, from supplier PT. FUJIFILM INDONESIA', 'BRC-1776826666010', '2026-04-22 02:57:47.260955+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776826715813-830', 'Sifa', 'Stock Addition', 'Created product SANDISK EXTREME 32GB (N) with 7 units, price: Rp 0, cogs: Rp 0, from supplier PT. FUJIFILM INDONESIA', 'BRC-1776826715304', '2026-04-22 02:58:35.903133+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776826731368-3', 'System', 'Product Deleted', 'Deleted product: Fujifilm Test', 'BRC-1773385731477', '2026-04-22 02:58:51.45788+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776826743883-221', 'System', 'Product Deleted', 'Deleted product: godox test', 'BRC-1774681738193', '2026-04-22 02:59:03.972598+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776826841658-70', 'Sifa', 'Stock Addition', 'Created product FUJIFILM X-E5 BODY SILVER with 1 serial numbers, price: Rp 0, cogs: Rp 0, from supplier PT. FUJIFILM INDONESIA', 'BRC-1776826840791', '2026-04-22 03:00:41.748208+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776826926838-860', 'Sifa', 'Stock Addition', 'Created product FUJIFILM X-T30 III BODY SILVER with 2 serial numbers, price: Rp 0, cogs: Rp 0, from supplier PT. FUJIFILM INDONESIA', 'BRC-1776826925517', '2026-04-22 03:02:06.932671+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776827645486-210', 'Sifa', 'Customer Created', 'Created customer: SILVIA YUNIA AGUS PUTRI, phone: 08234287', 'CUST-1776827643889', '2026-04-22 03:14:05.582949+00');
INSERT INTO public.audit_logs VALUES ('LOG-1776841010946-321', 'Sifa', 'Customer Created', 'Created customer: MOCHAMMAD, phone: 082331844495', 'CUST-1776841010410', '2026-04-22 06:56:51.025311+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777614415835-1370', 'Nancy', 'Login', 'Staff Nancy logged in', NULL, '2026-05-01 05:46:55.925979+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777616207679-8850', 'Mami', 'Login', 'Staff Mami logged in', NULL, '2026-05-01 06:16:47.757284+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777621034750-4gqdao', 'Sifa', 'Sale Created', 'Sale INV-1777621032080 - 2 items, Total: Rp 30.000.000, Customer: ALDEN RAYHAN', 'INV-1777621032080', '2026-05-01 07:37:12.434151+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777621034781-m2uflp', 'Sifa', 'Sales Deduction', 'Sold 1 unit of X-T30 III BODY SILVER (SN: 58036367) to ALDEN RAYHAN', 'BRC-1776826925517', '2026-05-01 07:37:12.434151+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777621034781-1pwelb', 'Sifa', 'Sales Deduction', 'Sold 1 unit of X-T30 III BODY SILVER (SN: 57028316) to ALDEN RAYHAN', 'BRC-1776826925517', '2026-05-01 07:37:12.434151+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777621219193-xixan5', 'Sifa', 'Sale Created', 'Sale INV-1777621215535 - 1 items, Total: Rp 19.980.000, Customer: INDIRA RESTY ARDHANA', 'INV-1777621215535', '2026-05-01 07:40:16.881556+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777621219223-3cnkm5', 'Sifa', 'Sales Deduction', 'Sold 1 unit of X-E5 BODY SILVER (SN: 5DA07299) to INDIRA RESTY ARDHANA', 'BRC-1776826840791', '2026-05-01 07:40:16.881556+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777621600505-415', 'Sifa', 'Stock Addition', 'Created product SONY ZV-E10K with 1 serial numbers, price: Rp 0, cogs: Rp 0, from supplier PT. SONY INDONESIA', 'BRC-1777621598471', '2026-05-01 07:46:40.584155+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777621634554-662', 'Sifa', 'Customer Created', 'Created customer: NABILA RAHMANIA, phone: 081358571122', 'CUST-1777621634043', '2026-05-01 07:47:14.629176+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777621690401-0t7dgg', 'Sifa', 'Sale Created', 'Sale INV-1777621687866 - 1 items, Total: Rp 11.655.000, Customer: NABILA RAHMANIA', 'INV-1777621687866', '2026-05-01 07:48:08.11246+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777621690401-iwk4oz', 'Sifa', 'Sales Deduction', 'Sold 1 unit of ZV-E10K (SN: 7455397-Q) to NABILA RAHMANIA', 'BRC-1777621598471', '2026-05-01 07:48:08.11246+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777794325740-6552', 'Mami', 'Login', 'Staff Mami logged in', NULL, '2026-05-03 07:45:25.558114+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777865672652-875', 'Sifa', 'Supplier Created', 'Created supplier: PT. ALTA NIKINDO, phone: -, address: KOMPLEK MANGGA DUA SQUARE BLOK H NO. 1-2 JAKARTA UTARA', '2a30e382-8cba-4690-816f-be9014dbe77c', '2026-05-04 03:34:32.765182+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777865716209-859', 'System', 'Product Deleted', 'Deleted product: FUJIFILM INSTAX', 'BRC-1774849189478', '2026-05-04 03:35:16.321985+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777865923785-85', 'Sifa', 'Stock Addition', 'Created product NIKKOR Z 50MM F/1.4 with 1 units, price: Rp 0, cogs: Rp 0, from supplier PT. ALTA NIKINDO', 'BRC-1777865922088', '2026-05-04 03:38:43.894055+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777865970216-903', 'Sifa', 'Stock Addition', 'Created product NIKKOR  Z 35MM F/1.4 with 1 serial numbers, price: Rp 0, cogs: Rp 0, from supplier PT. ALTA NIKINDO', 'BRC-1777865969328', '2026-05-04 03:39:30.323432+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777866043382-1', 'Sifa', 'Stock Addition', 'Created product NIKON  MH-25A CHARGER with 1 units, price: Rp 0, cogs: Rp 0, from supplier PT. ALTA NIKINDO', 'BRC-1777866042847', '2026-05-04 03:40:43.486946+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777866103602-119', 'Sifa', 'Stock Addition', 'Created product NIKON Z8 BK SG with 1 serial numbers, price: Rp 0, cogs: Rp 0, from supplier PT. ALTA NIKINDO', 'BRC-1777866102710', '2026-05-04 03:41:43.706058+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777866172790-144', 'Sifa', 'Stock Addition', 'Created product NIKON Z6 BK SG 24-120 KIT with 1 serial numbers, price: Rp 0, cogs: Rp 0, from supplier PT. ALTA NIKINDO', 'BRC-1777866171796', '2026-05-04 03:42:52.891698+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777866193467-784', 'System', 'Manual Correction', 'Marked serial number sadsdasd as Damaged for Instax intsax ppn, reason: Penyesuaian Stok (stock decremented)', 'BRC-1776616446818', '2026-05-04 03:43:13.567957+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777866209729-378', 'System', 'Product Deleted', 'Deleted product: Instax intsax ppn', 'BRC-1776616446818', '2026-05-04 03:43:29.829695+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777866227124-233', 'System', 'Manual Correction', 'Marked serial number fasdsdsaas as Damaged for Tes1234 Tes, reason: Penyesuaian Stok (stock decremented)', 'BRC-1776621616110', '2026-05-04 03:43:47.22499+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777866316744-297', 'Sifa', 'Product Restored', 'Restored product: Sony XCV 31', 'BRC-1773381211943', '2026-05-04 03:45:16.836115+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777868064204-276', 'Sifa', 'Customer Created', 'Created customer: BERNADETA DALIMA, phone: 081238166066', 'CUST-1777868062451', '2026-05-04 04:14:24.302945+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777868154834-238', 'Sifa', 'Customer Created', 'Created customer: HARYANTO TARZAN, phone: 081238166066', 'CUST-1777868154320', '2026-05-04 04:15:54.934219+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777868210917-wl5owa', 'Sifa', 'Sale Created', 'Sale INV-1777868208368 - 1 items, Total: Rp 54.500.000, Customer: HARYANTO TARZAN', 'INV-1777868208368', '2026-05-04 04:16:48.628851+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777868210948-jyu7rv', 'Sifa', 'Sales Deduction', 'Sold 1 unit of Z8 BK SG (SN: 7019341) to HARYANTO TARZAN', 'BRC-1777866102710', '2026-05-04 04:16:48.628851+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777868748114-716', 'Sifa', 'Supplier Created', 'Created supplier: DPR, phone: -, address: JAKARTA', '43d12f46-6f40-4e88-9de2-cab2cf6330a6', '2026-05-04 04:25:48.219101+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777873652647-976', 'Sifa', 'Stock Addition', 'Created product FUJIFILM INSTAX FILM MINI TWIN WW2 with 1 units, price: Rp 0, cogs: Rp 0, from supplier PT. FUJIFILM INDONESIA', 'BRC-1777873652077', '2026-05-04 05:47:32.736691+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777873684600-cyxl0x', 'Sifa', 'Sale Created', 'Sale INV-1777873682813 - 1 items, Total: Rp 265.000, Customer: RASHEESA RATU S', 'INV-1777873682813', '2026-05-04 05:48:03.05765+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777873684629-45m8er', 'Sifa', 'Sales Deduction', 'Sold 1 unit of INSTAX FILM MINI TWIN WW2 (tanpa SN) to RASHEESA RATU S', 'BRC-1777873652077', '2026-05-04 05:48:03.05765+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777883213228-340', 'Sifa', 'Customer Created', 'Created customer: WAHYU AFRIANSYAH, phone: +62 817-866-678', 'CUST-1777883212682', '2026-05-04 08:26:53.319469+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777883255130-342', 'Sifa', 'Stock Addition', 'Created product CANON G7 MARK III SILVER with 1 serial numbers, price: Rp 0, cogs: Rp 0, from supplier PT. DATACRIP', 'BRC-1777883254139', '2026-05-04 08:27:35.22117+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777883326468-m5zmkd', 'Sifa', 'Sale Created', 'Sale INV-1777883323947 - 1 items, Total: Rp 0, Customer: WAHYU AFRIANSYAH', 'INV-1777883323947', '2026-05-04 08:28:44.198918+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777883326496-zzxjca', 'Sifa', 'Sales Deduction', 'Sold 1 unit of G7 MARK III SILVER (SN: 21218082000429) to WAHYU AFRIANSYAH', 'BRC-1777883254139', '2026-05-04 08:28:44.198918+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777886618978-786', 'Sifa', 'Stock Addition', 'Created product DJI RS 5 COMBO with 2 serial numbers, price: Rp 0, cogs: Rp 0, from supplier PT. SINAR EKA SELARAS', 'BRC-1777886617671', '2026-05-04 09:23:39.087522+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777886656866-228', 'Sifa', 'Stock Addition', 'Created product DJI  OSMO POCKET 4 CREATOR COMBO with 2 serial numbers, price: Rp 0, cogs: Rp 0, from supplier PT. SINAR EKA SELARAS', 'BRC-1777886655639', '2026-05-04 09:24:16.976596+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777889226195-787', 'Sifa', 'Customer Created', 'Created customer: BEN IRAWAN LIMANTARA, phone: +62 822-2131-3013', 'CUST-1777889224183', '2026-05-04 10:07:06.292603+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777890075651-283', 'Sifa', 'Stock Addition', 'Created product LEXAR MICRO SDXC 256GB WITH ADAPTER with 1 units, price: Rp 0, cogs: Rp 0, from supplier DPR', 'BRC-1777890075047', '2026-05-04 10:21:15.744001+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777890166375-r5k9tg', 'Sifa', 'Sale Created', 'Sale INV-1777890163459 - 2 items, Total: Rp 11.800.000, Customer: BEN IRAWAN LIMANTARA', 'INV-1777890163459', '2026-05-04 10:22:43.715056+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777890166405-rjz814', 'Sifa', 'Sales Deduction', 'Sold 1 unit of OSMO POCKET 4 CREATOR COMBO (SN: ANGZP380029LEE) to BEN IRAWAN LIMANTARA', 'BRC-1777886655639', '2026-05-04 10:22:43.715056+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777890166405-07zzw9', 'Sifa', 'Sales Deduction', 'Sold 1 unit of MICRO SDXC 256GB WITH ADAPTER (tanpa SN) to BEN IRAWAN LIMANTARA', 'BRC-1777890075047', '2026-05-04 10:22:43.715056+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777956858442-983', 'Sifa', 'Customer Created', 'Created customer: KIANG KUPANG, phone: 085239080000', 'CUST-1777956857909', '2026-05-05 04:54:18.545388+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777956952319-446', 'Sifa', 'Stock Addition', 'Created product HOLLYLAND  LARK M2 DUO COMBO with 1 serial numbers, price: Rp 0, cogs: Rp 0, from supplier PT. DENKA PRATAMA INDONESIA', 'BRC-1777956951196', '2026-05-05 04:55:52.428114+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777957040662-203', 'Sifa', 'Stock Addition', 'Created product K&F  TRIPOD K254A3 + BH-28L (SA254M2) with 1 units, price: Rp 0, cogs: Rp 0, from supplier DPR', 'BRC-1777957040059', '2026-05-05 04:57:20.771817+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777957275168-kh1eww', 'Sifa', 'Sale Created', 'Sale INV-1777957271216 - 2 items, Total: Rp 2.850.000, Customer: KIANG KUPANG', 'INV-1777957271216', '2026-05-05 05:01:12.563885+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777957275199-qxporq', 'Sifa', 'Sales Deduction', 'Sold 1 unit of TRIPOD K254A3 + BH-28L (SA254M2) (tanpa SN) to KIANG KUPANG', 'BRC-1777957040059', '2026-05-05 05:01:12.563885+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777957275199-0v0zs9', 'Sifa', 'Sales Deduction', 'Sold 1 unit of LARK M2 DUO COMBO (SN: C63X222LEPT) to KIANG KUPANG', 'BRC-1777956951196', '2026-05-05 05:01:12.563885+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777957304712-49', 'Sifa', 'Customer Updated', 'Updated customer: name: KIANG KUPANG -> KIAN KUPANG, email: - -> -, npwp: - -> -', 'CUST-1777956857909', '2026-05-05 05:01:44.813385+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777961349442-878', 'Sifa', 'Customer Created', 'Created customer: YOHANES CORNELIUS, phone: 085785617766', 'CUST-1777961348903', '2026-05-05 06:09:09.532758+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777962538728-ahqspn', 'Sifa', 'Sale Created', 'Sale INV-1777962533893 - 1 items, Total: Rp 10.300.000, Customer: YOHANES CORNELIUS', 'INV-1777962533893', '2026-05-05 06:28:56.398973+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777962538760-nqwaa1', 'Sifa', 'Sales Deduction', 'Sold 1 unit of OSMO POCKET 4 CREATOR COMBO (SN: ANGZP3M00204ZG) to YOHANES CORNELIUS', 'BRC-1777886655639', '2026-05-05 06:28:56.398973+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777964013059-102', 'Sifa', 'Customer Created', 'Created customer: HAWILA BERKAT SEJAHTERA, phone: 085646741048', 'CUST-1777964012520', '2026-05-05 06:53:33.151671+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777964094256-996', 'Sifa', 'Stock Addition', 'Manual adjust FUJIFILM INSTAX FILM MINI TWIN WW2: 0 -> 6. Price: Rp 0, COGS: Rp 0. Reason: Restok Barang Baru. Supplier: PT. FUJIFILM INDONESIA. Date: 2026-05-05. Invoice: TODAY', 'BRC-1777873652077', '2026-05-05 06:54:54.348408+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777964461860-679', 'System', 'Stock Addition', 'Added 1 serial number(s) to CANON G7 MARK III SILVER from supplier PT. ALTA NIKINDO on 2026-05-05, invoice: stock, reason: Penyesuaian Stok. SN: 21218082000428', 'BRC-1777883254139', '2026-05-05 07:01:02.332403+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777964511844-624', 'Sifa', 'Customer Created', 'Created customer: SYARIFA NUR FADILAH, phone: -', 'CUST-1777964511279', '2026-05-05 07:01:51.937336+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777964777622-sl7zfd', 'Sifa', 'Sale Created', 'Sale INV-1777964773410 - 1 items, Total: Rp 16.500.000, Customer: SYARIFA NUR FADILAH', 'INV-1777964773410', '2026-05-05 07:06:15.225467+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777964777657-4wmg6m', 'Sifa', 'Sales Deduction', 'Sold 1 unit of G7 MARK III SILVER (SN: 21218082000428) to SYARIFA NUR FADILAH', 'BRC-1777883254139', '2026-05-05 07:06:15.225467+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777974692975-446', 'Sifa', 'Customer Created', 'Created customer: ANDRE TJAHYONO, phone: 081218621410', 'CUST-1777974692432', '2026-05-05 09:51:33.076347+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777974780792-543', 'Sifa', 'Stock Addition', 'Created product FUJIFILM X-S20 15-45MM BLACK with 1 serial numbers, price: Rp 0, cogs: Rp 0, from supplier PT. FUJIFILM INDONESIA', 'BRC-1777974779855', '2026-05-05 09:53:00.89487+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777974986951-oy5tt7', 'Sifa', 'Sale Created', 'Sale INV-1777974983248 - 1 items, Total: Rp 21.500.000, Customer: ANDRE TJAHYONO', 'INV-1777974983248', '2026-05-05 09:56:24.655209+00');
INSERT INTO public.audit_logs VALUES ('LOG-1777974986982-4w6g58', 'Sifa', 'Sales Deduction', 'Sold 1 unit of X-S20 15-45MM BLACK (SN: 6AL00197/5DC57878) to ANDRE TJAHYONO', 'BRC-1777974779855', '2026-05-05 09:56:24.655209+00');
INSERT INTO public.audit_logs VALUES ('LOG-1778038777919-598', 'Sifa', 'Customer Created', 'Created customer: DEWI CHRISTIANI WONGKAR, phone: -', 'CUST-1778038777392', '2026-05-06 03:39:37.999906+00');
INSERT INTO public.audit_logs VALUES ('LOG-1778038816198-jeugxc', 'Sifa', 'Sale Created', 'Sale INV-1778038814307 - 1 items, Total: Rp 265.000, Customer: DEWI CHRISTIANI WONGKAR', 'INV-1778038814307', '2026-05-06 03:40:14.538828+00');
INSERT INTO public.audit_logs VALUES ('LOG-1778038816229-jaemzk', 'Sifa', 'Sales Deduction', 'Sold 1 unit of INSTAX FILM MINI TWIN WW2 (tanpa SN) to DEWI CHRISTIANI WONGKAR', 'BRC-1777873652077', '2026-05-06 03:40:14.538828+00');
INSERT INTO public.audit_logs VALUES ('LOG-1778045489984-411', 'Sifa', 'Supplier Created', 'Created supplier: PREMIERE PHOTOGRAPHY, phone: -, address: JAKARTA', '281b4dfc-e186-4128-890d-6adb16a23d43', '2026-05-06 05:31:30.093076+00');
INSERT INTO public.audit_logs VALUES ('LOG-1778045535915-193', 'Sifa', 'Stock Addition', 'Created product BATTERY DUMMY FW-50 NON with 3 units, price: Rp 0, cogs: Rp 0, from supplier PREMIERE PHOTOGRAPHY', 'BRC-1778045535342', '2026-05-06 05:32:16.02869+00');
INSERT INTO public.audit_logs VALUES ('LOG-1778045585921-315', 'Sifa', 'Supplier Created', 'Created supplier: DUTA SUKSES INDONESIA, phone: -, address: JAKARTA', '40577a64-3175-406e-8e5f-9e4376631c5e', '2026-05-06 05:33:06.034923+00');
INSERT INTO public.audit_logs VALUES ('LOG-1778045775194-534', 'Sifa', 'Stock Addition', 'Created product KODAK PIXPRO FZ55 SILVER NON with 10 serial numbers, price: Rp 0, cogs: Rp 2.150.000, from supplier DUTA SUKSES INDONESIA', 'BRC-1778045769816', '2026-05-06 05:36:15.309338+00');
INSERT INTO public.audit_logs VALUES ('LOG-1778124860440-248', 'Sifa', 'Customer Created', 'Created customer: CRYSTAL ELVARETTA, phone: 081235696363', 'CUST-1778124859823', '2026-05-07 03:34:20.549556+00');


--
-- TOC entry 4349 (class 0 OID 23071)
-- Dependencies: 387
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.customers VALUES ('CUST-1775927954455', 'apakoki', 'dsaadaasdasdas', '', 'saddasasdsada', 'dasdsadasdasdsadad', 0, '2026-04-11 17:19:14.742052+00', '2026-04-17 17:35:31.591437+00', true);
INSERT INTO public.customers VALUES ('CUST-1772090960575', 'WAHONO DARJANTO', '+62 812-3008-575', NULL, 'SURABAYA', '3578062412470003', 0, '2026-02-26 07:29:20.884515+00', '2026-02-26 07:29:20.884515+00', false);
INSERT INTO public.customers VALUES ('CUST-1772091506567', 'INDIRA RESTY ARDHANA', '089523330866', NULL, 'SIDOARJO', '3515146608020006', 0, '2026-02-26 07:38:26.827555+00', '2026-02-26 07:38:26.827555+00', false);
INSERT INTO public.customers VALUES ('CUST-1772091846645', 'LAI,YONGHUA', '+62 821-4385-1272', NULL, 'GUANGDONG CHINA', 'EK8737977', 0, '2026-02-26 07:44:06.934642+00', '2026-02-26 07:44:06.934642+00', false);
INSERT INTO public.customers VALUES ('CUST-1772092128211', 'CHYNTYA RANI MEGAWATI', '082232740011', NULL, 'SIDOARJO', '3515134601960001', 0, '2026-02-26 07:48:48.469596+00', '2026-02-26 07:48:48.469596+00', false);
INSERT INTO public.customers VALUES ('CUST-1772092256327', 'S. CHRISNATA TRI P', '08979755170', NULL, 'SIDOARJO', '3515182512770009', 0, '2026-02-26 07:50:56.592484+00', '2026-02-26 07:50:56.592484+00', false);
INSERT INTO public.customers VALUES ('CUST-1772092471195', 'MUHAMMAD MUTAWWIDZI PASHA', '081217210201', NULL, 'GRESIK', '3525120505890001', 0, '2026-02-26 07:54:31.451928+00', '2026-02-26 07:54:31.451928+00', false);
INSERT INTO public.customers VALUES ('CUST-1772092572600', 'HUANG KAI HOO', '-', NULL, 'CHINA', 'EK7149423', 0, '2026-02-26 07:56:12.88597+00', '2026-02-26 07:56:12.88597+00', false);
INSERT INTO public.customers VALUES ('CUST-1772092657313', 'R. HARYO SETIAWAN', '08123177235', NULL, 'SURABAYA', '3578261608780002', 0, '2026-02-26 07:57:37.579837+00', '2026-02-26 07:57:37.579837+00', false);
INSERT INTO public.customers VALUES ('CUST-1772092979492', 'PT. BADAN CIPUTRA GOLF', '-', NULL, 'JL. CITRA RAYA UTAMA,KOTA MANDIRI CITRA RAYA LAKARSANTRI, LAKARSANTRI KOTA SURABAYA JAWA TIMUR 60211', '015447113631000', 0, '2026-02-26 08:03:00.859472+00', '2026-02-26 08:03:00.859472+00', false);
INSERT INTO public.customers VALUES ('CUST-1772092981139', 'PT. BADAN CIPUTRA GOLF', '-', NULL, 'JL. CITRA RAYA UTAMA,KOTA MANDIRI CITRA RAYA LAKARSANTRI, LAKARSANTRI KOTA SURABAYA JAWA TIMUR 60211', '015447113631000', 0, '2026-02-26 08:03:01.416868+00', '2026-02-26 08:03:01.416868+00', false);
INSERT INTO public.customers VALUES ('CUST-1772093155116', 'M. HARI PROKLAMANTO', '081334446403', NULL, 'SURABAYA', '3509241708940004', 0, '2026-02-26 08:05:55.39198+00', '2026-02-26 08:05:55.39198+00', false);
INSERT INTO public.customers VALUES ('CUST-1772093212304', 'DESI YANTO', '081332233499', NULL, '-', '3578120505870001', 0, '2026-02-26 08:06:52.588273+00', '2026-02-26 08:06:52.588273+00', false);
INSERT INTO public.customers VALUES ('CUST-1772093315174', 'MUHAMMAD FAIZ ASSEGAF', '0895402910929', NULL, 'PONTIANAK', '6171022702040002', 0, '2026-02-26 08:08:35.470699+00', '2026-02-26 08:08:35.470699+00', false);
INSERT INTO public.customers VALUES ('CUST-1772093576259', 'HERY SAPUTRA ', '085708091267', NULL, NULL, '3517031910880001', 0, '2026-02-26 08:12:56.55516+00', '2026-02-26 08:12:56.55516+00', false);
INSERT INTO public.customers VALUES ('CUST-1772094953618', 'M. EDY PURWANTO', '085713508805', NULL, 'BOJONEGORO', '3522011010850006', 0, '2026-02-26 08:35:53.881366+00', '2026-02-26 08:35:53.881366+00', false);
INSERT INTO public.customers VALUES ('CUST-1772095024976', 'META LIANA', '081221590488', NULL, 'SIDOARJO', '3207096902000001', 0, '2026-02-26 08:37:05.22951+00', '2026-02-26 08:37:05.22951+00', false);
INSERT INTO public.customers VALUES ('CUST-1772095154397', 'DELFIN BAPTISTA', '-', NULL, 'TIMOR-LESTE', '0182834C', 0, '2026-02-26 08:39:14.653445+00', '2026-02-26 08:39:14.653445+00', false);
INSERT INTO public.customers VALUES ('CUST-1776487390497', 'Ab cd', '45453', NULL, 'Fddggf', 'tetyrrytu', 0, '2026-04-18 04:43:10.832165+00', '2026-04-19 01:55:49.704088+00', true);
INSERT INTO public.customers VALUES ('CUST-1776487388237', 'Ab cd', '45453', NULL, 'Fddggf', 'tetyrrytu', 0, '2026-04-18 04:43:08.572396+00', '2026-04-19 01:55:54.64406+00', true);
INSERT INTO public.customers VALUES ('CUST-1772093533241', 'LASKAR AMARUTA ALFAJRI', '082139370797', NULL, 'PASURUAN', '3514071010970001', 214712, '2026-02-26 08:12:13.521441+00', '2026-04-19 16:29:04.33405+00', false);
INSERT INTO public.customers VALUES ('CUST-1772047219640', 'Joko', '089801294036', NULL, 'Jl. Jalan 123', NULL, 1087, '2026-02-25 19:20:19.795481+00', '2026-04-19 01:56:48.915151+00', true);
INSERT INTO public.customers VALUES ('CUST-1772091505724', 'INDIRA RESTY ARDHANA', '089523330866', NULL, 'SIDOARJO', '3515146608020006', 19980, '2026-02-26 07:38:26.106596+00', '2026-05-01 07:40:16.881556+00', false);
INSERT INTO public.customers VALUES ('CUST-1776458534420', 'Tess BBB', '089', '', 'Jalan Jla', '21.23', 0, '2026-04-17 20:42:13.147267+00', '2026-04-17 20:42:59.989974+00', true);
INSERT INTO public.customers VALUES ('CUST-1776563970833', 'asdads', 'asdas', NULL, 'dasda', NULL, 0, '2026-04-19 01:59:31.725177+00', '2026-04-19 01:59:39.843079+00', true);
INSERT INTO public.customers VALUES ('CUST-1772094811269', 'ALDEN RAYHAN', '085241994850', NULL, 'KENDARI', '7471051903030001', 56567, '2026-02-26 08:33:34.885933+00', '2026-05-01 07:37:12.434151+00', false);
INSERT INTO public.customers VALUES ('CUST-1776483881118', 'PT. BANGUN JAYA PEDIA', '087754777922', NULL, 'JL.MAYJEND HR. MUHAMMAD NO.41 PRADAH KALIKENDAL
UP : EKHY', NULL, 0, '2026-04-18 03:44:41.405057+00', '2026-04-18 03:44:41.405057+00', false);
INSERT INTO public.customers VALUES ('CUST-1776483926934', 'Sosoksd', 'owiekkdd', NULL, 'Susjwjw', 'Ssss', 0, '2026-04-18 03:45:27.379333+00', '2026-04-18 03:45:42.019579+00', true);
INSERT INTO public.customers VALUES ('CUST-1772822469789', 'Sulaeman', '08980131065', NULL, NULL, NULL, 155, '2026-03-06 18:41:10.15213+00', '2026-03-06 18:41:11.784542+00', false);
INSERT INTO public.customers VALUES ('CUST-1772847641392', 'James', '0818596048385', NULL, NULL, NULL, 155, '2026-03-07 01:40:42.012823+00', '2026-03-07 01:40:44.766541+00', false);
INSERT INTO public.customers VALUES ('CUST-1776617779315', 'tesesfs', 'ddss', NULL, ' ', 'xvvv', 0, '2026-04-19 16:56:19.600698+00', '2026-04-19 17:00:48.741607+00', true);
INSERT INTO public.customers VALUES ('CUST-1776483971706', '.sla.s', '#7#7)#', NULL, 'Jsjjsjs', 'Kskksmd', 0, '2026-04-18 03:46:12.063776+00', '2026-04-18 03:46:17.749231+00', true);
INSERT INTO public.customers VALUES ('CUST-1772861625839', 'CV. ANUGRAH PRATAMA', '-', NULL, 'JK. KARIMUN JAWA NO. 2 RT.001 RW.004 GUBENG, SURABAYA', '018796250606000', 0, '2026-03-07 05:33:46.134265+00', '2026-03-07 05:33:46.134265+00', false);
INSERT INTO public.customers VALUES ('CUST-1776484019302', 'PT. BANGUN JAYA PEDIA', '087754777922', NULL, 'UP :  EKHY', NULL, 0, '2026-04-18 03:46:59.54606+00', '2026-04-18 03:46:59.54606+00', false);
INSERT INTO public.customers VALUES ('CUST-1772092334065', 'ANIS CHA', '085852201002', NULL, 'SURABAYA', '3526034208930001', 5848, '2026-02-26 07:52:14.419874+00', '2026-04-17 17:31:10.05409+00', false);
INSERT INTO public.customers VALUES ('CUST-1776484072450', 'PT. Bangun', '93882342334', NULL, 'Up : odkfdsjd', NULL, 0, '2026-04-18 03:47:53.025708+00', '2026-04-18 03:48:10.056629+00', true);
INSERT INTO public.customers VALUES ('CUST-1776563970738', 'asdads', 'asdas', NULL, 'dasda', NULL, 0, '2026-04-19 01:59:31.635474+00', '2026-04-19 02:00:32.020804+00', true);
INSERT INTO public.customers VALUES ('CUST-1776563950420', 'asdads', 'asdas', NULL, 'dasda', NULL, 0, '2026-04-19 01:59:11.33718+00', '2026-04-19 02:00:35.728379+00', true);
INSERT INTO public.customers VALUES ('CUST-1776563967409', 'asdads', 'asdas', NULL, 'dasda', NULL, 0, '2026-04-19 01:59:28.314477+00', '2026-04-19 02:00:39.37657+00', true);
INSERT INTO public.customers VALUES ('CUST-1776563967546', 'asdads', 'asdas', NULL, 'dasda', NULL, 0, '2026-04-19 01:59:28.448346+00', '2026-04-19 02:00:43.010125+00', true);
INSERT INTO public.customers VALUES ('CUST-1776563970481', 'asdads', 'asdas', NULL, 'dasda', NULL, 0, '2026-04-19 01:59:31.381145+00', '2026-04-19 02:00:46.273718+00', true);
INSERT INTO public.customers VALUES ('CUST-1776563967845', 'asdads', 'asdas', NULL, 'dasda', NULL, 0, '2026-04-19 01:59:28.741111+00', '2026-04-19 02:00:50.126456+00', true);
INSERT INTO public.customers VALUES ('CUST-1776564011709', 'ashdvs', 'ddsdfs', NULL, 'sdsddfs', NULL, 0, '2026-04-19 02:00:12.640171+00', '2026-04-19 02:00:54.533165+00', true);
INSERT INTO public.customers VALUES ('CUST-1776563955087', 'asdads', 'asdas', NULL, 'dasda', NULL, 0, '2026-04-19 01:59:16.019673+00', '2026-04-19 02:00:58.370274+00', true);
INSERT INTO public.customers VALUES ('CUST-1776563967703', 'asdads', 'asdas', NULL, 'dasda', NULL, 0, '2026-04-19 01:59:28.610816+00', '2026-04-19 02:01:01.803562+00', true);
INSERT INTO public.customers VALUES ('CUST-1776563967177', 'asdads', 'asdas', NULL, 'dasda', NULL, 0, '2026-04-19 01:59:28.088749+00', '2026-04-19 02:01:07.002364+00', true);
INSERT INTO public.customers VALUES ('CUST-1776484005344', 'Kskksmx', ')2))#)-', NULL, 'Jsjsjsjjs', NULL, 500, '2026-04-18 03:46:45.659221+00', '2026-04-20 04:17:24.301358+00', false);
INSERT INTO public.customers VALUES ('CUST-1776563948417', 'asdads', 'asdas', NULL, 'dasda', NULL, 0, '2026-04-19 01:59:09.330651+00', '2026-04-19 13:08:02.607774+00', true);
INSERT INTO public.customers VALUES ('CUST-1776617521286', 'dsd', 'adadascx', '', 'cxzcczcx', 'xzcc', 0, '2026-04-19 16:52:01.558362+00', '2026-04-19 16:52:43.928739+00', true);
INSERT INTO public.customers VALUES ('CUST-1776483882471', 'PT. BANGUN JAYA PEDIA', '087754777922', NULL, 'JL.MAYJEND HR. MUHAMMAD NO.41 PRADAH KALIKENDAL
UP : EKHY', NULL, 0, '2026-04-18 03:44:42.695724+00', '2026-04-19 16:51:40.433859+00', true);
INSERT INTO public.customers VALUES ('CUST-1772093081316', 'EDY PRIANTO', '082229093658', NULL, 'SURABAYA', '3509020305840001', 18635, '2026-02-26 08:04:41.585304+00', '2026-04-21 03:07:39.598871+00', false);
INSERT INTO public.customers VALUES ('CUST-1772856667104', 'Andy', '081234556789', NULL, NULL, NULL, 66362, '2026-03-07 04:11:07.434298+00', '2026-04-19 16:51:00.642985+00', true);
INSERT INTO public.customers VALUES ('CUST-1776486283467', 'Test', '93883', NULL, 'Shjsmndd', 'Jsjjsjd', 0, '2026-04-18 04:26:00.519489+00', '2026-04-19 16:52:08.235508+00', true);
INSERT INTO public.customers VALUES ('CUST-1776564009798', 'Testing', '012910522234', '', 'sdsddfs', '', 0, '2026-04-19 02:00:10.715109+00', '2026-04-19 16:52:15.888099+00', true);
INSERT INTO public.customers VALUES ('CUST-1776591901335', 'Tes 321', '08912310931r23432 ', '', 'Jalananzxccxz', '22.403.345.4340.0694', 0, '2026-04-19 09:45:01.565512+00', '2026-04-19 16:56:10.52177+00', true);
INSERT INTO public.customers VALUES ('CUST-1772074658861', 'Budi Handoko', '085219203941', '', 'Jalan bahagia nomer sinar', '', 27145, '2026-02-26 02:57:39.126982+00', '2026-04-19 17:02:12.691618+00', true);
INSERT INTO public.customers VALUES ('CUST-1772092021695', 'CHARISSA PUTRI', '081332622323', NULL, 'SURABAYA', '3578065902040006', 5522846, '2026-02-26 07:47:01.963037+00', '2026-04-20 03:40:12.42801+00', false);
INSERT INTO public.customers VALUES ('CUST-1776659167730', 'Test 123', '08901230193', NULL, 'Jalan', '02.034.034.2034.3233', 0, '2026-04-20 04:26:07.980854+00', '2026-04-20 04:26:20.070257+00', true);
INSERT INTO public.customers VALUES ('CUST-1776618195741', 'SFS', '09180913012', '', 'ffs', '------', 0, '2026-04-19 17:03:16.032301+00', '2026-04-21 03:01:23.989384+00', true);
INSERT INTO public.customers VALUES ('CUST-1772091570940', 'DIAS PRANOTO', '-', NULL, 'SIDOARJO', '3515180810790005', 633, '2026-02-26 07:39:31.201758+00', '2026-04-21 03:03:11.120862+00', false);
INSERT INTO public.customers VALUES ('CUST-1772095208915', 'ANDREAS TJ', '08155012340', NULL, 'SIDOARJO', '3515162211730001', 52701, '2026-02-26 08:40:09.167504+00', '2026-04-21 03:36:58.132247+00', false);
INSERT INTO public.customers VALUES ('CUST-1776740995203', 'Isisks', '@@7)@', NULL, 'Ajjaa', 'Sajja', 0, '2026-04-21 03:09:55.4917+00', '2026-04-21 03:10:15.255633+00', true);
INSERT INTO public.customers VALUES ('CUST-1776742781304', 'tes', '09180913012', NULL, 'ffs', '------', 0, '2026-04-21 03:39:41.556384+00', '2026-04-21 03:39:46.735443+00', true);
INSERT INTO public.customers VALUES ('CUST-1776827643889', 'SILVIA YUNIA AGUS PUTRI', '08234287', NULL, 'MALANG', '3507044703040007', 0, '2026-04-22 03:14:05.217528+00', '2026-04-22 03:14:05.217528+00', false);
INSERT INTO public.customers VALUES ('CUST-1776841010410', 'MOCHAMMAD', '082331844495', NULL, 'SURABAYA', '3578050204830001', 0, '2026-04-22 06:56:50.650582+00', '2026-04-22 06:56:50.650582+00', false);
INSERT INTO public.customers VALUES ('CUST-1777621634043', 'NABILA RAHMANIA', '081358571122', NULL, 'SURABAYA', '-', 11655, '2026-05-01 07:47:14.274881+00', '2026-05-01 07:48:08.11246+00', false);
INSERT INTO public.customers VALUES ('CUST-1777868062451', 'BERNADETA DALIMA', '081238166066', NULL, 'NTT', '5310016502820002', 0, '2026-05-04 04:14:23.909475+00', '2026-05-04 04:14:23.909475+00', false);
INSERT INTO public.customers VALUES ('CUST-1777868154320', 'HARYANTO TARZAN', '081238166066', NULL, '-', '-', 54500, '2026-05-04 04:15:54.568278+00', '2026-05-04 04:16:48.628851+00', false);
INSERT INTO public.customers VALUES ('CUST-1777873606729', 'RASHEESA RATU S', '082165041233', NULL, 'SURABAYA', NULL, 265, '2026-05-04 05:46:46.978556+00', '2026-05-04 05:48:03.05765+00', false);
INSERT INTO public.customers VALUES ('CUST-1777883212682', 'WAHYU AFRIANSYAH', '+62 817-866-678', NULL, 'PANGKAL PINANG', '1971031404970002', 0, '2026-05-04 08:26:52.949306+00', '2026-05-04 08:28:44.198918+00', false);
INSERT INTO public.customers VALUES ('CUST-1777889224183', 'BEN IRAWAN LIMANTARA', '+62 822-2131-3013', NULL, 'SURABAYA', '1514-8905-002707', 11800, '2026-05-04 10:07:05.870992+00', '2026-05-04 10:22:43.715056+00', false);
INSERT INTO public.customers VALUES ('CUST-1777956857909', 'KIAN KUPANG', '085239080000', '', 'KUPANG', '', 2850, '2026-05-05 04:54:18.172612+00', '2026-05-05 05:01:44.43685+00', false);
INSERT INTO public.customers VALUES ('CUST-1777961348903', 'YOHANES CORNELIUS', '085785617766', NULL, 'SURABAYA', '3515080707860005', 10300, '2026-05-05 06:09:09.154049+00', '2026-05-05 06:28:56.398973+00', false);
INSERT INTO public.customers VALUES ('CUST-1777964012520', 'HAWILA BERKAT SEJAHTERA', '085646741048', NULL, 'SURABAYA', NULL, 0, '2026-05-05 06:53:32.769551+00', '2026-05-05 06:53:32.769551+00', false);
INSERT INTO public.customers VALUES ('CUST-1777964511279', 'SYARIFA NUR FADILAH', '-', NULL, 'SURABAYA', '3578156211070002', 16500, '2026-05-05 07:01:51.558943+00', '2026-05-05 07:06:15.225467+00', false);
INSERT INTO public.customers VALUES ('CUST-1777974692432', 'ANDRE TJAHYONO', '081218621410', NULL, 'SURABAYA', '3515023003920003', 21500, '2026-05-05 09:51:32.704912+00', '2026-05-05 09:56:24.655209+00', false);
INSERT INTO public.customers VALUES ('CUST-1778038777392', 'DEWI CHRISTIANI WONGKAR', '-', NULL, 'SURABAYA', '-', 265, '2026-05-06 03:39:37.626538+00', '2026-05-06 03:40:14.538828+00', false);
INSERT INTO public.customers VALUES ('CUST-1778124859823', 'CRYSTAL ELVARETTA', '081235696363', NULL, NULL, NULL, 0, '2026-05-07 03:34:20.085077+00', '2026-05-07 03:34:20.085077+00', false);


--
-- TOC entry 4363 (class 0 OID 51058)
-- Dependencies: 401
-- Data for Name: migrations_log; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.migrations_log VALUES ('v1-init', '2026-04-20 03:53:36.2441');


--
-- TOC entry 4350 (class 0 OID 23081)
-- Dependencies: 388
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.products VALUES ('BRC-1774620525678', 'Test', 'Test', 'Body', NULL, 'New', 10000.00, 0.00, 12, 'Official Sony Indonesia', 1, '2026-03-27 14:08:45.381913+00', '2026-03-27 14:08:45.381913+00', 0, true, false, 'PT. DATACRIP', '2026-03-27 00:00:00', true, NULL, NULL);
INSERT INTO public.products VALUES ('BRC-1777865922088', 'NIKKOR', 'Z 50MM F/1.4', 'Lens', NULL, 'New', 0.00, 0.00, 12, 'Official Sony Indonesia', 1, '2026-05-04 03:38:43.480697+00', '2026-05-04 03:38:43.480697+00', 0, false, false, 'PT. ALTA NIKINDO', '2026-05-04 00:00:00', true, NULL, '[{"sn":[],"inv":"26000501","timestamp":"2026-05-04T03:38:42.241Z"}]');
INSERT INTO public.products VALUES ('BRC-1774679629123', 'Test', '6234', 'Body', NULL, 'New', 23000.00, 0.00, 12, 'Official Sony Indonesia', 4, '2026-03-28 06:33:49.255417+00', '2026-03-28 06:33:49.255417+00', 0, true, false, 'PT. DATACRIP', '2026-03-28 00:00:00', true, NULL, NULL);
INSERT INTO public.products VALUES ('BRC-1776452187590', 'Item Withvg', 'INV Number', 'Body', NULL, 'New', 150000.00, 1000003.00, 12, 'Official Sony Indonesia', 0, '2026-04-17 18:56:26.618941+00', '2026-04-18 04:43:52.227063+00', 0, true, false, 'CV. CAMZONE ', '2026-04-18 00:00:00', true, NULL, '[{"sn" : [], "inv" : "INV/123/ABC", "timestamp" : "2026-04-19 17:06:07.32636+00"}]');
INSERT INTO public.products VALUES ('BRC-1774669102013', 'Tes', '9873s', 'Body', NULL, 'New', 20000.00, 50000.00, 9, 'Official Sony Indonesia', 2, '2026-03-28 03:38:21.974613+00', '2026-03-30 05:36:13.013043+00', 0, true, false, 'PT. FUJIFILM INDONESIA', '2026-03-30 00:00:00', true, NULL, NULL);
INSERT INTO public.products VALUES ('BRC-1774635185353', 'Tes', '23452', 'Lens', NULL, 'New', 45000.00, 0.00, 4, 'Distributor', 4, '2026-03-27 18:13:05.325166+00', '2026-03-30 05:37:19.520381+00', 0, true, false, 'PT. DENKA PRATAMA INDONESIA', '2026-03-27 00:00:00', false, NULL, NULL);
INSERT INTO public.products VALUES ('BRC-1777866042847', 'NIKON ', 'MH-25A CHARGER', 'Accessory', NULL, 'New', 0.00, 0.00, 12, 'No Warranty', 1, '2026-05-04 03:40:43.094743+00', '2026-05-04 03:40:43.094743+00', 0, false, false, 'PT. ALTA NIKINDO', '2026-05-04 00:00:00', true, NULL, '[{"sn":[],"inv":"26000501","timestamp":"2026-05-04T03:40:42.989Z"}]');
INSERT INTO public.products VALUES ('BRC-1776826840791', 'FUJIFILM', 'X-E5 BODY SILVER', 'Body', NULL, 'New', 0.00, 0.00, 12, 'Official Sony Indonesia', 0, '2026-04-22 03:00:41.023676+00', '2026-04-22 03:00:41.023676+00', 0, false, true, 'PT. FUJIFILM INDONESIA', '2026-04-22 00:00:00', true, NULL, '[{"sn":["5DA07299"],"inv":"821553269","timestamp":"2026-04-22T03:00:40.934Z"}]');
INSERT INTO public.products VALUES ('BRC-1777865969328', 'NIKKOR ', 'Z 35MM F/1.4', 'Lens', NULL, 'New', 0.00, 0.00, 12, 'Official Sony Indonesia', 1, '2026-05-04 03:39:29.563902+00', '2026-05-04 03:39:29.563902+00', 0, false, true, 'PT. ALTA NIKINDO', '2026-05-04 00:00:00', true, NULL, '[{"sn":["20031049"],"inv":"26000501","timestamp":"2026-05-04T03:39:29.456Z"}]');
INSERT INTO public.products VALUES ('BRC-1773722064202', 'DJI OSMO NANO (128GB)', 'ACTION CAM', 'Body', NULL, 'New', 5750000.00, 0.00, 12, 'Official Sony Indonesia', 0, '2026-03-17 04:34:24.446851+00', '2026-03-30 05:40:51.139911+00', 0, false, true, 'PT. SINAR EKA SELARAS', '2026-03-17 00:00:00', true, NULL, NULL);
INSERT INTO public.products VALUES ('BRC-1777866171796', 'NIKON', 'Z6 BK SG 24-120 KIT', 'Body', NULL, 'New', 0.00, 0.00, 12, 'Official Sony Indonesia', 1, '2026-05-04 03:42:52.10711+00', '2026-05-04 03:42:52.10711+00', 0, false, true, 'PT. ALTA NIKINDO', '2026-05-04 00:00:00', true, NULL, '[{"sn":["7017117"],"inv":"26000501","timestamp":"2026-05-04T03:42:52.005Z"}]');
INSERT INTO public.products VALUES ('BRC-1777866102710', 'NIKON', 'Z8 BK SG', 'Body', NULL, 'New', 0.00, 0.00, 12, 'Official Sony Indonesia', 0, '2026-05-04 03:41:42.982904+00', '2026-05-04 03:41:42.982904+00', 0, false, true, 'PT. ALTA NIKINDO', '2026-05-04 00:00:00', true, NULL, '[{"sn":["7019341"],"inv":"26000501","timestamp":"2026-05-04T03:41:42.879Z"}]');
INSERT INTO public.products VALUES ('BRC-1774885409032', 'Test', '1234', 'Body', NULL, 'New', 120000.00, 100000.00, 12, 'Official Sony Indonesia', 1, '2026-03-30 15:43:28.305389+00', '2026-03-30 15:43:28.305389+00', 0, true, true, 'IDOLA MILLENIUM', '2026-03-30 00:00:00', false, NULL, NULL);
INSERT INTO public.products VALUES ('BRC-1777886617671', 'DJI', 'RS 5 COMBO', 'Body', NULL, 'New', 0.00, 0.00, 12, 'Official Sony Indonesia', 2, '2026-05-04 09:23:37.95753+00', '2026-05-04 09:23:37.95753+00', 0, false, true, 'PT. SINAR EKA SELARAS', '2026-05-04 00:00:00', true, NULL, '[{"sn":["9T3XP3J00839WD","9T3XP3J00839VZ"],"inv":"510106199","timestamp":"2026-05-04T09:23:37.847Z"}]');
INSERT INTO public.products VALUES ('BRC-1777886655639', 'DJI ', 'OSMO POCKET 4 CREATOR COMBO', 'Body', NULL, 'New', 0.00, 0.00, 12, 'Official Sony Indonesia', 0, '2026-05-04 09:24:15.901431+00', '2026-05-04 09:24:15.901431+00', 0, false, true, 'PT. SINAR EKA SELARAS', '2026-05-04 00:00:00', true, NULL, '[{"sn":["ANGZP380029LEE","ANGZP3M00204ZG"],"inv":"510106199","timestamp":"2026-05-04T09:24:15.791Z"}]');
INSERT INTO public.products VALUES ('BRC-1776740653217', 'Tes ', 'Non SN', 'Accessory', NULL, 'New', 0.00, 0.00, 12, 'Toko', 0, '2026-04-21 03:04:14.546627+00', '2026-04-21 03:42:39.499899+00', 0, true, false, 'IDOLA MILLENIUM', '2026-04-21 00:00:00', true, NULL, '[{"sn":[],"inv":"INV123412","timestamp":"2026-04-21T03:04:13.388Z"}]');
INSERT INTO public.products VALUES ('BRC-1776621510672', 'TESTINST', 'SDASSD', 'Body', NULL, 'Used', 1242414.00, 214412421.00, 12, 'Toko', 0, '2026-04-19 17:58:31.079339+00', '2026-04-19 18:00:00.0265+00', 0, true, false, 'PT. DATACRIP', '2026-04-19 00:00:00', true, NULL, '[{"sn":[],"inv":"SDASSDASD","timestamp":"2026-04-19T17:58:30.984Z"},{"sn":[],"inv":"SADASDAA","timestamp":"2026-04-19T17:58:40.712Z"}]');
INSERT INTO public.products VALUES ('BRC-1777974779855', 'FUJIFILM', 'X-S20 15-45MM BLACK', 'Body', NULL, 'New', 0.00, 0.00, 12, 'Official Sony Indonesia', 0, '2026-05-05 09:53:00.124501+00', '2026-05-05 09:53:00.124501+00', 0, false, true, 'PT. FUJIFILM INDONESIA', '2026-05-05 00:00:00', true, NULL, '[{"sn":["6AL00197/5DC57878"],"inv":"TODAY","timestamp":"2026-05-05T09:53:00.022Z"}]');
INSERT INTO public.products VALUES ('BRC-1772075407390', 'Sony ', '5532', 'Body', NULL, 'New', 120000.00, 60000.00, 12, 'Official Sony Indonesia', 3, '2026-02-26 03:10:07.616383+00', '2026-03-30 05:41:05.837976+00', 0, true, true, NULL, NULL, true, NULL, NULL);
INSERT INTO public.products VALUES ('BRC-1774840575626', 'CANON EF 70-200 F2.8L IS III USM', 'LENSA', 'Body', NULL, 'New', 40000000.00, 38850000.00, 12, 'Official Sony Indonesia', 0, '2026-03-30 03:16:15.830586+00', '2026-03-30 05:40:53.942093+00', 0, false, true, 'CV. CAMZONE ', '2026-03-30 00:00:00', true, NULL, NULL);
INSERT INTO public.products VALUES ('BRC-1777873652077', 'FUJIFILM', 'INSTAX FILM MINI TWIN WW2', 'Accessory', NULL, 'New', 0.00, 0.00, 12, 'No Warranty', 5, '2026-05-04 05:47:32.321758+00', '2026-05-05 06:54:53.943073+00', 0, false, false, 'PT. FUJIFILM INDONESIA', '2026-05-05 00:00:00', true, NULL, '[{"sn":[],"inv":"TODAY","timestamp":"2026-05-04T05:47:32.232Z"},{"sn":[],"inv":"TODAY","timestamp":"2026-05-05T06:54:53.851Z"}]');
INSERT INTO public.products VALUES ('BRC-1772017462526', 'Sony ', '1358', 'Body', NULL, 'New', 150000.00, 170000.00, 12, 'Official Sony Indonesia', 1, '2026-02-25 11:04:23.25233+00', '2026-03-30 05:41:07.230824+00', 0, true, true, NULL, NULL, true, NULL, NULL);
INSERT INTO public.products VALUES ('BRC-1773722333794', 'DJI OSMO POCKET 3 CREATOR COMBO', 'ACTION CAM', 'Body', NULL, 'New', 8250000.00, 0.00, 12, 'Official Sony Indonesia', -1, '2026-03-17 04:38:54.049712+00', '2026-03-17 04:38:54.049712+00', 0, false, true, 'PT. SINAR EKA SELARAS', '2026-03-17 00:00:00', true, NULL, NULL);
INSERT INTO public.products VALUES ('BRC-1776448220392', 'asdas', 'ddadss', 'Lens', NULL, 'New', 23123.00, 123213.00, 12, 'Toko', 3, '2026-04-17 17:50:21.073893+00', '2026-04-17 17:50:21.073893+00', 0, true, true, 'PT. FUJIFILM INDONESIA', '2026-04-17 00:00:00', true, NULL, NULL);
INSERT INTO public.products VALUES ('BRC-1776740162749', 'tes', 'tes', 'Body', NULL, 'New', 0.00, 0.00, 12, 'No Warranty', 0, '2026-04-21 02:56:03.004333+00', '2026-04-21 02:59:38.446691+00', 0, true, true, 'IDOLA MILLENIUM', '2026-04-21 00:00:00', false, NULL, '[{"sn":["SNS12313"],"inv":"INV123","timestamp":"2026-04-21T02:56:21.858Z"}]');
INSERT INTO public.products VALUES ('BRC-1773722244587', 'DJI MINI 5 PRO FLY MORE COMBO PLUS (DJI RC2)', 'DRONE', 'Body', NULL, 'New', 18080000.00, 0.00, 12, 'Official Sony Indonesia', 5, '2026-03-17 04:37:34.899985+00', '2026-04-21 03:09:15.175867+00', 0, false, true, 'CV. CAMZONE ', '2026-04-21 00:00:00', true, NULL, '[{"sn":["Sjkdjmckc","Sjkdjmckcsapzx","Sjkdjmckcwwueuuejdx","Sjkdjmckcsapzxwiwiiwed"],"inv":"Tetyshxx","timestamp":"2026-04-21T03:08:41.115Z"},{"sn":["Isikekcm"],"inv":"Jjdncnncc","timestamp":"2026-04-21T03:09:15.081Z"}]');
INSERT INTO public.products VALUES ('BRC-1776826417415', 'FUJIFILM', 'X-M5 + 15-45MM BLACK', 'Body', NULL, 'New', 0.00, 0.00, 12, 'Official Sony Indonesia', 5, '2026-04-22 02:53:38.782404+00', '2026-04-22 02:53:38.782404+00', 0, false, true, 'PT. FUJIFILM INDONESIA', '2026-04-22 00:00:00', true, NULL, '[{"sn":["6A017348/6AC02699","5D030574/5DC30923","5D030573/5DC30930","6A017320/6AC03027","6A017324/6AC03023"],"inv":"82153268","timestamp":"2026-04-22T02:53:37.531Z"}]');
INSERT INTO public.products VALUES ('BRC-1773385731477', 'Fujifilm', 'Test', 'Body', NULL, 'New', 5000000.00, 8000000.00, 12, 'Official Sony Indonesia', 0, '2026-03-13 07:08:51.312988+00', '2026-04-22 02:58:51.09073+00', 0, true, true, ' dzyrd g', '2026-04-19 00:00:00', true, NULL, '[{"sn" : [], "inv" : "INV123", "timestamp" : "2026-04-19 17:35:03.760189+00"}]');
INSERT INTO public.products VALUES ('BRC-1777890075047', 'LEXAR', 'MICRO SDXC 256GB WITH ADAPTER', 'Accessory', NULL, 'New', 0.00, 0.00, 12, 'Official Sony Indonesia', 0, '2026-05-04 10:21:15.341305+00', '2026-05-04 10:21:15.341305+00', 0, false, false, 'DPR', '2026-05-04 00:00:00', true, NULL, '[{"sn":[],"inv":"TODAY","timestamp":"2026-05-04T10:21:15.249Z"}]');
INSERT INTO public.products VALUES ('BRC-1774673023768', 'Test', '0920', 'Body', NULL, 'New', 89000.00, 0.00, 12, 'Official Sony Indonesia', 5, '2026-03-28 04:43:43.727207+00', '2026-03-28 04:43:43.727207+00', 0, true, false, 'PT. DATACRIP', '2026-03-28 00:00:00', true, NULL, NULL);
INSERT INTO public.products VALUES ('BRC-1778045535342', 'BATTERY', 'DUMMY FW-50 NON', 'Accessory', NULL, 'New', 0.00, 0.00, 12, 'Official Sony Indonesia', 3, '2026-05-06 05:32:15.609434+00', '2026-05-06 05:32:15.609434+00', 0, false, false, 'PREMIERE PHOTOGRAPHY', '2026-05-06 00:00:00', false, NULL, '[{"sn":[],"inv":"80260504","timestamp":"2026-05-06T05:32:15.496Z"}]');
INSERT INTO public.products VALUES ('BRC-1776484670895', 'Tes tes', 'Tes', 'Body', NULL, 'New', 44.00, 55.00, 12, 'Official Sony Indonesia', 1, '2026-04-18 03:57:51.52798+00', '2026-04-18 03:57:51.52798+00', 0, true, false, 'PT. DATACRIP', '2026-04-18 00:00:00', true, NULL, '[{"sn" : [], "inv" : "Ttyt", "timestamp" : "2026-04-19 17:06:07.32636+00"}]');
INSERT INTO public.products VALUES ('BRC-1774673635107', 'Test', '5584', 'Body', NULL, 'New', 34500.00, 0.00, 12, 'Official Sony Indonesia', 6, '2026-03-28 04:53:55.069907+00', '2026-03-28 04:54:07.372+00', 0, true, false, 'PT. DATACRIP', '2026-03-28 00:00:00', true, NULL, NULL);
INSERT INTO public.products VALUES ('BRC-1774681738193', 'godox', 'test', 'Accessory', NULL, 'New', 500000.00, 50000.00, 1, 'Toko', 0, '2026-03-28 07:08:58.579448+00', '2026-04-22 02:59:03.611136+00', 0, true, false, 'IDOLA MILLENIUM', '2026-04-19 00:00:00', true, NULL, '[{"sn" : [], "inv" : "INV/123/BB", "timestamp" : "2026-04-19 17:06:07.32636+00"}]');
INSERT INTO public.products VALUES ('BRC-1776826715304', 'SANDISK', 'EXTREME 32GB (N)', 'Body', NULL, 'New', 0.00, 0.00, 12, 'Official Sony Indonesia', 7, '2026-04-22 02:58:35.510393+00', '2026-04-22 02:58:35.510393+00', 0, false, false, 'PT. FUJIFILM INDONESIA', '2026-04-22 00:00:00', false, NULL, '[{"sn":[],"inv":"82153268","timestamp":"2026-04-22T02:58:35.420Z"}]');
INSERT INTO public.products VALUES ('BRC-1774621508778', 'Test', 'Test 123', 'Body', NULL, 'New', 20000.00, 50000.00, 12, 'Official Sony Indonesia', 2, '2026-03-27 14:25:08.43414+00', '2026-03-30 05:36:42.461642+00', 0, true, false, 'PT. DATACRIP', '2026-03-30 00:00:00', true, NULL, NULL);
INSERT INTO public.products VALUES ('BRC-1773381211943', 'Sony', 'XCV 31', 'Body', NULL, 'New', 3000000.00, 7500000.00, 12, 'Official Sony Indonesia', 9, '2026-03-13 05:53:31.791108+00', '2026-05-04 03:45:16.475673+00', 1, false, false, 'Sony Indonesia', '2026-03-13 00:00:00', true, NULL, NULL);
INSERT INTO public.products VALUES ('BRC-1776563913411', 'adasddsa', 'asdaas', 'Accessory', NULL, 'Used', 0.00, 2.00, 0, 'Distributor', -4, '2026-04-19 01:58:34.32768+00', '2026-04-19 16:33:11.421587+00', 0, true, true, 'IDOLA MILLENIUM', '2026-04-19 00:00:00', true, NULL, '[{"sn" : [], "inv" : "testest", "timestamp" : "2026-04-19 17:06:07.32636+00"}]');
INSERT INTO public.products VALUES ('BRC-1773721384653', 'DJI MINI 3 PRO (DJI RC) (GL)', 'DRONE', 'Body', NULL, 'New', 14500000.00, 0.00, 12, 'Official Sony Indonesia', 2, '2026-03-17 04:23:04.904395+00', '2026-03-30 05:41:10.004816+00', 0, false, true, 'PT. SINAR EKA SELARAS', '2026-03-17 00:00:00', true, NULL, NULL);
INSERT INTO public.products VALUES ('BRC-1772075575556', 'Sony', '9823', 'Body', NULL, 'Used', 140000.00, 50000.00, 5, 'Distributor', 0, '2026-02-26 03:12:55.914458+00', '2026-03-07 03:53:13.507+00', 0, true, true, NULL, NULL, true, NULL, NULL);
INSERT INTO public.products VALUES ('BRC-1773371930013', 'Fujifilm', 'XC33-13', 'Body', NULL, 'New', 5000000.00, 15000000.00, 2, 'Official Sony Indonesia', 0, '2026-03-13 03:18:49.886424+00', '2026-03-17 03:51:21.793285+00', 1, false, true, 'Fujifilm', '2026-03-13 00:00:00', true, NULL, NULL);
INSERT INTO public.products VALUES ('BRC-1776742811200', 'tes', 'ts', 'Accessory', NULL, 'New', 0.00, 15000.00, 18, 'No Warranty', 0, '2026-04-21 03:40:11.44728+00', '2026-04-21 03:40:34.346249+00', 0, true, true, 'IDOLA MILLENIUM', '2026-04-21 00:00:00', true, NULL, '[{"sn":["SSSSSS"],"inv":"12321321","timestamp":"2026-04-21T03:40:11.362Z"}]');
INSERT INTO public.products VALUES ('BRC-1777621598471', 'SONY', 'ZV-E10K', 'Body', NULL, 'New', 0.00, 0.00, 12, 'Official Sony Indonesia', 0, '2026-05-01 07:46:39.812876+00', '2026-05-01 07:46:39.812876+00', 0, false, true, 'PT. SONY INDONESIA', '2026-05-01 00:00:00', true, NULL, '[{"sn":["7455397-Q"],"inv":"ABC","timestamp":"2026-05-01T07:46:38.813Z"}]');
INSERT INTO public.products VALUES ('BRC-1776621616110', 'Tes1234', 'Tes', 'Lens', NULL, 'New', 10000.00, 0.00, 13, 'Toko', 1, '2026-04-19 18:00:16.493517+00', '2026-05-04 03:43:46.464587+00', 0, false, true, 'PT. DATACRIP', '2026-04-19 00:00:00', true, NULL, '[{"sn":["ew"],"inv":"dasd","timestamp":"2026-04-19T18:00:16.398Z"},{"sn":["fasdsdsaas","fasdsdsaasvcv xzc"],"inv":"sdadsa","timestamp":"2026-04-19T18:01:19.082Z"}]');
INSERT INTO public.products VALUES ('BRC-1777956951196', 'HOLLYLAND ', 'LARK M2 DUO COMBO', 'Accessory', NULL, 'New', 0.00, 0.00, 12, 'Official Sony Indonesia', 0, '2026-05-05 04:55:51.467927+00', '2026-05-05 04:55:51.467927+00', 0, false, true, 'PT. DENKA PRATAMA INDONESIA', '2026-05-05 00:00:00', true, NULL, '[{"sn":["C63X222LEPT"],"inv":"TODAY","timestamp":"2026-05-05T04:55:51.348Z"}]');
INSERT INTO public.products VALUES ('BRC-1777883254139', 'CANON', 'G7 MARK III SILVER', 'Body', NULL, 'New', 0.00, 0.00, 12, 'Official Sony Indonesia', 0, '2026-05-04 08:27:34.409672+00', '2026-05-05 07:01:01.953787+00', 0, false, true, 'PT. ALTA NIKINDO', '2026-05-05 00:00:00', true, NULL, '[{"sn":["21218082000429"],"inv":"TODAY","timestamp":"2026-05-04T08:27:34.318Z"},{"sn":["21218082000428"],"inv":"stock","timestamp":"2026-05-05T07:01:01.860Z"}]');
INSERT INTO public.products VALUES ('BRC-1777957040059', 'K&F ', 'TRIPOD K254A3 + BH-28L (SA254M2)', 'Accessory', NULL, 'New', 0.00, 0.00, 12, 'Official Sony Indonesia', 0, '2026-05-05 04:57:20.389283+00', '2026-05-05 04:57:20.389283+00', 0, false, false, 'DPR', '2026-05-05 00:00:00', true, NULL, '[{"sn":[],"inv":"TODAY","timestamp":"2026-05-05T04:57:20.280Z"}]');
INSERT INTO public.products VALUES ('BRC-1776616446818', 'Instax', 'intsax ppn', 'Lens', NULL, 'Used', 0.00, 0.00, 12, 'Official Sony Indonesia', 0, '2026-04-19 16:34:07.356699+00', '2026-05-04 03:43:29.449341+00', 0, true, true, 'IDOLA MILLENIUM', '2026-04-19 00:00:00', true, NULL, '[{"sn":[],"inv":"hai_ini_baru","timestamp":"2026-04-19 17:06:07.32636+00"},{"sn":[],"inv":"tesasda","timestamp":"2026-04-19 17:06:07.32636+00"},{"sn":[],"inv":"apaaainiiii","timestamp":"2026-04-19 17:06:07.32636+00"},{"sn":[],"inv":"ddscasdcx","timestamp":"2026-04-19 17:06:07.32636+00"},{"sn":["gyjhnhgv"],"inv":"HJ","timestamp":"2026-04-19T17:44:32.270Z"}]');
INSERT INTO public.products VALUES ('BRC-1776484508644', 'Instax', 'Aja', 'Body', NULL, 'New', 28282.00, 282882.00, 12, 'Official Sony Indonesia', 1, '2026-04-18 03:55:10.192328+00', '2026-04-19 16:33:29.614583+00', 0, true, true, 'CV. CAMZONE ', '2026-04-18 00:00:00', true, NULL, '[{"sn" : [], "inv" : "2026", "timestamp" : "2026-04-19 17:06:07.32636+00"}]');
INSERT INTO public.products VALUES ('BRC-1776447256318', 'Testing', 'Godox Test', 'Accessory', NULL, 'Used', 1000000.00, 202312312.00, 12, 'Official Sony Indonesia', -1, '2026-04-17 17:34:16.956925+00', '2026-04-19 16:33:36.555204+00', 0, true, true, 'IDOLA MILLENIUM', '2026-04-18 00:00:00', true, NULL, '[{"sn" : [], "inv" : "Test", "timestamp" : "2026-04-19 17:06:07.32636+00"}]');
INSERT INTO public.products VALUES ('BRC-1776826533566', 'FUJIFILM ', 'X-M5 BLACK BODY ', 'Body', NULL, 'New', 0.00, 0.00, 12, 'Official Sony Indonesia', 3, '2026-04-22 02:55:33.749876+00', '2026-04-22 02:55:33.749876+00', 0, false, true, 'PT. FUJIFILM INDONESIA', '2026-04-22 00:00:00', true, NULL, '[{"sn":["6A015010","6A015011","6A003784"],"inv":"82153268","timestamp":"2026-04-22T02:55:33.655Z"}]');
INSERT INTO public.products VALUES ('BRC-1776826601980', 'FUJINON', 'XF 35MM F1.4 R', 'Body', NULL, 'New', 0.00, 0.00, 12, 'Official Sony Indonesia', 1, '2026-04-22 02:56:42.174336+00', '2026-04-22 02:56:42.174336+00', 0, false, true, 'PT. FUJIFILM INDONESIA', '2026-04-22 00:00:00', true, NULL, '[{"sn":["5HA00124"],"inv":"82153268","timestamp":"2026-04-22T02:56:42.084Z"}]');
INSERT INTO public.products VALUES ('BRC-1778045769816', 'KODAK', 'PIXPRO FZ55 SILVER NON', 'Body', NULL, 'New', 0.00, 2150000.00, 12, 'Official Sony Indonesia', 10, '2026-05-06 05:36:11.279083+00', '2026-05-06 05:36:11.279083+00', 0, false, true, 'DUTA SUKSES INDONESIA', '2026-05-06 00:00:00', false, NULL, '[{"sn":["M0641543757","M0641543741","M0641543780","M0641543779","M0641543781","M0641543740","M0641543756","M0641543760","M0641543761","M0641543758"],"inv":"SI.2026.05.0004.DSA","timestamp":"2026-05-06T05:36:09.976Z"}]');
INSERT INTO public.products VALUES ('BRC-1776826666010', 'FUJINON', 'XC 35MM F2', 'Lens', NULL, 'New', 0.00, 0.00, 12, 'Official Sony Indonesia', 2, '2026-04-22 02:57:46.21445+00', '2026-04-22 02:57:46.21445+00', 0, false, true, 'PT. FUJIFILM INDONESIA', '2026-04-22 00:00:00', true, NULL, '[{"sn":["6AA07499","6BA00752"],"inv":"82153268","timestamp":"2026-04-22T02:57:46.124Z"}]');
INSERT INTO public.products VALUES ('BRC-1776826925517', 'FUJIFILM', 'X-T30 III BODY SILVER', 'Body', NULL, 'New', 0.00, 0.00, 12, 'Official Sony Indonesia', 0, '2026-04-22 03:02:05.767075+00', '2026-04-22 03:02:05.767075+00', 0, false, true, 'PT. FUJIFILM INDONESIA', '2026-04-22 00:00:00', true, NULL, '[{"sn":["58036367","57028316"],"inv":"82153267","timestamp":"2026-04-22T03:02:05.666Z"}]');
INSERT INTO public.products VALUES ('BRC-1774849189478', 'FUJIFILM', 'INSTAX', 'Body', NULL, 'New', 0.00, 0.00, 12, 'Official Sony Indonesia', 0, '2026-03-30 05:39:49.476598+00', '2026-05-04 03:35:15.947757+00', 0, true, true, ' TESs E', '2026-04-19 00:00:00', true, NULL, '[{"sn" : [], "inv" : "fssdf", "timestamp" : "2026-04-19 17:35:03.760189+00"}]');


--
-- TOC entry 4351 (class 0 OID 23092)
-- Dependencies: 389
-- Data for Name: sale_items; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.sale_items VALUES ('84162ac5-0fa6-4785-9e67-11ab51bf60b8', 'INV-1774637253482', 'BRC-1774635185353', '234', 'NOSN-BRC-1774-1774637242985', 45000.00, 0.00, '2026-10-27 00:00:00', NULL);
INSERT INTO public.sale_items VALUES ('34446855-0913-40d8-bed3-d3de901fdb24', 'INV-1774667856873', 'BRC-1774635185353', '2345', 'NOSN-BRC-1774-1774667733387', 45000.00, 0.00, '2026-10-28 00:00:00', NULL);
INSERT INTO public.sale_items VALUES ('e2ed6e60-2108-42cd-8095-d0fe997bab49', 'INV-1774668693466', 'BRC-1774635185353', '2345', 'NOSN-BRC-1774-1774668540280', 45000.00, 0.00, '2026-10-28 00:00:00', NULL);
INSERT INTO public.sale_items VALUES ('bdc598d9-42fa-4a3e-9448-93f93eea2014', 'INV-1774669959810', 'BRC-1773722064202', 'ACTION CAM', '9LTZP1700C8ZTR', 5750000.00, 0.00, '2027-03-28 00:00:00', NULL);
INSERT INTO public.sale_items VALUES ('f21b0b84-bb93-4749-bc1f-33d39d28e5a3', 'INV-1776413990271', 'BRC-1773385731477', 'Test', '4547410562333', 7500000.00, 8000000.00, '2027-04-17 00:00:00', NULL);
INSERT INTO public.sale_items VALUES ('83f71322-7fba-4b38-ab0d-2845e1fbacae', 'INV-1776419262172', 'BRC-1774681738193', 'test', 'NOSN-BRC-1774-1776419211636', 5000000.00, 50000.00, '2026-05-17 00:00:00', NULL);
INSERT INTO public.sale_items VALUES ('5ac78209-f5fc-403f-a493-c9f107cccdb1', 'INV-1776447067165', 'BRC-1773722064202', 'ACTION CAM', '9LTZNCJ00CADHN', 5750000.00, 0.00, '2027-04-17 00:00:00', NULL);
INSERT INTO public.sale_items VALUES ('4f1e9e12-4e44-4283-8778-8b9ef682132a', 'INV-1776447196612', 'BRC-1773722333794', 'ACTION CAM', '231313123123123', 8250000.00, 0.00, '2027-04-17 00:00:00', NULL);
INSERT INTO public.sale_items VALUES ('60e87cbb-a69b-40f1-a274-080e51721ece', 'INV-1776447432526', 'BRC-1776447256318', 'Godox Test', 'adasadsdsadsadasdasd', 1000000.00, 202312312.00, '2027-04-17 00:00:00', NULL);
INSERT INTO public.sale_items VALUES ('d06f9a87-3a63-47fe-ad7c-017bf19ed1a1', 'INV-1776447495366', 'BRC-1776447256318', 'Godox Test', 'asdadsdasdasdsa', 5521322312.00, 202312312.00, '2027-04-17 00:00:00', NULL);
INSERT INTO public.sale_items VALUES ('323d87ef-10c4-4479-86f3-66ecb049f0e6', 'INV-1776453725912', 'BRC-1776452187590', 'INV Number', 'NOSN-BRC-1776-1776453713404', 150000.00, 100000.00, '2027-04-17 00:00:00', NULL);
INSERT INTO public.sale_items VALUES ('f51ba34b-152b-4002-af5a-9dbdde24eaee', 'INV-1776454558187', 'BRC-1776452187590', 'INV Number', 'NOSN-BRC-1776-1776454541586', 150000.00, 100000.00, '2027-04-17 00:00:00', NULL);
INSERT INTO public.sale_items VALUES ('907b9387-f5d0-4f28-80d3-80c0c99f29db', 'INV-1776454609525', 'BRC-1776452187590', 'INV Number', 'NOSN-BRC-1776-1776454601091', 150000.00, 100000.00, '2027-04-17 00:00:00', NULL);
INSERT INTO public.sale_items VALUES ('f9b1be22-e70d-4a06-b459-686a941fc1b2', 'INV-1776456027750', 'BRC-1776452187590', 'INV Number', 'NOSN-BRC-1776-1776456006295', 150000.00, 100000.00, '2027-04-17 00:00:00', NULL);
INSERT INTO public.sale_items VALUES ('14a4a174-1133-4174-8ef1-c05b8d891d21', 'INV-1776477095675', 'BRC-1776447256318', 'Godox Test', 'NOSN-BRC-1776-1776477068098', 1000000.00, 202312312.00, '2027-04-18 00:00:00', NULL);
INSERT INTO public.sale_items VALUES ('a2ca36e1-4749-4c9a-9992-7de5c3d1226a', 'INV-1776483215457', 'BRC-1774840575626', 'LENSA', '216065000059', 40000000.00, 38850000.00, '2027-04-18 00:00:00', NULL);
INSERT INTO public.sale_items VALUES ('18373ad7-9421-4967-9c43-4f760dc09d7d', 'INV-1776483313668', 'BRC-1774849189478', 'INSTAX', '92026927', 3000000.00, 0.00, '2027-04-18 00:00:00', NULL);
INSERT INTO public.sale_items VALUES ('7e4431ef-7b3b-4b7e-900b-83093e6f6df4', 'INV-1776564945301', 'BRC-1776563913411', 'asdaas', 'asdasdasd', 22232.00, 2.00, '2026-04-19 00:00:00', 'adasddsa');
INSERT INTO public.sale_items VALUES ('646e566f-79b0-4c30-ac85-bae42ec08f74', 'INV-1776607398344', 'BRC-1774681738193', 'test', 'NOSN-BRC-1774-1776607361985', 500000.00, 50000.00, '2026-05-19 00:00:00', 'godox');
INSERT INTO public.sale_items VALUES ('a4f8ff92-b296-429f-8571-960645ac752b', 'INV-1776616137970', 'BRC-1774681738193', 'test', 'NOSN-BRC-1774-1776616084999', 500000.00, 50000.00, '2026-05-19 00:00:00', 'godox');
INSERT INTO public.sale_items VALUES ('bf1fa1eb-81ff-43c1-8cef-a8dfddfa3e4b', 'INV-1776616137970', 'BRC-1776447256318', 'Godox Test', 'Abcde', 1000000.00, 202312312.00, '2027-04-19 00:00:00', 'Testing');
INSERT INTO public.sale_items VALUES ('a1a83c0e-8416-4dcb-98bb-03c1d26f7317', 'INV-1776616137970', 'BRC-1776563913411', 'asdaas', 'fwefwefwefwef23', 213212213.00, 2.00, '2026-04-19 00:00:00', 'adasddsa');
INSERT INTO public.sale_items VALUES ('dd0c1bad-23ed-4868-8e6b-cbf960353805', 'INV-1776616137970', 'BRC-1776563913411', 'asdaas', 'fwefwefwefwefw', 0.00, 2.00, '2026-04-19 00:00:00', 'adasddsa');
INSERT INTO public.sale_items VALUES ('1d3059a9-79c2-41f6-9295-2dd3e476d3d6', 'INV-1776616219731', 'BRC-1776563913411', 'asdaas', 'fwefwefwefwew11', 203002.00, 2.00, '2026-04-19 00:00:00', 'adasddsa');
INSERT INTO public.sale_items VALUES ('e0ecb167-bd07-4f52-a3d5-3e4521ad7d80', 'INV-1776616219731', 'BRC-1776563913411', 'asdaas', 'fwefwefwefwewccc', 420012.00, 2.00, '2026-04-19 00:00:00', 'adasddsa');
INSERT INTO public.sale_items VALUES ('d853e220-e7f7-4427-af8d-6f5a95f063c7', 'INV-1776650564687', 'BRC-1774681738193', 'test', 'NOSN-BRC-1774-1776650550889', 500000.00, 50000.00, '2026-05-20 00:00:00', 'godox');
INSERT INTO public.sale_items VALUES ('e5e4aef6-2fe1-492c-9d3a-a2ad0f1867dd', 'INV-1776656413081', 'BRC-1774681738193', 'test', 'NOSN-BRC-1774-1776656404200', 500000.00, 50000.00, '2026-05-20 00:00:00', 'godox');
INSERT INTO public.sale_items VALUES ('bd02f231-1752-4ed7-859f-4d575a583d11', 'INV-1776658640681', 'BRC-1774681738193', 'test', 'NOSN-BRC-1774-1776658629738', 500000.00, 50000.00, '2026-05-20 00:00:00', 'godox');
INSERT INTO public.sale_items VALUES ('f3c4a627-a23d-4d39-ac55-bda787ec4216', 'INV-1776740105226', 'BRC-1776621616110', 'teetstt', 'adadsadvvew', 1.00, 0.00, '2027-05-21 00:00:00', 'testt');
INSERT INTO public.sale_items VALUES ('96e2fc57-2c2c-4e57-9e14-8561950f87e6', 'INV-1776740590870', 'BRC-1776621616110', 'Tes', 'ew', 10000.00, 0.00, '2027-05-21 00:00:00', 'Tes1234');
INSERT INTO public.sale_items VALUES ('1a503a7c-1bf7-4370-ba08-ff4ca1bf18af', 'INV-1776740858251', 'BRC-1773722244587', 'DRONE', '1581F9DEC25AG0296561', 18080000.00, 0.00, '2027-04-21 00:00:00', 'DJI MINI 5 PRO FLY MORE COMBO PLUS (DJI RC2)');
INSERT INTO public.sale_items VALUES ('fb529e68-3670-46e0-b13c-641617267a66', 'INV-1776740858251', 'BRC-1776740653217', 'Non SN', 'NOSN-BRC-1776-1776740814237', 555556.00, 0.00, '2027-04-21 00:00:00', 'Tes ');
INSERT INTO public.sale_items VALUES ('0b7fb361-5542-4210-9d81-1c8e5bc9e257', 'INV-1776741444573', 'BRC-1776740653217', 'Non SN', 'NOSN-BRC-1776-1776741375291', 7383883.00, 0.00, '2027-04-21 00:00:00', 'Tes ');
INSERT INTO public.sale_items VALUES ('008cba86-14e4-49a9-99e8-e12d78c540b7', 'INV-1776741444573', 'BRC-1776740653217', 'Non SN', 'NOSN-BRC-1776-1776741386074', 9282838.00, 0.00, '2027-04-21 00:00:00', 'Tes ');
INSERT INTO public.sale_items VALUES ('f98dfae8-b34c-4bb7-9f30-bcc943249343', 'INV-1776741629791', 'BRC-1776621616110', 'Tes', 'fdsfdsds', 100000.00, 0.00, '2027-05-21 00:00:00', 'Tes1234');
INSERT INTO public.sale_items VALUES ('f5b29835-5378-421e-a704-364b80535d0f', 'INV-1776741629791', 'BRC-1774681738193', 'test', 'NOSN-BRC-1774-1776741599041', 5000002.00, 50000.00, '2026-05-21 00:00:00', 'godox');
INSERT INTO public.sale_items VALUES ('8c4da0f4-5e4a-4f74-9b95-075770f3a285', 'INV-1776741772466', 'BRC-1776740653217', 'Non SN', 'NOSN-BRC-1776-1776741737296', 3874949.00, 0.00, '2027-04-21 00:00:00', 'Tes ');
INSERT INTO public.sale_items VALUES ('5bcdc2f9-c2d5-4a62-9aee-92fb9ed71f05', 'INV-1776742563746', 'BRC-1776740653217', 'Non SN', 'NOSN-BRC-1776-1776742544202', 0.00, 0.00, '2027-04-21 00:00:00', 'Tes ');
INSERT INTO public.sale_items VALUES ('2ecf5d68-6d45-4e45-bb0b-d89f8eb336c1', 'INV-1776742563746', 'BRC-1776621616110', 'Tes', 'adadsad', 10000.00, 0.00, '2027-05-21 00:00:00', 'Tes1234');
INSERT INTO public.sale_items VALUES ('bb0eb1db-665a-4dbf-86c4-fe5229b52c63', 'INV-1777621032080', 'BRC-1776826925517', 'X-T30 III BODY SILVER', '58036367', 15000000.00, 0.00, '2027-05-01 00:00:00', 'FUJIFILM');
INSERT INTO public.sale_items VALUES ('1787bc02-7e37-4baf-9ada-f1e21bf4be79', 'INV-1777621032080', 'BRC-1776826925517', 'X-T30 III BODY SILVER', '57028316', 15000000.00, 0.00, '2027-05-01 00:00:00', 'FUJIFILM');
INSERT INTO public.sale_items VALUES ('9a6be158-79df-4be4-a2e2-5da93ee0979f', 'INV-1777621215535', 'BRC-1776826840791', 'X-E5 BODY SILVER', '5DA07299', 18000000.00, 0.00, '2027-05-01 00:00:00', 'FUJIFILM');
INSERT INTO public.sale_items VALUES ('802f2465-cf14-4efb-833f-7905c4adeffb', 'INV-1777621687866', 'BRC-1777621598471', 'ZV-E10K', '7455397-Q', 10500000.00, 0.00, '2027-05-01 00:00:00', 'SONY');
INSERT INTO public.sale_items VALUES ('6775cce1-7411-4bea-9d8b-28e50d255c85', 'INV-1777868208368', 'BRC-1777866102710', 'Z8 BK SG', '7019341', 54500000.00, 0.00, '2027-05-04 00:00:00', 'NIKON');
INSERT INTO public.sale_items VALUES ('199e0acb-1576-42d7-a3ce-3b500b9917e8', 'INV-1777873682813', 'BRC-1777873652077', 'INSTAX FILM MINI TWIN WW2', 'NOSN-BRC-1777-1777873665431', 265000.00, 0.00, '2027-05-04 00:00:00', 'FUJIFILM');
INSERT INTO public.sale_items VALUES ('f01d080e-3117-42ce-8e4b-398fc6b278b5', 'INV-1777883323947', 'BRC-1777883254139', 'G7 MARK III SILVER', '21218082000429', 0.00, 0.00, '2027-05-04 00:00:00', 'CANON');
INSERT INTO public.sale_items VALUES ('737d3355-f6db-4c0c-a4ab-ec9e1f105db5', 'INV-1777890163459', 'BRC-1777886655639', 'OSMO POCKET 4 CREATOR COMBO', 'ANGZP380029LEE', 10300000.00, 0.00, '2027-05-04 00:00:00', 'DJI ');
INSERT INTO public.sale_items VALUES ('4b0cec03-2c75-42ab-bede-7194e8207c93', 'INV-1777890163459', 'BRC-1777890075047', 'MICRO SDXC 256GB WITH ADAPTER', 'NOSN-BRC-1777-1777890104906', 1500000.00, 0.00, '2027-05-04 00:00:00', 'LEXAR');
INSERT INTO public.sale_items VALUES ('1462f13a-a98f-47c2-976f-2d099f0140b1', 'INV-1777957271216', 'BRC-1777957040059', 'TRIPOD K254A3 + BH-28L (SA254M2)', 'NOSN-BRC-1777-1777957146766', 1100000.00, 0.00, '2027-05-05 00:00:00', 'K&F ');
INSERT INTO public.sale_items VALUES ('105c448e-ea27-44ac-8e5d-1ecd72128498', 'INV-1777957271216', 'BRC-1777956951196', 'LARK M2 DUO COMBO', 'C63X222LEPT', 1750000.00, 0.00, '2027-05-05 00:00:00', 'HOLLYLAND ');
INSERT INTO public.sale_items VALUES ('a00dd410-9f04-4536-a5f1-7a196f906192', 'INV-1777962533893', 'BRC-1777886655639', 'OSMO POCKET 4 CREATOR COMBO', 'ANGZP3M00204ZG', 10300000.00, 0.00, '2027-05-05 00:00:00', 'DJI ');
INSERT INTO public.sale_items VALUES ('97dd7980-ed88-45df-bbd8-f6bdab5b10a3', 'INV-1777964773410', 'BRC-1777883254139', 'G7 MARK III SILVER', '21218082000428', 16500000.00, 0.00, '2027-05-05 00:00:00', 'CANON');
INSERT INTO public.sale_items VALUES ('e8116a47-97c1-4a7a-93eb-fee96c42f88e', 'INV-1774627204156', 'BRC-1774621508778', 'Test 123', 'NOSN-BRC-1774-1774627185296', 20000.00, 0.00, '2027-03-27 00:00:00', NULL);
INSERT INTO public.sale_items VALUES ('ed532180-9659-4210-b6f6-bc957f16cddf', 'INV-1774629243501', 'BRC-1774621508778', 'Test 123', 'NOSN-BRC-1774-1774629219982', 20000.00, 0.00, '2027-03-27 00:00:00', NULL);
INSERT INTO public.sale_items VALUES ('5a7e7a5a-c0c5-4eca-b741-909af11e4eda', 'INV-1774636776483', 'BRC-1774635185353', '234', 'NOSN-BRC-1774-1774636760752', 45000.00, 0.00, '2026-10-27 00:00:00', NULL);
INSERT INTO public.sale_items VALUES ('dcf47be7-fa1a-4a53-be30-59696ffced13', 'INV-1774636776483', 'BRC-1774621508778', 'Test 123', 'NOSN-BRC-1774-1774636765257', 20000.00, 0.00, '2027-03-27 00:00:00', NULL);
INSERT INTO public.sale_items VALUES ('9677e7f1-e1bf-4b4b-b085-529ccac532e8', 'INV-1777974983248', 'BRC-1777974779855', 'X-S20 15-45MM BLACK', '6AL00197/5DC57878', 21500000.00, 0.00, '2027-05-05 00:00:00', 'FUJIFILM');
INSERT INTO public.sale_items VALUES ('f65d5e9f-9f68-4ab1-8b82-2f0a64b2716a', 'INV-1778038814307', 'BRC-1777873652077', 'INSTAX FILM MINI TWIN WW2', 'NOSN-BRC-1777-1778038790438', 265000.00, 0.00, '2027-05-06 00:00:00', 'FUJIFILM');


--
-- TOC entry 4352 (class 0 OID 23100)
-- Dependencies: 390
-- Data for Name: sales; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.sales VALUES ('INV-1774627204156', 'CUST-1772856667104', 'Andy', 20000.00, 0.00, 20000.00, 'Debit', 'Budi', '2026-03-27 16:00:04.110515+00', false, 'Beli', NULL, true, NULL, 0.00, '[]', NULL);
INSERT INTO public.sales VALUES ('INV-1776656413081', 'CUST-1772092021695', 'CHARISSA PUTRI', 500000.00, 0.00, 500000.00, 'Transfer', 'Mami', '2026-04-20 03:40:12.42801+00', false, NULL, NULL, true, NULL, 500000.00, '[{"amount":500000,"timestamp":"2026-04-20T03:40:13.403Z"}]', NULL);
INSERT INTO public.sales VALUES ('INV-1774629243501', 'CUST-1772856667104', 'Andy', 20000.00, 2200.00, 22200.00, 'Utang', 'Nancy', '2026-03-27 16:34:03.469424+00', true, 'Utang', '2026-03-27 17:12:14+00', true, '2026-03-27 17:22:14.753+00', 0.00, '[]', NULL);
INSERT INTO public.sales VALUES ('INV-1774636776483', 'CUST-1772856667104', 'Andy', 65000.00, 7150.00, 72150.00, 'QRIS', 'Nancy', '2026-03-27 18:39:36.427786+00', true, NULL, NULL, true, NULL, 0.00, '[]', NULL);
INSERT INTO public.sales VALUES ('INV-1774637253482', 'CUST-1772856667104', 'Andy', 45000.00, 4950.00, 49950.00, 'Debit', 'Nancy', '2026-03-27 18:47:33.43767+00', true, NULL, NULL, true, NULL, 0.00, '[]', NULL);
INSERT INTO public.sales VALUES ('INV-1774667856873', 'CUST-1772092334065', 'ANIS CHA', 45000.00, 4950.00, 49950.00, 'Utang', 'Nancy', '2026-03-28 03:17:37.221688+00', true, NULL, NULL, true, '2026-03-28 03:18:31.222+00', 0.00, '[]', NULL);
INSERT INTO public.sales VALUES ('INV-1774668693466', 'CUST-1772856667104', 'Andy', 45000.00, 0.00, 45000.00, 'Debit', 'Nancy', '2026-03-28 03:31:33.428711+00', false, NULL, NULL, true, NULL, 0.00, '[]', NULL);
INSERT INTO public.sales VALUES ('INV-1776447067165', 'CUST-1772092334065', 'ANIS CHA', 5750000.00, 0.00, 5750000.00, 'Debit', 'Nancy', '2026-04-17 17:31:07.807092+00', true, 'add on', NULL, true, NULL, 5750000.00, '[{"amount":5750000,"timestamp":"2026-04-17T17:31:07.731Z"}]', NULL);
INSERT INTO public.sales VALUES ('INV-1776447196612', 'CUST-1772095208915', 'ANDREAS TJ', 8250000.00, 0.00, 8250000.00, 'Debit', 'Nancy', '2026-04-17 17:33:17.24313+00', true, 'sdadda', NULL, true, NULL, 8250000.00, '[{"amount":8250000,"timestamp":"2026-04-17T17:33:17.172Z"}]', NULL);
INSERT INTO public.sales VALUES ('INV-1776658640681', 'CUST-1776484005344', 'Kskksmx', 500000.00, 0.00, 500000.00, 'Transfer', 'Mami', '2026-04-20 04:17:22.145723+00', false, NULL, NULL, true, NULL, 500000.00, '[{"amount":500000,"timestamp":"2026-04-20T04:17:19.668Z"}]', NULL);
INSERT INTO public.sales VALUES ('INV-1776419262172', 'CUST-1772856667104', 'Andy', 5000000.00, 550000.00, 5550000.00, 'Utang', 'Mami', '2026-04-17 09:47:41.761271+00', true, NULL, '2026-04-30 00:00:00+00', true, '2026-04-17 13:01:13.928+00', 5700000.00, '[{"amount":150000,"timestamp":"2026-04-17T12:29:10.408Z"},{"amount":2500000,"timestamp":"2026-04-17T12:29:41.153Z"},{"amount":1550000,"timestamp":"2026-04-17T12:50:06.221Z"},{"amount":1500000,"timestamp":"2026-04-17T13:01:13.928Z"}]', NULL);
INSERT INTO public.sales VALUES ('INV-1776447432526', 'CUST-1772092021695', 'CHARISSA PUTRI', 1000000.00, 0.00, 1000000.00, 'QRIS', 'Nancy', '2026-04-17 17:37:13.167717+00', true, 'dsdasda', NULL, true, NULL, 1000000.00, '[{"amount":1000000,"timestamp":"2026-04-17T17:37:13.094Z"}]', NULL);
INSERT INTO public.sales VALUES ('INV-1776447495366', 'CUST-1772092021695', 'CHARISSA PUTRI', 5521322312.00, 0.00, 5521322312.00, 'Cash', 'Nancy', '2026-04-17 17:38:16.091452+00', true, NULL, NULL, true, NULL, 5521322312.00, '[{"amount":5521322312,"timestamp":"2026-04-17T17:38:16.014Z"}]', NULL);
INSERT INTO public.sales VALUES ('INV-1776453725912', 'CUST-1772856667104', 'Andy', 150000.00, 16500.00, 166500.00, 'QRIS', 'Mami', '2026-04-17 19:22:04.945405+00', true, NULL, NULL, true, NULL, 166500.00, '[{"amount":166500,"timestamp":"2026-04-17T19:22:06.242Z"}]', NULL);
INSERT INTO public.sales VALUES ('INV-1776454558187', 'CUST-1772856667104', 'Andy', 150000.00, 16500.00, 166500.00, 'QRIS', 'Mami', '2026-04-17 19:35:56.90758+00', true, NULL, NULL, true, NULL, 166500.00, '[{"amount":166500,"timestamp":"2026-04-17T19:35:58.200Z"}]', NULL);
INSERT INTO public.sales VALUES ('INV-1776454609525', 'CUST-1772856667104', 'Andy', 150000.00, 16500.00, 166500.00, 'QRIS', 'Mami', '2026-04-17 19:36:48.231235+00', true, NULL, NULL, true, NULL, 166500.00, '[{"amount":166500,"timestamp":"2026-04-17T19:36:49.535Z"}]', NULL);
INSERT INTO public.sales VALUES ('INV-1776456027750', 'CUST-1772856667104', 'Andy', 150000.00, 16500.00, 166500.00, 'QRIS', 'Mami', '2026-04-17 20:00:26.840166+00', true, NULL, NULL, true, NULL, 166500.00, '[{"amount":166500,"timestamp":"2026-04-17T20:00:28.081Z"}]', NULL);
INSERT INTO public.sales VALUES ('INV-1776477095675', 'CUST-1772095208915', 'ANDREAS TJ', 1000000.00, 110000.00, 1110000.00, 'Debit', 'Nancy', '2026-04-18 01:51:35.980501+00', true, NULL, NULL, true, NULL, 1110000.00, '[{"amount":1110000,"timestamp":"2026-04-18T01:51:35.883Z"}]', NULL);
INSERT INTO public.sales VALUES ('INV-1776740105226', 'CUST-1772095154397', 'DELFIN BAPTISTA', 1.00, 0.00, 1.00, 'Utang', 'Nancy', '2026-04-21 02:55:06.566153+00', false, NULL, '2026-04-22 00:00:00+00', true, '2026-04-21 03:01:36.297+00', 1.00, '[{"amount":1,"timestamp":"2026-04-21T02:55:05.386Z"}]', NULL);
INSERT INTO public.sales VALUES ('INV-1776740590870', 'CUST-1772091570940', 'DIAS PRANOTO', 10000.00, 0.00, 10000.00, 'Transfer', 'Nancy', '2026-04-21 03:03:11.120862+00', false, 'tes notes', NULL, true, NULL, 10000.00, '[{"amount":10000,"timestamp":"2026-04-21T03:03:11.032Z"}]', NULL);
INSERT INTO public.sales VALUES ('INV-1776413990271', 'CUST-1772856667104', 'Andy', 7500000.00, 825000.00, 8325000.00, 'Utang', 'Mami', '2026-04-17 08:19:49.896931+00', true, NULL, '2026-04-16 00:00:00+00', false, NULL, 2325000.00, '[{"amount":1250000,"timestamp":"2026-04-17T13:23:24.882Z"},{"amount":1075000,"timestamp":"2026-04-18T03:20:19.634Z"}]', NULL);
INSERT INTO public.sales VALUES ('INV-1776483215457', 'CUST-1772095208915', 'ANDREAS TJ', 40000000.00, 0.00, 40000000.00, 'Cash', 'Sifa', '2026-04-18 03:33:35.667598+00', true, 'TRANSFER', NULL, true, NULL, 40000000.00, '[{"amount":40000000,"timestamp":"2026-04-18T03:33:35.588Z"}]', NULL);
INSERT INTO public.sales VALUES ('INV-1776483313668', 'CUST-1772095208915', 'ANDREAS TJ', 3000000.00, 330000.00, 3330000.00, 'Debit', 'Nancy', '2026-04-18 03:35:14.004815+00', true, 'Seettt', NULL, true, NULL, 3330000.00, '[{"amount":3330000,"timestamp":"2026-04-18T03:35:13.925Z"}]', NULL);
INSERT INTO public.sales VALUES ('INV-1776740858251', 'CUST-1772093081316', 'EDY PRIANTO', 18635556.00, 0.00, 18635556.00, 'QRIS', 'Mami', '2026-04-21 03:07:39.598871+00', false, NULL, NULL, true, NULL, 18635556.00, '[{"amount":18635556,"timestamp":"2026-04-21T03:07:38.442Z"}]', NULL);
INSERT INTO public.sales VALUES ('INV-1776564945301', 'CUST-1772092021695', 'CHARISSA PUTRI', 22232.00, 2445.52, 24677.52, 'Debit', 'Nancy', '2026-04-19 02:15:46.249422+00', true, 'ssadasdsdadasdasdsadasda', NULL, true, NULL, 24677.52, '[{"amount":24677.52,"timestamp":"2026-04-19T02:15:46.171Z"}]', NULL);
INSERT INTO public.sales VALUES ('INV-1776607398344', 'CUST-1772856667104', 'Andy', 500000.00, 0.00, 500000.00, 'Transfer', 'Mami', '2026-04-19 14:03:24.024364+00', true, 'Tes 1234', NULL, true, NULL, 500000.00, '[{"amount":500000,"timestamp":"2026-04-19T14:03:23.946Z"}]', NULL);
INSERT INTO public.sales VALUES ('INV-1776616137970', 'CUST-1772093533241', 'LASKAR AMARUTA ALFAJRI', 214712213.00, 0.00, 214712213.00, 'Debit', 'Nancy', '2026-04-19 16:28:58.214127+00', true, 'testomg nayangk', NULL, true, NULL, 214712213.00, '[{"amount":214712213,"timestamp":"2026-04-19T16:28:58.123Z"}]', NULL);
INSERT INTO public.sales VALUES ('INV-1776616219731', 'CUST-1772091570940', 'DIAS PRANOTO', 623014.00, 0.00, 623014.00, 'Transfer', 'Nancy', '2026-04-19 16:30:20.022555+00', true, NULL, NULL, true, NULL, 623014.00, '[{"amount":623014,"timestamp":"2026-04-19T16:30:19.935Z"}]', NULL);
INSERT INTO public.sales VALUES ('INV-1774669959810', 'CUST-1772074658861', 'Budi Handoko', 5750000.00, 632500.00, 6382500.00, 'Utang', 'Nancy', '2026-03-28 03:52:40.150059+00', true, NULL, NULL, true, '2026-04-19 17:00:26.316+00', 458236034.00, '[{"amount":2123122,"timestamp":"2026-04-17T17:35:50.973Z"},{"amount":1680887,"timestamp":"2026-04-18T01:52:24.523Z"},{"amount":578491,"timestamp":"2026-04-18T03:18:12.372Z"},{"amount":100000,"timestamp":"2026-04-18T03:18:36.503Z"},{"amount":300000,"timestamp":"2026-04-18T03:59:25.709Z"},{"amount":453453534,"timestamp":"2026-04-19T17:00:26.316Z"}]', NULL);
INSERT INTO public.sales VALUES ('INV-1776741444573', 'CUST-1772094811269', 'ALDEN RAYHAN', 16666721.00, 0.00, 16666721.00, 'Debit', 'Mami', '2026-04-21 03:17:24.850843+00', false, 'Alamakkk', NULL, true, NULL, 16666721.00, '[{"amount":16666721,"timestamp":"2026-04-21T03:17:24.762Z"}]', NULL);
INSERT INTO public.sales VALUES ('INV-1776650564687', 'CUST-1772094811269', 'ALDEN RAYHAN', 500000.00, 0.00, 500000.00, 'Utang', 'Mami', '2026-04-20 02:02:43.784693+00', false, NULL, '2026-04-23 00:00:00+00', true, '2026-04-21 03:21:21.133+00', 100000.00, '[{"amount":100000,"timestamp":"2026-04-20T02:02:44.723Z"}]', NULL);
INSERT INTO public.sales VALUES ('INV-1776741629791', 'CUST-1772094811269', 'ALDEN RAYHAN', 5100002.00, 0.00, 5100002.00, 'Utang', 'Mami', '2026-04-21 03:20:31.233712+00', false, 'Budi', '2026-04-10 00:00:00+00', true, '2026-04-21 03:21:53.276+00', 900002.00, '[{"amount":900000,"timestamp":"2026-04-21T03:20:30.067Z"},{"amount":2,"timestamp":"2026-04-21T03:21:43.940Z"}]', NULL);
INSERT INTO public.sales VALUES ('INV-1776741772466', 'CUST-1772094811269', 'ALDEN RAYHAN', 3874949.00, 426244.39, 4301193.39, 'Utang', 'Mami', '2026-04-21 03:22:53.836695+00', true, 'Djkcv,flofllcc', '2026-04-02 00:00:00+00', true, '2026-04-21 03:23:38.05+00', 996218.00, '[{"amount":991218,"timestamp":"2026-04-21T03:22:52.685Z"},{"amount":5000,"timestamp":"2026-04-21T03:23:20.481Z"}]', NULL);
INSERT INTO public.sales VALUES ('INV-1777621032080', 'CUST-1772094811269', 'ALDEN RAYHAN', 30000000.00, 0.00, 30000000.00, 'Cash', 'Sifa', '2026-05-01 07:37:12.434151+00', false, NULL, NULL, true, NULL, 30000000.00, '[{"amount":30000000,"timestamp":"2026-05-01T07:37:12.236Z"}]', NULL);
INSERT INTO public.sales VALUES ('INV-1776742563746', 'CUST-1772095208915', 'ANDREAS TJ', 10000.00, 1100.00, 11100.00, 'Utang', 'Mami', '2026-04-21 03:36:03.993537+00', true, NULL, '2026-04-09 00:00:00+00', true, '2026-04-21 03:36:57.696+00', 11100.00, '[{"amount":1000,"timestamp":"2026-04-21T03:36:03.912Z"},{"amount":2500,"timestamp":"2026-04-21T03:36:39.865Z"},{"amount":7600,"timestamp":"2026-04-21T03:36:57.696Z"}]', NULL);
INSERT INTO public.sales VALUES ('INV-1777621215535', 'CUST-1772091505724', 'INDIRA RESTY ARDHANA', 18000000.00, 1980000.00, 19980000.00, 'Cash', 'Sifa', '2026-05-01 07:40:16.881556+00', true, 'TUKAR TAMBAH ', NULL, true, NULL, 19980000.00, '[{"amount":19980000,"timestamp":"2026-05-01T07:40:15.703Z"}]', NULL);
INSERT INTO public.sales VALUES ('INV-1777621687866', 'CUST-1777621634043', 'NABILA RAHMANIA', 10500000.00, 1155000.00, 11655000.00, 'Cash', 'Sifa', '2026-05-01 07:48:08.11246+00', true, 'FREE TAS,ANTI GORES,SANDISK EX 32GB', NULL, true, NULL, 11655000.00, '[{"amount":11655000,"timestamp":"2026-05-01T07:48:08.030Z"}]', NULL);
INSERT INTO public.sales VALUES ('INV-1777868208368', 'CUST-1777868154320', 'HARYANTO TARZAN', 54500000.00, 0.00, 54500000.00, 'Cash', 'Sifa', '2026-05-04 04:16:48.628851+00', false, NULL, NULL, true, NULL, 54500000.00, '[{"amount":54500000,"timestamp":"2026-05-04T04:16:48.527Z"}]', NULL);
INSERT INTO public.sales VALUES ('INV-1777873682813', 'CUST-1777873606729', 'RASHEESA RATU S', 265000.00, 0.00, 265000.00, 'Transfer', 'Sifa', '2026-05-04 05:48:03.05765+00', false, NULL, NULL, true, NULL, 265000.00, '[{"amount":265000,"timestamp":"2026-05-04T05:48:02.970Z"}]', NULL);
INSERT INTO public.sales VALUES ('INV-1777883323947', 'CUST-1777883212682', 'WAHYU AFRIANSYAH', 0.00, 0.00, 0.00, 'Transfer', 'Sifa', '2026-05-04 08:28:44.198918+00', true, 'BARANG MASUK : RICOH GR III X HDF TAMBAH 4JT', NULL, true, NULL, 0.00, '[]', NULL);
INSERT INTO public.sales VALUES ('INV-1777890163459', 'CUST-1777889224183', 'BEN IRAWAN LIMANTARA', 11800000.00, 0.00, 11800000.00, 'Debit', 'Sifa', '2026-05-04 10:22:43.715056+00', false, 'SN : ANGZP3M00204ZG', NULL, true, NULL, 11800000.00, '[{"amount":11800000,"timestamp":"2026-05-04T10:22:43.618Z"}]', NULL);
INSERT INTO public.sales VALUES ('INV-1777957271216', 'CUST-1777956857909', 'KIANG KUPANG', 2850000.00, 0.00, 2850000.00, 'Transfer', 'Sifa', '2026-05-05 05:01:12.563885+00', false, NULL, NULL, true, NULL, 2850000.00, '[{"amount":2850000,"timestamp":"2026-05-05T05:01:11.368Z"}]', NULL);
INSERT INTO public.sales VALUES ('INV-1777962533893', 'CUST-1777961348903', 'YOHANES CORNELIUS', 10300000.00, 0.00, 10300000.00, 'Transfer', 'Sifa', '2026-05-05 06:28:56.398973+00', false, 'SN : ANGZP380029LEE', NULL, true, NULL, 10300000.00, '[{"amount":10300000,"timestamp":"2026-05-05T06:28:55.370Z"}]', NULL);
INSERT INTO public.sales VALUES ('INV-1777964773410', 'CUST-1777964511279', 'SYARIFA NUR FADILAH', 16500000.00, 0.00, 16500000.00, 'Transfer', 'Sifa', '2026-05-05 07:06:15.225467+00', false, 'TRF : 10.000.000 CASH 6.500.000', NULL, true, NULL, 16500000.00, '[{"amount":16500000,"timestamp":"2026-05-05T07:06:13.887Z"}]', NULL);
INSERT INTO public.sales VALUES ('INV-1777974983248', 'CUST-1777974692432', 'ANDRE TJAHYONO', 21500000.00, 0.00, 21500000.00, 'Transfer', 'Sifa', '2026-05-05 09:56:24.655209+00', false, 'FREE INSTAX MINI LIPLAY + NAVY,SANDISK EXTREME 32GB,TAS,ANTI GORES', NULL, true, NULL, 21500000.00, '[{"amount":21500000,"timestamp":"2026-05-05T09:56:23.416Z"}]', NULL);
INSERT INTO public.sales VALUES ('INV-1778038814307', 'CUST-1778038777392', 'DEWI CHRISTIANI WONGKAR', 265000.00, 0.00, 265000.00, 'QRIS', 'Sifa', '2026-05-06 03:40:14.538828+00', false, NULL, NULL, true, NULL, 265000.00, '[{"amount":265000,"timestamp":"2026-05-06T03:40:14.456Z"}]', NULL);


--
-- TOC entry 4353 (class 0 OID 23108)
-- Dependencies: 391
-- Data for Name: serial_numbers; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.serial_numbers VALUES ('SN-12345', 'BRC-1772017462526', 'Sold', '2026-02-25 11:04:23.499637+00');
INSERT INTO public.serial_numbers VALUES ('SN-92837', 'BRC-1772075407390', 'Sold', '2026-02-26 03:10:08.04648+00');
INSERT INTO public.serial_numbers VALUES ('SN-67723', 'BRC-1772075407390', 'In Stock', '2026-03-06 08:02:55.254742+00');
INSERT INTO public.serial_numbers VALUES ('SN-79362', 'BRC-1772075407390', 'In Stock', '2026-03-06 08:02:55.254742+00');
INSERT INTO public.serial_numbers VALUES ('SN-10294', 'BRC-1772075407390', 'In Stock', '2026-03-06 08:21:47.633232+00');
INSERT INTO public.serial_numbers VALUES ('SN-78993', 'BRC-1772017462526', 'In Stock', '2026-03-06 08:35:05.180679+00');
INSERT INTO public.serial_numbers VALUES ('SN-92384', 'BRC-1772017462526', 'Sold', '2026-03-06 08:21:35.373205+00');
INSERT INTO public.serial_numbers VALUES ('SN-83942', 'BRC-1772075575556', 'Sold', '2026-02-26 03:12:57.066677+00');
INSERT INTO public.serial_numbers VALUES ('SN-12123', 'BRC-1772075407390', 'Sold', '2026-03-06 07:36:06.938184+00');
INSERT INTO public.serial_numbers VALUES ('SN-92881', 'BRC-1772075575556', 'Sold', '2026-03-06 07:43:26.484321+00');
INSERT INTO public.serial_numbers VALUES ('SN-53914', 'BRC-1772075575556', 'Sold', '2026-03-06 07:43:26.484321+00');
INSERT INTO public.serial_numbers VALUES ('SN-19283', 'BRC-1772075575556', 'Sold', '2026-03-06 08:21:25.393793+00');
INSERT INTO public.serial_numbers VALUES ('SN-91028', 'BRC-1772075407390', 'Sold', '2026-03-06 08:02:55.254742+00');
INSERT INTO public.serial_numbers VALUES ('4547410562331', 'BRC-1773371930013', 'Damaged', '2026-03-13 03:49:40.848412+00');
INSERT INTO public.serial_numbers VALUES ('4547410562332', 'BRC-1773371930013', 'Damaged', '2026-03-13 05:03:26.429375+00');
INSERT INTO public.serial_numbers VALUES ('fwefwefwefwefrwdascxzzxfwefczwefwefwe12323', 'BRC-1776563913411', 'Damaged', '2026-04-19 02:02:11.024816+00');
INSERT INTO public.serial_numbers VALUES ('4547410562320', 'BRC-1773371930013', 'Sold', '2026-03-13 03:18:50.193263+00');
INSERT INTO public.serial_numbers VALUES ('4547410562330', 'BRC-1773371930013', 'Sold', '2026-03-13 08:16:33.852503+00');
INSERT INTO public.serial_numbers VALUES ('1581F4XFC2347007YK5P', 'BRC-1773721384653', 'In Stock', '2026-03-17 04:23:05.380883+00');
INSERT INTO public.serial_numbers VALUES ('1581F4XFC2347007YL77', 'BRC-1773721384653', 'In Stock', '2026-03-17 04:23:05.769132+00');
INSERT INTO public.serial_numbers VALUES ('5WTZN9K002F5NH', 'BRC-1773722333794', 'Sold', '2026-03-17 04:38:54.40287+00');
INSERT INTO public.serial_numbers VALUES ('1581F9DEC2616029XRTL', 'BRC-1773722244587', 'Sold', '2026-03-17 04:37:35.254102+00');
INSERT INTO public.serial_numbers VALUES ('9LTZP1700C8ZTR', 'BRC-1773722064202', 'Sold', '2026-03-17 04:34:24.896996+00');
INSERT INTO public.serial_numbers VALUES ('saadadasd', 'BRC-1774849189478', 'Damaged', '2026-03-30 05:39:50.210045+00');
INSERT INTO public.serial_numbers VALUES ('ssadsdsa', 'BRC-1774849189478', 'Damaged', '2026-03-30 05:39:49.838464+00');
INSERT INTO public.serial_numbers VALUES ('82193041', 'BRC-1774885409032', 'Damaged', '2026-03-30 15:43:28.729331+00');
INSERT INTO public.serial_numbers VALUES ('89213912', 'BRC-1774885409032', 'In Stock', '2026-03-30 15:51:15.615471+00');
INSERT INTO public.serial_numbers VALUES ('4547410562333', 'BRC-1773385731477', 'Sold', '2026-03-13 07:08:51.839195+00');
INSERT INTO public.serial_numbers VALUES ('9LTZNCJ00CADHN', 'BRC-1773722064202', 'Sold', '2026-03-17 04:34:25.282309+00');
INSERT INTO public.serial_numbers VALUES ('231313123123123www', 'BRC-1773722333794', 'In Stock', '2026-04-17 17:32:53.186251+00');
INSERT INTO public.serial_numbers VALUES ('231313123123123', 'BRC-1773722333794', 'Sold', '2026-04-17 17:32:53.186251+00');
INSERT INTO public.serial_numbers VALUES ('adasadsdsadsadasdasd', 'BRC-1776447256318', 'Sold', '2026-04-17 17:34:17.331232+00');
INSERT INTO public.serial_numbers VALUES ('asdadsdasdasdsa', 'BRC-1776447256318', 'Sold', '2026-04-17 17:34:17.694169+00');
INSERT INTO public.serial_numbers VALUES ('xxxxxxxxxxxxxxxxxxx', 'BRC-1776448220392', 'In Stock', '2026-04-17 17:50:21.503392+00');
INSERT INTO public.serial_numbers VALUES ('xxxxcacx', 'BRC-1776448220392', 'In Stock', '2026-04-17 17:50:21.881962+00');
INSERT INTO public.serial_numbers VALUES ('xcsxcsdfdcx', 'BRC-1776448220392', 'In Stock', '2026-04-17 17:50:22.257344+00');
INSERT INTO public.serial_numbers VALUES ('asdadasdasdsadsa', 'BRC-1776447256318', 'Damaged', '2026-04-17 17:34:18.058391+00');
INSERT INTO public.serial_numbers VALUES ('216065000059', 'BRC-1774840575626', 'Sold', '2026-03-30 03:16:16.209687+00');
INSERT INTO public.serial_numbers VALUES ('92026927', 'BRC-1774849189478', 'Sold', '2026-03-30 05:41:02.482044+00');
INSERT INTO public.serial_numbers VALUES ('asddads', 'BRC-1776563913411', 'Damaged', '2026-04-19 01:58:34.708457+00');
INSERT INTO public.serial_numbers VALUES ('fwefwefwefwesdq', 'BRC-1776563913411', 'Damaged', '2026-04-19 02:02:11.024816+00');
INSERT INTO public.serial_numbers VALUES ('asdasdasd', 'BRC-1776563913411', 'Sold', '2026-04-19 02:01:23.686913+00');
INSERT INTO public.serial_numbers VALUES ('fwefwefwefwefwsd', 'BRC-1776563913411', 'Damaged', '2026-04-19 02:02:11.024816+00');
INSERT INTO public.serial_numbers VALUES ('fwefwefwefwe12321', 'BRC-1776563913411', 'Damaged', '2026-04-19 02:02:11.024816+00');
INSERT INTO public.serial_numbers VALUES ('Abcde', 'BRC-1776447256318', 'Sold', '2026-04-18 03:52:55.412777+00');
INSERT INTO public.serial_numbers VALUES ('fwefwefwefwef23', 'BRC-1776563913411', 'Sold', '2026-04-19 02:02:11.024816+00');
INSERT INTO public.serial_numbers VALUES ('fwefwefwefwefw', 'BRC-1776563913411', 'Sold', '2026-04-19 02:02:11.024816+00');
INSERT INTO public.serial_numbers VALUES ('fwefwefwefwew11', 'BRC-1776563913411', 'Sold', '2026-04-19 02:02:11.024816+00');
INSERT INTO public.serial_numbers VALUES ('fwefwefwefwewccc', 'BRC-1776563913411', 'Sold', '2026-04-19 02:02:11.024816+00');
INSERT INTO public.serial_numbers VALUES ('fwefwefwefwefq', 'BRC-1776563913411', 'Damaged', '2026-04-19 02:02:11.024816+00');
INSERT INTO public.serial_numbers VALUES ('fwefwefwefwesxcc', 'BRC-1776563913411', 'Damaged', '2026-04-19 02:02:11.024816+00');
INSERT INTO public.serial_numbers VALUES ('fwefwefwefweeqew', 'BRC-1776563913411', 'Damaged', '2026-04-19 02:02:11.024816+00');
INSERT INTO public.serial_numbers VALUES ('fwefwefwefwefw3w', 'BRC-1776563913411', 'Damaged', '2026-04-19 02:02:11.024816+00');
INSERT INTO public.serial_numbers VALUES ('fwefwefwefwef12az', 'BRC-1776563913411', 'Damaged', '2026-04-19 02:02:11.024816+00');
INSERT INTO public.serial_numbers VALUES ('fwefwefwefwefwws22312', 'BRC-1776563913411', 'Damaged', '2026-04-19 02:02:11.024816+00');
INSERT INTO public.serial_numbers VALUES ('asdassa', 'BRC-1776563913411', 'Damaged', '2026-04-19 16:26:34.917093+00');
INSERT INTO public.serial_numbers VALUES ('asdassaw23', 'BRC-1776563913411', 'Damaged', '2026-04-19 16:26:34.917093+00');
INSERT INTO public.serial_numbers VALUES ('123ABNH', 'BRC-1776563913411', 'Damaged', '2026-04-19 12:43:09.516789+00');
INSERT INTO public.serial_numbers VALUES ('fwefwefwefwe222', 'BRC-1776563913411', 'Damaged', '2026-04-19 02:02:11.024816+00');
INSERT INTO public.serial_numbers VALUES ('Ssss', 'BRC-1776484508644', 'Damaged', '2026-04-18 03:55:10.612546+00');
INSERT INTO public.serial_numbers VALUES ('ABC', 'BRC-1776484508644', 'Damaged', '2026-04-18 04:21:21.983143+00');
INSERT INTO public.serial_numbers VALUES ('92026929', 'BRC-1774849189478', 'Damaged', '2026-03-30 05:41:02.482044+00');
INSERT INTO public.serial_numbers VALUES ('sdadasd', 'BRC-1776616446818', 'Damaged', '2026-04-19 16:34:28.573419+00');
INSERT INTO public.serial_numbers VALUES ('Isikekcm', 'BRC-1773722244587', 'In Stock', '2026-04-21 03:09:14.440943+00');
INSERT INTO public.serial_numbers VALUES ('ssadddsdad', 'BRC-1776616446818', 'Damaged', '2026-04-19 16:34:08.114016+00');
INSERT INTO public.serial_numbers VALUES ('324242342342343', 'BRC-1776616446818', 'Damaged', '2026-04-19 16:40:35.285684+00');
INSERT INTO public.serial_numbers VALUES ('sdsq', 'BRC-1776616446818', 'Damaged', '2026-04-19 16:40:18.716298+00');
INSERT INTO public.serial_numbers VALUES ('sdsq221323', 'BRC-1776616446818', 'Damaged', '2026-04-19 16:40:18.716298+00');
INSERT INTO public.serial_numbers VALUES ('ACSVS', 'BRC-1773385731477', 'Damaged', '2026-04-19 17:26:04.589985+00');
INSERT INTO public.serial_numbers VALUES ('ACS', 'BRC-1773385731477', 'Damaged', '2026-04-19 17:26:04.589985+00');
INSERT INTO public.serial_numbers VALUES ('fasdsdsaasvcv xzc', 'BRC-1776621616110', 'In Stock', '2026-04-19 18:01:18.309586+00');
INSERT INTO public.serial_numbers VALUES ('adadsadvvew', 'BRC-1776621616110', 'Sold', '2026-04-19 18:00:45.865384+00');
INSERT INTO public.serial_numbers VALUES ('SNS12313', 'BRC-1776740162749', 'Damaged', '2026-04-21 02:56:21.201257+00');
INSERT INTO public.serial_numbers VALUES ('SN1231412', 'BRC-1776740162749', 'Damaged', '2026-04-21 02:56:03.385341+00');
INSERT INTO public.serial_numbers VALUES ('ew', 'BRC-1776621616110', 'Sold', '2026-04-19 18:00:16.8745+00');
INSERT INTO public.serial_numbers VALUES ('1581F9DEC25AG0296561', 'BRC-1773722244587', 'Sold', '2026-03-17 04:37:35.608449+00');
INSERT INTO public.serial_numbers VALUES ('Sjkdjmckc', 'BRC-1773722244587', 'In Stock', '2026-04-21 03:08:40.464662+00');
INSERT INTO public.serial_numbers VALUES ('Sjkdjmckcsapzx', 'BRC-1773722244587', 'In Stock', '2026-04-21 03:08:40.464662+00');
INSERT INTO public.serial_numbers VALUES ('Sjkdjmckcwwueuuejdx', 'BRC-1773722244587', 'In Stock', '2026-04-21 03:08:40.464662+00');
INSERT INTO public.serial_numbers VALUES ('Sjkdjmckcsapzxwiwiiwed', 'BRC-1773722244587', 'In Stock', '2026-04-21 03:08:40.464662+00');
INSERT INTO public.serial_numbers VALUES ('3242423423423435324ew', 'BRC-1776616446818', 'Damaged', '2026-04-19 16:40:35.285684+00');
INSERT INTO public.serial_numbers VALUES ('gyjhnhgv', 'BRC-1776616446818', 'Damaged', '2026-04-19 17:44:31.622498+00');
INSERT INTO public.serial_numbers VALUES ('sdadasdwqwws', 'BRC-1776616446818', 'Damaged', '2026-04-19 16:34:28.573419+00');
INSERT INTO public.serial_numbers VALUES ('3422355253er', 'BRC-1776616446818', 'Damaged', '2026-04-19 16:40:18.716298+00');
INSERT INTO public.serial_numbers VALUES ('dfsfd', 'BRC-1774849189478', 'Damaged', '2026-04-19 17:08:36.574977+00');
INSERT INTO public.serial_numbers VALUES ('fdsfdsds', 'BRC-1776621616110', 'Sold', '2026-04-19 18:00:25.405965+00');
INSERT INTO public.serial_numbers VALUES ('adadsad', 'BRC-1776621616110', 'Sold', '2026-04-19 18:00:45.865384+00');
INSERT INTO public.serial_numbers VALUES ('SSSSSS', 'BRC-1776742811200', 'Damaged', '2026-04-21 03:40:11.828778+00');
INSERT INTO public.serial_numbers VALUES ('6A017348/6AC02699', 'BRC-1776826417415', 'In Stock', '2026-04-22 02:53:39.185775+00');
INSERT INTO public.serial_numbers VALUES ('5D030574/5DC30923', 'BRC-1776826417415', 'In Stock', '2026-04-22 02:53:39.565304+00');
INSERT INTO public.serial_numbers VALUES ('5D030573/5DC30930', 'BRC-1776826417415', 'In Stock', '2026-04-22 02:53:39.923106+00');
INSERT INTO public.serial_numbers VALUES ('6A017320/6AC03027', 'BRC-1776826417415', 'In Stock', '2026-04-22 02:53:40.280578+00');
INSERT INTO public.serial_numbers VALUES ('6A017324/6AC03023', 'BRC-1776826417415', 'In Stock', '2026-04-22 02:53:40.995273+00');
INSERT INTO public.serial_numbers VALUES ('6A015010', 'BRC-1776826533566', 'In Stock', '2026-04-22 02:55:34.199889+00');
INSERT INTO public.serial_numbers VALUES ('6A015011', 'BRC-1776826533566', 'In Stock', '2026-04-22 02:55:34.57789+00');
INSERT INTO public.serial_numbers VALUES ('6A003784', 'BRC-1776826533566', 'In Stock', '2026-04-22 02:55:34.956161+00');
INSERT INTO public.serial_numbers VALUES ('5HA00124', 'BRC-1776826601980', 'In Stock', '2026-04-22 02:56:42.522839+00');
INSERT INTO public.serial_numbers VALUES ('6AA07499', 'BRC-1776826666010', 'In Stock', '2026-04-22 02:57:46.563427+00');
INSERT INTO public.serial_numbers VALUES ('6BA00752', 'BRC-1776826666010', 'In Stock', '2026-04-22 02:57:46.912817+00');
INSERT INTO public.serial_numbers VALUES ('58036367', 'BRC-1776826925517', 'Sold', '2026-04-22 03:02:06.18883+00');
INSERT INTO public.serial_numbers VALUES ('57028316', 'BRC-1776826925517', 'Sold', '2026-04-22 03:02:06.56599+00');
INSERT INTO public.serial_numbers VALUES ('5DA07299', 'BRC-1776826840791', 'Sold', '2026-04-22 03:00:41.386335+00');
INSERT INTO public.serial_numbers VALUES ('7455397-Q', 'BRC-1777621598471', 'Sold', '2026-05-01 07:46:40.191015+00');
INSERT INTO public.serial_numbers VALUES ('20031049', 'BRC-1777865969328', 'In Stock', '2026-05-04 03:39:29.941277+00');
INSERT INTO public.serial_numbers VALUES ('fasdsdsaas', 'BRC-1776621616110', 'Damaged', '2026-04-19 18:01:18.309586+00');
INSERT INTO public.serial_numbers VALUES ('7017117', 'BRC-1777866171796', 'In Stock', '2026-05-04 03:42:52.489053+00');
INSERT INTO public.serial_numbers VALUES ('sadsdasd', 'BRC-1776616446818', 'Damaged', '2026-04-19 16:34:07.7405+00');
INSERT INTO public.serial_numbers VALUES ('7019341', 'BRC-1777866102710', 'Sold', '2026-05-04 03:41:43.344434+00');
INSERT INTO public.serial_numbers VALUES ('21218082000429', 'BRC-1777883254139', 'Sold', '2026-05-04 08:27:34.775262+00');
INSERT INTO public.serial_numbers VALUES ('9T3XP3J00839WD', 'BRC-1777886617671', 'In Stock', '2026-05-04 09:23:38.327814+00');
INSERT INTO public.serial_numbers VALUES ('9T3XP3J00839VZ', 'BRC-1777886617671', 'In Stock', '2026-05-04 09:23:38.695338+00');
INSERT INTO public.serial_numbers VALUES ('ANGZP380029LEE', 'BRC-1777886655639', 'Sold', '2026-05-04 09:24:16.260239+00');
INSERT INTO public.serial_numbers VALUES ('C63X222LEPT', 'BRC-1777956951196', 'Sold', '2026-05-05 04:55:51.94901+00');
INSERT INTO public.serial_numbers VALUES ('ANGZP3M00204ZG', 'BRC-1777886655639', 'Sold', '2026-05-04 09:24:16.618158+00');
INSERT INTO public.serial_numbers VALUES ('21218082000428', 'BRC-1777883254139', 'Sold', '2026-05-05 07:01:01.192407+00');
INSERT INTO public.serial_numbers VALUES ('6AL00197/5DC57878', 'BRC-1777974779855', 'Sold', '2026-05-05 09:53:00.499224+00');
INSERT INTO public.serial_numbers VALUES ('M0641543757', 'BRC-1778045769816', 'In Stock', '2026-05-06 05:36:11.660664+00');
INSERT INTO public.serial_numbers VALUES ('M0641543741', 'BRC-1778045769816', 'In Stock', '2026-05-06 05:36:12.034626+00');
INSERT INTO public.serial_numbers VALUES ('M0641543780', 'BRC-1778045769816', 'In Stock', '2026-05-06 05:36:12.398117+00');
INSERT INTO public.serial_numbers VALUES ('M0641543779', 'BRC-1778045769816', 'In Stock', '2026-05-06 05:36:12.762285+00');
INSERT INTO public.serial_numbers VALUES ('M0641543781', 'BRC-1778045769816', 'In Stock', '2026-05-06 05:36:13.125742+00');
INSERT INTO public.serial_numbers VALUES ('M0641543740', 'BRC-1778045769816', 'In Stock', '2026-05-06 05:36:13.48914+00');
INSERT INTO public.serial_numbers VALUES ('M0641543756', 'BRC-1778045769816', 'In Stock', '2026-05-06 05:36:13.85272+00');
INSERT INTO public.serial_numbers VALUES ('M0641543760', 'BRC-1778045769816', 'In Stock', '2026-05-06 05:36:14.216388+00');
INSERT INTO public.serial_numbers VALUES ('M0641543761', 'BRC-1778045769816', 'In Stock', '2026-05-06 05:36:14.581315+00');
INSERT INTO public.serial_numbers VALUES ('M0641543758', 'BRC-1778045769816', 'In Stock', '2026-05-06 05:36:14.9445+00');


--
-- TOC entry 4354 (class 0 OID 23117)
-- Dependencies: 392
-- Data for Name: staff_members; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.staff_members VALUES ('ce1545cf-e884-4556-b6ea-b52c1b7e01c5', 'Sifa', 'Staff', NULL, '2026-02-26 04:23:42.431196+00', '2026-02-26 04:23:42.431196+00', 'c2lmYTEyMw==');
INSERT INTO public.staff_members VALUES ('44659944-d65f-4a1e-9a23-2e5d8911e343', 'Nancy', 'Admin', NULL, '2026-02-25 18:08:23+00', '2026-02-25 18:08:24+00', 'bmFuY3k=');
INSERT INTO public.staff_members VALUES ('2c06d260-c048-45d3-8281-00fc85dea28f', 'Mami', 'Admin', NULL, '2026-03-27 18:29:08.950408+00', '2026-03-27 18:29:08.950408+00', 'bWFtaTEyMw==');
INSERT INTO public.staff_members VALUES ('8b11545a-0d00-46d6-8b01-cdec2d16fbde', 'Vita', 'Admin', NULL, '2026-03-27 18:29:09.314903+00', '2026-03-27 18:29:09.314903+00', 'dml0YTEyMw==');


--
-- TOC entry 4355 (class 0 OID 23130)
-- Dependencies: 393
-- Data for Name: store_config; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.store_config VALUES (1, 'Sinar Bahagia Surabaya', 'Jl. Kramat Gantung No. 63, Genteng, Surabaya, 60174, Indonesia', 11.00, 'IDR', '2026-02-26 02:58:45.463619+00', 500000000);


--
-- TOC entry 4360 (class 0 OID 34520)
-- Dependencies: 398
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.suppliers VALUES ('b9326eaf-f737-4a36-8e46-c213ac576b75', 'Supplier 2A', '08919230455', 'Jl. Supplier 2A', true, '2026-03-13 02:34:17.014255');
INSERT INTO public.suppliers VALUES ('33110aab-1705-4b99-b84a-a589f27c7b1c', 'Fujifilm', '089181203524', 'Fujifilm St.', true, '2026-03-13 03:10:45.509065');
INSERT INTO public.suppliers VALUES ('43d12f46-6f40-4e88-9de2-cab2cf6330a6', 'DPR', '-', 'JAKARTA', false, '2026-05-04 04:25:47.486016');
INSERT INTO public.suppliers VALUES ('e75ce513-92f7-4529-a7ac-3dc3ff3d3fb7', 'Sony Indonesia', '021-1234567', 'Jakarta', true, '2026-03-13 02:33:14.947555');
INSERT INTO public.suppliers VALUES ('281b4dfc-e186-4128-890d-6adb16a23d43', 'PREMIERE PHOTOGRAPHY', '-', 'JAKARTA', false, '2026-05-06 05:31:29.338933');
INSERT INTO public.suppliers VALUES ('40577a64-3175-406e-8e5f-9e4376631c5e', 'DUTA SUKSES INDONESIA', '-', 'JAKARTA', false, '2026-05-06 05:33:05.282117');
INSERT INTO public.suppliers VALUES ('87aca54d-9497-421b-b123-a48d5aa083ec', 'PT. FUJIFILM INDONESIA', '-', 'jl.raya casablanca No.88 unit A 36th Floor, menteng dalam,kec tebet,kota jakarta selatan dki jakarta 12960', false, '2026-03-16 06:44:41.498845');
INSERT INTO public.suppliers VALUES ('716a1e31-5713-4092-8aaa-3bd87033ff9d', 'PT. SONY INDONESIA', '-', 'Jl. Jendral sudirman No. 28 Lt.23 Unit : 2301, RT.14/RW.1, Bend.Hilir kec.Tanah abang kota jakarta pusat DKI jakarta 10210', false, '2026-03-16 07:05:22.450348');
INSERT INTO public.suppliers VALUES ('b696428c-2b43-438e-a0ad-cb22e6d3951a', 'PT. DENKA PRATAMA INDONESIA', '-', 'gold coast office,pantai indah kapuk st no.6 lantai 22 unit H-J, RT.6/RW.2, Kamal Muara, penjaringan North jakarta city,jakarta 14470', false, '2026-03-16 07:07:50.852493');
INSERT INTO public.suppliers VALUES ('9982736f-1940-4ba9-beb9-fd87c7c35ba0', 'PT. DATACRIP', '-', 'Gedung Datascrip Kav9, Jl. Selaparang Blok B-15 RW.10, Gn Sahari Sel., Kec.Kemayoran DKI jakarta 10610', false, '2026-03-17 03:50:35.752884');
INSERT INTO public.suppliers VALUES ('9536f991-2e34-40eb-81c4-3c8222044ddb', 'PT. SINAR EKA SELARAS', '-', '-', false, '2026-03-17 04:18:19.069304');
INSERT INTO public.suppliers VALUES ('33926571-22be-4973-8415-5397751b68f4', 'IDOLA MILLENIUM', '-', '-', false, '2026-03-28 05:03:11.160987');
INSERT INTO public.suppliers VALUES ('48220e3f-6b84-4ff9-b196-14c493fea0af', 'a', 'sdasd', 'asda', true, '2026-04-11 17:18:49.877759');
INSERT INTO public.suppliers VALUES ('10ad16ba-ca54-49fc-9600-11c2342442e8', 'aasdad', 'sdasd', 'asda', true, '2026-04-11 17:18:52.460175');
INSERT INTO public.suppliers VALUES ('5ea24a5c-ade1-466c-991f-1b9a4a91d7dd', 'saddDA@', 'asdsa2q', 'sadasda', true, '2026-04-17 17:34:50.168541');
INSERT INTO public.suppliers VALUES ('1586859a-9bb6-4963-86ff-632b13d65b33', 'TESS', '08988982', 'Jalan', true, '2026-04-17 20:39:08.242925');
INSERT INTO public.suppliers VALUES ('558c2392-f447-4a24-8f3a-3e634f8feb6f', 'TesTes', '555029833', 'BbJalan mawar', true, '2026-04-18 04:23:52.140638');
INSERT INTO public.suppliers VALUES ('e8364bc2-ebfb-4bdc-b20d-7e8a0ef9f39c', 'asdsdad', 'asdas', 'dsads', true, '2026-04-19 01:58:57.411108');
INSERT INTO public.suppliers VALUES ('7a948741-9c92-47ea-956e-fb5ccd67ce68', ' TESs E', NULL, NULL, true, '2026-04-19 16:45:00.649672');
INSERT INTO public.suppliers VALUES ('2c1b7831-22dd-48e8-a9b2-9e64500baa26', ' dzyrd g', 'fzgfgz', ' zfdg', true, '2026-04-19 16:45:16.018935');
INSERT INTO public.suppliers VALUES ('36628b0d-153a-4319-a06f-a7bcf422d918', ' yrrzd', 'dz g', 'fd zg', true, '2026-04-19 16:54:41.133618');
INSERT INTO public.suppliers VALUES ('e779d07e-7d7e-42cf-af2f-6fe8c0c576c5', '23432', '42324', '24234324', true, '2026-04-19 16:43:59.194514');
INSERT INTO public.suppliers VALUES ('5ff072f4-f670-4455-9872-5588bf7d939e', '3123212e', '2', '212', true, '2026-04-19 16:44:15.721061');
INSERT INTO public.suppliers VALUES ('eedb8990-546e-45d8-a86a-b02ea5bd070b', '455y5e4ye', NULL, NULL, true, '2026-04-19 16:44:43.261324');
INSERT INTO public.suppliers VALUES ('6e5582d7-11d1-400d-9630-b39bd510e58b', 'as', NULL, NULL, true, '2026-04-19 16:44:39.19356');
INSERT INTO public.suppliers VALUES ('55d12c25-b7f9-473a-912a-324313ec234e', 'asdas', 'ada', 'dsdadda', true, '2026-04-19 16:43:52.599982');
INSERT INTO public.suppliers VALUES ('7f0d5c77-3053-4414-add0-218bb9124276', 'bsbd', 'v', 'bd', true, '2026-04-19 16:54:35.071903');
INSERT INTO public.suppliers VALUES ('3b04742f-a109-4b4d-bcca-683d22da6b30', 'c', NULL, 'zzz', true, '2026-04-19 16:54:25.454821');
INSERT INTO public.suppliers VALUES ('6c2e8c22-2598-4953-a5ba-6c712bde6045', 'dvzbd', 'x ccv', 'ndw45rq ', true, '2026-04-19 16:44:24.504696');
INSERT INTO public.suppliers VALUES ('7141d0b9-3ba5-4a87-bfcb-e06c510b3973', 'jycg ', 'hfh t', NULL, true, '2026-04-19 16:45:10.756769');
INSERT INTO public.suppliers VALUES ('9e17e6a6-38bb-41a1-9733-b88e26d5dbec', 'zsc', 'zs', 'sczs', true, '2026-04-19 16:54:30.169619');
INSERT INTO public.suppliers VALUES ('36312c5f-e877-4fc5-a516-b5990f5e452d', 'zfcb ', ' v vv', NULL, true, '2026-04-19 16:44:54.474658');
INSERT INTO public.suppliers VALUES ('c5b2132a-315b-4dcc-8805-812b9ef365fe', 'zdgf', 'v', 'xvxcxv', true, '2026-04-19 16:44:34.58163');
INSERT INTO public.suppliers VALUES ('8a39fcbc-f2d6-4c0b-87b4-0f35d8e0ba44', 'wsdasfdgdg', 'fsdfsdsfsd', 'sddsgsgbcvcx', true, '2026-04-19 16:44:05.178855');
INSERT INTO public.suppliers VALUES ('e13c1c8f-e6c2-4988-837e-374f9acbfa1f', 'CV. CAMZONE ', '087246835', 'ITC FATMAWATI LT2 NO.37A', false, '2026-03-30 03:14:11.912421');
INSERT INTO public.suppliers VALUES ('0a6c89e6-004e-4cb1-bfda-367645d26aab', 'TES123', '0981209180412', 'Jl. Jalan', true, '2026-04-21 03:00:39.400797');
INSERT INTO public.suppliers VALUES ('31465e3b-678d-4c88-868b-cb25c70505db', 'Sas', NULL, 'Sas', true, '2026-04-21 03:10:29.374883');
INSERT INTO public.suppliers VALUES ('4dbabf5d-528a-45ff-87e2-937be7b90307', 'tes', NULL, NULL, true, '2026-04-21 03:39:26.225606');
INSERT INTO public.suppliers VALUES ('2a30e382-8cba-4690-816f-be9014dbe77c', 'PT. ALTA NIKINDO', '-', 'KOMPLEK MANGGA DUA SQUARE BLOK H NO. 1-2 JAKARTA UTARA', false, '2026-05-04 03:34:32.025815');


--
-- TOC entry 4356 (class 0 OID 23141)
-- Dependencies: 394
-- Data for Name: warranty_claims; Type: TABLE DATA; Schema: public; Owner: -
--



--
-- TOC entry 4345 (class 0 OID 17267)
-- Dependencies: 379
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: -
--

INSERT INTO realtime.schema_migrations VALUES (20211116024918, '2026-02-12 18:38:30');
INSERT INTO realtime.schema_migrations VALUES (20211116045059, '2026-02-12 18:38:31');
INSERT INTO realtime.schema_migrations VALUES (20211116050929, '2026-02-12 18:38:32');
INSERT INTO realtime.schema_migrations VALUES (20211116051442, '2026-02-12 18:38:32');
INSERT INTO realtime.schema_migrations VALUES (20211116212300, '2026-02-12 18:38:33');
INSERT INTO realtime.schema_migrations VALUES (20211116213355, '2026-02-12 18:38:34');
INSERT INTO realtime.schema_migrations VALUES (20211116213934, '2026-02-12 18:38:35');
INSERT INTO realtime.schema_migrations VALUES (20211116214523, '2026-02-12 18:38:36');
INSERT INTO realtime.schema_migrations VALUES (20211122062447, '2026-02-12 18:38:36');
INSERT INTO realtime.schema_migrations VALUES (20211124070109, '2026-02-12 18:38:37');
INSERT INTO realtime.schema_migrations VALUES (20211202204204, '2026-02-12 18:38:38');
INSERT INTO realtime.schema_migrations VALUES (20211202204605, '2026-02-12 18:38:38');
INSERT INTO realtime.schema_migrations VALUES (20211210212804, '2026-02-12 18:38:40');
INSERT INTO realtime.schema_migrations VALUES (20211228014915, '2026-02-12 18:38:41');
INSERT INTO realtime.schema_migrations VALUES (20220107221237, '2026-02-12 18:38:42');
INSERT INTO realtime.schema_migrations VALUES (20220228202821, '2026-02-12 18:38:43');
INSERT INTO realtime.schema_migrations VALUES (20220312004840, '2026-02-12 18:38:43');
INSERT INTO realtime.schema_migrations VALUES (20220603231003, '2026-02-12 18:38:44');
INSERT INTO realtime.schema_migrations VALUES (20220603232444, '2026-02-12 18:38:45');
INSERT INTO realtime.schema_migrations VALUES (20220615214548, '2026-02-12 18:38:46');
INSERT INTO realtime.schema_migrations VALUES (20220712093339, '2026-02-12 18:38:47');
INSERT INTO realtime.schema_migrations VALUES (20220908172859, '2026-02-12 18:38:47');
INSERT INTO realtime.schema_migrations VALUES (20220916233421, '2026-02-12 18:38:48');
INSERT INTO realtime.schema_migrations VALUES (20230119133233, '2026-02-12 18:38:49');
INSERT INTO realtime.schema_migrations VALUES (20230128025114, '2026-02-12 18:38:50');
INSERT INTO realtime.schema_migrations VALUES (20230128025212, '2026-02-12 18:38:50');
INSERT INTO realtime.schema_migrations VALUES (20230227211149, '2026-02-12 18:38:51');
INSERT INTO realtime.schema_migrations VALUES (20230228184745, '2026-02-12 18:38:52');
INSERT INTO realtime.schema_migrations VALUES (20230308225145, '2026-02-12 18:38:52');
INSERT INTO realtime.schema_migrations VALUES (20230328144023, '2026-02-12 18:38:53');
INSERT INTO realtime.schema_migrations VALUES (20231018144023, '2026-02-12 18:38:54');
INSERT INTO realtime.schema_migrations VALUES (20231204144023, '2026-02-12 18:38:55');
INSERT INTO realtime.schema_migrations VALUES (20231204144024, '2026-02-12 18:38:56');
INSERT INTO realtime.schema_migrations VALUES (20231204144025, '2026-02-12 18:38:56');
INSERT INTO realtime.schema_migrations VALUES (20240108234812, '2026-02-12 18:38:57');
INSERT INTO realtime.schema_migrations VALUES (20240109165339, '2026-02-12 18:38:58');
INSERT INTO realtime.schema_migrations VALUES (20240227174441, '2026-02-12 18:38:59');
INSERT INTO realtime.schema_migrations VALUES (20240311171622, '2026-02-12 18:39:00');
INSERT INTO realtime.schema_migrations VALUES (20240321100241, '2026-02-12 18:39:01');
INSERT INTO realtime.schema_migrations VALUES (20240401105812, '2026-02-12 18:39:03');
INSERT INTO realtime.schema_migrations VALUES (20240418121054, '2026-02-12 18:39:04');
INSERT INTO realtime.schema_migrations VALUES (20240523004032, '2026-02-12 18:39:07');
INSERT INTO realtime.schema_migrations VALUES (20240618124746, '2026-02-12 18:39:07');
INSERT INTO realtime.schema_migrations VALUES (20240801235015, '2026-02-12 18:39:08');
INSERT INTO realtime.schema_migrations VALUES (20240805133720, '2026-02-12 18:39:09');
INSERT INTO realtime.schema_migrations VALUES (20240827160934, '2026-02-12 18:39:09');
INSERT INTO realtime.schema_migrations VALUES (20240919163303, '2026-02-12 18:39:10');
INSERT INTO realtime.schema_migrations VALUES (20240919163305, '2026-02-12 18:39:11');
INSERT INTO realtime.schema_migrations VALUES (20241019105805, '2026-02-12 18:39:12');
INSERT INTO realtime.schema_migrations VALUES (20241030150047, '2026-02-12 18:39:14');
INSERT INTO realtime.schema_migrations VALUES (20241108114728, '2026-02-12 18:39:15');
INSERT INTO realtime.schema_migrations VALUES (20241121104152, '2026-02-12 18:39:16');
INSERT INTO realtime.schema_migrations VALUES (20241130184212, '2026-02-12 18:39:17');
INSERT INTO realtime.schema_migrations VALUES (20241220035512, '2026-02-12 18:39:17');
INSERT INTO realtime.schema_migrations VALUES (20241220123912, '2026-02-12 18:39:18');
INSERT INTO realtime.schema_migrations VALUES (20241224161212, '2026-02-12 18:39:19');
INSERT INTO realtime.schema_migrations VALUES (20250107150512, '2026-02-12 18:39:19');
INSERT INTO realtime.schema_migrations VALUES (20250110162412, '2026-02-12 18:39:20');
INSERT INTO realtime.schema_migrations VALUES (20250123174212, '2026-02-12 18:39:21');
INSERT INTO realtime.schema_migrations VALUES (20250128220012, '2026-02-12 18:39:22');
INSERT INTO realtime.schema_migrations VALUES (20250506224012, '2026-02-12 18:39:22');
INSERT INTO realtime.schema_migrations VALUES (20250523164012, '2026-02-12 18:39:23');
INSERT INTO realtime.schema_migrations VALUES (20250714121412, '2026-02-12 18:39:23');
INSERT INTO realtime.schema_migrations VALUES (20250905041441, '2026-02-12 18:39:24');
INSERT INTO realtime.schema_migrations VALUES (20251103001201, '2026-02-12 18:39:25');
INSERT INTO realtime.schema_migrations VALUES (20251120212548, '2026-02-12 18:39:26');
INSERT INTO realtime.schema_migrations VALUES (20251120215549, '2026-02-12 18:39:26');
INSERT INTO realtime.schema_migrations VALUES (20260218120000, '2026-03-05 08:06:59');
INSERT INTO realtime.schema_migrations VALUES (20260326120000, '2026-04-11 17:24:36');


--
-- TOC entry 4347 (class 0 OID 17289)
-- Dependencies: 382
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: -
--



--
-- TOC entry 4338 (class 0 OID 17086)
-- Dependencies: 372
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: -
--



--
-- TOC entry 4342 (class 0 OID 17206)
-- Dependencies: 376
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: -
--



--
-- TOC entry 4343 (class 0 OID 17219)
-- Dependencies: 377
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: -
--



--
-- TOC entry 4337 (class 0 OID 17078)
-- Dependencies: 371
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: -
--

INSERT INTO storage.migrations VALUES (0, 'create-migrations-table', 'e18db593bcde2aca2a408c4d1100f6abba2195df', '2026-02-12 15:05:13.663897');
INSERT INTO storage.migrations VALUES (1, 'initialmigration', '6ab16121fbaa08bbd11b712d05f358f9b555d777', '2026-02-12 15:05:13.739893');
INSERT INTO storage.migrations VALUES (2, 'storage-schema', 'f6a1fa2c93cbcd16d4e487b362e45fca157a8dbd', '2026-02-12 15:05:13.832158');
INSERT INTO storage.migrations VALUES (3, 'pathtoken-column', '2cb1b0004b817b29d5b0a971af16bafeede4b70d', '2026-02-12 15:05:13.872461');
INSERT INTO storage.migrations VALUES (4, 'add-migrations-rls', '427c5b63fe1c5937495d9c635c263ee7a5905058', '2026-02-12 15:05:13.889672');
INSERT INTO storage.migrations VALUES (5, 'add-size-functions', '79e081a1455b63666c1294a440f8ad4b1e6a7f84', '2026-02-12 15:05:13.895466');
INSERT INTO storage.migrations VALUES (6, 'change-column-name-in-get-size', 'ded78e2f1b5d7e616117897e6443a925965b30d2', '2026-02-12 15:05:13.902559');
INSERT INTO storage.migrations VALUES (7, 'add-rls-to-buckets', 'e7e7f86adbc51049f341dfe8d30256c1abca17aa', '2026-02-12 15:05:13.909508');
INSERT INTO storage.migrations VALUES (8, 'add-public-to-buckets', 'fd670db39ed65f9d08b01db09d6202503ca2bab3', '2026-02-12 15:05:13.915189');
INSERT INTO storage.migrations VALUES (9, 'fix-search-function', 'af597a1b590c70519b464a4ab3be54490712796b', '2026-02-12 15:05:13.921489');
INSERT INTO storage.migrations VALUES (10, 'search-files-search-function', 'b595f05e92f7e91211af1bbfe9c6a13bb3391e16', '2026-02-12 15:05:13.927624');
INSERT INTO storage.migrations VALUES (11, 'add-trigger-to-auto-update-updated_at-column', '7425bdb14366d1739fa8a18c83100636d74dcaa2', '2026-02-12 15:05:13.934304');
INSERT INTO storage.migrations VALUES (12, 'add-automatic-avif-detection-flag', '8e92e1266eb29518b6a4c5313ab8f29dd0d08df9', '2026-02-12 15:05:13.940708');
INSERT INTO storage.migrations VALUES (13, 'add-bucket-custom-limits', 'cce962054138135cd9a8c4bcd531598684b25e7d', '2026-02-12 15:05:13.946812');
INSERT INTO storage.migrations VALUES (14, 'use-bytes-for-max-size', '941c41b346f9802b411f06f30e972ad4744dad27', '2026-02-12 15:05:13.953025');
INSERT INTO storage.migrations VALUES (15, 'add-can-insert-object-function', '934146bc38ead475f4ef4b555c524ee5d66799e5', '2026-02-12 15:05:13.995131');
INSERT INTO storage.migrations VALUES (16, 'add-version', '76debf38d3fd07dcfc747ca49096457d95b1221b', '2026-02-12 15:05:14.006065');
INSERT INTO storage.migrations VALUES (17, 'drop-owner-foreign-key', 'f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101', '2026-02-12 15:05:14.012414');
INSERT INTO storage.migrations VALUES (18, 'add_owner_id_column_deprecate_owner', 'e7a511b379110b08e2f214be852c35414749fe66', '2026-02-12 15:05:14.018176');
INSERT INTO storage.migrations VALUES (19, 'alter-default-value-objects-id', '02e5e22a78626187e00d173dc45f58fa66a4f043', '2026-02-12 15:05:14.027176');
INSERT INTO storage.migrations VALUES (20, 'list-objects-with-delimiter', 'cd694ae708e51ba82bf012bba00caf4f3b6393b7', '2026-02-12 15:05:14.03307');
INSERT INTO storage.migrations VALUES (21, 's3-multipart-uploads', '8c804d4a566c40cd1e4cc5b3725a664a9303657f', '2026-02-12 15:05:14.040815');
INSERT INTO storage.migrations VALUES (22, 's3-multipart-uploads-big-ints', '9737dc258d2397953c9953d9b86920b8be0cdb73', '2026-02-12 15:05:14.057683');
INSERT INTO storage.migrations VALUES (23, 'optimize-search-function', '9d7e604cddc4b56a5422dc68c9313f4a1b6f132c', '2026-02-12 15:05:14.081501');
INSERT INTO storage.migrations VALUES (24, 'operation-function', '8312e37c2bf9e76bbe841aa5fda889206d2bf8aa', '2026-02-12 15:05:14.088053');
INSERT INTO storage.migrations VALUES (25, 'custom-metadata', 'd974c6057c3db1c1f847afa0e291e6165693b990', '2026-02-12 15:05:14.093979');
INSERT INTO storage.migrations VALUES (26, 'objects-prefixes', '215cabcb7f78121892a5a2037a09fedf9a1ae322', '2026-02-12 15:05:14.104791');
INSERT INTO storage.migrations VALUES (27, 'search-v2', '859ba38092ac96eb3964d83bf53ccc0b141663a6', '2026-02-12 15:05:14.110264');
INSERT INTO storage.migrations VALUES (28, 'object-bucket-name-sorting', 'c73a2b5b5d4041e39705814fd3a1b95502d38ce4', '2026-02-12 15:05:14.115772');
INSERT INTO storage.migrations VALUES (29, 'create-prefixes', 'ad2c1207f76703d11a9f9007f821620017a66c21', '2026-02-12 15:05:14.121247');
INSERT INTO storage.migrations VALUES (30, 'update-object-levels', '2be814ff05c8252fdfdc7cfb4b7f5c7e17f0bed6', '2026-02-12 15:05:14.126757');
INSERT INTO storage.migrations VALUES (31, 'objects-level-index', 'b40367c14c3440ec75f19bbce2d71e914ddd3da0', '2026-02-12 15:05:14.13227');
INSERT INTO storage.migrations VALUES (32, 'backward-compatible-index-on-objects', 'e0c37182b0f7aee3efd823298fb3c76f1042c0f7', '2026-02-12 15:05:14.137739');
INSERT INTO storage.migrations VALUES (33, 'backward-compatible-index-on-prefixes', 'b480e99ed951e0900f033ec4eb34b5bdcb4e3d49', '2026-02-12 15:05:14.143329');
INSERT INTO storage.migrations VALUES (34, 'optimize-search-function-v1', 'ca80a3dc7bfef894df17108785ce29a7fc8ee456', '2026-02-12 15:05:14.148811');
INSERT INTO storage.migrations VALUES (35, 'add-insert-trigger-prefixes', '458fe0ffd07ec53f5e3ce9df51bfdf4861929ccc', '2026-02-12 15:05:14.154991');
INSERT INTO storage.migrations VALUES (36, 'optimise-existing-functions', '6ae5fca6af5c55abe95369cd4f93985d1814ca8f', '2026-02-12 15:05:14.161058');
INSERT INTO storage.migrations VALUES (37, 'add-bucket-name-length-trigger', '3944135b4e3e8b22d6d4cbb568fe3b0b51df15c1', '2026-02-12 15:05:14.1668');
INSERT INTO storage.migrations VALUES (38, 'iceberg-catalog-flag-on-buckets', '02716b81ceec9705aed84aa1501657095b32e5c5', '2026-02-12 15:05:14.173185');
INSERT INTO storage.migrations VALUES (39, 'add-search-v2-sort-support', '6706c5f2928846abee18461279799ad12b279b78', '2026-02-12 15:05:14.191434');
INSERT INTO storage.migrations VALUES (40, 'fix-prefix-race-conditions-optimized', '7ad69982ae2d372b21f48fc4829ae9752c518f6b', '2026-02-12 15:05:14.197025');
INSERT INTO storage.migrations VALUES (41, 'add-object-level-update-trigger', '07fcf1a22165849b7a029deed059ffcde08d1ae0', '2026-02-12 15:05:14.202779');
INSERT INTO storage.migrations VALUES (42, 'rollback-prefix-triggers', '771479077764adc09e2ea2043eb627503c034cd4', '2026-02-12 15:05:14.208364');
INSERT INTO storage.migrations VALUES (43, 'fix-object-level', '84b35d6caca9d937478ad8a797491f38b8c2979f', '2026-02-12 15:05:14.214204');
INSERT INTO storage.migrations VALUES (44, 'vector-bucket-type', '99c20c0ffd52bb1ff1f32fb992f3b351e3ef8fb3', '2026-02-12 15:05:14.219905');
INSERT INTO storage.migrations VALUES (45, 'vector-buckets', '049e27196d77a7cb76497a85afae669d8b230953', '2026-02-12 15:05:14.226309');
INSERT INTO storage.migrations VALUES (46, 'buckets-objects-grants', 'fedeb96d60fefd8e02ab3ded9fbde05632f84aed', '2026-02-12 15:05:14.250407');
INSERT INTO storage.migrations VALUES (47, 'iceberg-table-metadata', '649df56855c24d8b36dd4cc1aeb8251aa9ad42c2', '2026-02-12 15:05:14.256878');
INSERT INTO storage.migrations VALUES (48, 'iceberg-catalog-ids', 'e0e8b460c609b9999ccd0df9ad14294613eed939', '2026-02-12 15:05:14.262757');
INSERT INTO storage.migrations VALUES (49, 'buckets-objects-grants-postgres', '072b1195d0d5a2f888af6b2302a1938dd94b8b3d', '2026-02-12 15:05:14.28284');
INSERT INTO storage.migrations VALUES (50, 'search-v2-optimised', '6323ac4f850aa14e7387eb32102869578b5bd478', '2026-02-12 15:05:14.289457');
INSERT INTO storage.migrations VALUES (51, 'index-backward-compatible-search', '2ee395d433f76e38bcd3856debaf6e0e5b674011', '2026-02-12 15:05:17.021432');
INSERT INTO storage.migrations VALUES (52, 'drop-not-used-indexes-and-functions', '5cc44c8696749ac11dd0dc37f2a3802075f3a171', '2026-02-12 15:05:17.023717');
INSERT INTO storage.migrations VALUES (53, 'drop-index-lower-name', 'd0cb18777d9e2a98ebe0bc5cc7a42e57ebe41854', '2026-02-12 15:05:17.041414');
INSERT INTO storage.migrations VALUES (54, 'drop-index-object-level', '6289e048b1472da17c31a7eba1ded625a6457e67', '2026-02-12 15:05:17.044833');
INSERT INTO storage.migrations VALUES (55, 'prevent-direct-deletes', '262a4798d5e0f2e7c8970232e03ce8be695d5819', '2026-02-12 15:05:17.046968');
INSERT INTO storage.migrations VALUES (57, 's3-multipart-uploads-metadata', 'f127886e00d1b374fadbc7c6b31e09336aad5287', '2026-04-11 17:24:38.747097');
INSERT INTO storage.migrations VALUES (58, 'operation-ergonomics', '00ca5d483b3fe0d522133d9002ccc5df98365120', '2026-04-11 17:24:38.762655');
INSERT INTO storage.migrations VALUES (56, 'fix-optimized-search-function', 'b823ed1e418101032fa01374edc9a436e54e3ed4', '2026-02-12 15:05:17.054401');
INSERT INTO storage.migrations VALUES (59, 'drop-unused-functions', '38456f13e39691c2bbb4b5151d0d1cdbabd4a8c4', '2026-05-07 16:39:40.776188');
INSERT INTO storage.migrations VALUES (60, 'optimize-existing-functions-again', 'db35e1c91a9201e59f4fef8d972c2f277d68b157', '2026-05-07 16:39:40.784134');


--
-- TOC entry 4339 (class 0 OID 17096)
-- Dependencies: 373
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: -
--



--
-- TOC entry 4340 (class 0 OID 17145)
-- Dependencies: 374
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: -
--



--
-- TOC entry 4341 (class 0 OID 17159)
-- Dependencies: 375
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: -
--



--
-- TOC entry 4344 (class 0 OID 17229)
-- Dependencies: 378
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: -
--



--
-- TOC entry 3734 (class 0 OID 16608)
-- Dependencies: 354
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: -
--



--
-- TOC entry 4371 (class 0 OID 0)
-- Dependencies: 349
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: -
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 1, false);


--
-- TOC entry 4372 (class 0 OID 0)
-- Dependencies: 395
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: -
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 1, false);


--
-- TOC entry 4373 (class 0 OID 0)
-- Dependencies: 381
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: -
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 1, false);


--
-- TOC entry 3960 (class 2606 OID 16783)
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- TOC entry 3929 (class 2606 OID 16531)
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- TOC entry 4081 (class 2606 OID 26563)
-- Name: custom_oauth_providers custom_oauth_providers_identifier_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_identifier_key UNIQUE (identifier);


--
-- TOC entry 4083 (class 2606 OID 26561)
-- Name: custom_oauth_providers custom_oauth_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_pkey PRIMARY KEY (id);


--
-- TOC entry 3983 (class 2606 OID 16889)
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- TOC entry 3938 (class 2606 OID 16907)
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- TOC entry 3940 (class 2606 OID 16917)
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- TOC entry 3927 (class 2606 OID 16524)
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- TOC entry 3962 (class 2606 OID 16776)
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- TOC entry 3958 (class 2606 OID 16764)
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- TOC entry 3950 (class 2606 OID 16957)
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- TOC entry 3952 (class 2606 OID 16751)
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- TOC entry 3996 (class 2606 OID 17016)
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- TOC entry 3998 (class 2606 OID 17014)
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- TOC entry 4000 (class 2606 OID 17012)
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- TOC entry 4010 (class 2606 OID 17074)
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- TOC entry 3993 (class 2606 OID 16976)
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- TOC entry 4004 (class 2606 OID 17038)
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- TOC entry 4006 (class 2606 OID 17040)
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- TOC entry 3987 (class 2606 OID 16942)
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 3921 (class 2606 OID 16514)
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 3924 (class 2606 OID 16694)
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- TOC entry 3972 (class 2606 OID 16823)
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- TOC entry 3974 (class 2606 OID 16821)
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- TOC entry 3979 (class 2606 OID 16837)
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- TOC entry 3932 (class 2606 OID 16537)
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- TOC entry 3945 (class 2606 OID 16715)
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- TOC entry 3969 (class 2606 OID 16804)
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- TOC entry 3964 (class 2606 OID 16795)
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- TOC entry 3914 (class 2606 OID 16877)
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- TOC entry 3916 (class 2606 OID 16501)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4096 (class 2606 OID 36836)
-- Name: webauthn_challenges webauthn_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_pkey PRIMARY KEY (id);


--
-- TOC entry 4092 (class 2606 OID 36819)
-- Name: webauthn_credentials webauthn_credentials_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_pkey PRIMARY KEY (id);


--
-- TOC entry 4076 (class 2606 OID 23207)
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: -
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 4047 (class 2606 OID 23070)
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- TOC entry 4050 (class 2606 OID 23080)
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- TOC entry 4099 (class 2606 OID 51065)
-- Name: migrations_log migrations_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.migrations_log
    ADD CONSTRAINT migrations_log_pkey PRIMARY KEY (key);


--
-- TOC entry 4056 (class 2606 OID 23091)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- TOC entry 4059 (class 2606 OID 23099)
-- Name: sale_items sale_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_pkey PRIMARY KEY (id);


--
-- TOC entry 4062 (class 2606 OID 23107)
-- Name: sales sales_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_pkey PRIMARY KEY (id);


--
-- TOC entry 4066 (class 2606 OID 23116)
-- Name: serial_numbers serial_numbers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.serial_numbers
    ADD CONSTRAINT serial_numbers_pkey PRIMARY KEY (sn);


--
-- TOC entry 4068 (class 2606 OID 23129)
-- Name: staff_members staff_members_name_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_members
    ADD CONSTRAINT staff_members_name_unique UNIQUE (name);


--
-- TOC entry 4070 (class 2606 OID 23127)
-- Name: staff_members staff_members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_members
    ADD CONSTRAINT staff_members_pkey PRIMARY KEY (id);


--
-- TOC entry 4072 (class 2606 OID 23140)
-- Name: store_config store_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_config
    ADD CONSTRAINT store_config_pkey PRIMARY KEY (id);


--
-- TOC entry 4087 (class 2606 OID 34531)
-- Name: suppliers suppliers_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_name_key UNIQUE (name);


--
-- TOC entry 4089 (class 2606 OID 34529)
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- TOC entry 4074 (class 2606 OID 23150)
-- Name: warranty_claims warranty_claims_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warranty_claims
    ADD CONSTRAINT warranty_claims_pkey PRIMARY KEY (id);


--
-- TOC entry 4045 (class 2606 OID 17443)
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- TOC entry 4041 (class 2606 OID 17297)
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- TOC entry 4038 (class 2606 OID 17271)
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- TOC entry 4030 (class 2606 OID 17252)
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- TOC entry 4017 (class 2606 OID 17094)
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- TOC entry 4033 (class 2606 OID 17228)
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- TOC entry 4012 (class 2606 OID 17085)
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- TOC entry 4014 (class 2606 OID 17083)
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 4023 (class 2606 OID 17106)
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- TOC entry 4028 (class 2606 OID 17168)
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- TOC entry 4026 (class 2606 OID 17153)
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- TOC entry 4036 (class 2606 OID 17238)
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- TOC entry 3930 (class 1259 OID 16532)
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- TOC entry 3904 (class 1259 OID 16704)
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- TOC entry 4077 (class 1259 OID 26567)
-- Name: custom_oauth_providers_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_created_at_idx ON auth.custom_oauth_providers USING btree (created_at);


--
-- TOC entry 4078 (class 1259 OID 26566)
-- Name: custom_oauth_providers_enabled_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_enabled_idx ON auth.custom_oauth_providers USING btree (enabled);


--
-- TOC entry 4079 (class 1259 OID 26564)
-- Name: custom_oauth_providers_identifier_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_identifier_idx ON auth.custom_oauth_providers USING btree (identifier);


--
-- TOC entry 4084 (class 1259 OID 26565)
-- Name: custom_oauth_providers_provider_type_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_provider_type_idx ON auth.custom_oauth_providers USING btree (provider_type);


--
-- TOC entry 3905 (class 1259 OID 16706)
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- TOC entry 3906 (class 1259 OID 16707)
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- TOC entry 3948 (class 1259 OID 16785)
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- TOC entry 3981 (class 1259 OID 16893)
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- TOC entry 3936 (class 1259 OID 16873)
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- TOC entry 3941 (class 1259 OID 16701)
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- TOC entry 3984 (class 1259 OID 16890)
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- TOC entry 4008 (class 1259 OID 17075)
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- TOC entry 3985 (class 1259 OID 16891)
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- TOC entry 3956 (class 1259 OID 16896)
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- TOC entry 3953 (class 1259 OID 16757)
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- TOC entry 3954 (class 1259 OID 16902)
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- TOC entry 3994 (class 1259 OID 17027)
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- TOC entry 3991 (class 1259 OID 16980)
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- TOC entry 4001 (class 1259 OID 17053)
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- TOC entry 4002 (class 1259 OID 17051)
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- TOC entry 4007 (class 1259 OID 17052)
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- TOC entry 3988 (class 1259 OID 16949)
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- TOC entry 3989 (class 1259 OID 16948)
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- TOC entry 3990 (class 1259 OID 16950)
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- TOC entry 3907 (class 1259 OID 16708)
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- TOC entry 3908 (class 1259 OID 16705)
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- TOC entry 3917 (class 1259 OID 16515)
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- TOC entry 3918 (class 1259 OID 16516)
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- TOC entry 3919 (class 1259 OID 16700)
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- TOC entry 3922 (class 1259 OID 16787)
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- TOC entry 3925 (class 1259 OID 16892)
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- TOC entry 3975 (class 1259 OID 16829)
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- TOC entry 3976 (class 1259 OID 16894)
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- TOC entry 3977 (class 1259 OID 16844)
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- TOC entry 3980 (class 1259 OID 16843)
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- TOC entry 3942 (class 1259 OID 16895)
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- TOC entry 3943 (class 1259 OID 17065)
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- TOC entry 3946 (class 1259 OID 16786)
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- TOC entry 3967 (class 1259 OID 16811)
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- TOC entry 3970 (class 1259 OID 16810)
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- TOC entry 3965 (class 1259 OID 16796)
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- TOC entry 3966 (class 1259 OID 16958)
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- TOC entry 3955 (class 1259 OID 16955)
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- TOC entry 3947 (class 1259 OID 16784)
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- TOC entry 3909 (class 1259 OID 16864)
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- TOC entry 3910 (class 1259 OID 16702)
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- TOC entry 3911 (class 1259 OID 16505)
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- TOC entry 3912 (class 1259 OID 16919)
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- TOC entry 4094 (class 1259 OID 36843)
-- Name: webauthn_challenges_expires_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_challenges_expires_at_idx ON auth.webauthn_challenges USING btree (expires_at);


--
-- TOC entry 4097 (class 1259 OID 36842)
-- Name: webauthn_challenges_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_challenges_user_id_idx ON auth.webauthn_challenges USING btree (user_id);


--
-- TOC entry 4090 (class 1259 OID 36825)
-- Name: webauthn_credentials_credential_id_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX webauthn_credentials_credential_id_key ON auth.webauthn_credentials USING btree (credential_id);


--
-- TOC entry 4093 (class 1259 OID 36826)
-- Name: webauthn_credentials_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_credentials_user_id_idx ON auth.webauthn_credentials USING btree (user_id);


--
-- TOC entry 4048 (class 1259 OID 51072)
-- Name: idx_audit_logs_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_audit_logs_timestamp ON public.audit_logs USING btree ("timestamp" DESC);


--
-- TOC entry 4051 (class 1259 OID 51074)
-- Name: idx_customers_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customers_deleted ON public.customers USING btree (deleted) WHERE (deleted = false);


--
-- TOC entry 4052 (class 1259 OID 51076)
-- Name: idx_customers_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_customers_name ON public.customers USING btree (name) WHERE (deleted = false);


--
-- TOC entry 4053 (class 1259 OID 51075)
-- Name: idx_products_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_created_at ON public.products USING btree (created_at DESC) WHERE (deleted = false);


--
-- TOC entry 4054 (class 1259 OID 51073)
-- Name: idx_products_deleted; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_products_deleted ON public.products USING btree (deleted) WHERE (deleted = false);


--
-- TOC entry 4057 (class 1259 OID 51068)
-- Name: idx_sale_items_sale_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sale_items_sale_id ON public.sale_items USING btree (sale_id);


--
-- TOC entry 4060 (class 1259 OID 51071)
-- Name: idx_sales_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sales_timestamp ON public.sales USING btree ("timestamp" DESC);


--
-- TOC entry 4063 (class 1259 OID 51069)
-- Name: idx_serial_numbers_product_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_serial_numbers_product_id ON public.serial_numbers USING btree (product_id);


--
-- TOC entry 4064 (class 1259 OID 51070)
-- Name: idx_serial_numbers_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_serial_numbers_status ON public.serial_numbers USING btree (status);


--
-- TOC entry 4085 (class 1259 OID 51077)
-- Name: idx_suppliers_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_suppliers_name ON public.suppliers USING btree (name) WHERE (deleted = false);


--
-- TOC entry 4039 (class 1259 OID 17444)
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- TOC entry 4043 (class 1259 OID 17445)
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- TOC entry 4042 (class 1259 OID 17448)
-- Name: subscription_subscription_id_entity_filters_action_filter_key; Type: INDEX; Schema: realtime; Owner: -
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_action_filter_key ON realtime.subscription USING btree (subscription_id, entity, filters, action_filter);


--
-- TOC entry 4015 (class 1259 OID 17095)
-- Name: bname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- TOC entry 4018 (class 1259 OID 17112)
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- TOC entry 4031 (class 1259 OID 17253)
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- TOC entry 4024 (class 1259 OID 17179)
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- TOC entry 4019 (class 1259 OID 17144)
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- TOC entry 4020 (class 1259 OID 17260)
-- Name: idx_objects_bucket_id_name_lower; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name_lower ON storage.objects USING btree (bucket_id, lower(name) COLLATE "C");


--
-- TOC entry 4021 (class 1259 OID 17113)
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- TOC entry 4034 (class 1259 OID 17244)
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- TOC entry 4131 (class 2620 OID 17302)
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: -
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- TOC entry 4127 (class 2620 OID 17198)
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- TOC entry 4128 (class 2620 OID 17262)
-- Name: buckets protect_buckets_delete; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- TOC entry 4129 (class 2620 OID 17263)
-- Name: objects protect_objects_delete; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- TOC entry 4130 (class 2620 OID 17132)
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- TOC entry 4101 (class 2606 OID 16688)
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4106 (class 2606 OID 16777)
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- TOC entry 4105 (class 2606 OID 16765)
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- TOC entry 4104 (class 2606 OID 16752)
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4112 (class 2606 OID 17017)
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- TOC entry 4113 (class 2606 OID 17022)
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4114 (class 2606 OID 17046)
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- TOC entry 4115 (class 2606 OID 17041)
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4111 (class 2606 OID 16943)
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4100 (class 2606 OID 16721)
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- TOC entry 4108 (class 2606 OID 16824)
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- TOC entry 4109 (class 2606 OID 16897)
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- TOC entry 4110 (class 2606 OID 16838)
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- TOC entry 4102 (class 2606 OID 17060)
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- TOC entry 4103 (class 2606 OID 16716)
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4107 (class 2606 OID 16805)
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- TOC entry 4126 (class 2606 OID 36837)
-- Name: webauthn_challenges webauthn_challenges_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4125 (class 2606 OID 36820)
-- Name: webauthn_credentials webauthn_credentials_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- TOC entry 4121 (class 2606 OID 23156)
-- Name: sale_items sale_items_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;


--
-- TOC entry 4122 (class 2606 OID 23151)
-- Name: sale_items sale_items_sale_id_sales_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_sale_id_sales_id_fk FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE;


--
-- TOC entry 4123 (class 2606 OID 23161)
-- Name: sales sales_customer_id_customers_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_customer_id_customers_id_fk FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE RESTRICT;


--
-- TOC entry 4124 (class 2606 OID 23166)
-- Name: serial_numbers serial_numbers_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.serial_numbers
    ADD CONSTRAINT serial_numbers_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 4116 (class 2606 OID 17107)
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- TOC entry 4117 (class 2606 OID 17154)
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- TOC entry 4118 (class 2606 OID 17174)
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- TOC entry 4119 (class 2606 OID 17169)
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- TOC entry 4120 (class 2606 OID 17239)
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- TOC entry 4283 (class 0 OID 16525)
-- Dependencies: 352
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4294 (class 0 OID 16883)
-- Dependencies: 365
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4285 (class 0 OID 16681)
-- Dependencies: 356
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4282 (class 0 OID 16518)
-- Dependencies: 351
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4289 (class 0 OID 16770)
-- Dependencies: 360
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4288 (class 0 OID 16758)
-- Dependencies: 359
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4287 (class 0 OID 16745)
-- Dependencies: 358
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4295 (class 0 OID 16933)
-- Dependencies: 366
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4281 (class 0 OID 16507)
-- Dependencies: 350
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4292 (class 0 OID 16812)
-- Dependencies: 363
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4293 (class 0 OID 16830)
-- Dependencies: 364
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4284 (class 0 OID 16533)
-- Dependencies: 353
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4286 (class 0 OID 16711)
-- Dependencies: 357
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4291 (class 0 OID 16797)
-- Dependencies: 362
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4290 (class 0 OID 16788)
-- Dependencies: 361
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4280 (class 0 OID 16495)
-- Dependencies: 348
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4305 (class 0 OID 23063)
-- Dependencies: 386
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4306 (class 0 OID 23071)
-- Dependencies: 387
-- Name: customers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4307 (class 0 OID 23081)
-- Dependencies: 388
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4308 (class 0 OID 23092)
-- Dependencies: 389
-- Name: sale_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4309 (class 0 OID 23100)
-- Dependencies: 390
-- Name: sales; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4310 (class 0 OID 23108)
-- Dependencies: 391
-- Name: serial_numbers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.serial_numbers ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4311 (class 0 OID 23117)
-- Dependencies: 392
-- Name: staff_members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4312 (class 0 OID 23130)
-- Dependencies: 393
-- Name: store_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.store_config ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4314 (class 0 OID 34520)
-- Dependencies: 398
-- Name: suppliers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4313 (class 0 OID 23141)
-- Dependencies: 394
-- Name: warranty_claims; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.warranty_claims ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4304 (class 0 OID 17429)
-- Dependencies: 385
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4297 (class 0 OID 17086)
-- Dependencies: 372
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4301 (class 0 OID 17206)
-- Dependencies: 376
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4302 (class 0 OID 17219)
-- Dependencies: 377
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4296 (class 0 OID 17078)
-- Dependencies: 371
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4298 (class 0 OID 17096)
-- Dependencies: 373
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4299 (class 0 OID 17145)
-- Dependencies: 374
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4300 (class 0 OID 17159)
-- Dependencies: 375
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4303 (class 0 OID 17229)
-- Dependencies: 378
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- TOC entry 4315 (class 6104 OID 16426)
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


--
-- TOC entry 3729 (class 3466 OID 16571)
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


--
-- TOC entry 3732 (class 3466 OID 16650)
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


--
-- TOC entry 3728 (class 3466 OID 16569)
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


--
-- TOC entry 3733 (class 3466 OID 16653)
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


--
-- TOC entry 3730 (class 3466 OID 16572)
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


--
-- TOC entry 3731 (class 3466 OID 16573)
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


-- Completed on 2026-05-30 02:43:40 WIB

--
-- PostgreSQL database dump complete
--

\unrestrict nD1wMMZOdJPwSwrz1Fg7RBqSQibq9CqHJMgMqzYGKEruU5cKlZMu6WfewWCTA1i

