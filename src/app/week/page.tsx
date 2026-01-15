"use client";
import './app.css';
import { Button, message } from "antd";
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useEffect, useState } from "react";
import Api from "@/service/api";
import { SerialsPicker } from "@/components/serials-picker";
import { WeekDetailTextarea } from '@/components/week-detail-textarea';
import { WeekPeriodModal } from '@/components/week-period-modal';
import { getGapTime } from '@/components/tool';
import SerialsRangeEditModal from '@/components/serials-range-edit-modal';
import Link from 'next/link';

export default function Week() {
    const [weekData, setWeekData] = useState<{ [key: string]: string }>({});
    const [curSerial, setCurSerial] = useState<number>(0);
    const [serialsLength, setSerialsLength] = useState(0);
    const [loading, setLoading] = useState<boolean>(false);
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

    // 获取上一个周期（更早的周期，编号更小）
    const getPrevSerial = (): number | null => {
        if (serials.length === 0) return null;

        if (curSerial === 0) {
            // 当前是新周期（最新的），上一个周期是 serials 中第一个（最大的编号）
            return serials[0]?.serialNumber || null;
        }

        // 找到当前周期在 serials 中的位置
        // serials 是从大到小排列的，所以索引越大的周期编号越小（越早）
        const currentIndex = serials.findIndex(s => s.serialNumber === curSerial);
        if (currentIndex === -1) return null;

        // 如果后面还有周期（索引更大），返回它（编号更小，更早）
        if (currentIndex < serials.length - 1) {
            return serials[currentIndex + 1]?.serialNumber || null;
        }

        return null; // 已经是最早的周期
    }

    // 获取下一个周期（更晚的周期，编号更大）
    const getNextSerial = (): number | null => {
        if (serials.length === 0) return null;

        if (curSerial === 0) {
            // 当前是新周期，下一个周期不存在（新周期是最新的）
            return null;
        }

        // 找到当前周期在 serials 中的位置
        const currentIndex = serials.findIndex(s => s.serialNumber === curSerial);
        if (currentIndex === -1) return null;

        // 如果前面还有周期（索引更小），返回它（编号更大，更晚）
        if (currentIndex > 0) {
            return serials[currentIndex - 1]?.serialNumber || null;
        }

        // 如果已经是 serials[0]（最新的周期），下一个是新周期
        return 0;
    }

    const handlePrevSerial = () => {
        const prevSerial = getPrevSerial();
        if (prevSerial !== null && !loading) {
            setCurSerial(prevSerial);
        }
    }

    const handleNextSerial = () => {
        const nextSerial = getNextSerial();
        if (nextSerial !== null && !loading) {
            setCurSerial(nextSerial);
        }
    }

    const handleSerialRange = () => {
        return Api.getSerial().then(({ serialData = [] }) => {
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
        }).catch((e) => {
            messageApi.error(e.message || '加载周期列表失败');
            throw e;
        })
    }

    const initData = (serial: number) => {
        return Api.getWeekApi(serial).then(({ weekData, serialData }) => {
            const currentSerial = serialData.filter((it: { [key: string]: string }) => +it.serialNumber === serial)?.[0];
            const gap = getGapTime(currentSerial?.startTime, currentSerial?.endTime, 'day');
            const time = currentSerial ? `${currentSerial?.startTime} 至 ${currentSerial?.endTime} ${gap + 1}天` : '新周期';

            setWeekData({ ...weekData, time });
        }).catch((e) => {
            messageApi.error(e.message || '加载数据失败');
            throw e;
        })
    }

    useEffect(() => {
        // 当周期改变时，同时加载数据和周期列表
        setLoading(true);
        Promise.all([
            initData(curSerial),
            handleSerialRange()
        ]).finally(() => {
            setLoading(false);
        })
    }, [curSerial])

    const prevSerial = getPrevSerial();
    const nextSerial = getNextSerial();
    const canGoPrev = prevSerial !== null && !loading;
    const canGoNext = nextSerial !== null && !loading;

    return <div className="outer">
        {contextHolder}
        <div className="week">
            <Button
                icon={<LeftOutlined />}
                onClick={handlePrevSerial}
                disabled={!canGoPrev}
                loading={loading}
                size="small"
                className="serial-nav-btn"
            >
                上周
            </Button>
            <h1 className='week-title'>
                <Link href="/" className="home-link-title">双周报</Link>
            </h1>
            <div className="serial-navigation">

                <SerialsPicker onValueChange={handleSingleChange} value={curSerial} className='serial-week' serials={serials} disabled={loading} />
                <Button
                    icon={<RightOutlined />}
                    onClick={handleNextSerial}
                    disabled={!canGoNext}
                    loading={loading}
                    size="small"
                    className="serial-nav-btn"
                >
                    下周
                </Button>
            </div>
        </div>
        <WeekDetailTextarea weekData={weekData} setWeekData={setWeekData} curSerial={curSerial} />
        <SerialsRangeEditModal curSerial={curSerial} serials={serials} onFresh={handleTargetSerial} />
        <Button type="primary" className='btn' onClick={handleSave}>保存</Button>
        {curSerial !== 0 && <WeekPeriodModal curSerial={curSerial} />}
    </div>
}