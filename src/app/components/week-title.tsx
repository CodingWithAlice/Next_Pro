import ProcessCircle from '@/components/process-circle';
import config from 'config';
import dayjs from 'dayjs';
import weekOfYear from 'dayjs/plugin/weekOfYear';

const now = dayjs();
dayjs.extend(weekOfYear);

export default function WeekTitle() {
    return <h1 className='week'>
        Week {now.week()}
        <br />
        <ProcessCircle startTime={config.startTime.time} cycle={config.startTime.cycle} />
    </h1>
}