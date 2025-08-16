import { FormOutlined } from "@ant-design/icons";
import { FloatButton, Input, Modal } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import Api from "@/service/api";
import { SerialsPicker } from "./serials-picker";

export default function SerialsRangeEditModal({ curSerial = 0 }: { curSerial?: number }) {
    const [modalShow, setModalShow] = useState(false);
    const [serial, setSerial] = useState<number>(curSerial);
    const [start, setStart] = useState<string>(dayjs().format('YYYY-MM-DD'));
    const [end, setEnd] = useState<string>(dayjs().format('YYYY-MM-DD'));
    const [serialsMap, setSerialsMap] = useState<Record<number, { startTime: string; endTime: string }>>({});

    // 切换弹窗状态
    const changeModalShow = (status: boolean) => {
        setModalShow(status);
    };

    const updateRange = () => {
        const params = {
            serialNumber: serial,
            startTime: start,
            endTime: end
        }
        // Api.getDailyApi(params).then(res => { // todo
        //     changeModalShow(false)
        // }).catch(e => {
        //     console.error('更新周期时间失败:', e);
        // })
    }

    // 切换周期
    const handleSerialChange = (value: number | number[]) => {
        if (typeof value === 'number') {
            setSerial(value);
        }
    };

    // 周期范围
    const handleRangeChange = (range: Record<number, { startTime: string; endTime: string }>) => {
        setSerialsMap(range);
    }

    // 初始化查询今日做题记录
    // useEffect(() => {
    //     if (modalShow) {
    //         updateRange();
    //     }
    // }, [modalShow])

    const rangeMap: Record<string, { value: string; onChange: (e: any) => void }> = {
        start: {
            value: serialsMap[serial]?.startTime || start,
            onChange: (e: any) => { setStart(e.target.value) },
        },
        end: {
            value: serialsMap[serial]?.endTime || end,
            onChange: (e: any) => { setEnd(e.target.value) },
        }
    }
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
            <div className="serial-range-edit">
                <SerialsPicker onValueChange={handleSerialChange} value={serial} onRange={handleRangeChange} className='serial-week' />

                {Object.keys(rangeMap).map((it) => {
                    const { value = '', onChange = () => { } } = rangeMap?.[it] || {};
                    return <Input
                        key={it}
                        placeholder={`周期${it}时间`}
                        value={value}
                        style={{ width: '30%' }}
                        onChange={onChange}
                        allowClear
                    />
                })}
            </div>
        </Modal>
    </>
}