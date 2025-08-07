"use client";

import { LiffProvider, useLiffContext } from '@/context/LiffProvider';
import Image from 'next/image';

function DriverHeader() {
    const { profile, loading, error } = useLiffContext();

    if (loading || error) {
        return (
            <header className="bg-[#22252A] text-white p-2 m-4 shadow-lg flex items-center space-x-4 rounded-full animate-pulse">
                <div className="w-12 h-12 rounded-full bg-gray-300 animate-pulse"></div>
                <div>
                    <p className="font-semibold">พนักงานขับรถ</p>
                    <p className="text-sm text-gray-400">{error ? 'เกิดข้อผิดพลาด' : 'กำลังโหลด...'}</p>
                </div>
            </header>
        );
    }

    return (
        <header className="bg-[#22252A] text-white p-2  m-4 shadow-lg flex items-center space-x-4 rounded-full">
            {profile?.pictureUrl && (
                <Image src={profile.pictureUrl} width={48} height={48} alt="Driver Profile" className="w-12 h-12 rounded-full"/>
            )}
            <div>
                <p className="font-semibold">พนักงานขับรถ</p>
                <p className="text-sm text-gray-600">{profile?.displayName}</p>
            </div>
        </header>
    );
}

export default function DriverLayout({ children }) {
    // ระบุ LIFF ID สำหรับคนขับที่นี่
    const driverLiffId = process.env.NEXT_PUBLIC_DRIVER_LIFF_ID;

    return (
        <LiffProvider liffId={driverLiffId}>
            <div className="max-w-md mx-auto min-h-screen">
                <DriverHeader />
                {children}
            </div>
        </LiffProvider>
    );
}
