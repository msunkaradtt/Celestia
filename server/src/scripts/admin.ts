// FILE: server/scripts/admin.ts
import { PrismaClient } from '@prisma/client';
import inquirer from 'inquirer';
import { S3Client, DeleteObjectCommand, DeleteObjectsCommand } from "@aws-sdk/client-s3"; // Import AWS S3 Client

const prisma = new PrismaClient();

// Initialize S3 Client using environment variables
const s3Client = new S3Client({ region: process.env.AWS_REGION });
const BUCKET_NAME = process.env.S3_BUCKET_NAME;

// --- Action Functions (deleteArtwork and deleteAllArtworks are updated) ---

async function deleteArtwork() {
    console.log('\n--- Delete Artwork ---');
    try {
        if (!BUCKET_NAME) throw new Error("S3_BUCKET_NAME environment variable is not set.");
        
        const artworks = await prisma.artwork.findMany({ orderBy: { createdAt: 'desc' } });
        if (artworks.length === 0) {
            console.log('No artworks to delete.');
            return;
        }
        const artworkChoices = artworks.map(art => ({ name: `${art.name} (ID: ${art.id.substring(0,8)}...)`, value: art.id }));

        const { artworkId } = await inquirer.prompt([{ name: 'artworkId', message: 'Select artwork to DELETE:', type: 'list', choices: artworkChoices }]);
        const artworkToDelete = artworks.find(art => art.id === artworkId);
        if (!artworkToDelete) {
             console.error('Artwork not found.');
             return;
        }

        const { confirm } = await inquirer.prompt([{ name: 'confirm', message: `Are you sure you want to permanently delete "${artworkToDelete.name}"?`, type: 'confirm', default: false }]);

        if (confirm) {
            const objectName = artworkToDelete.imageUrl.split('/').pop();
            if (objectName) {
                console.log(`Attempting to delete "${objectName}" from S3 bucket "${BUCKET_NAME}"...`);
                const deleteCommand = new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: objectName });
                await s3Client.send(deleteCommand);
                console.log(`✅ Successfully deleted object from S3.`);
            }
            await prisma.artwork.delete({ where: { id: artworkId } });
            console.log('✅ Artwork successfully deleted from database.');
        } else {
            console.log('Deletion cancelled.');
        }
    } catch (error) {
        console.error('❌ Failed to delete artwork:', error);
    }
}

async function deleteAllArtworks() {
    console.log('\n--- !!! DANGER ZONE: Delete All Artworks !!! ---');
    try {
        if (!BUCKET_NAME) throw new Error("S3_BUCKET_NAME environment variable is not set.");

        const { confirm } = await inquirer.prompt([{ name: 'confirm', message: `This will permanently delete ALL artworks. This action cannot be undone. Are you absolutely sure?`, type: 'confirm', default: false }]);
        
        if (!confirm) {
            console.log('Deletion cancelled.');
            return;
        }

        const artworks = await prisma.artwork.findMany();
        const objectsToDelete = artworks
            .map(art => ({ Key: art.imageUrl.split('/').pop() }))
            .filter(obj => obj.Key) as { Key: string }[];

        if (objectsToDelete.length > 0) {
            console.log(`Attempting to delete ${objectsToDelete.length} objects from S3...`);
            const deleteCommand = new DeleteObjectsCommand({
                Bucket: BUCKET_NAME,
                Delete: { Objects: objectsToDelete },
            });
            await s3Client.send(deleteCommand);
            console.log(`✅ Successfully deleted objects from S3.`);
        } else {
            console.log('No objects to delete from S3.');
        }
        
        const { count } = await prisma.artwork.deleteMany();
        console.log(`✅ Successfully deleted ${count} artworks from the database.`);
    } catch (error) {
        console.error('❌ Failed to delete all artworks:', error);
    }
}


// --- Other functions (list, add, edit) and main loop remain the same ---

