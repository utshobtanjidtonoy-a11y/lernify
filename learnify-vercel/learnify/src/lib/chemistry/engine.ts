// ============================================================
// LEARNIFY — CHEMISTRY ENGINE
// Pure TypeScript — no hardcoded reactions
// ============================================================

export interface ParsedAtom {
  symbol: string;
  count: number;
}

export interface ParsedMolecule {
  formula: string;
  coefficient: number;
  atoms: ParsedAtom[];
  atomMap: Record<string, number>; // {H:2, O:1}
}

export interface ParsedReaction {
  raw: string;
  reactants: ParsedMolecule[];
  products: ParsedMolecule[];
  isBalanced: boolean;
  atomBalance: Record<string, { left: number; right: number; balanced: boolean }>;
  reactionType: ReactionType;
  oxidationChanges: OxidationChange[];
  bondingType: BondingType;
}

export type ReactionType =
  | "combination"
  | "decomposition"
  | "single_displacement"
  | "double_displacement"
  | "combustion"
  | "acid_base"
  | "redox"
  | "precipitation"
  | "unknown";

export type BondingType = "ionic" | "covalent" | "metallic" | "coordinate" | "mixed";

export interface OxidationChange {
  element: string;
  before: number | null;
  after: number | null;
  change: number | null;
  role: "oxidized" | "reduced" | "unchanged" | "unknown";
}

export interface ElectronConfig {
  atomicNumber: number;
  symbol: string;
  fullConfig: string;         // "1s² 2s² 2p⁶ 3s¹"
  shortConfig: string;        // "[Ne] 3s¹"
  shells: ShellConfig[];
  valenceElectrons: number;
  block: "s" | "p" | "d" | "f";
}

export interface ShellConfig {
  shell: number;              // 1, 2, 3 ...
  subshells: SubshellConfig[];
}

export interface SubshellConfig {
  subshell: string;           // "1s", "2p" ...
  electrons: number;
  capacity: number;
  orbitals: OrbitalConfig[];
}

export interface OrbitalConfig {
  name: string;               // "1s", "2px", "2py" ...
  electrons: 0 | 1 | 2;
  type: "s" | "p" | "d" | "f";
}

// ── Aufbau filling order ─────────────────────────────────────────
const AUFBAU: Array<[number, string, number]> = [
  [1,"s",2],[2,"s",2],[2,"p",6],[3,"s",2],[3,"p",6],[4,"s",2],
  [3,"d",10],[4,"p",6],[5,"s",2],[4,"d",10],[5,"p",6],[6,"s",2],
  [4,"f",14],[5,"d",10],[6,"p",6],[7,"s",2],[5,"f",14],[6,"d",10],[7,"p",6],
];

// Noble-gas cores for shorthand notation
const NOBLE_CORES: Array<{ symbol: string; z: number; config: string }> = [
  { symbol: "He", z: 2,  config: "1s²" },
  { symbol: "Ne", z: 10, config: "1s² 2s² 2p⁶" },
  { symbol: "Ar", z: 18, config: "1s² 2s² 2p⁶ 3s² 3p⁶" },
  { symbol: "Kr", z: 36, config: "1s² 2s² 2p⁶ 3s² 3p⁶ 3d¹⁰ 4s² 4p⁶" },
  { symbol: "Xe", z: 54, config: "1s² 2s² 2p⁶ 3s² 3p⁶ 3d¹⁰ 4s² 4p⁶ 4d¹⁰ 5s² 5p⁶" },
  { symbol: "Rn", z: 86, config: "1s² 2s² 2p⁶ 3s² 3p⁶ 3d¹⁰ 4s² 4p⁶ 4d¹⁰ 4f¹⁴ 5s² 5p⁶ 5d¹⁰ 6s² 6p⁶" },
];

const SUPERSCRIPTS: Record<string, string> = {
  "0":"⁰","1":"¹","2":"²","3":"³","4":"⁴","5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹",
};
const toSup = (n: number) => String(n).split("").map(c => SUPERSCRIPTS[c] ?? c).join("");

