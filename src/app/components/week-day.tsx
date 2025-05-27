import { DailyDataProps } from "@/daily/page";
import { IssueRecordProps } from "./tool";
import { Form, Input, Switch } from "antd";
import { formatMinToHM } from "./tool";
import config from "config";

export interface WeekDayProps extends IssueRecordProps {
    daily_time_records: DailyDataProps[];
    id: number;
    date: string;
}

const items = [
    {
        label: "总计",
        name: "total",
    },
    {
        label: "下班时间",
        name: "work",
    },
    {
        label: "LTN做题",
        name: "ltnTotal",
    },
    {
        label: "入睡时间",
        name: "sleep",
    },
    {
        label: "起床时间",
        name: "wake",
    },
    {
        label: "TED",
        name: "tedShow",
        render: <Switch disabled />
    },
    {
        label: "阅读",
        name: "read",
        render: <Switch disabled />
    },
    {
        label: "运动",
        name: "sport",
    },
    {
        label: "电影",
        name: "video",
    },
    {
        label: "前端",
        name: "front",
        render: <Input.TextArea autoSize={{ minRows: 6, maxRows: 15 }} disabled />
    },
    {
        label: "可以更好",
        name: "better",
        render: <Input.TextArea autoSize={{ minRows: 6, maxRows: 15 }} disabled />
    },
    {
        label: "做得棒",
        name: "good",
        render: <Input.TextArea autoSize={{ minRows: 2, maxRows: 15 }} disabled />
    },
]

function transformData(data: WeekDayProps) {
    const front = data.daily_time_records.find(item => item.routineTypeId === config.frontTotalId);
    const ltn = data.daily_time_records.find(item => item.routineTypeId === config.ltnTotalId);
    const total = data.daily_time_records.find(item => item.routineTypeId === config.totalId);
    const sleep = data.daily_time_records.find(item => item.routineTypeId === config.sleepId);
    const work = data.daily_time_records.find(item => item.routineTypeId === config.workId);
    const sport = data.daily_time_records.find(item => item.routineTypeId === config.sportId);
    console.log({data, work, sport});
    return {
        ...data,
        frontTotal: formatMinToHM(front?.duration),
        ltnTotal: formatMinToHM(ltn?.duration),
        total: formatMinToHM(total?.duration),
        sleep: sleep?.startTime,
        wake: sleep?.endTime,
        tedShow: data?.ted && data?.ted !== '/',
        read: data?.reading && data?.reading !== '/',
        sport: formatMinToHM(sport?.duration),
        good: (data?.good1 || '') + (data?.good2 || '') + (data?.good3 || ''),
        work: work?.endTime
    }
}


export function WeekDay({ data, index }: { data: WeekDayProps, index: number }) {
    const [form] = Form.useForm();
    form.setFieldsValue(transformData(data));

    const labelCol = {
        xs: { span: 8 }, // 超小屏幕（手机）
        sm: { span: 6 }, // 小屏幕（平板）
        // 可以继续添加其他屏幕尺寸的配置
      };
      const wrapperCol = {
        xs: { span: 16 },
        sm: { span: 18 },
        // 可以继续添加其他屏幕尺寸的配置
      };
    
    return <div className="week-day">
        <section>
            <h2>Day{index + 1} {data.date}</h2>
        </section>
        <Form form={form} labelCol={labelCol} wrapperCol={wrapperCol}>
            {items.map(item =>
                <Form.Item key={item.name} label={item.label} name={item.name}>
                    {item?.render || <Input disabled />}
                </Form.Item>)}
        </Form>
    </div>
}