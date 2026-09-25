import { brandPage } from '@/lib/dash/page'
import { listConnectionStatus } from '@/lib/data/lists'
import { API_PLATFORMS, platformName } from '@/lib/dash/constants'
import { BrandHeader, NoBrands } from '@/components/dash/brand-header'
import { Badge, Card, PageBody } from '@/components/dash/ui'
import { Field, Flash, Input, Textarea } from '@/components/dash/fields'
import { SubmitButton } from '@/components/dash/controls'
import { saveConnection } from '@/app/admin/actions'

export const metadata = { title: 'Интеграции' }

/**
 * Field labels and docs per platform, checked against each one's current
 * developer documentation (see API_PLATFORMS in lib/dash/constants.ts for
 * which platforms were checked and rejected, and why).
 */
const HINTS: Record<string, { id: string; key: string; docs?: string; note?: string; multiline?: boolean }> = {
  trustpilot: {
    id: 'Business Unit ID',
    key: 'API key из Trustpilot Business → Integrations',
    docs: 'https://developers.trustpilot.com/',
  },
  reviewsio: { id: 'Store ID', key: 'API key из кабинета Reviews.io' },
  hellopeter: { id: 'Business slug', key: 'Business API key Hellopeter' },
  smartcustomer: { id: 'Домен компании', key: 'Токен доступа SmartCustomer (бывший Sitejabber)' },
  gmb: {
    id: 'Location ID (Google Business Profile)',
    key: 'OAuth-токен Business Profile API',
    docs: 'https://developers.google.com/my-business',
    note: 'Нужен доступ через Google Cloud проект и OAuth-согласие владельца профиля.',
  },
  yelp: {
    id: 'Business ID (Yelp)',
    key: 'API key из Yelp Fusion',
    docs: 'https://docs.developer.yelp.com/',
    note: 'Полный список отзывов и ответы на них доступны только на платном тарифе Fusion (Enhanced/Premium).',
  },
  appstore: {
    id: 'Apple ID приложения',
    key: 'Ключ App Store Connect API (Issuer ID, Key ID и содержимое .p8)',
    docs: 'https://developer.apple.com/documentation/appstoreconnectapi',
    note: 'API отдаёт только окно примерно за последние 7 дней — старые отзывы им не подтянуть.',
    multiline: true,
  },
  googleplay: {
    id: 'Package name приложения',
    key: 'JSON-ключ сервисного аккаунта Google Play Console',
    docs: 'https://developers.google.com/android-publisher',
    note: 'Как и у Apple, API показывает только недавнее окно отзывов.',
    multiline: true,
  },
  feefo: { id: 'Merchant identifier Feefo', key: 'API key Feefo (Reviews API)', docs: 'https://feefo.readme.io/reference' },
  trustedshops: { id: 'Channel ID / Shop ID', key: 'API-токен Trusted Shops (eTrusted)', docs: 'https://api.trustedshops.com/' },
  ekomi: { id: 'Interface ID eKomi', key: 'API-токен eKomi', docs: 'https://www.ekomi.com/sdk-documentation' },
}

export default async function IntegrationsPage({ searchParams }: PageProps<'/admin/integrations'>) {
  const { brand, brands, back, ok, error } = await brandPage(searchParams, '/admin/integrations', { admin: true })
  if (!brand) {
    return (
      <>
        <BrandHeader title="Интеграции" brand={null} brands={[]} />
        <NoBrands admin />
      </>
    )
  }
  const status = new Map(listConnectionStatus(brand.id).map((c) => [c.platform, c]))

  return (
    <>
      <BrandHeader title="Интеграции" description="Подключение к официальным API площадок" brand={brand} brands={brands} />
      <PageBody>
        <Flash ok={ok} error={error} />
        <p className="max-w-3xl text-sm text-muted-foreground">
          Ключи хранятся только на сервере и видны лишь администраторам. Клиент в кабинете видит только статус подключения.
          Сохранённый ключ не показывается повторно: чтобы заменить, введите новый.
        </p>

        <div className="grid gap-6 lg:grid-cols-2">
          {API_PLATFORMS.map((key) => {
            const c = status.get(key)
            const hint = HINTS[key]
            return (
              <Card
                key={key}
                title={platformName(key)}
                action={c?.connected ? <Badge tone="positive">Подключено</Badge> : <Badge>Не подключено</Badge>}
              >
                <form action={saveConnection} className="flex flex-col gap-4">
                  <input type="hidden" name="brand_id" value={brand.id} />
                  <input type="hidden" name="platform" value={key} />
                  <input type="hidden" name="back" value={back} />
                  <Field label={hint.id}>
                    <Input name="business_id" maxLength={200} defaultValue={c?.business_id ?? ''} />
                  </Field>
                  <Field label={c?.has_key ? `${hint.key} · ключ сохранён` : hint.key}>
                    {hint.multiline ? (
                      <Textarea name="api_key" autoComplete="off" placeholder={c?.has_key ? '(оставьте пустым, чтобы не менять)' : ''} />
                    ) : (
                      <Input name="api_key" type="password" autoComplete="off" placeholder={c?.has_key ? '••••••••  (оставьте пустым, чтобы не менять)' : ''} />
                    )}
                  </Field>
                  {hint.note && <p className="text-xs text-muted-foreground">{hint.note}</p>}
                  <div className="flex flex-wrap items-center gap-3">
                    <SubmitButton variant="secondary">Сохранить</SubmitButton>
                    {c?.has_key ? (
                      <label className="flex items-center gap-2 text-xs text-muted-foreground">
                        <input type="checkbox" name="clear_key" value="1" /> удалить сохранённый ключ
                      </label>
                    ) : null}
                    {hint.docs && (
                      <a href={hint.docs} target="_blank" rel="noopener noreferrer" className="ml-auto text-xs text-muted-foreground hover:text-foreground">
                        Документация API →
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Последняя синхронизация: {c?.last_sync ? c.last_sync.slice(0, 16).replace('T', ' ') : 'ещё не было'}
                  </p>
                </form>
              </Card>
            )
          })}
        </div>
      </PageBody>
    </>
  )
}
