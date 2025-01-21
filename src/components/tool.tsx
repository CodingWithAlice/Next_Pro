import dayjs from "dayjs";
import relativeTime from 'dayjs/plugin/relativeTime';
import { createStyles } from 'antd-style';
dayjs.extend(relativeTime);

// 展示 月.日 周几 - 默认展示昨天
function getYesterdayDate(handle: number = 1) {
    const now = dayjs();
    const date = now.subtract(handle, 'day').format('YYYY-MM-DD');
    
    const weekday = '六日一二三四五'.charAt(now.day());
    return { weekday, date }
}
function FormatDateToMonthDayWeek({ handle = 1 }: { handle?: number }) {
    const { weekday, date } = getYesterdayDate(handle);
    return <div className='flex'>
        <span style={{ color: '#f68084', fontWeight: 800 }}>{date}</span>
        &nbsp;
        周{weekday}
    </div>
}
// 处理展示时间
function formatMinToHM(min: number) {
    if (min < 0) { min = min + 24 * 60 };
    const hour = Math.floor(min / 60);
    return hour ? `${hour}h${!!(min % 60) ? (min % 60) + 'm' : ''} ` : `${min}m `
}
// 计算当前计划周期流逝速度
function getPassedPercent(startTime: string, cycle: number) {
    const now = dayjs(startTime).toNow(true);
    
    return {
        steps: cycle,
        percent: parseInt(now) / cycle * 100,
    }
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

export { 
    FormatDateToMonthDayWeek, 
    formatMinToHM, 
    getPassedPercent, 
    getYesterdayDate, 
    useStyle 
};
