import { Select } from "antd";

interface SerialsPickerProps {
    serials: { serialNumber: number }[];
    setCurSerial: (v: number) => void;
    curSerial: number;
}
export function SerialsPicker({serials, setCurSerial, curSerial}: SerialsPickerProps) {
    return <>
    {!!serials.length && <Select
                className="select"
                onChange={setCurSerial}
                value={curSerial}
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