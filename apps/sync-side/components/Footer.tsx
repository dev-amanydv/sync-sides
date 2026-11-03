import React from 'react';
import { FaGithub, FaTwitter, FaLinkedin } from 'react-icons/fa';
import Link from 'next/link';

const Footer = () => {
  return (
    <footer className="w-full border-t border-white/10 bg-black pt-16 pb-8 text-slate-400">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-white">SyncSide</h3>
            <p className="text-sm leading-relaxed">
              The ultimate platform for high-quality remote recording. 
              Capture locally, merge instantly, and create studio-grade content from anywhere.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="hover:text-white transition-colors duration-200">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors duration-200">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors duration-200">
                  Roadmap
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors duration-200">
                  Changelog
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="#" className="hover:text-white transition-colors duration-200">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors duration-200">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-white transition-colors duration-200">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Connect</h4>
            <div className="flex space-x-4">
              <Link href="https://github.com/dev-amanydv" className="hover:text-white transition-colors duration-200">
                <FaGithub className="w-6 h-6" />
                <span className="sr-only">GitHub</span>
              </Link>
              <Link href="https://x.com/amandoestwt" className="hover:text-white transition-colors duration-200">
                <FaTwitter className="w-6 h-6" />
                <span className="sr-only">Twitter</span>
              </Link>
              <Link href="https://www.linkedin.com/in/devamanydv/" className="hover:text-white transition-colors duration-200">
                <FaLinkedin className="w-6 h-6" />
                <span className="sr-only">LinkedIn</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} SyncSide. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-medium text-green-500">All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
