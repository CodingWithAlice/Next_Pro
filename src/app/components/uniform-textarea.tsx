import { QuestionCircleOutlined } from "@ant-design/icons";
import { Tooltip } from "antd";
import TextArea from "antd/es/input/TextArea";


interface UniformTextAreaWithStyleProps {
    type: string,
    desc: string,
    tip?: string,
    init: string | number,
    onChange: (data: { [key: string]: string }) => void,
    cols?: number
}

// 统一 textarea 样式
export function UniformTextAreaWithStyle({ type, desc, tip, init, onChange, cols }: UniformTextAreaWithStyleProps) {
    const handleText = (type: string, value: string) => {
        onChange({ [type]: value });
    }

    return <div className="textarea" key={type}>
        {desc && <span className="desc">
            {desc}
            {tip && <Tooltip title={tip}> <QuestionCircleOutlined /> </Tooltip>}
            :
        </span>}
        <TextArea
            key={type}
            style={{ resize: 'both' }}
            rows={1}
            onChange={(e) => handleText(type, e.target.value)}
            value={init}
            cols={cols}
            disabled={type === 'time'}
            autoSize={{ minRows: 1, maxRows: 20 }} />
    </div>
}