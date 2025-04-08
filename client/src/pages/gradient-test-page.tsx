import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export default function GradientTestPage() {
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Gradient Test Page</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        <div className="p-2">
          <div 
            className="relative overflow-hidden cursor-pointer shadow-lg w-full mb-0"
            style={{
              aspectRatio: '1.586/1',
              borderRadius: '8px',
              maxWidth: '100%',
              height: 0,
              paddingBottom: 'calc(100% / 1.586)',
              marginBottom: '4px',
              // Simple flat color for comparison
              backgroundColor: '#E67E30', 
            }}
          >
            <div className="absolute inset-0 flex flex-col h-full">
              <div className="p-4 flex-grow flex justify-center items-center">
                <div className="text-white text-lg">Flat Color</div>
              </div>
              <div className="p-3 pt-1 bg-black/20 flex flex-col items-center">
                <h3 className="font-bold text-white text-center text-xl leading-tight">
                  BEER #1
                </h3>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-2">
          <div 
            className="relative overflow-hidden cursor-pointer shadow-lg w-full mb-0"
            style={{
              aspectRatio: '1.586/1',
              borderRadius: '8px',
              maxWidth: '100%',
              height: 0,
              paddingBottom: 'calc(100% / 1.586)',
              marginBottom: '4px',
              // Linear gradient
              background: 'linear-gradient(135deg, #E67E30 0%, #D96C29 100%)',
            }}
          >
            <div className="absolute inset-0 flex flex-col h-full">
              <div className="p-4 flex-grow flex justify-center items-center">
                <div className="text-white text-lg">Linear Gradient</div>
              </div>
              <div className="p-3 pt-1 bg-black/20 flex flex-col items-center">
                <h3 className="font-bold text-white text-center text-xl leading-tight">
                  BEER #2
                </h3>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-2">
          <div 
            className="relative overflow-hidden cursor-pointer shadow-lg w-full mb-0"
            style={{
              aspectRatio: '1.586/1',
              borderRadius: '8px',
              maxWidth: '100%',
              height: 0,
              paddingBottom: 'calc(100% / 1.586)',
              marginBottom: '4px',
              // Radial gradient
              background: 'radial-gradient(circle at center, #F97316 0%, #E67E30 55%, #D96C29 100%)',
            }}
          >
            <div className="absolute inset-0 flex flex-col h-full">
              <div className="p-4 flex-grow flex justify-center items-center">
                <div className="text-white text-lg">Radial Gradient</div>
              </div>
              <div className="p-3 pt-1 bg-black/20 flex flex-col items-center">
                <h3 className="font-bold text-white text-center text-xl leading-tight">
                  BEER #3
                </h3>
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-2">
          <div 
            className="relative overflow-hidden cursor-pointer shadow-lg w-full mb-0"
            style={{
              aspectRatio: '1.586/1',
              borderRadius: '8px',
              maxWidth: '100%',
              height: 0,
              paddingBottom: 'calc(100% / 1.586)',
              marginBottom: '4px',
              // Strong contrast gradient
              background: 'radial-gradient(circle at center, yellow 0%, orange 50%, red 100%)',
            }}
          >
            <div className="absolute inset-0 flex flex-col h-full">
              <div className="p-4 flex-grow flex justify-center items-center">
                <div className="text-white text-lg">High Contrast</div>
              </div>
              <div className="p-3 pt-1 bg-black/20 flex flex-col items-center">
                <h3 className="font-bold text-white text-center text-xl leading-tight">
                  BEER #4
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}