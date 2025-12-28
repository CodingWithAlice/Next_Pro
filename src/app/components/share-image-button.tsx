'use client';
import { useState } from 'react';
import { Button, message } from 'antd';
import { ShareAltOutlined, DownloadOutlined } from '@ant-design/icons';
// @ts-ignore - html-to-image 可能没有类型定义
import { toPng } from 'html-to-image';

interface ShareImageButtonProps {
    /** 要截图的元素选择器或 ref */
    targetElement: HTMLElement | string;
    /** 文件名（不含扩展名） */
    fileName?: string;
    /** 按钮文字 */
    buttonText?: string;
    /** 是否显示下载图标 */
    showDownloadIcon?: boolean;
    /** 按钮大小 */
    size?: 'small' | 'middle' | 'large';
    /** 按钮类型 */
    type?: 'default' | 'primary' | 'link';
    /** 自定义样式 */
    style?: React.CSSProperties;
    /** 截图前的回调，可以用于临时显示/隐藏元素 */
    beforeCapture?: () => void | Promise<void>;
    /** 截图后的回调 */
    afterCapture?: () => void | Promise<void>;
}

/**
 * 分享图片按钮组件
 * 可以将指定的 DOM 元素转换为图片并下载
 */
export default function ShareImageButton({
    targetElement,
    fileName = 'share-image',
    buttonText,
    showDownloadIcon = true,
    size = 'small',
    type = 'link',
    style,
    beforeCapture,
    afterCapture,
}: ShareImageButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleShare = async () => {
        try {
            setLoading(true);

            // 执行截图前的回调
            if (beforeCapture) {
                await beforeCapture();
            }

            // 获取目标元素
            let element: HTMLElement | null = null;
            if (typeof targetElement === 'string') {
                element = document.querySelector(targetElement) as HTMLElement;
            } else {
                element = targetElement;
            }

            if (!element) {
                message.error('未找到要分享的元素');
                return;
            }

            // 等待元素完全渲染和布局计算完成
            await new Promise(resolve => setTimeout(resolve, 300));
            
            // 强制重新计算布局
            void element.offsetHeight;

            // 滚动到元素位置，确保元素完全可见
            element.scrollIntoView({ behavior: 'instant', block: 'start' });
            await new Promise(resolve => setTimeout(resolve, 100));

            // 使用 html-to-image 截图（对现代 CSS 支持更好）
            const dataUrl = await toPng(element, {
                backgroundColor: '#ffffff',
                pixelRatio: window.devicePixelRatio || 2, // 使用设备像素比提高清晰度
                quality: 1,
                cacheBust: true,
                style: {
                    transform: 'scale(1)',
                },
            });

            // 创建下载链接
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `${fileName}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            message.success('图片已下载');

            // 执行截图后的回调
            if (afterCapture) {
                await afterCapture();
            }
        } catch (error) {
            console.error('分享图片失败:', error);
            message.error('分享图片失败，请重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            type={type}
            size={size}
            icon={showDownloadIcon ? <DownloadOutlined /> : <ShareAltOutlined />}
            onClick={handleShare}
            loading={loading}
            style={style}
        >
            {buttonText}
        </Button>
    );
}

