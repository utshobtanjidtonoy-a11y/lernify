-- ============================================================
-- LEARNIFY — CHEMISTRY ENGINE SCHEMA
-- Run in: Supabase → SQL Editor → New Query
-- ============================================================

-- ── 1. ELEMENTS (all 118) ─────────────────────────────────────────
create table if not exists public.chem_elements (
  atomic_number   integer primary key,
  symbol          text    not null unique,
  name            text    not null,
  atomic_mass     numeric(10,4),
  category        text,   -- "nonmetal","metal","metalloid","noble gas","halogen","alkali metal","alkaline earth","transition metal","lanthanide","actinide"
  period          integer,
  group_num       integer,
  block           text,   -- s, p, d, f
  electronegativity numeric(4,2),
  common_oxidation_states integer[],
  color           text    default '#94a3b8',
  description     text,
  created_at      timestamptz not null default now()
);

alter table public.chem_elements enable row level security;
create policy "Anyone can read elements" on public.chem_elements for select using (true);
create policy "Authenticated can insert elements" on public.chem_elements for insert with check (auth.role() = 'authenticated');

-- ── 2. MOLECULES ─────────────────────────────────────────────────
create table if not exists public.chem_molecules (
  id              uuid primary key default uuid_generate_v4(),
  formula         text    not null unique,  -- e.g. "H2O"
  name            text,
  iupac_name      text,
  molecular_mass  numeric(10,4),
  geometry        text,   -- linear, bent, trigonal_planar, tetrahedral, etc.
  bond_angle      numeric(5,2),
  bond_type       text,   -- ionic, covalent, metallic, coordinate
  polarity        text,   -- polar, nonpolar
  state_at_room   text,   -- solid, liquid, gas
  color_hex       text    default '#3b82f6',
  atom_composition jsonb  default '{}',  -- {"H":2,"O":1}
  created_at      timestamptz not null default now()
);

alter table public.chem_molecules enable row level security;
create policy "Anyone can read molecules" on public.chem_molecules for select using (true);
create policy "Authenticated can insert molecules" on public.chem_molecules for insert with check (auth.role() = 'authenticated');

create index chem_molecules_formula_idx on public.chem_molecules(formula);

-- ── 3. REACTIONS ─────────────────────────────────────────────────
create type public.reaction_type as enum (
  'combination','decomposition','single_displacement','double_displacement',
  'combustion','acid_base','redox','precipitation','unknown'
);

