import { useEffect } from 'react';
import { Button, Select } from '@algovision/ui';

export function usePageBounds(page: number, size: number, total: number | undefined, setPage: (page: number) => void) {
  useEffect(() => {
    if (total !== undefined && page > Math.max(1, Math.ceil(total / size))) setPage(Math.max(1, Math.ceil(total / size)));
  }, [page, size, total, setPage]);
}

export function Pagination({ page, size, total, busy, hasNext, onPage, onSize }: {
  page: number; size: number; total?: number; busy: boolean; hasNext?: boolean;
  onPage: (page: number) => void; onSize: (size: number) => void;
}) {
  const pages = total === undefined ? undefined : Math.max(1, Math.ceil(total / size));
  return <nav className="pagination" aria-label="列表分页">
    {total !== undefined && <span>共 {total} 条</span>}
    <Select aria-label="每页条数" value={String(size)} options={[10, 20, 50, 100].map(value => ({ value: String(value), label: `每页 ${value} 条` }))} onChange={value => onSize(Number(value))} />
    <Button variant="secondary" disabled={busy || page <= 1} onClick={() => onPage(page - 1)}>上一页</Button>
    <span aria-live="polite">第 {page}{pages === undefined ? '' : ` / ${pages}`} 页</span>
    <Button variant="secondary" disabled={busy || !(hasNext ?? (pages !== undefined && page < pages))} onClick={() => onPage(page + 1)}>下一页</Button>
  </nav>;
}
