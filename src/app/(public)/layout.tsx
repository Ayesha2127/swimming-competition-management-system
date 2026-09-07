import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { auth } from "@/lib/auth";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <>
      <Header session={session} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
