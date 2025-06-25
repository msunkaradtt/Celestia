// FILE: src/components/Footer.tsx
"use client";

import Link from 'next/link';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full mt-24 py-8 border-t border-primary-deep/50 text-center text-gray-400">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-center space-x-6">
                    <Link href="/privacy-policy" className="hover:text-primary-accent transition-colors">
                        Privacy Policy
                    </Link>
                    <Link href="/data-privacy" className="hover:text-primary-accent transition-colors">
                        Data Privacy
                    </Link>
                </div>
                <p className="mt-4 text-sm">
                    &copy; {currentYear} Celestia. All Rights Reserved.
                </p>
                <p className="mt-2 text-sm text-gray-500">
                    Designed & Developed by{' '}
                    <a 
                        href="https://msunkara.de/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="font-bold text-primary-accent hover:text-white transition-colors"
                    >
                        msunkara
                    </a>
                </p>
            </div>
        </footer>
    );
};

export default Footer;