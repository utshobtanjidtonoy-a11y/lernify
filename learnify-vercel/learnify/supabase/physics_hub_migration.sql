-- ============================================================
-- LEARNIFY — PHYSICS HUB MIGRATION
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Ensure physics subject exists (upsert safe)
insert into public.formula_subjects (name, slug, description, icon, color, sort_order)
values ('Physics', 'physics', 'SSC & HSC Physics — mechanics, waves, optics, electricity & modern physics', '⚛️', '#3b82f6', 1)
on conflict (slug) do update set description = excluded.description;

-- ── DELETE old physics chapters and re-seed clean ────────────────
delete from public.formula_chapters
where subject_id = (select id from public.formula_subjects where slug = 'physics');

-- ── SSC CHAPTERS ─────────────────────────────────────────────────
insert into public.formula_chapters (subject_id, name, slug, description, sort_order)
select s.id, ch.name, ch.slug, ch.desc, ch.ord
from public.formula_subjects s
cross join (values
  ('Physical Quantities & Measurement', 'physical-quantities',  'Units, dimensions, measurement errors',           1),
  ('Motion',                            'motion',               'Distance, displacement, velocity, acceleration',   2),
  ('Force',                             'force',                'Newton''s laws, friction, momentum',               3),
  ('Work, Energy & Power',              'work-energy-power',    'Work, KE, PE, power, conservation of energy',      4),
  ('States of Matter',                  'states-of-matter',     'Density, pressure, Archimedes principle',          5),
  ('Heat & Temperature',                'heat-temperature',     'Heat, specific heat, latent heat, expansion',      6),
  ('Waves & Sound',                     'waves-sound',          'Wave properties, speed, frequency, sound',         7),
  ('Light',                             'light',                'Reflection, refraction, lenses, mirrors',          8),
  ('Static Electricity',                'static-electricity',   'Charge, Coulomb''s law, electric field',           9),
  ('Current Electricity',               'current-electricity',  'Ohm''s law, resistance, circuits, power',         10)
) as ch(name, slug, desc, ord)
where s.slug = 'physics'
on conflict (subject_id, slug) do nothing;

-- ── HSC CHAPTERS ─────────────────────────────────────────────────
insert into public.formula_chapters (subject_id, name, slug, description, sort_order)
select s.id, ch.name, ch.slug, ch.desc, ch.ord
from public.formula_subjects s
cross join (values
  ('Vectors',                           'vectors',              'Vector addition, resolution, dot/cross product',  11),
  ('Kinematics (HSC)',                  'kinematics-hsc',       'Projectile motion, circular motion',              12),
  ('Dynamics',                          'dynamics',             'Newton''s laws advanced, friction, centripetal',  13),
  ('Gravitation',                       'gravitation',          'Universal gravitation, orbital motion',           14),
  ('Work, Energy & Power (HSC)',        'work-energy-hsc',      'Work-energy theorem, elastic/inelastic collisions',15),
  ('Thermal Physics',                   'thermal-physics',      'Ideal gas laws, kinetic theory, thermodynamics',  16),
  ('Oscillations & Waves (HSC)',        'oscillations-waves',   'SHM, wave equation, standing waves',              17),
  ('Optics (HSC)',                      'optics-hsc',           'Snell''s law, TIR, lens formula, optical instruments',18),
  ('Electrostatics',                    'electrostatics',       'Gauss''s law, capacitance, electric potential',   19),
  ('Current Electricity (HSC)',         'current-electricity-hsc','Kirchhoff''s laws, Wheatstone bridge',          20),
  ('Magnetism & Electromagnetism',      'magnetism',            'Magnetic force, induction, Faraday, transformer', 21),
  ('Modern Physics',                    'modern-physics',       'Photoelectric effect, Bohr model, radioactivity', 22)
) as ch(name, slug, desc, ord)
where s.slug = 'physics'
on conflict (subject_id, slug) do nothing;

-- ── DELETE old physics formulas (clean re-seed) ──────────────────
delete from public.formulas
where subject_id = (select id from public.formula_subjects where slug = 'physics');

-- ── HELPER: insert formulas macro ────────────────────────────────
-- We'll use a DO block to insert by chapter slug for cleanliness
do $$
declare
  phys_id uuid;
  ch_id   uuid;
