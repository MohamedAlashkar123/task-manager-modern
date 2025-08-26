'use client'

import { Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import { MFAChallenge } from '@/components/auth/MFAChallenge'

function MFAChallengeContent() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <MFAChallenge />
    </div>
  )
}

export default function MFAChallengePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Loading MFA challenge...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <MFAChallengeContent />
    </Suspense>
  )
}