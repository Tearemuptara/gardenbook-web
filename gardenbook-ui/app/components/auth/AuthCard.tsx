"use client";

import React from 'react';
import Link from 'next/link';
import { PiPlantFill } from 'react-icons/pi';

interface AuthCardProps {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export default function AuthCard({ title, children, footer }: AuthCardProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-8 py-6">
          <div className="flex justify-center mb-4">
            <Link href="/" className="flex items-center gap-2">
              <PiPlantFill size={32} className="text-purple-600" />
              <span className="text-xl font-semibold text-gray-800">GardenBook</span>
            </Link>
          </div>
          
          <h2 className="text-center text-2xl font-bold text-gray-800 mb-6">{title}</h2>
          
          {children}
        </div>
        
        {footer && (
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-200">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
} 