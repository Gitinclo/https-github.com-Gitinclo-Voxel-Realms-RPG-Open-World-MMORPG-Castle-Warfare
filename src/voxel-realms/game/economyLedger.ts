/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Client-side type definitions for the Voxel Realms economy ledger.
 */

export type LedgerResourceKey =
  | 'diamonds'
  | 'wood'
  | 'steel'
  | 'copper'
  | 'grain'
  | 'oil'
  | 'spiritStones';

export type LedgerTxDirection = 'credit' | 'debit';

export type LedgerTxReason =
  | 'GATHER_REWARD'
  | 'MONSTER_LOOT'
  | 'QUEST_REWARD'
  | 'MARKET_TRADE'
  | 'MARKET_TAX_FEE'
  | 'TROOP_PURCHASE'
  | 'TROOP_PROMOTION'
  | 'CASTLE_UPGRADE'
  | 'VIP_DIAMOND_COVENANT'
  | 'VIP_DAILY_STIPEND'
  | 'SIEGE_REWARD'
  | 'ADMIN_ADJUSTMENT';

export type TroopBranchKey = 'shieldbearers' | 'shooters' | 'bombers';

export type AuthoritativeGameplayActionType =
  | 'GATHER_WOOD_NODE'
  | 'GATHER_GRAIN_NODE'
  | 'GATHER_STEEL_NODE'
  | 'GATHER_OIL_NODE'
  | 'SLAY_PATROL_MONSTER'
  | 'COMPLETE_QUEST_MILESTONE'
  | 'SIEGE_CHECKPOINT_REWARD'
  | 'CLAIM_VIP_DAILY_STIPEND';
