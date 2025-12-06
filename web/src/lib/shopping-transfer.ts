/**
 * Shopping List to Inventory Transfer Workflow
 * 
 * Automatically transfer purchased shopping list items to user's inventory
 * after marking them as checked/completed in shopping list view.
 * 
 * Features:
 * - Bulk transfer of checked items to inventory
 * - Auto-calculate expiration dates based on item type
 * - Location assignment (fridge, pantry, freezer)
 * - Undo functionality
 * - Transfer history tracking
 */

'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'

interface ShoppingListItem {
  id: string
  shopping_list_id: string
  ingredient_id: string | null
  item_name: string
  quantity: number
  unit: string
  category: string
  is_checked: boolean
  position: number
  created_at: string
}

interface TransferConfig {
  item_name: string
  quantity: number
  unit: string
  location: 'Fridge' | 'Freezer' | 'Pantry'
  expiration_date: string | null
  min_quantity: number
}

/**
 * Calculate default expiration date based on item category
 */
const getDefaultExpirationDate = (category: string): string | null => {
  const today = new Date()
  let days = 14 // Default: 2 weeks

  // Category-specific defaults
  const expirationMap: { [key: string]: number } = {
    'Dairy': 7,
    'Meat': 3,
    'Seafood': 2,
    'Produce': 5,
    'Pantry': null, // No expiry for pantry items
    'Frozen': null,
    'Beverages': 30
  }

  days = expirationMap[category] || days

  if (days === null) return null

  today.setDate(today.getDate() + days)
  return today.toISOString().split('T')[0]
}

/**
 * Get default location based on item category
 */
const getDefaultLocation = (category: string): 'Fridge' | 'Freezer' | 'Pantry' => {
  const locationMap: { [key: string]: 'Fridge' | 'Freezer' | 'Pantry' } = {
    'Dairy': 'Fridge',
    'Meat': 'Freezer',
    'Seafood': 'Freezer',
    'Produce': 'Fridge',
    'Pantry': 'Pantry',
    'Frozen': 'Freezer',
    'Beverages': 'Fridge'
  }

  return locationMap[category] || 'Pantry'
}

/**
 * Transfer checked shopping list items to inventory
 */
export async function transferItemsToInventory(
  shoppingListId: string,
  checkedItems: ShoppingListItem[],
  userId: string
) {
  const supabase = createClient()
  const transferredItems = []

  try {
    // Prepare transfer configs
    const configs: TransferConfig[] = checkedItems.map(item => ({
      item_name: item.item_name,
      quantity: item.quantity,
      unit: item.unit,
      location: getDefaultLocation(item.category),
      expiration_date: getDefaultExpirationDate(item.category),
      min_quantity: Math.ceil(item.quantity * 0.5) // Set min qty to 50% of current
    }))

    // Insert all items into inventory
    for (const config of configs) {
      const { data, error } = await supabase
        .from('user_inventory')
        .insert({
          user_id: userId,
          ingredient_id: null,
          item_name: config.item_name,
          quantity: config.quantity,
          unit: config.unit,
          location: config.location,
          expiration_date: config.expiration_date,
          min_quantity: config.min_quantity,
          notes: `Transferred from shopping list on ${new Date().toLocaleDateString()}`
        })
        .select()
        .single()

      if (error) {
        console.error('Failed to transfer item:', error)
        continue
      }

      transferredItems.push(data)
    }

    // Mark items as checked in shopping list
    for (const item of checkedItems) {
      await supabase
        .from('shopping_list_items')
        .update({ is_checked: true })
        .eq('id', item.id)
    }

    // Create transfer history record
    await supabase
      .from('shopping_list_transfers')
      .insert({
        shopping_list_id: shoppingListId,
        user_id: userId,
        transferred_items_count: transferredItems.length,
        transferred_at: new Date().toISOString(),
        transferred_items: transferredItems.map(item => ({
          name: item.item_name,
          quantity: item.quantity,
          unit: item.unit
        }))
      })

    return {
      success: true,
      transferred_count: transferredItems.length,
      items: transferredItems
    }
  } catch (error) {
    console.error('Transfer error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transfer failed',
      transferred_count: transferredItems.length,
      items: transferredItems
    }
  }
}

