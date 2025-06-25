// FILE: src/components/LegalPageLayout.tsx
import React from 'react';

interface LegalPageLayoutProps {
    title: string;
    children: React.ReactNode;
}

const LegalPageLayout = ({ title, children }: LegalPageLayoutProps) => {
    return (
        <div className="w-full max-w-4xl mx-auto animate-fade-in text-left">
            <h1 className="text-4xl font-black mb-8 text-primary-accent">{title}</h1>
            <div className="prose prose-invert prose-lg text-gray-300 prose-headings:text-white prose-a:text-primary-accent hover:prose-a:text-white">
                {children}
            </div>
        </div>
    );
};

export default LegalPageLayout;