// ── Exceptions to Aufbau (real configurations) ───────────────────
const AUFBAU_EXCEPTIONS: Record<number, string> = {
  24: "1s² 2s² 2p⁶ 3s² 3p⁶ 3d⁵ 4s¹",   // Cr
  29: "1s² 2s² 2p⁶ 3s² 3p⁶ 3d¹⁰ 4s¹",  // Cu
  41: "1s² 2s² 2p⁶ 3s² 3p⁶ 3d¹⁰ 4s² 4p⁶ 4d⁴ 5s¹",  // Nb
  42: "1s² 2s² 2p⁶ 3s² 3p⁶ 3d¹⁰ 4s² 4p⁶ 4d⁵ 5s¹",  // Mo
  47: "1s² 2s² 2p⁶ 3s² 3p⁶ 3d¹⁰ 4s² 4p⁶ 4d¹⁰ 5s¹", // Ag
  79: "1s² 2s² 2p⁶ 3s² 3p⁶ 3d¹⁰ 4s² 4p⁶ 4d¹⁰ 4f¹⁴ 5s² 5p⁶ 5d¹⁰ 6s¹", // Au
};

// ============================================================
// ELECTRON CONFIGURATION ENGINE
// ============================================================
export function generateElectronConfig(atomicNumber: number, symbol: string = "?"): ElectronConfig {
  if (AUFBAU_EXCEPTIONS[atomicNumber]) {
    return parseConfigString(atomicNumber, symbol, AUFBAU_EXCEPTIONS[atomicNumber]);
  }

  let remaining = atomicNumber;
  const subshells: Array<{ n: number; l: string; e: number }> = [];

  for (const [n, l, cap] of AUFBAU) {
    if (remaining <= 0) break;
    const e = Math.min(remaining, cap);
    subshells.push({ n, l, e });
    remaining -= e;
  }

  const fullConfig = subshells
    .map(s => `${s.n}${s.l}${toSup(s.e)}`)
    .join(" ");

  return parseConfigString(atomicNumber, symbol, fullConfig);
}

function parseConfigString(atomicNumber: number, symbol: string, fullConfig: string): ElectronConfig {
  // Find best noble-gas core for shorthand
  let shortConfig = fullConfig;
  let coreZ = 0;
  for (const core of [...NOBLE_CORES].reverse()) {
    if (atomicNumber > core.z) {
      // Build remaining config after core
      let remaining = atomicNumber;
      let afterCore = "";
      for (const [n, l, cap] of AUFBAU) {
        if (remaining <= 0) break;
        const e = Math.min(remaining, cap);
        remaining -= e;
        // Only include if beyond core
        if (atomicNumber - remaining + e > core.z || remaining < 0) {
          const included = Math.min(e, atomicNumber - core.z);
          if (included > 0) afterCore += ` ${n}${l}${toSup(included)}`;
        }
      }
      shortConfig = `[${core.symbol}]${afterCore}`;
      coreZ = core.z;
      break;
    }
  }

  // Parse subshell tokens: "1s²" → {subshell:"1s", n:1, l:"s", e:2}
  const tokens = fullConfig.split(" ").map(t => {
    const m = t.match(/^(\d+)([spdf])(.+)$/);
    if (!m) return null;
    const n = parseInt(m[1]);
    const l = m[2] as "s"|"p"|"d"|"f";
    const e = parseInt(m[3].replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => String("⁰¹²³⁴⁵⁶⁷⁸⁹".indexOf(c))));
    return { n, l, e, label: `${n}${l}` };
  }).filter(Boolean) as Array<{ n: number; l: string; e: number; label: string }>;

  // Build shells
  const shellMap = new Map<number, SubshellConfig[]>();
  for (const tok of tokens) {
    if (!shellMap.has(tok.n)) shellMap.set(tok.n, []);
    const cap = tok.l === "s" ? 2 : tok.l === "p" ? 6 : tok.l === "d" ? 10 : 14;
    const numOrbitals = cap / 2;
    const orbitals: OrbitalConfig[] = buildOrbitals(tok.label, tok.l as "s"|"p"|"d"|"f", tok.e);
    shellMap.get(tok.n)!.push({
      subshell: tok.label,
      electrons: tok.e,
      capacity: cap,
      orbitals,
    });
  }

  const shells: ShellConfig[] = Array.from(shellMap.entries())
    .sort(([a],[b]) => a-b)
    .map(([shell, subshells]) => ({ shell, subshells }));

  // Valence electrons = electrons in highest n shell (+ f-block special)
  const maxN = Math.max(...tokens.map(t => t.n));
  const valence = tokens
    .filter(t => t.n === maxN || (t.l === "d" && t.n === maxN - 1))
    .reduce((s, t) => s + t.e, 0);

  // Block = last subshell type
  const lastToken = tokens[tokens.length - 1];
  const block = (lastToken?.l ?? "s") as "s"|"p"|"d"|"f";

  return { atomicNumber, symbol, fullConfig, shortConfig, shells, valenceElectrons: valence, block };
}

