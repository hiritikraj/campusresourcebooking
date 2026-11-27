-- ============================================================================
-- Campus Resource Booking and Utilization System
-- Migration 001: Initial Schema, RLS Policies, Triggers & RPC Functions
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TABLES
-- ============================================================================

-- PROFILES: Extends Supabase auth.users with role and display metadata
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL CHECK (char_length(trim(full_name)) >= 2),
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'faculty', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RESOURCES: Classrooms, labs, auditoriums, and meeting rooms
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_name TEXT NOT NULL CHECK (char_length(trim(resource_name)) >= 2),
  resource_type TEXT NOT NULL CHECK (
    resource_type IN ('Computer Lab', 'Classroom', 'Auditorium', 'Meeting Room')
  ),
  room_number TEXT NOT NULL UNIQUE,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  description TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- BOOKINGS: Time-slot reservations linked to profiles and resources
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  purpose TEXT NOT NULL CHECK (char_length(trim(purpose)) >= 3),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT bookings_valid_time_range CHECK (end_time > start_time)
);

-- Indexes for fast conflict detection and user lookups
CREATE INDEX IF NOT EXISTS idx_bookings_resource_date_status
  ON public.bookings (resource_id, booking_date, status);

CREATE INDEX IF NOT EXISTS idx_bookings_user_date
  ON public.bookings (user_id, booking_date DESC);

-- ============================================================================
-- 2. HELPER FUNCTIONS FOR ROLE-BASED ACCESS CONTROL
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.profiles
  WHERE id = auth.uid();
$$;

-- ============================================================================
-- 3. AUTH & SECURITY TRIGGERS
-- ============================================================================

-- Automatically create a profile row when a new user registers via Supabase Auth.
-- SECURITY: Public registrations are strictly restricted to 'student' or 'faculty'.
-- Attempts to pass 'admin' in signup metadata are downgraded to 'student'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requested_role TEXT;
  v_safe_role TEXT;
  v_full_name TEXT;
BEGIN
  v_requested_role := lower(coalesce(NEW.raw_user_meta_data->>'role', 'student'));

  IF v_requested_role IN ('student', 'faculty') THEN
    v_safe_role := v_requested_role;
  ELSE
    v_safe_role := 'student';
  END IF;

  v_full_name := trim(coalesce(NEW.raw_user_meta_data->>'full_name', ''));
  IF char_length(v_full_name) < 2 THEN
    v_full_name := split_part(coalesce(NEW.email, 'Campus User'), '@', 1);
  END IF;

  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (NEW.id, v_full_name, NEW.email, v_safe_role)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Prevent authenticated non-admin users from changing their own role to 'admin'
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    -- Allow direct SQL Editor / postgres service administration (auth.uid() IS NULL)
    -- or an existing authenticated Admin. Block all self-escalation attempts.
    IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
      RAISE EXCEPTION 'Permission denied: you cannot modify account roles.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_escalation
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_role_escalation();

-- ============================================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
DROP POLICY IF EXISTS "Users can view own profile or admin views all" ON public.profiles;
CREATE POLICY "Users can view own profile or admin views all"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id OR public.is_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- RESOURCES POLICIES
DROP POLICY IF EXISTS "Anyone can view campus resources" ON public.resources;
CREATE POLICY "Anyone can view campus resources"
  ON public.resources
  FOR SELECT
  USING (TRUE);

DROP POLICY IF EXISTS "Admins can insert resources" ON public.resources;
CREATE POLICY "Admins can insert resources"
  ON public.resources
  FOR INSERT
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update resources" ON public.resources;
CREATE POLICY "Admins can update resources"
  ON public.resources
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete resources" ON public.resources;
CREATE POLICY "Admins can delete resources"
  ON public.resources
  FOR DELETE
  USING (public.is_admin());

-- BOOKINGS POLICIES
DROP POLICY IF EXISTS "Users can view own bookings or admin views all" ON public.bookings;
CREATE POLICY "Users can view own bookings or admin views all"
  ON public.bookings
  FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can create bookings for themselves" ON public.bookings;
