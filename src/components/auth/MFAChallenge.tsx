'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Shield, Key, Smartphone } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { AuthMFAChallengeResponse, AuthMFAVerifyResponse } from '@supabase/supabase-js'

interface MFAFactor {
  id: string
  type: 'totp' | 'phone'
  friendly_name?: string
  status: 'verified' | 'unverified'
}

interface MFAChallengeProps {
  onSuccess?: () => void
  redirectTo?: string
}

export function MFAChallenge({ onSuccess, redirectTo = '/' }: MFAChallengeProps) {
  const router = useRouter()
  const [factors, setFactors] = useState<MFAFactor[]>([])
  const [selectedFactor, setSelectedFactor] = useState<MFAFactor | null>(null)
  const [challengeId, setChallengeId] = useState<string | null>(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checkingMFA, setCheckingMFA] = useState(true)

  useEffect(() => {
    checkMFARequirement()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const checkMFARequirement = async () => {
    try {
      // Check current authentication level
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      
      if (aal?.nextLevel === 'aal2' && aal?.nextLevel !== aal?.currentLevel) {
        // MFA is required
        await loadMFAFactors()
      } else {
        // MFA not required or already completed
        handleSuccess()
      }
    } catch (error) {
      console.error('Error checking MFA requirement:', error)
      setError('Failed to check authentication requirements')
    } finally {
      setCheckingMFA(false)
    }
  }

  const loadMFAFactors = async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (error) throw error
      
      const verifiedFactors: MFAFactor[] = [
        ...(data.totp || []).map(f => ({ ...f, type: 'totp' as const })).filter(f => f.status === 'verified'),
        ...(data.phone || []).map(f => ({ ...f, type: 'phone' as const })).filter(f => f.status === 'verified')
      ]
      
      setFactors(verifiedFactors)
      
      if (verifiedFactors.length === 1) {
        // Auto-select the only available factor
        setSelectedFactor(verifiedFactors[0])
        await createChallenge(verifiedFactors[0].id)
      } else if (verifiedFactors.length === 0) {
        setError('No MFA methods are set up. Please contact support.')
      }
    } catch (error) {
      console.error('Error loading MFA factors:', error)
      setError('Failed to load MFA factors')
    }
  }

  const createChallenge = async (factorId: string) => {
    setLoading(true)
    setError(null)

    try {
      const { data, error }: AuthMFAChallengeResponse = await supabase.auth.mfa.challenge({
        factorId
      })

      if (error) throw error
      if (data) {
        setChallengeId(data.id)
      }
    } catch (error: unknown) {
      console.error('Challenge error:', error)
      setError((error as Error).message || 'Failed to create challenge')
    } finally {
      setLoading(false)
    }
  }

  const selectFactor = async (factor: MFAFactor) => {
    setSelectedFactor(factor)
    setVerificationCode('')
    setError(null)
    await createChallenge(factor.id)
  }

  const verifyCode = async () => {
    if (!selectedFactor || !challengeId || !verificationCode.trim()) {
      setError('Please enter the verification code')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error }: AuthMFAVerifyResponse = await supabase.auth.mfa.verify({
        factorId: selectedFactor.id,
        challengeId,
        code: verificationCode.trim()
      })

      if (error) throw error

      // MFA verification successful
      handleSuccess()
    } catch (error: unknown) {
      console.error('Verification error:', error)
      setError((error as Error).message || 'Invalid verification code')
    } finally {
      setLoading(false)
    }
  }

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess()
    } else {
      router.push(redirectTo)
    }
  }

  const resendCode = async () => {
    if (selectedFactor?.type === 'phone') {
      await createChallenge(selectedFactor.id)
    }
  }

  if (checkingMFA) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Checking authentication requirements...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-2">
          <Shield className="h-8 w-8 text-primary" />
        </div>
        <CardTitle>Additional Verification Required</CardTitle>
        <CardDescription>
          Please complete multi-factor authentication to continue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Factor Selection */}
        {!selectedFactor && factors.length > 1 && (
          <div className="space-y-3">
            <Label>Choose verification method:</Label>
            {factors.map((factor) => (
              <Button
                key={factor.id}
                variant="outline"
                className="w-full justify-start"
                onClick={() => selectFactor(factor)}
                disabled={loading}
              >
                {factor.type === 'totp' ? (
                  <Key className="mr-2 h-4 w-4" />
                ) : (
                  <Smartphone className="mr-2 h-4 w-4" />
                )}
                {factor.friendly_name || (factor.type === 'totp' ? 'Authenticator App' : 'Phone')}
              </Button>
            ))}
          </div>
        )}

        {/* Verification Input */}
        {selectedFactor && (
          <div className="space-y-4">
            <div className="flex items-center justify-center p-4 bg-muted rounded-lg">
              {selectedFactor.type === 'totp' ? (
                <Key className="mr-2 h-5 w-5" />
              ) : (
                <Smartphone className="mr-2 h-5 w-5" />
              )}
              <span className="font-medium">
                {selectedFactor.friendly_name || 
                 (selectedFactor.type === 'totp' ? 'Authenticator App' : 'Phone')}
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="verification-code">
                {selectedFactor.type === 'totp' ? 'Enter code from your authenticator app' : 'Enter SMS code'}
              </Label>
              <Input
                id="verification-code"
                type="text"
                placeholder={selectedFactor.type === 'totp' ? '6-digit code' : 'Verification code'}
                value={verificationCode}
                onChange={(e) => {
                  setVerificationCode(e.target.value)
                  if (error) setError(null)
                }}
                disabled={loading}
                maxLength={selectedFactor.type === 'totp' ? 6 : undefined}
                autoComplete="one-time-code"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Button 
                onClick={verifyCode} 
                disabled={loading || !verificationCode.trim()} 
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify'
                )}
              </Button>

              {selectedFactor.type === 'phone' && (
                <Button
                  variant="outline"
                  onClick={resendCode}
                  disabled={loading}
                  className="w-full"
                >
                  Resend Code
                </Button>
              )}

              {factors.length > 1 && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSelectedFactor(null)
                    setChallengeId(null)
                    setVerificationCode('')
                    setError(null)
                  }}
                  disabled={loading}
                  className="w-full"
                >
                  Choose Different Method
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}