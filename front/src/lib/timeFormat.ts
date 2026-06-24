import { differenceInHours, differenceInDays, format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

/**
 * 智能时间显示
 * - < 1小时: "xx分钟前"
 * - 1-24小时: "xx小时前"
 * - 1天: "昨天 HH:mm"
 * - 2天: "前天 HH:mm"
 * - 3-7天: "x天前"
 * - > 7天: "MM月dd日"
 * - > 1年: "yyyy年MM月dd日"
 */
export function smartTimeDisplay(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const hoursDiff = differenceInHours(now, date);
  const daysDiff = differenceInDays(now, date);

  if (hoursDiff < 1) {
    const mins = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    return mins < 1 ? '刚刚' : `${mins}分钟前`;
  }
  if (hoursDiff < 24) {
    return `${hoursDiff}小时前`;
  }
  if (daysDiff === 1) {
    return `昨天 ${format(date, 'HH:mm')}`;
  }
  if (daysDiff === 2) {
    return `前天 ${format(date, 'HH:mm')}`;
  }
  if (daysDiff <= 7) {
    return `${daysDiff}天前`;
  }
  if (now.getFullYear() === date.getFullYear()) {
    return format(date, 'MM月dd日', { locale: zhCN });
  }
  return format(date, 'yyyy年MM月dd日', { locale: zhCN });
}
