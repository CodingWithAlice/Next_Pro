import dayjs from "dayjs";

// 展示 月.日 周几 - 默认展示昨天
function FormatDateToMonthDayWeek({handle = 1}: {handle?: number}) {
    const now = dayjs();
    const date = now.subtract(handle, 'day').format('MM.DD');
    const week = now.day() === 1 ? '周日' : '周' + '日一二三四五六'.charAt(now.day());
    return <div className='flex'>
        <span style={{ color: 'red', fontWeight: 500 }}>{date}</span>
        &nbsp;
        {week}
    </div>
}
// 处理展示时间
function formatMinToHM(min: number) {
    if (min < 0) { min = min + 24 * 60 };
    const hour = Math.floor(min / 60);
    return hour ? `${hour}h${min % 60}m ` : `${min}m `
}

export { FormatDateToMonthDayWeek, formatMinToHM };
