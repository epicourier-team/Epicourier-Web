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
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <h4 className="mb-4 font-semibold">Product</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="https://github.com/epicourier-team/Epicourier-Web/wiki/Software-Overviews"
                  className="text-white/70 transition-colors hover:text-white"
                >
                  Project Overview
                </Link>
              </li>
              <li>
                <Link
                  href="https://youtu.be/R2pvrWlpgaU"
                  className="text-white/70 transition-colors hover:text-white"
                >
                  Demo
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold">Development</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="https://github.com/epicourier-team/Epicourier-Web/wiki/Roadmap"
                  className="text-white/70 transition-colors hover:text-white"
                >
                  Roadmap
                </Link>
              </li>
              <li>
                <Link
                  href="https://github.com/epicourier-team/Epicourier-Web/releases"
                  className="text-white/70 transition-colors hover:text-white"
                >
                  Releases
                </Link>
              </li>
              <li>
                <Link
                  href="https://github.com/epicourier-team/Epicourier-Web"
                  className="text-white/70 transition-colors hover:text-white"
                >
                  GitHub
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold">Resources</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="https://github.com/epicourier-team/Epicourier-Web/wiki"
                  className="text-white/70 transition-colors hover:text-white"
                >
                  Documentation
                </Link>
              </li>
              <li>
                <Link
                  href="https://github.com/epicourier-team/Epicourier-Web/wiki/Case-Studies"
                  className="text-white/70 transition-colors hover:text-white"
                >
                  Case Studies
                </Link>
              </li>
              <li>
                <Link
                  href="https://github.com/epicourier-team/Epicourier-Web/wiki/Success-Stories"
                  className="text-white/70 transition-colors hover:text-white"
                >
                  Success Stories
                </Link>
              </li>
              <li>
                <Link
                  href="https://github.com/epicourier-team/Epicourier-Web/wiki/Get-Started-Guide"
                  className="text-white/70 transition-colors hover:text-white"
                >
                  Start Guide
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold">Support</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  href="https://slashpage.com/site-fn8swy4xu372s9jrqr2qdgr6l/dwy5rvmjgexyg2p46zn9"
                  className="text-white/70 transition-colors hover:text-white"
                >
                  Help Center
                </Link>
              </li>
              <li>
                <a
                  href="mailto:epicourier.team@gmail.com"
                  className="text-white/70 transition-colors hover:text-white"
                  aria-label="Email support at epicourier.team@gmail.com"
                >
                  Email Support
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
