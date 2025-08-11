'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useRPAProcessesStore } from '@/store/rpa-processes-supabase'

export default function RPATestPage() {
  const { 
    processes, 
    isLoading, 
    error, 
    fetchProcesses, 
    addProcess 
  } = useRPAProcessesStore()
  
  const [testResult, setTestResult] = useState<string>('')

  useEffect(() => {
    fetchProcesses()
  }, [fetchProcesses])

  const runTest = async () => {
    setTestResult('Running test...')
    
    try {
      // Test adding a process
      await addProcess({
        name: 'Test Process',
        description: 'This is a test process created from the app',
        status: 'active',
        owner: 'Test User',
        department: 'IT',
        entityName: 'Test Company',
        dueDate: '2024-12-31',
      })
      
      setTestResult('✅ Test passed! Process added successfully.')
    } catch (err) {
      setTestResult(`❌ Test failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>RPA Processes Database Integration Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p><strong>Loading State:</strong> {isLoading ? '⏳ Loading...' : '✅ Ready'}</p>
            <p><strong>Error State:</strong> {error || '✅ No errors'}</p>
            <p><strong>Processes Count:</strong> {processes.length}</p>
          </div>
          
          <Button onClick={runTest} disabled={isLoading}>
            Run Add Process Test
          </Button>
          
          {testResult && (
            <div className="p-4 bg-muted rounded">
              <p>{testResult}</p>
            </div>
          )}
          
          <div className="space-y-2">
            <h3 className="font-semibold">Current Processes:</h3>
            {processes.length === 0 ? (
              <p className="text-muted-foreground">No processes found</p>
            ) : (
              <ul className="space-y-2">
                {processes.map((process) => (
                  <li key={process.id} className="p-2 bg-muted rounded">
                    <p><strong>{process.name}</strong></p>
                    <p className="text-sm text-muted-foreground">
                      Status: {process.status} | 
                      Entity: {process.entityName || 'N/A'} | 
                      Due: {process.dueDate || 'No due date'}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}