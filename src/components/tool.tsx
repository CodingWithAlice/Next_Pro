import dayjs from "dayjs";
import relativeTime from 'dayjs/plugin/relativeTime'
dayjs.extend(relativeTime);

// 展示 月.日 周几 - 默认展示昨天
function getYesterdayDate(handle: number = 1) {
    const now = dayjs();
    const date = now.subtract(handle, 'day').format('YYYY-MM-DD');
    const weekday = '日一二三四五六'.charAt(now.day());
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
    console.log('now', now, parseInt(now) / cycle);
    
    return {
        steps: cycle,
        percent: parseInt(now) / cycle * 100,
    }
}

export { FormatDateToMonthDayWeek, formatMinToHM, getPassedPercent, getYesterdayDate };
