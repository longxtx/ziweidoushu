import type { BirthInput } from '@/engine';

/**
 * 盘库中保存的一张命盘。
 * 仅存排盘输入参数（PRD 9.6），不存盘面结果，避免规则升级后旧盘不更新。
 * 昵称/标签为备注性质，非真实姓名（PRD F5 隐私要求）。
 */
export interface SavedChart {
  id: string;
  /** 备注昵称（非真实姓名） */
  name: string;
  /** 标签：家人 / 朋友 / 客户 等 */
  tags: string[];
  input: BirthInput;
  createdAt: number;
  updatedAt: number;
}
