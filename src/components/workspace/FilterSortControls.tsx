'use client'

import { useState } from 'react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Filter, ArrowUpDown, Check, ArrowUp, ArrowDown, X } from 'lucide-react'

interface FilterSortControlsProps {
    onFilterChange: (filters: TaskFilters) => void
    onSortChange: (sort: TaskSort) => void
}

export interface TaskFilters {
    status: string[]
    showOverdue: boolean
    showCompleted: boolean
}

export interface TaskSort {
    field: 'name' | 'dueDate' | 'status' | 'createdAt'
    direction: 'asc' | 'desc'
}

export function FilterSortControls({ onFilterChange, onSortChange }: FilterSortControlsProps) {
    const [filters, setFilters] = useState<TaskFilters>({
        status: [],
        showOverdue: false,
        showCompleted: true,
    })

    const [sort, setSort] = useState<TaskSort>({
        field: 'createdAt',
        direction: 'desc',
    })

    const [filterOpen, setFilterOpen] = useState(false)
    const [sortOpen, setSortOpen] = useState(false)

    const statuses = ['PENDING', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED', 'BLOCKED']

    const handleStatusToggle = (status: string) => {
        const newStatuses = filters.status.includes(status)
            ? filters.status.filter(s => s !== status)
            : [...filters.status, status]

        const newFilters = { ...filters, status: newStatuses }
        setFilters(newFilters)
        onFilterChange(newFilters)
    }

    const handleFilterToggle = (key: 'showOverdue' | 'showCompleted') => {
        const newFilters = { ...filters, [key]: !filters[key] }
        setFilters(newFilters)
        onFilterChange(newFilters)
    }

    const handleClearFilters = () => {
        const defaultFilters: TaskFilters = {
            status: [],
            showOverdue: false,
            showCompleted: true,
        }
        setFilters(defaultFilters)
        onFilterChange(defaultFilters)
        setFilterOpen(false)
    }

    const handleSortChange = (field: TaskSort['field']) => {
        const newSort: TaskSort = {
            field,
            direction: sort.field === field && sort.direction === 'asc' ? 'desc' : 'asc',
        }
        setSort(newSort)
        onSortChange(newSort)
        setSortOpen(false)
    }

    const toggleSortDirection = () => {
        const newSort: TaskSort = {
            ...sort,
            direction: sort.direction === 'asc' ? 'desc' : 'asc',
        }
        setSort(newSort)
        onSortChange(newSort)
    }

    const activeFilterCount = filters.status.length + (filters.showOverdue ? 1 : 0) + (!filters.showCompleted ? 1 : 0)

    return (
        <div className="flex items-center gap-2">
            {/* Filter Dropdown */}
            <DropdownMenu open={filterOpen} onOpenChange={setFilterOpen}>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 h-8 bg-background hover:bg-muted font-medium transition-all relative">
                        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                        Filter
                        {activeFilterCount > 0 && (
                            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                                {activeFilterCount}
                            </span>
                        )}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56" onCloseAutoFocus={(e) => e.preventDefault()}>
                    <DropdownMenuLabel>Filter Tasks</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">By Status</DropdownMenuLabel>
                    {statuses.map((status) => (
                        <DropdownMenuCheckboxItem
                            key={status}
                            checked={filters.status.includes(status)}
                            onCheckedChange={() => handleStatusToggle(status)}
                            onSelect={(e) => e.preventDefault()}
                        >
                            {status.replace('_', ' ')}
                        </DropdownMenuCheckboxItem>
                    ))}

                    <DropdownMenuSeparator />

                    <DropdownMenuCheckboxItem
                        checked={filters.showOverdue}
                        onCheckedChange={() => handleFilterToggle('showOverdue')}
                        onSelect={(e) => e.preventDefault()}
                    >
                        Show Only Overdue
                    </DropdownMenuCheckboxItem>

                    <DropdownMenuCheckboxItem
                        checked={filters.showCompleted}
                        onCheckedChange={() => handleFilterToggle('showCompleted')}
                        onSelect={(e) => e.preventDefault()}
                    >
                        Show Completed
                    </DropdownMenuCheckboxItem>

                    {activeFilterCount > 0 && (
                        <>
                            <DropdownMenuSeparator />
                            <div className="px-2 py-1.5">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full justify-start gap-2 h-8 text-muted-foreground hover:text-foreground"
                                    onClick={handleClearFilters}
                                >
                                    <X className="h-3.5 w-3.5" />
                                    Clear all filters
                                </Button>
                            </div>
                        </>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort Dropdown */}
            <DropdownMenu open={sortOpen} onOpenChange={setSortOpen}>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2 h-8 bg-background hover:bg-muted font-medium transition-all">
                        <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                        Sort
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                    <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={() => handleSortChange('name')}>
                        <div className="flex items-center justify-between w-full">
                            <span>Name</span>
                            {sort.field === 'name' && (
                                <Check className="h-4 w-4" />
                            )}
                        </div>
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => handleSortChange('dueDate')}>
                        <div className="flex items-center justify-between w-full">
                            <span>Due Date</span>
                            {sort.field === 'dueDate' && (
                                <Check className="h-4 w-4" />
                            )}
                        </div>
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => handleSortChange('status')}>
                        <div className="flex items-center justify-between w-full">
                            <span>Status</span>
                            {sort.field === 'status' && (
                                <Check className="h-4 w-4" />
                            )}
                        </div>
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => handleSortChange('createdAt')}>
                        <div className="flex items-center justify-between w-full">
                            <span>Created Date</span>
                            {sort.field === 'createdAt' && (
                                <Check className="h-4 w-4" />
                            )}
                        </div>
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <div className="px-2 py-1.5">
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full justify-start gap-2 h-8"
                            onClick={(e) => {
                                e.stopPropagation()
                                toggleSortDirection()
                            }}
                        >
                            {sort.direction === 'asc' ? (
                                <>
                                    <ArrowUp className="h-3.5 w-3.5" />
                                    Ascending
                                </>
                            ) : (
                                <>
                                    <ArrowDown className="h-3.5 w-3.5" />
                                    Descending
                                </>
                            )}
                        </Button>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
