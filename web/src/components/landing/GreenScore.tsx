import ecoImage from "@/assets/eco-score.jpg";
import { Button } from "@/components/ui/button";
import { Award, Leaf, TrendingDown } from "lucide-react";
import Image from "next/image";

const GreenScore = () => {
  return (
    <section className="bg-white py-24">
      <div className="container mx-auto px-4">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-2">
          {/* Image */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-200 to-green-200 blur-xl" />
              <Image
                src={ecoImage}
                alt="Green Score Eco Initiative"
                className="hover-lift relative h-auto w-full max-w-md rounded-3xl shadow-2xl"
              />
            </div>
          </div>

          {/* Content */}
          <div className="relative">
            <span className="absolute top-0 right-0 rounded-full border border-amber-100 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
              Coming soon
            </span>

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-100 px-4 py-2">
              <Leaf className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-600">Eco Initiative</span>
            </div>

            <h2 className="mb-6 text-4xl font-bold text-gray-900 md:text-5xl">
              Your Green Score Matters
            </h2>

            <p className="mb-8 text-xl text-gray-600">
              Track and improve your environmental impact with every meal choice. See how your
              decisions contribute to a healthier planet.
            </p>

            <div className="mb-8 space-y-12">
              <div className="mb-6 flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                  <TrendingDown className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="mb-1 text-lg font-semibold text-gray-900">
                    Reduce Carbon Footprint
                  </h3>
                  <p className="text-gray-600">
                    Make sustainable choices that minimize environmental impact
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                  <Award className="h-6 w-6 text-emerald-600" />
                </div>
                <div>
                  <h3 className="mb-1 text-lg font-semibold text-gray-900">
                    Earn Eco Badges and Rewards
                  </h3>
                  <p className="text-gray-600">
                    Get rewarded for making planet-friendly meal decisions
                  </p>
                </div>
              </div>
            </div>

            <Button size="lg" className="bg-emerald-600 text-white hover:bg-emerald-700">
              Learn About Eco Mode
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GreenScore;
