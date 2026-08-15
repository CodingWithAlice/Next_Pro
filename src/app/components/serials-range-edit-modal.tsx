import { FormOutlined } from "@ant-design/icons";
import { FloatButton, Input, Modal, message } from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import Api from "@/service/api";
import { SerialsPicker } from "./serials-picker";

type SerialRangeItem = { serialNumber: number; startTime: string; endTime: string };

const RECENT_EDITABLE_COUNT = 3;

function toDateInputValue(value?: string) {
    if (!value) return dayjs().format('YYYY-MM-DD');
    return dayjs(value).isValid() ? dayjs(value).format('YYYY-MM-DD') : value;
}

export default function SerialsRangeEditModal({
    curSerial = 0,
    onFresh,
    serials = [],
}: {
    curSerial?: number;
    onFresh?: (serial: number) => void;
    serials: SerialRangeItem[];
}) {
    const [modalShow, setModalShow] = useState(false);
    const [currentSerial, setCurrentSerial] = useState<number>(curSerial);
    const [start, setStart] = useState<string>(toDateInputValue());
    const [end, setEnd] = useState<string>(toDateInputValue());
    const [saving, setSaving] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();

    const recentSerialNumbers = useMemo(() => {
        const nums = serials
            .map((it) => +it.serialNumber)
            .sort((a, b) => b - a)
            .slice(0, RECENT_EDITABLE_COUNT);
        return new Set(nums);
    }, [serials]);

    const currentRange = useMemo(
        () => serials.find((it) => +it.serialNumber === currentSerial),
        [serials, currentSerial]
    );

    const hasExistingRange = !!(currentRange?.startTime && currentRange?.endTime);
    // 新周期、尚未填写起止、或最近三个周期可编辑
    const isEditable =
        currentSerial === 0 || !hasExistingRange || recentSerialNumbers.has(currentSerial);

    const changeModalShow = (status: boolean) => {
        if (status) {
            const target = serials.find((it) => +it.serialNumber === curSerial);
            setCurrentSerial(curSerial);
            setStart(toDateInputValue(target?.startTime));
            setEnd(toDateInputValue(target?.endTime));
        }
        setModalShow(status);
    };

    const updateRange = () => {
        if (!isEditable || saving) return;

        const validSerial =
            currentSerial === 0
                ? Math.max(0, ...serials.map((it) => +it?.serialNumber)) + 1
                : currentSerial;
        const params = {
            serialNumber: validSerial,
            startTime: start,
            endTime: end,
        };

        setSaving(true);
        Api.postSerialApi(params)
            .then((e) => {
                changeModalShow(false);
                onFresh?.(e?.data?.targetSerial);
                messageApi.success(e?.data?.message || e?.message);
            })
            .catch((e) => {
                messageApi.error(e?.message || '更新周期时间失败');
            })
            .finally(() => {
                setSaving(false);
            });
    };

    const handleSerialChange = (value: number | number[]) => {
        if (typeof value === 'number') {
            setCurrentSerial(value);
        }
    };

    // 仅在切换周期或列表刷新时同步，避免输入过程中被原值覆盖导致光标跳到末尾
    useEffect(() => {
        if (!modalShow) return;
        const target = serials.find((it) => +it.serialNumber === currentSerial);
        setStart(toDateInputValue(target?.startTime));
        setEnd(toDateInputValue(target?.endTime));
    }, [currentSerial, serials, modalShow]);

    return (
        <>
            <FloatButton
                shape="square"
                type="primary"
                style={{
                    insetInlineEnd: 154,
                }}
                description="周期"
                icon={<FormOutlined />}
                onClick={() => changeModalShow(true)}
            />
            <Modal
                title="周期起止时间修改"
                open={modalShow}
                onOk={updateRange}
                onCancel={() => changeModalShow(false)}
                okButtonProps={{ disabled: !isEditable, loading: saving }}
            >
                {contextHolder}
                <div className="serial-range-edit">
                    <SerialsPicker
                        onValueChange={handleSerialChange}
                        serials={serials}
                        value={currentSerial}
                        className="serial-week"
                    />
                    <Input
                        placeholder="开始日期 YYYY-MM-DD"
                        value={start}
                        style={{ width: '30%' }}
                        onChange={(e) => setStart(e.target.value)}
                        disabled={!isEditable}
                        allowClear={isEditable}
                    />
                    <Input
                        placeholder="结束日期 YYYY-MM-DD"
                        value={end}
                        style={{ width: '30%' }}
                        onChange={(e) => setEnd(e.target.value)}
                        disabled={!isEditable}
                        allowClear={isEditable}
                    />
                </div>
            </Modal>
        </>
    );
}
