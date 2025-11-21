import { Card, CardContent } from "@/components/ui/card";
import {
  Award,
  Brain,
  Calendar,
  Leaf,
  ShoppingCart,
  Shuffle,
  TrendingUp,
  UtensilsCrossed,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Smart Recipe Recommendations",
    description: "Personalized meal ideas based on preferences, weather, time, and goals",
  },
  {
    icon: TrendingUp,
    title: "Monthly Nutrient Summary",
    description: "Automatic diet analysis with easy-to-read nutrition insights",
  },
  {
    icon: Calendar,
    title: "Progress Calendar",
    description: "Track daily meals, habits, and goals with a to-do-style dashboard",
  },
  {
    icon: Shuffle,
    title: "Dynamic Meal Planner",
    description: "Automatically adjusts plans if meals are skipped or changed",
  },
  {
    icon: Award,
    title: "Gamified Challenges",
    description: "Earn badges for healthy milestones and eco-friendly choices",
  },
  {
    icon: UtensilsCrossed,
    title: "Taste Profile Builder",
    description: "Learns your flavor preferences to improve recommendations",
  },
  {
    icon: Leaf,
    title: "Green Score",
    description: "Measure and improve environmental impact through meal choices",
  },
  {
    icon: ShoppingCart,
    title: "Smart Cart",
    description: "One-click ingredient ordering with exact weekly quantities",
  },
  // {
  //   icon: MessageCircle,
  //   title: "AI Chatbot Assistant",
  //   description: "Instant help on meal plans, nutrition data, and app usage"
  // }
];

const Features = () => {
  return (
    <section className="bg-gradient-to-b from-white to-gray-50 py-24">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            Everything You Need to Eat Smarter
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-gray-600">
            Powerful features that work together to make meal planning effortless and enjoyable
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:flex lg:flex-wrap lg:justify-center lg:gap-6">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="hover-lift relative w-full border-gray-200 bg-white transition-all duration-300 hover:shadow-md lg:max-w-[380px] lg:basis-1/3"
            >
              {/* Coming soon badge for specific features */}
              {["Gamified Challenges", "Green Score", "Smart Cart"].includes(feature.title) && (
                <span className="absolute top-4 right-4 rounded-full border border-amber-100 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                  Coming soon
                </span>
              )}
              <CardContent className="p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                  <feature.icon className="h-6 w-6 text-emerald-600" />
                </div>
                <h3 className="mb-2 text-xl font-semibold text-gray-900">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
