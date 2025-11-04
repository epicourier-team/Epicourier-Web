import ecoImage from "@/assets/eco-score.jpg";
import { Button } from "@/components/ui/button";
import { Award, Leaf, TrendingDown } from "lucide-react";
import Image from "next/image";

const GreenScore = () => {
  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Image */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-200 to-green-200 blur-xl" />
              <Image
                src={ecoImage} 
                alt="Green Score Eco Initiative" 
                className="relative rounded-3xl shadow-2xl hover-lift max-w-md w-full h-120"
              />
            </div>
          </div>

          {/* Content */}
          <div className="relative">
            <span className="absolute top-0 right-0 bg-amber-50 text-amber-700 text-xs font-semibold px-2 py-1 rounded-full border border-amber-100">
              Coming soon
            </span>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 border border-emerald-200 mb-6">
              <Leaf className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-600">Eco Initiative</span>
            </div>

            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Your Green Score Matters
            </h2>
            
            <p className="text-xl text-gray-600 mb-8">
              Track and improve your environmental impact with every meal choice. See how your decisions contribute to a healthier planet.
            </p>

            <div className="space-y-12 mb-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <TrendingDown className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1 text-gray-900">Reduce Carbon Footprint</h3>
                  <p className="text-gray-600">Make sustainable choices that minimize environmental impact</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                  <Award className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1 text-gray-900">Earn Eco Badges and Rewards</h3>
                  <p className="text-gray-600">Get rewarded for making planet-friendly meal decisions</p>
                </div>
              </div>
            </div>

            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Learn About Eco Mode
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GreenScore;
