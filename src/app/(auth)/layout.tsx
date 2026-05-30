export const dynamic = "force-dynamic";
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center p-6 bg-gradient-to-br from-[var(--primary)] to-[var(--primary-dark)]">
      {children}
    </main>
  );
}
