import TextArea from "antd/es/input/TextArea";
interface MonthDetailTextareaProps {
    monthData: { [key: string]: string },
    setMonthData: (data: { [key: string]: string }) => void
}

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
            style={{ resize: 'both' }}
            rows={1}
            onChange={(e) => handleText(type, e.target.value)}
            value={init}
            disabled={type === 'time'}
            autoSize={{ minRows: 1, maxRows: 15 }} />
    </div>
}
export function MonthDetailTextarea({ monthData, setMonthData }: MonthDetailTextareaProps) {
    const transTextArea = (it: { key: string, desc?: string, source: { [key: string]: string } }) => {
        return <UniformTextAreaWithStyle key={it.key} type={it.key} desc={it.desc || ''} init={it.source?.[it.key] || ''} onChange={(v) => handleChange(v)} />
    };

    const handleTrans = (it: { key: string, desc?: string }, source: { [key: string]: string }) => {
        return transTextArea({ ...it, source });
    }

    const handleChange = (v: { [key: string]: string }) => {
        setMonthData({ ...monthData, ...v });
    }

    return <section className='wrap'>
        {handleTrans({ key: 'time', desc: '周期' }, monthData)}
        {transTitle('【学习内容前端】')}
        {[
            { key: 'frontOverview', desc: '前端概况' },
            { key: 'frontWellDone', desc: '做得棒的地方' },
            { key: 'toBeBetter', desc: '可以做得更好的地方' }
        ].map(it => handleTrans(it, monthData))}

        {transTitle('【睡眠 + 运动 + 电影】')}
        {[
            { key: 'sleep', desc: '睡眠情况' },
            { key: 'sport', desc: '运动情况' },
            { key: 'movie', desc: '电影' }
        ].map(it => handleTrans(it, monthData))}
        {transTitle('【TED + 阅读 + 播客】')}

        {[
            { key: 'ted', desc: 'TED主题' },
            { key: 'read', desc: '阅读情况' }
        ].map(it => handleTrans(it, monthData))}

        {transTitle('【学习方法复盘和改进】')}
        {handleTrans({ key: 'improveMethods' }, monthData)}

        {transTitle('【本周期做得不错的地方】')}
        {handleTrans({ key: 'wellDone' }, monthData)}

        {transTitle('【下周主要学习的内容】')}
        {handleTrans({ key: 'nextWeek' }, monthData)}
    </section>
}