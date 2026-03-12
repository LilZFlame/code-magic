import { HeroSection } from '@/components/home/HeroSection'
import { RepoInputForm } from '@/components/home/RepoInputForm'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <HeroSection />
      <div className="mt-8 w-full max-w-xl">
        <RepoInputForm />
      </div>
    </main>
  )
}