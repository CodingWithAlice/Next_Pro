'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactElement } from 'react'
import { Tooltip } from 'antd'
import Api from '@/service/api'
import type { CapabilityKey } from '@lib/capability-keys'

type Status = 'loading' | 'anonymous' | 'ready' | 'error'
type Source = 'user' | 'default' | null

type CapabilityState = {
	status: Status
	enabled: CapabilityKey[]
	source: Source
	error: string
	reload: () => Promise<void>
	save: (enabled: CapabilityKey[]) => Promise<void>
}

const CapabilityContext = createContext<CapabilityState | null>(null)

function hasLoginToken() {
	if (typeof localStorage === 'undefined') return false
	return !!(localStorage.getItem('j-user-id') || localStorage.getItem('type'))
}

export function CapabilityProvider({ children }: { children: React.ReactNode }) {
	const [status, setStatus] = useState<Status>('loading')
	const [enabled, setEnabled] = useState<CapabilityKey[]>([])
	const [source, setSource] = useState<Source>(null)
	const [error, setError] = useState('')

	const reload = useCallback(async () => {
		if (!hasLoginToken()) {
			setStatus('anonymous')
			setEnabled([])
			setSource(null)
			setError('')
			return
		}
		setStatus('loading')
		try {
			const res = await Api.getCapabilities()
			setEnabled(Array.isArray(res.enabled) ? res.enabled : [])
			setSource(res.source === 'user' ? 'user' : 'default')
			setError('')
			setStatus('ready')
		} catch (e) {
			setEnabled([])
			setSource(null)
			setError((e as { message?: string }).message || '场景配置不可用')
			setStatus('error')
		}
	}, [])

	useEffect(() => {
		reload()
	}, [reload])

	const save = useCallback(async (next: CapabilityKey[]) => {
		const res = await Api.putCapabilities(next)
		setEnabled(Array.isArray(res.enabled) ? res.enabled : next)
		setSource('user')
		setStatus('ready')
		setError('')
	}, [])

	return (
		<CapabilityContext.Provider value={{ status, enabled, source, error, reload, save }}>
			{children}
		</CapabilityContext.Provider>
	)
}

export function useCapabilities() {
	const ctx = useContext(CapabilityContext)
	if (!ctx) {
		throw new Error('useCapabilities 需要放在 CapabilityProvider 里')
	}
	return ctx
}

export function useCanEdit(key: CapabilityKey) {
	const { status, enabled } = useCapabilities()
	return status === 'ready' && enabled.includes(key)
}

/** 禁用按钮本身不接收 hover，包一层才能弹出提示 */
export function ViewOnlyTooltip({ viewOnly, children }: { viewOnly: boolean; children: ReactElement }) {
	if (!viewOnly) return children
	return (
		<Tooltip title="当前仅可查看">
			<span className="capability-view-only-wrap">{children}</span>
		</Tooltip>
	)
}