function buildOrbitals(label: string, type: "s"|"p"|"d"|"f", electrons: number): OrbitalConfig[] {
  const suffixes: Record<string, string[]> = {
    s: [""],
    p: ["x","y","z"],
    d: ["z²","xz","yz","x²-y²","xy"],
    f: ["z³","xz²","yz²","z(x²-y²)","xyz","x(x²-3y²)","y(3x²-y²)"],
  };
  const suf = suffixes[type] ?? [""];
  const orbitals: OrbitalConfig[] = suf.map(s => ({
    name: `${label}${s}`,
    electrons: 0 as 0|1|2,
    type,
  }));

  // Fill by Hund's rule: half-fill first, then pair
  let remaining = electrons;
  // First pass: one electron each
  for (let i = 0; i < orbitals.length && remaining > 0; i++) {
    orbitals[i].electrons = 1;
    remaining--;
  }
  // Second pass: pair
  for (let i = 0; i < orbitals.length && remaining > 0; i++) {
    orbitals[i].electrons = 2;
    remaining--;
  }

  return orbitals;
}

// ============================================================
// FORMULA PARSER
// ============================================================
export function parseFormula(formula: string): Record<string, number> {
  const atomMap: Record<string, number> = {};
  // Remove Unicode arrows, subscripts normalisation
  const clean = formula.trim();

  function parseGroup(str: string, start: number): [Record<string, number>, number] {
    const result: Record<string, number> = {};
    let i = start;
    while (i < str.length) {
      if (str[i] === ")") { i++; break; }
      if (str[i] === "(") {
        const [inner, end] = parseGroup(str, i + 1);
        i = end;
        // Read multiplier
        let numStr = "";
        while (i < str.length && /\d/.test(str[i])) { numStr += str[i]; i++; }
        const mult = numStr ? parseInt(numStr) : 1;
        for (const [el, cnt] of Object.entries(inner)) {
          result[el] = (result[el] ?? 0) + cnt * mult;
        }
      } else if (/[A-Z]/.test(str[i])) {
        let el = str[i]; i++;
        while (i < str.length && /[a-z]/.test(str[i])) { el += str[i]; i++; }
        let numStr = "";
        while (i < str.length && /\d/.test(str[i])) { numStr += str[i]; i++; }
        const cnt = numStr ? parseInt(numStr) : 1;
        result[el] = (result[el] ?? 0) + cnt;
      } else {
        i++;
      }
    }
    return [result, i];
  }

  const [atoms] = parseGroup(clean, 0);
  return atoms;
}

// ============================================================
// REACTION PARSER
// ============================================================
export function parseReaction(input: string): ParsedReaction {
  // Normalise arrow variants: →, ->, ⟶, =
  const normalised = input
    .replace(/[→⟶=>]+/g, "->")
    .replace(/\u2192/g, "->")
    .trim();

  const arrowIdx = normalised.indexOf("->");
  if (arrowIdx === -1) {
    return emptyReaction(input, "Could not find reaction arrow (→)");
  }

  const leftSide  = normalised.slice(0, arrowIdx).trim();
  const rightSide = normalised.slice(arrowIdx + 2).trim();

  const reactants = parseSide(leftSide);
  const products  = parseSide(rightSide);

  const atomBalance = checkBalance(reactants, products);
  const isBalanced  = Object.values(atomBalance).every(v => v.balanced);
  const reactionType = classifyReaction(reactants, products);
  const oxidationChanges = detectOxidationChanges(reactants, products);
  const bondingType = determineBondingType(reactants, products);

  return {
    raw: input,
    reactants,
    products,
    isBalanced,
    atomBalance,
    reactionType,
    oxidationChanges,
    bondingType,
  };
}

