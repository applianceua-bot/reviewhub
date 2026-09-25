import type { Overview } from '@/lib/data/overview'
import { addDays, weekStart } from '@/lib/dash/dates'

/**
 * FICTIONAL dashboard data for the landing page preview. Built in code, not
 * from the database, so the landing never exposes a real client's numbers.
 */
export function demoOverview(): Overview {
  const thisWeek = weekStart()
  const ratings = [4.07, 4.09, 4.12, 4.11, 4.15, 4.18, 4.2, 4.21, 4.24, 4.27, 4.29, 4.32]
  const newReviews = [31, 28, 35, 33, 30, 38, 36, 34, 41, 39, 37, 44]
  const day = (weeksBack: number, dayOffset = 0) => addDays(addDays(thisWeek, -7 * weeksBack), dayOffset)

  return {
    rating: 4.32,
    ratingDelta: 0.11,
    targetRating: 4.5,
    newReviews: 164,
    newReviewsPrev: 139,
    removal: { total: 18, removed: 13, pending: 5 },
    mentionsToAnswer: 1,
    replyRate: 0.86,
    sentiment: { positive: 118, neutral: 21, negative: 17 },
    platforms: [
      { platform: 'trustpilot', rating: 4.3, reviewCount: 1423, ratingDelta: 0.1, newReviews: 71 },
      { platform: 'gmb', rating: 4.4, reviewCount: 781, ratingDelta: 0.1, newReviews: 43 },
      { platform: 'reviewsio', rating: 4.5, reviewCount: 407, ratingDelta: 0, newReviews: 29 },
      { platform: 'smartcustomer', rating: 4.1, reviewCount: 261, ratingDelta: 0.2, newReviews: 21 },
    ],
    trend: ratings.map((rating, i) => ({ week: day(11 - i), rating, newReviews: newReviews[i] })),
    activity: [
      { date: day(0, 2), kind: 'review', title: 'Новый отзыв · 5★', detail: 'Trustpilot · Anna K.', tone: 'positive' },
      { date: day(0, 1), kind: 'removal', title: 'Площадка удалила фейковый отзыв', detail: 'Reviews.io · реклама стороннего ресурса', tone: 'positive' },
      { date: day(1, 4), kind: 'task', title: 'Задача выполнена', detail: 'Ответы на отзывы за неделю', tone: 'brand' },
      { date: day(1, 3), kind: 'review', title: 'Подозрительный отзыв', detail: 'SmartCustomer · добавлен в проверку на удаление', tone: 'negative' },
      { date: day(1, 1), kind: 'review', title: 'Новый отзыв · 4★', detail: 'Google · Mark T.', tone: 'positive' },
      { date: day(2, 2), kind: 'task', title: 'Задача выполнена', detail: 'Запущены приглашения после покупки', tone: 'brand' },
    ],
  }
}
