'use client';

import { useMemo, useState } from 'react';
import { Button, Image, Modal, Upload } from 'antd';
import { DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import Api from '@/service/api';

function normalizeToAbsolute(url: string): string {
	if (!url) return '';
	if (url.startsWith('http')) return url;
	if (typeof window === 'undefined') return url;
	return new URL(url, window.location.origin).href;
}

export default function PiggyJarImageInline(props: {
	jarId: number;
	jarName?: string;
	value?: string | null;
	onChange?: (next: string | null) => void;
	disabled?: boolean;
}) {
	const { jarId, jarName, value, onChange, disabled } = props;
	const [uploading, setUploading] = useState(false);

	const imageSrc = useMemo(() => (value ? normalizeToAbsolute(value) : ''), [value]);

	const handleUpload = async (file: File) => {
		setUploading(true);
		try {
			const res = await Api.uploadPiggyJarImage(jarId, file, jarName);
			if (res?.success && res?.data?.imageUrl) {
				onChange?.(res.data.imageUrl);
			} else {
				Modal.error({ title: '上传失败', content: res?.message || '请重试' });
			}
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : '请重试';
			Modal.error({ title: '上传失败', content: msg });
		} finally {
			setUploading(false);
		}
		return false;
	};

	const onRemove = async () => {
		try {
			const res = await Api.removePiggyJarImage(jarId);
			if (res?.success) {
				onChange?.(null);
			} else {
				Modal.error({ title: '移除失败', content: res?.message || '请重试' });
			}
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : '请重试';
			Modal.error({ title: '移除失败', content: msg });
		}
	};

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
			{imageSrc ? (
				<div className="jar-image-thumb" style={{ position: 'relative' }}>
					<Image
						src={imageSrc}
						alt="dream"
						width={72}
						height={72}
						style={{ objectFit: 'cover', borderRadius: 10 }}
						preview={true}
					/>
					<Button
						className="jar-image-remove"
						size="small"
						danger
						type="primary"
						icon={<DeleteOutlined />}
						onClick={(e) => {
							e.stopPropagation();
							onRemove();
						}}
						style={{ position: 'absolute', top: 4, right: 4 }}
						disabled={disabled}
						title="移除"
					/>
				</div>
			) : (
				<Upload
					name="file"
					showUploadList={false}
					beforeUpload={handleUpload}
					accept="image/jpeg,image/jpg,image/png,image/webp"
					disabled={disabled || uploading}
				>
					<Button icon={<UploadOutlined />} loading={uploading} disabled={disabled}>
						{uploading ? '上传中...' : '上传照片'}
					</Button>
				</Upload>
			)}
		</div>
	);
}

