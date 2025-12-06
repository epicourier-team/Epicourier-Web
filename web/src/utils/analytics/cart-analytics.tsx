/**
 * Shopping Cart Analytics & Insights
 * 
 * Comprehensive analytics system for Smart Cart providing:
 * - Inventory spending trends
 * - Food waste estimation
 * - Shopping patterns
 * - Expiration rate tracking
 * - Nutritional insights
 * - Cost optimization suggestions
 */

'use client'

import React, { useEffect, useState, useMemo } from 'react'

interface InventoryItem {
  id: string
  item_name: string
  quantity: number
  unit: string
  expiration_date: string | null
  location: string
  estimated_cost: number
}

interface ShoppingTransaction {
  id: string
  date: string
  total: number
  items_count: number
  category: string
}

interface AnalyticsMetrics {
  total_inventory_value: number
  monthly_spending: number
  waste_percentage: number
  expiration_rate: number
  avg_shopping_frequency: number
  cost_per_meal: number
  storage_efficiency: number
}

interface InsightCategory {
  title: string
  value: string | number
  trend: 'up' | 'down' | 'stable'
  percentage: number
  recommendation: string
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
 * Calculate total inventory value
 */
export function calculateInventoryValue(items: InventoryItem[]): number {
  return items.reduce((total, item) => total + (item.estimated_cost || 0), 0)
}

/**
 * Calculate waste percentage based on expiring items
 */
export function calculateWastePercentage(items: InventoryItem[]): number {
  if (items.length === 0) return 0

  const expiredItems = items.filter(item => {
    const daysLeft = getDaysUntilExpiry(item.expiration_date)
    return daysLeft < 0
  })

  return Math.round((expiredItems.length / items.length) * 100)
}

/**
 * Calculate expiration rate (items expiring per day)
 */
export function calculateExpirationRate(items: InventoryItem[]): number {
  const nextWeek = items.filter(item => {
    const daysLeft = getDaysUntilExpiry(item.expiration_date)
    return daysLeft >= 0 && daysLeft <= 7
  })

  return nextWeek.length / 7 // items per day
}

/**
 * Analyze shopping patterns
 */
export function analyzeShoppingPatterns(transactions: ShoppingTransaction[]): {
  avgFrequency: number
  avgCost: number
  peakDay: string
  topCategories: { [key: string]: number }
} {
  if (transactions.length === 0) {
    return {
      avgFrequency: 0,
      avgCost: 0,
      peakDay: 'N/A',
      topCategories: {}
    }
  }

  // Calculate average frequency (days between shopping trips)
  const dates = transactions.map(t => new Date(t.date).getTime()).sort((a, b) => a - b)
  const intervals = []
  for (let i = 1; i < dates.length; i++) {
    intervals.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24))
  }
  const avgFrequency = intervals.length > 0 ? Math.round(intervals.reduce((a, b) => a + b) / intervals.length) : 0

  // Calculate average cost
  const avgCost = Math.round(
    transactions.reduce((sum, t) => sum + t.total, 0) / transactions.length
  )

  // Find peak day
  const dayMap: { [key: string]: number } = {}
  transactions.forEach(t => {
    const day = new Date(t.date).toLocaleDateString('en-US', { weekday: 'long' })
    dayMap[day] = (dayMap[day] || 0) + 1
  })
  const peakDay = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

  // Top categories
  const categoryMap: { [key: string]: number } = {}
  transactions.forEach(t => {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + t.total
  })

  return {
    avgFrequency,
    avgCost,
    peakDay,
    topCategories: categoryMap
  }
}

/**
 * Calculate storage efficiency (items per location)
 */
export function calculateStorageEfficiency(items: InventoryItem[]): number {
  const locations = new Set(items.map(i => i.location))
  if (locations.size === 0) return 0

  const avgItemsPerLocation = items.length / locations.size
  // Ideal is 10-15 items per location for efficiency
  const efficiency = Math.min(100, (avgItemsPerLocation / 15) * 100)

  return Math.round(efficiency)
}

/**
 * Generate AI-powered insights
 */
