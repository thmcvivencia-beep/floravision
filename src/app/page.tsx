import FroApp from "@/components/flora-vision-app";
import Copyright from "@/components/copyright";

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground p-4 md:p-8 font-body">
      <div className="max-w-3xl mx-auto">
        <header className="text-center mb-12">
          {/* O título agora faz parte do card do componente para melhor agrupamento */}
        </header>
        <FroApp />
        <footer className="text-center mt-12 text-muted-foreground">
          <Copyright />
        </footer>
      </div>
    </main>
  );
}
