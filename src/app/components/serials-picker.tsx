import { Select } from "antd";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
    buildSerialDisplayCatalog,
    formatSerialPickerLabel,
    groupSerialsByBelongYear,
    type SerialDisplayMeta,
} from "@lib/serial-display";

const PLANNED_CYCLE_DAYS = 14;

interface SerialsPickerProps {
    onValueChange: (v: number | number[]) => void;
    value: number | number[];
    mode?: 'tags' | 'multiple';
    className: 'serial-week' | 'serial-month';
    duration?: number;
    serials: { serialNumber: number, startTime: string, endTime: string }[];
    disabled?: boolean;
}

function SerialOptionLabel({ meta }: { meta: SerialDisplayMeta }): ReactNode {
    const text = formatSerialPickerLabel(meta);
    if (meta.days === PLANNED_CYCLE_DAYS) {
        return text;
    }
    return (
        <span className="serial-option-label">
            <span>{text}</span>
            <span className="serial-option-days">{meta.days}天</span>
        </span>
    );
}

export function SerialsPicker({ value, onValueChange, mode, className, duration, serials, disabled }: SerialsPickerProps) {
    const [periodsDate, setPeriodsDate] = useState<string>('');

    const displayCatalog = useMemo(
        () => buildSerialDisplayCatalog(serials),
        [serials]
    );

    const yearGroups = useMemo(
        () => groupSerialsByBelongYear(serials, displayCatalog),
        [serials, displayCatalog]
    );

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

    const onChange = (v: number | number[]) => {
        onValueChange(v);
        calcPeriods(v as number[]);
    }

    const nextSerialHint = serials.length
        ? Math.max(...serials.map((s) => +s.serialNumber)) + 1
        : 1;

    const options = useMemo(() => [
        {
            label: `新周期 #${nextSerialHint}`,
            value: 0,
        },
        ...yearGroups.map((g) => ({
            label: (
                <span className="serial-year-group">{g.year}</span>
            ),
            title: String(g.year),
            options: g.items.map((meta) => ({
                value: meta.serialNumber,
                label: <SerialOptionLabel meta={meta} />,
                title:
                    meta.days === PLANNED_CYCLE_DAYS
                        ? `全局#${meta.serialNumber}`
                        : `全局#${meta.serialNumber} · ${meta.days}天`,
            })),
        })),
    ], [yearGroups, nextSerialHint])

    return <>
        {!!serials.length && <Select
            className={className}
            onChange={onChange}
            value={value}
            mode={mode}
            disabled={disabled}
            popupMatchSelectWidth={false}
            options={options}
        />}
        <div className={`${className}-br`}></div>
        {!!mode && periodsDate}
    </>
}
