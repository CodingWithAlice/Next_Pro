'use client'

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import dayjs from 'dayjs'
import Api from '@/service/api'
import './day-log-view-modal.css'

interface Routine {
    id: number
    des: string
}

interface LogRow {
    id: number
    date: string
    routineTypeId: number
    startedAt: string
    endedAt: string | null
    durationMin: number | null
    note: string
}

function clock(value: string | null) {
    if (!value) return ''
    return dayjs(value).format('HH:mm')
}

export default function DayLogViewModal({
    date,
    open,
    onClose,
}: {
    date: string
    open: boolean
    onClose: () => void
}) {
    const onCloseRef = useRef(onClose)
    onCloseRef.current = onClose
    const [routines, setRoutines] = useState<Routine[]>([])
    const [logs, setLogs] = useState<LogRow[]>([])
    const [openLog, setOpenLog] = useState<LogRow | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!open) return
        let cancelled = false
        setLoading(true)
        setError('')
        Api.getLogApi(date).then((res) => {
            if (cancelled) return
            if (!res?.success) {
                setError(res?.message || '读取失败')
                setLogs([])
                setOpenLog(null)
                return
            }
            const rows: LogRow[] = Array.isArray(res.logs) ? res.logs : []
            const running = res.open && res.open.date === date ? res.open as LogRow : null
            setRoutines(Array.isArray(res.routineData) ? res.routineData : [])
            setOpenLog(running)
            setLogs(
                rows
                    .filter((row) => row.endedAt && row.id !== running?.id)
                    .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
            )
        }).catch((err: { message?: string }) => {
            if (cancelled) return
            setError(err?.message || '读取失败')
            setLogs([])
            setOpenLog(null)
        }).finally(() => {
            if (!cancelled) setLoading(false)
        })
        return () => {
            cancelled = true
        }
    }, [open, date])

    useEffect(() => {
        if (!open) return
        const previous = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onCloseRef.current()
        }
        window.addEventListener('keydown', onKey)
        return () => {
            document.body.style.overflow = previous
            window.removeEventListener('keydown', onKey)
        }
    }, [open])

    if (!open || typeof document === 'undefined') return null

    const typeName = (id: number) => routines.find((item) => Number(item.id) === Number(id))?.des || '未分类'
    const empty = !loading && !error && !openLog && logs.length === 0

    return createPortal(
        <div className="day-log-view" onClick={() => onCloseRef.current()}>
            <div
                className="day-log-view__panel"
                role="dialog"
                aria-modal="true"
                aria-labelledby="day-log-view-title"
                onClick={(event) => event.stopPropagation()}
            >
                <header className="day-log-view__head">
                    <h2 id="day-log-view-title">forest</h2>
                    <span className="day-log-view__date">{date}</span>
                    <button type="button" onClick={() => onCloseRef.current()}>关闭</button>
                </header>
                {loading && <p className="day-log-view__status">读取中</p>}
                {error && <p className="day-log-view__status">{error}</p>}
                {empty && <p className="day-log-view__status">这一天还没有当场记录</p>}
                <div className="day-log-view__list">
                    {openLog && (
                        <article className="day-log-view__row">
                            <div className="day-log-view__time">
                                <span>{clock(openLog.startedAt)} 起</span>
                                <span className="day-log-view__tag">{typeName(openLog.routineTypeId)}</span>
                                <span className="day-log-view__tag">进行中</span>
                            </div>
                            {openLog.note ? <p className="day-log-view__note">{openLog.note}</p> : null}
                        </article>
                    )}
                    {logs.map((row) => (
                        <article className="day-log-view__row" key={row.id}>
                            <div className="day-log-view__time">
                                <span>{clock(row.startedAt)} – {clock(row.endedAt)}</span>
                                <span className="day-log-view__tag">{typeName(row.routineTypeId)}</span>
                                <span>{row.durationMin ?? 0} 分钟</span>
                            </div>
                            {row.note ? <p className="day-log-view__note">{row.note}</p> : null}
                        </article>
                    ))}
                </div>
            </div>
        </div>,
        document.body,
    )
}
