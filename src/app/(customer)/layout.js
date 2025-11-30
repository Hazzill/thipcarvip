"use client";

import { LiffProvider } from '@/context/LiffProvider';
import CustomerHeader from '@/app/components/customer/CustomerHeader';

export default function CustomerLayout({ children }) {
    const customerLiffId = process.env.NEXT_PUBLIC_CUSTOMER_LIFF_ID;
    return (
        <LiffProvider liffId={customerLiffId}>
            <div className="max-w-md mx-auto min-h-screen bg-gradient-to-b from-gray-100 to-white">
                <CustomerHeader />
                <main className="px-4 pb-4">
                    {children}
                </main>
            </div>
        </LiffProvider>
    );
}
