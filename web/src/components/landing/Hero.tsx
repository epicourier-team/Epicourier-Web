import heroImage from "@/assets/hero-food.jpg";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 opacity-90" />
      
      {/* Hero image overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${heroImage.src})` }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-8 animate-fade-in">
          <Sparkles className="w-4 h-4 text-white" />
          <span className="text-sm font-medium text-white">AI-Powered Nutrition Intelligence</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 animate-fade-in max-w-4xl mx-auto leading-tight">
          Delivering Personalized Nutrition with Intelligence
        </h1>
        
        <p className="text-xl md:text-2xl text-white/90 mb-10 max-w-2xl mx-auto animate-fade-in">
          Smart meal planning that adapts to your lifestyle, preferences, and goals. Eat better, save time, and live sustainably.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
          <Link href="/signup"
            className="bg-white hover:bg-emerald-50 text-emerald-600 shadow-lg hover-lift text-lg px-4 py-2 rounded-lg flex gap-2 items-center justify-center font-bold"
          >
            <div>Start Your Smart Meal Journey</div>
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <Button 
            size="lg" 
            variant="outline"
            className="border-2 border-white text-white hover:bg-white/10 backdrop-blur-sm text-lg px-8 py-6"
          >
            Watch Demo
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
          {[
            { value: "10k+", label: "Happy Users" },
            { value: "50k+", label: "Meals Planned" },
            { value: "95%", label: "Satisfaction Rate" }
          ].map((stat, index) => (
            <div key={index} className="text-center animate-fade-in">
              <div className="text-4xl font-bold text-white mb-2">{stat.value}</div>
              <div className="text-white/80">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
};

export default Hero;
