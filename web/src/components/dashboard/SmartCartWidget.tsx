/**
 * SmartCartWidget Component
 * 
 * Comprehensive dashboard widget displaying:
 * - Real-time inventory status overview
 * - Quick expiration alerts (items expiring within 3 days)
 * - Shopping list summaries
 * - Quick action buttons for common tasks
 * 
 * Features:
 * - Neo-brutalism design with clean grid layout
 * - Color-coded urgency indicators (red/yellow/green)
 * - Responsive on mobile, tablet, desktop
 * - Real-time data sync with Supabase
 * - Performance optimized with useMemo
 */

'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { AlertCircle, ShoppingCart, Package, Clock, TrendingUp } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface InventoryItem {
  id: string
  ingredient_id: string
  item_name: string
  quantity: number
  unit: string
  location: string
  expiration_date: string | null
  min_quantity: number
}

interface ShoppingListSummary {
  total_lists: number
  total_items: number
  completed_items: number
  pending_lists: number
}

interface ExpirationAlert {
  id: string
  item_name: string
  days_until_expiry: number
  urgency: 'critical' | 'warning' | 'info'
  quantity: number
  unit: string
}

interface CartMetrics {
  total_items: number
  expiring_soon: number
  low_stock: number
  shopping_pending: number
}

/**
 * Format date to human-readable string
 */
