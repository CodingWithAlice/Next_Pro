import Api from "@/service/api";
import { Select } from "antd";
import { useEffect, useState } from "react";

interface SerialsPickerProps {
    onValueChange: (v: number | number[]) => void;
    value: number | number[];
    onSerialsLength?: (v: number) => void;
    mode?: 'tags' | 'multiple';
}
export function SerialsPicker({ value, onValueChange, onSerialsLength, mode }: SerialsPickerProps) {
    const [serials, setSerials] = useState<{ serialNumber: number }[]>([]);
    useEffect(() => {
        Api.getSerial().then(({ serialData }) => {
            setSerials(serialData.reverse());
            if (onSerialsLength) {
                onSerialsLength(serialData.length);
            }
        })
    }, [])

    return <>
        {!!serials.length && <Select
            className="select"
            onChange={onValueChange}
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
        />}</>
}