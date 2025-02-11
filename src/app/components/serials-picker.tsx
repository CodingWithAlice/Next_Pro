import Api from "@/service/api";
import { Select } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";

interface SerialsPickerProps {
    onValueChange: (v: number | number[]) => void;
    value: number | number[];
    onSerialsLength?: (v: number) => void;
    mode?: 'tags' | 'multiple';
}
export function SerialsPicker({ value, onValueChange, onSerialsLength, mode }: SerialsPickerProps) {
    const [serials, setSerials] = useState<{ serialNumber: number, startTime: string, endTime: string }[]>([]);
    const [periodsDate, setPeriodsDate] = useState<string>('');

    useEffect(() => {
        Api.getSerial().then(({ serialData }) => {
            setSerials(serialData.reverse());
            if (onSerialsLength) {
                onSerialsLength(serialData.length);
            }
        })
    }, [])

    const onChange = (v: number | number[]) => {
        onValueChange(v);
        if (Array.isArray(v)) {
            v.sort((a, b) => a - b); // 排序
            const start = serials.find((serial) => serial.serialNumber === v[0]);
            const end = serials.find((serial) => serial.serialNumber === v[v.length - 1]);
            if (start && end) {
                const gap = dayjs(end.endTime).diff(dayjs(start.startTime), 'day');
                setPeriodsDate(`   ${start.startTime} 至 ${end.endTime}  共计${gap}天`);
            }
        }
    }

    return <>
        {!!serials.length && <Select
            className="select"
            onChange={onChange}
            value={value}
            mode={mode}
            options={[
                {
                    label: '新-LTN' + (serials.length + 1),
                    value: 0
                },
                ...serials.map((it: { serialNumber: number }) => ({
                    value: +it?.serialNumber,
                    label: `LTN周期${it.serialNumber}`
                }))]}
        />}
        {!!mode && periodsDate}
    </>
}