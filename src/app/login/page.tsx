'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Form, Input, Button, message } from 'antd';

const TOKEN_KEY = 'j-user-id';

export default function LoginPage() {
	const [mounted, setMounted] = useState(false);
	const router = useRouter();
	const searchParams = useSearchParams();

	useEffect(() => {
		setMounted(true);
	}, []);

	// URL 带 type 或 j-user-id 时预填并写入 localStorage 后清 URL
	const tokenFromUrl = searchParams.get('j-user-id') ?? searchParams.get('type');
	useEffect(() => {
		if (mounted && tokenFromUrl) {
			localStorage.setItem(TOKEN_KEY, tokenFromUrl);
			localStorage.setItem('type', tokenFromUrl);
			router.replace('/login', { scroll: false });
		}
	}, [mounted, tokenFromUrl, router]);

	const onFinish = (values: { token: string }) => {
		const token = values?.token?.trim();
		if (!token) {
			message.warning('请输入令牌');
			return;
		}
		localStorage.setItem(TOKEN_KEY, token);
		localStorage.setItem('type', token);
		message.success('登录成功');
		window.location.href = '/';
	};

	if (!mounted) {
		return (
			<div className="login-page" style={{ padding: 24, textAlign: 'center' }}>
				加载中...
			</div>
		);
	}

	return (
		<div className="login-page" style={{ maxWidth: 400, margin: '60px auto', padding: 24 }}>
			<h1 style={{ textAlign: 'center', marginBottom: 24 }}>登录</h1>
			<Form
				layout="vertical"
				onFinish={onFinish}
				initialValues={{ token: tokenFromUrl ?? '' }}
			>
				<Form.Item label="账号" name="account">
					<Input disabled placeholder="j人" value="j人" />
				</Form.Item>
				<Form.Item
					label="令牌"
					name="token"
					rules={[{ required: true, message: '请输入令牌' }]}
				>
					<Input.Password placeholder="请输入您的令牌" autoComplete="off" />
				</Form.Item>
				<Form.Item>
					<Button type="primary" htmlType="submit" block>
						登录
					</Button>
				</Form.Item>
			</Form>
			<p style={{ textAlign: 'center', color: '#666', fontSize: 12 }}>
				<Link href="/">返回首页</Link>
			</p>
		</div>
	);
}
