import dayjs from "dayjs";

function YesterDay() {
    const now = dayjs();
    const date = now.subtract(1, 'day').format('MM.DD');
    const week = now.day() === 1 ? '周日' : '周' + '日一二三四五六'.charAt(now.day());
    return <div className='flex'>
        <span style={{ color: 'red', fontWeight: 500 }}>{date}</span>
        &nbsp;
        {week}
    </div>
}

function showTime(min: number) {
    if (min < 0) { min = min + 24 * 60 };
    const hour = Math.floor(min / 60);
    return hour ? `${hour}h${min % 60}m ` : `${min}m `
}

export { YesterDay, showTime };
