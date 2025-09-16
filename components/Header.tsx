import React from 'react';
import { Icon } from './icons';

export const Header: React.FC = () => {
  return (
    <header className="bg-cream-100/80 backdrop-blur-sm sticky top-0 z-30 border-b border-cream-200 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo and App Name */}
          <div className="flex items-center">
             <div className="p-2 bg-accent-500/20 rounded-full mr-3">
                <span className="text-3xl">🐮</span>
             </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-primary-900">पशुVision</h1>
          </div>
          
          {/* Center: Search Bar */}
          <div className="flex-1 flex justify-center px-2 lg:ml-6 lg:justify-end">
            <div className="max-w-md w-full lg:max-w-xs">
              <label htmlFor="search" className="sr-only">Search</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Icon name="search" className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="search"
                  name="search"
                  className="block w-full bg-white border border-gray-300 rounded-md py-2 pl-10 pr-3 text-sm placeholder-gray-500 focus:outline-none focus:text-gray-900 focus:placeholder-gray-400 focus:ring-1 focus:ring-accent-500 focus:border-accent-500 sm:text-sm"
                  placeholder="Search by Aadhaar, Owner..."
                  type="search"
                />
              </div>
            </div>
          </div>

          {/* Right: Icons */}
          <div className="flex items-center gap-2">
              <button className="p-2 rounded-full text-secondary-700 hover:bg-cream-200 hover:text-primary-900 transition-colors">
                  <Icon name="bell" className="w-6 h-6"/>
              </button>
              <button className="p-2 rounded-full text-secondary-700 hover:bg-cream-200 hover:text-primary-900 transition-colors">
                  <Icon name="user-circle" className="w-6 h-6"/>
              </button>
          </div>
        </div>
      </div>
    </header>
  );
};