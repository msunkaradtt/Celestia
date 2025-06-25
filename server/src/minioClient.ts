// FILE: server/src/minioClient.ts
import { Client } from 'minio';

export const minioClient = new Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000', 10),
    useSSL: false,
    accessKey: process.env.MINIO_ACCESS_KEY || '',
    secretKey: process.env.MINIO_SECRET_KEY || '',
});

export const BUCKET_NAME = process.env.MINIO_BUCKET || 'artworks';

// This function now only creates the bucket if it's missing.
export async function setupMinio() {
    console.log("Checking if MinIO bucket exists...");
    try {
        const bucketExists = await minioClient.bucketExists(BUCKET_NAME);
        if (!bucketExists) {
            console.log(`Bucket ${BUCKET_NAME} does not exist. Creating...`);
            await minioClient.makeBucket(BUCKET_NAME);
            console.log(`✅ Bucket "${BUCKET_NAME}" created.`);

            // After creating, we set a simple public-read policy
            const policy = JSON.stringify({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"AWS": ["*"]},
                    "Action": ["s3:GetObject"],
                    "Resource": [`arn:aws:s3:::${BUCKET_NAME}/*`]
                }]
            });
            await minioClient.setBucketPolicy(BUCKET_NAME, policy);
            console.log(`Bucket policy set to public read.`);
            
        } else {
            console.log(`Bucket "${BUCKET_NAME}" already exists.`);
        }
    } catch (error) {
        console.error("❌ Error during MinIO setup:", error);
    }
}