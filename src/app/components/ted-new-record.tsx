import Api from "@/service/api";
import { Button, message, Space } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { transTextArea } from "./tool"
import { useCanEdit, ViewOnlyTooltip } from "./capability-context";

export default function TedNewRecord({ id, fresh }: { id: number, fresh: () => void }) {
    const [record, serRecord] = useState('')
    const [messageApi, contextHolder] = message.useMessage();
    const canEdit = useCanEdit('ted');

    // 提交新的ted记录
    const handleAddNotes = () => {
        Api.postTedRecord({ tedId: id, record, date: dayjs().format('YYYY-MM-DD') }).then((res) => {
            if (res?.message) {
                messageApi.success(res?.message)
                serRecord('')
            }
            fresh()
        })
    }

    return <Space.Compact style={{ width: '100%' }}>
        {contextHolder}
        {transTextArea({
            key: `record_${id}`,
            onChange: (v) => serRecord(v[`record_${id}`]),
            source: { [`record_${id}`]: record },
            readOnly: !canEdit,
        })}
        <ViewOnlyTooltip viewOnly={!canEdit}>
            <Button className="button" color="cyan" variant="filled" onClick={handleAddNotes} disabled={!canEdit}>新增</Button>
        </ViewOnlyTooltip>
    </Space.Compact>

}