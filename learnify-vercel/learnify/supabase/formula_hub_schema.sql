-- ============================================================
-- LEARNIFY — FORMULA HUB SCHEMA
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── Subjects ─────────────────────────────────────────────────────
create table if not exists public.formula_subjects (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null unique,
  slug        text not null unique,          -- e.g. "physics"
  description text,
  icon        text,                          -- emoji e.g. "⚛️"
  color       text not null default '#3b82f6',
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.formula_subjects enable row level security;
create policy "Anyone can read subjects"
  on public.formula_subjects for select using (true);
create policy "Authenticated users can insert subjects"
  on public.formula_subjects for insert
  with check (auth.role() = 'authenticated');

-- ── Chapters ─────────────────────────────────────────────────────
create table if not exists public.formula_chapters (
  id          uuid primary key default uuid_generate_v4(),
  subject_id  uuid not null references public.formula_subjects(id) on delete cascade,
  name        text not null,
  slug        text not null,
  description text,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  unique (subject_id, slug)
);

alter table public.formula_chapters enable row level security;
create policy "Anyone can read chapters"
  on public.formula_chapters for select using (true);
create policy "Authenticated users can insert chapters"
  on public.formula_chapters for insert
  with check (auth.role() = 'authenticated');

create index formula_chapters_subject_idx on public.formula_chapters(subject_id);

-- ── Formulas ─────────────────────────────────────────────────────
create type public.formula_difficulty as enum ('beginner', 'intermediate', 'advanced');

create table if not exists public.formulas (
  id              uuid primary key default uuid_generate_v4(),
  chapter_id      uuid not null references public.formula_chapters(id) on delete cascade,
  subject_id      uuid not null references public.formula_subjects(id) on delete cascade,
  title           text not null,
  formula_latex   text not null,             -- LaTeX string e.g. "F = ma"
  formula_plain   text not null,             -- plain text e.g. "F = m × a"
  description     text,
  derivation      text,                      -- step-by-step derivation
  variables       jsonb not null default '[]'::jsonb,
  -- [{symbol, name, unit, description}]
  example         text,                      -- worked example
  notes           text,                      -- extra notes / tips
  tags            text[] default '{}',
  difficulty      public.formula_difficulty not null default 'beginner',
  is_important    boolean not null default false,
  sort_order      integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.formulas enable row level security;
create policy "Anyone can read formulas"
  on public.formulas for select using (true);
create policy "Authenticated users can insert formulas"
  on public.formulas for insert
  with check (auth.role() = 'authenticated');
create policy "Authenticated users can update formulas"
  on public.formulas for update
  using (auth.role() = 'authenticated');

create trigger formulas_updated_at
  before update on public.formulas
  for each row execute procedure public.set_updated_at();

create index formulas_chapter_idx    on public.formulas(chapter_id);
create index formulas_subject_idx    on public.formulas(subject_id);
create index formulas_difficulty_idx on public.formulas(difficulty);
create index formulas_tags_idx       on public.formulas using gin(tags);

-- ── Formula Bookmarks (per user) ─────────────────────────────────
create table if not exists public.formula_bookmarks (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  formula_id uuid not null references public.formulas(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, formula_id)
);

alter table public.formula_bookmarks enable row level security;
create policy "Users can CRUD own bookmarks"
  on public.formula_bookmarks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index formula_bookmarks_user_idx on public.formula_bookmarks(user_id);

-- ============================================================
-- SEED DATA — Physics, Chemistry, Mathematics
-- ============================================================

-- Subjects
insert into public.formula_subjects (name, slug, description, icon, color, sort_order) values
  ('Physics',     'physics',     'Mechanics, thermodynamics, waves, optics & more', '⚛️',  '#3b82f6', 1),
  ('Chemistry',   'chemistry',   'Stoichiometry, thermochemistry, equilibrium & more','🧪', '#10b981', 2),
  ('Mathematics', 'mathematics', 'Algebra, calculus, trigonometry & more',          '📐',  '#8b5cf6', 3)
on conflict (slug) do nothing;

-- ── Physics chapters
insert into public.formula_chapters (subject_id, name, slug, sort_order)
select id, ch.name, ch.slug, ch.ord from public.formula_subjects,
  (values
    ('Mechanics',         'mechanics',         1),
    ('Thermodynamics',    'thermodynamics',    2),
    ('Waves & Optics',    'waves-optics',      3),
    ('Electricity',       'electricity',       4),
    ('Modern Physics',    'modern-physics',    5)
  ) as ch(name, slug, ord)
where public.formula_subjects.slug = 'physics'
on conflict (subject_id, slug) do nothing;

-- ── Chemistry chapters
insert into public.formula_chapters (subject_id, name, slug, sort_order)
select id, ch.name, ch.slug, ch.ord from public.formula_subjects,
  (values
    ('Stoichiometry',     'stoichiometry',     1),
    ('Thermochemistry',   'thermochemistry',   2),
    ('Equilibrium',       'equilibrium',       3),
    ('Electrochemistry',  'electrochemistry',  4),
    ('Gas Laws',          'gas-laws',          5)
  ) as ch(name, slug, ord)
where public.formula_subjects.slug = 'chemistry'
on conflict (subject_id, slug) do nothing;

-- ── Mathematics chapters
insert into public.formula_chapters (subject_id, name, slug, sort_order)
select id, ch.name, ch.slug, ch.ord from public.formula_subjects,
  (values
    ('Algebra',           'algebra',           1),
    ('Trigonometry',      'trigonometry',      2),
    ('Calculus',          'calculus',          3),
    ('Statistics',        'statistics',        4),
    ('Geometry',          'geometry',          5)
  ) as ch(name, slug, ord)
where public.formula_subjects.slug = 'mathematics'
on conflict (subject_id, slug) do nothing;

-- ── Physics / Mechanics formulas
insert into public.formulas (chapter_id, subject_id, title, formula_latex, formula_plain, description, variables, example, difficulty, is_important, tags, sort_order)
select
  ch.id, s.id,
  f.title, f.latex, f.plain, f.desc,
  f.vars::jsonb, f.example, f.diff::formula_difficulty, f.imp, f.tags, f.ord
from public.formula_subjects s
join public.formula_chapters ch on ch.subject_id = s.id and ch.slug = 'mechanics'
cross join (values
  ('Newton''s Second Law', 'F = ma', 'F = m × a',
   'The net force on an object equals its mass times acceleration.',
   '[{"symbol":"F","name":"Force","unit":"N (Newton)","description":"Net force applied"},{"symbol":"m","name":"Mass","unit":"kg","description":"Mass of the object"},{"symbol":"a","name":"Acceleration","unit":"m/s²","description":"Acceleration produced"}]',
   'A 5 kg box accelerates at 3 m/s². Force = 5 × 3 = 15 N.',
   'beginner', true, '{"force","newton","mechanics"}', 1),

  ('Kinematic Equation 1', 'v = u + at', 'v = u + at',
   'Final velocity of an object under constant acceleration.',
   '[{"symbol":"v","name":"Final Velocity","unit":"m/s","description":"Velocity after time t"},{"symbol":"u","name":"Initial Velocity","unit":"m/s","description":"Velocity at t=0"},{"symbol":"a","name":"Acceleration","unit":"m/s²","description":"Constant acceleration"},{"symbol":"t","name":"Time","unit":"s","description":"Time elapsed"}]',
   'Car starts at 10 m/s, accelerates at 2 m/s² for 5 s. v = 10 + 2×5 = 20 m/s.',
   'beginner', true, '{"kinematics","velocity","motion"}', 2),

  ('Kinematic Equation 2', 's = ut + \frac{1}{2}at^2', 's = ut + ½at²',
   'Displacement of an object under constant acceleration.',
   '[{"symbol":"s","name":"Displacement","unit":"m","description":"Distance travelled"},{"symbol":"u","name":"Initial Velocity","unit":"m/s","description":"Starting velocity"},{"symbol":"a","name":"Acceleration","unit":"m/s²","description":"Constant acceleration"},{"symbol":"t","name":"Time","unit":"s","description":"Time elapsed"}]',
   'Object starts from rest (u=0), a=4 m/s², t=3 s. s = 0 + ½×4×9 = 18 m.',
   'beginner', true, '{"kinematics","displacement","motion"}', 3),

  ('Gravitational PE', 'PE = mgh', 'PE = m × g × h',
   'Potential energy stored in an object due to its height above the ground.',
   '[{"symbol":"PE","name":"Potential Energy","unit":"J","description":"Gravitational potential energy"},{"symbol":"m","name":"Mass","unit":"kg","description":"Mass of the object"},{"symbol":"g","name":"Gravity","unit":"9.8 m/s²","description":"Acceleration due to gravity"},{"symbol":"h","name":"Height","unit":"m","description":"Height above reference"}]',
   '2 kg book at 3 m height: PE = 2 × 9.8 × 3 = 58.8 J.',
   'beginner', true, '{"energy","potential","gravity"}', 4),

  ('Kinetic Energy', 'KE = \frac{1}{2}mv^2', 'KE = ½mv²',
   'Energy possessed by an object due to its motion.',
   '[{"symbol":"KE","name":"Kinetic Energy","unit":"J","description":"Energy of motion"},{"symbol":"m","name":"Mass","unit":"kg","description":"Mass of the object"},{"symbol":"v","name":"Velocity","unit":"m/s","description":"Speed of the object"}]',
   '3 kg ball moving at 4 m/s: KE = ½ × 3 × 16 = 24 J.',
   'beginner', true, '{"energy","kinetic","motion"}', 5),

  ('Universal Gravitation', 'F = G\frac{m_1 m_2}{r^2}', 'F = G × m₁m₂ / r²',
   'Gravitational force between two masses separated by distance r.',
   '[{"symbol":"F","name":"Force","unit":"N","description":"Gravitational attraction"},{"symbol":"G","name":"Gravitational Constant","unit":"6.674×10⁻¹¹ N·m²/kg²","description":"Universal gravitational constant"},{"symbol":"m₁,m₂","name":"Masses","unit":"kg","description":"The two masses"},{"symbol":"r","name":"Distance","unit":"m","description":"Distance between centres"}]',
   'Earth-Moon system: demonstrates inverse-square law.',
   'intermediate', true, '{"gravity","newton","planets"}', 6)
) as f(title,latex,plain,desc,vars,example,diff,imp,tags,ord)
where s.slug = 'physics'
on conflict do nothing;

-- ── Physics / Thermodynamics
insert into public.formulas (chapter_id, subject_id, title, formula_latex, formula_plain, description, variables, example, difficulty, is_important, tags, sort_order)
select ch.id, s.id, f.title, f.latex, f.plain, f.desc, f.vars::jsonb, f.example, f.diff::formula_difficulty, f.imp, f.tags, f.ord
from public.formula_subjects s
join public.formula_chapters ch on ch.subject_id = s.id and ch.slug = 'thermodynamics'
cross join (values
  ('First Law of Thermodynamics', '\Delta U = Q - W', 'ΔU = Q − W',
   'The change in internal energy equals heat added minus work done by the system.',
   '[{"symbol":"ΔU","name":"Internal Energy Change","unit":"J","description":"Change in internal energy"},{"symbol":"Q","name":"Heat","unit":"J","description":"Heat added to system"},{"symbol":"W","name":"Work","unit":"J","description":"Work done by system"}]',
   '400 J added, system does 150 J work: ΔU = 400 − 150 = 250 J.',
   'intermediate', true, '{"thermodynamics","energy","heat"}', 1),

  ('Ideal Gas Law', 'PV = nRT', 'PV = nRT',
   'Relates pressure, volume, temperature and moles of an ideal gas.',
   '[{"symbol":"P","name":"Pressure","unit":"Pa","description":"Gas pressure"},{"symbol":"V","name":"Volume","unit":"m³","description":"Volume of gas"},{"symbol":"n","name":"Moles","unit":"mol","description":"Amount of substance"},{"symbol":"R","name":"Gas Constant","unit":"8.314 J/mol·K","description":"Universal gas constant"},{"symbol":"T","name":"Temperature","unit":"K","description":"Absolute temperature"}]',
   '2 mol gas at 300 K in 0.05 m³: P = 2×8.314×300/0.05 = 99,768 Pa.',
   'beginner', true, '{"gas","pressure","temperature"}', 2)
) as f(title,latex,plain,desc,vars,example,diff,imp,tags,ord)
where s.slug = 'physics'
on conflict do nothing;

-- ── Chemistry / Gas Laws
insert into public.formulas (chapter_id, subject_id, title, formula_latex, formula_plain, description, variables, example, difficulty, is_important, tags, sort_order)
select ch.id, s.id, f.title, f.latex, f.plain, f.desc, f.vars::jsonb, f.example, f.diff::formula_difficulty, f.imp, f.tags, f.ord
from public.formula_subjects s
join public.formula_chapters ch on ch.subject_id = s.id and ch.slug = 'gas-laws'
cross join (values
  ('Boyle''s Law', 'P_1V_1 = P_2V_2', 'P₁V₁ = P₂V₂',
   'At constant temperature, pressure and volume are inversely proportional.',
   '[{"symbol":"P₁","name":"Initial Pressure","unit":"Pa","description":"Starting pressure"},{"symbol":"V₁","name":"Initial Volume","unit":"m³","description":"Starting volume"},{"symbol":"P₂","name":"Final Pressure","unit":"Pa","description":"New pressure"},{"symbol":"V₂","name":"Final Volume","unit":"m³","description":"New volume"}]',
   'Gas at 2 atm, 3 L is compressed to 1 L: P₂ = 2×3/1 = 6 atm.',
   'beginner', true, '{"gas","pressure","boyle"}', 1),

  ('Charles'' Law', '\frac{V_1}{T_1} = \frac{V_2}{T_2}', 'V₁/T₁ = V₂/T₂',
   'At constant pressure, volume is directly proportional to temperature.',
   '[{"symbol":"V₁","name":"Initial Volume","unit":"L or m³","description":"Starting volume"},{"symbol":"T₁","name":"Initial Temp","unit":"K","description":"Starting temperature in Kelvin"},{"symbol":"V₂","name":"Final Volume","unit":"L or m³","description":"New volume"},{"symbol":"T₂","name":"Final Temp","unit":"K","description":"New temperature in Kelvin"}]',
   'Gas 2 L at 300 K; heated to 600 K: V₂ = 2×600/300 = 4 L.',
   'beginner', true, '{"gas","volume","temperature","charles"}', 2)
) as f(title,latex,plain,desc,vars,example,diff,imp,tags,ord)
where s.slug = 'chemistry'
on conflict do nothing;

-- ── Mathematics / Algebra
insert into public.formulas (chapter_id, subject_id, title, formula_latex, formula_plain, description, variables, example, difficulty, is_important, tags, sort_order)
select ch.id, s.id, f.title, f.latex, f.plain, f.desc, f.vars::jsonb, f.example, f.diff::formula_difficulty, f.imp, f.tags, f.ord
from public.formula_subjects s
join public.formula_chapters ch on ch.subject_id = s.id and ch.slug = 'algebra'
cross join (values
  ('Quadratic Formula', 'x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}', 'x = (−b ± √(b²−4ac)) / 2a',
   'Finds roots of any quadratic equation ax² + bx + c = 0.',
   '[{"symbol":"a","name":"Leading Coefficient","unit":"—","description":"Coefficient of x²"},{"symbol":"b","name":"Middle Coefficient","unit":"—","description":"Coefficient of x"},{"symbol":"c","name":"Constant","unit":"—","description":"Constant term"},{"symbol":"x","name":"Roots","unit":"—","description":"Solutions of the equation"}]',
   'x²−5x+6=0: x=(5±√(25−24))/2 = (5±1)/2 → x=3 or x=2.',
   'beginner', true, '{"quadratic","roots","algebra"}', 1),

  ('Binomial Theorem', '(a+b)^n = \sum_{k=0}^{n}\binom{n}{k}a^{n-k}b^k', '(a+b)ⁿ = Σ C(n,k) aⁿ⁻ᵏ bᵏ',
   'Expansion of a binomial raised to any positive integer power.',
   '[{"symbol":"a,b","name":"Terms","unit":"—","description":"The two terms of the binomial"},{"symbol":"n","name":"Exponent","unit":"—","description":"Power to raise the binomial"},{"symbol":"C(n,k)","name":"Binomial Coefficient","unit":"—","description":"n! / (k!(n-k)!)"}]',
   '(x+1)³ = x³ + 3x² + 3x + 1.',
   'intermediate', false, '{"binomial","expansion","algebra"}', 2)
) as f(title,latex,plain,desc,vars,example,diff,imp,tags,ord)
where s.slug = 'mathematics'
on conflict do nothing;

-- ── Mathematics / Trigonometry
insert into public.formulas (chapter_id, subject_id, title, formula_latex, formula_plain, description, variables, example, difficulty, is_important, tags, sort_order)
select ch.id, s.id, f.title, f.latex, f.plain, f.desc, f.vars::jsonb, f.example, f.diff::formula_difficulty, f.imp, f.tags, f.ord
from public.formula_subjects s
join public.formula_chapters ch on ch.subject_id = s.id and ch.slug = 'trigonometry'
cross join (values
  ('Pythagorean Identity', '\sin^2\theta + \cos^2\theta = 1', 'sin²θ + cos²θ = 1',
   'Fundamental identity relating sine and cosine of any angle.',
   '[{"symbol":"θ","name":"Angle","unit":"degrees or radians","description":"Any angle"},{"symbol":"sin θ","name":"Sine","unit":"—","description":"Ratio of opposite to hypotenuse"},{"symbol":"cos θ","name":"Cosine","unit":"—","description":"Ratio of adjacent to hypotenuse"}]',
   'sin(30°)=0.5, cos(30°)≈0.866: 0.25+0.75=1 ✓',
   'beginner', true, '{"trigonometry","identity","sine","cosine"}', 1),

  ('Sine Rule', '\frac{a}{\sin A} = \frac{b}{\sin B} = \frac{c}{\sin C}', 'a/sin A = b/sin B = c/sin C',
   'Relates sides of a triangle to the sines of their opposite angles.',
   '[{"symbol":"a,b,c","name":"Side Lengths","unit":"m or any","description":"Lengths of the three sides"},{"symbol":"A,B,C","name":"Angles","unit":"degrees","description":"Angles opposite respective sides"}]',
   'Find side b: a=7, A=30°, B=45°. b = 7×sin45°/sin30° ≈ 9.9.',
   'intermediate', true, '{"triangle","sine rule","trigonometry"}', 2),

  ('Cosine Rule', 'c^2 = a^2 + b^2 - 2ab\cos C', 'c² = a² + b² − 2ab·cos C',
   'Generalisation of Pythagoras for any triangle.',
   '[{"symbol":"a,b,c","name":"Sides","unit":"m","description":"Side lengths"},{"symbol":"C","name":"Included Angle","unit":"degrees","description":"Angle between sides a and b"}]',
   'a=5, b=7, C=60°: c²=25+49−2×5×7×0.5=74−35=39; c≈6.24.',
   'intermediate', true, '{"cosine rule","triangle","pythagoras"}', 3)
) as f(title,latex,plain,desc,vars,example,diff,imp,tags,ord)
where s.slug = 'mathematics'
on conflict do nothing;

-- ── Mathematics / Calculus
insert into public.formulas (chapter_id, subject_id, title, formula_latex, formula_plain, description, variables, example, difficulty, is_important, tags, sort_order)
select ch.id, s.id, f.title, f.latex, f.plain, f.desc, f.vars::jsonb, f.example, f.diff::formula_difficulty, f.imp, f.tags, f.ord
from public.formula_subjects s
join public.formula_chapters ch on ch.subject_id = s.id and ch.slug = 'calculus'
cross join (values
  ('Power Rule', '\frac{d}{dx}x^n = nx^{n-1}', 'd/dx (xⁿ) = n·xⁿ⁻¹',
   'Derivative of a power function.',
   '[{"symbol":"n","name":"Exponent","unit":"—","description":"Any real number"},{"symbol":"x","name":"Variable","unit":"—","description":"Independent variable"}]',
   'd/dx (x³) = 3x². d/dx (x⁵) = 5x⁴.',
   'beginner', true, '{"derivative","calculus","power rule"}', 1),

  ('Chain Rule', '\frac{d}{dx}f(g(x)) = f''(g(x)) \cdot g''(x)', 'd/dx f(g(x)) = f′(g(x)) · g′(x)',
   'Derivative of a composite function.',
   '[{"symbol":"f","name":"Outer Function","unit":"—","description":"The outer function"},{"symbol":"g","name":"Inner Function","unit":"—","description":"The inner function"}]',
   'd/dx sin(x²): outer=sin, inner=x². = cos(x²)·2x.',
   'intermediate', true, '{"derivative","chain rule","composite"}', 2),

  ('Fundamental Theorem of Calculus', '\int_a^b f(x)\,dx = F(b) - F(a)', '∫ₐᵇ f(x)dx = F(b) − F(a)',
   'Connects differentiation and integration.',
   '[{"symbol":"f(x)","name":"Integrand","unit":"—","description":"Function to integrate"},{"symbol":"F(x)","name":"Antiderivative","unit":"—","description":"Function where F′=f"},{"symbol":"a,b","name":"Bounds","unit":"—","description":"Limits of integration"}]',
   '∫₀² x dx = [x²/2]₀² = 4/2 − 0 = 2.',
   'intermediate', true, '{"integral","calculus","fundamental theorem"}', 3)
) as f(title,latex,plain,desc,vars,example,diff,imp,tags,ord)
where s.slug = 'mathematics'
on conflict do nothing;

-- ── Chemistry / Stoichiometry
insert into public.formulas (chapter_id, subject_id, title, formula_latex, formula_plain, description, variables, example, difficulty, is_important, tags, sort_order)
select ch.id, s.id, f.title, f.latex, f.plain, f.desc, f.vars::jsonb, f.example, f.diff::formula_difficulty, f.imp, f.tags, f.ord
from public.formula_subjects s
join public.formula_chapters ch on ch.subject_id = s.id and ch.slug = 'stoichiometry'
cross join (values
  ('Mole Formula', 'n = \frac{m}{M}', 'n = m / M',
   'Number of moles from mass and molar mass.',
   '[{"symbol":"n","name":"Moles","unit":"mol","description":"Amount of substance"},{"symbol":"m","name":"Mass","unit":"g","description":"Mass of substance"},{"symbol":"M","name":"Molar Mass","unit":"g/mol","description":"Mass per mole (from periodic table)"}]',
   '18 g of water (M=18 g/mol): n = 18/18 = 1 mol.',
   'beginner', true, '{"moles","stoichiometry","mass"}', 1),

  ('Concentration', 'C = \frac{n}{V}', 'C = n / V',
   'Molar concentration of a solution.',
   '[{"symbol":"C","name":"Concentration","unit":"mol/L (M)","description":"Moles per litre"},{"symbol":"n","name":"Moles","unit":"mol","description":"Amount of solute"},{"symbol":"V","name":"Volume","unit":"L","description":"Volume of solution"}]',
   '0.5 mol NaCl in 0.25 L: C = 0.5/0.25 = 2 mol/L.',
   'beginner', true, '{"concentration","solution","molarity"}', 2)
) as f(title,latex,plain,desc,vars,example,diff,imp,tags,ord)
where s.slug = 'chemistry'
on conflict do nothing;

-- ============================================================
-- DONE ✅
-- Tables: formula_subjects, formula_chapters, formulas, formula_bookmarks
-- Seed: 3 subjects, 15 chapters, 18 formulas
-- ============================================================
