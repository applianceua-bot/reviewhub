import { requireAdmin } from '@/lib/auth/session'
import { all } from '@/lib/db'
import { firstParam } from '@/lib/dash/page'
import { formatShort } from '@/lib/dash/dates'
import { Badge, Card, PageBody, PageHeader } from '@/components/dash/ui'
import { Flash } from '@/components/dash/fields'
import { SubmitButton } from '@/components/dash/controls'
import { CreateClientForm, ResetPasswordForm } from '@/components/dash/admin/credential-forms'
import { deleteClient, saveClientBrands, setClientActive } from '@/app/admin/actions'

export const metadata = { title: 'Клиенты' }

type UserRow = { id: number; login: string; name: string; role: 'admin' | 'client'; active: number; created_at: string }

export default async function ClientsPage({ searchParams }: PageProps<'/admin/clients'>) {
  const me = await requireAdmin()
  const sp = await searchParams
  const back = '/admin/clients'
  const users = all<UserRow>('SELECT id, login, name, role, active, created_at FROM users ORDER BY role DESC, name')
  const brands = all<{ id: number; name: string }>('SELECT id, name FROM brands ORDER BY name')
  const links = all<{ user_id: number; brand_id: number }>('SELECT user_id, brand_id FROM client_brands')
  const brandsOf = (userId: number) => new Set(links.filter((l) => l.user_id === userId).map((l) => l.brand_id))

  return (
    <>
      <PageHeader title="Клиенты" description="Доступы в личный кабинет. Клиент видит только отмеченные бренды." />
      <PageBody>
        <Flash ok={firstParam(sp.ok)} error={firstParam(sp.error)} />

        <Card title="Новый доступ">
          <CreateClientForm brands={brands} />
        </Card>

        <div className="flex flex-col gap-4">
          {users.map((u) => {
            const own = brandsOf(u.id)
            const isMe = u.id === me.id
            return (
              <Card key={u.id}>
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-medium">{u.name}</h3>
                      <Badge tone={u.role === 'admin' ? 'brand' : 'neutral'}>{u.role === 'admin' ? 'Администратор' : 'Клиент'}</Badge>
                      {!u.active && <Badge tone="negative">Отключён</Badge>}
                      {isMe && <Badge tone="info">Это вы</Badge>}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      Логин <span className="font-mono text-foreground">{u.login}</span> · создан {formatShort(u.created_at.slice(0, 10))}
                    </p>
                  </div>
                  {!isMe && (
                    <div className="flex gap-2">
                      <form action={setClientActive}>
                        <input type="hidden" name="user_id" value={u.id} />
                        <input type="hidden" name="active" value={u.active ? '0' : '1'} />
                        <input type="hidden" name="back" value={back} />
                        <SubmitButton variant="secondary" className="h-8 text-xs">
                          {u.active ? 'Отключить доступ' : 'Включить доступ'}
                        </SubmitButton>
                      </form>
                      <form action={deleteClient}>
                        <input type="hidden" name="user_id" value={u.id} />
                        <input type="hidden" name="back" value={back} />
                        <SubmitButton variant="danger" className="h-8 text-xs" confirm={`Удалить пользователя ${u.login}?`}>
                          Удалить
                        </SubmitButton>
                      </form>
                    </div>
                  )}
                </div>

                {u.role === 'client' && (
                  <form action={saveClientBrands} className="mt-4 border-t border-border pt-4">
                    <input type="hidden" name="user_id" value={u.id} />
                    <input type="hidden" name="back" value={back} />
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Бренды в кабинете</p>
                    <div className="flex flex-wrap items-center gap-2">
                      {brands.map((b) => (
                        <label key={b.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm has-checked:border-primary/50 has-checked:bg-primary/10">
                          <input type="checkbox" name="brands" value={b.id} defaultChecked={own.has(b.id)} className="accent-[var(--brand)]" />
                          {b.name}
                        </label>
                      ))}
                      <SubmitButton variant="secondary" className="h-8 text-xs">
                        Сохранить доступ
                      </SubmitButton>
                    </div>
                  </form>
                )}

                <div className="mt-4 border-t border-border pt-4">
                  <ResetPasswordForm userId={u.id} />
                </div>
              </Card>
            )
          })}
        </div>
      </PageBody>
    </>
  )
}
