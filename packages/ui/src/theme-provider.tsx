import { useLayoutEffect, useState, type ReactNode } from 'react';
import { ConfigProvider, theme, type ThemeConfig } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { StyleProvider } from '@ant-design/cssinjs';

// CSS is the source of truth. Ant Design derives its full palette from these tokens.
function readTheme(): ThemeConfig {
  const css = getComputedStyle(document.body);
  const token = (name: string) => css.getPropertyValue(name).trim();
  const number = (name: string) => Number.parseFloat(token(name));
  return {
    algorithm: document.body.classList.contains('dark') ? theme.darkAlgorithm : theme.defaultAlgorithm,
    cssVar: { key: 'algovision' },
    token: {
      colorPrimary: token('--accent'), colorPrimaryHover: token('--accent-bright'),
      colorSuccess: token('--success'), colorWarning: token('--warning'), colorError: token('--danger'),
      colorBgBase: token('--bg'), colorBgContainer: token('--bg-elevated'), colorBgElevated: token('--bg-elevated'),
      colorText: token('--fg'), colorTextSecondary: token('--muted'), colorTextPlaceholder: token('--muted'),
      colorBorder: token('--border-hover'), colorBorderSecondary: token('--border'),
      colorBgMask: token('--overlay'), colorTextLightSolid: token('--on-accent'),
      borderRadius: number('--radius-control'), borderRadiusLG: number('--radius-card'),
      fontFamily: token('--font-sans'), fontFamilyCode: token('--font-mono'), fontSize: number('--font-size-base'),
      controlHeight: number('--control-height'), boxShadow: token('--shadow'), boxShadowSecondary: token('--shadow-modal'),
      motionDurationFast: `${number('--duration-fast') / 1000}s`,
      motionDurationMid: `${number('--duration-normal') / 1000}s`, motionEaseInOut: token('--ease'),
      motion: !window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    },
  };
}
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState(readTheme);
  useLayoutEffect(() => {
    const update = () => setConfig(readTheme());
    const observer = new MutationObserver(update);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'style'] });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class', 'style'] });
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    media.addEventListener('change', update);
    update();
    return () => { observer.disconnect(); media.removeEventListener('change', update); };
  }, []);
  return <StyleProvider layer><ConfigProvider locale={zhCN} theme={config}>{children}</ConfigProvider></StyleProvider>;
}