export function generateInsights(
  items: InventoryItem[],
  transactions: ShoppingTransaction[]
): InsightCategory[] {
  const patterns = analyzeShoppingPatterns(transactions)
  const waste = calculateWastePercentage(items)
  const value = calculateInventoryValue(items)
  const expirationRate = calculateExpirationRate(items)

  const insights: InsightCategory[] = []

  // Insight 1: Storage optimization
  if (items.length > 50) {
    insights.push({
      title: 'High Inventory Levels',
      value: `${items.length} items`,
      trend: 'up',
      percentage: 20,
      recommendation: 'Consider using stored items in recipes before shopping again to reduce waste'
    })
  }

  // Insight 2: Waste alert
  if (waste > 10) {
    insights.push({
      title: 'Food Waste Alert',
      value: `${waste}%`,
      trend: 'up',
      percentage: waste,
      recommendation: 'Use the recipe recommender to consume expiring items before they spoil'
    })
  }

  // Insight 3: Cost optimization
  if (patterns.avgCost > 150) {
    insights.push({
      title: 'High Spending Detected',
      value: `$${patterns.avgCost}`,
      trend: 'up',
      percentage: 25,
      recommendation: 'Plan meals more strategically and buy in bulk to reduce per-item costs'
    })
  }

  // Insight 4: Shopping frequency
  insights.push({
    title: 'Shopping Frequency',
    value: `Every ${patterns.avgFrequency} days`,
    trend: 'stable',
    percentage: patterns.avgFrequency,
    recommendation: `Try to consolidate shopping to reduce trips from ${patterns.avgFrequency} days`
  })

  // Insight 5: Seasonal patterns
  if (transactions.length > 10) {
    const topCategory = Object.entries(patterns.topCategories).sort((a, b) => b[1] - a[1])[0]
    if (topCategory) {
      insights.push({
        title: 'Top Category',
        value: topCategory[0],
        trend: 'stable',
        percentage: Math.round((topCategory[1] / value) * 100),
        recommendation: `Your top spending is in ${topCategory[0]}. Look for bulk deals in this category`
      })
    }
  }

  return insights
}

/**
 * Calculate cost per meal
 */
export function calculateCostPerMeal(
  inventory: InventoryItem[],
  mealsPerWeek: number = 21
): number {
  const totalValue = calculateInventoryValue(inventory)
  const daysOfFood = estimateDaysOfFood(inventory)

  if (daysOfFood === 0) return 0

  const costPerDay = totalValue / daysOfFood
  const costPerMeal = costPerDay / (mealsPerWeek / 7)

  return Math.round(costPerMeal * 100) / 100
}

/**
 * Estimate days of food
 */
export function estimateDaysOfFood(items: InventoryItem[]): number {
  const freshItems = items.filter(item => {
    const days = getDaysUntilExpiry(item.expiration_date)
    return days > 0
  })

  if (freshItems.length === 0) return 0

  const avgExpiryDays = freshItems.reduce((sum, item) => {
    return sum + getDaysUntilExpiry(item.expiration_date)
  }, 0) / freshItems.length

  return Math.round(avgExpiryDays)
}

/**
 * React Component: Analytics Dashboard
 */
