import PremiumGate from "@/components/layout/PremiumGate";

export default function ProgresoLayout({ children }: { children: React.ReactNode }) {
  return <PremiumGate feature="progreso">{children}</PremiumGate>;
}
