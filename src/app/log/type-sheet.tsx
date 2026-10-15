'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface TypeOption {
    value: number
    label: string
}

interface TypeSheetProps {
    value?: number | null
    options: TypeOption[]
    disabled?: boolean
    className?: string
    onChange: (value: number) => void
}

export default function TypeSheet({ value, options, disabled, className, onChange }: TypeSheetProps) {
    const [open, setOpen] = useState(false)
    const titleId = useId()
    const listRef = useRef<HTMLDivElement>(null)
    const label = options.find((item) => item.value === value)?.label || '选择场景'

    useEffect(() => {
        if (!open) return
        const previous = document.body.style.overflow
        document.body.style.overflow = 'hidden'
        const onKey = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setOpen(false)
        }
        window.addEventListener('keydown', onKey)
        const list = listRef.current
        const selected = list?.querySelector('[aria-selected="true"]') as HTMLElement | null
        if (list && selected) {
            const optionHeight = selected.offsetHeight || 1
            const raw = selected.offsetTop - (list.clientHeight - selected.offsetHeight) / 2
            const max = Math.max(0, list.scrollHeight - list.clientHeight)
            const snapped = Math.round(Math.min(max, Math.max(0, raw)) / optionHeight) * optionHeight
            list.scrollTop = Math.min(max, snapped)
        }
        return () => {
            document.body.style.overflow = previous
            window.removeEventListener('keydown', onKey)
        }
    }, [open])

    return (
        <>
            <button
                type="button"
                className={className ? `log-type ${className}` : 'log-type'}
                disabled={disabled}
                aria-haspopup="dialog"
                aria-expanded={open}
                onClick={() => setOpen(true)}
            >
                <span>{label}</span>
                <span className="log-type__chevron" aria-hidden="true" />
            </button>
            {open && createPortal(
                <div className="log-sheet" onClick={() => setOpen(false)}>
                    <div
                        className="log-sheet__panel"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={titleId}
                        onClick={(event) => event.stopPropagation()}
                    >
                        <div className="log-sheet__bar" aria-hidden="true" />
                        <div className="log-sheet__head">
                            <h2 id={titleId}>选择场景</h2>
                            <button type="button" onClick={() => setOpen(false)}>关闭</button>
                        </div>
                        <div className="log-sheet__list" ref={listRef} role="listbox" aria-labelledby={titleId}>
                            {options.map((item) => (
                                <button
                                    key={item.value}
                                    type="button"
                                    role="option"
                                    aria-selected={item.value === value}
                                    onClick={() => {
                                        onChange(item.value)
                                        setOpen(false)
                                    }}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>,
                document.body,
            )}
        </>
    )
}
