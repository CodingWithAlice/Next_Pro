import { FormOutlined } from "@ant-design/icons";
import { FloatButton, Input, Modal, message } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import Api from "@/service/api";
import { SerialsPicker } from "./serials-picker";

export default function SerialsRangeEditModal({ curSerial = 0, onFresh, serials = [] }: { curSerial?: number, onFresh?: (serial: number) => void, serials: { serialNumber: number, startTime: string, endTime: string }[] }) {
    const [modalShow, setModalShow] = useState(false);
    const [currentSerial, setCurrentSerial] = useState<number>(curSerial);
    const [rangeMap, setRangeMap] = useState<Record<string, { value: string; onChange: (e: any) => void }>>({});
    const [start, setStart] = useState<string>(dayjs().format('YYYY-MM-DD'));
    const [end, setEnd] = useState<string>(dayjs().format('YYYY-MM-DD'));
    const [messageApi, contextHolder] = message.useMessage();

    // 切换弹窗状态
    const changeModalShow = (status: boolean) => {
        setModalShow(status);
    };

    const updateRange = () => {
        const validSerial = currentSerial === 0 ? Math.max(...serials.map(it => +it?.serialNumber)) + 1 : currentSerial;
        const params = {
            serialNumber: validSerial,
            startTime: start,
            endTime: end
        }

        Api.postSerialApi(params).then(e => {
            changeModalShow(false)
            onFresh && onFresh(e?.data?.targetSerial);
            messageApi.success(e?.data?.message || e?.message);
        }).catch(e => {
            messageApi.error('更新周期时间失败:', e);
        })
    }

    // 切换周期
    const handleSerialChange = (value: number | number[]) => {
        if (typeof value === 'number') {
            setCurrentSerial(value);
        }
    };

    useEffect(() => {
        const getTargetSerial = (cur: number) => serials.find(it => +it.serialNumber === cur);
        setRangeMap({
            start: {
                value: getTargetSerial(currentSerial)?.startTime || start,
                onChange: (e: any) => { setStart(e.target.value) },
            },
            end: {
                value: getTargetSerial(currentSerial)?.endTime || end,
                onChange: (e: any) => { setEnd(e.target.value) },
            },
        })
    }, [serials, currentSerial, start, end])

    return <>
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
        >
            {contextHolder}
            <div className="serial-range-edit">
                <SerialsPicker onValueChange={handleSerialChange} serials={serials} value={currentSerial} className='serial-week' />
                {Object.keys(rangeMap)?.length > 0 && Object.keys(rangeMap).map((it) => {
                    const { value: targetValue = '', onChange: targetChange = () => { } } = rangeMap?.[it] || {};
                    return <Input
                        key={it}
                        placeholder={`周期${it}时间`}
                        value={targetValue}
                        style={{ width: '30%' }}
                        onChange={targetChange}
                        allowClear
                    />
                })}
            </div>
        </Modal>
    </>
}