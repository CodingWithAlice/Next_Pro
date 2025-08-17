"use client";
import './app.css';
import { Button, message } from "antd";
import { useEffect, useState } from "react";
import Api from "@/service/api";
import { SerialsPicker } from "@/components/serials-picker";
import { WeekDetailTextarea } from '@/components/week-detail-textarea';
import { WeekPeriodModal } from '@/components/week-period-modal';
import { getGapTime } from '@/components/tool';
import SerialsRangeEditModal from '@/components/serials-range-edit-modal';

export default function Week() {
    const [weekData, setWeekData] = useState<{ [key: string]: string }>({});
    const [curSerial, setCurSerial] = useState<number>(0);
    const [serialsLength, setSerialsLength] = useState(0);
    const [messageApi, contextHolder] = message.useMessage();
    const [serials, setSerials] = useState<{ serialNumber: number, startTime: string, endTime: string }[]>([]);

    const handleSingleChange = (value: number | number[]) => {
        if (typeof value === 'number') {
            setCurSerial(value);
        }
    };

    const handleSave = () => {
        const current = +curSerial === 0 ? serialsLength + 1 : curSerial;
        Api.postWeekApi({ ...weekData, serialNumber: current }).then((e) => {
            messageApi.success(e?.data?.message || e?.message);
        }).catch((e) => {
            messageApi.error(e.message || '保存失败');
        })
    }

    const handleTargetSerial = (target: number) => {
        setCurSerial(target);
    }

    const handleSerialRange = () => {
        Api.getSerial().then(({ serialData = [] }) => {
            setSerials(serialData.reverse())
            // 获取周期长度返回
            setSerialsLength(serialData.length)
            // 获取周期时间范围返回
            const rangeMap: Record<number, { startTime: string; endTime: string }> = {}
            serialData.forEach((it: any) => {
                rangeMap[it.serialNumber] = {
                    startTime: it?.startTime,
                    endTime: it?.endTime
                }
            })
        })
    }

    const initData = (serial: number) => {
        Api.getWeekApi(serial).then(({ weekData, serialData }) => {
            const currentSerial = serialData.filter((it: { [key: string]: string }) => +it.serialNumber === curSerial)?.[0];
            const gap = getGapTime(currentSerial?.startTime, currentSerial?.endTime, 'day');
            const time = currentSerial ? `${currentSerial?.startTime} 至 ${currentSerial?.endTime} ${gap + 1}天` : '新周期';

            setWeekData({ ...weekData, time });
        })
    }

    useEffect(() => {
        initData(curSerial)
        handleSerialRange()
    }, [curSerial])

    return <div className="outer">
        {contextHolder}
        <div className="week">
            <h1 className='week-title'>LTN 周报</h1>
            <SerialsPicker onValueChange={handleSingleChange} value={curSerial} className='serial-week' serials={serials} />
        </div>
        <WeekDetailTextarea weekData={weekData} setWeekData={setWeekData} curSerial={curSerial} />
        <SerialsRangeEditModal curSerial={curSerial} serials={serials} onFresh={handleTargetSerial} />
        <Button type="primary" className='btn' onClick={handleSave}>保存</Button>
        {curSerial !== 0 && <WeekPeriodModal curSerial={curSerial} />}
    </div>
}