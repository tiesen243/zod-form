'use client'

import { useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

export const Providers: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 60 * 1000 } } }),
  )

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