CREATE POLICY "Users can create bookings for themselves"
  ON public.bookings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can cancel own bookings or admin updates" ON public.bookings;
CREATE POLICY "Users can cancel own bookings or admin updates"
  ON public.bookings
  FOR UPDATE
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (
    (auth.uid() = user_id AND status = 'cancelled')
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Admins can delete bookings" ON public.bookings;
CREATE POLICY "Admins can delete bookings"
  ON public.bookings
  FOR DELETE
  USING (public.is_admin());

-- ============================================================================
-- 5. ATOMIC BOOKING & UTILIZATION RPC FUNCTIONS
-- ============================================================================

-- Atomic booking creation with row-level lock on the target resource.
-- Enforces overlap condition: newStart < existingEnd AND newEnd > existingStart
-- Adjacent bookings (newStart = existingEnd or newEnd = existingStart) are allowed.
-- Cancelled bookings do not block availability.
CREATE OR REPLACE FUNCTION public.create_booking(
  p_resource_id UUID,
  p_booking_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_purpose TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_resource public.resources%ROWTYPE;
  v_has_conflict BOOLEAN;
  v_new_booking public.bookings%ROWTYPE;
  v_trimmed_purpose TEXT;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'UNAUTHORIZED',
      'message', 'You must be signed in to book a campus resource.'
    );
  END IF;

  -- Ensure profile exists for the authenticated user
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'PROFILE_MISSING',
      'message', 'User profile not found. Please sign out and sign in again.'
    );
  END IF;

  v_trimmed_purpose := trim(coalesce(p_purpose, ''));
  IF char_length(v_trimmed_purpose) < 3 THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'INVALID_INPUT',
      'message', 'Please enter a booking purpose of at least 3 characters.'
    );
  END IF;

  IF p_booking_date IS NULL OR p_start_time IS NULL OR p_end_time IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'INVALID_INPUT',
      'message', 'Date, start time, and end time are required.'
    );
  END IF;

  IF p_booking_date < CURRENT_DATE THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'PAST_DATE',
      'message', 'Past dates cannot be booked. Please choose today or a future date.'
    );
  END IF;

  IF p_end_time <= p_start_time THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'INVALID_TIME_RANGE',
      'message', 'End time must be later than start time.'
    );
  END IF;

  -- Lock the selected resource row inside this transaction to serialize
  -- concurrent booking requests for the same room.
  SELECT *
  INTO v_resource
  FROM public.resources
  WHERE id = p_resource_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'RESOURCE_NOT_FOUND',
      'message', 'Selected campus resource does not exist.'
    );
  END IF;

  IF NOT v_resource.is_active THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'RESOURCE_INACTIVE',
      'message', 'This resource is currently inactive and unavailable for booking.'
    );
  END IF;

  -- Check for overlapping confirmed bookings only (cancelled bookings do not block)
  SELECT EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.resource_id = p_resource_id
      AND b.booking_date = p_booking_date
      AND b.status = 'confirmed'
      AND p_start_time < b.end_time
      AND p_end_time > b.start_time
  ) INTO v_has_conflict;

  IF v_has_conflict THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'CONFLICT',
      'message', format(
        '%s (%s) is already booked during the selected time slot on %s.',
        v_resource.resource_name,
        v_resource.room_number,
        to_char(p_booking_date, 'YYYY-MM-DD')
      )
    );
  END IF;

  INSERT INTO public.bookings (
    user_id,
    resource_id,
    booking_date,
    start_time,
    end_time,
    purpose,
    status
  )
  VALUES (
    v_user_id,
    p_resource_id,
    p_booking_date,
    p_start_time,
    p_end_time,
    v_trimmed_purpose,
    'confirmed'
  )
  RETURNING * INTO v_new_booking;

  RETURN jsonb_build_object(
    'success', true,
    'code', 'CREATED',
    'message', format(
      'Booking confirmed for %s (%s).',
      v_resource.resource_name,
      v_resource.room_number
    ),
    'booking', row_to_json(v_new_booking)
  );
END;
$$;

