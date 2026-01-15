import ProcessCircle from '@/components/process-circle';
import { getCurrentBySub, getGapTime } from './tool';
import { useEffect, useState } from 'react';
import Api from '@/service/api';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dayjs from 'dayjs';

interface serialDataProps {
    serialNumber: number;
    startTime: string;
    endTime: string;
}

const now = getCurrentBySub();

export default function WeekTitle() {
    const [serialStartTime, setSerialStartTime] = useState('');
    const [serialCycle, setSerialCycle] = useState(0);
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlDate = searchParams?.get('date');
    
    // 计算导航日期
    const currentDate = urlDate ? dayjs(urlDate) : dayjs();
    const yesterday = currentDate.subtract(1, 'day').format('YYYY-MM-DD');
    const tomorrow = currentDate.add(1, 'day').format('YYYY-MM-DD');
    const today = dayjs().format('YYYY-MM-DD');
    
    const isToday = !urlDate || urlDate === today;

    const handleNavigate = (date: string) => {
        router.push(`/daily?date=${date}`);
    };

    useEffect(() => {
        Api.getSerial().then(({ serialData }: { serialData: serialDataProps[] }) => {
            const sortedSerials = serialData.sort((a, b) => b.serialNumber - a.serialNumber);
            const startTime = sortedSerials[0].startTime;
            const endTime = sortedSerials[0].endTime;
            const cycle = getGapTime(startTime, endTime);

            setSerialStartTime(startTime);
            setSerialCycle(cycle);
        })
    }, [])

    return <h1 className='week week-title-container'>
        <Link href="/" className="home-link-title">
            Week {now.week()}
        </Link>
        <br />
        <div className='phone-hidden'>
            <ProcessCircle startTime={serialStartTime} cycle={serialCycle} />
        </div>
        <div className='date-navigation'>
            <button 
                onClick={() => handleNavigate(yesterday)}
                className='nav-btn'
            >
                昨天
            </button>
            <button 
                onClick={() => handleNavigate(tomorrow)}
                className='nav-btn'
            >
                明天
            </button>
            {!isToday && (
                <button 
                    onClick={() => handleNavigate(today)}
                    className='nav-btn'
                >
                    回到现在
                </button>
            )}
        </div>
    </h1>
}