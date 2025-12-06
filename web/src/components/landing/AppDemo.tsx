import appMockup from "@/assets/app-mockup.jpg";
import { CheckCircle2 } from "lucide-react";
import Image from "next/image";

const highlights = [
  "Personalized recipe recommendations",
  "Automatic nutrition tracking",
  "Smart meal plan adjustments",
  "One-click grocery ordering",
  "Progress tracking & badges",
];

const AppDemo = () => {
  return (
    <section className="bg-gradient-to-b from-white to-gray-50 py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* Text content */}
          <div className="order-2 lg:order-1">
            <h2 className="mb-6 text-4xl font-bold text-gray-900 md:text-5xl">
              Your Personal Nutrition Assistant
            </h2>
            <p className="mb-8 text-xl text-gray-600">
              Experience intelligent meal planning that adapts to your life. Track progress,
              discover new recipes, and achieve your health goals effortlessly.
            </p>

            <div className="flex flex-col gap-4">
              {highlights.map((highlight, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 flex-shrink-0 text-emerald-600" />
                  <span className="text-lg text-gray-900">{highlight}</span>
                </div>
              ))}
            </div>
          </div>

          {/* App mockup */}
          <div className="order-1 flex justify-center lg:order-2">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-200 to-orange-200 blur-xl" />
              <Image
                src={appMockup}
                alt="EpiCourier App Interface"
                className="hover-lift relative h-auto w-full max-w-md rounded-2xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AppDemo;
