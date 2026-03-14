import { HeroSection } from '@/components/home/HeroSection'
import { RepoInputForm } from '@/components/home/RepoInputForm'
import { Header } from '@/components/layout/Header'

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="animate-slide-up">
          <HeroSection />
        </div>
        <div className="mt-8 w-full max-w-xl animate-slide-up" style={{ animationDelay: '100ms' }}>
          <RepoInputForm />
        </div>
      </main>
    </div>
  )
}