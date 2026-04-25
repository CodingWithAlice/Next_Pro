
import { Button, Input, Tooltip, message } from "antd";
import { FormatDateToMonthDayWeek, formatMinToHM, IssueRecordProps } from "@/components/tool"
import { ExperimentFilled, InfoCircleOutlined } from "@ant-design/icons";
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
    const successDiaryTip =
        '先记录今天做成的事情（越具体越好），再在此基础上描述你想要的未来（你希望把它发展成什么）';

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
            <div className="success-diary-title">
                <span>【成功日记】</span>
                <Tooltip title={successDiaryTip} placement="top">
                    <InfoCircleOutlined className="success-diary-tip-icon" />
                </Tooltip>
            </div>
            {[2, 4].includes(dayjs(currentDate).day()) && (
                <div className="daily-note-label">{config.dailyNote}</div>
            )}
            {getTextArea('good', '写下今天做成的事情（建议 3 条），再补一句：我想把它发展成……', issueData)}
            【今天有哪些可以校准的小偏差？把它当作一次温柔的纠偏】
            {getTextArea('better', '可以变得更好的事情', issueData)}
            <div className='btn-group'>
                <Button onClick={handleSave} icon={<ExperimentFilled />}>
                    保存☞☞☞观察自己数据库
                </Button>
            </div>
        </section>
    </div>)
}