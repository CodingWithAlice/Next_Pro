import { useState, useEffect } from 'react';
import { Upload, Input, Button, Image, message, Space } from 'antd';
import { UploadOutlined, LinkOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import Api from '@/service/api';

interface BookImageInputProps {
	value?: string;
	onChange?: (url: string) => void;
	title?: string;
	onUploadingChange?: (uploading: boolean) => void;
}

export default function BookImageInput({ value, onChange, title, onUploadingChange }: BookImageInputProps) {
	const [mode, setMode] = useState<'upload' | 'url'>('upload');
	const [uploading, setUploading] = useState(false);
	const [urlInput, setUrlInput] = useState(value || '');

	// 同步 urlInput 状态与 value prop 的变化
	useEffect(() => {
		setUrlInput(value || '');
	}, [value]);

	const handleUpload = async (file: File) => {
		setUploading(true);
		onUploadingChange?.(true);
		try {
			const response = await Api.uploadBookImage(file, title);
			if (response.success && response.data?.url) {
				onChange?.(response.data.url);
				message.success('图片上传成功');
				return false; // 阻止默认上传行为
			} else {
				message.error(response.message || '上传失败');
				return false;
			}
		} catch (error: any) {
			message.error(error.message || '上传失败');
			return false;
		} finally {
			setUploading(false);
			onUploadingChange?.(false);
		}
	};

	const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const url = e.target.value;
		setUrlInput(url);
		onChange?.(url);
	};

	const handleUrlBlur = () => {
		// 验证URL格式
		if (urlInput && !/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)/i.test(urlInput)) {
			// 允许不以扩展名结尾的URL（如带查询参数的URL）
			if (!/^https?:\/\//.test(urlInput)) {
				message.warning('请输入有效的图片URL');
			}
		}
	};

	const fileList: UploadFile[] = value && mode === 'upload' ? [{
		uid: '-1',
		name: 'image',
		status: 'done',
		url: value.startsWith('http') ? value : undefined,
	} as UploadFile] : [];

	return (
		<div>
			<Space style={{ marginBottom: 8 }}>
				<Button
					type={mode === 'upload' ? 'primary' : 'default'}
					icon={<UploadOutlined />}
					size="small"
					onClick={() => setMode('upload')}
				>
					上传图片
				</Button>
				<Button
					type={mode === 'url' ? 'primary' : 'default'}
					icon={<LinkOutlined />}
					size="small"
					onClick={() => setMode('url')}
				>
					输入URL
				</Button>
			</Space>

			{mode === 'upload' ? (
				<div>
					<Upload
						name="file"
						listType="picture-card"
						showUploadList={true}
						beforeUpload={handleUpload}
						fileList={fileList}
						maxCount={1}
						accept="image/jpeg,image/jpg,image/png,image/webp"
					>
						{!value && (
							<div>
								<UploadOutlined />
								<div style={{ marginTop: 8 }}>上传</div>
							</div>
						)}
					</Upload>
					{value && (
						<div style={{ marginTop: 8 }}>
							<Image src={value} alt="预览" width={200} />
						</div>
					)}
				</div>
			) : (
				<div>
					<Input
						placeholder="请输入图片URL（如：https://img.doubanio.com/...）"
						value={urlInput}
						onChange={handleUrlChange}
						onBlur={handleUrlBlur}
						disabled={uploading}
					/>
					{value && (
						<div style={{ marginTop: 8 }}>
							<Image src={value} alt="预览" width={200} />
						</div>
					)}
				</div>
			)}
		</div>
	);
}

