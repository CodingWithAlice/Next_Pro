'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import dayjs from 'dayjs'
import { Button, Input, InputNumber, message } from 'antd'
import TypeSheet from './type-sheet'
import Api from '@/service/api'
import config from 'config'
import { useCanEdit, ViewOnlyTooltip } from '@/components/capability-context'
import './app.css'

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

function elapsedMinutes(startedAt: string) {
    return Math.max(0, Math.round(dayjs().diff(dayjs(startedAt), 'minute', true)))
}

export default function LogPage() {
    const canEdit = useCanEdit('daily')
    const [messageApi, contextHolder] = message.useMessage()
    const searchParams = useSearchParams()
    const today = dayjs().format('YYYY-MM-DD')
    const [date, setDate] = useState(searchParams?.get('date') || today)
    const [dates, setDates] = useState<string[]>([today])
    const [routines, setRoutines] = useState<Routine[]>([])
    const [logs, setLogs] = useState<LogRow[]>([])
    const [openLog, setOpenLog] = useState<LogRow | null>(null)
    const [typeId, setTypeId] = useState<number | null>(null)
    const [note, setNote] = useState('')
    const [tick, setTick] = useState(0)
    const [busy, setBusy] = useState(false)
    const [pendingDelete, setPendingDelete] = useState<LogRow | null>(null)

    const load = useCallback((nextDate: string) => {
        return Api.getLogApi(nextDate).then((res) => {
            if (!res?.success) return
            setDates(res.dates?.length ? res.dates : [today])
            setRoutines(res.routineData || [])
            setLogs(res.logs || [])
            setOpenLog(res.open || null)
            setTypeId((current: number | null) => {
                if (current && (res.routineData || []).some((item: Routine) => item.id === current)) return current
                const work = (res.routineData || []).find((item: Routine) => item.id === config.workId)
                return work?.id || res.routineData?.[0]?.id || null
            })
        }).catch((error: { message?: string }) => {
            messageApi.error(error.message || '读取失败')
        })
    }, [messageApi, today])

    useEffect(() => {
        load(date)
    }, [date, load])

    useEffect(() => {
        if (!openLog) return
        const timer = window.setInterval(() => setTick((value) => value + 1), 15000)
        return () => window.clearInterval(timer)
    }, [openLog])

    useEffect(() => {
        if (!pendingDelete) return
        const previous = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setPendingDelete(null)
        }
        window.addEventListener('keydown', onKey)
        return () => {
            document.body.style.overflow = previous
            window.removeEventListener('keydown', onKey)
        }
    }, [pendingDelete])

    const typeOptions = useMemo(
        () => routines.map((item) => ({ value: item.id, label: item.des })),
        [routines]
    )

    const run = (task: Promise<unknown>, ok: string) => {
        setBusy(true)
        return task.then((res: unknown) => {
            const result = res as { success?: boolean; message?: string }
            if (result && result.success === false) {
                messageApi.error(result.message || '没有写成')
                return
            }
            messageApi.success(ok)
            setNote('')
            return load(date)
        }).catch((error: { message?: string }) => {
            messageApi.error(error.message || '没有写成')
        }).finally(() => setBusy(false))
    }

    const start = () => {
        if (!typeId) return
        run(Api.postLogApi({
            action: 'start',
            date: today,
            routineTypeId: typeId,
            note,
        }), '开始了').then(() => setDate(today))
    }

    const stop = () => {
        if (!openLog) return
        run(Api.postLogApi({
            action: 'stop',
            id: openLog.id,
            note: openLog.note,
        }), '这一段结束了')
    }

    const saveField = (row: LogRow, patch: { note?: string; durationMin?: number | null; routineTypeId?: number }) => {
        const payload: { [key: string]: string | number | null } = { action: 'update', id: row.id }
        if (patch.note != null) payload.note = patch.note
        if (patch.durationMin != null) payload.durationMin = patch.durationMin
        if (patch.routineTypeId != null) payload.routineTypeId = patch.routineTypeId
        Api.postLogApi(payload).catch((error: { message?: string }) => {
            messageApi.error(error.message || '没有改成')
            load(date)
        })
    }

    const viewingToday = date === today
    const shownMinutes = openLog ? elapsedMinutes(openLog.startedAt) : 0
    void tick

    return (
        <div className="log-page">
            {contextHolder}
            <header className="log-page__head">
                <h1 className="log-page__title">forest</h1>
                <Link className="log-page__link" href={`/daily?date=${date}`}>晨昏日志</Link>
            </header>
            <div className="log-dates">
                {dates.map((item) => (
                    <button
                        key={item}
                        type="button"
                        aria-pressed={item === date}
                        onClick={() => setDate(item)}
                    >
                        {item === today ? '今天' : item.slice(5)}
                    </button>
                ))}
            </div>

            <section className="log-card">
                {openLog ? (
                    <>
                        <div>进行中 {clock(openLog.startedAt)} 起，已 {shownMinutes} 分钟</div>
                        <Input
                            value={openLog.note}
                            placeholder="这一段在做什么"
                            onChange={(event) => setOpenLog({ ...openLog, note: event.target.value })}
                            onBlur={() => saveField(openLog, { note: openLog.note })}
                            disabled={!canEdit}
                        />
                        <ViewOnlyTooltip viewOnly={!canEdit}>
                            <Button className="log-start" type="primary" onClick={stop} loading={busy} disabled={!canEdit}>
                                结束
                            </Button>
                        </ViewOnlyTooltip>
                    </>
                ) : (
                    <>
                        <TypeSheet
                            value={typeId}
                            options={typeOptions}
                            onChange={(value) => setTypeId(value)}
                            disabled={!canEdit || !viewingToday}
                        />
                        <Input
                            value={note}
                            placeholder="这一段在做什么，可以结束后再补"
                            onChange={(event) => setNote(event.target.value)}
                            disabled={!canEdit || !viewingToday}
                        />
                        <ViewOnlyTooltip viewOnly={!canEdit}>
                            <Button
                                className="log-start"
                                type="primary"
                                onClick={start}
                                loading={busy}
                                disabled={!canEdit || !viewingToday || !typeId}
                            >
                                {viewingToday ? '开始' : '回到今天再记'}
                            </Button>
                        </ViewOnlyTooltip>
                    </>
                )}
            </section>

            <section className="log-list">
                {logs.filter((row) => row.endedAt).map((row) => (
                    <article className="log-row" key={row.id}>
                        <div className="log-row__time">
                            <span>{clock(row.startedAt)} – {clock(row.endedAt)}</span>
                            <span className="log-tag">
                                {routines.find((item) => item.id === row.routineTypeId)?.des || '未分类'}
                            </span>
                        </div>
                        <button
                            type="button"
                            className="log-row__delete"
                            disabled={!canEdit}
                            onClick={() => setPendingDelete(row)}
                        >
                            删除
                        </button>
                        <Input
                            className="log-row__note"
                            value={row.note}
                            placeholder="描述"
                            disabled={!canEdit}
                            onChange={(event) => {
                                const next = event.target.value
                                setLogs((current) => current.map((item) => item.id === row.id ? { ...item, note: next } : item))
                            }}
                            onBlur={(event) => saveField(row, { note: event.target.value })}
                        />
                        <InputNumber
                            className="log-row__duration"
                            min={0}
                            max={24 * 60}
                            addonAfter="分钟"
                            value={row.durationMin ?? 0}
                            disabled={!canEdit}
                            onChange={(value) => {
                                const durationMin = value == null ? 0 : Number(value)
                                setLogs((current) => current.map((item) => item.id === row.id ? { ...item, durationMin } : item))
                                saveField(row, { durationMin })
                            }}
                        />
                    </article>
                ))}
            </section>
            {pendingDelete && createPortal(
                <div className="log-confirm" onClick={() => setPendingDelete(null)}>
                    <div
                        className="log-confirm__panel"
                        role="alertdialog"
                        aria-modal="true"
                        aria-labelledby="log-confirm-title"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <h2 id="log-confirm-title">删掉这一段？</h2>
                        <p>
                            {clock(pendingDelete.startedAt)} – {clock(pendingDelete.endedAt)}
                            {' '}
                            {routines.find((item) => item.id === pendingDelete.routineTypeId)?.des || ''}
                        </p>
                        <div className="log-confirm__actions">
                            <button type="button" onClick={() => setPendingDelete(null)}>取消</button>
                            <button
                                type="button"
                                className="log-confirm__ok"
                                onClick={() => {
                                    const id = pendingDelete.id
                                    setPendingDelete(null)
                                    run(Api.deleteLogApi(id), '已删掉')
                                }}
                            >
                                删除
                            </button>
                        </div>
                    </div>
                </div>,
                document.body,
            )}
        </div>
    )
}
