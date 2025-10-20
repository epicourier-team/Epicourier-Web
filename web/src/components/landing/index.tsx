import AppDemo from "@/components/landing/AppDemo";
import FAQ from "@/components/landing/FAQ";
import Features from "@/components/landing/Features";
import Footer from "@/components/landing/Footer";
import GreenScore from "@/components/landing/GreenScore";
import Hero from "@/components/landing/Hero";
import Modes from "@/components/landing/Modes";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <Features />
      <Modes />
      <AppDemo />
      <GreenScore />
      <FAQ />
      <Footer />
    </div>
  );
};

export default Index;
