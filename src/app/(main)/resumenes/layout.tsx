import PremiumGate from "@/components/layout/PremiumGate";

export default function ResumenesLayout({ children }: { children: React.ReactNode }) {
  return <PremiumGate feature="resumenes">{children}</PremiumGate>;
}
