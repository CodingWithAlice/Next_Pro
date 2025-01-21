import ProcessCircle from '@/components/process-circle';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';

const now = dayjs();
dayjs.extend(weekOfYear);

export default function WeekTitle() {
    return <h1 className='week'>
        Week {now.week()}
        <br />
        <ProcessCircle startTime='2025-1-17' cycle={9} />
    </h1>
}