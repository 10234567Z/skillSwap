'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { SKILL_CATEGORIES, AVAILABILITY_OPTIONS } from '@/lib/constants'
import type { SearchBarProps } from '@/types'

export function SearchBar({ filters, onSearch, categories, availabilityOptions }: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState(filters.search || '')
  const [selectedCategory, setSelectedCategory] = useState(filters.skillCategory || '')
  const [selectedAvailability, setSelectedAvailability] = useState(filters.availability || '')
  const [selectedLocation, setSelectedLocation] = useState(filters.location || '')

  // Sync with external filter changes
  useEffect(() => {
    setSearchQuery(filters.search || '')
    setSelectedCategory(filters.skillCategory || '')
    setSelectedAvailability(filters.availability || '')
    setSelectedLocation(filters.location || '')
  }, [filters])

  const handleSearch = () => {
    onSearch({
      search: searchQuery.trim() || undefined, // Changed from 'query' to 'search'
      skillCategory: selectedCategory || undefined,
      availability: selectedAvailability || undefined,
      location: selectedLocation.trim() || undefined,
      page: 1, // Reset to first page on new search
    })
  }

  const handleClearFilters = () => {
    // Clear all local state first
    setSearchQuery('')
    setSelectedCategory('')
    setSelectedAvailability('')
    setSelectedLocation('')
    
    // Then trigger the search with cleared values to immediately load all users
    onSearch({
      search: undefined,
      skillCategory: undefined,
      availability: undefined,
      location: undefined,
      page: 1,
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const categoryOptions = categories.map(cat => ({
    value: cat,
    label: cat
  }))

  const availabilityOptionsList = availabilityOptions.map(opt => ({
    value: opt,
    label: opt.charAt(0).toUpperCase() + opt.slice(1)
  }))

  const hasActiveFilters = searchQuery || selectedCategory || selectedAvailability || selectedLocation

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Find Skills & People</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Search Query */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <Input
            id="search"
            type="text"
            placeholder="Search by name, skill, or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full"
          />
        </div>

        {/* Category Filter */}
        <div>
          <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
            Skill Category
          </label>
          <Select
            id="category"
            placeholder="Any Category"
            options={categoryOptions}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          />
        </div>

        {/* Availability Filter */}
        <div>
          <label htmlFor="availability" className="block text-sm font-medium text-gray-700 mb-1">
            Availability
          </label>
          <Select
            id="availability"
            placeholder="Any Time"
            options={availabilityOptionsList}
            value={selectedAvailability}
            onChange={(e) => setSelectedAvailability(e.target.value)}
          />
        </div>

        {/* Location Filter */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
            Location
          </label>
          <Input
            id="location"
            type="text"
            placeholder="Filter by location..."
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            onKeyPress={handleKeyPress}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-center">
        <div className="flex gap-2">
          <Button onClick={handleSearch} className="flex items-center space-x-2">
            <Search className="h-4 w-4" />
            <span>Search</span>
          </Button>
          
          <Button variant="outline" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        </div>
      </div>
    </div>
  )
}
