'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Checkbox, Modal, message } from 'antd';
import { CAPABILITY_LABELS, type CapabilityKey } from '@lib/capability-keys';
import { useCapabilities } from './capability-context';

const TOKEN_KEY = 'j-user-id';

export default function HeaderAuth() {
	const [hasToken, setHasToken] = useState(false);
	const [open, setOpen] = useState(false);
	const [draft, setDraft] = useState<CapabilityKey[]>([]);
	const [saving, setSaving] = useState(false);
	const { status, enabled, save } = useCapabilities();

	useEffect(() => {
		const token = typeof localStorage !== 'undefined'
			? (localStorage.getItem(TOKEN_KEY) || localStorage.getItem('type'))
			: null;
		setHasToken(!!token);
	}, []);

	const handleLogout = () => {
		localStorage.removeItem(TOKEN_KEY);
		localStorage.removeItem('type');
		setHasToken(false);
		window.location.href = '/';
	};

	const openScenes = () => {
		setDraft(enabled);
		setOpen(true);
	};

	const handleSave = async () => {
		setSaving(true);
		try {
			await save(draft);
			message.success('场景已保存');
			setOpen(false);
		} catch (e) {
			message.error((e as { message?: string }).message || '保存失败');
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="header-auth">
			{hasToken ? (
				<span className="header-auth-inner">
					{status === 'ready' && (
						<button type="button" onClick={openScenes} className="header-auth-btn">
							场景
						</button>
					)}
					<span className="header-auth-label">已登录</span>
					<button
						type="button"
						onClick={handleLogout}
						className="header-auth-btn"
					>
						登出
					</button>
				</span>
			) : (
				<Link href="/login" className="header-auth-link">
					登录
				</Link>
			)}
			<Modal
				title="场景"
				open={open}
				onOk={handleSave}
				onCancel={() => setOpen(false)}
				confirmLoading={saving}
				okText="保存"
				cancelText="取消"
			>
				<Checkbox.Group
					value={draft}
					onChange={(values) => setDraft(values as CapabilityKey[])}
				>
					<div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
						{CAPABILITY_LABELS.map(({ key, label }) => (
							<Checkbox key={key} value={key}>{label}</Checkbox>
						))}
					</div>
				</Checkbox.Group>
			</Modal>
		</div>
	);
}
