import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary with fixed values for testing
cloudinary.config({
  cloud_name: 'demo',
  api_key: 'test',
  api_secret: 'test'
});

// Use Cloudinary's demo account to test image URLs
const testImageUrl = cloudinary.url('sample', {
  secure: true,
  width: 300
});

console.log('Test Cloudinary URL:', testImageUrl);
console.log('This should be: https://res.cloudinary.com/demo/image/upload/w_300/sample');