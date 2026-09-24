import { brandPage, firstParam } from '@/lib/dash/page'
import { listCampaigns, listTasks } from '@/lib/data/lists'
import { PLATFORMS, TASK_KIND_LABEL } from '@/lib/dash/constants'
import { today } from '@/lib/dash/dates'
import { BrandHeader, NoBrands } from '@/components/dash/brand-header'
import { Card, PageBody } from '@/components/dash/ui'
import { Field, Flash, Input, Select } from '@/components/dash/fields'
import { SubmitButton } from '@/components/dash/controls'
import { CampaignsView, TasksView } from '@/components/dash/views/plan-view'
import { addTask, saveCampaign } from '@/app/admin/actions'

export const metadata = { title: 'План работ' }

const platformOptions = PLATFORMS.map((p) => ({ value: p.key, label: p.name }))

export default async function AdminPlan({ searchParams }: PageProps<'/admin/plan'>) {
  const { brand, brands, back, sp, ok, error } = await brandPage(searchParams, '/admin/plan', { admin: true })
  // Prefill from the calculator's «Создать кампанию приглашений».
  const presetPlatform = platformOptions.some((o) => o.value === firstParam(sp.campaign_platform)) ? firstParam(sp.campaign_platform) : undefined
  const presetName = (firstParam(sp.campaign_name) ?? '').slice(0, 200)
  if (!brand) {
    return (
      <>
        <BrandHeader title="План работ" brand={null} brands={[]} />
        <NoBrands admin />
      </>
    )
  }

  return (
    <>
      <BrandHeader title="План работ" description="Задачи команды и кампании приглашений. Клиент видит этот план в кабинете." brand={brand} brands={brands} />
      <PageBody>
        <Flash ok={ok} error={error} />

        <Card title="Новая задача">
          <form action={addTask} className="flex flex-col gap-4">
            <input type="hidden" name="brand_id" value={brand.id} />
            <input type="hidden" name="back" value={back} />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Field label="Задача" className="lg:col-span-2">
                <Input name="title" required maxLength={300} />
              </Field>
              <Field label="Тип">
                <Select name="kind" required options={TASK_KIND_LABEL} />
              </Field>
              <Field label="Площадка">
                <Select name="platform" placeholder="Любая" options={platformOptions} />
              </Field>
              <Field label="Срок">
                <Input name="due_date" type="date" />
              </Field>
              <Field label="Ответственный">
                <Input name="assignee" maxLength={80} />
              </Field>
            </div>
            <div>
              <SubmitButton>Добавить задачу</SubmitButton>
            </div>
          </form>
        </Card>

        <Card title="Задачи">
          <TasksView tasks={listTasks(brand.id)} back={back} />
        </Card>

        <div id="campaign" className="scroll-mt-4" />
        <Card
          title="Новая кампания приглашений"
          description="Приглашения оставить отзыв получают реальные клиенты бренда: после покупки, обращения в поддержку и т. п. Используйте инструменты приглашений самой площадки."
        >
          <form action={saveCampaign} className="flex flex-col gap-4">
            <input type="hidden" name="brand_id" value={brand.id} />
            <input type="hidden" name="back" value={back} />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Field label="Название" className="lg:col-span-2">
                <Input name="name" required maxLength={200} placeholder="Письмо после покупки" defaultValue={presetName} />
              </Field>
              <Field label="Площадка">
                <Select name="platform" required defaultValue={presetPlatform} options={platformOptions} />
              </Field>
              <Field label="Старт">
                <Input name="start_date" type="date" required defaultValue={today()} />
              </Field>
              <Field label="Статус">
                <Select name="status" defaultValue="planned" options={{ planned: 'Запланирована', active: 'Идёт', finished: 'Завершена' }} />
              </Field>
            </div>
            <div>
              <SubmitButton>Добавить кампанию</SubmitButton>
            </div>
          </form>
        </Card>

        <Card title="Кампании приглашений" description="Обновляйте число отправленных приглашений и полученных отзывов по данным площадки.">
          <CampaignsView campaigns={listCampaigns(brand.id)} back={back} />
        </Card>
      </PageBody>
    </>
  )
}
