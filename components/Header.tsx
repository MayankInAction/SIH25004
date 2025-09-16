import React, { useState } from 'react';
import { Icon } from './icons';

interface HeaderProps {
  onSearch: (term: string) => void;
  showSearch: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onSearch, showSearch }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      onSearch(searchTerm);
    }
  };

  return (
    <header className="bg-primary-900 sticky top-0 z-30 shadow-md">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Logo and App Name */}
          <div className="flex items-center">
             <div className="p-2 bg-cream-50/20 rounded-full mr-3">
                <span className="text-3xl">🐮</span>
             </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">पशुVision</h1>
          </div>
          
          {/* Center: Search Bar */}
          {showSearch && (
            <div className="flex-1 flex justify-center px-2 lg:ml-6 lg:justify-end">
              <div className="max-w-md w-full lg:max-w-xs">
                <label htmlFor="search" className="sr-only">Search</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 pl-3 flex items-center">
                    <Icon name="search" className="h-5 w-5 text-gray-300" />
                  </div>
                  <input
                    id="search"
                    name="search"
                    className="block w-full bg-primary-800 border border-primary-700 rounded-md py-2 pl-10 pr-3 text-sm placeholder-gray-300 text-white focus:outline-none focus:placeholder-gray-200 focus:ring-1 focus:ring-accent-400 focus:border-accent-400 sm:text-sm"
                    placeholder="Search by Aadhaar, Owner..."
                    type="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Right: Icons */}
          <div className="flex items-center gap-2">
              <button className="p-2 rounded-full text-cream-100 hover:bg-primary-800 hover:text-white transition-colors">
                  <Icon name="user-circle" className="w-6 h-6"/>
              </button>
          </div>
        </div>
      </div>
    </header>
  );
};