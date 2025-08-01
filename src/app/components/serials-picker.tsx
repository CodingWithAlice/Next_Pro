import Api from "@/service/api";
import { Select } from "antd";
import { useCallback, useEffect, useState } from "react";

interface SerialsPickerProps {
    onValueChange: (v: number | number[]) => void;
    value: number | number[];
    onSerialsLength?: (v: number) => void;
    mode?: 'tags' | 'multiple';
    className: 'serial-week' | 'serial-month';
    duration?: number
}
export function SerialsPicker({ value, onValueChange, onSerialsLength, mode, className, duration }: SerialsPickerProps) {
    const [serials, setSerials] = useState<{ serialNumber: number, startTime: string, endTime: string }[]>([]);
    const [periodsDate, setPeriodsDate] = useState<string>('');    

    const calcPeriods = useCallback((v: number[]) => {
        if (Array.isArray(v)) {
            v.sort((a, b) => a - b); // 排序
            const start = serials.find((serial) => serial.serialNumber === v[0]);
            const end = serials.find((serial) => serial.serialNumber === v[v.length - 1]);
            
            if (start && end) {
                setPeriodsDate(`   ${start.startTime} 至 ${end.endTime}  共计${duration}天`);
            }
        }
    }, [serials, duration])

    useEffect(() => {
        if (Array.isArray(value)) {
            calcPeriods(value);
        }
    }, [value, calcPeriods])

    useEffect(() => {
        Api.getSerial().then(({ serialData }) => {
            setSerials(serialData.reverse());
            if (onSerialsLength) {
                onSerialsLength(serialData.length);
            }
        })
    }, [onSerialsLength])

    const onChange = (v: number | number[]) => {
        onValueChange(v);
        calcPeriods(v as number[]);
    }

    return <>
        {!!serials.length && <Select
            className={className}
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
                    label: `周期${it.serialNumber}`
                }))]}
        />}
        <div className={`${className}-br`}></div>
        {!!mode && periodsDate}
    </>
}