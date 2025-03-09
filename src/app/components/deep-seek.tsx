import Api from "@/service/api";
import { LoadingOutlined, OpenAIOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { useState } from "react";
import { SearchType } from "./tool";

export default function DeepSeek({ periods, handleChange, type }: {
    periods: number[],
    handleChange: (v: string) => void,
    type: SearchType
}) {
    const [deepseekLoading, setDeepseekLoading] = useState(false);

    const handleDeepSeek = () => {
        if (deepseekLoading) return;
        setDeepseekLoading(true);
        Api.getDeepSeekApi(periods.join(','), type).then(({ data }) => {
            setDeepseekLoading(false)
            handleChange(data);
        })
    }
    return <Button type="text" color="purple" variant="filled" onClick={handleDeepSeek}>
        <OpenAIOutlined />
        获取 deepseek 推荐 {deepseekLoading && <LoadingOutlined />}
    </Button>
}