const formatDate = (date: string | null): string => {
  if (!date) return 'No expiry'
  const d = new Date(date)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/**
 * Calculate days until expiration
 */
const getDaysUntilExpiry = (expirationDate: string | null): number => {
  if (!expirationDate) return 365
  const expiry = new Date(expirationDate)
  const today = new Date()
  const diff = expiry.getTime() - today.getTime()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

/**
 * Determine urgency level based on days
 */
const getUrgencyLevel = (days: number): 'critical' | 'warning' | 'info' => {
  if (days <= 1) return 'critical'
  if (days <= 3) return 'warning'
  return 'info'
}

/**
 * Get urgency color for UI
 */
const getUrgencyColor = (urgency: 'critical' | 'warning' | 'info'): string => {
  switch (urgency) {
    case 'critical': return '#ef4444' // red
    case 'warning': return '#f59e0b' // amber
    case 'info': return '#10b981' // green
  }
}

export const SmartCartWidget: React.FC = () => {
  const router = useRouter()
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [shoppingLists, setShoppingLists] = useState<ShoppingListSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch inventory data from API
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const [invRes, shoppingRes] = await Promise.all([
          fetch('/api/inventory'),
          fetch('/api/shopping-lists/summary')
        ])

        if (!invRes.ok || !shoppingRes.ok) {
          throw new Error('Failed to fetch data')
        }

        const invData = await invRes.json()
        const shoppingData = await shoppingRes.json()

        setInventory(Array.isArray(invData) ? invData : invData.data || [])
        setShoppingLists(shoppingData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading data')
        console.error('SmartCartWidget fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  /**
   * Calculate metrics using useMemo for performance
   */
  const metrics: CartMetrics = useMemo(() => {
    const expiringItems = inventory.filter(item => {
      const days = getDaysUntilExpiry(item.expiration_date)
      return days <= 3 && days >= 0
    })

    const lowStockItems = inventory.filter(
      item => item.quantity < item.min_quantity
    )

    return {
      total_items: inventory.length,
      expiring_soon: expiringItems.length,
      low_stock: lowStockItems.length,
      shopping_pending: shoppingLists?.pending_lists || 0
    }
  }, [inventory, shoppingLists])

  /**
   * Get expiration alerts
   */
  const expirationAlerts: ExpirationAlert[] = useMemo(() => {
    return inventory
      .filter(item => item.expiration_date)
      .map(item => ({
        id: item.id,
        item_name: item.item_name,
        days_until_expiry: getDaysUntilExpiry(item.expiration_date),
        urgency: getUrgencyLevel(getDaysUntilExpiry(item.expiration_date)),
        quantity: item.quantity,
        unit: item.unit
      }))
      .filter(alert => alert.days_until_expiry <= 3 && alert.days_until_expiry >= 0)
      .sort((a, b) => a.days_until_expiry - b.days_until_expiry)
      .slice(0, 5) // Show top 5
  }, [inventory])

  if (loading) {
    return (
      <div className="bg-white border-4 border-black p-6 rounded-none">
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded-none w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded-none w-1/2"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-4 border-black p-6 bg-white rounded-none">
        <h2 className="text-2xl font-black tracking-tight uppercase">
          Smart Cart Dashboard
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          Real-time inventory & shopping overview
        </p>
      </div>

      {/* Metrics Grid - 2x2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Total Items */}
        <div
          className="bg-blue-50 border-4 border-blue-900 p-4 rounded-none cursor-pointer hover:bg-blue-100 transition-colors"
          onClick={() => router.push('/dashboard/inventory')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold uppercase text-gray-600">Inventory Items</p>
              <p className="text-4xl font-black text-blue-900">{metrics.total_items}</p>
            </div>
            <Package className="w-12 h-12 text-blue-900 opacity-30" />
          </div>
        </div>

        {/* Expiring Soon */}
        <div
          className={`border-4 p-4 rounded-none cursor-pointer transition-colors ${
            metrics.expiring_soon > 0
              ? 'bg-red-50 border-red-900 hover:bg-red-100'
              : 'bg-green-50 border-green-900 hover:bg-green-100'
          }`}
          onClick={() => router.push('/dashboard/inventory?filter=expiring')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold uppercase text-gray-600">Expiring Soon</p>
              <p className={`text-4xl font-black ${
                metrics.expiring_soon > 0 ? 'text-red-900' : 'text-green-900'
              }`}>
                {metrics.expiring_soon}
              </p>
            </div>
            <Clock className={`w-12 h-12 opacity-30 ${
              metrics.expiring_soon > 0 ? 'text-red-900' : 'text-green-900'
            }`} />
          </div>
        </div>

        {/* Low Stock */}
        <div
          className={`border-4 p-4 rounded-none cursor-pointer transition-colors ${
            metrics.low_stock > 0
              ? 'bg-yellow-50 border-yellow-900 hover:bg-yellow-100'
              : 'bg-green-50 border-green-900 hover:bg-green-100'
          }`}
          onClick={() => router.push('/dashboard/inventory?filter=low-stock')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold uppercase text-gray-600">Low Stock</p>
              <p className={`text-4xl font-black ${
                metrics.low_stock > 0 ? 'text-yellow-900' : 'text-green-900'
              }`}>
                {metrics.low_stock}
              </p>
            </div>
            <AlertCircle className={`w-12 h-12 opacity-30 ${
              metrics.low_stock > 0 ? 'text-yellow-900' : 'text-green-900'
            }`} />
          </div>
        </div>

        {/* Shopping Pending */}
        <div
          className="bg-purple-50 border-4 border-purple-900 p-4 rounded-none cursor-pointer hover:bg-purple-100 transition-colors"
          onClick={() => router.push('/dashboard/shopping')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-bold uppercase text-gray-600">Shopping Lists</p>
              <p className="text-4xl font-black text-purple-900">
                {shoppingLists?.pending_lists || 0}
              </p>
            </div>
            <ShoppingCart className="w-12 h-12 text-purple-900 opacity-30" />
          </div>
        </div>
      </div>

      {/* Expiration Alerts Section */}
      {expirationAlerts.length > 0 && (
        <div className="border-4 border-black p-6 bg-white rounded-none">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h3 className="text-lg font-black uppercase">Expiring Items</h3>
          </div>

          <div className="space-y-2">
            {expirationAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between p-3 border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="w-4 h-4 rounded-full border-2 border-black"
                    style={{ backgroundColor: getUrgencyColor(alert.urgency) }}
                  ></div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">{alert.item_name}</p>
                    <p className="text-xs text-gray-600">
                      {alert.quantity} {alert.unit}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase text-red-600">
                    {alert.days_until_expiry === 0 ? 'TODAY' : 
                     alert.days_until_expiry === 1 ? 'TOMORROW' :
                     `${alert.days_until_expiry}D LEFT`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => router.push('/dashboard/inventory')}
          className="bg-black text-white border-4 border-black p-4 font-bold uppercase text-sm rounded-none hover:bg-gray-800 transition-colors"
        >
          Manage Inventory
        </button>
        <button
          onClick={() => router.push('/dashboard/shopping')}
          className="bg-black text-white border-4 border-black p-4 font-bold uppercase text-sm rounded-none hover:bg-gray-800 transition-colors"
        >
          Shopping Lists
        </button>
        <button
          onClick={() => router.push('/dashboard/recommender')}
          className="bg-black text-white border-4 border-black p-4 font-bold uppercase text-sm rounded-none hover:bg-gray-800 transition-colors"
        >
          Get Recipes
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border-4 border-red-900 p-4 rounded-none">
          <p className="text-sm text-red-900 font-bold">Error: {error}</p>
        </div>
      )}
    </div>
  )
}

export default SmartCartWidget
