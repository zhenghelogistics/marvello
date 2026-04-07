'use server'

import { db } from '@/lib/db'
import { platformCredentials } from '@/lib/db/schema'

type Platform = 'linkedin' | 'instagram' | 'facebook'

interface CredentialData {
  accessToken?: string
  pageId?: string
  orgId?: string
}

export async function savePlatformCredential(
  platform: Platform,
  data: CredentialData
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .insert(platformCredentials)
      .values({
        platform,
        accessToken: data.accessToken ?? null,
        pageId: data.pageId ?? null,
        orgId: data.orgId ?? null,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: platformCredentials.platform,
        set: {
          accessToken: data.accessToken ?? null,
          pageId: data.pageId ?? null,
          orgId: data.orgId ?? null,
          updatedAt: new Date(),
        },
      })

    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}
