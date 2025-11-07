import heroImage from "@/assets/hero-food.jpg";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

const Hero = () => {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 opacity-90" />

      {/* Hero image overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{ backgroundImage: `url(${heroImage.src})` }}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-20 text-center">
        <div className="animate-fade-in mb-8 inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/20 px-4 py-2 backdrop-blur-sm">
          <Sparkles className="h-4 w-4 text-white" />
          <span className="text-sm font-medium text-white">AI-Powered Nutrition Intelligence</span>
        </div>

        <h1 className="animate-fade-in mx-auto mb-6 max-w-4xl text-5xl leading-tight font-bold text-white md:text-7xl">
          Delivering Personalized Nutrition with Intelligence
        </h1>

        <p className="animate-fade-in mx-auto mb-10 max-w-2xl text-xl text-white/90 md:text-2xl">
          Smart meal planning that adapts to your lifestyle, preferences, and goals. Eat better,
          save time, and live sustainably.
        </p>

        <div className="animate-fade-in flex flex-col justify-center gap-4 sm:flex-row">
          <Link
            href="/signup"
            className="hover-lift flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-2 text-lg font-bold text-emerald-600 shadow-lg hover:bg-emerald-50"
          >
            <div>Start Your Smart Meal Journey</div>
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <Link
            href="https://youtu.be/R2pvrWlpgaU"
            className="hover-lift flex items-center justify-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 text-lg font-bold text-emerald-600 shadow-lg hover:bg-emerald-100"
          >
            Watch Demo
          </Link>
          <Link
            href="https://github.com/epicourier-team/Epicourier-Web/wiki/Get-Started-Guide"
            className="hover-lift flex items-center justify-center gap-2 rounded-lg bg-emerald-50 px-4 py-2 text-lg font-bold text-emerald-600 shadow-lg hover:bg-emerald-100"
          >
            Get Started
          </Link>
        </div>

        {/* Stats */}
        <div className="mx-auto mt-20 grid max-w-3xl grid-cols-1 gap-8 md:grid-cols-3">
          {[
            { value: "10k+", label: "Happy Users" },
            { value: "50k+", label: "Meals Planned" },
            { value: "95%", label: "Satisfaction Rate" },
          ].map((stat, index) => (
            <div key={index} className="animate-fade-in text-center">
              <div className="mb-2 text-4xl font-bold text-white">{stat.value}</div>
              <div className="text-white/80">{stat.label}</div>
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
