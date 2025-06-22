"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format, subDays } from "date-fns"
import { CalendarIcon, TrendingUp, Users, Globe, Monitor, Smartphone, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"

interface SummaryPoint {
    date: string
    views: number
}

interface BreakdownItem {
    key: string
    count: number
    percent: number
}

interface Breakdown {
    country: BreakdownItem[]
    os: BreakdownItem[]
    browser: BreakdownItem[]
    deviceType: BreakdownItem[]
}

interface DateRange {
    from: Date
    to: Date
}

const PRESET_RANGES = [
    { label: "Last 7 days", days: 7 },
    { label: "Last 14 days", days: 14 },
    { label: "Last 30 days", days: 30 },
    { label: "Last 90 days", days: 90 },
]

export function AnalyticsTab({ projectId }: { projectId: string }) {
    const [summary, setSummary] = useState<SummaryPoint[]>([])
    const [breakdown, setBreakdown] = useState<Breakdown | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [selectedPreset, setSelectedPreset] = useState("7")
    const [dateRange, setDateRange] = useState<DateRange>({
        from: subDays(new Date(), 7),
        to: new Date(),
    })
    const [showCustomRange, setShowCustomRange] = useState(false)

    const BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL!

    const fetchAnalytics = async (days?: number, customRange?: DateRange) => {
        setIsLoading(true)
        try {
            let summaryUrl: string
            let breakdownUrl: string

            if (customRange) {
                const fromDate = format(customRange.from, "yyyy-MM-dd")
                const toDate = format(customRange.to, "yyyy-MM-dd")
                summaryUrl = `${BACKEND}/analytics/project/${projectId}/summary?from=${fromDate}&to=${toDate}`
                breakdownUrl = `${BACKEND}/analytics/project/${projectId}/breakdown?from=${fromDate}&to=${toDate}`
            } else {
                summaryUrl = `${BACKEND}/analytics/project/${projectId}/summary?days=${days || 7}`
                breakdownUrl = `${BACKEND}/analytics/project/${projectId}/breakdown?days=${days || 7}`
            }

            const [summaryRes, breakdownRes] = await Promise.all([fetch(summaryUrl), fetch(breakdownUrl)])

            const summaryData = await summaryRes.json()
            const breakdownData = await breakdownRes.json()

            setSummary(summaryData)
            setBreakdown(breakdownData.breakdown)
        } catch (error) {
            console.error("Failed to fetch analytics:", error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (!showCustomRange) {
            fetchAnalytics(Number(selectedPreset))
        }
    }, [projectId, selectedPreset, showCustomRange])

    const handlePresetChange = (value: string) => {
        if (value === "custom") {
            setShowCustomRange(true)
        } else {
            setShowCustomRange(false)
            setSelectedPreset(value)
        }
    }

    const handleCustomRangeApply = () => {
        fetchAnalytics(undefined, dateRange)
    }

    const totalViews = summary.reduce((sum, point) => sum + point.views, 0)
    const maxViews = Math.max(...summary.map((p) => p.views), 1)
    const avgViews = summary.length > 0 ? Math.round(totalViews / summary.length) : 0

    const getIconForCategory = (category: string) => {
        switch (category.toLowerCase()) {
            case "country":
                return <Globe className="w-4 h-4" />
            case "os":
                return <Monitor className="w-4 h-4" />
            case "browser":
                return <Globe className="w-4 h-4" />
            case "device type":
                return <Smartphone className="w-4 h-4" />
            default:
                return <TrendingUp className="w-4 h-4" />
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <Card key={i}>
                            <CardContent className="p-6">
                                <div className="animate-pulse">
                                    <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                                    <div className="h-8 bg-muted rounded w-3/4"></div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header with Date Range Selector */}
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                        <div>
                            <CardTitle className="text-2xl">Analytics Dashboard</CardTitle>
                            <p className="text-muted-foreground mt-1">Track your project's performance and visitor insights</p>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Select value={showCustomRange ? "custom" : selectedPreset} onValueChange={handlePresetChange}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PRESET_RANGES.map((range) => (
                                        <SelectItem key={range.days} value={range.days.toString()}>
                                            {range.label}
                                        </SelectItem>
                                    ))}
                                    <SelectItem value="custom">Custom Range</SelectItem>
                                </SelectContent>
                            </Select>

                            {showCustomRange && (
                                <div className="flex items-center space-x-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" className={cn("w-[240px] justify-start text-left font-normal")}>
                                                <CalendarIcon className="mr-2 h-4 w-4" />
                                                {dateRange.from && dateRange.to
                                                    ? `${format(dateRange.from, "MMM d")} - ${format(dateRange.to, "MMM d")}`
                                                    : "Pick a date range"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="end">
                                            <Calendar
                                                initialFocus
                                                mode="range"
                                                defaultMonth={dateRange.from}
                                                selected={{ from: dateRange.from, to: dateRange.to }}
                                                onSelect={(range) => {
                                                    if (range?.from && range?.to) {
                                                        setDateRange({ from: range.from, to: range.to })
                                                    }
                                                }}
                                                numberOfMonths={2}
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <Button onClick={handleCustomRangeApply} size="sm">
                                        Apply
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-2">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                                <p className="text-2xl font-bold">{totalViews.toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-2">
                            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Daily Average</p>
                                <p className="text-2xl font-bold">{avgViews.toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-2">
                            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                                <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Peak Day</p>
                                <p className="text-2xl font-bold">{maxViews.toLocaleString()}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Views Timeline Chart */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <TrendingUp className="w-5 h-5" />
                        <span>Views Over Time</span>
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {summary.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                <Eye className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground">No analytics data available for this period</p>
                        </div>
                    ) : (
                        <ChartContainer
                            config={{
                                views: {
                                    label: "Views",
                                    color: "hsl(var(--chart-1))",
                                },
                            }}
                            className="h-[350px] w-full"
                        >
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={summary} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--color-views)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="var(--color-views)" stopOpacity={0.1} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                    <XAxis
                                        dataKey="date"
                                        tickFormatter={(value) => format(new Date(value), "MMM d")}
                                        className="text-xs"
                                    />
                                    <YAxis className="text-xs" />
                                    <ChartTooltip
                                        content={({ active, payload, label }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="rounded-lg border bg-background p-2 shadow-md">
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <div className="flex flex-col">
                                                                <span className="text-[0.70rem] uppercase text-muted-foreground">Date</span>
                                                                <span className="font-bold text-muted-foreground">
                                                                    {format(new Date(label), "MMM d, yyyy")}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[0.70rem] uppercase text-muted-foreground">Views</span>
                                                                <span className="font-bold">{payload[0].value?.toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )
                                            }
                                            return null
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="views"
                                        stroke="var(--color-views)"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorViews)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    )}
                </CardContent>
            </Card>

            {/* Breakdown Analytics */}
            {breakdown && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {(
                        [
                            ["Country", breakdown.country],
                            ["OS", breakdown.os],
                            ["Browser", breakdown.browser],
                            ["Device Type", breakdown.deviceType],
                        ] as [string, BreakdownItem[]][]
                    ).map(([title, items]) => (
                        <Card key={title} className="h-[350px] ">
                            <CardHeader>
                                <CardTitle className="flex items-center space-x-2">
                                    {getIconForCategory(title)}
                                    <span>{title} Breakdown</span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="max-h-[250px] overflow-y-scroll" >
                                {items.length === 0 ? (
                                    <div className="text-center py-6">
                                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                                            {getIconForCategory(title)}
                                        </div>
                                        <p className="text-sm text-muted-foreground">No data available</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3 ">
                                        {items.slice(0, 8).map(({ key, count, percent }, index) => (
                                            <div
                                                key={key}
                                                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                                        {index + 1}
                                                    </div>
                                                    <span className="font-medium capitalize">{key}</span>
                                                </div>
                                                <div className="flex items-center space-x-3">
                                                    <div className="text-right">
                                                        <div className="font-semibold">{count.toLocaleString()}</div>
                                                        <div className="text-xs text-muted-foreground">{percent}%</div>
                                                    </div>
                                                    <div className="w-16">
                                                        <Progress value={percent} className="h-2" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {items.length > 8 && (
                                            <div className="text-center pt-2">
                                                <Badge variant="outline">+{items.length - 8} more</Badge>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
