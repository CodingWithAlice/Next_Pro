import Api from "@/service/api";
import { LoadingOutlined, OpenAIOutlined } from "@ant-design/icons";
import { Button, message } from "antd";
import { useState } from "react";

export default function DeepSeek({ periods, handleChange }: {
    periods: number[],
    handleChange: (v: string) => void,
}) {
    const [deepseekLoading, setDeepseekLoading] = useState(false);
    const [messageApi, contextHolder] = message.useMessage();


    const handleDeepSeek = () => {
        if (deepseekLoading) return;
        setDeepseekLoading(true);
        Api.getDeepSeekApi(periods.join(',')).then(({ data }) => {
            setDeepseekLoading(false)
            handleChange(data);
        }).catch(e => {
            setDeepseekLoading(false)
            messageApi.error(e?.message)
        })
    }
    return <>
        {contextHolder}
        <Button type="text" color="purple" variant="filled" onClick={handleDeepSeek}>
            <OpenAIOutlined />
            获取 deepseek 推荐 {deepseekLoading && <LoadingOutlined />}
        </Button>
    </>
}
