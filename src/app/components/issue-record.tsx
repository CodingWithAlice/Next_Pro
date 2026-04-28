
import { Button, Input, Modal, Tooltip, message } from "antd";
import { FormatDateToMonthDayWeek, formatMinToHM, IssueRecordProps } from "@/components/tool"
import { ExperimentFilled, InfoCircleOutlined } from "@ant-design/icons";
import Api from "@/service/api";
import dayjs from "dayjs";
import config from "config";
import { useState } from "react";
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

    const [aiOpen, setAiOpen] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [aiText, setAiText] = useState<string>('');
    const [aiParsed, setAiParsed] = useState<null | {
        raw: string;
        sport: string;
        video: string;
        front: string;
        work: string;
        ted: string;
        reading: string;
        good: string;
        better: string;
    }>(null);

    const handleInput = (type: string, value: string) => {
        const change = { ...issueData, [type]: value };
        setIssueData(change);
    };

    const handleAiParse = async () => {
        const t = aiText.trim();
        if (!t) {
            messageApi.warning('没有识别到文本');
            return;
        }
        setAiLoading(true);
        setAiParsed(null);
        try {
            const res = await Api.postAiParseIssueApi(t, currentDate);
            setAiParsed(res);
        } catch (e: unknown) {
            const errMsg =
                typeof e === 'object' && e && 'message' in e
                    ? String((e as { message?: unknown }).message || '解析失败')
                    : '解析失败';
            messageApi.error(errMsg);
        } finally {
            setAiLoading(false);
        }
    }

    const handleAiApply = () => {
        if (!aiParsed) {
            messageApi.warning('请先解析并预览');
            return;
        }

        const mergeIfNonEmpty = (next: string, prev: string) => (next && next.trim() ? next : (prev || ''));
        const merged: IssueRecordProps = {
            ...issueData,
            sport: mergeIfNonEmpty(aiParsed.sport, issueData.sport),
            video: mergeIfNonEmpty(aiParsed.video, issueData.video),
            front: mergeIfNonEmpty(aiParsed.front, issueData.front),
            work: mergeIfNonEmpty(aiParsed.work, issueData.work),
            ted: mergeIfNonEmpty(aiParsed.ted, issueData.ted),
            reading: mergeIfNonEmpty(aiParsed.reading, issueData.reading),
            good: mergeIfNonEmpty(aiParsed.good, issueData.good),
            better: mergeIfNonEmpty(aiParsed.better, issueData.better),
        };
        setIssueData(merged);
        setAiOpen(false);
    }

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
                <Button onClick={() => setAiOpen(true)}>
                    AI 解析事项（语音）
                </Button>
            </div>
        </section>
        <Modal
            title="AI 解析事项统计（建议用输入法语音）"
            open={aiOpen}
            onCancel={() => setAiOpen(false)}
            okText="应用到表单"
            onOk={handleAiApply}
            okButtonProps={{ disabled: !aiParsed }}
            confirmLoading={aiLoading}
        >
            <div style={{ fontSize: 12, opacity: 0.75, marginBottom: 8 }}>
                用输入法自带语音把内容说出来即可。示例：“运动普拉提 40 分钟，电影看了沙丘2；学习 LTN 做了两题，BOX1 复盘；工作技术方向修了登录 bug，业务方向写了周报；TED 讲拖延；阅读《原则》；成功日记……缺点……”
            </div>

            <Input.TextArea
                value={aiText}
                onChange={(e) => setAiText(e.target.value)}
                placeholder="把输入法语音转成的文本放这里（支持口语）"
                autoSize={{ minRows: 3, maxRows: 8 }}
            />

            <div style={{ marginTop: 12 }}>
                <Button onClick={handleAiParse} loading={aiLoading} disabled={!aiText.trim()}>
                    解析并预览
                </Button>
            </div>

            {aiParsed && (
                <div style={{ marginTop: 12, padding: 10, border: '1px solid #f0f0f0', borderRadius: 6 }}>
                    <div><b>运动</b>：{aiParsed.sport || '-'}</div>
                    <div><b>电影</b>：{aiParsed.video || '-'}</div>
                    <div style={{ marginTop: 6 }}><b>学习</b>：</div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{aiParsed.front || '-'}</div>
                    <div style={{ marginTop: 6 }}><b>工作</b>：</div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{aiParsed.work || '-'}</div>
                    <div style={{ marginTop: 6 }}><b>TED</b>：{aiParsed.ted || '-'}</div>
                    <div><b>阅读</b>：{aiParsed.reading || '-'}</div>
                    <div style={{ marginTop: 6 }}><b>成功日记</b>：</div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{aiParsed.good || '-'}</div>
                    <div style={{ marginTop: 6 }}><b>缺点/校准</b>：</div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{aiParsed.better || '-'}</div>
                </div>
            )}
        </Modal>
    </div>)
}