-- Cancel an upcoming booking owned by the caller (or any booking by Admin)
CREATE OR REPLACE FUNCTION public.cancel_booking(p_booking_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_booking public.bookings%ROWTYPE;
  v_is_admin BOOLEAN;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'UNAUTHORIZED',
      'message', 'Authentication required.'
    );
  END IF;

  v_is_admin := public.is_admin();

  SELECT *
  INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'NOT_FOUND',
      'message', 'Booking not found.'
    );
  END IF;

  IF v_booking.user_id <> v_user_id AND NOT v_is_admin THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'FORBIDDEN',
      'message', 'You can only cancel your own bookings.'
    );
  END IF;

  IF v_booking.status = 'cancelled' THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'ALREADY_CANCELLED',
      'message', 'This booking has already been cancelled.'
    );
  END IF;

  IF v_booking.booking_date < CURRENT_DATE AND NOT v_is_admin THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'PAST_BOOKING',
      'message', 'Past bookings cannot be cancelled.'
    );
  END IF;

  UPDATE public.bookings
  SET status = 'cancelled'
  WHERE id = p_booking_id;

  RETURN jsonb_build_object(
    'success', true,
    'code', 'CANCELLED',
    'message', 'Booking cancelled successfully. The time slot is now available.'
  );
END;
$$;

-- Anonymized booked slot intervals so users can inspect availability without
-- exposing private booking owners or purposes.
CREATE OR REPLACE FUNCTION public.get_resource_booked_slots(
  p_resource_id UUID,
  p_booking_date DATE
)
RETURNS TABLE (
  start_time TIME,
  end_time TIME
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT b.start_time, b.end_time
  FROM public.bookings b
  WHERE b.resource_id = p_resource_id
    AND b.booking_date = p_booking_date
    AND b.status = 'confirmed'
  ORDER BY b.start_time ASC;
$$;

-- Admin utilization report:
-- Operating hours = 8 AM to 6 PM (10 hours/day)
-- Utilization % = (Total Booked Hours / Total Available Hours) * 100
CREATE OR REPLACE FUNCTION public.get_resource_utilization(
  p_start_date DATE DEFAULT CURRENT_DATE,
  p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  resource_id UUID,
  resource_name TEXT,
  resource_type TEXT,
  room_number TEXT,
  capacity INTEGER,
  is_active BOOLEAN,
  confirmed_bookings BIGINT,
  total_booked_hours NUMERIC,
  total_available_hours NUMERIC,
  utilization_percentage NUMERIC
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_days INTEGER;
  v_available_hours NUMERIC;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Permission denied: Admin access required.';
  END IF;

  v_days := GREATEST(1, (p_end_date - p_start_date + 1));
  v_available_hours := v_days * 10.0; -- 08:00 to 18:00 = 10 hours per day

  RETURN QUERY
  SELECT
    r.id AS resource_id,
    r.resource_name,
    r.resource_type,
    r.room_number,
    r.capacity,
    r.is_active,
    COUNT(b.id) AS confirmed_bookings,
    ROUND(
      COALESCE(SUM(EXTRACT(EPOCH FROM (b.end_time - b.start_time)) / 3600.0), 0)::NUMERIC,
      2
    ) AS total_booked_hours,
    v_available_hours AS total_available_hours,
    ROUND(
      (
        COALESCE(SUM(EXTRACT(EPOCH FROM (b.end_time - b.start_time)) / 3600.0), 0)::NUMERIC
        / v_available_hours
      ) * 100.0,
      1
    ) AS utilization_percentage
  FROM public.resources r
  LEFT JOIN public.bookings b
    ON b.resource_id = r.id
    AND b.status = 'confirmed'
    AND b.booking_date BETWEEN p_start_date AND p_end_date
  GROUP BY r.id, r.resource_name, r.resource_type, r.room_number, r.capacity, r.is_active
  ORDER BY r.room_number ASC;
END;
$$;

-- Grant RPC execution permissions
GRANT EXECUTE ON FUNCTION public.create_booking(UUID, DATE, TIME, TIME, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_booking(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_resource_booked_slots(UUID, DATE) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_resource_utilization(DATE, DATE) TO authenticated;
