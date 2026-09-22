import dayjs, { Dayjs } from "dayjs";
import weekOfYear from 'dayjs/plugin/weekOfYear';
import relativeTime from 'dayjs/plugin/relativeTime';
import { createStyles } from 'antd-style';
import config from 'config';
import { useSearchParams } from 'next/navigation';
import { UniformTextAreaWithStyle } from "./uniform-textarea";
dayjs.extend(relativeTime);
dayjs.extend(weekOfYear);

const getCurrentBySub = (subtractDay?: number) => {
    if (!subtractDay) {
        return dayjs()
    }
    return dayjs().subtract(subtractDay, 'day')
};

/**
 * 将一个时间（时分秒）对齐到指定日期（YYYY-MM-DD），避免补录时混入“今天”的日期导致 diff 超过 24h。
 */
function alignTimeToDate(time: Dayjs, date: string | Dayjs): Dayjs {
    const t = dayjs(time);
    const d = dayjs(date);
    return d
        .hour(t.hour())
        .minute(t.minute())
        .second(t.second())
        .millisecond(t.millisecond());
}

// 展示 月.日 周几 - 默认展示昨天
function getYesterdayDate(handle: number = config.current, urlDate?: string) {
    const date = getCurrentBySub(handle);
    const current = urlDate ? dayjs(urlDate) : date;
    const weekday = '六日一二三四五'.charAt((current.day() + 1) % 7);
    return { weekday, date: current.format('YYYY-MM-DD') }
}

/** 每日记录周期进度的默认分母，用来提醒双周报 */
const DEFAULT_SERIAL_CYCLE_DAYS = 14;

/**
 * 每日记录的周期进度。
 * 最近一个周期结束后，从结束次日自动起算，不必先新建周期。
 * 分母默认 14 天；已过天数超过 14 时，分母改为当前时长。
 */
function resolveDailySerialProgress(startTime: string, endTime: string) {
    const today = getCurrentBySub().startOf('day');
    const recordedStart = dayjs(startTime).startOf('day');
    const recordedEnd = endTime ? dayjs(endTime).startOf('day') : null;
    const periodStart = recordedEnd && today.isAfter(recordedEnd, 'day')
        ? recordedEnd.add(1, 'day')
        : recordedStart;
    const elapsed = Math.max(0, getGapTime(periodStart, today));

    return {
        startTime: periodStart.format('YYYY-MM-DD'),
        cycle: Math.max(DEFAULT_SERIAL_CYCLE_DAYS, elapsed),
    };
}

// 计算当前计划周期流逝速度
function getPassedPercent(startTime: string, cycle: number) {
    const current = getCurrentBySub();
    return {
        steps: cycle,
        percent: cycle > 0 ? getGapTime(startTime, current) / cycle * 100 : 0,
    }
}

function getGapTime(startTime: string | Dayjs, endTime: string | Dayjs, type?: 'hour' | 'minute' | 'day') {
    const start = dayjs(startTime);
    const end = dayjs(endTime);
    return end.diff(start, type || 'day');

}

const getWeek = () => {
    return dayjs().week()
}

function transTimeStringToType(time: string | number, type: string) {
    return dayjs(time).format(type);
}

// 处理时间为负数的情况（跨0点学习导致的）
function formatTime(time?: number) {
    if (!time) {
        return 0
    }
    if (time > 0) {
        return time
    }
    return time + 24 * 60;
}

// 处理展示时间
function formatMinToHM(min?: number) {
    min = formatTime(min)
    const hour = Math.floor(min / 60);
    return hour ? `${hour}h${!!(min % 60) ? (min % 60) + 'm' : ''} ` : `${min}m `
}

/** 分钟转为小时，保留 1 位小数，如 7.3h */
function formatMinToHours(min?: number) {
    const minutes = formatTime(min)
    return `${(minutes / 60).toFixed(1)}h`
}

