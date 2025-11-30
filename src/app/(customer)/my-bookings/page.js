"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/app/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import { useLiffContext } from '@/context/LiffProvider';
import { cancelBookingByUser } from '@/app/actions/bookingActions';
import { Notification, ConfirmationModal } from '@/app/components/common/NotificationComponent';
import { FaPhone, FaExclamationCircle } from 'react-icons/fa';

// --- Helper Components ---
const statusConfig = {
    'pending': { text: 'รอการยืนยัน', progress: 10, color: 'bg-yellow-500', textColor: 'text-yellow-700', borderColor: 'border-yellow-200', bgBadge: 'bg-yellow-50' },
    'confirmed': { text: 'ยืนยันแล้ว', progress: 20, color: 'bg-blue-500', textColor: 'text-blue-700', borderColor: 'border-blue-200', bgBadge: 'bg-blue-50' },
    'assigned': { text: 'คนขับรับงานแล้ว', progress: 40, color: 'bg-cyan-500', textColor: 'text-cyan-700', borderColor: 'border-cyan-200', bgBadge: 'bg-cyan-50' },
    'stb': { text: 'คนขับกำลังไปรับ', progress: 50, color: 'bg-purple-500', textColor: 'text-purple-700', borderColor: 'border-purple-200', bgBadge: 'bg-purple-50' },
    'pickup': { text: 'รับลูกค้าแล้ว', progress: 70, color: 'bg-green-500', textColor: 'text-green-700', borderColor: 'border-green-200', bgBadge: 'bg-green-50' },
    'completed': { text: 'ส่งสำเร็จ', progress: 100, color: 'bg-green-500', textColor: 'text-green-700', borderColor: 'border-green-200', bgBadge: 'bg-green-50' },
    'noshow': { text: 'ไม่พบลูกค้า', progress: 0, color: 'bg-red-500', textColor: 'text-red-700', borderColor: 'border-red-200', bgBadge: 'bg-red-50' },
    'cancelled': { text: 'ยกเลิก', progress: 0, color: 'bg-red-500', textColor: 'text-red-700', borderColor: 'border-red-200', bgBadge: 'bg-red-50' }
};

const ProgressBar = ({ status }) => {
    const config = statusConfig[status] || { progress: 0, color: 'bg-gray-300' };
    return (
        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
            <div
                className={`h-1.5 rounded-full transition-all duration-500 ${config.color} shadow-sm`}
                style={{ width: `${config.progress}%` }}
            ></div>
        </div>
    );
};

