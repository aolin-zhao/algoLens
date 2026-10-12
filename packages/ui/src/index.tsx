import { useEffect, useState, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Button as AntButton, Input as AntInput, Modal as AntModal, Tag, Empty as AntEmpty, Select as AntSelect, type ButtonProps, type InputProps } from 'antd';
export { ThemeProvider } from './theme-provider';
export { Drawer, Switch, Modal as SettingsModal } from 'antd';
export const Select = AntSelect;
export const TextArea = AntInput.TextArea;

// Keep business-facing variants stable; Ant Design owns keyboard behavior and interaction.
export function Button({ children, variant = 'primary', type = 'button', className, ...props }: Omit<ButtonProps, 'type' | 'variant' | 'htmlType'> & { type?: ButtonHTMLAttributes<HTMLButtonElement>['type']; variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }) {
  return <AntButton type={variant === 'primary' ? 'primary' : variant === 'ghost' ? 'text' : 'default'} danger={variant === 'danger'} htmlType={type} className={[`button button-${variant}`, className].filter(Boolean).join(' ')} {...props}>{children}</AntButton>;
}
export function Input({ className, ...props }: InputProps) {
  return <AntInput className={['input', className].filter(Boolean).join(' ')} {...props} />;
}
export function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="field"><span>{label}</span>{children}</label>; }
export function Modal({ title, open, onOpenChange, children }: { title: string; open: boolean; onOpenChange: (open: boolean) => void; children: ReactNode }) {
  return <AntModal title={title} open={open} onCancel={() => onOpenChange(false)} footer={null} width={560} className="theme-modal">{children}</AntModal>;
}
export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'green' | 'amber' | 'red' }) {
  return <Tag className={`badge badge-${tone}`}>{children}</Tag>;
}
export function Empty({ text }: { text: string }) { return <AntEmpty className="empty" image={AntEmpty.PRESENTED_IMAGE_SIMPLE} description={text} />; }


const labels: Record<string, string> = {
  easy: '简单', medium: '中等', hard: '困难', draft: '草稿', published: '已发布',
  queued: '排队中', running: '运行中', completed: '已完成', failed: '失败', Ready: '就绪',
  line: '逐行执行', call: '调用函数', return: '返回', exception: '异常',
  problems: '题目', languages: '编程语言', executions: '执行次数', users: '用户',
  'audit-logs': '审计日志', objects: '存储对象', id: '标识', key: '键', name: '名称',
  email: '邮箱', displayName: '昵称', display_name: '昵称', status: '状态',
  createdAt: '创建时间', created_at: '创建时间', updatedAt: '更新时间', updated_at: '更新时间',
  userId: '用户标识', user_id: '用户标识', problemId: '题目标识', problem_id: '题目标识',
  languageId: '语言标识', language_id: '语言标识', isAdmin: '管理员',
  size: '大小', uploaded: '上传时间', etag: '实体标签', action: '操作',
  target: '目标', targetId: '目标标识', targetType: '目标类型', actorId: '操作者标识',
  durationMs: '耗时（毫秒）', exitCode: '退出码', error: '错误', role: '角色', admin: '管理员', user: '用户',
};
export function labelZh(value: string) { return labels[value] ?? value; }
const errors: Record<string, string> = {
  'Request failed': '请求失败，请稍后重试', 'Failed to fetch': '无法连接服务，请检查网络后重试',
  'Invalid credentials': '邮箱或密码不正确', 'Email unavailable': '该邮箱已被使用',
  Unauthorized: '请先登录', 'Login required': '请先登录', Forbidden: '无权访问',
  'Admin required': '需要管理员权限', 'Admin access required': '需要管理员权限',
  'Not found': '未找到相关内容', 'Resource not found': '未找到相关资源',
  'Problem or language unavailable': '题目或编程语言不可用',
  'This language is not executable yet': '暂不支持运行此编程语言',
  'Too many queued runs': '排队任务过多，请稍后再试', 'Trace unavailable': '暂无执行轨迹',
  'Slug already exists': '题目标识已存在', 'Internal server error': '服务异常，请稍后重试',
  'Unsupported trace version': '暂不支持此执行轨迹版本', 'Conflict or invalid reference': '记录冲突或关联内容无效',
  'A runner must be implemented before enabling a language': '请先部署对应的运行器，再启用编程语言',
  'Support level must match the deployed runner': '支持级别必须与已部署的运行器一致',
  'Core admin role cannot be renamed': '无法重命名内置管理员角色',
  'Core admin role cannot be deleted': '无法删除内置管理员角色',
};
export function errorZh(value: unknown): string {
  const message = value instanceof Error ? value.message : String(value);
  return errors[message] ?? message;
}
export function useTheme(storageKey: string) {
  const [dark, setDark] = useState(() => localStorage.getItem(storageKey) !== 'light');
  useEffect(() => {
    document.body.classList.toggle('dark', dark);
    localStorage.setItem(storageKey, dark ? 'dark' : 'light');
  }, [dark, storageKey]);
  return { dark, toggleTheme: () => setDark(current => !current) };
}
export function AmbientBackground() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let pending = 0;
    function spotlight(event: PointerEvent) {
      if (event.pointerType === 'touch' || reduced.matches) return;
      const surface = (event.target as Element).closest<HTMLElement>('.spotlight, .problem-row, .stat, .login-form');
      if (!surface) return;
      const rect = surface.getBoundingClientRect();
      surface.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`);
      surface.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`);
    }
    function scroll() {
      if (pending || reduced.matches) return;
      pending = requestAnimationFrame(() => {
        const hero = document.querySelector<HTMLElement>('.catalog-hero');
        const progress = Math.min(window.scrollY / 600, 1);
        hero?.style.setProperty('--hero-progress', String(progress));
        pending = 0;
      });
    }
    document.addEventListener('pointermove', spotlight, { passive: true });
    window.addEventListener('scroll', scroll, { passive: true });
    return () => {
      document.removeEventListener('pointermove', spotlight);
      window.removeEventListener('scroll', scroll);
      cancelAnimationFrame(pending);
    };
  }, []);
  return <div className="ambient-background" aria-hidden="true"><i /><i /><i /><i /></div>;
}