async function listArtworks() {
    console.log('\nFetching last 20 artworks...');
    try {
        const artworks = await prisma.artwork.findMany({
            take: 20,
            orderBy: { createdAt: 'desc' },
        });
        if (artworks.length === 0) {
            console.log('No artworks found.');
            return;
        }
        console.table(artworks.map(art => ({
            id: art.id.substring(0, 8) + '...',
            name: art.name,
            satellite: art.satelliteName,
            createdAt: art.createdAt.toLocaleDateString(),
        })));
    } catch (error) {
        console.error('Failed to fetch artworks:', error);
    }
}

async function addArtwork() {
    console.log('\n--- Add New Artwork ---');
    const fakeSatellites = ['STARLINK-3019', 'GPS BIIR-12 (PRN 12)', 'COSMOS 2574'];
    const fakePrompts = ['A river of stars', 'Impressionist painting of a satellite trail'];
    try {
        const answers = await inquirer.prompt([
            { name: 'name', message: 'Artwork Name:', type: 'input' },
            { name: 'satelliteName', message: 'Select Satellite:', type: 'list', choices: fakeSatellites },
            { name: 'prompt', message: 'Select Prompt:', type: 'list', choices: fakePrompts },
            { name: 'negativePrompt', message: 'Negative Prompt:', type: 'input', default: 'blurry, ugly, text' },
            { name: 'imageUrl', message: 'Image URL:', type: 'input' },
        ]);

        const newArtwork = await prisma.artwork.create({ data: answers });
        console.log('\n✅ Successfully created new artwork:');
        console.log(newArtwork);
    } catch (error) {
        console.error('Failed to add artwork:', error);
    }
}

async function editArtwork() {
    console.log('\n--- Edit Artwork ---');
    try {
        const artworks = await prisma.artwork.findMany({ orderBy: { createdAt: 'desc' } });
        if (artworks.length === 0) {
            console.log('No artworks to edit.');
            return;
        }
        const artworkChoices = artworks.map(art => ({ name: `${art.name} (ID: ${art.id.substring(0,8)}...)`, value: art.id }));

        const { artworkId } = await inquirer.prompt([
            { name: 'artworkId', message: 'Select artwork to edit:', type: 'list', choices: artworkChoices }
        ]);

        const artworkToEdit = artworks.find(art => art.id === artworkId);
        if (!artworkToEdit) {
            console.error('Artwork not found.');
            return;
        }

        const answers = await inquirer.prompt([
            { name: 'name', message: 'Artwork Name:', type: 'input', default: artworkToEdit.name },
            { name: 'prompt', message: 'Prompt:', type: 'input', default: artworkToEdit.prompt },
            { name: 'imageUrl', message: 'Image URL:', type: 'input', default: artworkToEdit.imageUrl },
        ]);

        const updatedArtwork = await prisma.artwork.update({
            where: { id: artworkId },
            data: answers,
        });
        console.log('\n✅ Successfully updated artwork:');
        console.log(updatedArtwork);
    } catch (error) {
        console.error('Failed to edit artwork:', error);
    }
}

async function main() {
    console.log('Welcome to the Cosmic Art Admin CLI');
    while (true) {
        const { action } = await inquirer.prompt([
            {
                name: 'action',
                message: 'What would you like to do?',
                type: 'list',
                choices: [
                    { name: 'List recent artworks', value: 'list' },
                    { name: 'Add a new artwork', value: 'add' },
                    { name: 'Edit an existing artwork', value: 'edit' },
                    { name: 'Delete a single artwork', value: 'delete' },
                    { name: '🔥 Delete ALL artworks', value: 'delete_all' },
                    new inquirer.Separator(),
                    { name: 'Exit', value: 'exit' },
                ],
            },
        ]);

        switch (action) {
            case 'list': await listArtworks(); break;
            case 'add': await addArtwork(); break;
            case 'edit': await editArtwork(); break;
            case 'delete': await deleteArtwork(); break;
            case 'delete_all': await deleteAllArtworks(); break;
            case 'exit':
                console.log('Exiting admin CLI. Goodbye!');
                await prisma.$disconnect();
                return;
        }
        console.log('\n--------------------------------------\n');
    }
}

main().catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
});