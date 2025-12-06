import { Card, CardContent } from "@/components/ui/card";
import { Compass, Heart, Leaf } from "lucide-react";

const modes = [
  {
    icon: Heart,
    title: "Health Mode",
    description: "Focused on nutrition and balance",
    color: "bg-red-500",
    gradient: "from-red-500 to-pink-500",
  },
  {
    icon: Leaf,
    title: "Eco Mode",
    description: "Minimizes carbon footprint",
    color: "bg-emerald-600",
    gradient: "from-emerald-600 to-green-600",
  },
  {
    icon: Compass,
    title: "Explore Mode",
    description: "Discover new cuisines and creative recipes",
    color: "bg-orange-500",
    gradient: "from-orange-500 to-yellow-500",
  },
];

const Modes = () => {
  return (
    <section className="bg-white py-24">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            Three Ways to Eat Your Way
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-gray-600">
            Choose the mode that fits your current goals and lifestyle
          </p>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-3">
          {modes.map((mode, index) => (
            <Card
              key={index}
              className="hover-lift group relative overflow-hidden border-2 border-gray-200 transition-all duration-400 hover:shadow-xl"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${mode.gradient} opacity-0 transition-all duration-400 group-hover:opacity-10`}
              />
              {mode.title === "Eco Mode" && (
                <span className="absolute top-4 right-4 z-20 rounded-full border border-amber-100 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                  Coming soon
                </span>
              )}
              <CardContent className="relative z-10 p-8 text-center">
                <div
                  className={`h-16 w-16 rounded-full ${mode.color} mx-auto mb-6 flex items-center justify-center transition-all duration-400 group-hover:scale-110`}
                >
                  <mode.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="mb-3 text-2xl font-bold text-gray-900">{mode.title}</h3>
                <p className="text-lg text-gray-600">{mode.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Modes;