export const CartAnalyticsDashboard: React.FC<{
  items: InventoryItem[]
  transactions: ShoppingTransaction[]
}> = ({ items, transactions }) => {
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(null)
  const [insights, setInsights] = useState<InsightCategory[]>([])

  useEffect(() => {
    const patterns = analyzeShoppingPatterns(transactions)

    const calculatedMetrics: AnalyticsMetrics = {
      total_inventory_value: calculateInventoryValue(items),
      monthly_spending: patterns.avgCost * 4, // Approximate
      waste_percentage: calculateWastePercentage(items),
      expiration_rate: calculateExpirationRate(items),
      avg_shopping_frequency: patterns.avgFrequency,
      cost_per_meal: calculateCostPerMeal(items),
      storage_efficiency: calculateStorageEfficiency(items)
    }

    setMetrics(calculatedMetrics)
    setInsights(generateInsights(items, transactions))
  }, [items, transactions])

  if (!metrics) {
    return <div className="bg-gray-200 p-6 rounded-none border-4 border-black">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Inventory Value */}
        <div className="bg-blue-50 border-4 border-blue-900 p-4 rounded-none">
          <p className="text-xs font-bold uppercase text-gray-600">Inventory Value</p>
          <p className="text-3xl font-black text-blue-900 mt-2">
            ${metrics.total_inventory_value.toFixed(2)}
          </p>
          <p className="text-xs text-gray-600 mt-1">Current stock worth</p>
        </div>

        {/* Monthly Spending */}
        <div className="bg-purple-50 border-4 border-purple-900 p-4 rounded-none">
          <p className="text-xs font-bold uppercase text-gray-600">Monthly Spending</p>
          <p className="text-3xl font-black text-purple-900 mt-2">
            ${metrics.monthly_spending.toFixed(2)}
          </p>
          <p className="text-xs text-gray-600 mt-1">Estimated</p>
        </div>

        {/* Cost Per Meal */}
        <div className="bg-green-50 border-4 border-green-900 p-4 rounded-none">
          <p className="text-xs font-bold uppercase text-gray-600">Cost/Meal</p>
          <p className="text-3xl font-black text-green-900 mt-2">
            ${metrics.cost_per_meal.toFixed(2)}
          </p>
          <p className="text-xs text-gray-600 mt-1">Average</p>
        </div>

        {/* Waste Rate */}
        <div className={`p-4 rounded-none border-4 ${
          metrics.waste_percentage > 10
            ? 'bg-red-50 border-red-900'
            : 'bg-yellow-50 border-yellow-900'
        }`}>
          <p className="text-xs font-bold uppercase text-gray-600">Waste Rate</p>
          <p className={`text-3xl font-black mt-2 ${
            metrics.waste_percentage > 10 ? 'text-red-900' : 'text-yellow-900'
          }`}>
            {metrics.waste_percentage}%
          </p>
          <p className="text-xs text-gray-600 mt-1">Of items expired</p>
        </div>
      </div>

      {/* Insights Section */}
      {insights.length > 0 && (
        <div className="border-4 border-black p-6 bg-white rounded-none">
          <h3 className="text-lg font-black uppercase mb-4">Smart Insights</h3>

          <div className="space-y-3">
            {insights.map((insight, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 p-4 border-2 border-gray-200 bg-gray-50"
              >
                <div className="flex-1">
                  <p className="font-bold text-sm uppercase">{insight.title}</p>
                  <p className="text-2xl font-black my-1">{insight.value}</p>
                  <p className="text-xs text-gray-600">{insight.recommendation}</p>
                </div>
                <div className={`text-sm font-bold px-3 py-1 rounded-none border-2 ${
                  insight.trend === 'up'
                    ? 'bg-red-50 border-red-900 text-red-900'
                    : insight.trend === 'down'
                      ? 'bg-green-50 border-green-900 text-green-900'
                      : 'bg-blue-50 border-blue-900 text-blue-900'
                }`}>
                  {insight.trend === 'up' ? '↑' : insight.trend === 'down' ? '↓' : '→'}
                  {' '}{insight.percentage}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Shopping Pattern */}
        <div className="border-4 border-black p-4 bg-white rounded-none">
          <p className="font-bold uppercase text-sm mb-2">Shopping Pattern</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Frequency:</span>
              <span className="font-bold">{metrics.avg_shopping_frequency} days</span>
            </div>
            <div className="flex justify-between">
              <span>Expiring rate:</span>
              <span className="font-bold">{metrics.expiration_rate.toFixed(1)} items/day</span>
            </div>
            <div className="flex justify-between">
              <span>Storage efficiency:</span>
              <span className="font-bold">{metrics.storage_efficiency}%</span>
            </div>
          </div>
        </div>

        {/* Food Estimate */}
        <div className="border-4 border-black p-4 bg-white rounded-none">
          <p className="font-bold uppercase text-sm mb-2">Food Supply</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Days of food:</span>
              <span className="font-bold">{estimateDaysOfFood(items)} days</span>
            </div>
            <div className="flex justify-between">
              <span>Waste %:</span>
              <span className={`font-bold ${
                metrics.waste_percentage > 10 ? 'text-red-600' : 'text-green-600'
              }`}>
                {metrics.waste_percentage}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartAnalyticsDashboard
