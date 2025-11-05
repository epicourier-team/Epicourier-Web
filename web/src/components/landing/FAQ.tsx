import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does the AI personalize meal recommendations?",
    answer:
      "EpiCourier learns from your preferences, dietary restrictions, flavor profiles, and eating habits. It considers factors like weather, time of day, your health goals, and past meal choices to suggest recipes you'll love.",
  },
  {
    question: "Can I use EpiCourier with my dietary restrictions?",
    answer:
      "Absolutely! EpiCourier supports all major dietary preferences including vegan, vegetarian, keto, gluten-free, dairy-free, and more. You can customize your profile to exclude allergens and specific ingredients.",
  },
  {
    question: "How does the Smart Cart feature work?",
    answer:
      "With one click, EpiCourier automatically fills your preferred grocery delivery or meal-kit service cart with exact quantities needed for your weekly meal plan. No more manual shopping lists or forgetting ingredients.",
  },
  {
    question: "What is the Green Score?",
    answer:
      "Your Green Score measures the environmental impact of your meal choices. It considers factors like carbon footprint, seasonal ingredients, and local sourcing. Eco Mode helps you make planet-friendly decisions while still enjoying delicious meals.",
  },
  {
    question: "Can I track my nutritional progress over time?",
    answer:
      "Yes! EpiCourier provides monthly nutrient summaries with easy-to-read charts and insights. Track macros, vitamins, minerals, and see how your eating patterns align with your health goals.",
  },
  // {
  //   question: "Is there a free trial available?",
  //   answer: "Yes, we offer a 14-day free trial with full access to all features. No credit card required to start. Experience the power of AI-driven meal planning risk-free."
  // }
];

const FAQ = () => {
  return (
    <section className="bg-gradient-to-b from-white to-gray-50 py-24">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
            Frequently Asked Questions
          </h2>
          <p className="mx-auto max-w-2xl text-xl text-gray-600">
            Everything you need to know about EpiCourier
          </p>
        </div>

        <div className="mx-auto max-w-3xl">
          <Accordion type="single" collapsible className="flex w-full flex-col gap-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="rounded-lg border border-gray-200 bg-white px-6"
              >
                <AccordionTrigger className="text-left text-lg font-semibold text-gray-900 hover:text-emerald-600">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-base text-gray-600">
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
