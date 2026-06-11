import { v2 as cloudinary } from 'cloudinary';
import { resolve } from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function main() {
  try {
    console.log('Uploading portrait.jpg...');
    const portraitRes = await cloudinary.uploader.upload(
      resolve(process.cwd(), 'public/images/portrait.jpg'),
      {
        folder: 'portfolio',
        public_id: 'portrait',
        overwrite: true,
      }
    );
    console.log('Portrait uploaded:', portraitRes.secure_url);

    console.log('Uploading resume...');
    const resumeRes = await cloudinary.uploader.upload(
      resolve(process.cwd(), 'public/resume/shashi-bhushan-vijay-resume.pdf'),
      {
        folder: 'portfolio',
        public_id: 'shashi-bhushan-vijay-resume',
        overwrite: true,
      }
    );
    console.log('Resume uploaded:', resumeRes.secure_url);

    console.log('Done!');
  } catch (error) {
    console.error('Error uploading to Cloudinary:', error);
  }
}

main();
