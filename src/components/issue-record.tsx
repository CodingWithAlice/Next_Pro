
import { Input } from "antd";
import { FormatDateToMonthDayWeek, formatMinToHM } from "./tool"
const { TextArea } = Input;
export default function IssueRecord({ study }: { study: number }) {
    function uniformTextAreaWithStyle(key: string, placeholder: string) {
        return <TextArea key={key} placeholder={placeholder} style={{ resize: 'both', overflow: 'auto' }} />
    }
    return (<div className='wrap'>
        <b>二、事项统计</b>
        <FormatDateToMonthDayWeek />
        <h4>前端学习时长：{formatMinToHM(study)} 🎉🎉🎉</h4>
        <section className='wrap'>
            【复盘】
            ①运动 + 电影：
            <section className='flex'>
                {[
                    { key: 'sport', placeholder: '运动情况' },
                    { key: 'movie', placeholder: '电影' }
                ].map(it => uniformTextAreaWithStyle(it.key, it.placeholder))}
            </section>
            ② 前端：
            {uniformTextAreaWithStyle('study', '前端学习情况')}
            ③ TED+阅读：
            <section className='flex'>
                {[
                    { key: 'ted', placeholder: 'TED主题' },
                    { key: 'read', placeholder: '阅读情况' }
                ].map(it => uniformTextAreaWithStyle(it.key, it.placeholder))}
            </section>
            【做得棒的3件事】
            {uniformTextAreaWithStyle('good', '积极心理学')}
            【今天有犯错吗？错误是纠正偏差的大好机会】
            {uniformTextAreaWithStyle('fix', '可以变得更好的事情')}
        </section>
    </div>)
}