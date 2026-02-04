"use client"

import { useState } from "react"
import {
  RightSidebar,
  RightSidebarContent,
  RightSidebarGroup,
  RightSidebarGroupContent,
  RightSidebarSeparator,
  useRightSidebar,
} from "@/components/ui/right-sidebar"
import { Calendar } from "@/components/ui/calendar"
import { NotificationList } from "@/components/notifications/notification-list"
import { Button } from "@/components/ui/button"
import { useSidebarMode } from "@/lib/sidebar-mode"
import { WorkflowRightSidebarContent } from "@/components/workflow-right-sidebar"

function DefaultRightSidebarContent() {
  // undefined = show all, Date = filter by that date
  const [filterDate, setFilterDate] = useState<Date | undefined>(undefined)
  // Visual selection in calendar (always shows today highlighted)
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(new Date())

  const handleDateSelect = (date: Date | undefined) => {
    setCalendarDate(date)
    // Toggle filter: if clicking same date, clear filter
    if (date && filterDate && date.toDateString() === filterDate.toDateString()) {
      setFilterDate(undefined)
    } else {
      setFilterDate(date)
    }
  }

  const clearFilter = () => {
    setFilterDate(undefined)
    setCalendarDate(new Date())
  }

  return (
    <>
      {/* Calendar */}
      <RightSidebarGroup className="p-0">
        <RightSidebarGroupContent>
          <div className="flex flex-col items-center pt-2 [--cell-size:1.6rem]">
            <Calendar
              mode="single"
              selected={calendarDate}
              onSelect={handleDateSelect}
              className="!p-0 !bg-transparent"
            />
            {filterDate && (
              <div className="flex items-center justify-between w-full px-2 pt-1 pb-0.5">
                <span className="text-[10px] text-sidebar-foreground/50">
                  Filtering: {filterDate.toLocaleDateString("en-US")}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-1.5 text-[10px]"
                  onClick={clearFilter}
                >
                  Clear
                </Button>
              </div>
            )}
          </div>
        </RightSidebarGroupContent>
      </RightSidebarGroup>

      <RightSidebarSeparator />

      {/* Notifications */}
      <RightSidebarGroup className="p-0">
        <RightSidebarGroupContent>
          <NotificationList selectedDate={filterDate} />
        </RightSidebarGroupContent>
      </RightSidebarGroup>
    </>
  )
}

export function AppRightSidebar() {
  const { mode } = useSidebarMode()
  const isWorkflowMode = mode === "workflow"

  return (
    <RightSidebar variant="sidebar">
      <RightSidebarContent>
        {isWorkflowMode ? (
          <WorkflowRightSidebarContent />
        ) : (
          <DefaultRightSidebarContent />
        )}
      </RightSidebarContent>
    </RightSidebar>
  )
}
