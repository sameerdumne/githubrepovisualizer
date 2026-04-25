import { fetchRepositoryData } from '@/lib/api/repository-analysis'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const repoUrl = searchParams.get('repo')

  if (!repoUrl) {
    return Response.json({ error: 'repo parameter required' }, { status: 400 })
  }

  try {
    console.log(`Testing fetch for: ${repoUrl}`)
    const data = await fetchRepositoryData(repoUrl)
    return Response.json({ success: true, data })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`Error: ${errorMessage}`)
    return Response.json({ error: errorMessage }, { status: 500 })
  }
}
