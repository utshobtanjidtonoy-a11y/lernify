import { createClient } from "@/lib/supabase/server";
import { getFormulaById } from "@/lib/database/formulaQueries";
import FormulaDetail from "@/components/formulas/FormulaDetail";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const formula = await getFormulaById(id);
  return { title: formula ? `${formula.title} — Learnify` : "Formula — Learnify" };
}

export default async function FormulaDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const formula = await getFormulaById(id, user?.id);
  if (!formula) notFound();

  return <FormulaDetail formula={formula} />;
}