function parseSide(side: string): ParsedMolecule[] {
  // Split by " + " but not inside parentheses
  const parts: string[] = [];
  let depth = 0, current = "";
  for (let i = 0; i < side.length; i++) {
    if (side[i] === "(") depth++;
    else if (side[i] === ")") depth--;
    else if (side[i] === "+" && depth === 0) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += side[i];
  }
  parts.push(current.trim());

  return parts.map(part => {
    const m = part.match(/^(\d*\.?\d*)\s*([A-Za-z0-9()[\]{}]+)$/);
    const coeff = m && m[1] ? parseFloat(m[1]) : 1;
    const formula = m ? m[2] : part;
    const atomMap = parseFormula(formula);
    // Scale by coefficient
    const scaledMap: Record<string,number> = {};
    for (const [el, cnt] of Object.entries(atomMap)) scaledMap[el] = cnt * coeff;
    const atoms: ParsedAtom[] = Object.entries(atomMap).map(([symbol, count]) => ({ symbol, count }));
    return { formula, coefficient: coeff, atoms, atomMap };
  });
}

function checkBalance(
  reactants: ParsedMolecule[],
  products: ParsedMolecule[]
): Record<string, { left: number; right: number; balanced: boolean }> {
  const leftTotals: Record<string, number> = {};
  const rightTotals: Record<string, number> = {};

  for (const mol of reactants) {
    for (const [el, cnt] of Object.entries(mol.atomMap)) {
      leftTotals[el] = (leftTotals[el] ?? 0) + cnt * mol.coefficient;
    }
  }
  for (const mol of products) {
    for (const [el, cnt] of Object.entries(mol.atomMap)) {
      rightTotals[el] = (rightTotals[el] ?? 0) + cnt * mol.coefficient;
    }
  }

  const allElements = new Set([...Object.keys(leftTotals), ...Object.keys(rightTotals)]);
  const result: Record<string, { left: number; right: number; balanced: boolean }> = {};
  for (const el of allElements) {
    const left  = leftTotals[el]  ?? 0;
    const right = rightTotals[el] ?? 0;
    result[el] = { left, right, balanced: left === right };
  }
  return result;
}

// ── Reaction type classifier ─────────────────────────────────────
function classifyReaction(reactants: ParsedMolecule[], products: ParsedMolecule[]): ReactionType {
  const rCount = reactants.length;
  const pCount = products.length;
  const rFormulas = reactants.map(r => r.formula.toLowerCase());
  const pFormulas = products.map(p => p.formula.toLowerCase());

  // Combustion: contains O2 as reactant, produces CO2 or H2O
  const hasO2 = rFormulas.includes("o2");
  const makesCO2 = pFormulas.includes("co2");
  const makesH2O = pFormulas.some(f => f === "h2o");
  if (hasO2 && (makesCO2 || makesH2O)) return "combustion";

  // Combination: 2 reactants → 1 product
  if (rCount >= 2 && pCount === 1) return "combination";

  // Decomposition: 1 reactant → 2+ products
  if (rCount === 1 && pCount >= 2) return "decomposition";

  // Check for single displacement (one element + compound → different element + compound)
  const rElements = reactants.filter(r => Object.keys(r.atomMap).length === 1);
  const pElements = products.filter(p => Object.keys(p.atomMap).length === 1);
  if (rElements.length >= 1 && pElements.length >= 1 &&
      JSON.stringify(rElements.map(e=>Object.keys(e.atomMap)[0]).sort()) !==
      JSON.stringify(pElements.map(e=>Object.keys(e.atomMap)[0]).sort())) {
    return "single_displacement";
  }

  // Double displacement (2 compounds → 2 different compounds)
  if (rCount === 2 && pCount === 2) return "double_displacement";

  // Detect acid-base: reactant contains H, product contains OH or water
  const hasAcid = reactants.some(r => r.atomMap["H"] && Object.keys(r.atomMap).length > 1);
  const hasBase = reactants.some(r => r.atomMap["O"] && r.atomMap["H"]);
  if (hasAcid && hasBase) return "acid_base";

  return "unknown";
}

