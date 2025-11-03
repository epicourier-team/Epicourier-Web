import { Card, CardContent } from "@/components/ui/card";
import { Compass, Heart, Leaf } from "lucide-react";

const modes = [
  {
    icon: Heart,
    title: "Health Mode",
    description: "Focused on nutrition and balance",
    color: "bg-red-500",
    gradient: "from-red-500 to-pink-500"
  },
  {
    icon: Leaf,
    title: "Eco Mode",
    description: "Minimizes carbon footprint",
    color: "bg-emerald-600",
    gradient: "from-emerald-600 to-green-600"
  },
  {
    icon: Compass,
    title: "Explore Mode",
    description: "Discover new cuisines and creative recipes",
    color: "bg-orange-500",
    gradient: "from-orange-500 to-yellow-500"
  }
];

const Modes = () => {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Three Ways to Eat Your Way
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the mode that fits your current goals and lifestyle
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {modes.map((mode, index) => (
            <Card 
              key={index}
              className="relative overflow-hidden border-2 border-gray-200 hover:shadow-xl transition-all duration-400 hover-lift group"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${mode.gradient} opacity-0 group-hover:opacity-10 transition-all duration-400`} />
              {mode.title === "Eco Mode" && (
                <span className="absolute top-4 right-4 bg-amber-50 text-amber-700 text-xs font-semibold px-2 py-1 rounded-full border border-amber-100 z-20">
                  Coming soon
                </span>
              )}
              <CardContent className="p-8 text-center relative z-10">
                <div className={`w-16 h-16 rounded-full ${mode.color} flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-all duration-400`}>
                  <mode.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-gray-900">{mode.title}</h3>
                <p className="text-gray-600 text-lg">{mode.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Modes;