create table if not exists public.chem_reactions (
  id              uuid primary key default uuid_generate_v4(),
  equation        text    not null,          -- "2H2 + O2 → 2H2O"
  equation_plain  text    not null,          -- "2H2 + O2 -> 2H2O"
  reactants       jsonb   not null,          -- [{"formula":"H2","coeff":2},{"formula":"O2","coeff":1}]
  products        jsonb   not null,          -- [{"formula":"H2O","coeff":2}]
  reaction_type   public.reaction_type default 'unknown',
  is_balanced     boolean not null default false,
  delta_h         numeric(10,2),             -- enthalpy kJ/mol
  conditions      text,                      -- "heat","catalyst","light"
  description     text,
  ai_explanation  text,                      -- cached AI explanation
  created_by      uuid references public.profiles(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.chem_reactions enable row level security;
create policy "Anyone can read reactions" on public.chem_reactions for select using (true);
create policy "Authenticated can insert reactions" on public.chem_reactions for insert with check (auth.role() = 'authenticated');
create policy "Owners can update reactions" on public.chem_reactions for update using (auth.uid() = created_by);

create trigger chem_reactions_updated_at
  before update on public.chem_reactions
  for each row execute procedure public.set_updated_at();

create index chem_reactions_type_idx on public.chem_reactions(reaction_type);

-- ── 4. USER REACTION HISTORY ─────────────────────────────────────
create table if not exists public.chem_reaction_history (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  reaction_id uuid references public.chem_reactions(id) on delete set null,
  equation    text not null,
  viewed_at   timestamptz not null default now()
);

alter table public.chem_reaction_history enable row level security;
create policy "Users own their history" on public.chem_reaction_history for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════
-- SEED: All 118 elements
-- ════════════════════════════════════════════════════════════
insert into public.chem_elements
  (atomic_number,symbol,name,atomic_mass,category,period,group_num,block,electronegativity,common_oxidation_states,color) values
-- Period 1
(1,'H','Hydrogen',1.008,'nonmetal',1,1,'s',2.20,'{1,-1}','#60a5fa'),
(2,'He','Helium',4.003,'noble gas',1,18,'s',null,'{}','#a78bfa'),
-- Period 2
(3,'Li','Lithium',6.941,'alkali metal',2,1,'s',0.98,'{1}','#f59e0b'),
(4,'Be','Beryllium',9.012,'alkaline earth',2,2,'s',1.57,'{2}','#84cc16'),
(5,'B','Boron',10.811,'metalloid',2,13,'p',2.04,'{3}','#f97316'),
(6,'C','Carbon',12.011,'nonmetal',2,14,'p',2.55,'{4,2,-4}','#6b7280'),
(7,'N','Nitrogen',14.007,'nonmetal',2,15,'p',3.04,'{3,5,-3}','#3b82f6'),
(8,'O','Oxygen',15.999,'nonmetal',2,16,'p',3.44,'{-2,-1}','#ef4444'),
(9,'F','Fluorine',18.998,'halogen',2,17,'p',3.98,'{-1}','#10b981'),
(10,'Ne','Neon',20.180,'noble gas',2,18,'p',null,'{}','#a78bfa'),
-- Period 3
(11,'Na','Sodium',22.990,'alkali metal',3,1,'s',0.93,'{1}','#f59e0b'),
(12,'Mg','Magnesium',24.305,'alkaline earth',3,2,'s',1.31,'{2}','#84cc16'),
(13,'Al','Aluminum',26.982,'metal',3,13,'p',1.61,'{3}','#94a3b8'),
(14,'Si','Silicon',28.086,'metalloid',3,14,'p',1.90,'{4,-4}','#f97316'),
(15,'P','Phosphorus',30.974,'nonmetal',3,15,'p',2.19,'{5,3,-3}','#f59e0b'),
(16,'S','Sulfur',32.065,'nonmetal',3,16,'p',2.58,'{6,4,-2}','#eab308'),
(17,'Cl','Chlorine',35.453,'halogen',3,17,'p',3.16,'{-1,1,3,5,7}','#10b981'),
(18,'Ar','Argon',39.948,'noble gas',3,18,'p',null,'{}','#a78bfa'),
-- Period 4
(19,'K','Potassium',39.098,'alkali metal',4,1,'s',0.82,'{1}','#f59e0b'),
(20,'Ca','Calcium',40.078,'alkaline earth',4,2,'s',1.00,'{2}','#84cc16'),
(21,'Sc','Scandium',44.956,'transition metal',4,3,'d',1.36,'{3}','#64748b'),
(22,'Ti','Titanium',47.867,'transition metal',4,4,'d',1.54,'{4,3,2}','#64748b'),
(23,'V','Vanadium',50.942,'transition metal',4,5,'d',1.63,'{5,4,3,2}','#64748b'),
(24,'Cr','Chromium',51.996,'transition metal',4,6,'d',1.66,'{6,3,2}','#64748b'),
(25,'Mn','Manganese',54.938,'transition metal',4,7,'d',1.55,'{7,4,2,3}','#64748b'),
(26,'Fe','Iron',55.845,'transition metal',4,8,'d',1.83,'{3,2}','#cd7f32'),
(27,'Co','Cobalt',58.933,'transition metal',4,9,'d',1.88,'{3,2}','#64748b'),
(28,'Ni','Nickel',58.693,'transition metal',4,10,'d',1.91,'{2,3}','#64748b'),
(29,'Cu','Copper',63.546,'transition metal',4,11,'d',1.90,'{2,1}','#b45309'),
(30,'Zn','Zinc',65.38,'transition metal',4,12,'d',1.65,'{2}','#64748b'),
(31,'Ga','Gallium',69.723,'metal',4,13,'p',1.81,'{3}','#94a3b8'),
(32,'Ge','Germanium',72.631,'metalloid',4,14,'p',2.01,'{4,2}','#f97316'),
(33,'As','Arsenic',74.922,'metalloid',4,15,'p',2.18,'{5,3,-3}','#f97316'),
(34,'Se','Selenium',78.971,'nonmetal',4,16,'p',2.55,'{6,4,-2}','#eab308'),
(35,'Br','Bromine',79.904,'halogen',4,17,'p',2.96,'{-1,1,3,5}','#92400e'),
(36,'Kr','Krypton',83.798,'noble gas',4,18,'p',null,'{}','#a78bfa'),
-- Period 5
(37,'Rb','Rubidium',85.468,'alkali metal',5,1,'s',0.82,'{1}','#f59e0b'),
(38,'Sr','Strontium',87.62,'alkaline earth',5,2,'s',0.95,'{2}','#84cc16'),
(39,'Y','Yttrium',88.906,'transition metal',5,3,'d',1.22,'{3}','#64748b'),
(40,'Zr','Zirconium',91.224,'transition metal',5,4,'d',1.33,'{4}','#64748b'),
(41,'Nb','Niobium',92.906,'transition metal',5,5,'d',1.6,'{5,3}','#64748b'),
(42,'Mo','Molybdenum',95.96,'transition metal',5,6,'d',2.16,'{6,4,2}','#64748b'),
(43,'Tc','Technetium',98.0,'transition metal',5,7,'d',1.9,'{7,4}','#64748b'),
(44,'Ru','Ruthenium',101.07,'transition metal',5,8,'d',2.2,'{3,4}','#64748b'),
(45,'Rh','Rhodium',102.906,'transition metal',5,9,'d',2.28,'{3}','#64748b'),
(46,'Pd','Palladium',106.42,'transition metal',5,10,'d',2.20,'{2,4}','#64748b'),
(47,'Ag','Silver',107.868,'transition metal',5,11,'d',1.93,'{1}','#94a3b8'),
(48,'Cd','Cadmium',112.411,'transition metal',5,12,'d',1.69,'{2}','#64748b'),
(49,'In','Indium',114.818,'metal',5,13,'p',1.78,'{3}','#94a3b8'),
(50,'Sn','Tin',118.71,'metal',5,14,'p',1.96,'{4,2}','#94a3b8'),
(51,'Sb','Antimony',121.76,'metalloid',5,15,'p',2.05,'{5,3,-3}','#f97316'),
(52,'Te','Tellurium',127.6,'metalloid',5,16,'p',2.1,'{6,4,-2}','#f97316'),
(53,'I','Iodine',126.904,'halogen',5,17,'p',2.66,'{-1,1,3,5,7}','#7c3aed'),
(54,'Xe','Xenon',131.293,'noble gas',5,18,'p',null,'{}','#a78bfa'),
-- Period 6
(55,'Cs','Cesium',132.905,'alkali metal',6,1,'s',0.79,'{1}','#f59e0b'),
(56,'Ba','Barium',137.327,'alkaline earth',6,2,'s',0.89,'{2}','#84cc16'),
(57,'La','Lanthanum',138.905,'lanthanide',6,3,'f',1.10,'{3}','#e879f9'),
(58,'Ce','Cerium',140.116,'lanthanide',6,null,'f',1.12,'{4,3}','#e879f9'),
(59,'Pr','Praseodymium',140.908,'lanthanide',6,null,'f',1.13,'{3}','#e879f9'),
(60,'Nd','Neodymium',144.242,'lanthanide',6,null,'f',1.14,'{3}','#e879f9'),
(61,'Pm','Promethium',145.0,'lanthanide',6,null,'f',1.13,'{3}','#e879f9'),
(62,'Sm','Samarium',150.36,'lanthanide',6,null,'f',1.17,'{3,2}','#e879f9'),
(63,'Eu','Europium',151.964,'lanthanide',6,null,'f',1.2,'{3,2}','#e879f9'),
(64,'Gd','Gadolinium',157.25,'lanthanide',6,null,'f',1.2,'{3}','#e879f9'),
(65,'Tb','Terbium',158.925,'lanthanide',6,null,'f',1.2,'{3}','#e879f9'),
(66,'Dy','Dysprosium',162.5,'lanthanide',6,null,'f',1.22,'{3}','#e879f9'),
(67,'Ho','Holmium',164.930,'lanthanide',6,null,'f',1.23,'{3}','#e879f9'),
(68,'Er','Erbium',167.259,'lanthanide',6,null,'f',1.24,'{3}','#e879f9'),
(69,'Tm','Thulium',168.934,'lanthanide',6,null,'f',1.25,'{3,2}','#e879f9'),
(70,'Yb','Ytterbium',173.045,'lanthanide',6,null,'f',1.1,'{3,2}','#e879f9'),
(71,'Lu','Lutetium',174.967,'lanthanide',6,3,'f',1.27,'{3}','#e879f9'),
(72,'Hf','Hafnium',178.49,'transition metal',6,4,'d',1.3,'{4}','#64748b'),
(73,'Ta','Tantalum',180.948,'transition metal',6,5,'d',1.5,'{5}','#64748b'),
(74,'W','Tungsten',183.84,'transition metal',6,6,'d',2.36,'{6,4,2}','#64748b'),
(75,'Re','Rhenium',186.207,'transition metal',6,7,'d',1.9,'{7,4,2}','#64748b'),
(76,'Os','Osmium',190.23,'transition metal',6,8,'d',2.2,'{4,3}','#64748b'),
(77,'Ir','Iridium',192.217,'transition metal',6,9,'d',2.20,'{3,4}','#64748b'),
(78,'Pt','Platinum',195.084,'transition metal',6,10,'d',2.28,'{4,2}','#94a3b8'),
(79,'Au','Gold',196.967,'transition metal',6,11,'d',2.54,'{3,1}','#d97706'),
(80,'Hg','Mercury',200.592,'transition metal',6,12,'d',2.00,'{2,1}','#64748b'),
(81,'Tl','Thallium',204.383,'metal',6,13,'p',1.62,'{3,1}','#94a3b8'),
(82,'Pb','Lead',207.2,'metal',6,14,'p',2.33,'{4,2}','#94a3b8'),
(83,'Bi','Bismuth',208.980,'metal',6,15,'p',2.02,'{3,5}','#94a3b8'),
(84,'Po','Polonium',209.0,'metalloid',6,16,'p',2.0,'{4,2}','#f97316'),
(85,'At','Astatine',210.0,'halogen',6,17,'p',2.2,'{-1,1}','#10b981'),
(86,'Rn','Radon',222.0,'noble gas',6,18,'p',null,'{}','#a78bfa'),
-- Period 7
(87,'Fr','Francium',223.0,'alkali metal',7,1,'s',0.7,'{1}','#f59e0b'),
(88,'Ra','Radium',226.0,'alkaline earth',7,2,'s',0.9,'{2}','#84cc16'),
(89,'Ac','Actinium',227.0,'actinide',7,3,'f',1.1,'{3}','#06b6d4'),
(90,'Th','Thorium',232.038,'actinide',7,null,'f',1.3,'{4}','#06b6d4'),
(91,'Pa','Protactinium',231.036,'actinide',7,null,'f',1.5,'{5,4}','#06b6d4'),
(92,'U','Uranium',238.029,'actinide',7,null,'f',1.38,'{6,5,4,3}','#06b6d4'),
(93,'Np','Neptunium',237.0,'actinide',7,null,'f',1.36,'{5,4,3}','#06b6d4'),
(94,'Pu','Plutonium',244.0,'actinide',7,null,'f',1.28,'{4,3,5,6}','#06b6d4'),
(95,'Am','Americium',243.0,'actinide',7,null,'f',1.3,'{3}','#06b6d4'),
(96,'Cm','Curium',247.0,'actinide',7,null,'f',1.3,'{3}','#06b6d4'),
(97,'Bk','Berkelium',247.0,'actinide',7,null,'f',1.3,'{3}','#06b6d4'),
(98,'Cf','Californium',251.0,'actinide',7,null,'f',1.3,'{3}','#06b6d4'),
(99,'Es','Einsteinium',252.0,'actinide',7,null,'f',1.3,'{3}','#06b6d4'),
(100,'Fm','Fermium',257.0,'actinide',7,null,'f',1.3,'{3}','#06b6d4'),
(101,'Md','Mendelevium',258.0,'actinide',7,null,'f',1.3,'{3}','#06b6d4'),
(102,'No','Nobelium',259.0,'actinide',7,null,'f',1.3,'{2,3}','#06b6d4'),
(103,'Lr','Lawrencium',262.0,'actinide',7,3,'f',null,'{3}','#06b6d4'),
(104,'Rf','Rutherfordium',267.0,'transition metal',7,4,'d',null,'{4}','#64748b'),
(105,'Db','Dubnium',268.0,'transition metal',7,5,'d',null,'{5}','#64748b'),
(106,'Sg','Seaborgium',271.0,'transition metal',7,6,'d',null,'{6}','#64748b'),
(107,'Bh','Bohrium',272.0,'transition metal',7,7,'d',null,'{7}','#64748b'),
(108,'Hs','Hassium',270.0,'transition metal',7,8,'d',null,'{8}','#64748b'),
(109,'Mt','Meitnerium',278.0,'transition metal',7,9,'d',null,'{3}','#64748b'),
(110,'Ds','Darmstadtium',281.0,'transition metal',7,10,'d',null,'{2}','#64748b'),
(111,'Rg','Roentgenium',282.0,'transition metal',7,11,'d',null,'{1}','#64748b'),
(112,'Cn','Copernicium',285.0,'transition metal',7,12,'d',null,'{2}','#64748b'),
(113,'Nh','Nihonium',286.0,'metal',7,13,'p',null,'{1}','#94a3b8'),
(114,'Fl','Flerovium',289.0,'metal',7,14,'p',null,'{2}','#94a3b8'),
(115,'Mc','Moscovium',290.0,'metal',7,15,'p',null,'{1}','#94a3b8'),
(116,'Lv','Livermorium',293.0,'metal',7,16,'p',null,'{2}','#94a3b8'),
(117,'Ts','Tennessine',294.0,'halogen',7,17,'p',null,'{-1,1}','#10b981'),
(118,'Og','Oganesson',294.0,'noble gas',7,18,'p',null,'{}','#a78bfa')
on conflict (atomic_number) do nothing;

-- ── SEED: Common molecules ────────────────────────────────────────
insert into public.chem_molecules (formula,name,geometry,bond_angle,bond_type,polarity,state_at_room,color_hex,atom_composition) values
('H2',  'Hydrogen gas',    'linear',    180,  'covalent',  'nonpolar','gas',   '#60a5fa','{"H":2}'),
('O2',  'Oxygen gas',      'linear',    180,  'covalent',  'nonpolar','gas',   '#ef4444','{"O":2}'),
('N2',  'Nitrogen gas',    'linear',    180,  'covalent',  'nonpolar','gas',   '#3b82f6','{"N":2}'),
('Cl2', 'Chlorine gas',    'linear',    180,  'covalent',  'nonpolar','gas',   '#10b981','{"Cl":2}'),
('H2O', 'Water',           'bent',      104.5,'covalent',  'polar',   'liquid','#3b82f6','{"H":2,"O":1}'),
('CO2', 'Carbon dioxide',  'linear',    180,  'covalent',  'nonpolar','gas',   '#6b7280','{"C":1,"O":2}'),
('NH3', 'Ammonia',         'trigonal_pyramidal',107,'covalent','polar','gas',  '#3b82f6','{"N":1,"H":3}'),
('CH4', 'Methane',         'tetrahedral',109.5,'covalent', 'nonpolar','gas',   '#6b7280','{"C":1,"H":4}'),
('NaCl','Sodium chloride', 'octahedral', 90, 'ionic',     'ionic',   'solid', '#f59e0b','{"Na":1,"Cl":1}'),
('HCl', 'Hydrogen chloride','linear',   180,  'covalent',  'polar',   'gas',   '#10b981','{"H":1,"Cl":1}'),
('NaOH','Sodium hydroxide',null,        null, 'ionic',     'ionic',   'solid', '#f59e0b','{"Na":1,"O":1,"H":1}'),
('H2SO4','Sulfuric acid',  'tetrahedral',109.5,'covalent', 'polar',   'liquid','#eab308','{"H":2,"S":1,"O":4}'),
('HNO3','Nitric acid',     'trigonal_planar',120,'covalent','polar',  'liquid','#ef4444','{"H":1,"N":1,"O":3}'),
('Fe2O3','Iron(III) oxide',null,         null, 'ionic',    'ionic',   'solid', '#cd7f32','{"Fe":2,"O":3}'),
('CaCO3','Calcium carbonate',null,       null,'ionic',     'ionic',   'solid', '#84cc16','{"Ca":1,"C":1,"O":3}'),
('SO2',  'Sulfur dioxide', 'bent',       119,  'covalent', 'polar',   'gas',   '#eab308','{"S":1,"O":2}'),
('BF3',  'Boron trifluoride','trigonal_planar',120,'covalent','nonpolar','gas','#10b981','{"B":1,"F":3}'),
('PCl5', 'Phosphorus pentachloride','trigonal_bipyramidal',90,'covalent','nonpolar','solid','#f59e0b','{"P":1,"Cl":5}'),
('SF6',  'Sulfur hexafluoride','octahedral',90,'covalent', 'nonpolar','gas',   '#eab308','{"S":1,"F":6}'),
('C2H6', 'Ethane',         'tetrahedral',109.5,'covalent', 'nonpolar','gas',   '#6b7280','{"C":2,"H":6}'),
('C2H4', 'Ethylene',       'trigonal_planar',120,'covalent','nonpolar','gas',  '#6b7280','{"C":2,"H":4}'),
('C6H6', 'Benzene',        'trigonal_planar',120,'covalent','nonpolar','liquid','#6b7280','{"C":6,"H":6}'),
('KCl',  'Potassium chloride',null,      null, 'ionic',    'ionic',   'solid', '#10b981','{"K":1,"Cl":1}'),
('MgO',  'Magnesium oxide',null,         null, 'ionic',    'ionic',   'solid', '#84cc16','{"Mg":1,"O":1}'),
('Al2O3','Aluminum oxide', null,         null, 'ionic',    'ionic',   'solid', '#94a3b8','{"Al":2,"O":3}')
on conflict (formula) do nothing;

-- ── SEED: Common reactions ────────────────────────────────────────
insert into public.chem_reactions
  (equation,equation_plain,reactants,products,reaction_type,is_balanced,delta_h,conditions,description) values
('2H₂ + O₂ → 2H₂O',
 '2H2 + O2 -> 2H2O',
 '[{"formula":"H2","coeff":2,"name":"Hydrogen"},{"formula":"O2","coeff":1,"name":"Oxygen"}]',
 '[{"formula":"H2O","coeff":2,"name":"Water"}]',
 'combustion',true,-571.6,'ignition',
 'Combustion of hydrogen — formation of water'),

('CH₄ + 2O₂ → CO₂ + 2H₂O',
 'CH4 + 2O2 -> CO2 + 2H2O',
 '[{"formula":"CH4","coeff":1,"name":"Methane"},{"formula":"O2","coeff":2,"name":"Oxygen"}]',
 '[{"formula":"CO2","coeff":1,"name":"Carbon Dioxide"},{"formula":"H2O","coeff":2,"name":"Water"}]',
 'combustion',true,-890.3,'ignition',
 'Complete combustion of methane (natural gas)'),

('N₂ + 3H₂ → 2NH₃',
 'N2 + 3H2 -> 2NH3',
 '[{"formula":"N2","coeff":1,"name":"Nitrogen"},{"formula":"H2","coeff":3,"name":"Hydrogen"}]',
 '[{"formula":"NH3","coeff":2,"name":"Ammonia"}]',
 'combination',true,-92.0,'high pressure, Fe catalyst',
 'Haber process — industrial synthesis of ammonia'),

('2NaCl + 2H₂O → 2NaOH + Cl₂ + H₂',
 '2NaCl + 2H2O -> 2NaOH + Cl2 + H2',
 '[{"formula":"NaCl","coeff":2,"name":"Sodium Chloride"},{"formula":"H2O","coeff":2,"name":"Water"}]',
 '[{"formula":"NaOH","coeff":2,"name":"Sodium Hydroxide"},{"formula":"Cl2","coeff":1,"name":"Chlorine"},{"formula":"H2","coeff":1,"name":"Hydrogen"}]',
 'redox',true,null,'electrolysis',
 'Chlor-alkali process — electrolysis of brine')
on conflict do nothing;

-- ============================================================
-- DONE ✅
-- Tables: chem_elements (118), chem_molecules, chem_reactions,
--         chem_reaction_history
-- ============================================================