const BookingCard = ({ job, onCancel, isCancelling }) => {
    const handleReportIssue = () => {
        onCancel.showNotification({
            show: true,
            title: 'ฟังก์ชันยังไม่พร้อม',
            message: "ฟังก์ชัน 'แจ้งเรื่อง' กำลังอยู่ในระหว่างการพัฒนา",
            type: 'error'
        });
    };

    const pickupDateTime = job.pickupInfo.dateTime.toDate();
    const statusStyle = statusConfig[job.status] || statusConfig['pending'];

    return (
        <div className="bg-white border border-gray-100 rounded-3xl p-6 space-y-5 shadow-lg shadow-gray-200/50 relative overflow-hidden group hover:shadow-xl transition-shadow duration-300">
            {/* Decorative Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

            {/* Header: Vehicle & Status */}
            <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center space-x-4">
                    <div className="relative w-20 h-14 rounded-xl overflow-hidden shadow-md border border-gray-100">
                        <Image
                            src={job.vehicleInfo?.imageUrl || 'https://placehold.co/600x400/f1f5f9/94a3b8?text=No+Image'}
                            alt={job.vehicleInfo?.model || 'Car'}
                            fill
                            className="object-cover"
                        />
                    </div>
                    <div>
                        <p className="font-bold text-lg text-gray-800 leading-tight">{job.vehicleInfo?.brand}</p>
                        <p className="text-sm text-gray-500">{job.vehicleInfo?.model}</p>
                    </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${statusStyle.bgBadge} ${statusStyle.textColor} ${statusStyle.borderColor}`}>
                    {statusStyle.text}
                </div>
            </div>

            {/* Details Section */}
            <div className="bg-gray-50/80 rounded-2xl p-4 space-y-3 border border-gray-100">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <DetailRow label="วันที่" value={pickupDateTime.toLocaleDateString('th-TH', { year: '2-digit', month: '2-digit', day: '2-digit' })} />
                    <DetailRow label="เวลา" value={pickupDateTime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} />
                    <DetailRow label="ระยะเวลา" value={`${job.tripDetails?.rentalHours || '-'} ชม.`} />
                    <DetailRow label="ราคา" value={`${job.paymentInfo?.totalPrice?.toLocaleString() || '-'} ฿`} highlight />
                </div>

                <div className="h-px bg-gray-200 my-2"></div>

                <div className="space-y-3 text-sm">
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-400 mb-1 font-medium">จุดรับ</span>
                        <span className="font-medium text-gray-700 line-clamp-1">{job.pickupInfo?.name || 'N/A'}</span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs text-gray-400 mb-1 font-medium">จุดส่ง</span>
                        <span className="font-medium text-gray-700 line-clamp-1">{job.dropoffInfo?.address.split(',')[0] || 'N/A'}</span>
                    </div>
                </div>
            </div>

            {/* Footer: Driver & Actions */}
            {job.driverInfo ? (
                <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 relative shadow-sm">
                            <Image
                                src={job.driverInfo.imageUrl || 'https://via.placeholder.com/150'}
                                alt={job.driverInfo.firstName}
                                fill
                                className="object-cover"
                            />
                        </div>
                        <div>
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Driver</p>
                            <p className="font-semibold text-sm text-gray-800">
                                {job.driverInfo.firstName}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <a href={`tel:${job.driverInfo.phoneNumber}`} className={`w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors border border-gray-200 shadow-sm ${!job.driverInfo.phoneNumber ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <FaPhone className="text-sm" />
                        </a>
                        <button onClick={handleReportIssue} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors border border-gray-200 shadow-sm">
                            <FaExclamationCircle className="text-sm" />
                        </button>
                    </div>
                </div>
            ) : (
                <div className="pt-2 flex justify-between items-center">
                    <div className="text-xs text-gray-500 font-medium">
                        สถานะ: <span className="text-gray-700">{statusStyle.text}</span>
                    </div>
                    {job.status === 'pending' && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onCancel.openModal(job.id);
                            }}
                            disabled={isCancelling}
                            className="text-xs bg-red-50 text-red-600 border border-red-100 font-bold py-2 px-4 rounded-full hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                            {isCancelling ? 'กำลังยกเลิก...' : 'ยกเลิกการจอง'}
                        </button>
                    )}
                </div>
            )}

            {/* Progress Bar for active states */}
            {['assigned', 'stb', 'pickup'].includes(job.status) && (
                <div className="pt-2">
                    <div className="flex justify-between text-[10px] text-gray-400 mb-1 font-medium">
                        <span>ความคืบหน้า</span>
                        <span>{statusConfig[job.status]?.progress}%</span>
                    </div>
                    <ProgressBar status={job.status} />
                </div>
            )}
        </div>
    );
};

const DetailRow = ({ label, value, highlight = false }) => (
    <div className="flex justify-between items-center">
        <span className="text-gray-400 font-medium">{label}</span>
        <span className={`font-bold text-right ${highlight ? 'text-primary' : 'text-gray-700'}`}>{value}</span>
    </div>
);

