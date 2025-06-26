// FILE: src/app/data-privacy/page.tsx
import LegalPageLayout from "@/components/LegalPageLayout";

export default function DataPrivacyPage() {
    return (
        <LegalPageLayout title="Data Privacy Statement">
            <h2>Our Commitment to Your Privacy</h2>
            <p>
                Celestia is committed to ensuring the privacy and protection of our users&apos; data. This statement outlines our practices concerning the data generated and stored through your use of our service.
            </p>

            <h2>What Data is Public?</h2>
            <p>
                When you create an artwork, certain information is stored in our database and considered public to enhance the community gallery experience. This includes:
            </p>
            <ul>
                <li>The name you give your artwork.</li>
                <li>The name of the satellite you used as a base.</li>
                <li>The prompt and negative prompt you used.</li>
                <li>The final generated image, which is stored and accessible via a public URL.</li>
            </ul>
            <p>
                This information is not tied to any personal account or identifier.
            </p>
            
            <h2>Data Deletion</h2>
            <p>
                Currently, we do not offer a self-service feature for deleting your generated artworks. If you have a critical reason for requesting the deletion of an artwork, please contact use this email: <a href="mailto:bhargav.mohith101@gmail.com">bhargav.mohith101@gmail.com</a>.
            </p>
        </LegalPageLayout>
    );
}