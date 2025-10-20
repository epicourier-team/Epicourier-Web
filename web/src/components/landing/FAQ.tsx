import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does the AI personalize meal recommendations?",
    answer: "Epicourier learns from your preferences, dietary restrictions, flavor profiles, and eating habits. It considers factors like weather, time of day, your health goals, and past meal choices to suggest recipes you'll love."
  },
  {
    question: "Can I use Epicourier with my dietary restrictions?",
    answer: "Absolutely! Epicourier supports all major dietary preferences including vegan, vegetarian, keto, gluten-free, dairy-free, and more. You can customize your profile to exclude allergens and specific ingredients."
  },
  {
    question: "How does the Smart Cart feature work?",
    answer: "With one click, Epicourier automatically fills your preferred grocery delivery or meal-kit service cart with exact quantities needed for your weekly meal plan. No more manual shopping lists or forgetting ingredients."
  },
  {
    question: "What is the Green Score?",
    answer: "Your Green Score measures the environmental impact of your meal choices. It considers factors like carbon footprint, seasonal ingredients, and local sourcing. Eco Mode helps you make planet-friendly decisions while still enjoying delicious meals."
  },
  {
    question: "Can I track my nutritional progress over time?",
    answer: "Yes! Epicourier provides monthly nutrient summaries with easy-to-read charts and insights. Track macros, vitamins, minerals, and see how your eating patterns align with your health goals."
  },
  {
    question: "Is there a free trial available?",
    answer: "Yes, we offer a 14-day free trial with full access to all features. No credit card required to start. Experience the power of AI-driven meal planning risk-free."
  }
];

const FAQ = () => {
  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Everything you need to know about Epicourier
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full flex flex-col gap-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border border-gray-200 rounded-lg px-6 bg-white"
              >
                <AccordionTrigger className="text-left text-lg font-semibold text-gray-900 hover:text-emerald-600">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 text-base">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