/**
 * Get transfer history for a shopping list
 */
export async function getTransferHistory(shoppingListId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('shopping_list_transfers')
    .select('*')
    .eq('shopping_list_id', shoppingListId)
    .order('transferred_at', { ascending: false })

  if (error) {
    console.error('Failed to fetch transfer history:', error)
    return []
  }

  return data || []
}

/**
 * Undo last transfer (move items back to shopping list as unchecked)
 */
export async function undoLastTransfer(shoppingListId: string, userId: string) {
  const supabase = createClient()

  try {
    // Get last transfer record
    const { data: transfers, error: fetchError } = await supabase
      .from('shopping_list_transfers')
      .select('*')
      .eq('shopping_list_id', shoppingListId)
      .eq('user_id', userId)
      .order('transferred_at', { ascending: false })
      .limit(1)
      .single()

    if (fetchError || !transfers) {
      return { success: false, error: 'No transfer to undo' }
    }

    // Mark shopping list items as unchecked
    const { error: updateError } = await supabase
      .from('shopping_list_items')
      .update({ is_checked: false })
      .eq('shopping_list_id', shoppingListId)

    if (updateError) {
      return { success: false, error: updateError.message }
    }

    // Delete transfer history record
    await supabase
      .from('shopping_list_transfers')
      .delete()
      .eq('id', transfers.id)

    return { success: true, message: 'Transfer undone successfully' }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Undo failed'
    }
  }
}

/**
 * Get summary statistics for transfers
 */
export async function getTransferStats(userId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('shopping_list_transfers')
    .select('transferred_items_count')
    .eq('user_id', userId)

  if (error) {
    console.error('Failed to fetch transfer stats:', error)
    return { total_transfers: 0, total_items_transferred: 0 }
  }

  const transfers = data || []
  const totalItemsTransferred = transfers.reduce((sum, t) => sum + (t.transferred_items_count || 0), 0)

  return {
    total_transfers: transfers.length,
    total_items_transferred: totalItemsTransferred,
    avg_items_per_transfer: transfers.length > 0 ? Math.round(totalItemsTransferred / transfers.length) : 0
  }
}

/**
 * React Hook for managing transfers
 */
export function useShoppingTransfer() {
  const [isTransferring, setIsTransferring] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastTransferResult, setLastTransferResult] = useState<any>(null)

  const transfer = async (
    shoppingListId: string,
    checkedItems: ShoppingListItem[],
    userId: string
  ) => {
    setIsTransferring(true)
    setError(null)

    try {
      const result = await transferItemsToInventory(
        shoppingListId,
        checkedItems,
        userId
      )

      if (result.success) {
        setLastTransferResult(result)
        return result
      } else {
        setError(result.error)
        return result
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Transfer failed'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setIsTransferring(false)
    }
  }

  const undo = async (shoppingListId: string, userId: string) => {
    setIsTransferring(true)
    setError(null)

    try {
      const result = await undoLastTransfer(shoppingListId, userId)
      if (!result.success) {
        setError(result.error)
      }
      return result
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Undo failed'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setIsTransferring(false)
    }
  }

  return {
    transfer,
    undo,
    isTransferring,
    error,
    lastTransferResult
  }
}

/**
 * Migration SQL for new tables
 */
export const TRANSFER_MIGRATIONS = `
-- Table for tracking shopping list to inventory transfers
CREATE TABLE IF NOT EXISTS shopping_list_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shopping_list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transferred_items_count INTEGER NOT NULL DEFAULT 0,
  transferred_items JSONB DEFAULT '[]',
  transferred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for performance
  CONSTRAINT shopping_list_transfers_shopping_list_id_idx 
    UNIQUE(shopping_list_id, transferred_at)
);

-- RLS policies
ALTER TABLE shopping_list_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own transfer history"
  ON shopping_list_transfers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create transfer records"
  ON shopping_list_transfers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transfer records"
  ON shopping_list_transfers FOR DELETE
  USING (auth.uid() = user_id);

-- Index for performance
CREATE INDEX shopping_list_transfers_user_id_idx 
  ON shopping_list_transfers(user_id, transferred_at DESC);
CREATE INDEX shopping_list_transfers_shopping_list_id_idx 
  ON shopping_list_transfers(shopping_list_id);
`
