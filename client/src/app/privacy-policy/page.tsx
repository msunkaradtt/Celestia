// FILE: src/app/privacy-policy/page.tsx
import LegalPageLayout from "@/components/LegalPageLayout";

export default function PrivacyPolicyPage() {
    return (
        <LegalPageLayout title="Privacy Policy">
            <p>Last updated: June 24, 2025</p>
            <p>
                Your privacy is important to us. It is Celestia' policy to respect your privacy regarding any information we may collect from you across our website. We do not collect any personally identifiable information.
            </p>
            
            <h2>1. Information We Collect</h2>
            <p>
                <strong>Art Creation Data:</strong> We store the metadata associated with the art you create, including the prompts, satellite used, and the final generated image URL. This data is pseudonymous and is not linked to any personal accounts.
            </p>

            <h2>2. How We Use Your Information</h2>
            <p>
                We use the information we collect solely to provide, operate, and maintain our services, specifically for displaying generated artworks in our public gallery.
            </p>
            <ul>
                <li>Provide, operate, and maintain our services.</li>
                <li>Display your generated artworks in our public gallery.</li>
                <li>Improve, personalize, and expand our services.</li>
            </ul>

            <h2>3. Data Security</h2>
            <p>
                The security of your data is important to us but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your data, we cannot guarantee its absolute security.
            </p>

            <h2>4. Changes to This Privacy Policy</h2>
            <p>
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
            </p>
        </LegalPageLayout>
    );
}