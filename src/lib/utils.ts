import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * 合并 Tailwind CSS 类名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 格式化以太币数量
 */
export function formatEther(value: string | number | bigint, decimals: number = 4): string {
  const num = typeof value === 'bigint' ? Number(value) / 1e18 : Number(value);
  return num.toFixed(decimals);
}

/**
 * 格式化钱包地址
 */
export function formatAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * 复制到剪贴板
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy: ', err);
    return false;
  }
}

/**
 * 格式化时间戳
 */
export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString('zh-CN');
}

/**
 * 计算时间差
 */
export function getTimeRemaining(deadline: number): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
} {
  const now = Math.floor(Date.now() / 1000);
  const timeLeft = deadline - now;
  
  if (timeLeft <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isExpired: true,
    };
  }
  
  const days = Math.floor(timeLeft / (24 * 60 * 60));
  const hours = Math.floor((timeLeft % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((timeLeft % (60 * 60)) / 60);
  const seconds = timeLeft % 60;
  
  return {
    days,
    hours,
    minutes,
    seconds,
    isExpired: false,
  };
}

/**
 * 验证以太坊地址
 */
export function isValidAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * 转换 Wei 到 Ether
 */
export function weiToEther(wei: bigint): string {
  return (Number(wei) / 1e18).toString();
}

/**
 * 转换 Ether 到 Wei
 */
export function etherToWei(ether: string): bigint {
  return BigInt(Math.floor(parseFloat(ether) * 1e18));
}

/**
 * 格式化百分比
 */
export function formatPercentage(value: number, decimals: number = 2): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * 获取错误信息
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return '发生未知错误';
}

/**
 * 睡眠函数
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 检查是否为移动设备
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}

/**
 * 生成随机 ID
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
} 