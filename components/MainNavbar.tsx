'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Gamepad2, Trophy, Settings, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import WalletConnector from './navbar';

export default function MainNavbar() {
  const pathname = usePathname();
  const isGamePage = pathname.startsWith('/game');

  const navItems = [
    {
      name: 'Home',
      href: '/',
      icon: Home,
    },
    {
      name: 'Play',
      href: '/game',
      icon: Gamepad2,
    },
    {
      name: 'Leaderboard',
      href: '/leaderboard',
      icon: Trophy,
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
    },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">
                Monad Gaming DApp
              </span>
            </Link>
            {!isGamePage && (
              <nav className="hidden md:ml-10 md:flex space-x-8">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={cn(
                        'inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors',
                        isActive
                          ? 'text-white border-b-2 border-blue-500'
                          : 'text-gray-300 hover:text-white'
                      )}
                    >
                      <item.icon className="h-5 w-5 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <WalletConnector />
          </div>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      {!isGamePage && (
        <div className="fixed bottom-0 left-0 right-0 md:hidden bg-gray-900 border-t border-gray-800 py-2">
          <div className="flex justify-around items-center">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center p-2 text-xs',
                    isActive ? 'text-blue-400' : 'text-gray-400 hover:text-white'
                  )}
                >
                  <item.icon className="h-6 w-6 mb-1" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
