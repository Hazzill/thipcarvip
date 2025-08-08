"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { db } from '@/app/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { generateQrCodePayload } from '@/app/actions/paymentActions';
import Image from 'next/image';

const PROMPTPAY_ID = '0623733306';

function PaymentContent() {
    const [booking, setBooking] = useState(null);
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const searchParams = useSearchParams();

    useEffect(() => {
        const getBookingId = () => {
            const liffState = searchParams.get('liff.state');
            if (liffState) {
                // LIFF URL is liff.line.me/{liffId}/{bookingId}
                // liff.state will be /{bookingId}
                return liffState.replace(/^\//, '');
            }
            // Fallback for direct access if needed
            return searchParams.get('bookingId');
        };

        const bookingId = getBookingId();
        
        if (!bookingId) {
            setError('ไม่พบ Booking ID');
            setLoading(false);
            return;
        }

        const fetchBookingAndGenerateQR = async () => {
            setLoading(true);
            try {
                const bookingRef = doc(db, 'bookings', bookingId);
                const bookingSnap = await getDoc(bookingRef);

                if (!bookingSnap.exists()) {
                    throw new Error('ไม่พบข้อมูลการจอง');
                }
                
                const bookingData = { id: bookingSnap.id, ...bookingSnap.data() };
                setBooking(bookingData);

                const amount = bookingData.paymentInfo.totalPrice;
                const dataUrl = await generateQrCodePayload(PROMPTPAY_ID, amount);
                
                setQrCodeDataUrl(dataUrl);

            } catch (err) {
                setError(err.message);
                console.error('Error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchBookingAndGenerateQR();
    }, [searchParams]);

    if (loading) {
        return (
            <div className="text-center p-10">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-800 mx-auto mb-4"></div>
                <p>กำลังสร้าง QR Code สำหรับชำระเงิน...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center p-10 text-red-500">
                <p className="text-lg font-semibold">เกิดข้อผิดพลาด</p>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto p-4">
            <div className="bg-white rounded-lg shadow-lg p-6 text-center">
                <h1 className="text-2xl font-bold text-gray-800 mb-2">ใบแจ้งค่าบริการ</h1>
                <p className="text-sm text-gray-500 mb-4">
                    Booking ID: {booking?.id.substring(0, 6).toUpperCase()}
                </p>
                <div className="my-6">
                    <p className="text-gray-600">ยอดชำระทั้งหมด</p>
                    <p className="text-5xl font-bold text-slate-800">
                        {booking?.paymentInfo.totalPrice.toLocaleString()}
                        <span className="text-2xl font-medium ml-1">บาท</span>
                    </p>
                </div>
                {qrCodeDataUrl && (
                    <div className="flex justify-center my-6">
                         <Image 
                            src={qrCodeDataUrl} 
                            alt="PromptPay QR Code" 
                            width={250} 
                            height={250} 
                            className="border-2 border-gray-200 rounded-lg"
                         />
                    </div>
                )}
                <p className="text-gray-600 mb-4">
                    สแกน QR Code นี้เพื่อชำระเงินผ่านแอปพลิเคชันของธนาคาร
                </p>
            </div>
        </div>
    );
}

export default function PaymentMainPage() {
    return (
        <Suspense fallback={<div className="p-10 text-center">กำลังโหลด...</div>}>
            <PaymentContent />
        </Suspense>
    );
}
