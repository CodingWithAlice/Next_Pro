import TextArea from "antd/es/input/TextArea";


interface UniformTextAreaWithStyleProps {
    type: string,
    desc: string,
    init: string,
    onChange: (data: { [key: string]: string }) => void
}

// 统一 textarea 样式
export function UniformTextAreaWithStyle({ type, desc, init, onChange }: UniformTextAreaWithStyleProps) {
    const handleText = (type: string, value: string) => {
        onChange({ [type]: value });
    }

    return <div className="textarea" key={type}>
        {desc && <span className="desc">{desc}:</span>}
        <TextArea
            key={type}
            style={{ resize: 'both' }}
            rows={1}
            onChange={(e) => handleText(type, e.target.value)}
            value={init}
            disabled={type === 'time'}
            autoSize={{ minRows: 1, maxRows: 15 }} />
    </div>
}