"use client";
import TextArea from "antd/es/input/TextArea";
import './app.css';
import { Button } from "antd";
import { useState } from "react";

// 统一标题样式
function transTitle(title: string) {
    return <span key={title} className="title">{title}</span>
}

// 统一 textarea 样式
function UniformTextAreaWithStyle({ key, desc, init, onChange }: { key: string, desc: string, init: string, onChange: (data: { [key: string]: string }) => void }) {
    const [text, setText] = useState<string>(init);
    const handleText = (type: string, value: string) => {
        console.log(type, value);
        setText(value);
        onChange({ [type]: value });
    }

    return <div className="textarea" key={key}>
        {desc && <span className="desc">{desc}:</span>}
        <TextArea
            key={key}
            style={{ resize: 'both', overflow: 'auto' }}
            rows={1}
            onChange={(e) => handleText(key, e.target.value)}
            value={text} />
    </div>
}

export default function Week() {
    const [data, setData] = useState<{ [key: string]: string }>({});

    const handleChange = (v) => {
        console.log(1111111, v);
        // setData(...data, [key]: value);
    }
    const transTextArea = (it: { key: string, desc: string }) => {
        return <UniformTextAreaWithStyle key={it.key} desc={it.desc} init={data?.[it.key] || ''} onChange={handleChange} />
    };

    const handleSave = () => {
        console.log(data);
    }


    return <div className="outer">
        <h1 className="week">周报</h1>
        <section className='wrap'>
            {transTextArea({ key: 'time', desc: '周期' })}
            {transTitle('【学习内容前端】')}
            {[
                { key: 'conclusion', desc: '概况' },
                { key: 'goodThings', desc: '做得棒的地方' },
                { key: 'toBeBetter', desc: '可以做得更好的地方' }
            ].map(it => transTextArea(it))}

            {transTitle('【睡眠 + 运动 + 电影】')}
            {[
                { key: 'sleep', desc: '睡眠情况' },
                { key: 'sport', desc: '运动情况' },
                { key: 'movie', desc: '电影' }
            ].map(it => transTextArea(it))}
            {transTitle('【TED + 阅读 + 播客】')}

            {[
                { key: 'ted', desc: 'TED主题' },
                { key: 'read', desc: '阅读情况' }
            ].map(it => transTextArea(it))}

            {transTitle('【学习方法复盘和改进】')}
            {transTextArea({ key: 'good', desc: '' })}

            {transTitle('【本周期做得不错的地方】')}
            {transTextArea({ key: 'fix', desc: '' })}

            {transTitle('【下周主要学习的内容】')}
            {transTextArea({ key: 'nextWeek', desc: '' })}
        </section>
        <Button type="primary" className='btn' onClick={handleSave}>保存</Button>
    </div>
}