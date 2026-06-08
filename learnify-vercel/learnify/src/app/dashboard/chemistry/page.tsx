import ChemistryEngineClient from "@/components/chemistry/ChemistryEngineClient";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Chemistry Engine — Learnify" };

export default function ChemistryEnginePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
          🧪 Chemistry Engine
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Parse any reaction, visualize bonds & geometry, explore electron configurations, and get AI explanations.
        </p>
      </div>
      <ChemistryEngineClient />
    </div>
  );
}
