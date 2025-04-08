import React from 'react';
import Header from '@/components/layout/header';
import Navigation from '@/components/layout/navigation';
import ModernDealsGrid from '@/components/deals/modern-deals-grid';

export default function ModernDealsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Modern Deal Card Design</h1>
        <p className="mb-8 text-lg">
          This page showcases our new modern deal card design with colored backgrounds and the Fredoka font.
          Click the "Load Cloudinary Images" button to test the Cloudinary integration.
        </p>
        
        <ModernDealsGrid />
      </main>
      <Navigation />
    </div>
  );
}