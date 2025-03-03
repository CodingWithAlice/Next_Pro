import ProcessCircle from '@/components/process-circle';
import { getCurrentBySub, getGapTime } from './tool';
import { useEffect, useState } from 'react';
import Api from '@/service/api';

interface serialDataProps {
    serialNumber: number;
    startTime: string;
    endTime: string;
}

const now = getCurrentBySub();

export default function WeekTitle() {
    const [serialStartTime, setSerialStartTime] = useState('');
    const [serialCycle, setSerialCycle] = useState(0);

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

    return <h1 className='week'>
        Week {now.week()}
        <br />
        <div className='phone-hidden'>
            <ProcessCircle startTime={serialStartTime} cycle={serialCycle} />
        </div>
    </h1>
}