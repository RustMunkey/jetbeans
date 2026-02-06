"use server"

import { db } from "@jetbeans/db/client"
import { auditLog } from "@jetbeans/db/schema"
import { and, inArray, eq } from "@jetbeans/db/drizzle"
import { requireWorkspace } from "@/lib/workspace"

export async function bulkDeleteActivityLogs(ids: string[]) {
	const workspace = await requireWorkspace()
	await db.delete(auditLog).where(and(inArray(auditLog.id, ids), eq(auditLog.workspaceId, workspace.id)))
}
