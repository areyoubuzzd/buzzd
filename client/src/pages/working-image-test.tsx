import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function WorkingImageTest() {
  const knownWorkingImageId = '80eb4b3b-d3ce-4536-8c39-debfc6a51f00';
  const accountId = "kx7S-b2sJYbGgWyc5FfQUg";
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Working Cloudflare Image Test</h1>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Direct Image URL Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full h-64 bg-gray-100 rounded-md overflow-hidden">
              <img 
                src={`https://imagedelivery.net/${accountId}/${knownWorkingImageId}/public`}
                alt="Test image from Cloudflare"
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 break-all">
              Image ID: {knownWorkingImageId}
            </p>
            <p className="text-xs text-gray-500 mt-1 break-all">
              URL: https://imagedelivery.net/{accountId}/{knownWorkingImageId}/public
            </p>
            <div className="mt-4 p-4 bg-gray-100 rounded-md">
              <h3 className="text-sm font-bold mb-2">Debug Information</h3>
              <p className="text-xs mb-1">Account ID: {accountId}</p>
              <p className="text-xs mb-1">VITE_CLOUDFLARE_ACCOUNT_ID: {import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID || 'Not set'}</p>
            </div>
            <div className="mt-2">
              <a 
                href={`https://imagedelivery.net/${accountId}/${knownWorkingImageId}/public`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                Open image directly in new tab
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}