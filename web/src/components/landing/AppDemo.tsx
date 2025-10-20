import appMockup from "@/assets/app-mockup.jpg";
import { CheckCircle2 } from "lucide-react";
import Image from "next/image";

const highlights = [
  "Personalized recipe recommendations",
  "Automatic nutrition tracking",
  "Smart meal plan adjustments",
  "One-click grocery ordering",
  "Progress tracking & badges"
];

const AppDemo = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Text content */}
          <div className="order-2 lg:order-1">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Your Personal Nutrition Assistant
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Experience intelligent meal planning that adapts to your life. Track progress, discover new recipes, and achieve your health goals effortlessly.
            </p>
            
            <div className="flex flex-col gap-4">
              {highlights.map((highlight, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 flex-shrink-0" />
                  <span className="text-lg text-gray-900">{highlight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* App mockup */}
          <div className="order-1 lg:order-2 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-200 to-orange-200 blur-xl" />
              <Image 
                src={appMockup} 
                alt="Epicourier App Interface" 
                className="relative rounded-2xl shadow-2xl hover-lift max-w-md w-full h-120" 
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppDemo;