export default function MyBookingsPage() {
    const { profile, loading: liffLoading, error: liffError } = useLiffContext();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCancelling, setIsCancelling] = useState(false);
    const [notification, setNotification] = useState({ show: false, title: '', message: '', type: 'success' });
    const [cancelModal, setCancelModal] = useState({ show: false, bookingId: null });

    useEffect(() => {
        if (notification.show) {
            const timer = setTimeout(() => {
                setNotification({ show: false, title: '', message: '', type: 'success' });
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    useEffect(() => {
        if (liffLoading || !profile?.userId) {
            if (!liffLoading) setLoading(false);
            return;
        }

        setLoading(true);
        const bookingsQuery = query(
            collection(db, 'bookings'),
            where("userId", "==", profile.userId),
            where("status", "in", ['pending', 'confirmed', 'assigned', 'stb', 'pickup'])
        );

        const unsubscribe = onSnapshot(bookingsQuery, async (querySnapshot) => {
            const bookingsData = await Promise.all(querySnapshot.docs.map(async (bookingDoc) => {
                const job = { id: bookingDoc.id, ...bookingDoc.data() };
                if (job.driverId) {
                    const driverRef = doc(db, 'drivers', job.driverId);
                    const driverSnap = await getDoc(driverRef);
                    if (driverSnap.exists()) {
                        job.driverInfo = driverSnap.data();
                    }
                }
                return job;
            }));

            bookingsData.sort((a, b) => (b.createdAt?.toDate() || 0) - (a.createdAt?.toDate() || 0));
            setBookings(bookingsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching real-time bookings:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [profile, liffLoading]);

    const handleCancelBooking = async () => {
        if (!cancelModal.bookingId || !profile || !profile.userId) {
            setNotification({ show: true, title: 'เกิดข้อผิดพลาด', message: 'ไม่สามารถระบุข้อมูลที่จำเป็นได้', type: 'error' });
            return;
        }

        setIsCancelling(true);
        try {
            const result = await cancelBookingByUser(cancelModal.bookingId, profile.userId);
            if (result.success) {
                setNotification({ show: true, title: 'สำเร็จ', message: 'การจองของคุณถูกยกเลิกแล้ว', type: 'success' });
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            setNotification({ show: true, title: 'เกิดข้อผิดพลาด', message: error.message, type: 'error' });
        } finally {
            setIsCancelling(false);
            setCancelModal({ show: false, bookingId: null });
        }
    };

    if (liffLoading) {
        return <div className="min-h-screen flex items-center justify-center text-gray-500">กำลังโหลด...</div>;
    }
    if (liffError) {
        return <div className="min-h-screen flex items-center justify-center text-red-500">LIFF Error: {liffError}</div>;
    }

    return (
        <div className="pb-20">
            <div className="max-w-md mx-auto space-y-6">
                <Notification {...notification} />
                <ConfirmationModal
                    show={cancelModal.show}
                    title="ยืนยันการยกเลิก"
                    message="คุณต้องการยกเลิกการจองนี้ใช่หรือไม่?"
                    onConfirm={handleCancelBooking}
                    onCancel={() => setCancelModal({ show: false, bookingId: null })}
                    isProcessing={isCancelling}
                />

                {/* Header Section */}
                <div className="flex items-center justify-between pt-2">
                    <h1 className="text-2xl font-bold text-gray-800">การจองของฉัน</h1>
                    <Link href="/booking" className="w-10 h-10 flex items-center justify-center bg-white rounded-full text-primary hover:bg-gray-50 transition-colors shadow-md border border-gray-100">
                        <span className="text-2xl font-light">+</span>
                    </Link>
                </div>

                {/* Navigation Tabs */}
                <div className="flex bg-white/60 backdrop-blur-md rounded-full p-1.5 border border-gray-200 shadow-sm">
                    <button className="flex-1 bg-white text-gray-800 rounded-full py-2.5 text-sm font-bold shadow-sm transition-all border border-gray-100">
                        กำลังดำเนินการ
                    </button>
                    <Link href="/my-bookings/history" className="flex-1 text-center py-2.5 text-gray-500 text-sm font-medium hover:text-gray-700 transition-colors">
                        ประวัติการจอง
                    </Link>
                </div>

                {/* Content */}
                <div className="space-y-4">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-gray-500 text-sm">กำลังโหลดข้อมูล...</p>
                        </div>
                    ) : bookings.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white/50 rounded-3xl border border-gray-200 border-dashed">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-3xl">
                                🚗
                            </div>
                            <p className="font-bold text-gray-800">ไม่มีรายการจอง</p>
                            <p className="text-sm text-gray-500 mt-1">คุณยังไม่มีการจองที่กำลังดำเนินการ</p>
                            <Link href="/booking" className="mt-6 px-6 py-2.5 bg-primary text-white rounded-full text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/30">
                                จองรถทันที
                            </Link>
                        </div>
                    ) : (
                        bookings.map(job => (
                            <BookingCard
                                key={job.id}
                                job={job}
                                onCancel={{
                                    openModal: (bookingId) => setCancelModal({ show: true, bookingId }),
                                    showNotification: setNotification
                                }}
                                isCancelling={isCancelling && cancelModal.bookingId === job.id}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
