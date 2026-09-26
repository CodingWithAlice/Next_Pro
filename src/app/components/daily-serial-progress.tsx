'use client';

import ProcessCircle from '@/components/process-circle';
import { resolveDailySerialProgress } from '@/components/tool';
import Api from '@/service/api';
import { Tooltip } from 'antd';
import { useEffect, useState } from 'react';

const SERIAL_PROGRESS_TIP = '周期进度，默认 14 天；超过 14 天按实际天数';

interface SerialDataProps {
    serialNumber: number;
    startTime: string;
    endTime: string;
}

interface DailySerialProgressProps {
    className?: string;
    /** nav：顶栏日期按钮下方 */
    variant?: 'nav' | 'inline';
}

/** 双周周期进度 */
export default function DailySerialProgress({
    className,
    variant = 'nav',
}: DailySerialProgressProps) {
    const [serialStartTime, setSerialStartTime] = useState('');
    const [serialCycle, setSerialCycle] = useState(0);

    useEffect(() => {
        Api.getSerial().then(({ serialData }: { serialData: SerialDataProps[] }) => {
            const sortedSerials = serialData.sort((a, b) => b.serialNumber - a.serialNumber);
            const startTime = sortedSerials[0]?.startTime ?? '';
            const endTime = sortedSerials[0]?.endTime ?? '';
            if (!startTime) {
                setSerialStartTime('');
                setSerialCycle(0);
                return;
            }
            const progress = resolveDailySerialProgress(startTime, endTime);
            setSerialStartTime(progress.startTime);
            setSerialCycle(progress.cycle);
        });
    }, []);

    if (!serialStartTime) return null;

    return (
        <div
            className={[
                'daily-serial-progress',
                'phone-hidden',
                variant === 'nav' ? 'daily-serial-progress--nav' : '',
                className,
            ]
                .filter(Boolean)
                .join(' ')}
        >
            <Tooltip title={SERIAL_PROGRESS_TIP} placement="top">
                <div className="daily-serial-progress__bar" role="img" aria-label={SERIAL_PROGRESS_TIP}>
                    <ProcessCircle startTime={serialStartTime} cycle={serialCycle} />
                </div>
            </Tooltip>
        </div>
    );
}
