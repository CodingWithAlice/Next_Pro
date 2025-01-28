"use client";
import TextArea from "antd/es/input/TextArea";
import './app.css';
import { Button, Select } from "antd";
import { useEffect, useState } from "react";
import Api from "@/service/api";

// 统一标题样式
function transTitle(title: string) {
    return <span key={title} className="title">{title}</span>
}

// 统一 textarea 样式
function UniformTextAreaWithStyle({ type, desc, init, onChange }: { type: string, desc: string, init: string, onChange: (data: { [key: string]: string }) => void }) {
    const handleText = (type: string, value: string) => {
        onChange({ [type]: value });
    }

    return <div className="textarea" key={type}>
        {desc && <span className="desc">{desc}:</span>}
        <TextArea
            key={type}
            style={{ resize: 'both', overflow: 'auto' }}
            rows={1}
            onChange={(e) => handleText(type, e.target.value)}
            value={init}
            disabled={type === 'time'} />
    </div>
}

export default function Week() {
    const [weekData, setWeekData] = useState<{ [key: string]: string }>({});
    const [serials, setSerials] = useState([]);
    const [curSerial, setCurSerial] = useState(0);
    const handleChange = (v: { [key: string]: string }) => {
        setWeekData({ ...weekData, ...v });
    }
    const transTextArea = (it: { key: string, desc?: string, source: { [key: string]: string } }) => {
        return <UniformTextAreaWithStyle key={it.key} type={it.key} desc={it.desc || ''} init={it.source?.[it.key] || ''} onChange={(v) => handleChange(v)} />
    };

    const handleTrans = (it: { key: string, desc?: string }, source: { [key: string]: string }) => {
        return transTextArea({ ...it, source });
    }

    const handleSave = () => {
        const current = +curSerial === 0 ? serials.length + 1 : curSerial;
        Api.postWeekApi({ ...weekData, serialNumber: current }).then((res) => {
            console.log('post', res);
        })
    }

    useEffect(() => {

        Api.getWeekApi(curSerial).then(({ weekData, serialData }) => {
            setSerials(serialData.reverse());

            const currentSerial = serialData.filter((it: { [key: string]: string }) => +it.serialNumber === curSerial)?.[0];            
            const time = currentSerial ? `${currentSerial?.startTime} 至 ${currentSerial?.endTime}` : '新周期';
            setWeekData({ ...weekData, time });
        })
    }, [curSerial])

    return <div className="outer">
        <div className="week">
            <h1>LTN 周报</h1>
            {!!serials.length && <Select
                className="select"
                onChange={setCurSerial}
                value={curSerial}
                options={[
                    {
                        label: '新-LTN' + (serials.length + 1),
                        value: 0
                    },
                    ...serials.map((it: { serialNumber: number }) => ({
                        value: +it?.serialNumber,
                        label: `LTN周期${it.serialNumber}`
                    }))]}
            />}
        </div>
        <section className='wrap'>
            {handleTrans({ key: 'time', desc: '周期' }, weekData)}
            {transTitle('【学习内容前端】')}
            {[
                { key: 'frontOverview', desc: '前端概况' },
                { key: 'frontWellDone', desc: '做得棒的地方' },
                { key: 'toBeBetter', desc: '可以做得更好的地方' }
            ].map(it => handleTrans(it, weekData))}

            {transTitle('【睡眠 + 运动 + 电影】')}
            {[
                { key: 'sleep', desc: '睡眠情况' },
                { key: 'sport', desc: '运动情况' },
                { key: 'movie', desc: '电影' }
            ].map(it => handleTrans(it, weekData))}
            {transTitle('【TED + 阅读 + 播客】')}

            {[
                { key: 'ted', desc: 'TED主题' },
                { key: 'read', desc: '阅读情况' }
            ].map(it => handleTrans(it, weekData))}

            {transTitle('【学习方法复盘和改进】')}
            {handleTrans({ key: 'improveMethods' }, weekData)}

            {transTitle('【本周期做得不错的地方】')}
            {handleTrans({ key: 'wellDone' }, weekData)}

            {transTitle('【下周主要学习的内容】')}
            {handleTrans({ key: 'nextWeek' }, weekData)}
        </section>
        <Button type="primary" className='btn' onClick={handleSave}>保存</Button>
    </div>
}