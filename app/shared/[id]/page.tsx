import { SharedAnalysisPage } from '@/components/shared-analysis-page'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function SharedPage({ params }: PageProps) {
  const { id } = await params
  return <SharedAnalysisPage shareId={id} />
}
