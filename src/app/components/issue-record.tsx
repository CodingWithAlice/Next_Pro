
import { Button, Input, message } from "antd";
import { FormatDateToMonthDayWeek, formatMinToHM, IssueRecordProps } from "@/components/tool"
import { ExperimentFilled } from "@ant-design/icons";
import Api from "@/service/api";
const { TextArea } = Input;
import { getCurrentBySub } from "@/components/tool";
import config from "config";

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
        }}
        autoSize={{ minRows: 1, maxRows: 12 }}
    />
}

export default function IssueRecord({ study, issueData, setIssueData }: { study: number, issueData: IssueRecordProps, setIssueData: (data: IssueRecordProps) => void }) {
    const [messageApi, contextHolder] = message.useMessage();
    // const { styles } = useStyle();

    const handleInput = (type: string, value: string) => {
        const change = { ...issueData, [type]: value };
        setIssueData(change);
    };

    const handleSave = () => {
        Api.postIssueApi({
            ...issueData,
            good1: issueData.good.split('\n')[0],
            good2: issueData.good.split('\n')[1],
            good3: issueData.good.split('\n')[2],
            date: getCurrentBySub(config.current).toDate()
        }).then((e) => {
            if (e?.data) {
                messageApi.success(e.data.message);
            }
        })
    }
    const getTextArea = (key: keyof IssueRecordProps, placeholder: string, source: IssueRecordProps) => (<UniformTextAreaWithStyle key={key} type={key} placeholder={placeholder} source={source} emit={handleInput} />)

    return (<div className='wrap'>
        {contextHolder}
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
                ].map(it => getTextArea(it.key as keyof IssueRecordProps, it.placeholder, issueData))}
            </section>
            ② 前端：
            {getTextArea('front', '前端学习情况', issueData)}
            ③ TED+阅读：
            <section className='flex'>
                {[
                    { key: 'ted', placeholder: 'TED主题' },
                    { key: 'reading', placeholder: '阅读情况' }
                ].map(it => getTextArea(it.key as keyof IssueRecordProps, it.placeholder, issueData))}
            </section>
            【做得棒的3件事】
            {getTextArea('good', '积极心理学', issueData)}
            【今天有犯错吗？错误是纠正偏差的大好机会】
            {getTextArea('better', '可以变得更好的事情', issueData)}
            <div className='btn-group'>
                <Button onClick={handleSave} icon={<ExperimentFilled />}>
                    保存☞☞☞观察自己数据库
                </Button>
            </div>
        </section>
    </div>)
}