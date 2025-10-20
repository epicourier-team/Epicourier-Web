import { Card, CardContent } from "@/components/ui/card";
import { Award, Brain, Calendar, Leaf, MessageCircle, ShoppingCart, Shuffle, TrendingUp, UtensilsCrossed } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "Smart Recipe Recommendations",
    description: "Personalized meal ideas based on preferences, weather, time, and goals"
  },
  {
    icon: TrendingUp,
    title: "Monthly Nutrient Summary",
    description: "Automatic diet analysis with easy-to-read nutrition insights"
  },
  {
    icon: Calendar,
    title: "Progress Calendar",
    description: "Track daily meals, habits, and goals with a to-do-style dashboard"
  },
  {
    icon: Shuffle,
    title: "Dynamic Meal Planner",
    description: "Automatically adjusts plans if meals are skipped or changed"
  },
  {
    icon: Award,
    title: "Gamified Challenges",
    description: "Earn badges for healthy milestones and eco-friendly choices"
  },
  {
    icon: UtensilsCrossed,
    title: "Taste Profile Builder",
    description: "Learns your flavor preferences to improve recommendations"
  },
  {
    icon: Leaf,
    title: "Green Score",
    description: "Measure and improve environmental impact through meal choices"
  },
  {
    icon: ShoppingCart,
    title: "Smart Cart",
    description: "One-click ingredient ordering with exact weekly quantities"
  },
  {
    icon: MessageCircle,
    title: "AI Chatbot Assistant",
    description: "Instant help on meal plans, nutrition data, and app usage"
  }
];

const Features = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Everything You Need to Eat Smarter
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Powerful features that work together to make meal planning effortless and enjoyable
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="border-gray-200 hover:shadow-md transition-all duration-300 hover-lift bg-white"
            >
              <CardContent className="p-6">
                <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center mb-4">
                  <feature.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900">{feature.title}</h3>
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
