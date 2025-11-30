"use client";

import { useLiffContext } from '@/context/LiffProvider';
import Image from 'next/image';
import { FaBell } from 'react-icons/fa';

export default function CustomerHeader() {
    const { profile, loading, error } = useLiffContext();

    if (loading || error) {
        return (
            <div className="px-6 py-4 flex justify-between items-center animate-pulse">
                <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-gray-200"></div>
                    <div className="space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                    </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-200"></div>
            </div>
        );
    }

    return (
        <header className="px-6 py-4 flex justify-between items-center sticky top-0 z-50 bg-gradient-to-b from-gray-100/90 to-gray-100/0 backdrop-blur-sm">
            <div className="flex items-center space-x-3">
                <div className="relative">
                    {profile?.pictureUrl ? (
                        <Image
                            src={profile.pictureUrl}
                            width={48}
                            height={48}
                            alt="Profile"
                            className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-400">
                            <span className="text-xl">?</span>
                        </div>
                    )}
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div>
                    <p className="text-xs text-gray-500 font-medium">ยินดีต้อนรับ</p>
                    <h2 className="text-lg font-bold text-gray-800 leading-tight">
                        คุณ{profile?.displayName || 'Guest'}
                    </h2>
                </div>
            </div>

            <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-600 shadow-sm border border-gray-100 hover:bg-gray-50 transition-colors relative">
                <FaBell className="text-lg" />
                <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            </button>
        </header>
    );
}
