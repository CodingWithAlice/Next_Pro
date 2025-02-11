import dayjs from "dayjs";
import relativeTime from 'dayjs/plugin/relativeTime';
import { createStyles } from 'antd-style';
import qs from 'qs';
import config from 'config';
dayjs.extend(relativeTime);

// 展示 月.日 周几 - 默认展示昨天
function getYesterdayDate(handle: number = config.current) {
    const now = dayjs();
    const date = now.subtract(handle, 'day').format('YYYY-MM-DD');

    const weekday = '六日一二三四五'.charAt(now.day());
    return { weekday, date }
}
function FormatDateToMonthDayWeek({ handle = config.current }: { handle?: number }) {
    const { weekday, date } = getYesterdayDate(handle);
    return <div className='flex'>
        <span style={{ color: '#f68084', fontWeight: 800 }}>{date}</span>
        &nbsp;
        周{weekday}
    </div>
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

// 计算当前计划周期流逝速度
function getPassedPercent(startTime: string, cycle: number) {
    const current = dayjs();

    return {
        steps: cycle,
        percent: current.diff(startTime, 'day') / cycle * 100,
    }
}

function getGapTime(startTime: string, endTime: string, type: 'hour' | 'minute' | 'day') {
    const start = dayjs(startTime);
    const end = dayjs(endTime);
    return end.diff(start, type);

}

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

function debounce(fn: Function, delay: number) {
    let timer: NodeJS.Timeout | null = null;
    return function (...args) {
        clearTimeout(timer as NodeJS.Timeout);
        timer = setTimeout(() => {
            fn(...args);
        }, delay);
    }
}

function throttle(fn: Function, delay: number) {
    let timer: NodeJS.Timeout | null = null;
    return function (...args) {
        if (!timer) {
            timer = setTimeout(() => {
                fn(...args);
                timer = null;
            }, delay);
        }
    }
}

function getUrlParams() {
    const queryString = window.location.search.substring(1); // 去掉 "?"
    if (!queryString) return {};
    const params = qs.parse(queryString);
    return params;
}

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

const getWeek = () => {
    return dayjs().week()
}

export {
    FormatDateToMonthDayWeek,
    formatMinToHM,
    formatTime,
    getGapTime,
    formatSerialNumber,
    getPassedPercent,
    getYesterdayDate,
    useStyle,
    debounce,
    throttle,
    getWeek,
    getUrlParams,
    Category,
    CategoryColor,
    type IssueRecordProps
};
