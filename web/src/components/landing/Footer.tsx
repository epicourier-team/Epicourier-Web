import Link from "next/link";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
      {/* CTA Section */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">
              Ready to Transform Your Eating Habits?
            </h2>
            <p className="mb-8 text-xl text-white/80">
              Join thousands of users who are eating smarter, healthier, and more sustainably with
              Epicourier.
            </p>
            <Link
              href="/signup"
              className="hover-lift rounded-lg bg-emerald-600 px-4 py-4 text-lg text-white shadow-lg hover:bg-emerald-700"
            >
              Start Your Smart Meal Journey
            </Link>
          </div>
        </div>
      </div>

      {/* Links Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h4 className="mb-4 font-semibold">Product</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-white/70 transition-colors hover:text-white">
                  Features
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 transition-colors hover:text-white">
                  Pricing
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 transition-colors hover:text-white">
                  Demo
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 transition-colors hover:text-white">
                  Integrations
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold">Company</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-white/70 transition-colors hover:text-white">
                  About Us
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 transition-colors hover:text-white">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 transition-colors hover:text-white">
                  Careers
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 transition-colors hover:text-white">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold">Support</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-white/70 transition-colors hover:text-white">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 transition-colors hover:text-white">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 transition-colors hover:text-white">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="text-white/70 transition-colors hover:text-white">
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-8 text-center text-white/60">
          <p>&copy; {currentYear} Epicourier. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
