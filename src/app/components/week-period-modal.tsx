import { FieldTimeOutlined, RightOutlined } from "@ant-design/icons";
import { FloatButton, Modal } from "antd";
import Period from "@/week/period/page";
import { useState } from "react";
import Link from "next/link";


export function WeekPeriodModal({curSerial}: {curSerial: number}) {
    const [isModalOpen, setIsModalOpen] = useState(false);

    const showModal = () => {
        setIsModalOpen(true);
    };
    const handleCancel = () => {
        setIsModalOpen(false);
    };
    const titleNode = <Link href={`/week/period?serialNumber=${curSerial}`} >
        每日数据 <RightOutlined />
    </Link>;

    return <>
        <FloatButton
            shape="square"
            type="primary"
            style={{
                insetInlineEnd: 94,
            }}
            description="数据"
            icon={<FieldTimeOutlined />}
            onClick={showModal}
        />
        <Modal title={titleNode} open={isModalOpen} footer={null} onCancel={handleCancel} >
            <Period curSerial={curSerial} />
        </Modal>
    </>
}