// ── Oxidation state detector ─────────────────────────────────────
// Common rules-based approach
const COMMON_OS: Record<string, number> = {
  H: 1, O: -2, F: -1, Na: 1, K: 1, Li: 1, Ca: 2, Mg: 2,
  Al: 3, Cl: -1, Br: -1, I: -1,
};

function guessOxidationState(el: string, formula: string): number | null {
  if (COMMON_OS[el] !== undefined) return COMMON_OS[el];
  // For elemental form
  const atomMap = parseFormula(formula);
  if (Object.keys(atomMap).length === 1) return 0;
  return null;
}

function detectOxidationChanges(
  reactants: ParsedMolecule[],
  products: ParsedMolecule[]
): OxidationChange[] {
  const changes: OxidationChange[] = [];
  const allElements = new Set<string>();
  [...reactants, ...products].forEach(m => Object.keys(m.atomMap).forEach(el => allElements.add(el)));

  for (const el of allElements) {
    const rMol = reactants.find(r => r.atomMap[el]);
    const pMol = products.find(p => p.atomMap[el]);
    const before = rMol ? guessOxidationState(el, rMol.formula) : null;
    const after  = pMol ? guessOxidationState(el, pMol.formula)  : null;
    const change = before !== null && after !== null ? after - before : null;
    const role: OxidationChange["role"] =
      change === null ? "unknown" :
      change > 0 ? "oxidized" :
      change < 0 ? "reduced" : "unchanged";
    changes.push({ element: el, before, after, change, role });
  }
  return changes;
}

// ── Bonding type detector ────────────────────────────────────────
const METALS = new Set([
  "Li","Na","K","Rb","Cs","Fr","Be","Mg","Ca","Sr","Ba","Ra",
  "Al","Ga","In","Tl","Sn","Pb","Bi","Fe","Cu","Zn","Ag","Au",
  "Ni","Co","Cr","Mn","Ti","V","W","Mo","Pt","Pd","Rh","Ir",
]);
const NONMETALS = new Set(["H","C","N","O","F","P","S","Cl","Se","Br","I","At"]);

function determineBondingType(
  reactants: ParsedMolecule[],
  products: ParsedMolecule[]
): BondingType {
  const allFormulas = [...reactants, ...products].map(m => m.formula);
  let hasIonic = false, hasCovalent = false, hasMetallic = false;

  for (const mol of [...reactants, ...products]) {
    const elements = Object.keys(mol.atomMap);
    if (elements.length === 1 && METALS.has(elements[0])) { hasMetallic = true; continue; }
    const hasMetal    = elements.some(e => METALS.has(e));
    const hasNonmetal = elements.some(e => NONMETALS.has(e));
    if (hasMetal && hasNonmetal) { hasIonic = true; }
    else if (!hasMetal && hasNonmetal) { hasCovalent = true; }
  }

  if (hasIonic && hasCovalent) return "mixed";
  if (hasIonic) return "ionic";
  if (hasCovalent) return "covalent";
  if (hasMetallic) return "metallic";
  return "covalent";
}

function emptyReaction(input: string, _error: string): ParsedReaction {
  return {
    raw: input,
    reactants: [], products: [],
    isBalanced: false,
    atomBalance: {},
    reactionType: "unknown",
    oxidationChanges: [],
    bondingType: "covalent",
  };
}

// ============================================================
// REACTION TYPE DESCRIPTIONS
// ============================================================
export const REACTION_TYPE_INFO: Record<ReactionType, { label: string; color: string; description: string }> = {
  combination:          { label: "Combination",          color: "#3b82f6", description: "Two or more substances combine to form a single product." },
  decomposition:        { label: "Decomposition",        color: "#8b5cf6", description: "A single compound breaks down into two or more substances." },
  single_displacement:  { label: "Single Displacement",  color: "#f59e0b", description: "A more reactive element displaces a less reactive one from a compound." },
  double_displacement:  { label: "Double Displacement",  color: "#ec4899", description: "Two compounds exchange ions to form two new compounds." },
  combustion:           { label: "Combustion",           color: "#ef4444", description: "Rapid reaction with oxygen, producing CO₂ and/or H₂O and releasing heat." },
  acid_base:            { label: "Acid-Base",            color: "#10b981", description: "Neutralisation reaction between an acid and a base." },
  redox:                { label: "Redox",                color: "#f97316", description: "Involves transfer of electrons between species — oxidation and reduction." },
  precipitation:        { label: "Precipitation",        color: "#06b6d4", description: "Two soluble compounds react to form an insoluble precipitate." },
  unknown:              { label: "Unknown",              color: "#94a3b8", description: "Reaction type could not be determined automatically." },
};

