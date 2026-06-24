import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import type { TemplateStyles } from '@/types/card';

// ─── parseDate：日期解析（共享） ──────────────────────────────────────────────

function parseDate(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return { day: '--', yearMonth: '', chinese: '' };
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return {
    day,
    yearMonth: `${year}/${month}`,
    chinese: `${year}年${month}月${day}日`,
  };
}

// ─── CardHeader ──────────────────────────────────────────────────────────────

export interface CardHeaderProps {
  styleId: string;
  date: string;
  text: string;
  text2?: string;
  avatarUrl?: string;
  styles: TemplateStyles;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ styleId, date, text, text2, avatarUrl, styles }) => {
  const { day, yearMonth, chinese } = parseDate(date);

  // style2：日期 + 文本（大日期数字左 + 年/月 + 文本右）
  if (styleId === 'style2') {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', paddingBottom: '10px', borderBottom: `1px solid ${styles.dividerColor ?? styles.accentColor}40` }}>
        <div>
          <div style={{ fontSize: '2.2em', fontWeight: '700', color: styles.headerDateColor, lineHeight: 1 }}>{day}</div>
          <div style={{ fontSize: '0.78em', color: styles.headerDateColor, opacity: 0.8, marginTop: '2px' }}>{yearMonth}</div>
        </div>
        <div style={{ fontSize: '0.85em', color: styles.headerTextColor, fontWeight: '500' }}>{text}</div>
      </div>
    );
  }

  // style3：LOGO + 日期（圆形头像上方 + 中文日期下方）
  if (styleId === 'style3') {
    return (
      <div style={{ marginBottom: '14px', paddingBottom: '12px', borderBottom: `1px solid ${styles.dividerColor ?? styles.accentColor}40` }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', background: `${styles.listNumberBg}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px', flexShrink: 0 }}>
          {avatarUrl
            ? <img src={avatarUrl} alt="头像" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: '0.65em', color: styles.headerTextColor, opacity: 0.5 }}>头像</span>
          }
        </div>
        <div style={{ fontSize: '0.85em', color: styles.headerDateColor, fontWeight: '500' }}>{chinese}</div>
      </div>
    );
  }

  // style1（默认）：文本 + 文本（左文本 + 右文本，无日期）
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingBottom: '10px', borderBottom: `1px solid ${styles.dividerColor ?? styles.accentColor}40` }}>
      <div style={{ fontSize: '0.9em', fontWeight: '600', color: styles.headerDateColor }}>{text}</div>
      <div style={{ fontSize: '0.85em', color: styles.headerTextColor, opacity: 0.8 }}>{text2 ?? ''}</div>
    </div>
  );
};

// ─── CardFooter ──────────────────────────────────────────────────────────────

export interface CardFooterProps {
  styleId: string;
  qrcodeType?: 'link' | 'text';
  qrcodeValue: string;
  text1: string;
  text2: string;
  styles: TemplateStyles;
  /** 是否隐藏二维码（分页模式下不需要） */
  hideQrCode?: boolean;
}

export const CardFooter: React.FC<CardFooterProps> = ({ styleId, qrcodeValue, text1, text2, styles, hideQrCode }) => {
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    if (hideQrCode || !qrcodeValue) return;
    let cancelled = false;
    QRCode.toDataURL(qrcodeValue, { width: 80, margin: 1, color: { dark: styles.textColor, light: 'transparent' } })
      .then(url => { if (!cancelled) setQrDataUrl(url); })
      .catch(() => { if (!cancelled) setQrDataUrl(''); });
    return () => { cancelled = true; };
  }, [qrcodeValue, styles.textColor, hideQrCode]);

  if (styleId === 'style3') {
    // 纯文字样式
    return (
      <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${styles.dividerColor ?? styles.accentColor}40`, textAlign: 'center' }}>
        <div style={{ fontSize: '0.85em', fontWeight: '600', color: styles.headerTextColor }}>{text1}</div>
        {text2 && <div style={{ fontSize: '0.75em', color: styles.textColor, opacity: 0.7, marginTop: '2px' }}>{text2}</div>}
      </div>
    );
  }

  if (styleId === 'style2') {
    // 二维码居中
    return (
      <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${styles.dividerColor ?? styles.accentColor}40`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
        {!hideQrCode && qrDataUrl && <img src={qrDataUrl} alt="QR码" style={{ width: '56px', height: '56px' }} />}
        <div style={{ fontSize: '0.85em', fontWeight: '600', color: styles.headerTextColor }}>{text1}</div>
        {text2 && <div style={{ fontSize: '0.72em', color: styles.textColor, opacity: 0.7 }}>{text2}</div>}
      </div>
    );
  }

  // style1: 默认二维码左置
  return (
    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: `1px solid ${styles.dividerColor ?? styles.accentColor}40`, display: 'flex', alignItems: 'center', gap: '10px' }}>
      {!hideQrCode && qrDataUrl && <img src={qrDataUrl} alt="QR码" style={{ width: '48px', height: '48px', flexShrink: 0 }} />}
      <div>
        <div style={{ fontSize: '0.85em', fontWeight: '600', color: styles.headerTextColor }}>{text1}</div>
        {text2 && <div style={{ fontSize: '0.72em', color: styles.textColor, opacity: 0.7, marginTop: '2px' }}>{text2}</div>}
      </div>
    </div>
  );
};