begin
  select id into phys_id from public.formula_subjects where slug = 'physics';

  -- ════════════════════════════════════════════════════════════
  -- MOTION (SSC)
  -- ════════════════════════════════════════════════════════════
  select id into ch_id from public.formula_chapters where subject_id = phys_id and slug = 'motion';

  insert into public.formulas (chapter_id, subject_id, title, formula_latex, formula_plain, description, variables, example, difficulty, is_important, tags, sort_order) values
  (ch_id, phys_id, 'Speed', 'v = \frac{d}{t}', 'v = d / t',
   'Speed is the distance travelled per unit time.',
   '[{"symbol":"v","name":"Speed","unit":"m/s","description":"Rate of distance covered"},{"symbol":"d","name":"Distance","unit":"m","description":"Total path length"},{"symbol":"t","name":"Time","unit":"s","description":"Time taken"}]',
   'Car travels 120 m in 4 s: v = 120/4 = 30 m/s.', 'beginner', true, '{"motion","speed","SSC"}', 1),

  (ch_id, phys_id, 'Uniform Acceleration (v = u + at)', 'v = u + at', 'v = u + at',
   'Final velocity under constant acceleration.',
   '[{"symbol":"v","name":"Final Velocity","unit":"m/s","description":"Velocity at end"},{"symbol":"u","name":"Initial Velocity","unit":"m/s","description":"Velocity at start"},{"symbol":"a","name":"Acceleration","unit":"m/s²","description":"Rate of change of velocity"},{"symbol":"t","name":"Time","unit":"s","description":"Duration"}]',
   'u=5 m/s, a=2 m/s², t=3 s → v = 5 + 6 = 11 m/s.', 'beginner', true, '{"kinematics","SSC","motion"}', 2),

  (ch_id, phys_id, 'Displacement (s = ut + ½at²)', 's = ut + \frac{1}{2}at^2', 's = ut + ½at²',
   'Displacement under constant acceleration.',
   '[{"symbol":"s","name":"Displacement","unit":"m","description":"Change in position"},{"symbol":"u","name":"Initial Velocity","unit":"m/s","description":"Starting velocity"},{"symbol":"a","name":"Acceleration","unit":"m/s²","description":"Constant acceleration"},{"symbol":"t","name":"Time","unit":"s","description":"Time elapsed"}]',
   'u=0, a=10 m/s², t=4 s → s = 0 + ½×10×16 = 80 m.', 'beginner', true, '{"kinematics","SSC","displacement"}', 3),

  (ch_id, phys_id, 'Velocity–Displacement (v² = u² + 2as)', 'v^2 = u^2 + 2as', 'v² = u² + 2as',
   'Relates velocity, initial velocity, acceleration and displacement.',
   '[{"symbol":"v","name":"Final Velocity","unit":"m/s","description":""},{"symbol":"u","name":"Initial Velocity","unit":"m/s","description":""},{"symbol":"a","name":"Acceleration","unit":"m/s²","description":""},{"symbol":"s","name":"Displacement","unit":"m","description":""}]',
   'u=0, a=9.8, s=20 m → v² = 0 + 2×9.8×20 = 392 → v ≈ 19.8 m/s.', 'beginner', true, '{"kinematics","SSC"}', 4);

  -- ════════════════════════════════════════════════════════════
  -- FORCE (SSC)
  -- ════════════════════════════════════════════════════════════
  select id into ch_id from public.formula_chapters where subject_id = phys_id and slug = 'force';

  insert into public.formulas (chapter_id, subject_id, title, formula_latex, formula_plain, description, variables, example, difficulty, is_important, tags, sort_order) values
  (ch_id, phys_id, 'Newton''s Second Law', 'F = ma', 'F = ma',
   'The net force equals mass times acceleration.',
   '[{"symbol":"F","name":"Force","unit":"N","description":"Net force"},{"symbol":"m","name":"Mass","unit":"kg","description":"Mass of object"},{"symbol":"a","name":"Acceleration","unit":"m/s²","description":"Acceleration produced"}]',
   '10 kg object, a = 3 m/s² → F = 30 N.', 'beginner', true, '{"newton","force","SSC"}', 1),

  (ch_id, phys_id, 'Weight', 'W = mg', 'W = mg',
   'Gravitational force on a mass near Earth''s surface.',
   '[{"symbol":"W","name":"Weight","unit":"N","description":"Gravitational pull"},{"symbol":"m","name":"Mass","unit":"kg","description":"Mass of object"},{"symbol":"g","name":"Gravitational Acceleration","unit":"9.8 m/s²","description":"Free-fall acceleration on Earth"}]',
   '5 kg object: W = 5 × 9.8 = 49 N.', 'beginner', true, '{"weight","gravity","SSC"}', 2),

  (ch_id, phys_id, 'Momentum', 'p = mv', 'p = mv',
   'Product of mass and velocity.',
   '[{"symbol":"p","name":"Momentum","unit":"kg·m/s","description":"Quantity of motion"},{"symbol":"m","name":"Mass","unit":"kg","description":""},{"symbol":"v","name":"Velocity","unit":"m/s","description":""}]',
   '4 kg ball at 6 m/s: p = 24 kg·m/s.', 'beginner', true, '{"momentum","SSC"}', 3),

  (ch_id, phys_id, 'Impulse', 'J = F \Delta t = \Delta p', 'J = FΔt = Δp',
   'Change in momentum equals force times time.',
   '[{"symbol":"J","name":"Impulse","unit":"N·s","description":"Change in momentum"},{"symbol":"F","name":"Force","unit":"N","description":"Applied force"},{"symbol":"Δt","name":"Time interval","unit":"s","description":"Duration of force"}]',
   '100 N for 0.5 s: J = 50 N·s.', 'intermediate', false, '{"impulse","momentum","SSC"}', 4),

  (ch_id, phys_id, 'Friction Force', 'f = \mu N', 'f = μN',
   'Frictional force equals coefficient of friction times normal force.',
   '[{"symbol":"f","name":"Friction Force","unit":"N","description":"Opposing force"},{"symbol":"μ","name":"Coefficient of Friction","unit":"dimensionless","description":"Surface roughness factor"},{"symbol":"N","name":"Normal Force","unit":"N","description":"Perpendicular contact force"}]',
   'μ = 0.3, N = 50 N: f = 0.3 × 50 = 15 N.', 'beginner', true, '{"friction","force","SSC"}', 5);

  -- ════════════════════════════════════════════════════════════
  -- WORK, ENERGY & POWER (SSC)
  -- ════════════════════════════════════════════════════════════
  select id into ch_id from public.formula_chapters where subject_id = phys_id and slug = 'work-energy-power';

  insert into public.formulas (chapter_id, subject_id, title, formula_latex, formula_plain, description, variables, example, difficulty, is_important, tags, sort_order) values
  (ch_id, phys_id, 'Work Done', 'W = Fd\cos\theta', 'W = Fd·cosθ',
   'Work is force times displacement in the direction of force.',
   '[{"symbol":"W","name":"Work","unit":"J","description":"Energy transferred"},{"symbol":"F","name":"Force","unit":"N","description":"Applied force"},{"symbol":"d","name":"Displacement","unit":"m","description":"Distance moved"},{"symbol":"θ","name":"Angle","unit":"°","description":"Angle between force and displacement"}]',
   'F=20 N, d=5 m, θ=0°: W = 20×5×1 = 100 J.', 'beginner', true, '{"work","energy","SSC"}', 1),

  (ch_id, phys_id, 'Kinetic Energy', 'KE = \frac{1}{2}mv^2', 'KE = ½mv²',
   'Energy due to motion.',
   '[{"symbol":"KE","name":"Kinetic Energy","unit":"J","description":"Energy of motion"},{"symbol":"m","name":"Mass","unit":"kg","description":""},{"symbol":"v","name":"Velocity","unit":"m/s","description":""}]',
   '3 kg at 4 m/s: KE = ½×3×16 = 24 J.', 'beginner', true, '{"kinetic energy","SSC"}', 2),

  (ch_id, phys_id, 'Gravitational PE', 'PE = mgh', 'PE = mgh',
   'Potential energy due to height.',
   '[{"symbol":"PE","name":"Potential Energy","unit":"J","description":"Stored gravitational energy"},{"symbol":"m","name":"Mass","unit":"kg","description":""},{"symbol":"g","name":"Gravity","unit":"9.8 m/s²","description":""},{"symbol":"h","name":"Height","unit":"m","description":"Height above reference"}]',
   '2 kg at 5 m: PE = 2×9.8×5 = 98 J.', 'beginner', true, '{"potential energy","SSC"}', 3),

  (ch_id, phys_id, 'Power', 'P = \frac{W}{t}', 'P = W / t',
   'Rate of doing work.',
   '[{"symbol":"P","name":"Power","unit":"W (Watt)","description":"Rate of energy transfer"},{"symbol":"W","name":"Work","unit":"J","description":""},{"symbol":"t","name":"Time","unit":"s","description":""}]',
   '500 J in 10 s: P = 50 W.', 'beginner', true, '{"power","SSC"}', 4);

  -- ════════════════════════════════════════════════════════════
  -- WAVES & SOUND (SSC)
  -- ════════════════════════════════════════════════════════════
  select id into ch_id from public.formula_chapters where subject_id = phys_id and slug = 'waves-sound';

  insert into public.formulas (chapter_id, subject_id, title, formula_latex, formula_plain, description, variables, example, difficulty, is_important, tags, sort_order) values
  (ch_id, phys_id, 'Wave Speed', 'v = f\lambda', 'v = fλ',
   'Wave speed equals frequency times wavelength.',
   '[{"symbol":"v","name":"Wave Speed","unit":"m/s","description":"Speed of propagation"},{"symbol":"f","name":"Frequency","unit":"Hz","description":"Oscillations per second"},{"symbol":"λ","name":"Wavelength","unit":"m","description":"Distance between crests"}]',
   'f = 440 Hz, λ = 0.75 m: v = 330 m/s.', 'beginner', true, '{"waves","SSC","sound"}', 1),

  (ch_id, phys_id, 'Period & Frequency', 'T = \frac{1}{f}', 'T = 1/f',
   'Period is the reciprocal of frequency.',
   '[{"symbol":"T","name":"Period","unit":"s","description":"Time for one complete cycle"},{"symbol":"f","name":"Frequency","unit":"Hz","description":"Cycles per second"}]',
   'f = 50 Hz → T = 1/50 = 0.02 s.', 'beginner', true, '{"waves","period","SSC"}', 2);

  -- ════════════════════════════════════════════════════════════
  -- CURRENT ELECTRICITY (SSC)
  -- ════════════════════════════════════════════════════════════
  select id into ch_id from public.formula_chapters where subject_id = phys_id and slug = 'current-electricity';

  insert into public.formulas (chapter_id, subject_id, title, formula_latex, formula_plain, description, variables, example, difficulty, is_important, tags, sort_order) values
  (ch_id, phys_id, 'Ohm''s Law', 'V = IR', 'V = IR',
   'Voltage equals current times resistance.',
   '[{"symbol":"V","name":"Voltage","unit":"V (Volt)","description":"Potential difference"},{"symbol":"I","name":"Current","unit":"A (Ampere)","description":"Rate of charge flow"},{"symbol":"R","name":"Resistance","unit":"Ω (Ohm)","description":"Opposition to current"}]',
   'I = 2 A, R = 5 Ω: V = 10 V.', 'beginner', true, '{"ohm","electricity","SSC"}', 1),

  (ch_id, phys_id, 'Electrical Power', 'P = VI = I^2R = \frac{V^2}{R}', 'P = VI = I²R = V²/R',
   'Power dissipated in an electrical component.',
   '[{"symbol":"P","name":"Power","unit":"W","description":"Rate of energy dissipation"},{"symbol":"V","name":"Voltage","unit":"V","description":""},{"symbol":"I","name":"Current","unit":"A","description":""},{"symbol":"R","name":"Resistance","unit":"Ω","description":""}]',
   'V=12 V, I=3 A: P = 36 W.', 'beginner', true, '{"power","electricity","SSC"}', 2),

  (ch_id, phys_id, 'Resistors in Series', 'R_s = R_1 + R_2 + R_3', 'Rₛ = R₁ + R₂ + R₃',
   'Total resistance in series is sum of all resistances.',
   '[{"symbol":"Rₛ","name":"Series Resistance","unit":"Ω","description":"Total resistance"},{"symbol":"R₁,R₂,R₃","name":"Individual Resistances","unit":"Ω","description":"Each resistor value"}]',
   'R₁=2, R₂=3, R₃=5: Rₛ = 10 Ω.', 'beginner', true, '{"resistance","series","SSC"}', 3),

  (ch_id, phys_id, 'Resistors in Parallel', '\frac{1}{R_p} = \frac{1}{R_1} + \frac{1}{R_2}', '1/Rₚ = 1/R₁ + 1/R₂',
   'Reciprocal of total parallel resistance.',
   '[{"symbol":"Rₚ","name":"Parallel Resistance","unit":"Ω","description":"Total resistance"},{"symbol":"R₁,R₂","name":"Individual Resistances","unit":"Ω","description":""}]',
   'R₁=4, R₂=4: 1/Rₚ = 1/4+1/4 = 1/2 → Rₚ = 2 Ω.', 'beginner', true, '{"resistance","parallel","SSC"}', 4);

  -- ════════════════════════════════════════════════════════════
  -- KINEMATICS HSC — Projectile Motion
  -- ════════════════════════════════════════════════════════════
  select id into ch_id from public.formula_chapters where subject_id = phys_id and slug = 'kinematics-hsc';

  insert into public.formulas (chapter_id, subject_id, title, formula_latex, formula_plain, description, variables, example, difficulty, is_important, tags, sort_order) values
  (ch_id, phys_id, 'Horizontal Range', 'R = \frac{u^2\sin 2\theta}{g}', 'R = u²·sin(2θ) / g',
   'Horizontal distance covered by a projectile.',
   '[{"symbol":"R","name":"Range","unit":"m","description":"Horizontal distance"},{"symbol":"u","name":"Initial Speed","unit":"m/s","description":"Launch speed"},{"symbol":"θ","name":"Launch Angle","unit":"°","description":"Angle above horizontal"},{"symbol":"g","name":"Gravity","unit":"9.8 m/s²","description":""}]',
   'u=20 m/s, θ=45°: R = 400×1/9.8 ≈ 40.8 m.', 'intermediate', true, '{"projectile","HSC","range"}', 1),

  (ch_id, phys_id, 'Time of Flight', 'T = \frac{2u\sin\theta}{g}', 'T = 2u·sinθ / g',
   'Total time a projectile is in the air.',
   '[{"symbol":"T","name":"Time of Flight","unit":"s","description":"Total airborne time"},{"symbol":"u","name":"Initial Speed","unit":"m/s","description":""},{"symbol":"θ","name":"Angle","unit":"°","description":""},{"symbol":"g","name":"Gravity","unit":"9.8 m/s²","description":""}]',
   'u=20, θ=30°: T = 2×20×0.5/9.8 ≈ 2.04 s.', 'intermediate', true, '{"projectile","HSC","time"}', 2),

  (ch_id, phys_id, 'Maximum Height', 'H = \frac{u^2\sin^2\theta}{2g}', 'H = u²·sin²θ / 2g',
   'Peak height of a projectile.',
   '[{"symbol":"H","name":"Max Height","unit":"m","description":"Highest point reached"},{"symbol":"u","name":"Initial Speed","unit":"m/s","description":""},{"symbol":"θ","name":"Angle","unit":"°","description":""},{"symbol":"g","name":"Gravity","unit":"9.8 m/s²","description":""}]',
   'u=20, θ=45°: H = 400×0.5/19.6 ≈ 10.2 m.', 'intermediate', true, '{"projectile","HSC","height"}', 3),

  (ch_id, phys_id, 'Centripetal Acceleration', 'a_c = \frac{v^2}{r}', 'aₓ = v² / r',
   'Acceleration directed toward centre of circular path.',
   '[{"symbol":"aₓ","name":"Centripetal Acceleration","unit":"m/s²","description":"Inward acceleration"},{"symbol":"v","name":"Speed","unit":"m/s","description":"Tangential speed"},{"symbol":"r","name":"Radius","unit":"m","description":"Radius of circular path"}]',
   'v=10 m/s, r=5 m: a = 100/5 = 20 m/s².', 'intermediate', true, '{"circular motion","HSC"}', 4),

  (ch_id, phys_id, 'Centripetal Force', 'F_c = \frac{mv^2}{r}', 'Fc = mv² / r',
   'Force required for circular motion.',
   '[{"symbol":"Fc","name":"Centripetal Force","unit":"N","description":"Net inward force"},{"symbol":"m","name":"Mass","unit":"kg","description":""},{"symbol":"v","name":"Speed","unit":"m/s","description":""},{"symbol":"r","name":"Radius","unit":"m","description":""}]',
   'm=2, v=5, r=10: Fc = 2×25/10 = 5 N.', 'intermediate', true, '{"centripetal","circular motion","HSC"}', 5);

  -- ════════════════════════════════════════════════════════════
  -- GRAVITATION (HSC)
  -- ════════════════════════════════════════════════════════════
  select id into ch_id from public.formula_chapters where subject_id = phys_id and slug = 'gravitation';

  insert into public.formulas (chapter_id, subject_id, title, formula_latex, formula_plain, description, variables, example, difficulty, is_important, tags, sort_order) values
  (ch_id, phys_id, 'Universal Gravitation', 'F = G\frac{m_1 m_2}{r^2}', 'F = G·m₁m₂ / r²',
   'Gravitational attraction between two masses.',
   '[{"symbol":"F","name":"Force","unit":"N","description":"Gravitational force"},{"symbol":"G","name":"Gravitational Constant","unit":"6.674×10⁻¹¹","description":"Universal constant"},{"symbol":"m₁,m₂","name":"Masses","unit":"kg","description":""},{"symbol":"r","name":"Distance","unit":"m","description":"Distance between centres"}]',
   'Demonstrates inverse-square law between Earth and Moon.', 'intermediate', true, '{"gravity","HSC","Newton"}', 1),

  (ch_id, phys_id, 'Gravitational Field Strength', 'g = \frac{GM}{r^2}', 'g = GM / r²',
   'Gravitational acceleration at distance r from mass M.',
   '[{"symbol":"g","name":"Field Strength","unit":"m/s²","description":"Gravitational acceleration"},{"symbol":"G","name":"Gravitational Constant","unit":"6.674×10⁻¹¹","description":""},{"symbol":"M","name":"Source Mass","unit":"kg","description":"Mass creating the field"},{"symbol":"r","name":"Distance","unit":"m","description":"Distance from centre"}]',
   'At Earth surface: g = 6.674e-11 × 5.97e24 / (6.37e6)² ≈ 9.8 m/s².', 'intermediate', true, '{"gravity","field","HSC"}', 2),

  (ch_id, phys_id, 'Orbital Velocity', 'v_0 = \sqrt{\frac{GM}{r}}', 'v₀ = √(GM/r)',
   'Speed needed to maintain circular orbit at radius r.',
   '[{"symbol":"v₀","name":"Orbital Speed","unit":"m/s","description":"Required orbital velocity"},{"symbol":"G","name":"Gravitational Constant","unit":"6.674×10⁻¹¹","description":""},{"symbol":"M","name":"Central Mass","unit":"kg","description":"Mass being orbited"},{"symbol":"r","name":"Orbital Radius","unit":"m","description":"Distance from centre"}]',
   'Low Earth orbit (r≈6.37e6 m): v₀ ≈ 7900 m/s.', 'advanced', true, '{"orbit","satellite","HSC"}', 3);

  -- ════════════════════════════════════════════════════════════
  -- THERMAL PHYSICS (HSC)
  -- ════════════════════════════════════════════════════════════
  select id into ch_id from public.formula_chapters where subject_id = phys_id and slug = 'thermal-physics';

  insert into public.formulas (chapter_id, subject_id, title, formula_latex, formula_plain, description, variables, example, difficulty, is_important, tags, sort_order) values
  (ch_id, phys_id, 'Ideal Gas Law', 'PV = nRT', 'PV = nRT',
   'Equation of state for an ideal gas.',
   '[{"symbol":"P","name":"Pressure","unit":"Pa","description":""},{"symbol":"V","name":"Volume","unit":"m³","description":""},{"symbol":"n","name":"Moles","unit":"mol","description":""},{"symbol":"R","name":"Gas Constant","unit":"8.314 J/mol·K","description":""},{"symbol":"T","name":"Temperature","unit":"K","description":"Absolute temperature"}]',
   '2 mol at 300 K in 0.05 m³: P = 2×8.314×300/0.05 ≈ 99,768 Pa.', 'intermediate', true, '{"gas","thermal","HSC"}', 1),

  (ch_id, phys_id, 'Specific Heat Capacity', 'Q = mc\Delta T', 'Q = mcΔT',
   'Heat energy required to change temperature.',
   '[{"symbol":"Q","name":"Heat Energy","unit":"J","description":"Heat transferred"},{"symbol":"m","name":"Mass","unit":"kg","description":""},{"symbol":"c","name":"Specific Heat","unit":"J/kg·K","description":"Material property"},{"symbol":"ΔT","name":"Temperature Change","unit":"K or °C","description":""}]',
   '0.5 kg water (c=4200), ΔT=10: Q = 0.5×4200×10 = 21,000 J.', 'intermediate', true, '{"heat","thermal","HSC"}', 2),

  (ch_id, phys_id, 'First Law of Thermodynamics', '\Delta U = Q - W', 'ΔU = Q − W',
   'Energy conservation for thermodynamic systems.',
   '[{"symbol":"ΔU","name":"Internal Energy Change","unit":"J","description":""},{"symbol":"Q","name":"Heat Added","unit":"J","description":"Heat into system"},{"symbol":"W","name":"Work Done by System","unit":"J","description":""}]',
   'Q=500 J, W=200 J: ΔU = 300 J.', 'intermediate', true, '{"thermodynamics","HSC","energy"}', 3);

  -- ════════════════════════════════════════════════════════════
  -- OSCILLATIONS & WAVES (HSC)
  -- ════════════════════════════════════════════════════════════
  select id into ch_id from public.formula_chapters where subject_id = phys_id and slug = 'oscillations-waves';

  insert into public.formulas (chapter_id, subject_id, title, formula_latex, formula_plain, description, variables, example, difficulty, is_important, tags, sort_order) values
  (ch_id, phys_id, 'SHM Displacement', 'x = A\cos(\omega t + \phi)', 'x = A·cos(ωt + φ)',
   'Position of a simple harmonic oscillator.',
   '[{"symbol":"x","name":"Displacement","unit":"m","description":"Position from equilibrium"},{"symbol":"A","name":"Amplitude","unit":"m","description":"Maximum displacement"},{"symbol":"ω","name":"Angular Frequency","unit":"rad/s","description":"ω = 2πf"},{"symbol":"t","name":"Time","unit":"s","description":""},{"symbol":"φ","name":"Phase Constant","unit":"rad","description":"Initial phase"}]',
   'Pendulum with A=0.1 m, f=2 Hz: x = 0.1·cos(4πt).', 'intermediate', true, '{"SHM","waves","HSC","oscillation"}', 1),

  (ch_id, phys_id, 'SHM Velocity', 'v = \pm\omega\sqrt{A^2 - x^2}', 'v = ±ω√(A² − x²)',
   'Velocity of SHM at displacement x.',
   '[{"symbol":"v","name":"Velocity","unit":"m/s","description":"Instantaneous velocity"},{"symbol":"ω","name":"Angular Frequency","unit":"rad/s","description":""},{"symbol":"A","name":"Amplitude","unit":"m","description":""},{"symbol":"x","name":"Displacement","unit":"m","description":""}]',
   'At x=0 (equilibrium): v = ±ωA (maximum).', 'intermediate', false, '{"SHM","velocity","HSC"}', 2),

  (ch_id, phys_id, 'Wave Equation', 'y = A\sin(kx - \omega t)', 'y = A·sin(kx − ωt)',
   'Displacement of a travelling wave.',
   '[{"symbol":"y","name":"Displacement","unit":"m","description":"Wave displacement at x,t"},{"symbol":"A","name":"Amplitude","unit":"m","description":""},{"symbol":"k","name":"Wave Number","unit":"rad/m","description":"k = 2π/λ"},{"symbol":"x","name":"Position","unit":"m","description":""},{"symbol":"ω","name":"Angular Frequency","unit":"rad/s","description":"ω = 2πf"},{"symbol":"t","name":"Time","unit":"s","description":""}]',
   'Describes a sinusoidal wave moving in +x direction.', 'advanced', true, '{"wave equation","HSC","waves"}', 3),

  (ch_id, phys_id, 'Simple Pendulum Period', 'T = 2\pi\sqrt{\frac{L}{g}}', 'T = 2π√(L/g)',
   'Period of oscillation of a simple pendulum.',
   '[{"symbol":"T","name":"Period","unit":"s","description":"Time for one swing"},{"symbol":"L","name":"Length","unit":"m","description":"Length of pendulum"},{"symbol":"g","name":"Gravity","unit":"9.8 m/s²","description":""}]',
   'L = 1 m: T = 2π√(1/9.8) ≈ 2.0 s.', 'intermediate', true, '{"pendulum","SHM","HSC"}', 4);

  -- ════════════════════════════════════════════════════════════
  -- MAGNETISM (HSC)
  -- ════════════════════════════════════════════════════════════
  select id into ch_id from public.formula_chapters where subject_id = phys_id and slug = 'magnetism';

  insert into public.formulas (chapter_id, subject_id, title, formula_latex, formula_plain, description, variables, example, difficulty, is_important, tags, sort_order) values
  (ch_id, phys_id, 'Faraday''s Law of Induction', '\mathcal{E} = -N\frac{d\Phi}{dt}', 'ε = −N·dΦ/dt',
   'EMF induced by changing magnetic flux.',
   '[{"symbol":"ε","name":"EMF","unit":"V","description":"Induced electromotive force"},{"symbol":"N","name":"Turns","unit":"—","description":"Number of coil turns"},{"symbol":"Φ","name":"Magnetic Flux","unit":"Wb","description":"Flux through each turn"},{"symbol":"t","name":"Time","unit":"s","description":""}]',
   '100-turn coil, flux changes by 0.02 Wb in 0.1 s: ε = 100×0.02/0.1 = 20 V.', 'advanced', true, '{"faraday","induction","HSC","magnetism"}', 1),

  (ch_id, phys_id, 'Transformer Equation', '\frac{V_s}{V_p} = \frac{N_s}{N_p}', 'Vs/Vp = Ns/Np',
   'Voltage ratio of a transformer equals turns ratio.',
   '[{"symbol":"Vs","name":"Secondary Voltage","unit":"V","description":"Output voltage"},{"symbol":"Vp","name":"Primary Voltage","unit":"V","description":"Input voltage"},{"symbol":"Ns","name":"Secondary Turns","unit":"—","description":""},{"symbol":"Np","name":"Primary Turns","unit":"—","description":""}]',
   'Np=100, Ns=500, Vp=230 V: Vs = 1150 V (step-up).', 'advanced', true, '{"transformer","HSC","magnetism"}', 2);

  -- ════════════════════════════════════════════════════════════
  -- MODERN PHYSICS (HSC)
  -- ════════════════════════════════════════════════════════════
  select id into ch_id from public.formula_chapters where subject_id = phys_id and slug = 'modern-physics';

  insert into public.formulas (chapter_id, subject_id, title, formula_latex, formula_plain, description, variables, example, difficulty, is_important, tags, sort_order) values
  (ch_id, phys_id, 'Photoelectric Effect', 'E_k = hf - \phi', 'Eₖ = hf − φ',
   'Maximum kinetic energy of photoelectrons.',
   '[{"symbol":"Eₖ","name":"Max KE","unit":"J or eV","description":"Kinetic energy of emitted electron"},{"symbol":"h","name":"Planck''s Constant","unit":"6.63×10⁻³⁴ J·s","description":""},{"symbol":"f","name":"Frequency","unit":"Hz","description":"Frequency of incident light"},{"symbol":"φ","name":"Work Function","unit":"J or eV","description":"Minimum energy to emit electron"}]',
   'Light at 6×10¹⁴ Hz on metal with φ=2 eV: Eₖ = hf − φ.', 'advanced', true, '{"photoelectric","HSC","quantum"}', 1),

  (ch_id, phys_id, 'Einstein Mass-Energy', 'E = mc^2', 'E = mc²',
   'Equivalence of mass and energy.',
   '[{"symbol":"E","name":"Energy","unit":"J","description":"Rest energy"},{"symbol":"m","name":"Mass","unit":"kg","description":"Rest mass"},{"symbol":"c","name":"Speed of Light","unit":"3×10⁸ m/s","description":""}]',
   '1 kg of mass: E = 1×(3×10⁸)² = 9×10¹⁶ J.', 'advanced', true, '{"einstein","relativity","HSC","energy"}', 2),

  (ch_id, phys_id, 'de Broglie Wavelength', '\lambda = \frac{h}{mv}', 'λ = h / mv',
   'Wave nature of particles — matter waves.',
   '[{"symbol":"λ","name":"de Broglie Wavelength","unit":"m","description":"Matter wave wavelength"},{"symbol":"h","name":"Planck''s Constant","unit":"6.63×10⁻³⁴ J·s","description":""},{"symbol":"m","name":"Mass","unit":"kg","description":""},{"symbol":"v","name":"Velocity","unit":"m/s","description":""}]',
   'Electron (m=9.1e-31 kg) at v=1e6 m/s: λ ≈ 7.3×10⁻¹⁰ m.', 'advanced', true, '{"de Broglie","quantum","HSC","wave"}', 3);

end $$;

-- ============================================================
-- DONE ✅  Physics Hub fully seeded
-- SSC: Physical Quantities, Motion, Force, Work-Energy-Power,
--      Waves & Sound, Light, Current Electricity
-- HSC: Vectors, Kinematics, Dynamics, Gravitation, Thermal,
--      Oscillations & Waves, Optics, Electrostatics,
--      Current Electricity, Magnetism, Modern Physics
-- ============================================================
