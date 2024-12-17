import dayjs from "dayjs";

export default function YesterDay() {
    const now = dayjs();
    const date = now.subtract(1, 'day').format('MM.DD');
    const week = now.day() === 1 ? '周日' : '周' + '日一二三四五六'.charAt(now.day());
    return <div className='yesterday'>
        <span style={{ color: 'red', fontWeight: 500 }}>{date}</span>
        &nbsp;
        {week}
    </div>
}