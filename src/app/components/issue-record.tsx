
import { Button, ConfigProvider, Input } from "antd";
import { FormatDateToMonthDayWeek, formatMinToHM, useStyle } from "@/components/tool"
import { ExperimentFilled } from "@ant-design/icons";
import { useState } from "react";
const { TextArea } = Input;

interface IssueRecordProps {
    sport: string,
    video: string,
    front: string,
    ted: string,
    reading: string,
    good1?: string,
    good2?: string,
    good: string,
    good3?: string,
    better: string,
}

interface UniformTextAreaWithStyleProps {
    type: keyof IssueRecordProps,
    placeholder: string,
    source: IssueRecordProps,
    emit: (type: string, value: string) => void
}

function UniformTextAreaWithStyle({ type, placeholder, source, emit }: UniformTextAreaWithStyleProps) {
    return <TextArea
        key={type}
        value={source[type]}
        onChange={(e) => emit(type, (e.target as HTMLTextAreaElement).value)}
        placeholder={placeholder}
        style={{
            resize: 'both',
            overflow: 'auto'
        }} />
}

export default function IssueRecord({ study }: { study: number }) {
    const { styles } = useStyle();
    const [data, setDate] = useState<IssueRecordProps>({
        sport: '',
        video: '',
        front: '',
        ted: '',
        reading: '',
        good: '',
        better: '',
    });

    const handleInput = (type: string, value: string) => {
        let change = { ...data, [type]: value };
        // 处理good字段
        if (type === 'good') {
            const list = value.split('，');
            const sup = list.reduce((pre: Partial<IssueRecordProps>, cur, index) => {
                const saveType = `good${index + 1}` as keyof IssueRecordProps;
                pre[saveType] = cur;
                return pre
            }, {} as Partial<IssueRecordProps>);
            change = { ...change, ...sup };
        }
        setDate(change);
    };

    const handleSave = () => {
        console.log('save', data);
    }

    const getTextArea = (key: keyof IssueRecordProps, placeholder: string) => <UniformTextAreaWithStyle key={key} type={key} placeholder={placeholder} source={data} emit={handleInput} />


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
                    { key: 'video', placeholder: '电影' }
                ].map(it => getTextArea(it.key as keyof IssueRecordProps, it.placeholder))}
            </section>
            ② 前端：
            {getTextArea('front', '前端学习情况')}
            ③ TED+阅读：
            <section className='flex'>
                {[
                    { key: 'ted', placeholder: 'TED主题' },
                    { key: 'reading', placeholder: '阅读情况' }
                ].map(it => getTextArea(it.key as keyof IssueRecordProps, it.placeholder))}
            </section>
            【做得棒的3件事】
            {getTextArea('good', '积极心理学')}
            【今天有犯错吗？错误是纠正偏差的大好机会】
            {getTextArea('better', '可以变得更好的事情')}
            <ConfigProvider
                button={{
                    className: styles.linearGradientButton,
                }}
            >
                <div className='btn-group'>
                    <Button onClick={handleSave} type="primary" icon={<ExperimentFilled />}>
                        保存☞☞☞观察自己数据库
                    </Button>
                </div>
            </ConfigProvider>
        </section>
    </div>)
}