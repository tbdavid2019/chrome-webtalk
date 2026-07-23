import { FC } from 'react'
import { Button } from '@/components/ui/Button'
import { Github } from 'lucide-react'
import Link from '@/components/Link'

const BadgeList: FC = () => {
  return (
    <div className="mx-auto mt-6 flex w-fit pb-8">
      <Button asChild size="lg" variant="ghost" className="rounded-full px-3 text-xl font-semibold text-primary">
        <Link href="https://github.com/tbdavid2019/chrome-webtalk">
          <Github className="mr-1 size-6"></Github>
          GitHub / 開源專案
        </Link>
      </Button>
    </div>
  )
}

BadgeList.displayName = 'BadgeList'

export default BadgeList
