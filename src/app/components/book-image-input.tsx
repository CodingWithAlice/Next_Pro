import { useState } from 'react';
import { Upload, Button, Image, message, Modal } from 'antd';
import { UploadOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import Api from '@/service/api';

interface BookImageInputProps {
	value?: string;
	onChange?: (url: string) => void;
	title?: string;
	onUploadingChange?: (uploading: boolean) => void;
}

export default function BookImageInput({ value, onChange, title, onUploadingChange }: BookImageInputProps) {
	const [uploading, setUploading] = useState(false);
	const [uploadModal, setUploadModal] = useState<{ open: boolean; type: 'success' | 'error'; message: string }>({
		open: false,
		type: 'success',
		message: '',
	});

	const handleUpload = async (file: File) => {
		setUploading(true);
		onUploadingChange?.(true);
		try {
			const response = await Api.uploadBookImage(file, title);
			if (response.success && response.data?.url) {
				onChange?.(response.data.url);
				setUploadModal({
					open: true,
					type: 'success',
					message: '图片上传成功！',
				});
				return false;
			} else {
				setUploadModal({
					open: true,
					type: 'error',
					message: response.message || '上传失败，请重试',
				});
				return false;
			}
		} catch (error: any) {
			setUploadModal({
				open: true,
				type: 'error',
				message: error.message || '上传失败，请重试',
			});
			return false;
		} finally {
			setUploading(false);
			onUploadingChange?.(false);
		}
	};

	const handleRemove = () => {
		onChange?.('');
		message.success('图片已清空，请点击保存以更新数据');
	};

	const closeUploadModal = () => {
		setUploadModal({ ...uploadModal, open: false });
	};

	const imageSrc = value
		? value.startsWith('http')
			? value
			: typeof window !== 'undefined'
				? new URL(value, window.location.origin).href
				: value
		: '';

	const hasImage = !!value;

	return (
		<div>
			{!hasImage ? (
				<>
					<Upload
						name="file"
						showUploadList={false}
						beforeUpload={handleUpload}
						accept="image/jpeg,image/jpg,image/png,image/webp"
						disabled={uploading}
					>
						<Button icon={<UploadOutlined />} loading={uploading}>
							{uploading ? '上传中...' : '上传图片'}
						</Button>
					</Upload>
					<Modal
						open={uploadModal.open}
						onOk={closeUploadModal}
						onCancel={closeUploadModal}
						okText="确定"
						cancelButtonProps={{ style: { display: 'none' } }}
						width={400}
						centered
					>
						<div style={{ textAlign: 'center', padding: '20px 0' }}>
							{uploadModal.type === 'success' ? (
								<CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a', marginBottom: 16 }} />
							) : (
								<CloseCircleOutlined style={{ fontSize: 48, color: '#ff4d4f', marginBottom: 16 }} />
							)}
							<div style={{ fontSize: 16, fontWeight: 500 }}>
								{uploadModal.message}
							</div>
						</div>
					</Modal>
				</>
			) : (
				<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12 }}>
					<Button icon={<UploadOutlined />} disabled>
						上传图片
					</Button>
					<div style={{ position: 'relative', display: 'inline-block' }}>
						<Image
							src={imageSrc || value}
							alt="已上传图片"
							width={200}
							preview={true}
						/>
						<Button
							type="primary"
							danger
							size="small"
							onClick={(e) => {
								e.stopPropagation();
								handleRemove();
							}}
							style={{
								position: 'absolute',
								top: 8,
								right: 8,
								zIndex: 10,
							}}
						>
							删除
						</Button>
					</div>
				</div>
			)}
		</div>
	);
}
