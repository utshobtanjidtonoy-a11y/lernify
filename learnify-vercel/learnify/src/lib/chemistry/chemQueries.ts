import { createClient } from "@/lib/supabase/server";

export async function getElementsBySymbols(symbols: string[]) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("chem_elements")
    .select("*")
    .in("symbol", symbols);
  return data ?? [];
}

export async function getMoleculeByFormula(formula: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("chem_molecules")
    .select("*")
    .eq("formula", formula)
    .maybeSingle();
  return data;
}

export async function getMoleculesByFormulas(formulas: string[]) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("chem_molecules")
    .select("*")
    .in("formula", formulas);
  return data ?? [];
}

export async function saveReaction(reaction: {
  equation: string;
  equation_plain: string;
  reactants: object;
  products: object;
  reaction_type: string;
  is_balanced: boolean;
  created_by?: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("chem_reactions")
    .upsert({ ...reaction, updated_at: new Date().toISOString() }, { onConflict: "equation_plain" })
    .select()
    .single();
  if (error) return null;
  return data;
}

export async function getRecentReactions(userId: string, limit = 10) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("chem_reaction_history")
    .select("*, reaction:chem_reactions(*)")
    .eq("user_id", userId)
    .order("viewed_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function logReactionHistory(userId: string, equation: string, reactionId?: string) {
  const supabase = await createClient();
  await supabase.from("chem_reaction_history").insert({
    user_id: userId,
    equation,
    reaction_id: reactionId ?? null,
  });
}

export async function searchElements(query: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("chem_elements")
    .select("*")
    .or(`symbol.ilike.%${query}%,name.ilike.%${query}%`)
    .order("atomic_number")
    .limit(20);
  return data ?? [];
}

export async function getElementBySymbol(symbol: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("chem_elements")
    .select("*")
    .eq("symbol", symbol)
    .maybeSingle();
  return data;
}

export async function getAllElements() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("chem_elements")
    .select("*")
    .order("atomic_number");
  return data ?? [];
}
