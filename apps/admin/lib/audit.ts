import { headers } from "next/headers"
import { db } from "@jetbeans/db/client"
import { auditLog } from "@jetbeans/db/schema"
import { auth } from "@/lib/auth"

type AuditEvent = {
  action: string
  targetType?: string
  targetId?: string
  targetLabel?: string
  metadata?: Record<string, unknown>
}

export async function logAudit(event: AuditEvent) {
  try {
    const hdrs = await headers()
    const session = await auth.api.getSession({ headers: hdrs })

    if (!session) return

    const ipAddress =
      hdrs.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      hdrs.get("x-real-ip") ||
      null

    await db.insert(auditLog).values({
      userId: session.user.id,
      sessionId: session.session.id,
      userName: session.user.name,
      userEmail: session.user.email,
      action: event.action,
      targetType: event.targetType,
      targetId: event.targetId,
      targetLabel: event.targetLabel,
      metadata: event.metadata,
      ipAddress,
    })
  } catch {
    // Audit logging should never break the main flow
    console.error("Failed to write audit log")
  }
}
