
import { Button, Input, Modal, Tooltip, message } from "antd";
import { FormatDateToMonthDayWeek, formatMinToHM, IssueRecordProps } from "@/components/tool"
import { ExperimentFilled, InfoCircleOutlined } from "@ant-design/icons";
import Api from "@/service/api";
import dayjs from "dayjs";
import config from "config";
import { useState } from "react";
const { TextArea } = Input;

const ISSUE_FIELD_TEMPLATES: Partial<Record<keyof IssueRecordProps, string>> = {
    front: '1、LTN：做？题 + 错题重做(时长) \n2、BOX1： \n3、在线工具：',
    work: '1、技术方向： \n2、业务方向：',
    ted: 'Round4: ',
};

function isCompactIssueField(
    key: keyof IssueRecordProps,
    value: string | undefined
): boolean {
    const trimmed = (value || '').trim();
    if (!trimmed) return true;
    const template = ISSUE_FIELD_TEMPLATES[key];
    return template !== undefined && value === template;
}

interface UniformTextAreaWithStyleProps {
    type: keyof IssueRecordProps,
    placeholder: string,
    source: IssueRecordProps,
    emit: (type: string, value: string) => void
    className?: string
    minRows?: number
    maxRows?: number
}

interface IssueRecordFuncProps {
    study: number;
    issueData: IssueRecordProps;
    setIssueData: (data: IssueRecordProps) => void;
    currentDate: string;
}

function UniformTextAreaWithStyle({
    type,
    placeholder,
    source,
    emit,
    className,
    minRows = 1,
    maxRows = 12,
}: UniformTextAreaWithStyleProps) {
    const value = String(source[type] ?? '');
    const compact = isCompactIssueField(type, value);
    return <TextArea
        key={type}
        className={[
            className,
            compact ? 'issue-textarea--compact' : '',
        ].filter(Boolean).join(' ')}
        value={value}
        onChange={(e) => emit(type, (e.target as HTMLTextAreaElement).value)}
        placeholder={placeholder}
        style={{
            resize: 'vertical',
        }}
        autoSize={compact ? { minRows, maxRows } : { minRows }}
    />
}

