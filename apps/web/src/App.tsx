import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
import { useAuthListener } from '@/features/auth/session'
import { queryClient } from '@/lib/query-client'
import { router } from '@/routes/router'
import { useApplyTheme } from '@/stores/theme'

export function App() {
  useApplyTheme()
  useAuthListener()

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster />
    </QueryClientProvider>
  )
}
