'use client'

import { useState } from 'react'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/Button'
import { 
  Download, 
  FileText,
  Calendar,
  Filter,
  BarChart3,
  Users,
  ArrowRightLeft,
  Award
} from 'lucide-react'

interface ReportsProps {
  onRefresh?: () => void
}

export function Reports({ onRefresh }: ReportsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  })

  const downloadReport = async (type: 'users' | 'swaps' | 'skills' | 'activity', format: 'csv' | 'pdf') => {
    try {
      setIsLoading(`${type}-${format}`)
      
      const params = new URLSearchParams({
        type,
        format,
        ...(dateRange.startDate && { startDate: dateRange.startDate }),
        ...(dateRange.endDate && { endDate: dateRange.endDate })
      })
      
      const response = await fetch(`/api/admin/reports?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate report')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
    } catch (err) {
      console.error('Error downloading report:', err)
      alert(err instanceof Error ? err.message : 'Failed to download report')
    } finally {
      setIsLoading(null)
    }
  }

  const reportTypes = [
    {
      id: 'users',
      title: 'User Activity Report',
      description: 'Comprehensive report of user registrations, activity, and engagement metrics',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      id: 'swaps',
      title: 'Skill Swap Report',
      description: 'Analysis of skill exchange requests, completion rates, and success metrics',
      icon: ArrowRightLeft,
      color: 'text-purple-600'
    },
    {
      id: 'skills',
      title: 'Skills Catalog Report',
      description: 'Overview of skills offered, demanded, and approval status across the platform',
      icon: Award,
      color: 'text-yellow-600'
    },
    {
      id: 'activity',
      title: 'Platform Activity Report',
      description: 'General platform usage statistics and trend analysis',
      icon: BarChart3,
      color: 'text-green-600'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900">Reports & Analytics</h3>
        <p className="text-sm text-gray-600">Generate and download comprehensive platform reports</p>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h4 className="text-lg font-medium text-gray-900">Date Range Filter</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                id="startDate"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="date"
                id="endDate"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Leave empty to include all available data
        </p>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {reportTypes.map((report) => {
          const Icon = report.icon
          return (
            <div key={report.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                    <Icon className={`h-6 w-6 ${report.color}`} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-medium text-gray-900">{report.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                  
                  <div className="mt-4 flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={() => downloadReport(report.id as any, 'csv')}
                      variant="outline"
                      size="sm"
                      disabled={isLoading === `${report.id}-csv`}
                      className="flex-1 sm:flex-none"
                    >
                      {isLoading === `${report.id}-csv` ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-1" />
                          CSV
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => downloadReport(report.id as any, 'pdf')}
                      variant="outline"
                      size="sm"
                      disabled={isLoading === `${report.id}-pdf`}
                      className="flex-1 sm:flex-none"
                    >
                      {isLoading === `${report.id}-pdf` ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                      ) : (
                        <>
                          <FileText className="h-4 w-4 mr-1" />
                          PDF
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="text-lg font-medium text-gray-900 mb-4">Quick Report Actions</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={() => downloadReport('activity', 'csv')}
            disabled={!!isLoading}
            className="bg-orange-600 hover:bg-orange-700 justify-start"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Download Complete Activity Report (CSV)
          </Button>
          <Button
            onClick={() => downloadReport('users', 'pdf')}
            disabled={!!isLoading}
            variant="outline"
            className="justify-start"
          >
            <Users className="h-4 w-4 mr-2" />
            Download User Summary (PDF)
          </Button>
        </div>
      </div>

      {/* Report Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FileText className="h-5 w-5 text-blue-600" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Report Information</h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>CSV reports contain detailed raw data for analysis</li>
                <li>PDF reports include formatted summaries and charts</li>
                <li>Date filters apply to creation dates of records</li>
                <li>Reports are generated in real-time from current data</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
