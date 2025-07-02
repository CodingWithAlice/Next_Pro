import DeepSeek from "./deep-seek";
import { transTextArea, transTitle } from "./tool"
interface WeekDetailTextareaProps {
    weekData: { [key: string]: string },
    setWeekData: (data: { [key: string]: string }) => void,
    curSerial: number
}

export function WeekDetailTextarea({ weekData, setWeekData, curSerial }: WeekDetailTextareaProps) {
    const handleTrans = (it: { key: string, desc?: string }, source: { [key: string]: string }) => {
        return transTextArea({ ...it, source, onChange: handleChange });
    }

    const handleChange = (v: { [key: string]: string }) => {
        setWeekData({ ...weekData, ...v });
    }

    const handleDeepSeek = (data: string) => {
        setWeekData({ ...weekData, ...JSON.parse(data) });
    }

    return <section className='wrap'>
        <div className='deep-seek'>
            <DeepSeek type='week' handleChange={handleDeepSeek} periods={[curSerial]} />
            {handleTrans({ key: 'time', desc: '周期' }, weekData)}
        </div>
        {transTitle('【学习内容前端】')}
        {[
            { key: 'frontOverview', desc: '前端概况' },
            { key: 'frontWellDone', desc: '前端做得棒的地方' },
            { key: 'toBeBetter', desc: '学习/工作改进方向' }
        ].map(it => handleTrans(it, weekData))}

        {transTitle('【睡眠 + 运动 + 电影】')}
        {[
            { key: 'sleep', desc: '睡眠情况' },
            { key: 'sport', desc: '运动情况' },
            { key: 'movie', desc: '电影/纪录片' }
        ].map(it => handleTrans(it, weekData))}
        {transTitle('【TED + 阅读】')}

        {[
            { key: 'ted', desc: 'TED主题' },
            { key: 'read', desc: '阅读情况' }
        ].map(it => handleTrans(it, weekData))}

        {transTitle('【生活事件复盘与改进】')}
        {handleTrans({ key: 'improveMethods' }, weekData)}

        {transTitle('【生活中做得好的事儿】')}
        {handleTrans({ key: 'wellDone' }, weekData)}

        {transTitle('【下周期主要精进的内容】')}
        {handleTrans({ key: 'nextWeek' }, weekData)}
    </section>
}