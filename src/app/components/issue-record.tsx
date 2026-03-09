
import { Button, Input, message } from "antd";
import { FormatDateToMonthDayWeek, formatMinToHM, IssueRecordProps } from "@/components/tool"
import { ExperimentFilled } from "@ant-design/icons";
import Api from "@/service/api";
import dayjs from "dayjs";
import config from "config";
const { TextArea } = Input;

interface UniformTextAreaWithStyleProps {
    type: keyof IssueRecordProps,
    placeholder: string,
    source: IssueRecordProps,
    emit: (type: string, value: string) => void
}

interface IssueRecordFuncProps {
    study: number;
    issueData: IssueRecordProps;
    setIssueData: (data: IssueRecordProps) => void;
    currentDate: string;
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

export default function IssueRecord({ study, issueData, setIssueData, currentDate }: IssueRecordFuncProps) {
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
            date: issueData?.date || currentDate
        }).then((e) => {
            if (e?.success) {
                if (e.msg) {
                    messageApi.warning(e.msg);
                } else {
                    messageApi.success(e.message);
                }
            }
        }).catch((e) => {
            messageApi.error(e.message || '保存失败');
        })
    }
    const getTextArea = (key: keyof IssueRecordProps, placeholder: string, source: IssueRecordProps) => (<UniformTextAreaWithStyle key={key} type={key} placeholder={placeholder} source={source} emit={handleInput} />)

    return (<div className='wrap-week'>
        {contextHolder}
        <b>二、事项统计</b>
        <FormatDateToMonthDayWeek />
        <h4>前端学习时长：{formatMinToHM(study)} 🎉🎉🎉</h4>
        <section className='issue-wrap'>
            【复盘】
            ①运动 + 电影：
            <section className='flex'>
                {[
                    { key: 'sport', placeholder: '运动情况' },
                    { key: 'video', placeholder: '电影' }
                ].map(it => getTextArea(it.key as keyof IssueRecordProps, it.placeholder, issueData))}
            </section>
            ② 学习：
            {getTextArea('front', '前端学习情况', issueData)}
            ③ 工作：
            {getTextArea('work', '前端工作情况', issueData)}
            ④ TED+阅读：
            <section className='flex'>
                {[
                    { key: 'ted', placeholder: 'TED主题' },
                    { key: 'reading', placeholder: '阅读情况' }
                ].map(it => getTextArea(it.key as keyof IssueRecordProps, it.placeholder, issueData))}
            </section>
            【做得棒的3件事】
            {[2, 4].includes(dayjs(currentDate).day()) && (
                <div className="daily-note-label">{config.dailyNote}</div>
            )}
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