// ============================================================
// GEOMETRY DATA
// ============================================================
export interface MolecularGeometry {
  name: string;
  bondAngle: string;
  electronPairs: number;
  bondingPairs: number;
  description: string;
  examples: string[];
}

export const GEOMETRIES: Record<string, MolecularGeometry> = {
  linear:                { name: "Linear",                bondAngle: "180°",         electronPairs: 2, bondingPairs: 2, description: "Atoms arranged in a straight line.", examples: ["CO₂","BeCl₂","C₂H₂"] },
  bent:                  { name: "Bent / Angular",        bondAngle: "104.5°–120°",  electronPairs: 4, bondingPairs: 2, description: "Two bonded atoms + lone pairs bend the shape.", examples: ["H₂O","SO₂","H₂S"] },
  trigonal_planar:       { name: "Trigonal Planar",       bondAngle: "120°",         electronPairs: 3, bondingPairs: 3, description: "Three bonds in a flat triangle.", examples: ["BF₃","SO₃","NO₃⁻"] },
  trigonal_pyramidal:    { name: "Trigonal Pyramidal",    bondAngle: "107°",         electronPairs: 4, bondingPairs: 3, description: "Three bonds + lone pair form a pyramid.", examples: ["NH₃","PH₃","PCl₃"] },
  tetrahedral:           { name: "Tetrahedral",           bondAngle: "109.5°",       electronPairs: 4, bondingPairs: 4, description: "Four bonds pointing to corners of a tetrahedron.", examples: ["CH₄","CCl₄","SiO₄⁴⁻"] },
  trigonal_bipyramidal:  { name: "Trigonal Bipyramidal",  bondAngle: "90°/120°",     electronPairs: 5, bondingPairs: 5, description: "Five bonds — three equatorial, two axial.", examples: ["PCl₅","PF₅","AsF₅"] },
  octahedral:            { name: "Octahedral",            bondAngle: "90°",          electronPairs: 6, bondingPairs: 6, description: "Six bonds pointing to corners of an octahedron.", examples: ["SF₆","Mo(CO)₆","PF₆⁻"] },
  square_planar:         { name: "Square Planar",         bondAngle: "90°",          electronPairs: 6, bondingPairs: 4, description: "Four bonds in a square plane, two lone pairs.", examples: ["XeF₄","PtCl₄²⁻","IF₄⁻"] },
  see_saw:               { name: "See-Saw",               bondAngle: "173°/101°",    electronPairs: 5, bondingPairs: 4, description: "Four bonds with one equatorial lone pair.", examples: ["SF₄","XeO₂F₂"] },
  t_shaped:              { name: "T-Shaped",              bondAngle: "90°/180°",     electronPairs: 5, bondingPairs: 3, description: "Three bonds with two equatorial lone pairs.", examples: ["ClF₃","BrF₃"] },
};

// ── Infer geometry from molecule formula ─────────────────────────
export function inferGeometry(atomMap: Record<string, number>): string {
  const total = Object.values(atomMap).reduce((a, b) => a + b, 0);
  // Central atom is the non-H, non-O atom if present, else first unique
  const central = Object.entries(atomMap).find(([el]) => el !== "H")?.[0] ?? Object.keys(atomMap)[0];
  const bonded = total - 1; // rough: all others bonded to central

  if (total === 2) return "linear";
  if (total === 3) {
    if (atomMap["O"] === 2) return "bent"; // SO2, H2O-like
    return "trigonal_planar";
  }
  if (total === 4) {
    if (atomMap["H"] === 3) return "trigonal_pyramidal"; // NH3
    if (atomMap["H"] === 2) return "bent"; // H2O
    return "tetrahedral";
  }
  if (total === 5) return "trigonal_bipyramidal";
  if (total === 6) return "octahedral";
  if (total === 7) return "octahedral";
  return "tetrahedral";
}
