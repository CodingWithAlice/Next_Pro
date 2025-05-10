import Api from "@/service/api";
import { Button, Input, message, Space } from "antd";
import dayjs from "dayjs";
import { useState } from "react";

export default function TedNewRecord({ id, fresh }: { id: number, fresh: () => void }) {
    const [record, serRecord] = useState('')
    const [messageApi, contextHolder] = message.useMessage();

    // 提交新的ted记录
    const handleAddNotes = () => {
        Api.postTedRecord({ tedId: id, record, date: dayjs().toDate() }).then((res) => {            
            if (res?.message) {
                messageApi.success(res?.message)
            }
            fresh()
        })
    }

    return <Space.Compact style={{ width: '100%' }}>
                {contextHolder}

        <Input onChange={(e) => serRecord(e.target.value)} />
        <Button color="cyan" variant="filled" onClick={handleAddNotes}>新增</Button>
    </Space.Compact>

}