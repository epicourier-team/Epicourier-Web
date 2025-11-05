const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white">
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
          <p>&copy; {currentYear} EpiCourier. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
