'use server'

/**
 * Send pickup notification email to parent/guardian
 */
export async function sendPickupEmail(
  parentEmail: string,
  studentName: string,
  grNumber: string,
  className: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!parentEmail || !studentName || !className) {
      return { ok: false, error: 'Missing required email fields.' }
    }

    // Email template
    const subject = 'Your Ward Has Been Picked Up'
    const message = `Your Ward ${studentName}, GR ${grNumber}, ${className} has been picked up.`

    console.log('[v0] Email would be sent to:', parentEmail)
    console.log('[v0] Subject:', subject)
    console.log('[v0] Message:', message)

    // In production, integrate with a real email service like Resend or SendGrid
    // For now, this is a mock implementation that logs the email
    // TODO: Replace with real email service integration

    return { ok: true }
  } catch (error: any) {
    console.log('[v0] sendPickupEmail error:', error?.message)
    return { ok: false, error: 'Failed to send email.' }
  }
}
