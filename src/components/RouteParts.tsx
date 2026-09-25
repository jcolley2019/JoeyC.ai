import { Seo } from './Seo'

/** Private and utility routes: never indexed; each still gets a real title. */
export const NoIndex = ({ title }: { title: string }) => (
  <Seo title={`${title} — JoeyC.ai`} description="JoeyC.ai" noindex />
)

export const PageLoading = () => (
  <div className="min-h-screen bg-bg flex items-center justify-center">
    <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
  </div>
)
