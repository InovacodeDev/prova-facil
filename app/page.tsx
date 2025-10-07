import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Pricing } from "@/components/Pricing";
import { About } from "@/components/About";
import { Footer } from "@/components/Footer";

export default function HomePage() {
    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main>
                <Hero />
                <Features />
                <About />
                <Pricing />
            </main>
            <Footer />
        </div>
    );
}
