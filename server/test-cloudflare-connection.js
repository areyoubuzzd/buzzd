import fetch from 'node-fetch';

// Display configuration
console.log('Cloudflare configuration:');
console.log('CLOUDFLARE_ACCOUNT_ID:', process.env.CLOUDFLARE_ACCOUNT_ID);
console.log('CLOUDFLARE_IMAGES_API_TOKEN present:', !!process.env.CLOUDFLARE_IMAGES_API_TOKEN);

// Test connection to Cloudflare Images
async function testConnection() {
  const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
  const API_TOKEN = process.env.CLOUDFLARE_IMAGES_API_TOKEN;
  
  if (!ACCOUNT_ID || !API_TOKEN) {
    console.error('Missing Cloudflare credentials in environment variables');
    return;
  }
  
  try {
    console.log(`Testing connection to Cloudflare Images with account ID: ${ACCOUNT_ID}`);
    
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/images/v1?page=1&per_page=1`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
        }
      }
    );
    
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));
    
    if (data.success) {
      console.log('✅ Connection to Cloudflare Images successful');
    } else {
      console.error('❌ Connection failed:', JSON.stringify(data.errors));
    }
  } catch (error) {
    console.error('Connection error:', error);
  }
}

testConnection();