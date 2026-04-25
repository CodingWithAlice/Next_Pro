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

export default function PiggyJarImageInput(props: {
	jarId: number;
	jarName?: string;
	value?: string[]; // 图片URL列表
	onChange?: (next: string[]) => void;
	onUploadingChange?: (uploading: boolean) => void;
	disabled?: boolean;
}) {
	const { jarId, jarName, value, onChange, onUploadingChange, disabled } = props;
	const [uploading, setUploading] = useState(false);
	const [previewOpen, setPreviewOpen] = useState(false);

	const images = useMemo(() => (Array.isArray(value) ? value.filter(Boolean) : []), [value]);

	const handleUpload = async (file: File) => {
		setUploading(true);
		onUploadingChange?.(true);
		try {
			const res = await Api.uploadPiggyJarImage(jarId, file, jarName);
			if (res?.success && res?.data?.imageUrls) {
				onChange?.(res.data.imageUrls);
			} else {
				Modal.error({ title: '上传失败', content: res?.message || '请重试' });
			}
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : '请重试';
			Modal.error({ title: '上传失败', content: msg });
		} finally {
			setUploading(false);
			onUploadingChange?.(false);
		}
		return false;
	};

	const onRemove = async (url: string) => {
		try {
			const res = await Api.removePiggyJarImage(jarId, url);
			if (res?.success && res?.data?.imageUrls) {
				onChange?.(res.data.imageUrls);
			} else {
				Modal.error({ title: '移除失败', content: res?.message || '请重试' });
			}
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : '请重试';
			Modal.error({ title: '移除失败', content: msg });
		}
	};

	return (
		<div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
			<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
				<Button
					type="default"
					disabled={images.length === 0}
					onClick={() => setPreviewOpen(true)}
				>
					查看相册（{images.length}）
				</Button>
			</div>

			{images.length > 0 && (
				<div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
					{images.slice(0, 3).map((u) => (
						<div key={u} style={{ position: 'relative' }}>
							<Image
								src={normalizeToAbsolute(u)}
								alt="jar"
								width={72}
								height={72}
								style={{ objectFit: 'cover', borderRadius: 8 }}
								preview={false}
							/>
							<Button
								size="small"
								danger
								type="primary"
								icon={<DeleteOutlined />}
								onClick={(e) => {
									e.stopPropagation();
									onRemove(u);
								}}
								style={{ position: 'absolute', top: 4, right: 4 }}
								title="移除"
							/>
						</div>
					))}
				</div>
			)}

			<Modal
				open={previewOpen}
				onCancel={() => setPreviewOpen(false)}
				footer={null}
				width={860}
				title={jarName ? `梦想相册：${jarName}` : '梦想相册'}
				centered
			>
				<Image.PreviewGroup>
					<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
						{images.map((u) => (
							<div key={u} style={{ position: 'relative' }}>
								<Image
									src={normalizeToAbsolute(u)}
									alt="jar"
									width="100%"
									style={{ borderRadius: 10 }}
								/>
								<Button
									size="small"
									danger
									type="primary"
									icon={<DeleteOutlined />}
									onClick={(e) => {
										e.stopPropagation();
										onRemove(u);
									}}
									style={{ position: 'absolute', top: 8, right: 8 }}
								/>
							</div>
						))}
					</div>
				</Image.PreviewGroup>
			</Modal>
		</div>
	);
}

