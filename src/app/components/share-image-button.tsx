'use client';
import { useState } from 'react';
import { Button, message } from 'antd';
import { ShareAltOutlined, DownloadOutlined } from '@ant-design/icons';
import html2canvas from 'html2canvas';

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
                // 等待一下，确保 DOM 更新完成
                await new Promise(resolve => setTimeout(resolve, 100));
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

            // 使用 html2canvas 截图
            const canvas = await html2canvas(element, {
                backgroundColor: '#ffffff',
                scale: 2, // 提高图片清晰度
                useCORS: true,
                logging: false,
                allowTaint: false,
                removeContainer: false,
                // 确保正确渲染样式
                onclone: (clonedDoc) => {
                    // 在克隆的文档中强制应用样式，确保截图时样式正确
                    const style = clonedDoc.createElement('style');
                    style.textContent = `
                        .plan-status-badge {
                            display: inline-flex !important;
                            align-items: center !important;
                            justify-content: center !important;
                            line-height: 1 !important;
                            height: 22px !important;
                            box-sizing: border-box !important;
                        }
                    `;
                    clonedDoc.head.appendChild(style);
                },
            });

            // 将 canvas 转换为 blob
            canvas.toBlob((blob) => {
                if (!blob) {
                    message.error('生成图片失败');
                    return;
                }

                // 创建下载链接
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${fileName}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                message.success('图片已下载');
            }, 'image/png');

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

