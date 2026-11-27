-- ============================================================================
-- Campus Resource Booking and Utilization System
-- Safe, Idempotent Seed Script
-- ============================================================================
-- Inserts initial campus resources without overwriting existing production rows.

INSERT INTO public.resources (
  resource_name,
  resource_type,
  room_number,
  capacity,
  description,
  is_active
)
VALUES
  (
    'Programming & Systems Lab',
    'Computer Lab',
    'LAB101',
    40,
    'Equipped with 40 high-speed workstations, Java/Python IDEs, dual-screen projector, and gigabit campus Wi-Fi.',
    TRUE
  ),
  (
    'Data Science & Networking Lab',
    'Computer Lab',
    'LAB102',
    35,
    'Dedicated laboratory with 35 Linux/Windows terminals, network simulation racks, and interactive smartboard.',
    TRUE
  ),
  (
    'Smart Lecture Classroom',
    'Classroom',
    'CR201',
    60,
    'Tiered lecture hall with digital podium, HD ceiling projector, acoustic paneling, and ergonomic seating for 60 students.',
    TRUE
  ),
  (
    'Main Campus Auditorium',
    'Auditorium',
    'AUD301',
    200,
    'Flagship 200-seat auditorium with stage lighting, wireless PA sound system, live-streaming setup, and seminar podium.',
    TRUE
  ),
  (
    'Faculty & Project Meeting Room',
    'Meeting Room',
    'MR101',
    15,
    'Quiet conference room with 15-seat board table, 4K conferencing display, whiteboard wall, and video call dock.',
    TRUE
  )
ON CONFLICT (room_number) DO NOTHING;

-- ============================================================================
-- ADMIN PROMOTION (RUN MANUALLY AFTER REGISTERING THE ADMIN ACCOUNT)
-- ============================================================================
-- Public registration intentionally restricts roles to 'student' and 'faculty'.
-- To promote a registered user to Admin, run the following query in Supabase SQL Editor:
--
--   UPDATE public.profiles
--   SET role = 'admin'
--   WHERE email = 'admin@yourcollege.edu';
--
