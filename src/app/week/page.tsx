import TextArea from "antd/es/input/TextArea";
import './app.css';

export default function Week() {
    function Week() {
        function uniformTextAreaWithStyle(key: string, desc: string) {
            return <div className="textarea">
                {desc && <span className="desc">{desc}:</span>}
                <TextArea key={key} style={{ resize: 'both', overflow: 'auto' }} rows={1} /></div>
        }
        function transTitle(title: string) {
            return <span className="title">{title}</span>
        }
        return (<div className="outer">
            <h1 className="week">周报</h1>
            <section className='wrap'>
                {transTitle('【学习内容前端】')}
                {[
                    { key: 'conclusion', desc: '概况' },
                    { key: 'goodThings', desc: '做得棒的地方' },
                    { key: 'toBeBetter', desc: '可以做得更好的地方' }
                ].map(it => uniformTextAreaWithStyle(it.key, it.desc))}
                
                {transTitle('【睡眠 + 运动 + 电影】')}
                {[
                    { key: 'sleep', placeholder: '睡眠情况' },
                    { key: 'sport', placeholder: '运动情况' },
                    { key: 'movie', placeholder: '电影' }
                ].map(it => uniformTextAreaWithStyle(it.key, it.placeholder))}
                {transTitle('【TED + 阅读 + 播客】')}

                {[
                    { key: 'ted', placeholder: 'TED主题' },
                    { key: 'read', placeholder: '阅读情况' }
                ].map(it => uniformTextAreaWithStyle(it.key, it.placeholder))}
                
                {transTitle('【学习方法复盘和改进】')}
                {uniformTextAreaWithStyle('good', '')}
                
                {transTitle('【本周期做得不错的地方】')}
                {uniformTextAreaWithStyle('fix', '')}
                
                {transTitle('【下周主要学习的内容】')}
                {uniformTextAreaWithStyle('nextWeek', '')}
            </section>
        </div>)
    }
    return <Week />
}