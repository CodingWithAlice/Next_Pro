import ProcessCircle from '@/components/process-circle';
import config from 'config';
import { getCurrentBySub } from './tool';

const now = getCurrentBySub();

export default function WeekTitle() {
    return <h1 className='week'>
        Week {now.week()}
        <br />
        <ProcessCircle startTime={config.startTime.time} cycle={config.startTime.cycle} />
    </h1>
}