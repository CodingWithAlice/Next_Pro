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

// 展示 月.日 周几 - 默认展示昨天
function getYesterdayDate(handle: number = config.current, urlDate?: string) {
    const date = getCurrentBySub(handle);
    const current = urlDate ? dayjs(urlDate) : date;
    const weekday = '六日一二三四五'.charAt((current.day() + 1) % 7);
    return { weekday, date: current.format('YYYY-MM-DD') }
}

// 计算当前计划周期流逝速度
function getPassedPercent(startTime: string, cycle: number) {
    const current = getCurrentBySub();
    return {
        steps: cycle,
        percent: getGapTime(startTime, current) / cycle * 100,
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

// deepSeek 类别，读取不同的提示词
type SearchType = 'month' | 'week';

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
function FormatDateToMonthDayWeek({ handle = config.current }: { handle?: number }) {
    const urlParams = useSearchParams();
    const urlDate = urlParams?.get('date');
    const { weekday, date } = getYesterdayDate(handle, urlDate || '');
    
    return <div className='flex' style={{ position: 'relative' }}>
        <span style={{ color: '#f68084', fontWeight: 800 }}>{urlDate || date}</span>
        &nbsp;
        周{weekday}
        <span className='daily-note-label'>{config.dailyNote}</span>
    </div>
}

export {
    FormatDateToMonthDayWeek,
    formatMinToHM,
    formatTime,
    getGapTime,
    transTimeStringToType,
    transTextArea,
    formatSerialNumber,
    getPassedPercent,
    getYesterdayDate,
    useStyle,
    getWeek,
    Category,
    CategoryColor,
    getCurrentBySub,
    transTitle,
    sortIssuesWithSleepLast,
    type IssueRecordProps,
    type SearchType
};
