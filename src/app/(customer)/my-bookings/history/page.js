"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/app/lib/firebase';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import Image from 'next/image';
import { useLiffContext } from '@/context/LiffProvider';

const statusTranslations = {
    'completed': 'ส่งสำเร็จ',
    'noshow': 'ไม่พบลูกค้า',
    'cancelled': 'ยกเลิกโดยคุณ'
};

const StatusBadge = ({ status }) => {
    const baseClasses = "px-3 py-1 text-xs font-bold rounded-full border";
    let colorClasses = "";
    switch (status) {
        case 'completed':
            colorClasses = "bg-green-50 text-green-700 border-green-200";
            break;
        case 'cancelled':
        case 'noshow':
            colorClasses = "bg-red-50 text-red-700 border-red-200";
            break;
        default:
            colorClasses = "bg-gray-50 text-gray-600 border-gray-200";
    }
    return <span className={`${baseClasses} ${colorClasses}`}>{statusTranslations[status] || status}</span>;
};

export default function BookingHistoryPage() {
    const { profile, loading: liffLoading, error: liffError } = useLiffContext();
    const [historyBookings, setHistoryBookings] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (liffLoading || !profile?.userId) {
            if (!liffLoading) setLoading(false);
            return;
        }

        const fetchHistory = async () => {
            setLoading(true);
            try {
                const bookingsQuery = query(
                    collection(db, 'bookings'),
                    where("userId", "==", profile.userId),
                    where("status", "in", ["completed", "cancelled", "noshow"]),
                    orderBy("createdAt", "desc")
                );
                const querySnapshot = await getDocs(bookingsQuery);
                const bookingsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setHistoryBookings(bookingsData);
            } catch (error) {
                console.error("Error fetching booking history:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [profile, liffLoading]);

    if (liffLoading) {
        return <div className="min-h-screen flex items-center justify-center text-gray-500">กำลังโหลด...</div>;
    }

    if (liffError) {
        return <div className="min-h-screen flex items-center justify-center text-red-500">LIFF Error: {liffError}</div>;
    }

    return (
        <div className="pb-20">
            <div className="max-w-md mx-auto space-y-6">

                {/* Header Section */}
                <div className="flex items-center justify-between pt-2">
                    <h1 className="text-2xl font-bold text-gray-800">การจองของฉัน</h1>
                    <Link href="/booking" className="w-10 h-10 flex items-center justify-center bg-white rounded-full text-primary hover:bg-gray-50 transition-colors shadow-md border border-gray-100">
                        <span className="text-2xl font-light">+</span>
                    </Link>
                </div>

                {/* Navigation Tabs */}
                <div className="flex bg-white/60 backdrop-blur-md rounded-full p-1.5 border border-gray-200 shadow-sm">
                    <Link href="../my-bookings" className="flex-1 text-center py-2.5 text-gray-500 text-sm font-medium hover:text-gray-700 transition-colors">
                        กำลังดำเนินการ
                    </Link>
                    <button className="flex-1 bg-white text-gray-800 rounded-full py-2.5 text-sm font-bold shadow-sm transition-all border border-gray-100">
                        ประวัติการจอง
                    </button>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-500 text-sm">กำลังโหลดประวัติ...</p>
                    </div>
                ) : historyBookings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white/50 rounded-3xl border border-gray-200 border-dashed">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-3xl">
                            📜
                        </div>
                        <p className="font-bold text-gray-800">ยังไม่มีประวัติการจอง</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {historyBookings.map(job => (
                            <div key={job.id} className="bg-white border border-gray-100 rounded-3xl p-5 shadow-lg shadow-gray-200/50 relative overflow-hidden group hover:shadow-xl transition-all duration-300">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="font-bold text-gray-800 text-lg">
                                            {job.pickupInfo.dateTime.toDate().toLocaleDateString('th-TH', {
                                                year: 'numeric', month: 'long', day: 'numeric'
                                            })}
                                        </p>
                                        <p className="text-xs text-gray-400 mt-1 font-medium">ID: {job.id.substring(0, 8).toUpperCase()}</p>
                                    </div>
                                    <StatusBadge status={job.status} />
                                </div>

                                <div className="flex items-start space-x-4 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                                    <div className="relative w-16 h-12 rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                                        <Image
                                            src={job.vehicleInfo?.imageUrl || 'https://placehold.co/600x400/f1f5f9/94a3b8?text=No+Image'}
                                            alt="car"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="text-sm space-y-1 flex-1 min-w-0">
                                        <p className="text-gray-800 font-bold truncate">{job.vehicleInfo?.brand} {job.vehicleInfo?.model}</p>
                                        <div className="flex items-center text-gray-500 text-xs">
                                            <span className="w-8 flex-shrink-0 font-medium">รับ:</span>
                                            <span className="truncate">{job.pickupInfo?.address}</span>
                                        </div>
                                        <div className="flex items-center text-gray-500 text-xs">
                                            <span className="w-8 flex-shrink-0 font-medium">ส่ง:</span>
                                            <span className="truncate">{job.dropoffInfo?.address}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
