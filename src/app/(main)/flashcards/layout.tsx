import PremiumGate from "@/components/layout/PremiumGate";

export default function FlashcardsLayout({ children }: { children: React.ReactNode }) {
  return <PremiumGate feature="flashcards">{children}</PremiumGate>;
}
