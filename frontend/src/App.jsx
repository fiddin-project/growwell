import { AuthProvider } from './context/AuthContext'
import AppRouter from './router'
import { Toaster } from 'react-hot-toast'
import PwaStatus from './components/PwaStatus'

export default function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#ffffff',
            color: '#1d1d1f',
            border: '1px solid #e0e0e0',
            borderRadius: '11px',
          },
        }}
      />
      <PwaStatus />
      <AppRouter />
    </AuthProvider>
  )
}
