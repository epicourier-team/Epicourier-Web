import heroImage from "@/assets/hero-food.jpg";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

const Hero = () => {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background gradient - Softened */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/90 via-teal-600/80 to-cyan-600/70" />

      {/* Hero image overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20 mix-blend-overlay"
        style={{ backgroundImage: `url(${heroImage.src})` }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20 text-center">
        <div className="animate-fade-in mb-8 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 backdrop-blur-md transition-all hover:bg-white/20">
          <Sparkles className="h-4 w-4 text-emerald-100" />
          <span className="text-sm font-medium text-emerald-50">AI-Powered Nutrition Intelligence</span>
        </div>

        <h1 className="animate-fade-in mx-auto mb-6 max-w-4xl text-5xl leading-tight font-bold text-white tracking-tight md:text-7xl drop-shadow-sm">
          Delivering Personalized Nutrition with Intelligence
        </h1>

        <p className="animate-fade-in mx-auto mb-10 max-w-2xl text-xl text-emerald-50/90 md:text-2xl font-light leading-relaxed">
          Smart meal planning that adapts to your lifestyle, preferences, and goals. Eat better,
          save time, and live sustainably.
        </p>

        <div className="animate-fade-in flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/signup"
            className="group flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-lg font-bold text-emerald-700 shadow-xl transition-all hover:scale-105 hover:shadow-2xl hover:bg-emerald-50 active:scale-95"
          >
            <span>Start Your Journey</span>
            <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="https://youtu.be/QW4FuDJqLx0"
            className="flex items-center justify-center gap-2 rounded-full border-2 border-white/30 bg-white/10 px-8 py-4 text-lg font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20 hover:border-white/50"
          >
            Watch Demo
          </Link>
        </div>

        {/* Stats */}
        <div className="mx-auto mt-24 grid max-w-3xl grid-cols-1 gap-8 md:grid-cols-3 border-t border-white/10 pt-12">
          {[
            { value: "10k+", label: "Happy Users" },
            { value: "50k+", label: "Meals Planned" },
            { value: "95%", label: "Satisfaction Rate" },
          ].map((stat, index) => (
            <div key={index} className="animate-fade-in text-center">
              <div className="mb-1 text-4xl font-bold text-white tracking-tight">{stat.value}</div>
              <div className="text-emerald-100/80 font-medium">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Decorative elements */}
      <div className="absolute right-0 bottom-0 left-0 h-32 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
};

export default Hero;