export default function IssueRecord({ study, issueData, setIssueData, currentDate }: IssueRecordFuncProps) {
    const [messageApi, contextHolder] = message.useMessage();
    // const { styles } = useStyle();
    const successDiaryTip =
        '记录克服困境后仍做对的那一步';
    const shineWiringTip =
        '客观看见微光背后的条件（睡眠、时段、地点等），就是在辨认自己已经做得好的习惯；再为明天动一个外部旋钮，让 shining 更容易再发生。不写缺点。';

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

        const appendBlock = (prevRaw: string, nextRaw: string) => {
            const prev = (prevRaw || '').trim();
            const next = (nextRaw || '').trim();
            if (!next) return prevRaw || '';
            if (!prev) return nextRaw || next;
            return `${prev}\n${next}`;
        };

        const extractNumberedSection = (textRaw: string, sectionName: string) => {
            const text = textRaw || '';
            const escaped = sectionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const reg = new RegExp(`(^|\\n)\\s*\\d+、\\s*${escaped}：([\\s\\S]*?)(?=\\n\\s*\\d+、|\\s*$)`, 'm');
            const m = text.match(reg);
            return (m?.[2] ?? '').trim();
        };

        const buildFrontMerged = (prev: string, next: string) => {
            const prevParts = {
                LTN: extractNumberedSection(prev, 'LTN'),
                BOX1: extractNumberedSection(prev, 'BOX1'),
                在线工具: extractNumberedSection(prev, '在线工具'),
            };
            const nextParts = {
                LTN: extractNumberedSection(next, 'LTN'),
                BOX1: extractNumberedSection(next, 'BOX1'),
                在线工具: extractNumberedSection(next, '在线工具'),
            };

            const mergedParts = {
                LTN: appendBlock(prevParts.LTN, nextParts.LTN).trim(),
                BOX1: appendBlock(prevParts.BOX1, nextParts.BOX1).trim(),
                在线工具: appendBlock(prevParts.在线工具, nextParts.在线工具).trim(),
            };

            return [
                `1、LTN：${mergedParts.LTN ? mergedParts.LTN : ''}`,
                `2、BOX1：${mergedParts.BOX1 ? mergedParts.BOX1 : ''}`,
                `3、在线工具：${mergedParts.在线工具 ? mergedParts.在线工具 : ''}`,
            ].join('\n');
        };

        const buildWorkMerged = (prev: string, next: string) => {
            const prevTech = extractNumberedSection(prev, '技术方向');
            const prevBiz = extractNumberedSection(prev, '业务方向');
            const nextTech = extractNumberedSection(next, '技术方向');
            const nextBiz = extractNumberedSection(next, '业务方向');

            const tech = appendBlock(prevTech, nextTech).trim();
            const biz = appendBlock(prevBiz, nextBiz).trim();
            return [
                `1、技术方向：${tech ? tech : ''}`,
                `2、业务方向：${biz ? biz : ''}`,
            ].join('\n');
        };

        const appendTed = (prevRaw: string, nextRaw: string) => {
            const prev = prevRaw || '';
            const next = (nextRaw || '').trim();
            if (!next) return prev;

            const prevTrim = prev.trim();
            const isJustPrefix = /^Round4\s*:\s*$/.test(prevTrim);
            if (isJustPrefix) return `Round4: ${next}`;

            if (!prevTrim) return next;
            // 若已有 Round4 前缀但还有内容，则换行追加
            return `${prevTrim}\n${next}`;
        };

        const merged: IssueRecordProps = {
            ...issueData,
            sport: appendBlock(issueData.sport, aiParsed.sport),
            video: appendBlock(issueData.video, aiParsed.video),
            front: buildFrontMerged(issueData.front || '', aiParsed.front || ''),
            work: buildWorkMerged(issueData.work || '', aiParsed.work || ''),
            ted: appendTed(issueData.ted || '', aiParsed.ted || ''),
            reading: appendBlock(issueData.reading, aiParsed.reading),
            good: appendBlock(issueData.good, aiParsed.good),
            better: appendBlock(issueData.better, aiParsed.better),
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
    const getTextArea = (
        key: keyof IssueRecordProps,
        placeholder: string,
        source: IssueRecordProps,
        opts?: { className?: string; minRows?: number; maxRows?: number }
    ) => (
        <UniformTextAreaWithStyle
            key={key}
            type={key}
            placeholder={placeholder}
            source={source}
            emit={handleInput}
            className={opts?.className}
            minRows={opts?.minRows}
            maxRows={opts?.maxRows}
        />
    )

    return (<div className="daily-panel daily-panel--issues">
        {contextHolder}
        <header className="daily-panel__head">
            <h2 className="daily-panel__title">二、事项统计</h2>
            <p className="daily-panel__meta issue-study-time">
                前端学习时长：{formatMinToHM(study)} 🎉
            </p>
            <FormatDateToMonthDayWeek />
        </header>
        <section className="daily-panel__body issue-wrap">
            <div className="issue-section-label">【复盘】①运动 + 电影</div>
            <section className='flex issue-flex-pair'>
                {[
                    { key: 'sport', placeholder: '运动情况' },
                    { key: 'video', placeholder: '电影' }
                ].map(it => getTextArea(it.key as keyof IssueRecordProps, it.placeholder, issueData, {
                    className: 'issue-textarea issue-textarea--inline',
                    minRows: 1,
                    maxRows: 2,
                }))}
            </section>
            <div className="issue-wrap-pair">
                <div className="issue-pair-cell">
                    <div className="issue-section-label">② 学习</div>
                    {getTextArea('front', '前端学习情况', issueData, {
                        className: 'issue-textarea issue-textarea--template',
                        minRows: 2,
                        maxRows: 3,
                    })}
                </div>
                <div className="issue-pair-cell">
                    <div className="issue-section-label">③ 工作</div>
                    {getTextArea('work', '前端工作情况', issueData, {
                        className: 'issue-textarea issue-textarea--template',
                        minRows: 2,
                        maxRows: 3,
                    })}
                </div>
            </div>
            <div className="issue-section-label">④ TED+阅读</div>
            <section className='flex issue-flex-pair'>
                {[
                    { key: 'ted', placeholder: 'TED主题' },
                    { key: 'reading', placeholder: '阅读情况' }
                ].map(it => getTextArea(it.key as keyof IssueRecordProps, it.placeholder, issueData, {
                    className: 'issue-textarea issue-textarea--inline',
                    minRows: 1,
                    maxRows: 2,
                }))}
            </section>
            <div className="issue-wrap-pair issue-wrap-pair--reflect">
                <div className="issue-pair-cell">
                    <div className="success-diary-title">
                        <span>【成功日记】Catch my shining</span>
                        <Tooltip title={successDiaryTip} placement="top">
                            <InfoCircleOutlined className="success-diary-tip-icon" />
                        </Tooltip>
                    </div>
                    {[2, 4].includes(dayjs(currentDate).day()) && (
                        <div className="daily-note-label">{config.dailyNote}</div>
                    )}
                    {getTextArea(
                        'good',
                        '我觉得这件事情我做得很棒',
                        issueData,
                        {
                            className: 'issue-textarea issue-textarea--reflect',
                            minRows: 1,
                            maxRows: 3,
                        }
                    )}
                </div>
                <div className="issue-pair-cell">
                    <div className="success-diary-title">
                        <span>【柔光 · 光亮条件】</span>
                        <Tooltip title={shineWiringTip} placement="top">
                            <InfoCircleOutlined className="success-diary-tip-icon" />
                        </Tooltip>
                    </div>
                    {getTextArea(
                        'better',
                        '今天最亮的一刻，前面有什么在帮忙？（睡眠/时段/地点/情绪/谁/先做哪件小事）\n· 若今天几乎没微光：我允许自己怎样算过关？',
                        issueData,
                        {
                            className: 'issue-textarea issue-textarea--reflect issue-textarea--better',
                            minRows: 3,
                            maxRows: 8,
                        }
                    )}
                </div>
            </div>
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
                用输入法自带语音把内容说出来即可。示例：“运动普拉提 40 分钟，电影看了沙丘2；学习 LTN 做了两题，BOX1 复盘；工作技术方向修了登录 bug，业务方向写了周报；TED 讲拖延；阅读《原则》；微光瞬间很累仍打开 LTN 五分钟，做对的那一步是先开再算；光亮条件九点半后效率好；明天接线继续先开五分钟……”
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
                    <div style={{ marginTop: 6 }}><b>柔光接线/光亮条件</b>：</div>
                    <div style={{ whiteSpace: 'pre-wrap' }}>{aiParsed.better || '-'}</div>
                </div>
            )}
        </Modal>
    </div>)
}