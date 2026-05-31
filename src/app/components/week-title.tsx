import LifeFootprint from '@/components/life-footprint';
import DailySerialProgress from '@/components/daily-serial-progress';
import { getCurrentBySub } from './tool';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dayjs from 'dayjs';

interface WeekTitleProps {
    /** 当前日报日期，供连续记录天数联动刷新 */
    currentDate?: string;
}

const now = getCurrentBySub();

export default function WeekTitle({ currentDate }: WeekTitleProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const urlDate = searchParams?.get('date');

    const current = urlDate ? dayjs(urlDate) : dayjs();
    const yesterday = current.subtract(1, 'day').format('YYYY-MM-DD');
    const tomorrow = current.add(1, 'day').format('YYYY-MM-DD');
    const today = dayjs().format('YYYY-MM-DD');

    const isToday = !urlDate || urlDate === today;

    const handleNavigate = (date: string) => {
        router.push(`/daily?date=${date}`);
    };

    return (
        <header className="daily-week-header">
            <div className="daily-week-header__aside">
                <nav className="daily-week-header__nav" aria-label="日期导航">
                    <button
                        type="button"
                        onClick={() => handleNavigate(yesterday)}
                        className="nav-btn"
                    >
                        昨天
                    </button>
                    <button
                        type="button"
                        onClick={() => handleNavigate(tomorrow)}
                        className="nav-btn"
                    >
                        明天
                    </button>
                    {!isToday && (
                        <button
                            type="button"
                            onClick={() => handleNavigate(today)}
                            className="nav-btn"
                        >
                            回到现在
                        </button>
                    )}
                </nav>
                <DailySerialProgress variant="nav" />
            </div>
            <div className="daily-week-header__center">
                <div className="daily-week-header__title-block">
                    <Link href="/" className="daily-week-header__title home-link-title">
                        Week {now.week()}
                    </Link>
                    <LifeFootprint
                        currentDate={currentDate}
                        className="daily-week-header__subtitle"
                    />
                </div>
            </div>
        </header>
    );
}
