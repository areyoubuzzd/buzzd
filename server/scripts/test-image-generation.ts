import { getDrinkImage, generateSampleImages } from '../services/openaiImageService';

// Test script for image generation
async function testImageGeneration() {
  console.log('🧪 Testing AI image generation for drinks...');
  
  try {
    // Generate a sample beer image
    console.log('Generating beer image...');
    const beerImage = await getDrinkImage('beer', 'Draft');
    console.log(`Beer image generated: ${beerImage}`);
    
    // Generate a beer bucket image
    console.log('Generating beer bucket image...');
    const beerBucketImage = await getDrinkImage('beer', 'bucket');
    console.log(`Beer bucket image generated: ${beerBucketImage}`);
    
    // Generate a wine image
    console.log('Generating wine image...');
    const wineImage = await getDrinkImage('wine', 'Red');
    console.log(`Wine image generated: ${wineImage}`);
    
    // Generate a cocktail image
    console.log('Generating cocktail image...');
    const cocktailImage = await getDrinkImage('cocktail', 'Margarita');
    console.log(`Cocktail image generated: ${cocktailImage}`);
    
    // Generate a spirit image
    console.log('Generating spirit image...');
    const spiritImage = await getDrinkImage('spirit', 'Whisky');
    console.log(`Spirit image generated: ${spiritImage}`);
    
    console.log('✅ All test images generated successfully!');
  } catch (error) {
    console.error('❌ Error generating test images:', error);
  }
}

// Run the test
testImageGeneration()
  .then(() => {
    console.log('Test completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Test failed:', error);
    process.exit(1);
  });