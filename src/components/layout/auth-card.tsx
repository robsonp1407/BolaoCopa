type AuthCardProps = {
  title: string;
  description: string;
  children: React.ReactNode;
};

export function AuthCard({ title, description, children }: AuthCardProps) {
  return (
    <main className="mx-auto grid min-h-[calc(100vh-73px)] max-w-md content-center px-4 py-10">
      <section className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-ink">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-stone-600">{description}</p>
        <div className="mt-6">{children}</div>
      </section>
    </main>
  );
}