// 处理周期展示
function formatSerialNumber(num: number) {
    const str = num + '';

    const source = ['〇', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨'];
    let res = '';
    Array(str.length).fill(1).forEach((it, index) => {
        res += source[+str[index]];
    })

    return res
}

// 统一标题样式
function transTitle(title: string) {
    return <span key={title} className="title-top">
        <span>{title}</span>
    </span>
}

const transTextArea = ({ key, desc, tip, source, onChange, cols }: {
    key: string,
    desc?: string,
    tip?: string,
    source: { [key: string]: string | number },
    onChange: (v: { [key: string]: string; }) => void,
    cols?: number
}) => {
    return <UniformTextAreaWithStyle
        key={key}
        type={key}
        tip={tip}
        desc={desc || ''}
        cols={cols}
        init={source?.[key] || ''}
        onChange={onChange}
    />
};

const useStyle = createStyles(({ prefixCls, css }) => ({
    linearGradientButton: css`
      &.${prefixCls}-btn-primary:not([disabled]):not(.${prefixCls}-btn-dangerous) {
        > span {
          position: relative;
        }
  
        &::before {
          content: '';
          background: linear-gradient(120deg, #d4fc79, #96e6a1);
          position: absolute;
          inset: -1px;
          opacity: 1;
          transition: all 0.3s;
          border-radius: inherit;
        }
  
        &:hover::before {
          opacity: 0;
        }
      }
    `,
}));

// 定义一些 type 和 interface
interface IssueRecordProps {
    sport: string,
    video: string,
    front: string,
    work: string,
    ted: string,
    reading: string,
    good1?: string,
    good2?: string,
    good: string,
    good3?: string,
    better: string,
    date?: string
}

// 分类共三类：Learning、Life、Health
const Category = {
    learning: 'Learning',
    life: 'Life',
    health: 'Health',
}
const CategoryColor = {
    Learning: 'green',
    Life: 'pink',
    Health: 'volcano'
}

// 排序所需的接口类型（只包含排序需要的字段）
interface SortableIssue {
    startTime: Dayjs;
    type: string | number;
    daySort: number;
}

/**
 * 对事项进行排序，睡眠类型和空选项始终排在最后
 * @param issues 待排序的事项数组
 * @returns 排序后的事项数组
 */
function sortIssuesWithSleepLast<T extends SortableIssue>(issues: T[]): T[] {
    return [...issues].sort((a, b) => {
        const aIsSleep = +a.type === +config.sleepId;
        const bIsSleep = +b.type === +config.sleepId;
        
        // 判断是否为空选项：type 为空、null、undefined
        const aIsEmpty = !a.type || a.type === '' || a.type === null || a.type === undefined;
        const bIsEmpty = !b.type || b.type === '' || b.type === null || b.type === undefined;
        
        // 判断是否为需要置底的类型（睡眠或空选项）
        const aShouldBeLast = aIsSleep || aIsEmpty;
        const bShouldBeLast = bIsSleep || bIsEmpty;
        
        // 如果一个是需要置底的类型，另一个不是，需要置底的排最后
        if (aShouldBeLast && !bShouldBeLast) return 1;
        if (!aShouldBeLast && bShouldBeLast) return -1;
        
        // 如果都是需要置底的类型，睡眠优先于空选项，然后按 daySort 排序
        if (aShouldBeLast && bShouldBeLast) {
            // 睡眠优先于空选项
            if (aIsSleep && !bIsSleep) return -1;
            if (!aIsSleep && bIsSleep) return 1;
            // 同类型，保持原有顺序（通过 daySort）
            return a.daySort - b.daySort;
        }
        
        // 都不是需要置底的类型，按开始时间排序
        const diff = a.startTime.diff(b.startTime, 'minute');
        if (diff !== 0) {
            return diff;
        }
        // 如果开始时间相同，保持原有顺序（通过 daySort）
        return a.daySort - b.daySort;
    });
}

// 公共组件
function FormatDateToMonthDayWeek({
    handle = config.current,
    className,
}: {
    handle?: number
    className?: string
}) {
    const urlParams = useSearchParams();
    const urlDate = urlParams?.get('date');
    const { weekday, date } = getYesterdayDate(handle, urlDate || '');

    return (
        <div className={['daily-panel__date', className].filter(Boolean).join(' ')}>
            <span className="daily-panel__date-value">{urlDate || date}</span>
            <span className="daily-panel__date-week">周{weekday}</span>
        </div>
    );
}

export {
    FormatDateToMonthDayWeek,
    formatMinToHM,
    formatMinToHours,
    formatTime,
    getGapTime,
    transTimeStringToType,
    transTextArea,
    formatSerialNumber,
    getPassedPercent,
    resolveDailySerialProgress,
    getYesterdayDate,
    useStyle,
    getWeek,
    Category,
    CategoryColor,
    getCurrentBySub,
    alignTimeToDate,
    transTitle,
    sortIssuesWithSleepLast,
    type IssueRecordProps
};
